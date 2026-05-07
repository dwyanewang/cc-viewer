import React from 'react';

/**
 * 仅刷新持有 ExitPlanMode tool_use 的 assistant ChatMessage 的 planApprovalMap prop。
 * 其他 element 原样返回。引用全等时返回原数组（不做任何分配）。
 *
 * 修复 ChatView _sessionItemCache 命中路径下旧 React Element 持有过期 planApprovalMap 引用导致
 * ExitPlanMode 卡片审批后不切「已批准」状态的 bug —— FULL HIT 路径直接返回 sc.items 时
 * React reconciler 看到完全相同的 element 引用就跳过 diff，ChatMessage SCU 根本不会被调用，
 * 元素创建时冻结的旧 planApprovalMap 永远不会被刷新。
 *
 * @param {Array} items - 缓存的 ChatMessage React element 数组
 * @param {object} prevMap - 上一轮存入 cache 时的 planApprovalMap 引用
 * @param {object} nextMap - 本轮派生的 planApprovalMap 引用
 * @returns {Array} 引用全等时为 items；否则为新数组（仅 ExitPlanMode 持有者被 cloneElement）
 */
export function refreshPlanApprovalOnCachedItems(items, prevMap, nextMap) {
  if (prevMap === nextMap) return items;
  let dirty = false;
  const out = items.map(m => {
    if (!m || !m.props || m.props.role !== 'assistant' || !Array.isArray(m.props.content)) return m;
    const hasExitPlan = m.props.content.some(b => b.type === 'tool_use' && b.name === 'ExitPlanMode');
    if (!hasExitPlan) return m;
    dirty = true;
    return React.cloneElement(m, { planApprovalMap: nextMap });
  });
  return dirty ? out : items;
}
