/**
 * Prompt classification utilities for PTY prompt detection.
 * Shared by ChatView.jsx and ChatMessage.jsx.
 *
 * NOTE: test/permission-detect.test.js 有 isPlanApprovalPrompt / isDangerousOperationPrompt
 * 的内联副本，任何修改必须**双改保持同步**，否则 production 与 test 行为分裂。
 */

export function isPlanApprovalPrompt(prompt) {
  if (!prompt || !prompt.question) return false;
  const q = prompt.question.toLowerCase();
  // 文本判定：question 含 "plan" + (approv/proceed/accept)
  if (/plan/i.test(q) && (/approv/i.test(q) || /proceed/i.test(q) || /accept/i.test(q))) {
    return true;
  }
  // Options 模式兜底：Claude CLI plan inquirer prompt 不一定带 "plan" 关键字
  // （如 "Would you like to proceed?"），但典型有 3 选项 = Approve / Approve with edits / Reject。
  // 通过这个模式识别，保证 cliMode 下 plan modal 能弹出。
  // 与 isDangerousOperationPrompt 的 2 选项 allow/deny 兜底正交（dangerous L15 早退避免冲突）。
  if (Array.isArray(prompt.options) && prompt.options.length === 3) {
    const texts = prompt.options.map(o => (o.text || '').toLowerCase());
    const hasApprove = texts.some(t => /\bapprov/i.test(t));
    const hasEdit = texts.some(t => /\bedits?\b|\bmodify/i.test(t));
    const hasReject = texts.some(t => /\breject\b|\bdeny\b|keep planning|\bno,/i.test(t));
    if (hasApprove && hasEdit && hasReject) return true;
  }
  return false;
}

export function isDangerousOperationPrompt(prompt) {
  if (!prompt || !prompt.question) return false;
  const q = prompt.question;
  if (isPlanApprovalPrompt(prompt)) return false;
  // Match Claude Code permission prompt patterns:
  // - "Do you want to make this edit" / "Do you want to write" / "Do you want to proceed"
  // - "Allow X to Y" / "Want to allow" / "wants to (execute|run|...)"
  // - "May Claude read/write/execute..." / "grant access/permission" / "permit"
  if (/do you want to (make this edit|write|proceed|create|delete)|allow\b.*\bto\b|want to allow|wants to (execute|run|read|write|access|create|delete|modify|use)|may .*(read|write|execute|run|access|create|delete|modify)|grant .*(access|permission)|permit/i.test(q)) {
    return true;
  }
  // Also detect by options: if options contain both Allow/Yes and Deny/No keywords
  if (prompt.options && prompt.options.length >= 2) {
    const texts = prompt.options.map(o => (o.text || '').toLowerCase());
    const hasAllow = texts.some(t => /^allow|^yes/i.test(t));
    const hasDeny = texts.some(t => /^no$|^no[^a-z]|^deny|^reject/i.test(t));
    if (hasAllow && hasDeny) return true;
  }
  return false;
}

/**
 * Parse tool name and input from the PTY buffer surrounding a detected prompt.
 * Used to populate ToolApprovalPanel for subAgent permission prompts that bypass hooks.
 *
 * @param {string} buf - ANSI-stripped PTY buffer (up to 4KB)
 * @param {string} question - Detected prompt question text
 * @param {Array} options - Detected prompt options [{text, number, selected}]
 * @returns {{ toolName: string, input: object }}
 */
export function parseToolInfoFromBuffer(buf, question, options) {
  const q = (question || '').toLowerCase();
  const optTexts = (options || []).map(o => o.text || '').join(' ').toLowerCase();

  // 1. Bash: buffer contains "Bash command" or "Run shell command"
  if (/bash command|run shell command/i.test(buf)) {
    const cmdMatch = buf.match(/(?:Bash command|Run shell command)\s*\n\s*\n((?:\s{4,}.+\n?)+)/i);
    const cmd = cmdMatch ? cmdMatch[1].replace(/^\s{4}/gm, '').trim() : null;
    return { toolName: 'Bash', input: cmd ? { command: cmd } : { description: question } };
  }

  // 2. Edit: "make this edit to <path>"
  const editMatch = q.match(/make this edit to\s+(.+?)\s*\??$/);
  if (editMatch) return { toolName: 'Edit', input: { file_path: editMatch[1] } };

  // 3. Write: "write" + path
  const writeMatch = q.match(/write (?:this new file|to)\s+(.+?)\s*\??$/);
  if (writeMatch) return { toolName: 'Write', input: { file_path: writeMatch[1] } };
  if (/write/i.test(q)) return { toolName: 'Write', input: { description: question } };

  // 4. Read: "read <path>" or options contain "allow reading from <path>"
  const readMatch = q.match(/read\s+(.+?)\s*\??$/) || optTexts.match(/allow reading from\s+(.+?)(?:\s+from this project)?/);
  if (readMatch) return { toolName: 'Read', input: { file_path: readMatch[1] } };

  // 5. WebFetch/WebSearch
  if (/fetch|url/i.test(q)) return { toolName: 'WebFetch', input: { description: question } };
  if (/search/i.test(q)) return { toolName: 'WebSearch', input: { description: question } };

  // 6. Fallback
  return { toolName: 'Tool', input: { description: question } };
}
