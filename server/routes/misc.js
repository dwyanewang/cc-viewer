// Miscellaneous small routes (moved verbatim from server.js handleRequest).
import { getUserProfile } from '../lib/user-profile.js';
import { runWaterfallHook } from '../lib/plugin-loader.js';

async function userProfile(req, res) {
  const profile = await getUserProfile();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(profile));
}

async function localUrl(req, res, parsedUrl, isLocal, deps) {
  const localIp = deps.getLocalIp();
  const defaultUrl = `${deps.protocol}://${localIp}:${deps.actualPort}?token=${deps.ACCESS_TOKEN}`;
  const hookResult = await runWaterfallHook('localUrl', { url: defaultUrl, ip: localIp, port: deps.actualPort, token: deps.ACCESS_TOKEN });
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ url: hookResult.url }));
}

export const miscRoutes = [
  { method: 'GET', match: 'exact', path: '/api/user-profile', handler: userProfile },
  { method: 'GET', match: 'exact', path: '/api/local-url', handler: localUrl },
];
