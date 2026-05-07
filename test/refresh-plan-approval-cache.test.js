/**
 * Unit tests for src/utils/refreshPlanApprovalCache.js
 *
 * 验证 _sessionItemCache 命中路径下，含 ExitPlanMode tool_use 的旧 React Element 在
 * planApprovalMap 引用变化时被 cloneElement 刷新；其他 element 原样保留；引用全等时零分配。
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { refreshPlanApprovalOnCachedItems } from '../src/utils/refreshPlanApprovalCache.js';

// Test helpers — 构造最小 ChatMessage 风格的 React element
function mkAsstWithExitPlan(toolId, planMap) {
  return React.createElement('ChatMessage', {
    role: 'assistant',
    content: [{ type: 'tool_use', name: 'ExitPlanMode', id: toolId }],
    planApprovalMap: planMap,
  });
}
function mkAsstWithBash(toolId, planMap) {
  return React.createElement('ChatMessage', {
    role: 'assistant',
    content: [{ type: 'tool_use', name: 'Bash', id: toolId }],
    planApprovalMap: planMap,
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
    content: [{ type: 'tool_use', name: 'ExitPlanMode', id: 'tu_sub' }],
  });
}

describe('refreshPlanApprovalOnCachedItems', () => {
  it('returns same items reference when prevMap === nextMap (zero-alloc fast path)', () => {
    const map = { tu_a: { status: 'pending' } };
    const items = [mkAsstWithExitPlan('tu_a', map), mkUser('hi')];
    const out = refreshPlanApprovalOnCachedItems(items, map, map);
    assert.strictEqual(out, items, 'identical reference returned (no allocation)');
  });

  it('returns same items reference when no element holds an ExitPlanMode tool_use', () => {
    const prev = { tu_a: { status: 'pending' } };
    const next = { tu_a: { status: 'approved' } };
    const items = [mkUser('hi'), mkAsstWithBash('tu_b', prev), mkSubAgent()];
    const out = refreshPlanApprovalOnCachedItems(items, prev, next);
    assert.strictEqual(out, items, 'no ExitPlanMode owner → original array reused');
  });

  it('clones only the ExitPlanMode-owner assistant element when map ref changes', () => {
    const prev = {};
    const next = { tu_a: { status: 'approved' } };
    const userEl = mkUser('q?');
    const asstEl = mkAsstWithExitPlan('tu_a', prev);
    const bashEl = mkAsstWithBash('tu_b', prev);
    const items = [userEl, asstEl, bashEl];
    const out = refreshPlanApprovalOnCachedItems(items, prev, next);

    assert.notStrictEqual(out, items, 'new array allocated');
    assert.strictEqual(out[0], userEl, 'user element preserved by reference');
    assert.notStrictEqual(out[1], asstEl, 'ExitPlanMode owner cloned');
    assert.strictEqual(out[1].props.planApprovalMap, next, 'cloned element gets next map');
    assert.strictEqual(out[1].props.role, 'assistant', 'role preserved');
    assert.strictEqual(out[1].props.content, asstEl.props.content, 'content prop preserved');
    assert.strictEqual(out[2], bashEl, 'non-ExitPlanMode assistant preserved by reference');
  });

  it('does not patch sub-agent or user ChatMessage even if they nominally hold an ExitPlanMode block', () => {
    const prev = {};
    const next = { tu_sub: { status: 'approved' } };
    const items = [mkSubAgent(), mkUser('x')];
    const out = refreshPlanApprovalOnCachedItems(items, prev, next);
    assert.strictEqual(out, items, 'only role==="assistant" qualifies for patch');
  });

  it('patches multiple ExitPlanMode owners in one pass', () => {
    const prev = {};
    const next = { tu_a: { status: 'approved' }, tu_c: { status: 'rejected' } };
    const a = mkAsstWithExitPlan('tu_a', prev);
    const b = mkUser('mid');
    const c = mkAsstWithExitPlan('tu_c', prev);
    const items = [a, b, c];
    const out = refreshPlanApprovalOnCachedItems(items, prev, next);

    assert.notStrictEqual(out[0], a, 'first ExitPlanMode owner cloned');
    assert.strictEqual(out[1], b, 'middle user preserved');
    assert.notStrictEqual(out[2], c, 'second ExitPlanMode owner cloned');
    assert.strictEqual(out[0].props.planApprovalMap, next);
    assert.strictEqual(out[2].props.planApprovalMap, next);
  });

  it('handles empty items array', () => {
    const out = refreshPlanApprovalOnCachedItems([], {}, { tu: {} });
    assert.deepStrictEqual(out, []);
  });

  it('skips elements without props or content', () => {
    const prev = {};
    const next = { tu_a: { status: 'approved' } };
    const weirdEl = { type: 'div' }; // no props
    const asstEl = mkAsstWithExitPlan('tu_a', prev);
    const items = [weirdEl, asstEl];
    const out = refreshPlanApprovalOnCachedItems(items, prev, next);
    assert.strictEqual(out[0], weirdEl, 'malformed element returned as-is');
    assert.notStrictEqual(out[1], asstEl, 'real ExitPlanMode card cloned');
  });
});
