/**
 * TerminalWriteQueue —— xterm 写缓冲队列，TerminalPanel + ScratchTerminal 共享。
 *
 * 设计目标（仅一个核心优化 + 防回归）：
 *   1) 解决原实现 `_writeBuffer = _writeBuffer.slice(N)` 的 O(n²) 字符串切片
 *      —— 大流量（/resume 1MB+）下每帧复制整个剩余 buffer，导致 794ms self
 *      + GC +56%。改用「string[] queue + offset 指针」算法，整体 O(n)。
 *   2) 每帧仅 write 一个 chunk（≤32KB），与原实现节奏 100% 等价：
 *      - 不做 single-frame multi-chunk drain（会让 /resume 滚动从平滑变跳顿）
 *      - 不用 callback flow control（dispose 时 callback 丢 → 永久死锁）
 *      - 不设 MAX_BYTES_PER_FRAME（tab 切回时主线程暴吃 200ms）
 *
 * 顺带修复（既有缺陷）：
 *   - UTF-16 surrogate pair 在 32KB 边界硬切 → emoji 显示为 �。
 *     新算法在切片末位检测 high surrogate，优先回退 1 让下轮带出整对；
 *     回退会变 0 时改前进 1（保证整对完整，轻微超 CHUNK_SIZE 可接受）。
 *   - terminal.write 抛异常（罕见，dispose 中途 / WebGL contextLoss）
 *     → 原实现 buf 已清丢失。新实现 try/catch 内回滚 head/offset，停续约
 *     rAF 防死循环；下次 push 时重新触发，数据尽量不丢。
 *   - unmount 数据丢失（既有 bug）：drain() 同步排空 buffer 给 xterm。
 *
 * 不做的事（避免功能退化）：
 *   - 不改变 ScratchTerminal 是否分帧（原本无分帧，保持）
 *   - 不处理 D3 同步 _flushWrite 调用点的字节序问题（既有 bug，超出范围）
 *   - 不引入异步 callback / Promise，保持 rAF 同步语义
 */

const CHUNK_SIZE = 32 * 1024;        // 与原 TerminalPanel 一致
const GC_THRESHOLD_HEAD = 64;        // queue 头部消费指针超 64 项触发压缩
const GC_RATIO_NUM = 2;              // 已消费 / 剩余 > 2 也触发（防长尾占内存）

export class TerminalWriteQueue {
  /**
   * @param {() => any | null} getTerminal - 返回当前 xterm 实例（或 null）
   */
  constructor(getTerminal) {
    this._getTerminal = getTerminal;
    this._queue = [];
    this._head = 0;          // 已完整消费的 queue 项数
    this._offset = 0;        // queue[head] 中已消费的字符偏移
    this._rafId = 0;         // 0 = 无定时器（避免 null vs number 歧义）
    this._unmounted = false;
  }

  /**
   * 异步写入（与原 _throttledWrite 等价入口）
   * @param {string} data
   */
  push(data) {
    if (!data || this._unmounted) return;
    if (typeof data !== 'string') return;   // 当前 cc-viewer 仅传 string
    this._queue.push(data);
    this._schedule();
  }

  _schedule() {
    if (this._rafId || this._unmounted) return;
    this._rafId = requestAnimationFrame(() => this._flush());
  }

  _flush() {
    this._rafId = 0;
    if (this._unmounted) return;
    const term = this._getTerminal();
    if (!term) return;

    // 取出最多 CHUNK_SIZE 字符到 out。每帧仅一次 write，与原实现节奏等价。
    let out = '';
    while (this._head < this._queue.length && out.length < CHUNK_SIZE) {
      const head = this._queue[this._head];
      const offset = this._offset;
      const remaining = head.length - offset;
      const need = CHUNK_SIZE - out.length;
      if (need <= 0) break;

      if (remaining <= need) {
        // 整段消费 head
        out += offset === 0 ? head : head.slice(offset);
        this._head++;
        this._offset = 0;
      } else {
        // 部分消费：从 offset 切出 need 字符
        let cut = offset + need;
        // UTF-16 surrogate 守卫：若末位是高代理，要么回退 1（下轮带出整对），
        // 要么前进 1（仅 1 char 时把整对带出，轻微超 CHUNK_SIZE）。
        const codeAtEnd = head.charCodeAt(cut - 1);
        if (codeAtEnd >= 0xD800 && codeAtEnd <= 0xDBFF) {
          if (cut - 1 > offset) {
            cut--;                      // 正常回退
          } else if (cut < head.length) {
            cut++;                      // 仅 1 char 高代理 → 前进带出整对
          }
          // else: head 末位的孤立高代理（数据本身坏的）→ 照原样发，xterm 会容错显示
        }
        out += head.slice(offset, cut);
        this._offset = cut;
      }
    }

    if (!out) return;

    // try/catch + 回滚：xterm.write 同步抛错时停续约 rAF 防死循环。
    // 数据保留语义：head/offset 是逻辑指针，queue 项本身没被 splice，
    // 回滚到 write 之前就能让下次 _flush 重新组装相同的 out 重试。
    // GC 在 write 成功后才执行（见下方），确保失败回滚永远有效。
    const headBefore = this._head;
    const offsetBefore = this._offset;
    try {
      term.write(out);
    } catch {
      this._head = headBefore;
      this._offset = offsetBefore;
      return;
    }

    // 周期压缩 queue：write 成功后才 GC，避免 splice 已消费部分破坏失败回滚的有效性。
    // head 索引超 GC_THRESHOLD_HEAD / 头部已消费比例高时一次性回收。
    // （head++ 后 offset 必为 0，slice 后头部对齐到当前 head 的实际位置 0，
    //   不会破坏 _offset 与 head 的语义对应。）
    if (
      this._head > GC_THRESHOLD_HEAD ||
      (this._head > 8 && this._head * GC_RATIO_NUM > this._queue.length)
    ) {
      this._queue = this._queue.slice(this._head);
      this._head = 0;
    }

    if (this._head < this._queue.length) this._schedule();
  }

  /**
   * 同步排空（unmount 前调用，防最后 16ms 数据丢失）。
   * 只 write 一次合并 buffer，失败静默吞掉（已经在 unmount 路径上）。
   */
  drain() {
    if (this._unmounted) return;
    const term = this._getTerminal();
    if (!term || this._head >= this._queue.length) return;
    let out = '';
    while (this._head < this._queue.length) {
      const head = this._queue[this._head];
      out += this._offset === 0 ? head : head.slice(this._offset);
      this._head++;
      this._offset = 0;
    }
    if (out) {
      try { term.write(out); } catch { /* unmount 路径，吞掉 */ }
    }
  }

  /**
   * 释放资源。dispose 后 push 静默忽略，rAF 取消。
   */
  dispose() {
    this._unmounted = true;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = 0;
    }
    this._queue.length = 0;
    this._head = 0;
    this._offset = 0;
  }

  /** 测试用 —— 返回当前队列剩余字节数 */
  _pendingBytes() {
    let total = 0;
    for (let i = this._head; i < this._queue.length; i++) {
      total += this._queue[i].length;
    }
    return total - this._offset;
  }
}

// 暴露常量给测试 / 外部参考（不要在生产代码读这些，行为是不变的契约）
TerminalWriteQueue.CHUNK_SIZE = CHUNK_SIZE;
TerminalWriteQueue.GC_THRESHOLD_HEAD = GC_THRESHOLD_HEAD;
