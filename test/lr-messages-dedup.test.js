/**
 * Last Response vs messages-side 双卡去重行为
 *
 * 用户报告 multi-agent-room 场景下：messages 中已含一份 pending AskUserQuestion (toolId=A，正文空白)，
 * 同时 session.response.body.content 又含另一份 pending AskUserQuestion (toolId=B，正文完整)，
 * 两侧都被标记 isInteractive=true，双 portal 进 ApprovalModal askSlot，导致 Modal 显示空白卡。
 *
 * 修复策略：当 LR 即将持有交互权（lrWillOwnAsk / lrWillOwnPlan）时，
 * 把 messages-side 的 lastPendingAskId / lastPendingPlanId 清空（cloneElement 同手法）。
 * 同时补全 lrContent 过滤的 ExitPlanMode 去重（之前只有 AskUserQuestion 一向去重）。
 *
 * 内联简化版 ChatView mainAgentSessions.forEach 内的预判 + 剥夺核心逻辑，避免引入 React 渲染依赖。
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── 内联：ChatView 预判 lrWillOwnAsk / lrWillOwnPlan ──────────────────────

function predictLrOwnership({ messages, respContent, mergedAskAnswerMap = {}, localAskAnswers = {}, planApprovalMap = {}, cliMode = true, isLastSession = true }) {
  const out = { lrWillOwnAsk: false, lrWillOwnPlan: false, lrHistoryAskIds: null, lrHistoryPlanIds: null };
  if (!isLastSession || !Array.isArray(respContent)) return out;
  const hasInteractive = respContent.some(b =>
    b.type === 'tool_use' && (b.name === 'AskUserQuestion' || b.name === 'ExitPlanMode')
  );
  const hasSuggestion = respContent.some(b =>
    b.type === 'text' && typeof b.text === 'string' && b.text.includes('[SUGGESTION MODE:')
  );
  const shouldHide = hasSuggestion && !hasInteractive;
  if (shouldHide || !hasInteractive) return out;

  out.lrHistoryAskIds = new Set();
  out.lrHistoryPlanIds = new Set();
  for (const m of messages) {
    if (m.role === 'assistant' && Array.isArray(m.content)) {
      for (const b of m.content) {
        if (b.type === 'tool_use' && b.name === 'AskUserQuestion') out.lrHistoryAskIds.add(b.id);
        if (b.type === 'tool_use' && b.name === 'ExitPlanMode') out.lrHistoryPlanIds.add(b.id);
      }
    }
  }
  for (const b of respContent) {
    if (b.type !== 'tool_use') continue;
    if (b.name === 'AskUserQuestion') {
      if (out.lrHistoryAskIds.has(b.id)) continue;
      const merged = mergedAskAnswerMap[b.id];
      if (merged && Object.keys(merged).length > 0) continue;
      const la = localAskAnswers[b.id];
      if (!la || Object.keys(la).length === 0) out.lrWillOwnAsk = true;
    }
    if (b.name === 'ExitPlanMode') {
      if (!cliMode) continue;
      if (out.lrHistoryPlanIds.has(b.id)) continue;
      const approval = planApprovalMap[b.id];
      if (!approval || approval.status === 'pending') out.lrWillOwnPlan = true;
    }
  }
  return out;
}

// 内联：lrContent 过滤
function filterLrContent({ respContent, lrHistoryAskIds, lrHistoryPlanIds }) {
  const _hAsk = lrHistoryAskIds || new Set();
  return respContent.filter(b =>
    b.type !== 'tool_use'
    || (b.name === 'AskUserQuestion' && !_hAsk.has(b.id))
    || (b.name === 'ExitPlanMode' && !(lrHistoryPlanIds && lrHistoryPlanIds.has(b.id)))
  );
}

// ─── tests ────────────────────────────────────────────────────────────────

describe('LR / messages 双卡去重', () => {
  it('LR 有 unanswered AskUserQuestion，messages 也有不同 toolId 的 pending → LR 持权', () => {
    const messages = [
      { role: 'assistant', content: [
        { type: 'tool_use', id: 'ask_A', name: 'AskUserQuestion', input: { questions: [] } },
      ]},
    ];
    const respContent = [
      { type: 'tool_use', id: 'ask_B', name: 'AskUserQuestion', input: { questions: [{ question: 'q', options: [] }] } },
    ];
    const r = predictLrOwnership({ messages, respContent });
    assert.equal(r.lrWillOwnAsk, true);
    assert.equal(r.lrHistoryAskIds.has('ask_A'), true);
    assert.equal(r.lrHistoryAskIds.has('ask_B'), false);
  });

  it('LR 与 messages 同 toolId AskUserQuestion → LR 不持权（走 historyAskIds 去重）', () => {
    const messages = [
      { role: 'assistant', content: [
        { type: 'tool_use', id: 'ask_X', name: 'AskUserQuestion', input: { questions: [{ question: 'q', options: [] }] } },
      ]},
    ];
    const respContent = [
      { type: 'tool_use', id: 'ask_X', name: 'AskUserQuestion', input: { questions: [{ question: 'q', options: [] }] } },
    ];
    const r = predictLrOwnership({ messages, respContent });
    assert.equal(r.lrWillOwnAsk, false);
    // lrContent 也应过滤掉
    const filtered = filterLrContent({ respContent, lrHistoryAskIds: r.lrHistoryAskIds, lrHistoryPlanIds: r.lrHistoryPlanIds });
    assert.equal(filtered.length, 0);
  });

  it('LR AskUserQuestion 已应答（mergedAskAnswerMap 有答）→ LR 不持权', () => {
    const messages = [];
    const respContent = [
      { type: 'tool_use', id: 'ask_C', name: 'AskUserQuestion', input: { questions: [{ question: 'q', options: [] }] } },
    ];
    const r = predictLrOwnership({ messages, respContent, mergedAskAnswerMap: { ask_C: { q: 'A' } } });
    assert.equal(r.lrWillOwnAsk, false);
  });

  it('LR pending ExitPlanMode（不同 toolId） + cliMode=true → LR 持权', () => {
    const messages = [
      { role: 'assistant', content: [
        { type: 'tool_use', id: 'plan_A', name: 'ExitPlanMode', input: { plan: 'old' } },
      ]},
    ];
    const respContent = [
      { type: 'tool_use', id: 'plan_B', name: 'ExitPlanMode', input: { plan: 'new' } },
    ];
    const r = predictLrOwnership({ messages, respContent, cliMode: true });
    assert.equal(r.lrWillOwnPlan, true);
  });

  it('LR pending ExitPlanMode + cliMode=false → LR 不持权（剥夺 messages 反而双双不可交互）', () => {
    const messages = [];
    const respContent = [
      { type: 'tool_use', id: 'plan_X', name: 'ExitPlanMode', input: { plan: 'p' } },
    ];
    const r = predictLrOwnership({ messages, respContent, cliMode: false });
    assert.equal(r.lrWillOwnPlan, false);
  });

  it('LR 与 messages 同 toolId ExitPlanMode → lrContent 过滤掉（修复点）', () => {
    const messages = [
      { role: 'assistant', content: [
        { type: 'tool_use', id: 'plan_Y', name: 'ExitPlanMode', input: { plan: 'p' } },
      ]},
    ];
    const respContent = [
      { type: 'tool_use', id: 'plan_Y', name: 'ExitPlanMode', input: { plan: 'p' } },
    ];
    const r = predictLrOwnership({ messages, respContent, cliMode: true });
    const filtered = filterLrContent({ respContent, lrHistoryAskIds: r.lrHistoryAskIds, lrHistoryPlanIds: r.lrHistoryPlanIds });
    assert.equal(filtered.length, 0);
  });

  it('LR 既无 ask 也无 plan → 不剥夺 messages 端', () => {
    const messages = [];
    const respContent = [
      { type: 'text', text: 'hello' },
    ];
    const r = predictLrOwnership({ messages, respContent });
    assert.equal(r.lrWillOwnAsk, false);
    assert.equal(r.lrWillOwnPlan, false);
  });

  it('shouldHide（hasSuggestionMode 且无 interactive）→ LR 整体被隐藏，不剥夺', () => {
    const messages = [];
    const respContent = [
      { type: 'text', text: '[SUGGESTION MODE: alpha] hello' },
    ];
    const r = predictLrOwnership({ messages, respContent });
    assert.equal(r.lrWillOwnAsk, false);
    assert.equal(r.lrWillOwnPlan, false);
  });

  it('非最后 session（si != last）→ 跳过预判', () => {
    const messages = [];
    const respContent = [
      { type: 'tool_use', id: 'ask_Z', name: 'AskUserQuestion', input: { questions: [{ question: 'q', options: [] }] } },
    ];
    const r = predictLrOwnership({ messages, respContent, isLastSession: false });
    assert.equal(r.lrWillOwnAsk, false);
  });
});
