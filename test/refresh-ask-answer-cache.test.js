/**
 * Unit tests for src/utils/refreshAskAnswerCache.js
 *
 * 验证 _sessionItemCache 命中路径下，含 AskUserQuestion tool_use 的旧 React Element 在
 * askAnswerMap 引用变化时被 cloneElement 刷新；其他 element 原样保留；引用全等时零分配。
 * 与 refresh-plan-approval-cache.test.js 完全对称。
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { refreshAskAnswerOnCachedItems } from '../src/utils/refreshAskAnswerCache.js';

function mkAsstWithAsk(toolId, askMap) {
  return React.createElement('ChatMessage', {
    role: 'assistant',
    content: [{ type: 'tool_use', name: 'AskUserQuestion', id: toolId }],
    askAnswerMap: askMap,
  });
}
function mkAsstWithBash(toolId, askMap) {
  return React.createElement('ChatMessage', {
    role: 'assistant',
    content: [{ type: 'tool_use', name: 'Bash', id: toolId }],
    askAnswerMap: askMap,
  });
}
function mkUser(text) {
  return React.createElement('ChatMessage', {
    role: 'user',
    content: [{ type: 'text', text }],
  });
}
function mkSubAgent() {
  return React.createElement('ChatMessage', {
    role: 'sub-agent-chat',
    content: [{ type: 'tool_use', name: 'AskUserQuestion', id: 'tu_sub' }],
  });
}

describe('refreshAskAnswerOnCachedItems', () => {
  it('returns same items reference when prevMap === nextMap (zero-alloc fast path)', () => {
    const map = { tu_a: { Q1: 'A' } };
    const items = [mkAsstWithAsk('tu_a', map), mkUser('hi')];
    const out = refreshAskAnswerOnCachedItems(items, map, map);
    assert.strictEqual(out, items, 'identical reference returned (no allocation)');
  });

  it('returns same items reference when no element holds an AskUserQuestion tool_use', () => {
    const prev = { tu_a: {} };
    const next = { tu_a: { Q1: 'A' } };
    const items = [mkUser('hi'), mkAsstWithBash('tu_b', prev), mkSubAgent()];
    const out = refreshAskAnswerOnCachedItems(items, prev, next);
    assert.strictEqual(out, items, 'no AskUserQuestion owner → original array reused');
  });

  it('clones only the AskUserQuestion-owner assistant element when map ref changes', () => {
    const prev = {};
    const next = { tu_a: { Q1: 'A1' } };
    const userEl = mkUser('q?');
    const asstEl = mkAsstWithAsk('tu_a', prev);
    const bashEl = mkAsstWithBash('tu_b', prev);
    const items = [userEl, asstEl, bashEl];
    const out = refreshAskAnswerOnCachedItems(items, prev, next);

    assert.notStrictEqual(out, items, 'new array allocated');
    assert.strictEqual(out[0], userEl, 'user element preserved by reference');
    assert.notStrictEqual(out[1], asstEl, 'AskUserQuestion owner cloned');
    assert.strictEqual(out[1].props.askAnswerMap, next, 'cloned element gets next map');
    assert.strictEqual(out[1].props.role, 'assistant', 'role preserved');
    assert.strictEqual(out[1].props.content, asstEl.props.content, 'content prop preserved');
    assert.strictEqual(out[2], bashEl, 'non-AskUserQuestion assistant preserved by reference');
  });

  it('does not patch sub-agent or user ChatMessage even if they nominally hold an AskUserQuestion block', () => {
    const prev = {};
    const next = { tu_sub: { Q1: 'A' } };
    const items = [mkSubAgent(), mkUser('x')];
    const out = refreshAskAnswerOnCachedItems(items, prev, next);
    assert.strictEqual(out, items, 'only role==="assistant" qualifies for patch');
  });

  it('patches multiple AskUserQuestion owners in one pass', () => {
    const prev = {};
    const next = {
      tu_a: { Q1: 'A1' },
      tu_c: { __rejected__: true },
    };
    const a = mkAsstWithAsk('tu_a', prev);
    const b = mkUser('mid');
    const c = mkAsstWithAsk('tu_c', prev);
    const items = [a, b, c];
    const out = refreshAskAnswerOnCachedItems(items, prev, next);

    assert.notStrictEqual(out[0], a, 'first AskUserQuestion owner cloned');
    assert.strictEqual(out[1], b, 'middle user preserved');
    assert.notStrictEqual(out[2], c, 'second AskUserQuestion owner cloned');
    assert.strictEqual(out[0].props.askAnswerMap, next);
    assert.strictEqual(out[2].props.askAnswerMap, next);
  });

  it('handles empty items array', () => {
    const out = refreshAskAnswerOnCachedItems([], {}, { tu: {} });
    assert.deepStrictEqual(out, []);
  });

  it('skips elements without props or content', () => {
    const prev = {};
    const next = { tu_a: { Q1: 'A' } };
    const weirdEl = { type: 'div' }; // no props
    const asstEl = mkAsstWithAsk('tu_a', prev);
    const items = [weirdEl, asstEl];
    const out = refreshAskAnswerOnCachedItems(items, prev, next);
    assert.strictEqual(out[0], weirdEl, 'malformed element returned as-is');
    assert.notStrictEqual(out[1], asstEl, 'real AskUserQuestion card cloned');
  });
});
