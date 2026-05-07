import { isPostClearCheckpoint } from './clearCheckpoint.js';

/**
 * 计算消息的轻量内容指纹，用于区分"同 entry 流式更新" vs "CLI 上下文重置后的新对话片段"。
 *
 * 选 tool_use.id / tool_result.tool_use_id 作主键（API 强保证唯一）；text/thinking
 * 取前 64 字符。不做 deep-equal —— 成本低、足以撑起 sessionMerge 的判定路径。
 *
 * 触发场景：Plan Mode CLI 在 ExitPlanMode 前后会用极短的 sliding window（每个 entry 只
 * 含 [latest assistant, latest tool_result] 两条）发送请求，不再传累积历史。这种"短窗口"
 * 与上一轮的 messages 既不重叠也不连续 —— 单凭长度 (newLen vs currentLen) 无法区分
 * 流式更新和新对话片段，必须看内容。
 */
function messageFingerprint(msg) {
  if (!msg || !msg.role) return '';
  const c = msg.content;
  if (typeof c === 'string') return `${msg.role}|s|${c.slice(0, 64)}`;
  if (!Array.isArray(c) || c.length === 0) return `${msg.role}|empty`;
  const b = c[0];
  if (b.type === 'tool_use') return `${msg.role}|tu|${b.id || b.name || ''}`;
  if (b.type === 'tool_result') return `${msg.role}|tr|${b.tool_use_id || ''}`;
  if (b.type === 'text') return `${msg.role}|t|${(b.text || '').slice(0, 64)}`;
  if (b.type === 'thinking') return `${msg.role}|th|${(b.thinking || '').slice(0, 64)}`;
  return `${msg.role}|${b.type || 'unknown'}`;
}

/**
 * 增量合并 mainAgent sessions。
 * - 同 session 更新：push 新消息（保持 messages 引用稳定）或 checkpoint 重建
 * - 新 session：追加新 session 对象（异 user 或 /clear checkpoint）
 * - Transient 过滤：极短消息跳过合并（仅批量加载场景）
 *
 * @param {Array} prevSessions - 当前 sessions 数组
 * @param {object} entry - 新的 mainAgent entry
 * @param {object} [options]
 * @param {boolean} [options.skipTransientFilter=false] - SSE 实时追加路径设为 true：
 *   实时流里每条 entry 都带完整 response，不会是"中间态"，transient 过滤会误伤真实的
 *   `/clear → hi` 短对话。仅在批量加载历史日志时保留该过滤（防中间态 entry 污染）。
 * @returns {Array} 更新后的 sessions 数组
 */
