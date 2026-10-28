// =========================================================
// 入阁 · 首页的另一种看法（layouts/index.html 的 #qj-ge）
// 把潜蛟阁画成一座山：自山门登阶，过门庭、藏经阁、诗亭、
// 琴台、法宝库，到阁顶书斋。点哪一处，就去哪一处。
//
// 线稿全由下面的部件函数现画，数量跟着站点数据走：
//   门庭的门 = data/wushu.toml 的门，书架 = data/sections.toml 的分区，
//   法宝库的宫灯 = 各门 tools（印为「禁」者贴符），书卷 = 文章数。
// 桌面一屏看全山（1440×900），手机纵向一卷（400×1560），两套排布共用部件。
// 构图照即梦参考图 A1：楼阁各坐一方山岩台地，一道宽石阶从驳岸直上阁顶，云雾带横过山腰。
// 线条用雾色，只有指到的那一处描金（一屏一处金）。
// 选择记在 localStorage qj-ge（'1' 入阁 / '0' 文字版），
// 网址带 ?ge=1 / ?ge=0 也行；首页 head 那段小脚本在画面出来前就读。
// =========================================================

(function () {
  'use strict';
  var box = document.getElementById('qj-ge');
  if (!box) return;
  var Q = window.QJ;
  var root = document.documentElement;
  var KEY = 'qj-ge';
  var D = {};
  try { D = JSON.parse(document.getElementById('qj-ge-data').textContent); } catch (e) {}
  var DOORS = D.doors || [], SHELVES = D.shelves || [], POSTS = D.posts || 0;
  var TOOLS = [], seen = {};
  (D.tools || []).forEach(function (t) { if (!seen[t.href]) { seen[t.href] = 1; TOOLS.push(t); } });
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');

  function han(n) { return Q && n < 100 ? Q.hanNum(n) : String(n); }
  function f(n) { return Math.round(n * 10) / 10; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // 固定种子的随机数：皴笔每次画出来都一样
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---------------- 部件 ----------------

  // 歇山顶：x 中心，y 檐口，w 檐宽，h 屋高；檐下一排斗拱
  function roof(x, y, w, h) {
    var L = x - w / 2, R = x + w / 2, t = w * .28;
    var d = 'M' + f(L - w * .06) + ',' + f(y - h * .32) + ' Q' + f(L + w * .1) + ',' + f(y + 1) + ' ' + f(L + w * .22) + ',' + f(y + 1) +
      ' L' + f(R - w * .22) + ',' + f(y + 1) + ' Q' + f(R - w * .1) + ',' + f(y + 1) + ' ' + f(R + w * .06) + ',' + f(y - h * .32) +
      ' Q' + f(R - w * .14) + ',' + f(y - h * .42) + ' ' + f(x + t) + ',' + f(y - h) + ' L' + f(x - t) + ',' + f(y - h) +
      ' Q' + f(L + w * .14) + ',' + f(y - h * .42) + ' ' + f(L - w * .06) + ',' + f(y - h * .32) + ' Z';
    var s = '<path class="ink fill" d="' + d + '"/>';
    // 瓦垄：一垄一道，从正脊斜落到檐口
    var n = Math.max(5, Math.round(w / 7)), tiles = '';
    for (var i = 1; i < n; i++) {
      var u = i / n, bx = L + w * .2 + w * .6 * u, tx = x - t + 2 * t * u;
      tiles += 'M' + f(tx) + ',' + f(y - h + 1.5) + ' L' + f(bx) + ',' + f(y - 1.5) + ' ';
    }
    // 两侧坡面也排几垄，顺着翼角收
    for (var e = 1; e < 4; e++) {
      var v = e / 4;
      tiles += 'M' + f(x - t - (w * .22) * v * .4) + ',' + f(y - h + h * .25 * v) + ' Q' + f(L + w * .14 * v) + ',' + f(y - h * .45) + ' ' + f(L + w * (.06 + .14 * v)) + ',' + f(y - h * .1 * (1 - v)) + ' ';
      tiles += 'M' + f(x + t + (w * .22) * v * .4) + ',' + f(y - h + h * .25 * v) + ' Q' + f(R - w * .14 * v) + ',' + f(y - h * .45) + ' ' + f(R - w * (.06 + .14 * v)) + ',' + f(y - h * .1 * (1 - v)) + ' ';
    }
    // 垂脊、檐口双线
    var ridge = 'M' + f(x - t) + ',' + f(y - h) + ' Q' + f(L + w * .16) + ',' + f(y - h * .5) + ' ' + f(L - w * .03) + ',' + f(y - h * .3) +
      ' M' + f(x + t) + ',' + f(y - h) + ' Q' + f(R - w * .16) + ',' + f(y - h * .5) + ' ' + f(R + w * .03) + ',' + f(y - h * .3) +
      ' M' + f(L + w * .2) + ',' + f(y - 2.2) + ' H' + f(R - w * .2);
    // 斗拱：檐下一攒一攒
    var m = Math.max(4, Math.round(w / 10)), dg = '';
    for (var j = 0; j <= m; j++) {
      var px = L + w * .2 + w * .6 * j / m;
      dg += 'M' + f(px - 2.6) + ',' + f(y + 2) + ' h5.2 M' + f(px - 1.6) + ',' + f(y + 4.4) + ' h3.2 M' + f(px) + ',' + f(y + 1) + ' v4.6 ';
    }
    s += '<path class="ink thin" d="' + tiles + '"/><path class="ink thin" d="' + ridge + '"/><path class="ink hair" d="' + dg + '"/>';
    s += '<path class="ink" d="M' + f(x - t) + ',' + f(y - h) + ' H' + f(x + t) + ' M' + f(x - t) + ',' + f(y - h) + ' q-3,-5 1,-7 M' + f(x + t) + ',' + f(y - h) + ' q3,-5 -1,-7"/>';
    return s;
  }
  // 一层屋身：底 y，宽 w，高 bh；cols 开间；lit 中间一扇亮灯，door 中间开门，rail 底下一道栏杆
  function body(x, y, w, bh, cols, o) {
    o = o || {};
    var L = x - w / 2, d = '', s = '<rect class="ink fill" x="' + f(L) + '" y="' + f(y - bh) + '" width="' + f(w) + '" height="' + f(bh) + '"/>';
    for (var i = 0; i <= cols; i++) { var cx = L + w * i / cols; d += 'M' + f(cx) + ',' + f(y - bh) + ' V' + f(y) + ' '; }
    d += 'M' + f(L) + ',' + f(y - bh + 4) + ' H' + f(L + w) + ' ';
    // 格扇窗棂
    for (var k = 0; k < cols; k++) {
      if ((o.door || o.lit) && k === Math.floor(cols / 2)) continue;
      var a = L + w * k / cols + 3, b = L + w * (k + 1) / cols - 3, top = y - bh + 8, bot = y - 4;
      if (b - a < 6 || bot - top < 8) continue;
      d += 'M' + f(a) + ',' + f(top + (bot - top) * .55) + ' H' + f(b) + ' ';
      for (var q = 1; q < 3; q++) d += 'M' + f(a + (b - a) * q / 3) + ',' + f(top) + ' V' + f(top + (bot - top) * .55) + ' ';
    }
    s += '<path class="ink thin" d="' + d + '"/>';
    var cw = w / cols;
    if (o.lit) s += '<rect class="lit" x="' + f(x - cw / 2 + 2) + '" y="' + f(y - bh + 7) + '" width="' + f(cw - 4) + '" height="' + f(bh - 10) + '"/>' +
      '<path class="ink thin" d="M' + f(x) + ',' + f(y - bh + 7) + ' V' + f(y - 3) + ' M' + f(x - cw / 2 + 2) + ',' + f(y - bh * .5) + ' H' + f(x + cw / 2 - 2) + '"/>';
    if (o.door) s += '<path class="ink" d="M' + f(x - cw / 2 + 2) + ',' + f(y) + ' V' + f(y - bh + 8) + ' H' + f(x + cw / 2 - 2) + ' V' + f(y) + ' M' + f(x) + ',' + f(y) + ' V' + f(y - bh + 8) + '"/>' +
      '<path class="ink hair" d="M' + f(x - 4) + ',' + f(y - bh * .45) + ' h2 M' + f(x + 2) + ',' + f(y - bh * .45) + ' h2"/>';
    if (o.rail) {
      var r = 'M' + f(L - 4) + ',' + f(y - 6) + ' H' + f(L + w + 4) + ' ';
      for (var z = 0; z <= cols * 3; z++) r += 'M' + f(L - 4 + (w + 8) * z / (cols * 3)) + ',' + f(y - 6) + ' V' + f(y) + ' ';
      s += '<path class="ink hair" d="' + r + '"/>';
    }
    return s;
  }
  function platform(x, y, w, h) {
    h = h || 6;
    var s = '<path class="ink fill" d="M' + f(x - w / 2) + ',' + f(y) + ' h' + f(w) + ' v' + h + ' h' + f(-w) + ' Z"/>';
    var d = '';
    for (var i = 1; i < 6; i++) d += 'M' + f(x - w / 2 + w * i / 6) + ',' + f(y) + ' v' + h + ' ';
    return s + '<path class="ink hair" d="' + d + '"/>';
  }
  // 台基上一圈栏杆：扶手、望柱、栏板
  // gap：正中留一段不拦（对着门、对着阶）
  function rail(x, y, w, h, n, gap) {
    var L = x - w / 2, g = (gap || 0) / 2, d = '';
    [[L, x - g], [x + g, L + w]].forEach(function (seg) {
      if (seg[1] - seg[0] < 4) return;
      var k = Math.max(1, Math.round(n * (seg[1] - seg[0]) / w));
      d += 'M' + f(seg[0]) + ',' + f(y - h) + ' H' + f(seg[1]) + ' M' + f(seg[0]) + ',' + f(y - h * .35) + ' H' + f(seg[1]) + ' ';
      for (var i = 0; i <= k; i++) d += 'M' + f(seg[0] + (seg[1] - seg[0]) * i / k) + ',' + f(y) + ' V' + f(y - h - 2) + ' ';
    });
    return '<path class="ink thin" d="' + d + '"/>';
  }
  function vtext(x, y, str, size, cls) {
    return Array.from(str).map(function (c, i) {
      return '<text class="' + (cls || 'v') + '" x="' + f(x) + '" y="' + f(y + size * (i + 1)) + '" font-size="' + f(size) + '" text-anchor="middle">' + esc(c) + '</text>';
    }).join('');
  }

  // 潜蛟阁：三层，平座栏杆，顶层书斋亮灯
  function ge(x, y, s) {
    var g = platform(x, y, 150 * s, 7 * s), yy = y;
    [[120, 34, 5], [96, 30, 4], [74, 28, 3]].forEach(function (fl, i) {
      var W = fl[0] * s, H = fl[1] * s;
      g += body(x, yy, W, H, fl[2], { door: i === 0, lit: i === 2, rail: i > 0 });
      g += roof(x, yy - H, W * 1.32, (i === 2 ? 30 : 18) * s);
      yy -= H + (i === 2 ? 0 : 14 * s);
    });
    g += '<path class="ink" d="M' + f(x) + ',' + f(yy - 30 * s) + ' v' + f(-16 * s) + '"/><circle class="ink fill" cx="' + f(x) + '" cy="' + f(yy - 48 * s) + '" r="' + f(2.5 * s) + '"/>';
    g += '<path class="ink hair" d="M' + f(x - 5 * s) + ',' + f(yy - 36 * s) + ' h' + f(10 * s) + ' M' + f(x - 3.5 * s) + ',' + f(yy - 40 * s) + ' h' + f(7 * s) + '"/>';
    // 阶
    var st = '';
    for (var i = 1; i < 4; i++) st += 'M' + f(x - 14 * s - i * 3) + ',' + f(y + 7 * s + i * 3) + ' h' + f(28 * s + i * 6) + ' ';
    return g + '<path class="ink hair" d="' + st + '"/>';
  }
  // 山门：三间四柱牌坊，正中竖匾
  function shanmen(x, y, s) {
    var W = 120 * s, H = 58 * s, g = '';
    var xs = [-.5, -.22, .22, .5].map(function (k) { return x + k * W; });
    g += '<path class="ink" d="' + xs.map(function (px) { return 'M' + f(px) + ',' + f(y) + ' V' + f(y - H); }).join(' ') + '"/>';
    g += xs.map(function (px) { return '<rect class="ink fill" x="' + f(px - 4 * s) + '" y="' + f(y - 7 * s) + '" width="' + f(8 * s) + '" height="' + f(7 * s) + '"/>'; }).join('');
    g += '<path class="ink" d="M' + f(xs[0] - 4) + ',' + f(y - H + 10 * s) + ' H' + f(xs[3] + 4) + ' M' + f(xs[0] - 4) + ',' + f(y - H + 16 * s) + ' H' + f(xs[3] + 4) + '"/>';
    g += roof(x, y - H - 2 * s, W * .56, 16 * s);
    g += roof((xs[0] + xs[1]) / 2, y - H + 8 * s, (xs[1] - xs[0]) * 1.4, 12 * s);
    g += roof((xs[2] + xs[3]) / 2, y - H + 8 * s, (xs[3] - xs[2]) * 1.4, 12 * s);
    g += '<rect class="ink fill" x="' + f(x - 8 * s) + '" y="' + f(y - H - 2 * s) + '" width="' + f(16 * s) + '" height="' + f(30 * s) + '"/>';
    g += vtext(x, y - H - 2 * s, '潜蛟阁', 8.5 * s, 'v plaque');
    var st = '';
    for (var i = 0; i < 5; i++) st += 'M' + f(x - W * .2 - i * 4 * s) + ',' + f(y + i * 4 * s) + ' h' + f(W * .4 + i * 8 * s) + ' ';
    return g + '<path class="ink thin" d="' + st + '"/>';
  }
  // 门庭：一道院墙，门数与门印跟 data/wushu.toml 走；没开的门贴封条
  function ting(x, y, s) {
    var n = Math.max(DOORS.length, 1), W = Math.max(240, 60 * n) * s, H = 54 * s;
    var g = '<rect class="ink fill" x="' + f(x - W / 2) + '" y="' + f(y - H) + '" width="' + f(W) + '" height="' + f(H) + '"/>';
    g += '<path class="ink fill" d="M' + f(x - W / 2 - 8 * s) + ',' + f(y - H) + ' L' + f(x - W / 2 + 4 * s) + ',' + f(y - H - 9 * s) + ' H' + f(x + W / 2 - 4 * s) + ' L' + f(x + W / 2 + 8 * s) + ',' + f(y - H) + ' Z"/>';
    var tiles = '';
    for (var i = 0; i <= 44; i++) tiles += 'M' + f(x - W / 2 + 4 * s + (W - 8 * s) * i / 44) + ',' + f(y - H - 9 * s) + ' v' + f(9 * s) + ' ';
    g += '<path class="ink thin" d="' + tiles + '"/>';
    // 墙面一皮皮条石，错缝砌
    var r = rng(23), sto = '', rows = 6, rh = (H - 4 * s) / rows;
    for (var k = 1; k < rows; k++) {
      var yy = y - H + 4 * s + rh * k;
      sto += 'M' + f(x - W / 2) + ',' + f(yy) + ' H' + f(x + W / 2) + ' ';
      for (var sx = x - W / 2 + (k % 2 ? 9 : 0) * s + r() * 6; sx < x + W / 2; sx += (16 + r() * 10) * s) sto += 'M' + f(sx) + ',' + f(yy) + ' v' + f(-rh) + ' ';
    }
    g += '<path class="ink hair" d="' + sto + '"/>';
    DOORS.forEach(function (d, i) {
      var dx = x - W / 2 + W * (i + .5) / n, dw = 26 * s, dh = 32 * s;
      g += '<path class="ink fill door" d="M' + f(dx - dw / 2) + ',' + f(y) + ' V' + f(y - dh + 8 * s) + ' Q' + f(dx) + ',' + f(y - dh - 4 * s) + ' ' + f(dx + dw / 2) + ',' + f(y - dh + 8 * s) + ' V' + f(y) + ' Z"/>';
      g += '<path class="ink thin" d="M' + f(dx) + ',' + f(y) + ' V' + f(y - dh + 2 * s) + ' M' + f(dx - dw / 2 - 3 * s) + ',' + f(y - dh + 8 * s) + ' Q' + f(dx) + ',' + f(y - dh - 10 * s) + ' ' + f(dx + dw / 2 + 3 * s) + ',' + f(y - dh + 8 * s) + '"/>';
      g += '<rect class="ink thin fill" x="' + f(dx - 8 * s) + '" y="' + f(y - dh - 19 * s) + '" width="' + f(16 * s) + '" height="' + f(15.5 * s) + '"/>';
      g += '<text class="seal" x="' + f(dx) + '" y="' + f(y - dh - 7.5 * s) + '" font-size="' + f(11 * s) + '" text-anchor="middle">' + esc(d.seal) + '</text>';
      if (d.shut) g += '<path class="fu" d="M' + f(dx - dw / 2 + 2) + ',' + f(y - dh * .55) + ' L' + f(dx + dw / 2 - 2) + ',' + f(y - dh * .3) + '"/>';
      else g += '<circle class="lamp" cx="' + f(dx + dw / 2 + 5 * s) + '" cy="' + f(y - dh * .55) + '" r="' + f(2 * s) + '"/>';
    });
    return g;
  }
  // 藏经阁：两层；楼下一架一区，架上书脊多少随该区文章数
  function cangjing(x, y, s) {
    var g = platform(x, y, 150 * s, 5 * s);
    g += body(x, y, 120 * s, 36 * s, 1);
    var n = Math.max(SHELVES.length, 1), W = 108 * s, cw = W / n;
    SHELVES.forEach(function (sh, i) {
      var px = x - W / 2 + cw * (i + .5), w = Math.min(cw - 3 * s, 12 * s), top = y - 30 * s;
      g += '<rect class="ink thin" x="' + f(px - w / 2) + '" y="' + f(top) + '" width="' + f(w) + '" height="' + f(25 * s) + '"/>';
      g += '<path class="ink hair" d="M' + f(px - w / 2) + ',' + f(top + 12.5 * s) + ' h' + f(w) + '"/>';
      var k = Math.min(sh.count || 0, 8), sp = '';
      for (var j = 0; j < k; j++) {
        var row = j < 4 ? 0 : 1, col = j % 4, bx = px - w / 2 + 1.5 + (w - 3) * (col + .5) / 4;
        sp += 'M' + f(bx) + ',' + f(top + 12.5 * s * (row + 1) - 1) + ' v' + f(-8 * s) + ' ';
      }
      g += '<path class="ink book" d="' + sp + '"><title>' + esc(sh.name + ' · ' + han(sh.count || 0) + '篇') + '</title></path>';
    });
    g += rail(x, y, 146 * s, 7 * s, 16, 22 * s);
    g += roof(x, y - 36 * s, 150 * s, 16 * s);
    g += body(x, y - 52 * s, 90 * s, 26 * s, 5, { rail: true });
    g += roof(x, y - 78 * s, 124 * s, 24 * s);
    return g;
  }
  // 法宝库：一殿，檐下一件法宝挂一盏宫灯，印为「禁」的贴符
  function fabao(x, y, s) {
    var g = platform(x, y, 150 * s, 5 * s);
    g += body(x, y, 116 * s, 40 * s, 4, { door: true });
    g += rail(x, y, 146 * s, 7 * s, 16, 32 * s);
    g += roof(x, y - 40 * s, 156 * s, 26 * s);
    var n = Math.max(TOOLS.length, 1), W = Math.min(140, 22 * n) * s;
    TOOLS.forEach(function (t, i) {
      var px = x - W / 2 + W * (i + .5) / n, py = y - 34 * s, lock = t.seal === '禁';
      g += '<g class="lantern-g"><title>' + esc(t.name) + '</title>';
      g += '<path class="ink thin" d="M' + f(px) + ',' + f(py - 8 * s) + ' v' + f(5 * s) + '"/>';
      g += '<ellipse class="lantern' + (lock ? ' locked' : '') + '" cx="' + f(px) + '" cy="' + f(py + 2 * s) + '" rx="' + f(4 * s) + '" ry="' + f(5.5 * s) + '"/>';
      g += lock ? '<path class="fu" d="M' + f(px) + ',' + f(py + 7.5 * s) + ' v' + f(9 * s) + '"/>' : '<path class="ink thin" d="M' + f(px) + ',' + f(py + 7.5 * s) + ' v' + f(4 * s) + '"/>';
      g += '</g>';
    });
    return g;
  }
  // 诗亭与碑
  function shiting(x, y, s) {
    var g = platform(x, y, 56 * s, 4 * s);
    g += '<path class="ink" d="M' + f(x - 20 * s) + ',' + f(y) + ' V' + f(y - 30 * s) + ' M' + f(x + 20 * s) + ',' + f(y) + ' V' + f(y - 30 * s) + ' M' + f(x - 8 * s) + ',' + f(y) + ' V' + f(y - 30 * s) + ' M' + f(x + 8 * s) + ',' + f(y) + ' V' + f(y - 30 * s) + '"/>';
    g += '<path class="ink thin" d="M' + f(x - 20 * s) + ',' + f(y - 9 * s) + ' H' + f(x + 20 * s) + ' M' + f(x - 20 * s) + ',' + f(y - 5 * s) + ' H' + f(x + 20 * s) + '"/>';
    g += '<path class="ink fill" d="M' + f(x - 34 * s) + ',' + f(y - 27 * s) + ' Q' + f(x - 14 * s) + ',' + f(y - 30 * s) + ' ' + f(x) + ',' + f(y - 58 * s) + ' Q' + f(x + 14 * s) + ',' + f(y - 30 * s) + ' ' + f(x + 34 * s) + ',' + f(y - 27 * s) + ' Q' + f(x) + ',' + f(y - 33 * s) + ' ' + f(x - 34 * s) + ',' + f(y - 27 * s) + ' Z"/>';
    g += '<path class="ink hair" d="M' + f(x) + ',' + f(y - 57 * s) + ' L' + f(x - 22 * s) + ',' + f(y - 29 * s) + ' M' + f(x) + ',' + f(y - 57 * s) + ' L' + f(x + 22 * s) + ',' + f(y - 29 * s) + ' M' + f(x) + ',' + f(y - 57 * s) + ' V' + f(y - 31 * s) + '"/>';
    g += '<path class="ink" d="M' + f(x) + ',' + f(y - 58 * s) + ' v' + f(-8 * s) + '"/>';
    var bx = x + 40 * s;
    g += '<path class="ink fill" d="M' + f(bx - 7 * s) + ',' + f(y + 4 * s) + ' V' + f(y - 30 * s) + ' Q' + f(bx) + ',' + f(y - 38 * s) + ' ' + f(bx + 7 * s) + ',' + f(y - 30 * s) + ' V' + f(y + 4 * s) + ' Z"/>';
    g += '<path class="ink thin" d="M' + f(bx - 2.5 * s) + ',' + f(y - 26 * s) + ' v' + f(24 * s) + ' M' + f(bx + 2.5 * s) + ',' + f(y - 26 * s) + ' v' + f(18 * s) + '"/>';
    return g;
  }
  // 琴台：一方平石，石上一张琴
  function qintai(x, y, s) {
    var g = '<path class="ink fill" d="M' + f(x - 44 * s) + ',' + f(y) + ' Q' + f(x - 40 * s) + ',' + f(y - 14 * s) + ' ' + f(x - 20 * s) + ',' + f(y - 15 * s) + ' H' + f(x + 26 * s) + ' Q' + f(x + 44 * s) + ',' + f(y - 13 * s) + ' ' + f(x + 46 * s) + ',' + f(y) + ' Z"/>';
    g += '<path class="ink thin" d="M' + f(x - 30 * s) + ',' + f(y - 6 * s) + ' q8,-3 16,0 M' + f(x + 10 * s) + ',' + f(y - 4 * s) + ' q10,-3 22,0"/>';
    g += '<path class="ink fill" d="M' + f(x - 30 * s) + ',' + f(y - 16 * s) + ' Q' + f(x - 32 * s) + ',' + f(y - 22 * s) + ' ' + f(x - 24 * s) + ',' + f(y - 22 * s) + ' H' + f(x + 28 * s) + ' Q' + f(x + 32 * s) + ',' + f(y - 20 * s) + ' ' + f(x + 28 * s) + ',' + f(y - 16 * s) + ' Z"/>';
    g += '<path class="ink thin strings" d="M' + f(x - 22 * s) + ',' + f(y - 20.5 * s) + ' H' + f(x + 26 * s) + ' M' + f(x - 22 * s) + ',' + f(y - 18.5 * s) + ' H' + f(x + 26 * s) + '"/>';
    var hui = '';
    for (var i = 0; i < 7; i++) hui += '<circle class="hui" cx="' + f(x - 16 * s + i * 6 * s) + '" cy="' + f(y - 17.2 * s) + '" r=".7"/>';
    return g + hui;
  }
  // 香案签筒
  function qiantong(x, y, s) {
    var g = '<path class="ink fill" d="M' + f(x - 22 * s) + ',' + f(y - 14 * s) + ' h' + f(44 * s) + ' v' + f(3 * s) + ' h' + f(-44 * s) + ' Z"/>';
    g += '<path class="ink" d="M' + f(x - 18 * s) + ',' + f(y - 11 * s) + ' V' + f(y) + ' M' + f(x + 18 * s) + ',' + f(y - 11 * s) + ' V' + f(y) + '"/>';
    g += '<path class="ink fill" d="M' + f(x - 6 * s) + ',' + f(y - 14 * s) + ' V' + f(y - 30 * s) + ' H' + f(x + 6 * s) + ' V' + f(y - 14 * s) + ' Z"/>';
    g += '<g class="sticks"><path class="ink thin" d="M' + f(x - 3 * s) + ',' + f(y - 30 * s) + ' l-2,-9 M' + f(x) + ',' + f(y - 30 * s) + ' v-11 M' + f(x + 3 * s) + ',' + f(y - 30 * s) + ' l2,-8"/></g>';
    g += '<path class="ink fill" d="M' + f(x + 11 * s) + ',' + f(y - 14 * s) + ' h' + f(7 * s) + ' l-1,-4 h' + f(-5 * s) + ' Z"/>';
    g += '<path class="ink hair smoke" d="M' + f(x + 14.5 * s) + ',' + f(y - 18 * s) + ' c-4,-8 6,-12 0,-22 c-4,-6 4,-10 2,-16"/>';
    return g;
  }
  // 问路石
  function wenlu(x, y, s) {
    var g = '<path class="ink fill" d="M' + f(x - 12 * s) + ',' + f(y) + ' Q' + f(x - 15 * s) + ',' + f(y - 30 * s) + ' ' + f(x - 4 * s) + ',' + f(y - 40 * s) + ' Q' + f(x + 8 * s) + ',' + f(y - 44 * s) + ' ' + f(x + 12 * s) + ',' + f(y - 28 * s) + ' Q' + f(x + 14 * s) + ',' + f(y - 10 * s) + ' ' + f(x + 12 * s) + ',' + f(y) + ' Z"/>';
    g += '<path class="ink hair" d="M' + f(x - 9 * s) + ',' + f(y - 6 * s) + ' q4,-3 8,-1 M' + f(x + 3 * s) + ',' + f(y - 34 * s) + ' q4,2 6,7"/>';
    return g + vtext(x, y - 37 * s, '问路', 9 * s, 'v carve');
  }
  // 渡口：栈桥从驳岸斜伸入水，桥尾泊一只乌篷船；k = 1 往左下伸，-1 往右下
  function dukou(x, y, s, k) {
    k = k || 1;
    var L = 70 * s, dx = -k * L * .55, dy = L * .8, w = 7 * s, bx = x + dx, by = y + dy, pl = '';
    var g = '<path class="ink fill" d="M' + f(x - w) + ',' + f(y) + ' L' + f(x + w) + ',' + f(y) + ' L' + f(bx + w) + ',' + f(by) + ' L' + f(bx - w) + ',' + f(by) + ' Z"/>', st = '';
    // 驳岸上开一道下水的石级
    for (var t = 0; t < 5; t++) st += 'M' + f(x - w - 3) + ',' + f(y - t * 5 * s) + ' h' + f(2 * w + 6) + ' ';
    g += '<path class="ink fill" d="M' + f(x - w - 3) + ',' + f(y) + ' V' + f(y - 24 * s) + ' H' + f(x + w + 3) + ' V' + f(y) + ' Z"/><path class="ink thin" d="' + st + '"/>';
    for (var i = 1; i < 12; i++) pl += 'M' + f(x - w + dx * i / 12) + ',' + f(y + dy * i / 12) + ' h' + f(2 * w) + ' ';
    for (var j = 1; j <= 3; j++) {
      var u = j / 3.2;
      pl += 'M' + f(x - w + dx * u) + ',' + f(y + dy * u) + ' v' + f(8 * s) + ' M' + f(x + w + dx * u) + ',' + f(y + dy * u) + ' v' + f(8 * s) + ' ';
    }
    g += '<path class="ink thin" d="' + pl + '"/>';
    var cx = bx - k * 26 * s, cy = by - 4 * s;
    g += '<g class="boat"><path class="ink fill" d="M' + f(cx - 30 * s) + ',' + f(cy - 4 * s) + ' Q' + f(cx) + ',' + f(cy + 9 * s) + ' ' + f(cx + 30 * s) + ',' + f(cy - 4 * s) + ' Q' + f(cx) + ',' + f(cy + 1 * s) + ' ' + f(cx - 30 * s) + ',' + f(cy - 4 * s) + ' Z"/>';
    g += '<path class="ink fill" d="M' + f(cx - 12 * s) + ',' + f(cy) + ' Q' + f(cx - 11 * s) + ',' + f(cy - 15 * s) + ' ' + f(cx) + ',' + f(cy - 15 * s) + ' Q' + f(cx + 11 * s) + ',' + f(cy - 15 * s) + ' ' + f(cx + 12 * s) + ',' + f(cy) + ' Z"/>';
    g += '<path class="ink hair" d="M' + f(cx - 6 * s) + ',' + f(cy - 13 * s) + ' V' + f(cy) + ' M' + f(cx) + ',' + f(cy - 15 * s) + ' V' + f(cy) + ' M' + f(cx + 6 * s) + ',' + f(cy - 13 * s) + ' V' + f(cy) + '"/>';
    g += '<path class="ink" d="M' + f(cx + 20 * s) + ',' + f(cy - 2 * s) + ' V' + f(cy - 26 * s) + '"/><path class="ink fill flag" d="M' + f(cx + 20 * s) + ',' + f(cy - 26 * s) + ' h' + f(10 * s) + ' l' + f(-2.5 * s) + ',' + f(4 * s) + ' l' + f(2.5 * s) + ',' + f(4 * s) + ' h' + f(-10 * s) + ' Z"/></g>';
    return g + '<path class="ink thin water" d="M' + f(cx - 40 * s) + ',' + f(cy + 8 * s) + ' q8,-3 16,0 t16,0 t16,0 t16,0 t16,0"/>';
  }
  // 白狐：伏着，尾巴圈到身前，两耳竖着
  function fox(x, y, s) {
    var d = 'M' + f(x - 12 * s) + ',' + f(y) + ' Q' + f(x - 13 * s) + ',' + f(y - 8 * s) + ' ' + f(x - 2 * s) + ',' + f(y - 8 * s) +
      ' Q' + f(x + 7 * s) + ',' + f(y - 8.5 * s) + ' ' + f(x + 10 * s) + ',' + f(y - 6 * s) +
      ' L' + f(x + 11.5 * s) + ',' + f(y - 11.5 * s) + ' L' + f(x + 13.5 * s) + ',' + f(y - 7.5 * s) +
      ' L' + f(x + 15.5 * s) + ',' + f(y - 11 * s) + ' L' + f(x + 15.8 * s) + ',' + f(y - 6.2 * s) +
      ' Q' + f(x + 20 * s) + ',' + f(y - 3 * s) + ' ' + f(x + 21.5 * s) + ',' + f(y - 1 * s) +
      ' Q' + f(x + 15 * s) + ',' + f(y + .5 * s) + ' ' + f(x + 10 * s) + ',' + f(y) + ' Z';
    var tail = 'M' + f(x - 11 * s) + ',' + f(y - 2 * s) + ' Q' + f(x - 23 * s) + ',' + f(y - 5 * s) + ' ' + f(x - 21 * s) + ',' + f(y + 1 * s) +
      ' Q' + f(x - 12 * s) + ',' + f(y + 4.5 * s) + ' ' + f(x + 3 * s) + ',' + f(y + 1 * s) + ' Q' + f(x - 8 * s) + ',' + f(y) + ' ' + f(x - 11 * s) + ',' + f(y - 2 * s) + ' Z';
    return '<path class="fox" d="' + d + '"/><path class="fox" d="' + tail + '"/><circle class="fox-eye" cx="' + f(x + 15.5 * s) + '" cy="' + f(y - 4 * s) + '" r="' + f(.7 * s) + '"/>';
  }
  // 崖上小门（内室）
  function xiaomen(x, y, s) {
    return '<path class="ink fill" d="M' + f(x - 6 * s) + ',' + f(y) + ' V' + f(y - 13 * s) + ' Q' + f(x) + ',' + f(y - 19 * s) + ' ' + f(x + 6 * s) + ',' + f(y - 13 * s) + ' V' + f(y) + ' Z"/><circle class="ink thin" cx="' + f(x + 3 * s) + '" cy="' + f(y - 6 * s) + '" r="' + f(1.2 * s) + '"/>';
  }
  // 松针一簇：上沿一串小弧，底边平；针从底心扇出去
  function tuft(cx, cy, w, s) {
    var n = Math.max(4, Math.round(w / (4.5 * s))), h = w * .42, top = [], d = 'M' + f(cx - w) + ',' + f(cy), nd = '';
    for (var i = 0; i <= n; i++) {
      var u = i / n * 2 - 1;
      top.push([cx + u * w, cy - h * Math.pow(Math.max(0, 1 - u * u), .55)]);
    }
    for (var j = 1; j <= n; j++) {
      var a = top[j - 1], b = top[j], rr = Math.hypot(b[0] - a[0], b[1] - a[1]) * .62;
      d += ' A' + f(rr) + ',' + f(rr) + ' 0 0 1 ' + f(b[0]) + ',' + f(b[1]);
    }
    d += ' Q' + f(cx) + ',' + f(cy + 2.5 * s) + ' ' + f(cx - w) + ',' + f(cy) + ' Z';
    top.forEach(function (p, k) { if (k % n) nd += 'M' + f(cx + (p[0] - cx) * .12) + ',' + f(cy) + ' L' + f(cx + (p[0] - cx) * .86) + ',' + f(cy + (p[1] - cy) * .86) + ' '; });
    return '<path class="ink thin fill" d="' + d + '"/><path class="ink hair" d="' + nd + '"/>';
  }
  function pine(x, y, s, fl) {
    fl = fl || 1;
    var g = '<path class="ink" d="M' + f(x) + ',' + f(y) + ' C' + f(x - 4 * s * fl) + ',' + f(y - 14 * s) + ' ' + f(x + 6 * s * fl) + ',' + f(y - 22 * s) + ' ' + f(x + 2 * s * fl) + ',' + f(y - 40 * s) +
      ' M' + f(x + 1 * s * fl) + ',' + f(y - 18 * s) + ' q' + f(-8 * s * fl) + ',' + f(-2 * s) + ' ' + f(-14 * s * fl) + ',' + f(-6 * s) +
      ' M' + f(x + 4 * s * fl) + ',' + f(y - 28 * s) + ' q' + f(8 * s * fl) + ',' + f(-2 * s) + ' ' + f(13 * s * fl) + ',' + f(-7 * s) + '"/>';
    [[-14, -23, 9], [13, -34, 9], [2, -43, 11]].forEach(function (c) { g += tuft(x + c[0] * s * fl, y + c[1] * s, c[2] * s, s); });
    return g;
  }
  // 琴台上那棵大松：双勾树干探出崖外，横出几枝，枝头一簇一簇松针
  function pineBig(x, y, s, k) {
    k = k || 1;
    function P(a, b) { return f(x + a * s * k) + ',' + f(y + b * s); }
    var t = 'M' + P(-4, 0) + ' C' + P(-9, -16) + ' ' + P(2, -26) + ' ' + P(-6, -42) + ' S' + P(-10, -60) + ' ' + P(-2, -72) +
      ' M' + P(4, 0) + ' C' + P(-1, -16) + ' ' + P(9, -26) + ' ' + P(1, -42) + ' S' + P(-4, -60) + ' ' + P(2, -72);
    var br = 'M' + P(-5, -30) + ' C' + P(-16, -30) + ' ' + P(-26, -38) + ' ' + P(-44, -36) +
      ' M' + P(-4, -32) + ' C' + P(-14, -36) + ' ' + P(-20, -44) + ' ' + P(-24, -48) +
      ' M' + P(0, -46) + ' C' + P(10, -48) + ' ' + P(20, -56) + ' ' + P(34, -56) +
      ' M' + P(-5, -56) + ' C' + P(-14, -60) + ' ' + P(-20, -66) + ' ' + P(-30, -68) +
      ' M' + P(0, -70) + ' C' + P(6, -74) + ' ' + P(12, -78) + ' ' + P(18, -78);
    var g = '<path class="ink fill" d="' + t + ' L' + P(-2, -72) + ' Z"/><path class="ink" d="' + br + '"/>', bark = '';
    for (var b = 1; b < 7; b++) bark += 'M' + P(-3 + (b % 2) * 2, -b * 9.5) + ' q' + f(2.5 * s * k) + ',' + f(-1.5 * s) + ' ' + f(4 * s * k) + ',' + f(.5 * s) + ' ';
    g += '<path class="ink hair" d="' + bark + '"/>';
    [[-46, -38, 15], [-26, -50, 11], [36, -58, 14], [-32, -70, 13], [-2, -76, 15], [20, -80, 11], [14, -64, 9]].forEach(function (c) {
      g += tuft(x + c[0] * s * k, y + c[1] * s, c[2] * s, s);
    });
    return g;
  }
  function beidou(x, y, s) {
    var P = [[0, 0], [22, 6], [40, 4], [56, 14], [64, 34], [88, 40], [92, 18]].map(function (a) { return [x + a[0] * s, y + a[1] * s]; });
    return '<path class="dou" d="M' + P.map(function (p) { return f(p[0]) + ',' + f(p[1]); }).join(' L') + ' L' + f(P[3][0]) + ',' + f(P[3][1]) + '"/>' +
      P.map(function (p, i) { return '<circle class="star" cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="' + (i === 0 ? 2.4 : 1.8) + '"/>'; }).join('');
  }
  // 月：按此刻月相画（QJ.moonPath），外面一圈淡淡的全轮
  function moon(x, y, r) {
    var p = Q ? Q.moonPath(Q.moon(new Date()).f, r) : 'M0,' + (-r) + 'A' + r + ',' + r + ' 0 1 0 0,' + r + 'A' + (r * .75) + ',' + r + ' 0 1 1 0,' + (-r) + 'Z';
    return '<g transform="translate(' + x + ',' + y + ')"><circle class="moon-o" r="' + r + '"/><path class="moon" d="' + p + '"/></g>';
  }
  // 祥云：一道长云脚，尾上打一个卷，卷前两道小弧；flip 往左卷
  function yun(x, y, s, flip) {
    var k = flip ? -1 : 1, len = 90 * s, r = 7 * s, ex = x + k * len;
    var sw = flip ? 1 : 0, d = 'M' + f(x) + ',' + f(y) + ' H' + f(ex);
    // 卷：半圈半圈往里收
    d += ' A' + f(r) + ',' + f(r) + ' 0 0 ' + sw + ' ' + f(ex) + ',' + f(y - 2 * r);
    d += ' A' + f(r * .7) + ',' + f(r * .7) + ' 0 0 ' + sw + ' ' + f(ex) + ',' + f(y - 2 * r + 1.4 * r);
    d += ' A' + f(r * .4) + ',' + f(r * .4) + ' 0 0 ' + sw + ' ' + f(ex) + ',' + f(y - 2 * r + 1.4 * r - .8 * r);
    // 云头两道弧
    var hx = ex - k * 2.6 * r;
    d += ' M' + f(hx) + ',' + f(y) + ' a' + f(r * 1.3) + ',' + f(r * 1.1) + ' 0 0 ' + (flip ? 0 : 1) + ' ' + f(-k * 2.4 * r) + ',' + f(-.2 * r);
    d += ' M' + f(hx - k * 2.6 * r) + ',' + f(y) + ' a' + f(r * .9) + ',' + f(r * .8) + ' 0 0 ' + (flip ? 0 : 1) + ' ' + f(-k * 1.6 * r) + ',' + f(-.1 * r);
    // 云脚下再拖一道短线
    d += ' M' + f(x + k * len * .25) + ',' + f(y + 4 * s) + ' H' + f(ex - k * r * 1.5);
    return '<path class="yun" d="' + d + '"/>';
  }
  // 远山：一道山脊折线，下面填满；脊下按坡向落几笔短皴
  function mountain(pts, H, cls, dens, seed) {
    var d = 'M' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' L') + ' L' + pts[pts.length - 1][0] + ',' + (H + 400) + ' L' + pts[0][0] + ',' + (H + 400) + ' Z';
    var r = rng(seed), cun = '';
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), n = Math.floor(len / dens);
      for (var j = 0; j < n; j++) {
        var u = (j + r()) / n, px = a[0] + dx * u, py = a[1] + dy * u + 3;
        var l = 6 + r() * 12, ang = Math.atan2(dy, dx) + (dy < 0 ? 1.15 : 1.95) + (r() - .5) * .3;
        cun += 'M' + f(px) + ',' + f(py) + ' l' + f(Math.cos(ang) * l) + ',' + f(Math.abs(Math.sin(ang)) * l) + ' ';
      }
    }
    return '<path class="mt ' + cls + '" d="' + d + '"/><path class="cun ' + cls + '" d="' + cun + '"/>';
  }
  // 山岩台地：顶上平，好让楼阁坐上去；两侧一团团岩块往外鼓、往下放宽，
  // 块与块之间一道岩缝，岩面顺坡落披麻皴。底边不描，用渐隐遮罩没进云雾里（mask 由 scene 给）
  function rock(x, top, w, h, seed, mask) {
    var r = rng(seed), hw = w / 2;
    function side(dir) {
      var n = Math.max(2, Math.round(h / 42)) + Math.floor(r() * 2), px = x + dir * hw * .96, py = top, segs = [];
      for (var i = 1; i <= n; i++) {
        var ny = top + h * (i - .25 * r()) / n, nx = x + dir * hw * (1 + .34 * i / n + (r() - .5) * .1);
        // 有的块鼓一点，有的直上直下，免得一排都像枕头
        var bulge = r() < .45 ? .045 + r() * .03 : .008 + r() * .015;
        var cx = Math.max(dir * px, dir * nx) * dir + dir * w * bulge, cy = py + (ny - py) * (.3 + r() * .4);
        segs.push([cx, cy, nx, ny, px, py]);
        // 岩块底下往里收一截，像下一块垫在底下
        if (i < n) { var ix = nx - dir * w * (.02 + r() * .07), iy = ny + 1 + r() * 6; segs.push(['L', 0, ix, iy, nx, ny]); px = ix; py = iy; }
        else { px = nx; py = ny; }
      }
      return segs;
    }
    function fwd(segs) { return segs.map(function (g) { return g[0] === 'L' ? ' L' + f(g[2]) + ',' + f(g[3]) : ' Q' + f(g[0]) + ',' + f(g[1]) + ' ' + f(g[2]) + ',' + f(g[3]); }).join(''); }
    function back(segs) { return segs.slice().reverse().map(function (g) { return g[0] === 'L' ? ' L' + f(g[4]) + ',' + f(g[5]) : ' Q' + f(g[0]) + ',' + f(g[1]) + ' ' + f(g[4]) + ',' + f(g[5]); }).join(''); }
    var Ls = side(-1), Rs = side(1), lb = Ls[Ls.length - 1], rb = Rs[Rs.length - 1];
    var outline = 'M' + f(lb[2]) + ',' + f(lb[3]) + back(Ls) + ' Q' + f(x - hw * .5) + ',' + f(top - 1.5) + ' ' + f(x) + ',' + f(top) + ' T' + f(x + hw * .96) + ',' + f(top) + fwd(Rs);
    // 岩缝：从每个收口往里拉一道弧
    var cun = '';
    [[Ls, -1], [Rs, 1]].forEach(function (pair) {
      pair[0].forEach(function (g) {
        if (g[0] !== 'L') return;
        var len = w * (.12 + r() * .16);
        cun += 'M' + f(g[2]) + ',' + f(g[3]) + ' q' + f(-pair[1] * len * .5) + ',' + f(-3 - r() * 4) + ' ' + f(-pair[1] * len) + ',' + f(2 + r() * 6) + ' ';
      });
    });
    // 披麻皴：长短几笔一束，略带波折，顺着坡往下往外撇
    var m = Math.round(w * h / 1900);
    for (var c = 0; c < m; c++) {
      var sy = top + 6 + r() * h * .7, lim = hw * (1 + .3 * (sy - top) / h) * .8, sx = x + (r() * 2 - 1) * lim, t = (sx - x) / hw;
      var l = 14 + r() * Math.min(40, h * .45), wv = (r() - .5) * 7, nb = 2 + Math.floor(r() * 3);
      for (var b = 0; b < nb; b++) {
        var ox = sx + b * (2.6 + r() * 1.6) * (t < 0 ? -1 : 1), oy = sy + b * 2, ll = l * (1 - b * .16);
        cun += 'M' + f(ox) + ',' + f(oy) + ' c' + f(wv) + ',' + f(ll * .3) + ' ' + f(t * ll * .5 - wv) + ',' + f(ll * .6) + ' ' + f(t * ll * .7) + ',' + f(ll) + ' ';
      }
    }
    return '<g class="rock" mask="url(#' + mask + ')"><path class="rock-f" d="' + outline + ' Z"/><path class="rock-c" d="' + cun + '"/><path class="rock-o" d="' + outline + '"/></g>';
  }
  // 石阶：两道阶沿，阶面一级一道横，外侧多一道阶墙；段与段折成之字
  function stairs(pts, w) {
    var face = '', side = '', step = '', hw = w / 2;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], k = b[0] > a[0] ? 1 : -1;
      face += 'M' + f(a[0] - hw) + ',' + f(a[1]) + ' L' + f(b[0] - hw) + ',' + f(b[1]) + ' L' + f(b[0] + hw) + ',' + f(b[1]) + ' L' + f(a[0] + hw) + ',' + f(a[1]) + ' Z ';
      side += 'M' + f(a[0] - hw) + ',' + f(a[1]) + ' L' + f(b[0] - hw) + ',' + f(b[1]) + ' M' + f(a[0] + hw) + ',' + f(a[1]) + ' L' + f(b[0] + hw) + ',' + f(b[1]) + ' ';
      // 阶墙：在往下那一侧再描一道，显出厚度
      side += 'M' + f(a[0] - k * (hw + 3)) + ',' + f(a[1] + 3) + ' L' + f(b[0] - k * (hw + 3)) + ',' + f(b[1] + 3) + ' ';
      var n = Math.floor(Math.abs(b[1] - a[1]) / 4.2);
      for (var j = 1; j < n; j++) { var u = j / n, px = a[0] + (b[0] - a[0]) * u, py = a[1] + (b[1] - a[1]) * u; step += 'M' + f(px - hw) + ',' + f(py) + ' h' + f(w) + ' '; }
    }
    // 转折处一方平台，免得折角像闪电
    var land = '';
    for (var q = 1; q < pts.length - 1; q++) {
      var p = pts[q];
      land += 'M' + f(p[0] - hw * 1.35) + ',' + f(p[1] - 3) + ' h' + f(w * 1.35) + ' v6 h' + f(-w * 1.35) + ' Z ';
    }
    return '<path class="stair" d="' + face + '"/><path class="steps" d="' + step + '"/><path class="stair-side" d="' + side + '"/>' +
      (land ? '<path class="stair land" d="' + land + '"/>' : '');
  }
  // 驳岸：山脚一道石砌岸，上沿两道压顶
  function bund(x0, x1, top, h, seed) {
    var r = rng(seed), rows = Math.max(2, Math.round(h / 10)), rh = h / rows, d = '';
    for (var i = 0; i < rows; i++) {
      var y = top + 4 + i * (h - 4) / rows, x = x0 - r() * 20, hh = (h - 4) / rows;
      while (x < x1) {
        var sw = 13 + r() * 15;
        d += 'M' + f(x + 1.5) + ',' + f(y + 1) + ' h' + f(sw - 3) + ' l1,' + f(hh - 2) + ' h' + f(-sw + 1) + ' Z ';
        x += sw;
      }
    }
    return '<rect class="bund" x="' + x0 + '" y="' + top + '" width="' + (x1 - x0) + '" height="' + h + '"/><path class="bund-st" d="' + d + '"/>' +
      '<path class="bund-top" d="M' + x0 + ',' + top + ' H' + x1 + ' M' + x0 + ',' + (top + 3) + ' H' + x1 + '"/>';
  }
  // 水：一行行短波纹
  function water(x0, x1, y0, y1, seed) {
    var r = rng(seed), d = '';
    for (var y = y0 + 7; y < y1; y += 8) {
      for (var x = x0 + r() * 40; x < x1; x += 45 + r() * 70) {
        var l = 12 + r() * 26;
        d += 'M' + f(x) + ',' + f(y + (r() - .5) * 2) + ' q' + f(l / 4) + ',-2 ' + f(l / 2) + ',0 t' + f(l / 2) + ',0 ';
      }
    }
    return '<path class="water" d="' + d + '"/>';
  }

  // 云雾：一团团糊开的雾，几团顶上再勾一道弧边，像参考图里那样上沿亮一点
  function mist(list, id) {
    var r = rng(41), blur = '', edge = '';
    list.forEach(function (m) {
      var n = 5 + Math.floor(m[2] / 90);
      for (var i = 0; i < n; i++) {
        var u = (i + .5) / n * 2 - 1, px = m[0] + u * m[2] * .85, rx = m[2] * (.22 + r() * .14), ry = m[3] * (.8 + r() * .8) * (1 - .4 * u * u);
        var py = m[1] - ry * .3 + (r() - .5) * m[3] * .4;
        blur += '<ellipse cx="' + f(px) + '" cy="' + f(py) + '" rx="' + f(rx) + '" ry="' + f(ry) + '"/>';
        if (Math.abs(u) < .6 && r() < .7) edge += 'M' + f(px - rx * .7) + ',' + f(py + ry * .15) + ' Q' + f(px) + ',' + f(py - ry * 1.15) + ' ' + f(px + rx * .7) + ',' + f(py + ry * .15) + ' ';
      }
    });
    return '<g class="mist" filter="url(#ge-blur-' + id + ')">' + blur + '</g><path class="mist-l" d="' + edge + '"/>';
  }

  // 名牌：竖排一块签，签下一行小注（桌面悬停才出注，手机常显）
  function tag(x, y, name, note, s) {
    var size = 12 * s, h = size * Array.from(name).length + 10 * s, w = size + 9 * s;
    var g = '<rect class="tag" x="' + f(x - w / 2) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" rx="1.5"/>' + vtext(x, y + 3 * s, name, size, 'v name');
    if (note) g += '<text class="note" x="' + f(x) + '" y="' + f(y + h + 12 * s) + '" font-size="' + f(9.5 * s) + '" text-anchor="middle">' + esc(note) + '</text>';
    return g;
  }

  // ---------------- 场所 ----------------
  // id, 去处, 读屏名, 部件, 名牌 [名, 注], data-act（不跳页、就地做事的）
  function places(P, S, T) {
    var locked = TOOLS.filter(function (t) { return t.seal === '禁'; }).length;
    var shi = SHELVES.filter(function (x) { return x.seal === '文'; })[0];
    var yi = SHELVES.filter(function (x) { return x.seal === '异'; })[0];
    var row = [
      ['dou', '#', '北斗：看此刻天时', beidou(P.dou[0], P.dou[1], S), ['北斗', '此刻天时'], 'dou'],
      ['ge', '/about/', '潜蛟阁顶层书斋：阁主何人', ge(P.ge[0], P.ge[1], P.ge[2]), ['书斋', '阁主何人']],
      ['fabao', '/tools/', '法宝库：' + han(TOOLS.length) + '件法宝', fabao(P.fabao[0], P.fabao[1], S), ['法宝库', han(TOOLS.length) + '件' + (locked ? ' · ' + han(locked) + '件有禁制' : '')]],
      ['qin', '#', '琴台：轮换音律', qintai(P.qin[0], P.qin[1], S), ['琴台', '音律 关/磬/琴'], 'qin'],
      ['fox', yi ? '/posts/#sec-异' : '/posts/', '松下白狐：异闻', fox(P.fox[0], P.fox[1], S * 1.3), null],
      ['men', '#', '崖上小门', xiaomen(P.men[0], P.men[1], S), null, 'men'],
      ['cang', '/posts/', '藏经阁：万法归一，' + han(POSTS) + '篇', cangjing(P.cang[0], P.cang[1], S), ['藏经阁', han(SHELVES.length) + '架 ' + han(POSTS) + '卷']],
      ['shi', shi ? '/posts/#sec-文' : '/posts/', '诗亭：' + (shi ? shi.name : '词章'), shiting(P.shi[0], P.shi[1], S), ['诗亭', shi ? shi.name : '词章']],
      ['ting', '/wushu/', '五术门庭', ting(P.ting[0], P.ting[1], S), ['门庭', DOORS.map(function (d) { return d.seal; }).join('')]],
      ['qian', '#', '签筒：摇一支今日日签', qiantong(P.qian[0], P.qian[1], S), ['签筒', '摇一支日签'], 'qian'],
      ['shanmen', '/', '山门：出阁，回文字版', shanmen(P.shanmen[0], P.shanmen[1], S), ['山门', '出阁 · 回文字版'], 'out'],
      ['wenlu', '/seek/', '问路石：寻物', wenlu(P.wenlu[0], P.wenlu[1], S), ['寻物', '问路']],
      ['du', '/links/', '渡口：去处，各平台', dukou(P.du[0], P.du[1], S * P.du[2], 1), ['渡口', '去处 · 各平台']]
    ];
    return row.map(function (r, i) {
      var p = P[r[0]], t = r[4] ? tag(p[0] + p[p.length - 2], p[1] + p[p.length - 1], r[4][0], r[4][1], T) : '';
      return '<a class="ge-place" id="ge-' + r[0] + '" href="' + r[1] + '" aria-label="' + esc(r[2]) + '" data-i="' + i + '"' + (r[5] ? ' data-act="' + r[5] + '" role="button"' : '') + '>' +
        '<g class="draw" aria-hidden="true">' + r[3] + '</g>' + (t ? '<g aria-hidden="true">' + t + '</g>' : '') + '</a>';
    }).join('');
  }

  // ---------------- 排布 ----------------
  // 场所坐标 [x, y, 名牌横移, 名牌纵移]；阁、渡口多一个缩放。
  // rocks 是楼阁脚下的山岩台地 [x, 顶, 宽, 高]，big 是琴台大松，mist 是云雾带 [cx, cy, rx, ry]
  var DESK = {
    id: 'd', W: 1440, H: 900, s: 1.15, t: 1.4, sw: 24,
    ridges: [
      ['far', [[-380, 470], [-200, 400], [0, 420], [120, 330], [260, 370], [420, 250], [560, 180], [720, 90], [880, 170], [1030, 230], [1180, 320], [1320, 300], [1440, 360], [1620, 320], [1820, 400]], 46],
      ['mid', [[-380, 600], [-150, 540], [0, 560], [150, 500], [300, 460], [460, 400], [600, 330], [720, 300], [860, 340], [1000, 390], [1160, 430], [1300, 480], [1440, 470], [1620, 520], [1820, 500]], 34]
    ],
    rocks: [[720, 309, 300, 220], [1012, 486, 250, 130], [495, 436, 250, 100], [430, 626, 280, 120], [1065, 644, 220, 150], [720, 682, 420, 80]],
    big: [[420, 436, 1.2, 1]],
    yun: [[200, 400, 1.2], [1180, 440, 1.1, 1], [1330, 590, 1.2, 1], [80, 580, 1]],
    mist: [[480, 505, 300, 20], [1030, 590, 300, 22], [330, 700, 360, 22], [1120, 740, 360, 20], [720, 430, 220, 16]],
    path: [[720, 309], [762, 380], [692, 470], [758, 570], [720, 630], [720, 680], [746, 742], [720, 800]],
    pines: [[312, 626, 1.1, 1], [1160, 644, 1, -1], [905, 486, .9, 1], [858, 309, .9, -1], [540, 682, .8, 1]],
    bund: [-400, 1840, 800, 24],
    moon: [1260, 110, 26],
    p: {
      dou: [200, 90, 140, -20],
      ge: [720, 300, 1.25, 120, -235],
      fabao: [1010, 480, 125, -165],
      qin: [470, 432, -90, -110],
      fox: [552, 428],
      men: [1150, 720],
      cang: [430, 620, -150, -170],
      shi: [1060, 640, 90, -130],
      ting: [720, 680, -205, -75],
      qian: [860, 770, 55, -80],
      shanmen: [720, 800, -110, -95],
      wenlu: [1000, 800, 30, -115],
      du: [470, 824, .9, 62, -6]
    }
  };
  var MOB = {
    id: 'm', W: 400, H: 1560, s: 1, sw: 18,
    ridges: [
      ['far', [[-120, 540], [0, 520], [40, 430], [90, 470], [150, 330], [200, 250], [250, 320], [300, 300], [360, 420], [400, 380], [520, 430]], 34],
      ['mid', [[-120, 840], [0, 820], [30, 760], [80, 700], [130, 720], [180, 640], [240, 650], [300, 600], [350, 640], [400, 620], [520, 650]], 28]
    ],
    rocks: [[200, 477, 240, 190], [288, 715, 200, 100], [90, 795, 150, 90], [104, 1005, 200, 120], [312, 1013, 150, 130], [200, 1182, 380, 70], [275, 1268, 110, 60]],
    big: [[50, 795, 1, 1]],
    yun: [[10, 590, .8], [390, 610, .8, 1], [-10, 900, .7], [400, 880, .7, 1], [20, 1200, .7], [395, 1170, .7, 1]],
    mist: [[200, 640, 220, 26], [160, 880, 240, 24], [250, 1140, 260, 26], [180, 1345, 260, 22]],
    path: [[200, 477], [226, 560], [178, 680], [214, 800], [192, 900], [216, 1000], [196, 1080], [200, 1182], [224, 1260], [200, 1395]],
    pines: [[30, 1005, 1, 1], [378, 1013, .9, -1], [365, 715, .8, -1], [95, 477, .9, 1]],
    bund: [-60, 460, 1395, 36],
    moon: [330, 104, 20],
    p: {
      dou: [40, 96, 130, -10],
      ge: [200, 470, 1.05, 104, -240],
      fabao: [288, 712, 62, -152],
      qin: [95, 792, 55, -102],
      fox: [150, 790],
      men: [372, 1085],
      cang: [104, 1000, -74, -166],
      shi: [312, 1010, 60, -150],
      ting: [200, 1182, -165, -128],
      qian: [275, 1268, 60, -50],
      shanmen: [200, 1395, -110, -150],
      wenlu: [330, 1395, 0, -110],
      du: [140, 1431, 1, 50, 19]
    }
  };

  // 由远及近：月、远山、山岩、祥云、石阶、松、驳岸与水、云雾，最后才是场所
  function scene(L) {
    var id = L.id, B = L.bund, bg = moon(L.moon[0], L.moon[1], L.moon[2]);
    L.ridges.forEach(function (r, i) { bg += mountain(r[1], L.H, r[0], r[2], 7 + i * 13 + L.W); });
    L.rocks.slice().sort(function (a, b) { return a[1] - b[1]; }).forEach(function (r, i) { bg += rock(r[0], r[1], r[2], r[3], 31 + i * 17, 'ge-fade-' + id); });
    L.yun.forEach(function (y) { bg += yun(y[0], y[1], y[2], y[3]); });
    bg += stairs(L.path, L.sw);
    L.pines.forEach(function (p) { bg += pine(p[0], p[1], p[2], p[3]); });
    L.big.forEach(function (p) { bg += pineBig(p[0], p[1], p[2], p[3]); });
    bg += bund(B[0], B[1], B[2], B[3], 5) + water(B[0], B[1], B[2] + B[3], L.H + 60, 9);
    bg += mist(L.mist, id);
    return '<svg class="ge-svg ge-' + id + '" viewBox="0 0 ' + L.W + ' ' + L.H + '" preserveAspectRatio="xMidYMid meet" focusable="false"><defs>' +
      '<radialGradient id="ge-glow-' + id + '"><stop offset="0" stop-color="#EDEBF2" stop-opacity=".85"/><stop offset="1" stop-color="#EDEBF2" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ge-fg-' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>' +
      '<mask id="ge-fade-' + id + '" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#ge-fg-' + id + ')"/></mask>' +
      '<filter id="ge-blur-' + id + '" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="11"/></filter>' +
      '</defs><g aria-hidden="true">' + bg + '</g>' + places(L.p, L.s, L.t || L.s) + '</svg>';
  }

  // ---------------- 声与字 ----------------
  function ring(i, v) { if (window.qjYin && window.qjYin.ring) window.qjYin.ring(i, v); }
  var tip = null, tipT = 0;
  function say(text, el) {
    if (!tip) { tip = document.createElement('div'); tip.className = 'qj-ge-tip'; tip.setAttribute('role', 'status'); document.body.appendChild(tip); }
    var r = el.getBoundingClientRect();
    tip.textContent = text;
    tip.style.left = Math.min(Math.max(r.left + r.width / 2, 120), window.innerWidth - 120) + 'px';
    tip.style.top = Math.max(r.top - 12, 70) + 'px';
    tip.classList.add('on');
    clearTimeout(tipT);
    tipT = setTimeout(function () { tip.classList.remove('on'); }, 4200);
  }

  var ACTS = {
    dou: function (a) {
      if (!Q) return;
      var now = new Date(), jq = Q.jieqi(now), lu = Q.lunar(now), mo = Q.moon(now);
      say('此刻 · ' + (lu ? lu.text + ' · ' : '') + Q.dayGZ(now).name + '日' + Q.ZHI[Q.hourZhi(now)] + '时 · ' + jq.name + '第' + han(jq.day) + '日 · 月' + mo.name, a);
    },
    qin: function () {
      var b = Array.prototype.filter.call(document.querySelectorAll('.qj-yin-toggle'), function (x) { return x.offsetParent !== null; })[0];
      if (b) b.click();
    },
    qian: function (a) {
      var b = document.querySelector('.qj-rike-qian');
      if (b) b.click(); else say('今日签筒空了，换个时辰再来。', a);
    },
    men: function (a) { say('小门上了锁。锁上刻一行字：题在开发者工具的控制台里。', a); },
    out: function () { mode(false); }
  };

  // ---------------- 画与切换 ----------------
  var drawn = false;
  function draw() {
    if (drawn) return;
    drawn = true;
    var stage = box.querySelector('.qj-ge-stage');
    stage.innerHTML = scene(DESK) + scene(MOB);
    // 每处垫一块透明点按区，线稿之间的空隙也点得中
    stage.querySelectorAll('.ge-place').forEach(function (a) {
      var svg = a.ownerSVGElement;
      if (getComputedStyle(svg).display === 'none') return;
      pad(a);
    });
    stage.querySelectorAll('.ge-place').forEach(function (a) {
      var i = +a.dataset.i;
      a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') ring(i, .3); });
      a.addEventListener('focus', function () { if (!a.ownerSVGElement.querySelector('.ge-hit')) pad(a); });
    });
  }
  function pad(a) {
    if (a.querySelector('.ge-hit')) return;
    var b = a.getBBox(), r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.setAttribute('class', 'ge-hit');
    r.setAttribute('x', b.x - 6); r.setAttribute('y', b.y - 6);
    r.setAttribute('width', b.width + 12); r.setAttribute('height', b.height + 12);
    a.insertBefore(r, a.firstChild);
  }
  // 切了排布（转屏、拉窗）后，新露出来的那套补上点按区
  window.addEventListener('resize', function () {
    if (!drawn) return;
    box.querySelectorAll('.ge-svg').forEach(function (svg) {
      if (getComputedStyle(svg).display !== 'none') svg.querySelectorAll('.ge-place').forEach(pad);
    });
  });

  box.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.ge-place');
    if (!a) return;
    var act = a.dataset.act, i = +a.dataset.i;
    if (act) { e.preventDefault(); ring(i, .55); ACTS[act](a); return; }
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    e.preventDefault();
    ring(i, .55);
    a.classList.add('go');
    var href = a.getAttribute('href');
    setTimeout(function () { location.href = href; }, still.matches ? 0 : 260);
  });
  box.addEventListener('keydown', function (e) {
    var a = e.target.closest && e.target.closest('.ge-place[data-act]');
    if (a && e.key === ' ') { e.preventDefault(); a.click(); }
  });

  function mode(on, keep) {
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    root.classList.toggle('qj-ge-on', on);
    if (on) draw();
    if (!keep) {
      window.scrollTo(0, 0);
      var to = on ? box.querySelector('.qj-ge-out') : document.querySelector('.qj-ge-in');
      if (to) to.focus({ preventScroll: true });
    }
  }
  document.querySelectorAll('.qj-ge-in').forEach(function (b) { b.hidden = false; b.addEventListener('click', function () { mode(true); }); });
  box.querySelectorAll('.qj-ge-out').forEach(function (b) { b.addEventListener('click', function () { mode(false); }); });

  // 网址里的 ?ge= 已在 head 读过，这里抹掉，免得分享出去的链接一直带着
  try {
    var u = new URL(location.href);
    if (u.searchParams.has('ge')) { u.searchParams.delete('ge'); history.replaceState(null, '', u.pathname + u.search + u.hash); }
  } catch (e) {}
  if (root.classList.contains('qj-ge-on')) draw();
})();
