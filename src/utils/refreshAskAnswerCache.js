import React from 'react';

/**
 * 仅刷新持有 AskUserQuestion tool_use 的 assistant ChatMessage 的 askAnswerMap prop。
 * 其他 element 原样返回。引用全等时返回原数组（不做任何分配）。
 *
 * 对称于 refreshPlanApprovalOnCachedItems —— 修同一 _sessionItemCache 命中时旧 React Element
 * 持有过期 askAnswerMap 引用导致 AskUserQuestion 卡片用户答完后仍显示 pending 表单态的 bug。
 *
 * @param {Array} items - 缓存的 ChatMessage React element 数组
 * @param {object} prevMap - 上一轮存入 cache 时的 askAnswerMap 引用
 * @param {object} nextMap - 本轮派生的 askAnswerMap 引用（含 server ack + localAsk 乐观更新合并）
 * @returns {Array} 引用全等时为 items；否则为新数组（仅 AskUserQuestion 持有者被 cloneElement）
 */
export function refreshAskAnswerOnCachedItems(items, prevMap, nextMap) {
  if (prevMap === nextMap) return items;
  let dirty = false;
  const out = items.map(m => {
    if (!m || !m.props || m.props.role !== 'assistant' || !Array.isArray(m.props.content)) return m;
    const hasAsk = m.props.content.some(b => b.type === 'tool_use' && b.name === 'AskUserQuestion');
    if (!hasAsk) return m;
    dirty = true;
    return React.cloneElement(m, { askAnswerMap: nextMap });
  });
  return dirty ? out : items;
}