export function mergeMainAgentSessions(prevSessions, entry, options = {}) {
  const newMessages = entry.body.messages;
  const newResponse = entry.response;
  const userId = entry.body.metadata?.user_id || null;

  const entryTimestamp = entry.timestamp || null;

  if (prevSessions.length === 0) {
    return [{ userId, messages: newMessages, response: newResponse, entryTimestamp }];
  }

  const lastSession = prevSessions[prevSessions.length - 1];

  const prevMsgCount = lastSession.messages ? lastSession.messages.length : 0;
  const isNewConversation = prevMsgCount > 0 && newMessages.length < prevMsgCount * 0.5 && (prevMsgCount - newMessages.length) > 4;
  const sameUser = userId !== null && userId === lastSession.userId;

  // /clear 后的首个 checkpoint：始终是新会话起点。
  // 同 device 下 sameUser 永远 true，否则会被下面的 same-session 分支吞掉；
  // 也不能被 transient 过滤掉（即便 newMessages.length === 1）。
  if (isPostClearCheckpoint(entry, prevMsgCount)) {
    for (let i = 0; i < newMessages.length; i++) {
      if (!newMessages[i]._timestamp) newMessages[i]._timestamp = entryTimestamp;
    }
    return [...prevSessions, { userId, messages: newMessages, response: newResponse, entryTimestamp }];
  }

  if (!options.skipTransientFilter && isNewConversation && newMessages.length <= 4 && prevMsgCount > 4) {
    return prevSessions;
  }

  if (sameUser || (userId === lastSession.userId && !isNewConversation)) {
    const currentLen = prevMsgCount;
    const newLen = newMessages.length;

    if (newLen > currentLen) {
      // 增量追加：只 push 新增的消息，保持 messages 引用稳定（WeakMap 缓存命中）
      if (!lastSession.messages) lastSession.messages = [];
      for (let i = currentLen; i < newLen; i++) {
        if (!newMessages[i]._timestamp) newMessages[i]._timestamp = entryTimestamp;
        lastSession.messages.push(newMessages[i]);
      }
    } else if (newLen < currentLen) {
      // newLen<currentLen 触发场景区分：
      //  (a) Plan Mode / CLI 上下文压缩窗口：newMessages 是 lastSession.messages 末尾连续
      //      子集（CLI 把累积历史压成只发末尾几条作 context），保留累积历史不动；
      //  (b) 真正的 checkpoint（/compact summary）：内容不匹配，重建（保持原行为）。
      //      真正的 /clear 已在 line 37 isPostClearCheckpoint 分支提前命中走新 session 分支。
      const newFps = newMessages.map(messageFingerprint);
      const tail = lastSession.messages.slice(-newLen);
      const tailFps = tail.map(messageFingerprint);
      let isCompressionWindow = newLen > 0;
      for (let i = 0; i < newLen; i++) {
        if (newFps[i] !== tailFps[i]) { isCompressionWindow = false; break; }
      }
      if (!isCompressionWindow) {
        for (let i = 0; i < newMessages.length; i++) {
          if (!newMessages[i]._timestamp) newMessages[i]._timestamp = entryTimestamp;
        }
        lastSession.messages = newMessages;
      }
      // isCompressionWindow=true 时不动 messages（保留累积历史）
    } else {
      // newLen === currentLen：通过末尾 fingerprint 区分两个完全不同的场景。
      //  (a) 同 entry 流式更新（messages 内容一致，仅 response 增量）→ 不动 messages，
      //      与原行为一致，保持引用稳定让下游 WeakMap 缓存命中。
      //  (b) CLI 上下文重置后的全新对话片段（如 ExitPlanMode 审批前后，CLI 用 [latest
      //      assistant, latest tool_result] 两条窗口连续发请求，每轮内容完全不同）→
      //      把不重叠的部分 append 到 lastSession.messages，否则会丢失整段对话。
      const lastNewFp = messageFingerprint(newMessages[newLen - 1]);
      const lastCurFp = messageFingerprint(lastSession.messages[currentLen - 1]);
      if (lastNewFp !== lastCurFp) {
        // Prefix overlap 检测：CLI 偶发可能发送"前 K 条与末尾重复 + 后 newLen-K 条新增"的窗口，
        // 直接 push 整段会重复。找 newMessages 前 K 条与 lastSession.messages 末尾 K 条
        // fp 完全相同的最长 K，只 push newMessages[K..]。
        const newFpsAll = newMessages.map(messageFingerprint);
        const curMsgs = lastSession.messages;
        let overlap = 0;
        const maxOv = Math.min(newLen - 1, currentLen); // 末尾 fp 已确定不同，至少 push 1 条
        for (let k = maxOv; k > 0; k--) {
          let match = true;
          for (let i = 0; i < k; i++) {
            if (newFpsAll[i] !== messageFingerprint(curMsgs[currentLen - k + i])) {
              match = false; break;
            }
          }
          if (match) { overlap = k; break; }
        }
        for (let i = overlap; i < newLen; i++) {
          if (!newMessages[i]._timestamp) newMessages[i]._timestamp = entryTimestamp;
          lastSession.messages.push(newMessages[i]);
        }
      }
    }

    lastSession.response = newResponse;
    lastSession.entryTimestamp = entryTimestamp;
    return [...prevSessions];
  } else {
    return [...prevSessions, { userId, messages: newMessages, response: newResponse, entryTimestamp }];
  }
}
