#!/usr/bin/env node
// 给法宝库各件（static/*/index.html，静态页，不经 Hugo）补上分享与收录用的头信息：
// canonical（带 ?t= 等参数的网址都归到本页）、og:title/description/url/image、twitter:card。
// 没有这些，链接贴到微信、X、Telegram 里只有一行光秃秃的网址。
// 标题与简介直接取各页自己的 <title> 与 description；口令页（noindex）不动。
// 用法：node scripts/seo/tool-meta.js          写回各页
//       node scripts/seo/tool-meta.js --check  只检查是否最新（不最新时退出码 1）
'use strict';
const fs = require('fs'), path = require('path');
const STATIC = path.join(__dirname, '..', '..', 'static');
const SITE = 'https://ohwowbill.com', IMG = SITE + '/img/og-card.jpg';
const check = process.argv.includes('--check');
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const BLOCK = /[ \t]*<!-- seo:begin[\s\S]*?<!-- seo:end -->\n?/;
let stale = 0, done = 0;
for (const d of fs.readdirSync(STATIC, { withFileTypes: true })) {
  const f = path.join(STATIC, d.name, 'index.html');
  if (!d.isDirectory() || !fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, 'utf8');
  if (/<meta name="robots"[^>]*noindex/.test(html)) continue;
  const title = (/<title>([^<]*)<\/title>/.exec(html) || [])[1];
  if (!title) { console.log('✗ 没有 <title>：', d.name); stale++; continue; }
  const desc = (/<meta name="description" content="([^"]*)"/.exec(html) || [])[1];
  const url = `${SITE}/${d.name}/`;
  const ind = (/^([ \t]*)<title>/m.exec(html) || [, ''])[1];
  const lines = [
    '<!-- seo:begin 由 scripts/seo/tool-meta.js 生成，勿手改 -->',
    `<link rel="canonical" href="${url}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="潜蛟阁" />',
    `<meta property="og:title" content="${esc(title)}" />`,
    desc ? `<meta property="og:description" content="${desc}" />` : null,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${IMG}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    '<!-- seo:end -->'
  ].filter(Boolean).map(l => ind + l).join('\n') + '\n';
  let next = html.replace(BLOCK, '');
  if (/rel="canonical"/.test(next)) {   // 页面自己写了一套（如 /tools/），不重复加
    if (next !== html) { stale++; if (!check) fs.writeFileSync(f, next); }
    done++; continue;
  }
  // 放在 description 之后；没有 description 的放在 <title> 之后
  const anchor = /^[ \t]*<meta name="description"[^>]*>\n/m.exec(next) || /^[ \t]*<title>[^<]*<\/title>\n/m.exec(next);
  next = next.slice(0, anchor.index + anchor[0].length) + lines + next.slice(anchor.index + anchor[0].length);
  if (next !== html) { stale++; if (!check) fs.writeFileSync(f, next); }
  done++;
}
if (check && stale) { console.log(`✗ ${stale} 个法宝页的头信息不是最新，跑一次 node scripts/seo/tool-meta.js`); process.exit(1); }
console.log(check ? `✓ ${done} 个法宝页的头信息最新` : `法宝页头信息：${done} 页，其中改写 ${stale} 页`);
