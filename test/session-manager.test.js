/**
 * Unit tests for src/utils/sessionManager.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  HOT_SESSION_COUNT,
  buildSessionIndex,
  splitHotCold,
  mergeSessionIndices,
  applyInPlaceLastMsgReplace,
} from '../src/utils/sessionManager.js';

// ─── Test helpers ─────────────────────────────────────────────────��───────────

function makeEntry(sessionId, ts, opts = {}) {
  return {
    _sessionId: sessionId,
    timestamp: ts,
    url: opts.url || 'https://api.anthropic.com/v1/messages',
    ...opts,
  };
}

function makeSession(msgCount, opts = {}) {
  const messages = [];
  for (let i = 0; i < msgCount; i++) {
    const role = i % 2 === 0 ? 'user' : 'assistant';
    const content = opts.userText && role === 'user' && i === 0
      ? opts.userText
      : `msg-${i}`;
    messages.push({ role, content });
  }
  return {
    userId: opts.userId || 'user-1',
    messages,
    response: { status: 200, body: {} },
    entryTimestamp: opts.entryTimestamp || null,
  };
}

// ─── HOT_SESSION_COUNT ───────────────────────────────────────────────────────

describe('HOT_SESSION_COUNT', () => {
  it('should be 8', () => {
    assert.equal(HOT_SESSION_COUNT, 8);
  });
});

// ─── buildSessionIndex ───────────────────────────────────────────────────────

describe('buildSessionIndex', () => {
  it('should build index from entries and sessions', () => {
    const sid0 = '2025-01-01T00:00:00Z';
    const sid1 = '2025-01-01T01:00:00Z';
    const entries = [
      makeEntry(sid0, '2025-01-01T00:00:00Z'),
      makeEntry(sid0, '2025-01-01T00:01:00Z'),
      makeEntry(sid1, '2025-01-01T01:00:00Z'),
      makeEntry(sid1, '2025-01-01T01:05:00Z'),
      makeEntry(sid1, '2025-01-01T01:10:00Z'),
    ];
    const sessions = [
      makeSession(4, { userId: 'alice', userText: 'Hello world', entryTimestamp: sid0 }),
      makeSession(6, { userId: 'bob', userText: 'Second session question', entryTimestamp: sid1 }),
    ];

    const index = buildSessionIndex(entries, sessions);

    assert.equal(index.length, 2);

    // Session 0
    assert.equal(index[0].sessionId, sid0);
    assert.equal(index[0].firstTs, '2025-01-01T00:00:00Z');
    assert.equal(index[0].lastTs, '2025-01-01T00:01:00Z');
    assert.equal(index[0].entryCount, 2);
    assert.equal(index[0].msgCount, 4);
    assert.equal(index[0].preview, 'Hello world');
    assert.equal(index[0].userId, 'alice');

    // Session 1
    assert.equal(index[1].sessionId, sid1);
    assert.equal(index[1].firstTs, '2025-01-01T01:00:00Z');
    assert.equal(index[1].lastTs, '2025-01-01T01:10:00Z');
    assert.equal(index[1].entryCount, 3);
    assert.equal(index[1].msgCount, 6);
    assert.equal(index[1].preview, 'Second session question');
    assert.equal(index[1].userId, 'bob');
  });

  it('should handle empty entries', () => {
    const index = buildSessionIndex([], []);
    assert.equal(index.length, 0);
  });

  it('should extract preview from array content blocks', () => {
    const sid = '2025-01-01T00:00:00Z';
    const entries = [makeEntry(sid, '2025-01-01T00:00:00Z')];
    const sessions = [{
      userId: 'u1',
      messages: [
        { role: 'user', content: [{ type: 'text', text: 'Array content preview' }] },
        { role: 'assistant', content: 'response' },
      ],
      response: {},
      entryTimestamp: sid,
    }];

    const index = buildSessionIndex(entries, sessions);
    assert.equal(index[0].preview, 'Array content preview');
  });

  it('should truncate preview to 80 characters', () => {
    const longText = 'A'.repeat(120);
    const sid = '2025-01-01T00:00:00Z';
    const entries = [makeEntry(sid, '2025-01-01T00:00:00Z')];
    const sessions = [makeSession(2, { userText: longText, entryTimestamp: sid })];

    const index = buildSessionIndex(entries, sessions);
    assert.equal(index[0].preview.length, 80);
  });

  it('should skip entries with null _sessionId', () => {
    const sid0 = '2025-01-01T00:00:00Z';
    const sid1 = '2025-01-01T01:00:00Z';
    const entries = [
      makeEntry(sid0, '2025-01-01T00:00:00Z'),
      { timestamp: '2025-01-01T00:30:00Z', url: 'x', _sessionId: undefined },
      makeEntry(sid1, '2025-01-01T01:00:00Z'),
    ];
    const sessions = [
      makeSession(2, { entryTimestamp: sid0 }),
      makeSession(2, { entryTimestamp: sid1 }),
    ];

    const index = buildSessionIndex(entries, sessions);
    assert.equal(index[0].entryCount, 1);
    assert.equal(index[1].entryCount, 1);
  });

  it('should handle sessions without matching entry groups', () => {
    const sid0 = '2025-01-01T00:00:00Z';
    const sid1 = '2025-01-01T01:00:00Z';
    const entries = [makeEntry(sid0, '2025-01-01T00:00:00Z')];
    const sessions = [
      makeSession(2, { entryTimestamp: sid0 }),
      makeSession(3, { entryTimestamp: sid1 }),
    ];

    const index = buildSessionIndex(entries, sessions);
    assert.equal(index.length, 2);
    assert.equal(index[0].entryCount, 1);
    assert.equal(index[1].entryCount, 0); // no entries for session 1
    assert.equal(index[1].msgCount, 3);
  });

  it('should use entryTimestamp as fallback for lastTs', () => {
    const sid = '2025-06-01T00:00:00Z';
    const entries = [{ _sessionId: sid, url: 'x' }]; // no timestamp
    const sessions = [makeSession(2, { entryTimestamp: sid })];

    const index = buildSessionIndex(entries, sessions);
    // firstTs/lastTs from entries are null, lastTs falls back to entryTimestamp
    assert.equal(index[0].lastTs, '2025-06-01T00:00:00Z');
  });
});

// ─── splitHotCold ────────────────────────────────────────────────────────────

describe('splitHotCold', () => {
  function makeScenario(sessionCount) {
    const entries = [];
    const sessions = [];
    const sessionIndex = [];
    for (let s = 0; s < sessionCount; s++) {
      const ts = `2025-01-${String(s + 1).padStart(2, '0')}T00:00:00Z`;
      entries.push(makeEntry(ts, ts));
      entries.push(makeEntry(ts, ts));
      sessions.push(makeSession(4, { userId: `user-${s}`, userText: `Session ${s}`, entryTimestamp: ts }));
      sessionIndex.push({
        sessionId: ts,
        firstTs: ts,
        lastTs: ts,
        entryCount: 2,
        msgCount: 4,
        preview: `Session ${s}`,
        userId: `user-${s}`,
      });
    }
    return { entries, sessions, sessionIndex };
  }

  it('should return all entries as hot when sessions <= hotCount', () => {
    const { entries, sessions, sessionIndex } = makeScenario(5);
    const result = splitHotCold(entries, sessions, sessionIndex, 8);

    assert.equal(result.hotEntries, entries); // same reference
    assert.equal(result.allSessions, sessions);
    assert.equal(result.coldGroups.size, 0);
  });

  it('should split hot and cold when sessions > hotCount', () => {
    const { entries, sessions, sessionIndex } = makeScenario(12);
    const result = splitHotCold(entries, sessions, sessionIndex, 8);

    // 12 sessions, hot = last 8 (idx 4-11), cold = first 4 (idx 0-3)
    assert.equal(result.hotEntries.length, 16); // 8 sessions * 2 entries each
    assert.equal(result.coldGroups.size, 4);
    assert.equal(result.allSessions.length, 12);

    // Verify cold sessions are placeholders
    for (let i = 0; i < 4; i++) {
      assert.equal(result.allSessions[i]._cold, true);
      assert.equal(result.allSessions[i].messages, null);
      assert.equal(result.allSessions[i].response, null);
      assert.equal(result.allSessions[i].sessionId, sessionIndex[i].sessionId);
      assert.equal(result.allSessions[i].preview, `Session ${i}`);
      assert.equal(result.allSessions[i].userId, `user-${i}`);
    }

    // Verify hot sessions are unchanged
    for (let i = 4; i < 12; i++) {
      assert.equal(result.allSessions[i]._cold, undefined);
      assert.ok(Array.isArray(result.allSessions[i].messages));
    }

    // Verify cold groups contain correct entries
    for (let i = 0; i < 4; i++) {
      const sid = sessionIndex[i].sessionId;
      const group = result.coldGroups.get(sid);
      assert.ok(group);
      assert.equal(group.length, 2);
      assert.equal(group[0]._sessionId, sid);
    }

    // Verify hot entries all have sessionId in hot range
    const hotSids = new Set(sessionIndex.slice(4).map(s => s.sessionId));
    for (const e of result.hotEntries) {
      assert.ok(hotSids.has(e._sessionId));
    }
  });

  it('should handle exact hotCount match', () => {
    const { entries, sessions, sessionIndex } = makeScenario(8);
    const result = splitHotCold(entries, sessions, sessionIndex, 8);

    assert.equal(result.hotEntries, entries);
    assert.equal(result.coldGroups.size, 0);
  });

  it('should handle hotCount of 1', () => {
    const { entries, sessions, sessionIndex } = makeScenario(3);
    const result = splitHotCold(entries, sessions, sessionIndex, 1);

    // Only the last session is hot
    assert.equal(result.hotEntries.length, 2);
    assert.equal(result.coldGroups.size, 2);
    assert.equal(result.allSessions[0]._cold, true);
    assert.equal(result.allSessions[1]._cold, true);
    assert.equal(result.allSessions[2]._cold, undefined);
  });

  it('should pin sessions to prevent eviction', () => {
    const { entries, sessions, sessionIndex } = makeScenario(12);
    // Pin session 0 (cold by default) — it should stay hot
    const pinnedId = sessionIndex[0].sessionId;
    const result = splitHotCold(entries, sessions, sessionIndex, 8, new Set([pinnedId]));

    // Session 0 is pinned, so it should be hot (not cold)
    assert.equal(result.allSessions[0]._cold, undefined);
    assert.ok(Array.isArray(result.allSessions[0].messages));

    // Pinned session's entries should be in hotEntries
    const pinnedEntries = result.hotEntries.filter(e => e._sessionId === pinnedId);
    assert.equal(pinnedEntries.length, 2);

    // One additional session should become cold to make room for the pinned one
    // Total cold should be 4 (12 - 8), with 1 pinned, means 4 cold sessions
    assert.equal(result.coldGroups.size, 4);
    assert.ok(!result.coldGroups.has(pinnedId));
  });
});

// ─── mergeSessionIndices ─────────────────────────────────────────────────────

describe('mergeSessionIndices', () => {
  function idx(sessionId, preview) {
    return { sessionId, preview, firstTs: null, lastTs: null, entryCount: 0, msgCount: 0, userId: null };
  }

  it('should return newIndex when oldIndex is empty', () => {
    const result = mergeSessionIndices([], [idx('ts-a', 'a'), idx('ts-b', 'b')]);
    assert.equal(result.length, 2);
    assert.equal(result[0].preview, 'a');
  });

  it('should return oldIndex when newIndex is empty', () => {
    const result = mergeSessionIndices([idx('ts-a', 'a')], []);
    assert.equal(result.length, 1);
    assert.equal(result[0].preview, 'a');
  });

  it('should return newIndex when oldIndex is null', () => {
    const result = mergeSessionIndices(null, [idx('ts-a', 'a')]);
    assert.equal(result.length, 1);
  });

  it('should return empty array when both are null', () => {
    const result = mergeSessionIndices(null, null);
    assert.equal(result.length, 0);
  });

  it('should merge non-overlapping indices', () => {
    const old = [idx('2025-01-01T00:00:00Z', 'old-0'), idx('2025-01-01T01:00:00Z', 'old-1')];
    const nw = [idx('2025-01-01T02:00:00Z', 'new-2'), idx('2025-01-01T03:00:00Z', 'new-3')];
    const result = mergeSessionIndices(old, nw);

    assert.equal(result.length, 4);
    assert.equal(result[0].preview, 'old-0');
    assert.equal(result[1].preview, 'old-1');
    assert.equal(result[2].preview, 'new-2');
    assert.equal(result[3].preview, 'new-3');
  });

  it('should overwrite overlapping indices with new values', () => {
    const old = [idx('ts-0', 'old-0'), idx('ts-1', 'old-1'), idx('ts-2', 'old-2')];
    const nw = [idx('ts-1', 'new-1'), idx('ts-2', 'new-2'), idx('ts-3', 'new-3')];
    const result = mergeSessionIndices(old, nw);

    assert.equal(result.length, 4);
    assert.equal(result[0].preview, 'old-0');  // kept from old
    assert.equal(result[1].preview, 'new-1');  // overwritten by new
    assert.equal(result[2].preview, 'new-2');  // overwritten by new
    assert.equal(result[3].preview, 'new-3');  // from new
  });

  it('should sort result by sessionId', () => {
    const old = [idx('ts-c', 'old-c')];
    const nw = [idx('ts-a', 'new-a'), idx('ts-b', 'new-b')];
    const result = mergeSessionIndices(old, nw);

    assert.equal(result.length, 3);
    assert.equal(result[0].sessionId, 'ts-a');
    assert.equal(result[1].sessionId, 'ts-b');
    assert.equal(result[2].sessionId, 'ts-c');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyInPlaceLastMsgReplace — 信号驱动短路（消费服务端 _inPlaceReplaceDetected）
// 防 SUGGESTION MODE → 用户真实输入替换末位时 sessionMerge prefix-overlap 翻倍
// （实证 cc-viewer 自身复现：jsonl 中 _inPlaceReplaceDetected:true 与 BUG 1:1 对应）
// ─────────────────────────────────────────────────────────────────────────────

describe('applyInPlaceLastMsgReplace', () => {
  function makeMsg(role, text) {
    return { role, content: [{ type: 'text', text }], _timestamp: '2026-05-09T10:00:00Z' };
  }
  function makeSessionLocal(messages, userId = 'u1') {
    return { userId, messages, response: { status: 200, body: {} }, entryTimestamp: '2026-05-09T10:00:00Z' };
  }

  it('命中信号 → in-place 替换末位（前 N-1 引用稳定，长度不翻倍）', () => {
    const m0 = makeMsg('user', 'hi');
    const m1 = makeMsg('assistant', 'hello');
    const m2_old = makeMsg('user', '[SUGGESTION MODE: ...]');
    const session = makeSessionLocal([m0, m1, m2_old]);
    const prevSessions = [session];

    const m2_new = makeMsg('user', '继续关闭 @hunter-D');
    const entry = {
      _isCheckpoint: true,
      _inPlaceReplaceDetected: true,
      timestamp: '2026-05-09T11:10:03Z',
      response: { status: 200, body: { content: [] } },
      body: { messages: [m0, m1, m2_new] },  // length 3，跟 prev 一致
    };

    // 前置 invariant assert（防 fixture 漂移）：触发短路要求两边长度完全一致
    assert.equal(entry.body.messages.length, session.messages.length, 'fixture invariant: entry/session 长度必须相等');

    const result = applyInPlaceLastMsgReplace(prevSessions, entry, '2026-05-09T11:10:03Z', false);

    assert.equal(result.applied, true, '应该命中短路');
    assert.equal(result.sessions.length, 1, 'sessions 数组长度不变');
    const newLast = result.sessions[0];
    assert.equal(newLast.messages.length, 3, '末位 in-place 替换后长度仍 = 3（不翻倍）');
    assert.strictEqual(newLast.messages[0], m0, '前 N-1 条 message[0] 引用复用');
    assert.strictEqual(newLast.messages[1], m1, '前 N-1 条 message[1] 引用复用');
    assert.strictEqual(newLast.messages[2], m2_new, '末位用 entry.body.messages[N-1] 新引用');
    assert.notStrictEqual(newLast, session, 'lastSession 引用变化（让 ChatView _sessionItemCache 失效触发重渲染）');
  });

  it('未命中信号（无 _inPlaceReplaceDetected）→ applied=false 让 fallback 到 mergeMainAgentSessions', () => {
    const m0 = makeMsg('user', 'hi');
    const m1 = makeMsg('assistant', 'hello');
    const session = makeSessionLocal([m0, m1]);
    const entry = {
      _isCheckpoint: true,
      // _inPlaceReplaceDetected: undefined ← 故意不设
      timestamp: '2026-05-09T11:10:03Z',
      body: { messages: [m0, m1] },
    };

    const result = applyInPlaceLastMsgReplace([session], entry, '2026-05-09T11:10:03Z', false);
    assert.equal(result.applied, false, '无信号字段时不应短路');
  });

  it('isNewSession=true → applied=false（不破坏新 session 起点语义）', () => {
    const m0 = makeMsg('user', 'fresh');
    const session = makeSessionLocal([m0]);
    const entry = {
      _isCheckpoint: true,
      _inPlaceReplaceDetected: true,
      timestamp: '2026-05-09T11:10:03Z',
      body: { messages: [m0] },
    };
    const result = applyInPlaceLastMsgReplace([session], entry, '2026-05-09T11:10:03Z', /*isNewSession*/ true);
    assert.equal(result.applied, false, 'isNewSession=true 时不应短路（让 mergeMainAgentSessions 处理新 session 起点）');
  });

  it('messages.length 不一致 → applied=false（防误吃增量 push 场景）', () => {
    const m0 = makeMsg('user', 'hi');
    const session = makeSessionLocal([m0]);
    const entry = {
      _isCheckpoint: true,
      _inPlaceReplaceDetected: true,
      timestamp: '2026-05-09T11:10:03Z',
      body: { messages: [m0, makeMsg('assistant', 'new')] },  // length 2 ≠ session.messages.length 1
    };
    const result = applyInPlaceLastMsgReplace([session], entry, '2026-05-09T11:10:03Z', false);
    assert.equal(result.applied, false, '长度不一致时不应短路（普通 push 走 mergeMainAgentSessions 即可）');
  });

  it('空 prevSessions → applied=false（首条 entry 走 mergeMainAgentSessions 创建初始 session）', () => {
    const m0 = makeMsg('user', 'hi');
    const m1 = makeMsg('assistant', 'a');
    const entry = {
      _isCheckpoint: true,
      _inPlaceReplaceDetected: true,
      timestamp: '2026-05-09T11:10:03Z',
      response: { status: 200, body: {} },
      body: { messages: [m0, m1] },
    };
    const result = applyInPlaceLastMsgReplace([], entry, '2026-05-09T11:10:03Z', false);
    assert.equal(result.applied, false);
  });

  // 新增防御性 case（reviewer 采纳建议）：
  it('messages.length > currentLen → applied=false（防意外消费信号导致丢消息）', () => {
    const m0 = makeMsg('user', 'hi');
    const session = makeSessionLocal([m0]);
    const m1 = makeMsg('assistant', 'a');
    const m2 = makeMsg('user', 'q');
    const entry = {
      _isCheckpoint: true,
      _inPlaceReplaceDetected: true,
      timestamp: '2026-05-09T11:10:03Z',
      response: { status: 200, body: {} },
      body: { messages: [m0, m1, m2] },  // length 3 > session.messages.length 1
    };
    const result = applyInPlaceLastMsgReplace([session], entry, '2026-05-09T11:10:03Z', false);
    assert.equal(result.applied, false, '长度不一致（>）应 fallback 让 mergeMainAgentSessions 走增量 push');
  });

  it('entry.response 缺失（inProgress 异常）→ applied=false 防 ChatView Last Response 污染', () => {
    const m0 = makeMsg('user', 'hi');
    const m1 = makeMsg('assistant', 'a');
    const m2_old = makeMsg('user', 'old');
    const session = makeSessionLocal([m0, m1, m2_old]);
    const m2_new = makeMsg('user', 'new');
    const entry = {
      _isCheckpoint: true,
      _inPlaceReplaceDetected: true,
      timestamp: '2026-05-09T11:10:03Z',
      // response: undefined ← 故意省略
      body: { messages: [m0, m1, m2_new] },
    };
    const result = applyInPlaceLastMsgReplace([session], entry, '2026-05-09T11:10:03Z', false);
    assert.equal(result.applied, false, '无 response 时不应短路（防 newLastSession.response=undefined 污染下游）');
  });

  it('messages.length < 2 → applied=false（单消息退化为完全替换不安全，让原路径处理）', () => {
    const m0_old = makeMsg('user', 'old');
    const session = makeSessionLocal([m0_old]);
    const m0_new = makeMsg('user', 'new');
    const entry = {
      _isCheckpoint: true,
      _inPlaceReplaceDetected: true,
      timestamp: '2026-05-09T11:10:03Z',
      response: { status: 200, body: {} },
      body: { messages: [m0_new] },  // length 1
    };
    const result = applyInPlaceLastMsgReplace([session], entry, '2026-05-09T11:10:03Z', false);
    assert.equal(result.applied, false, 'N=1 时不应走 in-place 短路（前 N-1 退化为空 = 完全替换，不符合 helper 语义）');
  });

  // 新增（review R3 任务 2 缺口）：_inPlaceReplaceDetected:true 但 _isCheckpoint 缺失/false
  it('_inPlaceReplaceDetected=true 但 _isCheckpoint 缺失 → applied=false（双信号必须齐发）', () => {
    const m0 = makeMsg('user', 'hi');
    const m1 = makeMsg('assistant', 'old');
    const session = makeSessionLocal([m0, m1]);
    const m1_new = makeMsg('assistant', 'new');
    const entry = {
      _inPlaceReplaceDetected: true,
      // _isCheckpoint: undefined ← 故意省略，模拟服务端协议变更或漏写
      timestamp: '2026-05-09T11:10:03Z',
      response: { status: 200, body: {} },
      body: { messages: [m0, m1_new] },
    };
    const result = applyInPlaceLastMsgReplace([session], entry, '2026-05-09T11:10:03Z', false);
    assert.equal(result.applied, false, '双信号未齐发不应短路（防服务端协议变更下 in-place 误触发污染下游）');
  });

  // 新增（D 块）：fallback 计数器机制 — 信号到达但守卫拒绝时计数应增加
  it('fallback 计数器：信号到达但守卫拒绝时累加分类计数', () => {
    // 重置计数防本次 case 之前累积干扰
    applyInPlaceLastMsgReplace.fallbackCount = Object.create(null);
    applyInPlaceLastMsgReplace.appliedCount = 0;

    const m0 = makeMsg('user', 'hi');
    const session = makeSessionLocal([m0]);

    // 触发 length-mismatch 路径
    const entry1 = {
      _isCheckpoint: true,
      _inPlaceReplaceDetected: true,
      timestamp: '2026-05-09T11:10:03Z',
      response: { status: 200, body: {} },
      body: { messages: [m0, makeMsg('assistant', 'a'), makeMsg('user', 'b')] },
    };
    applyInPlaceLastMsgReplace([session], entry1, '2026-05-09T11:10:03Z', false);
    assert.equal(applyInPlaceLastMsgReplace.fallbackCount['length-mismatch'], 1, 'length-mismatch 应计数');

    // 触发 response-missing 路径
    const session2 = makeSessionLocal([m0, makeMsg('assistant', 'a'), makeMsg('user', 'b')]);
    const entry2 = {
      _isCheckpoint: true,
      _inPlaceReplaceDetected: true,
      timestamp: '2026-05-09T11:10:03Z',
      // response 缺失
      body: { messages: [m0, makeMsg('assistant', 'a'), makeMsg('user', 'c')] },
    };
    applyInPlaceLastMsgReplace([session2], entry2, '2026-05-09T11:10:03Z', false);
    assert.equal(applyInPlaceLastMsgReplace.fallbackCount['response-missing'], 1, 'response-missing 应计数');

    // 触发 messages-too-short 路径
    const entry3 = {
      _isCheckpoint: true,
      _inPlaceReplaceDetected: true,
      timestamp: '2026-05-09T11:10:03Z',
      response: { status: 200, body: {} },
      body: { messages: [m0] },
    };
    applyInPlaceLastMsgReplace([session], entry3, '2026-05-09T11:10:03Z', false);
    assert.equal(applyInPlaceLastMsgReplace.fallbackCount['messages-too-short'], 1, 'messages-too-short 应计数');

    // 无信号路径不计数（防 SSE 高频流量淹没）
    const entry4 = {
      timestamp: '2026-05-09T11:10:03Z',
      body: { messages: [m0] },
    };
    applyInPlaceLastMsgReplace([session], entry4, '2026-05-09T11:10:03Z', false);
    assert.equal(applyInPlaceLastMsgReplace.fallbackCount['no-signal'], undefined, '无信号路径不应计入 fallbackCount');

    // applied 路径累加 appliedCount
    const session3 = makeSessionLocal([m0, makeMsg('assistant', 'old')]);
    const entry5 = {
      _isCheckpoint: true,
      _inPlaceReplaceDetected: true,
      timestamp: '2026-05-09T11:10:03Z',
      response: { status: 200, body: {} },
      body: { messages: [m0, makeMsg('assistant', 'new')] },
    };
    const result = applyInPlaceLastMsgReplace([session3], entry5, '2026-05-09T11:10:03Z', false);
    assert.equal(result.applied, true);
    assert.equal(applyInPlaceLastMsgReplace.appliedCount, 1, 'applied 路径应累加 appliedCount');
  });
});
