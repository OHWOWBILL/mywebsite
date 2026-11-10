#!/usr/bin/env node
// 量一遍全站每一页实际用到哪些字、各用哪套字体，写到 scripts/fonts/usage.json，
// 供 scripts/fonts/pack.py 按用量打「字包」（见该脚本开头的说明）。
//
// 用法（仓库根目录）：
//   hugo --minify --buildFuture -b http://127.0.0.1:8123/ -d /tmp/qj-public
//   node scripts/fonts/usage.js /tmp/qj-public
//   python3 scripts/fonts/pack.py
// 需要 playwright（云端环境自带；本机 npx playwright install chromium 一次）。
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');

const PUB = path.resolve(process.argv[2] || 'public'), PORT = 8123;
const OUT = path.join(__dirname, 'usage.json');
const KEY = { 'Noto Serif SC': 'ns', 'LXGW WenKai TC': 'wk' };
const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', json: 'application/json', svg: 'image/svg+xml',
  png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', woff2: 'font/woff2', xml: 'application/xml', ico: 'image/x-icon', webmanifest: 'application/manifest+json' };

function walk(d, out) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (f.name === 'index.html' || (d === PUB && f.name === '404.html')) out.push(p);
  }
  return out;
}

(async () => {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(PUB, p);
    if (!f.startsWith(PUB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': MIME[path.extname(f).slice(1)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  }).listen(PORT, '127.0.0.1');

  const urls = walk(PUB, []).map(f => '/' + path.relative(PUB, f).split(path.sep).join('/').replace(/index\.html$/, '')).sort();
  // 法宝与首页的字随时辰、日子而变（日课、此刻起的卦、当日黄历）。把钟拨到几个固定的时刻各看一遍，
  // 量到的字才不偏在跑脚本的这一刻；时刻写死，是为了重跑时结果不变、字包文件不无故改名。
  const WHEN = ['2026-11-10T09:00:00+08:00', '2027-01-23T15:30:00+08:00', '2027-03-08T21:10:00+08:00',
    '2027-05-19T05:45:00+08:00', '2027-08-02T12:20:00+08:00', '2027-09-27T18:40:00+08:00'];
  const toolDirs = new Set(fs.readdirSync(PUB).filter(d => fs.existsSync(path.join(PUB, d, 'index.html')) && !fs.existsSync(path.join(PUB, d, 'index.xml'))));
  const dynamic = u => u === '/' || u === '/404.html' || toolDirs.has(u.split('/')[1]);
  const jobs = [];
  for (const u of urls) for (const t of dynamic(u) ? WHEN : WHEN.slice(0, 1)) jobs.push([u, t]);

  const browser = await chromium.launch();
  const sets = {};
  async function measure(u, when) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', timezoneId: 'Asia/Shanghai', locale: 'zh-CN' });
    const pg = await ctx.newPage();
    try {
      await pg.clock.install({ time: new Date(when) });
      await pg.goto(`http://127.0.0.1:${PORT}${u}`, { waitUntil: 'load', timeout: 30000 });
      await pg.waitForTimeout(1200);
      // 跳转页（aliases、/page/1/）不算：它们只是别处的影子，算进去会把「独有字」误当成「共用字」
      if (decodeURIComponent(new URL(pg.url()).pathname) !== u) return;
      // 不载 qj.css 的页（谚文自带 yz.css）不归这里管
      if (!(await pg.$('link[href^="/fonts/qj.css"]'))) return;
      const got = await pg.evaluate(() => {
        const m = {};
        const add = (el, txt, pseudo) => {
          const fam = getComputedStyle(el, pseudo).fontFamily.split(',')[0].replace(/["']/g, '').trim();
          const s = m[fam] || (m[fam] = new Set());
          for (const ch of txt) s.add(ch);
        };
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = w.nextNode())) {
          const el = n.parentElement;
          if (!n.textContent.trim() || !el || /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(el.tagName)) continue;
          add(el, n.textContent);
        }
        for (const el of document.querySelectorAll('input,textarea,option')) add(el, (el.placeholder || '') + (el.value || '') + (el.tagName === 'OPTION' ? el.textContent : ''));
        for (const el of document.querySelectorAll('body *')) for (const ps of ['::before', '::after']) {
          const c = getComputedStyle(el, ps).content;
          if (c && c !== 'none' && c !== 'normal' && c.length < 80) add(el, c.replace(/["']/g, ''), ps);
        }
        return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, [...v].join('')]));
      });
      const row = sets[u] || (sets[u] = { ns: new Set(), wk: new Set() });
      for (const fam in KEY) for (const ch of (got[fam] || '').replace(/\s/g, '')) row[KEY[fam]].add(ch);
    } catch (e) { console.log('✗', u, when, String(e).slice(0, 80)); }
    finally { await ctx.close(); }
  }
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => { while (next < jobs.length) { const j = jobs[next++]; await measure(j[0], j[1]); } }));
  const pages = {};
  for (const u of Object.keys(sets).sort()) pages[u] = { ns: [...sets[u].ns].sort().join(''), wk: [...sets[u].wk].sort().join('') };
  await browser.close(); server.close();
  fs.writeFileSync(OUT, JSON.stringify({ note: '由 scripts/fonts/usage.js 生成：每页各字体实际渲染到的字', pages }, null, 0) + '\n');
  console.log(`量了 ${Object.keys(pages).length} 页，写到 ${path.relative(process.cwd(), OUT)}`);
})();
