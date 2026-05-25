// Workspace routes (moved verbatim from server.js handleRequest).
import { existsSync, statSync, unwatchFile } from 'node:fs';
import { basename } from 'node:path';
import { LOG_FILE, initForWorkspace, resetWorkspace } from '../interceptor.js';
import { watchLogFile, getWatchedFiles } from '../lib/log-watcher.js';
import { readClaudeProjectModel } from '../lib/context-watcher.js';
import { countLogEntries, streamRawEntriesAsync } from '../lib/log-stream.js';

function workspacesList(req, res, parsedUrl, isLocal, deps) {
  import('../workspace-registry.js').then(({ getWorkspaces }) => {
    const workspaces = getWorkspaces();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ workspaces, workspaceMode: deps.isWorkspaceMode && !deps.workspaceLaunched }));
  }).catch(err => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });
}

function workspacesLaunch(req, res, parsedUrl, isLocal, deps) {
  let body = '';
  req.on('data', chunk => { body += chunk; if (body.length > deps.MAX_POST_BODY) req.destroy(); });
  req.on('end', async () => {
    try {
      const { path: wsPath, extraArgs: launchExtraArgs } = JSON.parse(body);
      if (!wsPath || !existsSync(wsPath) || !statSync(wsPath).isDirectory()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid directory path' }));
        return;
      }

      const { registerWorkspace } = await import('../workspace-registry.js');
      registerWorkspace(wsPath);

      // Electron multi-tab 模式：管理 server 只触发 callback，不做日志初始化
      // 所有日志相关操作（initForWorkspace、watchLogFile、spawnClaude）由 tab-worker 子进程负责
      if (process.env.CCV_ELECTRON_MULTITAB === '1') {
        if (deps.launchCallback) {
          deps.launchCallback(wsPath, Array.isArray(launchExtraArgs) ? launchExtraArgs : []);
        }
        deps.setWorkspaceLaunched(true);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, projectName: basename(wsPath) }));
        return;
      }

      // 非 Electron 模式（web / CLI）：完整逻辑
      const result = initForWorkspace(wsPath);
      process.env.CCV_PROJECT_DIR = wsPath;

      // 启动日志监听
      watchLogFile(deps.logWatcherOpts(LOG_FILE));

      // 启动 stats worker（如果尚未启动）
      if (!deps.statsWorker) deps.startStatsWorker();
      deps.startStreamingStatusTimer();

      // 启动 PTY
      const proxyPort = process.env.CCV_PROXY_PORT;
      if (proxyPort) {
        const { spawnClaude } = await import('../pty-manager.js');
        const mergedArgs = [...deps.workspaceClaudeArgs, ...(Array.isArray(launchExtraArgs) ? launchExtraArgs : [])];
        await spawnClaude(parseInt(proxyPort), wsPath, mergedArgs, deps.workspaceClaudePath, deps.workspaceIsNpmVersion, deps.actualPort, deps.protocol, deps.INTERNAL_TOKEN);
      }

      deps.setWorkspaceLaunched(true);

      // 通知所有 SSE 客户端
      deps.clients.forEach(client => {
        try {
          client.write(`event: workspace_started\ndata: ${JSON.stringify({ projectName: result.projectName, path: wsPath, claudeProjectModel: readClaudeProjectModel(wsPath) })}\n\n`);
        } catch {}
      });

      // 流式分段广播以刷新会话区域，避免全量加载 OOM
      const wsReloadTotal = countLogEntries(LOG_FILE);
      deps.clients.forEach(client => {
        try { client.write(`event: load_start\ndata: ${JSON.stringify({ total: wsReloadTotal, incremental: false })}\n\n`); } catch {}
      });
      await streamRawEntriesAsync(LOG_FILE, (raw) => {
        deps.clients.forEach(client => {
          try { client.write('event: load_chunk\ndata: ['); client.write(raw.replace(/\n/g, '')); client.write(']\n\n'); } catch {}
        });
      });
      deps.clients.forEach(client => {
        try { client.write(`event: load_end\ndata: {}\n\n`); } catch {}
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, projectName: result.projectName }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

function workspacesAdd(req, res, parsedUrl, isLocal, deps) {
  let body = '';
  req.on('data', chunk => { body += chunk; if (body.length > deps.MAX_POST_BODY) req.destroy(); });
  req.on('end', async () => {
    try {
      const { path: wsPath } = JSON.parse(body);
      if (!wsPath || !existsSync(wsPath) || !statSync(wsPath).isDirectory()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid directory path' }));
        return;
      }
      const { registerWorkspace } = await import('../workspace-registry.js');
      const entry = registerWorkspace(wsPath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, workspace: entry }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

function workspacesDelete(req, res, parsedUrl) {
  const url = parsedUrl.pathname;
  const id = url.split('/').pop();
  import('../workspace-registry.js').then(({ removeWorkspace }) => {
    const removed = removeWorkspace(id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: removed }));
  }).catch(err => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });
}

function workspacesStop(req, res, parsedUrl, isLocal, deps) {
  Promise.all([
    import('../pty-manager.js').then(({ killPty }) => killPty()),
    import('../scratch-pty-manager.js').then(({ killAllScratch }) => killAllScratch()).catch(() => {}),
  ]).then(() => {
    // 接续原有清理流程

    // 停止日志监听
    for (const logFile of getWatchedFiles().keys()) {
      unwatchFile(logFile);
    }
    getWatchedFiles().clear();

    // 重置 interceptor 状态
    resetWorkspace();
    deps.setWorkspaceLaunched(false);

    // 通知所有 SSE 客户端
    deps.clients.forEach(client => {
      try {
        client.write(`event: workspace_stopped\ndata: {}\n\n`);
      } catch {}
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  }).catch(err => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });
}

export const workspacesRoutes = [
  { method: 'GET', match: 'exact', path: '/api/workspaces', handler: workspacesList },
  { method: 'POST', match: 'exact', path: '/api/workspaces/launch', handler: workspacesLaunch },
  { method: 'POST', match: 'exact', path: '/api/workspaces/add', handler: workspacesAdd },
  { method: 'DELETE', match: 'prefix', path: '/api/workspaces/', handler: workspacesDelete },
  { method: 'POST', match: 'exact', path: '/api/workspaces/stop', handler: workspacesStop },
];
