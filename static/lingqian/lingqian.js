/* =========================================================
   灵签 · 掷筊、抽签、签号与文字 —— 只管算，不碰页面
   ---------------------------------------------------------
   口径
     · 掷筊：一片筊杯平面朝上为阳（1）、凸面朝上为阴（0），各半。
       一阴一阳为圣杯，两阳为笑杯，两阴为阴杯 → 圣杯 1/2、笑杯 1/4、阴杯 1/4。
     · 求签前须连得三次圣杯（闽台习俗）；中途出笑杯或阴杯，从头数起（Rite）。
       连得 k 次、每次机会 p 的平均掷数为 (1 − pᵏ) / ((1 − p) · pᵏ)；k = 3、p = 1/2 时为 14。
     · 抽签：每支签机会相同。随机数默认取 crypto.getRandomValues；给了种子（网址 ?seed=）
       就用 FNV-1a 散列种子、mulberry32 逐个生成，同一种子得同一串结果。
       取 [0, n) 用拒绝采样（丢掉 2³² 末尾不满一轮的部分），不偏向小号。
   浏览器里挂 window.LQ（需先载 data/*.js，它们挂在 window.LQ_DATA）；node 里 require 即得同一对象（自动载 data/*.js）。
   ========================================================= */
(function (root) {
  'use strict';
  var NODE = typeof module !== 'undefined' && module.exports;
  var ORDER = ['guanyin', 'guandi', 'jiazi', 'wongtaisin', 'sensoji'];
  var NODE_DATA = {};
  if (NODE) ORDER.forEach(function (id) { NODE_DATA[id] = require('./data/' + id + '.js'); });
  var src = function () { return NODE ? NODE_DATA : (root.LQ_DATA || {}); };

  /* —— 签种 —— */
  function sets() { var d = src(); return ORDER.filter(function (id) { return d[id]; }).map(function (id) { return d[id]; }); }
  function set(id) { return src()[id] || null; }
  function lot(id, n) {
    var D = set(id); n = +n;
    if (!D || !(n >= 1)) return null;
    var L = D.lots[n - 1];
    return L && L.n === n ? L : null;
  }

  /* —— 随机 —— */
  var U32 = 4294967296;
  function fnv1a(s) {
    var b = unescape(encodeURIComponent(String(s))), h = 0x811c9dc5;   // 按 UTF-8 字节散列
    for (var i = 0; i < b.length; i++) { h ^= b.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return (t ^ t >>> 14) >>> 0;
    };
  }
  // 固定种子：同一种子同一串 32 位整数
  function seeded(seed) { return mulberry32(fnv1a(seed)); }
  // 密码学随机数（浏览器、node 18+ 都有 crypto.getRandomValues）；实在没有才退回 Math.random
  function cryptoSource() {
    var g = typeof globalThis !== 'undefined' ? globalThis : root;
    var c = g.crypto && g.crypto.getRandomValues ? g.crypto : (NODE ? require('crypto').webcrypto : null);
    if (!c) return function () { return Math.floor(Math.random() * U32) >>> 0; };
    var buf = new Uint32Array(32), i = buf.length;
    return function () { if (i >= buf.length) { c.getRandomValues(buf); i = 0; } return buf[i++]; };
  }
  // [0, n) 的均匀整数：拒绝 ≥ lim 的值，lim 是 2³² 以下 n 的最大倍数
  function randInt(n, rnd) {
    if (!(n >= 1 && n <= U32 && n === Math.floor(n))) throw new RangeError('randInt: n = ' + n);
    var lim = U32 - U32 % n;
    for (var k = 0; k < 64; k++) { var u = rnd() >>> 0; if (u < lim) return u % n; }
    return (rnd() >>> 0) % n;   // 连拒 64 次（坏掉的来源）才到这里
  }

  /* —— 掷筊 —— */
  var FACE = ['阴', '阳'];   // 0 = 阴：凸面朝上；1 = 阳：平面朝上
  var KIND = {
    sheng: { name: '圣杯', alias: '圣筊', look: '一阴一阳', mean: '神明应允' },
    xiao: { name: '笑杯', alias: '笑筊', look: '两面皆阳（平面都朝上）', mean: '神明笑而不答：所问未清，或心意未定' },
    yin: { name: '阴杯', alias: '阴筊、盖杯', look: '两面皆阴（凸面都朝上）', mean: '神明未允：时机未到，或此事暂不宜' }
  };
  function kindOf(a, b) { return a !== b ? 'sheng' : a === 1 ? 'xiao' : 'yin'; }
  function toss(rnd) { var a = randInt(2, rnd), b = randInt(2, rnd); return { a: a, b: b, kind: kindOf(a, b) }; }
  // 四种落法各 1/4，合并成三种杯
  var P = (function () {
    var p = { sheng: 0, xiao: 0, yin: 0 };
    [0, 1].forEach(function (a) { [0, 1].forEach(function (b) { p[kindOf(a, b)] += 1 / 4; }); });
    return p;
  })();
  function expectedRun(k, p) { return (1 - Math.pow(p, k)) / ((1 - p) * Math.pow(p, k)); }
  // 三圣杯：push(杯) 返回是否已连得 need 次
  function Rite(need) {
    if (!(this instanceof Rite)) return new Rite(need);
    this.need = need || 3; this.streak = 0; this.tosses = 0; this.best = 0;
  }
  Rite.prototype.push = function (kind) {
    this.tosses++;
    this.streak = kind === 'sheng' ? this.streak + 1 : 0;
    if (this.streak > this.best) this.best = this.streak;
    return this.streak >= this.need;
  };
  Rite.prototype.done = function () { return this.streak >= this.need; };

  /* —— 抽签 —— */
  function draw(id, rnd) {
    var D = set(id);
    if (!D) throw new Error('没有这套签：' + id);
    return D.lots[randInt(D.lots.length, rnd)];
  }

  /* —— 签号、等级 —— */
  var DIG = '〇一二三四五六七八九';
  function cn(n) {
    n = +n;
    if (n === 100) return '一百';
    if (n < 10) return DIG[n];
    var t = Math.floor(n / 10), u = n % 10;
    return (t > 1 ? DIG[t] : '') + '十' + (u ? DIG[u] : '');
  }
  function label(D, n) { return '第' + cn(n) + (D.unit || '签'); }
  // 色调：top 金、good 绿、mid 平、bad 朱
  var TONE = {
    '上签': 'top', '大吉': 'top', '上上': 'top',
    '上吉': 'good', '中吉': 'good', '吉': 'good',
    '中签': 'mid', '中平': 'mid', '半吉': 'mid', '小吉': 'mid', '末小吉': 'mid', '末吉': 'mid', '平': 'mid',
    '下签': 'bad', '下下': 'bad', '凶': 'bad'
  };
  // 原签等级；六十甲子签原签不标，用本站所标的倾向
  function grade(D, L) { return D.scale ? L.g : L.t; }
  function tone(D, L) { return TONE[grade(D, L)] || 'mid'; }
  function scaleOf(D) { return D.scale || D.tones || []; }

  /* —— 文字（复制、问 AI 共用） —— */
  // extra = { q: 所问, when: '2026-11-04 15:30', how: '三圣杯后求得', ok: '掷筊确认：圣杯' }
  function text(D, L, extra) {
    extra = extra || {};
    var g = D.scale ? L.g : '倾向' + L.t + '（本站据诗意所标，原签不标等级）';
    var out = ['灵签 · ' + D.name + ' ' + label(D, L.n) + (L.gz ? '（' + L.gz + '）' : '') + ' · ' + g];
    if (L.s) out.push('典故：' + L.s);
    if (L.st && L.st.length) out.push('典故：' + L.st.join('；'));
    out.push('签诗：' + L.p.join('，') + '。');
    if (L.gua) out.push('卦象：' + L.gua + (L.el ? ' · ' + L.el : ''));
    if (L.it && L.it.length) out.push('断语（原签）：' + L.it.map(function (x) { return x[0] + ' ' + x[1]; }).join('；'));
    out.push('白话（本站解）：' + L.j);
    if (extra.q) out.push('所问：' + extra.q);
    var meta = [extra.when, extra.how, extra.ok].filter(Boolean).join(' · ');
    if (meta) out.push('求签：' + meta);
    return out.join('\n');
  }

  /* —— 求签记录（最新在前） —— */
  var HIST_MAX = 300;
  function histAdd(list, rec) { return [rec].concat(Array.isArray(list) ? list : []).slice(0, HIST_MAX); }
  function histRemove(list, i) { var l = Array.isArray(list) ? list.slice() : []; if (i >= 0 && i < l.length) l.splice(i, 1); return l; }
  function histClean(list) { return (Array.isArray(list) ? list : []).filter(function (r) { return r && typeof r.t === 'number' && lot(r.s, r.n); }); }

  /* —— 口径 —— */
  var RULES = [
    ['掷筊', '筊杯一对，平面朝上为阳，凸面朝上为阴。一阴一阳为「圣杯」，神明应允；两阳为「笑杯」，神明笑而不答，多是所问未清、心意未定；两阴为「阴杯」，神明未允，或时机未到。'],
    ['三圣杯', '照闽台宫庙的习俗，须连得三次圣杯才去抽签；中途出了笑杯或阴杯，从第一次重新数起。不想掷，可以「跳过仪式，直接抽」。'],
    ['机会', '本页把每片筊杯的阴阳看作各半（真筊杯一面平一面凸，并不均匀），所以圣杯 1/2、笑杯 1/4、阴杯 1/4；连得三圣杯平均要掷 14 次，头三掷就成的机会是 1/8。'],
    ['抽签', '签号用浏览器的密码学随机数（crypto.getRandomValues）抽，拒绝采样，每支签机会均等；摇签动画只是样子，签在落出那一刻才定。网址带 ?seed=… 时改用固定种子，同一种子抽出同一串结果，便于复现。'],
    ['签出确认', '台湾习俗签出后再掷一筊：圣杯即是这一支；不是圣杯，就把签放回签筒再摇。本页这一步可做可不做。浅草寺不掷筊，摇签筒得签号即取签。'],
    ['签诗', '五套都是古本：观音、浅草寺两套据几份公开转录互校，只取签诗、等级与典故名；关帝据清代刻本；六十甲子、黄大仙取自 MIT 开源整理本。逐套出处见下。'],
    ['白话', '「白话」是本站据诗意写的读法，不录寺庙或网站的现代解签。六十甲子签原签不标等级，页面上的「倾向」也是本站所标。'],
    ['一事一签', '一签只问一事，同一件事不宜反复求。签诗是古人的劝诫与比喻，可作参照；医疗、法律、钱财等大事，仍以实情与专业意见为准。']
  ];
  var RULES_TEXT = RULES.map(function (r) { return '· ' + r[0] + '：' + r[1]; }).join('\n');

  var api = {
    ORDER: ORDER, sets: sets, set: set, lot: lot,
    fnv1a: fnv1a, mulberry32: mulberry32, seeded: seeded, cryptoSource: cryptoSource, randInt: randInt,
    FACE: FACE, KIND: KIND, P: P, kindOf: kindOf, toss: toss, expectedRun: expectedRun, Rite: Rite,
    draw: draw, cn: cn, label: label, TONE: TONE, grade: grade, tone: tone, scaleOf: scaleOf, text: text,
    HIST_MAX: HIST_MAX, histAdd: histAdd, histRemove: histRemove, histClean: histClean,
    RULES: RULES, RULES_TEXT: RULES_TEXT
  };
  if (NODE) module.exports = api; else root.LQ = api;
})(this);
