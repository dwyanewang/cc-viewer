// Skills routes (moved verbatim from server.js handleRequest).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, sep, dirname } from 'node:path';
import { getClaudeConfigDir } from '../../findcc.js';
import { listSkills, moveSkill, validateSkillName } from '../lib/skills-api.js';

async function skillsList(req, res) {
  try {
    const skills = listSkills({ projectDir: process.env.CCV_PROJECT_DIR || process.cwd() });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, skills }));
  } catch (err) {
    console.error('[api/skills]', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'internal_error' }));
  }
}

// Skill 动态装卸 —— 切换单个 skill（在 skills/ 和 skills-skip/ 之间 move）
function skillsToggle(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; if (body.length > 4096) req.destroy(); });
  req.on('end', async () => {
    try {
      const { source, name, enable } = JSON.parse(body);
      // 不加进程锁：moveSkill 里 existsSync 前置 + renameSync 原子性已能让并发
      // toggle 落到合理分支（一个成功、另一个拿 SOURCE_MISSING 或 DEST_CONFLICT）；
      // 前端 toggling:Set 也已防同 tab 连点，两者叠加足够安全
      moveSkill({
        source, name, enable: !!enable,
        projectDir: process.env.CCV_PROJECT_DIR || process.cwd(),
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      const statusMap = {
        INVALID_NAME: 400, INVALID_SOURCE: 400, PATH_ESCAPE: 400, SYMLINK: 400,
        SOURCE_MISSING: 404, DEST_CONFLICT: 409,
      };
      const status = statusMap[err?.code] || 500;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err?.message || 'internal_error', code: err?.code || 'unknown' }));
    }
  });
}

