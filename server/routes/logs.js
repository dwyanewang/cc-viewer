// Local log management routes (moved verbatim from server.js handleRequest).
import { existsSync, realpathSync, statSync, createReadStream } from 'node:fs';
import { join, basename } from 'node:path';
import { LOG_DIR } from '../../findcc.js';
import { _projectName } from '../interceptor.js';
import { listLocalLogs, deleteLogFiles, mergeLogFiles, archiveLogFiles, validateLogPath } from '../lib/log-management.js';
import { countLogEntries, streamRawEntriesAsync } from '../lib/log-stream.js';

function localLogs(req, res) {
  try {
    const result = listLocalLogs(LOG_DIR, _projectName);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function downloadLog(req, res, parsedUrl) {
  const file = parsedUrl.searchParams.get('file');
  if (!file || file.includes('..')) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid file name' }));
    return;
  }
  if (!file.endsWith('.jsonl') && !file.endsWith('.jsonl.zip')) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid file type' }));
    return;
  }
  const filePath = join(LOG_DIR, file);
  try {
    if (!existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File not found' }));
      return;
    }
    const realPath = realpathSync(filePath);
    const realLogDir = realpathSync(LOG_DIR);
    if (!realPath.startsWith(realLogDir)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Access denied' }));
      return;
    }
    const format = parsedUrl.searchParams.get('format');
    // 默认下载重建后的 .jsonl；raw 下载原始字节（.zip 或 .jsonl 视实际而定）
    const fileName = (format !== 'raw' && file.endsWith('.jsonl.zip'))
      ? basename(file).slice(0, -4)
      : basename(file);
    // Delta storage: format=raw 下载原始文件；默认下载重建后的全量格式
    if (format === 'raw') {
      const stat = statSync(realPath);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': stat.size,
      });
      const stream = createReadStream(realPath);
      stream.pipe(res);
    } else {
      // 流式下载原始条目（不重建，保持 delta 格式），避免 OOM
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Transfer-Encoding': 'chunked',
      });
      await streamRawEntriesAsync(realPath, (raw) => {
        res.write(raw);
        res.write('\n---\n');
      });
      res.end();
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function localLog(req, res, parsedUrl) {
  const file = parsedUrl.searchParams.get('file');
  if (!file || file.includes('..')) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid file name' }));
    return;
  }

  // 验证文件类型：允许 .jsonl 或 .jsonl.zip
  if (!file.endsWith('.jsonl') && !file.endsWith('.jsonl.zip')) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid file type. Only .jsonl(.zip) files are allowed.' }));
    return;
  }

  try {
    // 独立 SSE 流：直接向请求方返回 event-stream，不走 /events 广播
    validateLogPath(LOG_DIR, file);
    const filePath = join(LOG_DIR, file);
    const total = countLogEntries(filePath);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    res.write(`event: load_start\ndata: ${JSON.stringify({ total, incremental: false })}\n\n`);
    await streamRawEntriesAsync(filePath, (raw) => {
      res.write('event: load_chunk\ndata: [');
      res.write(raw.includes('\n') ? raw.replace(/\n/g, '') : raw);
      res.write(']\n\n');
    });
    res.write(`event: load_end\ndata: {}\n\n`);
    res.end();
  } catch (err) {
    // 如果 headers 未发送，返回 JSON 错误；否则关闭连接
    // 落 stderr 让用户在 ccv 终端能看到 .jsonl.zip 解压失败等具体原因（SSE onerror 在客户端
    // 不携带错误明细，只能从服务端日志反查）
    console.error('[local-log]', file, err && err.stack || err);
    if (!res.headersSent) {
      const status = err.code === 'NOT_FOUND' ? 404 : err.code === 'ACCESS_DENIED' ? 403 : 500;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    } else {
      res.end();
    }
  }
}

function deleteLogs(req, res, parsedUrl, isLocal, deps) {
  let body = '';
  req.on('data', chunk => { body += chunk; if (body.length > deps.MAX_POST_BODY) req.destroy(); });
  req.on('end', () => {
    try {
      const { files } = JSON.parse(body);
      if (!Array.isArray(files) || files.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No files specified' }));
        return;
      }
      const results = deleteLogFiles(LOG_DIR, files);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ results }));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });
}

function mergeLogs(req, res, parsedUrl, isLocal, deps) {
  let body = '';
  req.on('data', chunk => { body += chunk; if (body.length > deps.MAX_POST_BODY) req.destroy(); });
  req.on('end', () => {
    try {
      const { files } = JSON.parse(body);
      const merged = mergeLogFiles(LOG_DIR, files);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, merged }));
    } catch (err) {
      const status = err.code === 'NOT_FOUND' ? 404 : err.code === 'INVALID_INPUT' ? 400 : 500;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

function archiveLogs(req, res, parsedUrl, isLocal, deps) {
  let body = '';
  req.on('data', chunk => { body += chunk; if (body.length > deps.MAX_POST_BODY) req.destroy(); });
  req.on('end', () => {
    try {
      const { files } = JSON.parse(body);
      if (!Array.isArray(files) || files.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No files specified' }));
        return;
      }
      if (files.length > 50) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Too many files (max 50 per request)' }));
        return;
      }
      const result = archiveLogFiles(LOG_DIR, files);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });
}

export const logsRoutes = [
  { method: 'GET', match: 'exact', path: '/api/local-logs', handler: localLogs },
  { method: 'GET', match: 'exact', path: '/api/download-log', handler: downloadLog },
  { method: 'GET', match: 'exact', path: '/api/local-log', handler: localLog },
  { method: 'POST', match: 'exact', path: '/api/delete-logs', handler: deleteLogs },
  { method: 'POST', match: 'exact', path: '/api/merge-logs', handler: mergeLogs },
  { method: 'POST', match: 'exact', path: '/api/archive-logs', handler: archiveLogs },
];
