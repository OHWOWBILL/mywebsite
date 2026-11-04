#!/usr/bin/env node
// 生成 static/sw.js 里的离线清单：各件法宝的页面（static/*/index.html 里引了 /fabao/fabao.js 的）、
// 页面引用的本站脚本与样式（照写在页面上的样子，连 ?v= 一起）、页面里 fetch 的 .json、印的笔画、
// 法宝库共用的几件（分享图、存档、词典、二维码、清单、图标）。
// 版本号是这些文件内容的摘要：法宝一改，重跑本脚本，版本号跟着变，浏览器就换新的一份。
// 用法：node scripts/pwa/gen-sw.js          写回 static/sw.js
//       node scripts/pwa/gen-sw.js --check  只检查清单是否最新（不最新时退出码 1）
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..'), STATIC = path.join(ROOT, 'static'), SW = path.join(STATIC, 'sw.js');
const EXTRA = [
  '/tools/', '/fabao/wenti.js', '/fabao/app.webmanifest',
  '/fabao/share.js?v=1', '/fabao/backup.js?v=1', '/fabao/cidian.js?v=1', '/fabao/vendor/qrcode.js?v=1.4.4',
  '/android-chrome-192x192.png', '/android-chrome-512x512.png', '/apple-touch-icon.png', '/favicon-32x32.png'
];
const fileOf = u => { const p = u.split('?')[0]; return path.join(STATIC, p.endsWith('/') ? p + 'index.html' : p); };
const local = s => s && !/^(https?:)?\/\//.test(s) && !/^(data|mailto|javascript):/.test(s) && !s.startsWith('#');

const pre = new Set(EXTRA), pages = [];
for (const d of fs.readdirSync(STATIC, { withFileTypes: true })) {
  if (!d.isDirectory() || d.name === 'img') continue;
  const f = path.join(STATIC, d.name, 'index.html');
  if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, 'utf8');
  if (!html.includes('/fabao/fabao.js')) continue;
  const base = 'https://x/' + d.name + '/', page = '/' + d.name + '/';
  pages.push(page); pre.add(page);
  const add = s => { if (!local(s)) return; const u = new URL(s, base); pre.add(u.pathname + u.search); };
  for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) add(m[1]);
  for (const m of html.matchAll(/<link\b[^>]*\brel="(?:stylesheet|manifest|modulepreload)"[^>]*\bhref="([^"]+)"/g)) add(m[1]);
  for (const m of html.matchAll(/<link\b[^>]*\bhref="([^"]+)"[^>]*\brel="(?:stylesheet|manifest|modulepreload)"/g)) add(m[1]);
  // 页面与它自己目录里的脚本 fetch 的 .json（相对页面网址）
  const own = [html];
  for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) {
    if (!local(m[1])) continue;
    const u = new URL(m[1], base);
    if (u.pathname.startsWith(page) && fs.existsSync(fileOf(u.pathname))) own.push(fs.readFileSync(fileOf(u.pathname), 'utf8'));
  }
  for (const src of own) for (const m of src.matchAll(/fetch\(\s*['"`]([^'"`$]+\.json)['"`]/g)) add(m[1]);
  // 印的笔画
  const seal = /class="fb-seal"[^>]*>\s*([^<\s])\s*</.exec(html);
  if (seal) { const s = '/fabao/strokes/' + seal[1].codePointAt(0).toString(16) + '.json'; if (fs.existsSync(fileOf(s))) pre.add(s); }
}
const list = [...pre].sort((a, b) => (a.endsWith('/') === b.endsWith('/') ? a.localeCompare(b) : a.endsWith('/') ? -1 : 1));
const h = crypto.createHash('sha256');
let bytes = 0;
const missing = [];
for (const u of list) {
  const f = fileOf(u);
  h.update(u + '\0');
  if (fs.existsSync(f)) { const b = fs.readFileSync(f); h.update(b); bytes += b.length; }
  else if (u !== '/fabao/wenti.js') missing.push(u);   // wenti.js 由 Hugo 构建时生成
}
const V = 'fb-' + h.digest('hex').slice(0, 12);
const block = `/* gen-sw:begin */\nconst V = '${V}';\nconst PRE = [\n${list.map(u => `  '${u}'`).join(',\n')}\n];\n/* gen-sw:end */`;
const src = fs.readFileSync(SW, 'utf8'), next = src.replace(/\/\* gen-sw:begin \*\/[\s\S]*?\/\* gen-sw:end \*\//, block);
if (missing.length) console.log('⚠ 清单里有、static/ 下没有：' + missing.join(' '));
console.log(`离线清单：${pages.length} 页、${list.length} 件、约 ${(bytes / 1024 / 1024).toFixed(2)} MB；版本 ${V}`);
if (process.argv.includes('--check')) {
  if (next !== src) { console.log('✗ static/sw.js 的清单不是最新，跑一次 node scripts/pwa/gen-sw.js'); process.exit(1); }
  console.log('✓ static/sw.js 清单最新');
} else if (next !== src) { fs.writeFileSync(SW, next); console.log('已写回 static/sw.js'); }