// Skill 上传/导入 API —— 接受 .zip 或 SKILL.md（忽略大小写），写入用户级 ~/.claude/skills/{name}/
// 设计要点：
//  · 100MB 上限，跟 /api/upload 一致；
//  · 扩展名白名单只放 zip / md（忽略大小写）；其他类型直接 415；
//  · zip 内必须含 SKILL.md（任意子目录、忽略大小写），找最浅的那个所在目录作为 skill 根；
//  · skill 名优先取 SKILL.md frontmatter 的 name，回落到 zip / md 文件名（去扩展名）；
//  · 名字必须通过 validateSkillName，目标目录已存在则 409 拒绝（前端引导用户改 zip 名）。
function skillsImport(req, res, parsedUrl, isLocal, deps) {
  const contentType = req.headers['content-type'] || '';
  // boundary 用 [^;]+ 终止避免吞掉后续 Content-Type 参数；长度封顶 200 防止超长串撑爆 buffer 比对。
  const boundaryMatch = contentType.match(/boundary=([^;]+)/);
  if (!boundaryMatch || boundaryMatch[1].length > 200) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid boundary' }));
    return;
  }
  const MAX_UPLOAD = 100 * 1024 * 1024;
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > MAX_UPLOAD) {
    res.writeHead(413, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'File too large (max 100MB)' }));
    return;
  }
  const boundary = boundaryMatch[1].trim().replace(/^["']|["']$/g, '');
  const chunks = [];
  let totalSize = 0;
  let aborted = false;
  req.on('data', chunk => {
    totalSize += chunk.length;
    if (totalSize > MAX_UPLOAD) {
      aborted = true;
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File too large (max 100MB)' }));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', async () => {
    if (aborted) return;
    try {
      const buf = Buffer.concat(chunks);
      const headerEnd = buf.indexOf('\r\n\r\n');
      if (headerEnd === -1) throw Object.assign(new Error('Malformed multipart'), { status: 400 });
      const headerStr = buf.slice(0, headerEnd).toString();
      const nameMatch = headerStr.match(/filename="([^"]+)"/);
      if (!nameMatch) throw Object.assign(new Error('No filename'), { status: 400 });
      // NFKC 规范化 + 控制字符/路径分隔符过滤 + 零宽和方向覆盖字符过滤（防止 homoglyph / RLO 混淆）
      const originalName = nameMatch[1]
        .normalize('NFKC')
        .replace(/[\x00-\x1f/\\]/g, '_')
        .replace(/[​-‏‪-‮⁠﻿]/g, '');
      // Windows 保留设备名守卫（见 WINDOWS_RESERVED_NAMES 注释）。
      {
        const base = originalName.split('.')[0].trim().toLowerCase();
        if (deps.WINDOWS_RESERVED_NAMES.test(base)) {
          throw Object.assign(new Error('Reserved filename not allowed'), { status: 400 });
        }
      }
      const lower = originalName.toLowerCase();
      const isZip = lower.endsWith('.zip');
      const isMd = lower.endsWith('.md');
      if (!isZip && !isMd) {
        throw Object.assign(new Error('Unsupported file type'), { status: 415, code: 'INVALID_TYPE' });
      }
      const bodyStart = headerEnd + 4;
      const closingBoundary = Buffer.from('\r\n--' + boundary);
      const bodyEnd = buf.indexOf(closingBoundary, bodyStart);
      const fileData = bodyEnd !== -1 ? buf.slice(bodyStart, bodyEnd) : buf.slice(bodyStart);

      const skillsRoot = join(getClaudeConfigDir(), 'skills');
      mkdirSync(skillsRoot, { recursive: true });

      // 简单 frontmatter name 解析：抓 `name: xxx` 单行（与 skills-api.js 的 description 解析风格保持一致，最小实现）
      const parseNameFromMd = (text) => {
        const m = /^---\s*\n([\s\S]*?)\n---/.exec(text);
        if (!m) return null;
        const nm = /^name\s*:\s*(.*)$/m.exec(m[1]);
        if (!nm) return null;
        return nm[1].trim().replace(/^["']|["']$/g, '');
      };

      const fallbackBaseName = (filename, stripExt) => {
        let n = filename.replace(/^.*[\\/]/, '');
        if (stripExt) n = n.replace(/\.[^.]+$/, '');
        return n;
      };

      let skillName = null;
      let skillFiles = []; // { relPath, data }

      if (isMd) {
        const text = fileData.toString('utf8');
        skillName = parseNameFromMd(text) || fallbackBaseName(originalName, true);
        skillFiles = [{ relPath: 'SKILL.md', data: fileData }];
      } else {
        // zip：用 adm-zip 解压到内存，校验 SKILL.md 存在（忽略大小写），找最浅的 SKILL.md 所在目录作为 skill 根
        const AdmZip = (await import('adm-zip')).default;
        let zip;
        try {
          zip = new AdmZip(fileData);
        } catch {
          throw Object.assign(new Error('Invalid zip archive'), { status: 400, code: 'INVALID_ZIP' });
        }
        const entries = zip.getEntries();
        // zip bomb 防护：单文件 ≤50MB，总解压 ≤200MB；以及拒绝 symlink entry
        // adm-zip 不直接暴露 isSymbolicLink，需用 attr 高 16 位的 unix mode 判断 0o120000
        const MAX_PER_FILE = 50 * 1024 * 1024;
        const MAX_TOTAL_UNCOMPRESSED = 200 * 1024 * 1024;
        let totalUncompressed = 0;
        for (const e of entries) {
          if (e.isDirectory) continue;
          const unixMode = (e.attr >>> 16) & 0xffff;
          if ((unixMode & 0o170000) === 0o120000) {
            throw Object.assign(new Error('Symlinks not allowed in zip'), { status: 400, code: 'INVALID_ZIP' });
          }
          const sizeRaw = e.header?.size || 0;
          if (sizeRaw > MAX_PER_FILE) {
            throw Object.assign(new Error('File too large in archive'), { status: 400, code: 'ZIP_BOMB' });
          }
          totalUncompressed += sizeRaw;
          if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED) {
            throw Object.assign(new Error('Archive expands too large'), { status: 400, code: 'ZIP_BOMB' });
          }
        }
        // 找所有 SKILL.md（忽略大小写）的 entry，挑最浅的
        let bestSkillEntry = null;
        let bestDepth = Infinity;
        for (const e of entries) {
          if (e.isDirectory) continue;
          const en = e.entryName;
          const base = en.split('/').pop() || '';
          if (base.toLowerCase() === 'skill.md') {
            const depth = en.split('/').length;
            if (depth < bestDepth) { bestDepth = depth; bestSkillEntry = e; }
          }
        }
        if (!bestSkillEntry) {
          throw Object.assign(new Error('SKILL.md not found in zip'), { status: 400, code: 'MISSING_SKILL_MD' });
        }
        // skill 根 = SKILL.md 所在目录（如果在 zip 根则空字符串）
        const lastSlash = bestSkillEntry.entryName.lastIndexOf('/');
        const skillRootPrefix = lastSlash >= 0 ? bestSkillEntry.entryName.slice(0, lastSlash + 1) : '';
        const skillMdText = bestSkillEntry.getData().toString('utf8');
        skillName = parseNameFromMd(skillMdText)
          || (skillRootPrefix ? skillRootPrefix.replace(/\/$/, '').split('/').pop() : null)
          || fallbackBaseName(originalName, true);

        // 收集 skill 根下的所有文件，规范化 relPath（去掉 root prefix）
        // 二次校验：header.size 来自 zip 中央目录是攻击者可控的（可谎报 size=0），
        // 上面 zip bomb 检查已用 header.size 做"廉价初检"快速拒绝；这里 getData() 后用真实 data.length 复核，
        // 防止恶意 zip 在 header 上撒谎绕过总大小限制。任一阶段超额都抛 ZIP_BOMB。
        let actualTotal = 0;
        for (const e of entries) {
          if (e.isDirectory) continue;
          if (skillRootPrefix && !e.entryName.startsWith(skillRootPrefix)) continue;
          const rel = skillRootPrefix ? e.entryName.slice(skillRootPrefix.length) : e.entryName;
          if (!rel || rel.includes('..')) continue;
          const data = e.getData();
          if (data.length > MAX_PER_FILE) {
            throw Object.assign(new Error('File actual size too large'), { status: 400, code: 'ZIP_BOMB' });
          }
          actualTotal += data.length;
          if (actualTotal > MAX_TOTAL_UNCOMPRESSED) {
            throw Object.assign(new Error('Archive actual size too large'), { status: 400, code: 'ZIP_BOMB' });
          }
          // SKILL.md 统一规范化大小写
          const finalRel = rel.split('/').pop().toLowerCase() === 'skill.md'
            ? rel.replace(/[^/]*$/, 'SKILL.md')
            : rel;
          skillFiles.push({ relPath: finalRel, data });
        }
      }

      if (!validateSkillName(skillName)) {
        throw Object.assign(new Error(`Invalid skill name: ${skillName}`), { status: 400, code: 'INVALID_NAME' });
      }
      const targetDir = join(skillsRoot, skillName);
      // 原子创建：不带 recursive 让 mkdir 在已存在时直接抛 EEXIST，消除 existsSync 与 mkdirSync 之间的 TOCTOU 竞争窗口。
      // skillsRoot 已在前面 mkdirSync(skillsRoot, { recursive: true }) 兜底创建，所以这里 join 出的 parent 一定存在。
      try {
        mkdirSync(targetDir);
      } catch (err) {
        if (err.code === 'EEXIST') {
          throw Object.assign(new Error(`Skill already exists: ${skillName}`), { status: 409, code: 'EXISTS' });
        }
        throw err;
      }
      // 二次防御：resolved + sep 后缀比较，防止 prefix 攻击
      // (e.g. dest=/skills/my-skill-evil/x 不能以 /skills/my-skill 单独 startsWith 通过)
      const resolvedTarget = resolve(targetDir) + sep;
      for (const f of skillFiles) {
        const dest = join(targetDir, f.relPath);
        if (!resolve(dest).startsWith(resolvedTarget)) continue;
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, f.data);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, name: skillName, path: targetDir }));
    } catch (err) {
      const status = err?.status || 500;
      if (status >= 500) console.error('[api/skills/import]', err);
      // 5xx 不向前端泄漏内部 message（可能含路径），只返回脱敏文本 + code 让前端做 i18n
      const safeError = status >= 500 ? 'server_error' : (err?.message || 'error');
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: safeError, code: err?.code || 'unknown' }));
    }
  });
}

export const skillsRoutes = [
  { method: 'GET', match: 'exact', path: '/api/skills', handler: skillsList },
  { method: 'POST', match: 'exact', path: '/api/skills/toggle', handler: skillsToggle },
  { method: 'POST', match: 'exact', path: '/api/skills/import', handler: skillsImport },
];
