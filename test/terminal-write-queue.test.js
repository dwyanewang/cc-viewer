/**
 * TerminalWriteQueue 单测
 *
 * 覆盖：
 *   - 基本 push + flush 节奏（每帧 1 chunk ≤32KB）
 *   - O(n²) 修复：单 1MB push 不会复制大字符串
 *   - UTF-16 surrogate 边界守卫（4 种 case）
 *   - terminal.write 抛异常时 head/offset 回滚 + 不死循环
 *   - drain 同步排空所有剩余字节
 *   - dispose 后 push 静默忽略
 *   - 空字符串 / 非 string 输入静默忽略
 *   - queue 头部周期压缩
 */
import { describe, it, before, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { TerminalWriteQueue } from '../src/utils/terminalWriteQueue.js';

// ==== 测试夹具：mock requestAnimationFrame + xterm ====

let _rafQueue;
let _rafNextId;
let _origRAF;
let _origCAF;

function setupRAF() {
  _rafQueue = new Map();
  _rafNextId = 1;
  _origRAF = globalThis.requestAnimationFrame;
  _origCAF = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = (cb) => {
    const id = _rafNextId++;
    _rafQueue.set(id, cb);
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => {
    _rafQueue.delete(id);
  };
}

function teardownRAF() {
  globalThis.requestAnimationFrame = _origRAF;
  globalThis.cancelAnimationFrame = _origCAF;
}

function flushOneFrame() {
  // 取出当前队列里所有待 callback 一次性触发（rAF 一帧的语义）
  const callbacks = [..._rafQueue.values()];
  _rafQueue.clear();
  for (const cb of callbacks) cb();
}

function flushAllFrames(maxFrames = 100) {
  let frames = 0;
  while (_rafQueue.size > 0 && frames < maxFrames) {
    flushOneFrame();
    frames++;
  }
  return frames;
}

function makeTerminal() {
  const writes = [];
  let throwOn = null;
  return {
    writes,
    write(data) {
      if (throwOn != null && writes.length === throwOn) {
        throwOn = null;
        throw new Error('mock xterm throw');
      }
      writes.push(data);
    },
    setThrowOn(n) { throwOn = n; },
    receivedString() { return writes.join(''); },
    receivedBytes() { return writes.reduce((s, w) => s + w.length, 0); },
  };
}

describe('TerminalWriteQueue', { concurrency: false }, () => {
  let term;
  let q;

  beforeEach(() => {
    setupRAF();
    term = makeTerminal();
    q = new TerminalWriteQueue(() => term);
  });

  afterEach(() => {
    q.dispose();
    teardownRAF();
  });

  it('小 push 一帧合并到一次 write', () => {
    q.push('hello ');
    q.push('world');
    flushOneFrame();
    assert.equal(term.writes.length, 1);
    assert.equal(term.writes[0], 'hello world');
  });

  it('1MB 单次 push：每帧 1 个 32KB chunk，~32 帧吃完，无 O(n²)', () => {
    const big = 'x'.repeat(1024 * 1024);
    q.push(big);
    const frames = flushAllFrames(200);
    // 32KB / 帧 → ceil(1MB / 32KB) = 32 帧
    assert.ok(frames >= 32 && frames <= 33, `expected ~32 frames, got ${frames}`);
    // 每帧 write 一次（除了最后一帧 +1）
    assert.equal(term.receivedBytes(), big.length, 'bytes received != bytes pushed');
    assert.equal(term.receivedString(), big);
    // 每条 write 都 ≤ CHUNK_SIZE
    for (const w of term.writes) {
      assert.ok(w.length <= TerminalWriteQueue.CHUNK_SIZE);
    }
  });

  it('多个小 push 跨 chunk 边界保持顺序', () => {
    // 凑出 65KB（2 个 chunk + 余）
    const a = 'a'.repeat(20000);
    const b = 'b'.repeat(20000);
    const c = 'c'.repeat(25000);
    q.push(a);
    q.push(b);
    q.push(c);
    flushAllFrames();
    assert.equal(term.receivedString(), a + b + c);
  });

  it('UTF-16 surrogate: emoji 跨 32KB 边界不切碎', () => {
    // 在 CHUNK_SIZE-1 位置放一个 emoji（surrogate pair 占 2 code unit）
    const filler = 'x'.repeat(TerminalWriteQueue.CHUNK_SIZE - 1);
    const emoji = '🚀';   // U+1F680, surrogate pair
    const rest = 'tail';
    q.push(filler + emoji + rest);
    flushAllFrames();
    assert.equal(term.receivedString(), filler + emoji + rest);
    // 关键：emoji 不应被切成两半 —— 任何 write 里不能有孤立高代理
    for (const w of term.writes) {
      for (let i = 0; i < w.length; i++) {
        const code = w.charCodeAt(i);
        if (code >= 0xD800 && code <= 0xDBFF) {
          // 高代理后必须紧跟低代理
          const next = w.charCodeAt(i + 1);
          assert.ok(
            next >= 0xDC00 && next <= 0xDFFF,
            `lone high surrogate at write[${i}]: ${code.toString(16)}`,
          );
        }
      }
    }
  });

  it('UTF-16 surrogate: emoji 恰好在 CHUNK_SIZE 位置（cut 落在高代理后）', () => {
    // filler 长 32766（CHUNK_SIZE - 2），加 1 个 emoji 占 2 → 总长 32768 == CHUNK_SIZE
    // 第二条 push 接 'tail' → 整体 surrogate pair 在第一段 chunk 的最后
    const filler = 'x'.repeat(TerminalWriteQueue.CHUNK_SIZE - 2);
    const emoji = '😀';
    const tail = 'tail';
    q.push(filler + emoji);
    q.push(tail);
    flushAllFrames();
    assert.equal(term.receivedString(), filler + emoji + tail);
  });

  it('UTF-16 surrogate: 单字符 push 是孤立高代理（数据本身坏）— 也不死循环', () => {
    // 极端：单 1-char string，charCode 在 D800-DBFF（孤立高代理）
    const lone = String.fromCharCode(0xD83D);  // 高代理本体（无低代理跟）
    q.push(lone);
    q.push('after');
    flushAllFrames();
    // 应当尽量发出去，xterm 自己会容错；不能死循环
    assert.equal(term.receivedString(), lone + 'after');
  });

  it('terminal.write 抛异常 → 回滚 head/offset，停续约 rAF，下次 push 继续', () => {
    term.setThrowOn(0);  // 第 0 次 write 抛
    q.push('first');
    flushOneFrame();
    // write 抛错 → out 已脱离 buffer 丢失，但 rAF 不再续约
    assert.equal(_rafQueue.size, 0, '抛错后不应再续约 rAF');
    assert.equal(term.writes.length, 0, '抛错的 write 不应进入 writes');

    // 下次 push 应该重新触发 rAF 并写入成功
    q.push('second');
    flushAllFrames();
    assert.equal(term.receivedString(), 'second');
  });

  it('drain 同步排空 buffer，无需 rAF', () => {
    q.push('a');
    q.push('b');
    assert.equal(term.writes.length, 0);  // 还没 rAF 触发
    q.drain();
    assert.equal(term.receivedString(), 'ab');
    assert.equal(_rafQueue.size, 1, 'drain 不取消已排队的 rAF');
    flushAllFrames();
    // rAF 触发时 buffer 已空，无新 write
    assert.equal(term.writes.length, 1);
  });

  it('drain 在 1MB 数据下能一次写完（unmount 路径）', () => {
    const big = 'y'.repeat(1024 * 1024);
    q.push(big);
    q.drain();
    assert.equal(term.receivedString(), big);
  });

  it('dispose 后 push 静默忽略', () => {
    q.push('before');
    q.dispose();
    q.push('after');
    flushAllFrames();
    assert.equal(term.writes.length, 0, 'dispose 后不应再有 write');
  });

  it('dispose 取消已排队的 rAF', () => {
    q.push('x');
    assert.equal(_rafQueue.size, 1);
    q.dispose();
    assert.equal(_rafQueue.size, 0);
  });

  it('空字符串 / 非 string 输入静默忽略', () => {
    q.push('');
    q.push(null);
    q.push(undefined);
    q.push(123);
    q.push({});
    flushAllFrames();
    assert.equal(term.writes.length, 0);
  });

  it('queue 头部消费过多时压缩，不无限增长', () => {
    // 推 100 个小 chunk 然后逐帧消费
    for (let i = 0; i < 100; i++) q.push('x'.repeat(100));
    flushAllFrames();
    // 100 chunks × 100 字节 = 10KB，单帧吃完（< CHUNK_SIZE）
    assert.equal(term.receivedBytes(), 10000);
    // queue 内部已被压缩（不直接读私有字段，验证后续 push 还能正常工作）
    q.push('after');
    flushAllFrames();
    assert.equal(term.receivedString().slice(-5), 'after');
  });

  it('terminal getter 返回 null 时不 write 不死循环', () => {
    let termInstance = term;
    const dynQ = new TerminalWriteQueue(() => termInstance);
    dynQ.push('hello');
    termInstance = null;  // 模拟 dispose 中途
    flushAllFrames();
    assert.equal(term.writes.length, 0);
    // 即使 terminal 没了，dynQ 不应死循环
    assert.equal(_rafQueue.size, 0);
    dynQ.dispose();
  });
});
