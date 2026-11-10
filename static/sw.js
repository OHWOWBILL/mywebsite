// =========================================================
// 潜蛟阁 · 离线（Service Worker，作用于全站）
// 法宝库各页与所用脚本先存一份：断网时照样起盘；联网时一律先走网络，拿到新的顺手把旧的换掉，
// 所以改版后不会卡在旧页上。网络迟迟不回（几秒）而手里有存档的，先拿存档顶上。
// 读过的文章页也顺手存下，断网可再读；图片除了图标不存（太占地方）。
// 谷歌字体按需分片，见到一片存一片（最多 400 片）。
// 下面的清单由 scripts/pwa/gen-sw.js 照各页引用的脚本生成，改了法宝重跑一次即可（版本号随内容变）。
// =========================================================
'use strict';
/* gen-sw:begin */
const V = 'fb-87e8fbcade41';
const PRE = [
  '/bazi/',
  '/changsheng/',
  '/dayan/',
  '/hepan/',
  '/huangli/',
  '/jinkou/',
  '/jiuxing/',
  '/kanyu/',
  '/lingqian/',
  '/liunian/',
  '/liuren/',
  '/liuyao/',
  '/meihua/',
  '/mingbu/',
  '/qimen/',
  '/taiyi/',
  '/tizhi/',
  '/tools/',
  '/xiangbu/',
  '/xingming/',
  '/xingpan/',
  '/yunqi/',
  '/zeri/',
  '/ziwei/',
  '/ziwu/',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/bazi/bazi.js?v=3',
  '/bazi/qiongtong.js?v=1',
  '/dayan/dayan.js?v=1',
  '/fabao/app.webmanifest',
  '/fabao/backup.js?v=1',
  '/fabao/cidian.js?v=1',
  '/fabao/cities.js?v=1',
  '/fabao/fabao.css?v=8',
  '/fabao/fabao.js?v=15',
  '/fabao/jieqi-se.js?v=1',
  '/fabao/kyureki.js?v=1',
  '/fabao/lunar.js?v=1',
  '/fabao/share.js?v=1',
  '/fabao/strokes/4e59.json',
  '/fabao/strokes/4e5d.json',
  '/fabao/strokes/516b.json',
  '/fabao/strokes/5386.json',
  '/fabao/strokes/5408.json',
  '/fabao/strokes/540d.json',
  '/fabao/strokes/58ec.json',
  '/fabao/strokes/5947.json',
  '/fabao/strokes/5c71.json',
  '/fabao/strokes/5e74.json',
  '/fabao/strokes/62e9.json',
  '/fabao/strokes/661f.json',
  '/fabao/strokes/672f.json',
  '/fabao/strokes/6885.json',
  '/fabao/strokes/6c14.json',
  '/fabao/strokes/6ce8.json',
  '/fabao/strokes/723b.json',
  '/fabao/strokes/751f.json',
  '/fabao/strokes/7981.json',
  '/fabao/strokes/7b7e.json',
  '/fabao/strokes/7d2b.json',
  '/fabao/strokes/84cd.json',
  '/fabao/strokes/8bc0.json',
  '/fabao/strokes/8d28.json',
  '/fabao/tongshu-hou.js?v=1',
  '/fabao/tongshu-shensha.js?v=1',
  '/fabao/tongshu-sky.js?v=1',
  '/fabao/tongshu.js?v=2',
  '/fabao/vendor/qrcode.js?v=1.4.4',
  '/fabao/wenti.js',
  '/favicon-32x32.png',
  '/fonts/qj.css?v=1',
  '/hepan/hepan.js?v=1',
  '/jinkou/jinkou.js?v=1',
  '/jiuxing/jiuxing.js?v=1',
  '/kanyu/kanyu.js?v=1',
  '/lingqian/data/guandi.js?v=1',
  '/lingqian/data/guanyin.js?v=1',
  '/lingqian/data/jiazi.js?v=1',
  '/lingqian/data/sensoji.js?v=1',
  '/lingqian/data/wongtaisin.js?v=1',
  '/lingqian/lingqian.js?v=1',
  '/liuren/liuren.js?v=1',
  '/liuyao/liuyao.js?v=1',
  '/meihua/data/hexagrams.js',
  '/meihua/data/hexagrams.js?v=3',
  '/meihua/data/yao_detail.json',
  '/meihua/data/yao.js',
  '/meihua/data/yao.js?v=3',
  '/meihua/js/app.js?v=7',
  '/meihua/styles/main.css?v=5',
  '/qimen/core.js?v=5',
  '/qimen/jieqi.js?v=1',
  '/taiyi/taiyi.js?v=1',
  '/tizhi/tizhi.js?v=1',
  '/xingming/data/kangxi.js?v=1',
  '/xingming/data/st.js?v=1',
  '/xingming/xingming.js?v=1',
  '/xingpan/xingpan.js?v=2',
  '/yunqi/yunqi.js?v=1',
  '/zeri/zeri.js?v=2',
  '/ziwei/iztro.min.js?v=2.6.3',
  '/ziwei/ziwei.js?v=2',
  '/ziwu/liuzhu.js?v=1'
];
/* gen-sw:end */
const FONTS = 'fb-fonts';
const KEEP = new Set(PRE);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V)
    .then(c => Promise.all(PRE.map(u => c.add(new Request(u, { cache: 'no-cache' })).catch(() => { /* 缺一件不碍事 */ }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.pathname === '/sw.js') return;
    // 自托管字体切片：文件名是内容摘要，永不变，先取存档
    if (url.pathname.startsWith('/fonts/f/')) return e.respondWith(fontFirst(req));
    e.respondWith(netFirst(req, url));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(fontFirst(req));
  }
});

// 先走网络；断网或迟迟不回时拿存档。页面按路径存（不带 ?参数，免得每一盘都存一份）
function netFirst(req, url) {
  const nav = req.mode === 'navigate';
  const key = nav ? url.origin + url.pathname : req;
  const media = /^(image|video|audio)$/.test(req.destination);
  const keep = !media || KEEP.has(url.pathname + url.search);
  return caches.open(V).then(c => new Promise((resolve, reject) => {
    let settled = false;
    const done = r => { if (!settled) { settled = true; resolve(r); } };
    const hit = () => c.match(key).then(r => r || c.match(req, { ignoreSearch: true }));
    const slow = setTimeout(() => { hit().then(r => { if (r) done(r); }); }, nav ? 3500 : 5000);
    fetch(req).then(res => {
      clearTimeout(slow);
      if (keep && res.ok && res.type === 'basic' && !res.redirected) c.put(key, res.clone()).catch(() => {});
      done(res);
    }, err => {
      clearTimeout(slow);
      hit().then(r => r || (nav ? c.match('/tools/') : null)).then(r => {
        if (r) done(r);
        else if (!settled) { settled = true; reject(err); }
      });
    });
  }));
}
// 字体：有就用存的，没有再取，取到存下
function fontFirst(req) {
  return caches.open(FONTS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') c.put(req, res.clone()).then(() => trim(c)).catch(() => {});
    return res;
  })));
}
function trim(c) {
  return c.keys().then(ks => (ks.length > 400 ? Promise.all(ks.slice(0, ks.length - 400).map(k => c.delete(k))) : null));
}
