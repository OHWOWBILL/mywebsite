#!/usr/bin/env node
// 印章落笔的笔画数据：扫各页 .fb-seal 里的字，缺哪个就从 hanzi-writer-data 取来，
// 压成 { s: 笔画轮廓, m: 笔画中线 } 存到 static/fabao/strokes/<码位十六进制>.json。
// 数据源：hanzi-writer-data 2.0.1（https://github.com/chanind/hanzi-writer-data），
// 出自 Make Me a Hanzi（https://github.com/skishore/makemeahanzi），按 Arphic Public License 发布，
// 许可全文随数据放在 static/fabao/strokes/ARPHICPL.TXT。
// 用法：node scripts/seal/gen-strokes.js [另加的字…]      （走 curl，好走环境里的代理）
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..'), STATIC = path.join(ROOT, 'static'), OUT = path.join(STATIC, 'fabao', 'strokes');
const VER = '2.0.1', CDN = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@${VER}/`;

function pages(dir, depth) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && depth > 0 && e.name !== 'img') out = out.concat(pages(p, depth - 1));
    else if (e.isFile() && e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const chars = new Set(process.argv.slice(2).join('').split('').filter(c => /\p{Script=Han}/u.test(c)));
for (const f of pages(STATIC, 2)) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/class="fb-seal"[^>]*>\s*([^<\s])\s*</g)) chars.add(m[1]);
}
fs.mkdirSync(OUT, { recursive: true });
let got = 0, had = 0, miss = [];
for (const ch of [...chars].sort()) {
  const file = path.join(OUT, ch.codePointAt(0).toString(16) + '.json');
  if (fs.existsSync(file)) { had++; continue; }
  let raw;
  try { raw = execFileSync('curl', ['-sSf', CDN + encodeURIComponent(ch) + '.json'], { encoding: 'utf8' }); }
  catch (e) { miss.push(ch); continue; }
  const d = JSON.parse(raw);
  if (!Array.isArray(d.strokes) || !Array.isArray(d.medians) || d.strokes.length !== d.medians.length) { miss.push(ch); continue; }
  fs.writeFileSync(file, JSON.stringify({ c: ch, s: d.strokes, m: d.medians }));
  got++;
}
const lic = path.join(OUT, 'ARPHICPL.TXT');
if (!fs.existsSync(lic)) fs.writeFileSync(lic, execFileSync('curl', ['-sSf', CDN + 'ARPHICPL.TXT'], { encoding: 'utf8' }));
console.log(`笔画：新取 ${got} 字，已有 ${had} 字${miss.length ? '，没取到：' + miss.join('') : ''}`);
console.log('字：' + [...chars].sort().join(''));
process.exit(miss.length ? 1 : 0);
