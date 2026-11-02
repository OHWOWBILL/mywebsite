/* =========================================================
   堪舆 · 玄空飞星与八宅
   ---------------------------------------------------------
   玄空（沈氏）：运星入中顺飞得运盘；坐、向两宫的运盘数各入中宫为山星、向星，
   顺逆看该数所在洛书宫里与坐山（或向首）同元龙之山的阴阳，阳顺阴逆；
   五黄入中无山可查，以坐山（或向首）本身的阴阳定顺逆。
   替卦：同上查出那座山，改以其替星（挨星诀）入中，顺逆仍依那座山的阴阳；五黄无替。
   八宅：三元男女命卦，按大游年歌排八方吉凶。

   浏览器里挂 window.KY；node 里 require 即得同一对象。
   ========================================================= */
(function (root) {
  'use strict';
  function mod(a, n) { return ((a % n) + n) % n; }
  var wrap = function (x) { return mod(x - 1, 9) + 1; };

  // 二十四山，子起顺时针；gua 为所在洛书宫数，yuan 元龙，yy 阳 1 / 阴 -1
  var SHAN = [
    ['子', 1, '天', -1], ['癸', 1, '人', -1], ['丑', 8, '地', -1], ['艮', 8, '天', 1], ['寅', 8, '人', 1],
    ['甲', 3, '地', 1], ['卯', 3, '天', -1], ['乙', 3, '人', -1], ['辰', 4, '地', -1], ['巽', 4, '天', 1], ['巳', 4, '人', 1],
    ['丙', 9, '地', 1], ['午', 9, '天', -1], ['丁', 9, '人', -1], ['未', 2, '地', -1], ['坤', 2, '天', 1], ['申', 2, '人', 1],
    ['庚', 7, '地', 1], ['酉', 7, '天', -1], ['辛', 7, '人', -1], ['戌', 6, '地', -1], ['乾', 6, '天', 1], ['亥', 6, '人', 1],
    ['壬', 1, '地', 1]
  ].map(function (r, i) { return { i: i, n: r[0], gua: r[1], yuan: r[2], yy: r[3], deg: i * 15 }; });
  var SHAN_BY = {}; SHAN.forEach(function (s) { SHAN_BY[s.n] = s; });

  // 挨星诀：子癸并甲申，贪狼一路行；壬卯乙未坤，五位为巨门；乾亥辰巽巳，连戌武曲名；酉辛丑艮丙，天星说破军；寅午庚丁上，右弼四星临
  var TI = {};
  [[1, '子癸甲申'], [2, '壬卯乙未坤'], [6, '乾亥辰巽巳戌'], [7, '酉辛丑艮丙'], [9, '寅午庚丁']].forEach(function (r) {
    r[1].split('').forEach(function (c) { TI[c] = r[0]; });
  });

  var PALACE = {
    1: { n: '坎', dir: '北' }, 2: { n: '坤', dir: '西南' }, 3: { n: '震', dir: '东' }, 4: { n: '巽', dir: '东南' }, 5: { n: '中', dir: '中' },
    6: { n: '乾', dir: '西北' }, 7: { n: '兑', dir: '西' }, 8: { n: '艮', dir: '东北' }, 9: { n: '离', dir: '南' }
  };
  var PATH = [5, 6, 7, 8, 9, 1, 2, 3, 4];          // 洛书飞行之序
  var STAR = [null,
    { n: '一白', s: '贪狼', wx: '水' }, { n: '二黑', s: '巨门', wx: '土' }, { n: '三碧', s: '禄存', wx: '木' },
    { n: '四绿', s: '文曲', wx: '木' }, { n: '五黄', s: '廉贞', wx: '土' }, { n: '六白', s: '武曲', wx: '金' },
    { n: '七赤', s: '破军', wx: '金' }, { n: '八白', s: '左辅', wx: '土' }, { n: '九紫', s: '右弼', wx: '火' }];

  // 中宫入 c，顺（1）或逆（-1）飞，得九宫数
  function fly(c, dir) {
    var out = {};
    PATH.forEach(function (p, k) { out[p] = wrap(c + dir * k); });
    return out;
  }

  // 度数 → 山、偏离、兼与空亡
  function shanAt(deg) {
    deg = mod(deg, 360);
    var i = Math.floor(mod(deg + 7.5, 360) / 15), s = SHAN[i];
    var off = mod(deg - s.deg + 180, 360) - 180;            // −7.5 … 7.5
    var next = SHAN[mod(i + (off >= 0 ? 1 : -1), 24)];
    var a = Math.abs(off);
    var kind = a <= 3 ? '正' : a <= 6 ? '兼' : (next.gua !== s.gua ? '大空亡' : '小空亡');
    return { shan: s, off: off, toward: next, kind: kind };
  }
  function opposite(s) { return SHAN[mod(s.i + 12, 24)]; }

  // 元运：三元九运，1864 年起每运二十年（以年计，立春换年由调用者处理）
  function yunOf(year) { return Math.floor(mod(year - 1864, 180) / 20) + 1; }
  var YUN_SPAN = function (n, ref) {             // 某运所在的二十年（离 ref 最近的一轮）
    var base = 1864 + (n - 1) * 20, k = Math.round((ref - base) / 180);
    return [base + k * 180, base + k * 180 + 19];
  };

  /* =========================================================
     起飞星盘
     zuo: 坐山名或山对象；yun: 元运 1–9；ti: true 用替卦
     ========================================================= */
  function chart(zuo, yun, ti) {
    var Z = typeof zuo === 'string' ? SHAN_BY[zuo] : zuo, X = opposite(Z);
    var yunPan = fly(yun, 1);
    function star(home) {                               // home 为坐山或向首
      var m = yunPan[home.gua];
      if (m === 5) return { center: 5, dir: home.yy, via: null, m: 5 };
      var via = SHAN.filter(function (s) { return s.gua === m && s.yuan === home.yuan; })[0];
      return { center: ti ? TI[via.n] : m, dir: via.yy, via: via, m: m };
    }
    var sa = star(Z), xa = star(X);
    var shan = fly(sa.center, sa.dir), xiang = fly(xa.center, xa.dir);
    var C = { zuo: Z, xiang: X, yun: yun, ti: !!ti, yunPan: yunPan, shan: shan, xiangPan: xiang, sa: sa, xa: xa, zp: Z.gua, xp: X.gua };
    C.ge = patterns(C);
    return C;
  }

  function patterns(C) {
    var n = C.yun, S = C.shan, X = C.xiangPan, Y = C.yunPan, zp = C.zp, xp = C.xp, out = [];
    var sAt = [], xAt = [];
    for (var p = 1; p <= 9; p++) { if (S[p] === n) sAt.push(p); if (X[p] === n) xAt.push(p); }
    var sz = S[zp] === n, sx = S[xp] === n, xx = X[xp] === n, xz = X[zp] === n;
    if (sz && xx) out.push({ k: '旺山旺向', good: true, d: '当运山星到坐、向星到向，丁财两旺之局。' });
    else if (sx && xz) out.push({ k: '上山下水', good: false, d: '当运山星飞到向首、向星飞到坐山，旺星颠倒，损丁破财之局；需以形势（坐空朝满）补救。' });
    else if (sx && xx) out.push({ k: '双星到向', good: null, d: '山向两旺星同到向首：向上见水旺财，见山旺丁，最喜向前山水兼有。' });
    else if (sz && xz) out.push({ k: '双星到坐', good: null, d: '山向两旺星同到坐山：坐后宜山亦宜水（坐后有水、水外有山）。' });
    else out.push({ k: '旺星', good: null, d: '当运山星在' + sAt.map(function (p) { return PALACE[p].n; }).join('、') + '宫，向星在' + xAt.map(function (p) { return PALACE[p].n; }).join('、') + '宫。' });
    var all = function (f) { for (var q = 1; q <= 9; q++) if (!f(q)) return false; return true; };
    if (all(function (q) { return S[q] + Y[q] === 10; })) out.push({ k: '山星合十', good: true, d: '九宫山星与运星皆合十，主人丁、通气。' });
    if (all(function (q) { return X[q] + Y[q] === 10; })) out.push({ k: '向星合十', good: true, d: '九宫向星与运星皆合十，主财禄、通气。' });
    var tri = function (a, b, c) { var g = [a % 3, b % 3, c % 3]; return g[0] === g[1] && g[1] === g[2]; };
    if (all(function (q) { return tri(S[q], X[q], Y[q]); })) out.push({ k: '父母三般卦', good: true, d: '每宫山、向、运三星同属一四七、二五八或三六九，气通三元。' });
    var lian = function (a, b, c) { var v = [a, b, c].sort(function (u, w) { return u - w; }); var s = v.join(''); return (v[1] === v[0] + 1 && v[2] === v[1] + 1) || s === '129' || s === '189'; };
    if (all(function (q) { return lian(S[q], X[q], Y[q]); })) out.push({ k: '连珠三般卦', good: true, d: '每宫三星相连（如三四五），气脉连珠。' });
    if (C.sa.center === 5) out.push({ k: C.sa.dir > 0 ? '山星伏吟' : '山星反吟', good: false, d: '五黄入中' + (C.sa.dir > 0 ? '顺飞，山星各回本宫' : '逆飞，山星各到对宫') + '，主人丁不安。' });
    if (C.xa.center === 5) out.push({ k: C.xa.dir > 0 ? '向星伏吟' : '向星反吟', good: false, d: '五黄入中' + (C.xa.dir > 0 ? '顺飞，向星各回本宫' : '逆飞，向星各到对宫') + '，主破财。' });
    return out;
  }

  // 当运旺衰：当令旺、未来生、过去退，余为死煞（五黄另标）
  function qiOf(star, yun) {
    if (star === yun) return '旺';
    if (star === wrap(yun + 1) || star === wrap(yun + 2)) return '生';
    if (star === wrap(yun - 1)) return '退';
    return star === 5 ? '煞' : '死';
  }

  // 常见星组（山星与向星同宫）
  var COMBO = {
    '14': '四一同宫：「四一同宫，准发科名之显」（《紫白诀》），主文名、科甲',
    '16': '一六共宗：金水相生，主文贵、官职',
    '19': '一九：水火合十，主中男中女交泰',
    '25': '二五交加：「二五交加，罹死亡并生疾病」（《紫白诀》），最忌',
    '23': '二三斗牛煞：主口舌是非、官讼',
    '28': '二八：土旺合十，主田产、财帛',
    '37': '三七相逢：主劫盗、官非、伤损',
    '67': '六七交剑煞：金金相战，主争斗、刀伤',
    '68': '六八：土金相生，主武贵、财富',
    '79': '九七合辙：「九七合辙，常招回禄之灾」（《紫白诀》），主火灾',
    '69': '九紫到乾六：「火照天门，必当吐血」（《玄空秘旨》），主肺病、长辈不安',
    '89': '八九：「八逢紫曜，婚喜重来」（《紫白诀》），主喜庆',
    '55': '五五：五黄重叠，最凶，主疾病灾祸'
  };
  function combo(a, b) { var k = [a, b].sort().join(''); return COMBO[k] || null; }

  // 流年、流月紫白（以立春、节换；调用者给干支年 Y 与月序 k：0 寅月 … 11 丑月）
  function yearStar(Y) { return mod(-(Y - 2026), 9) + 1; }        // 2026 丙午一白入中
  function monthStar(Y, k) {
    var z = mod(Y - 4, 12);                                         // 年支
    var start = [0, 6, 3, 9].indexOf(z) >= 0 ? 8 : [4, 10, 1, 7].indexOf(z) >= 0 ? 5 : 2;
    return wrap(start - k);
  }

  /* =========================================================
     八宅：命卦与游年
     ========================================================= */
  var GUA_NAME = { 1: '坎', 2: '坤', 3: '震', 4: '巽', 6: '乾', 7: '兑', 8: '艮', 9: '离' };
  var EAST = [1, 3, 4, 9];
  function mingGua(year, male) {
    var k = male ? wrap(1 - (year - 1864)) : wrap(5 + (year - 1864));
    if (k === 5) k = male ? 2 : 8;
    return { num: k, name: GUA_NAME[k], east: EAST.indexOf(k) >= 0 };
  }
  // 大游年歌：乾六天五祸绝延生，坎五天生延绝祸六，艮六绝祸生延天五，震延生祸绝五天六，
  //           巽天五六祸生绝延，离六五绝延祸生天，坤天延绝生祸五六，兑生祸延绝六五天
  var RING = [6, 1, 8, 3, 4, 9, 2, 7];             // 乾坎艮震巽离坤兑
  var GE = { 6: '六天五祸绝延生', 1: '五天生延绝祸六', 8: '六绝祸生延天五', 3: '延生祸绝五天六', 4: '天五六祸生绝延', 9: '六五绝延祸生天', 2: '天延绝生祸五六', 7: '生祸延绝六五天' };
  var YOU = { 生: ['生气', '吉'], 天: ['天医', '吉'], 延: ['延年', '吉'], 伏: ['伏位', '吉'], 祸: ['祸害', '凶'], 六: ['六煞', '凶'], 五: ['五鬼', '凶'], 绝: ['绝命', '凶'] };
  function youNian(g) {
    var out = {}, k = RING.indexOf(g), song = GE[g];
    out[g] = { name: '伏位', luck: '吉' };
    for (var j = 1; j < 8; j++) { var p = RING[(k + j) % 8], y = YOU[song[j - 1]]; out[p] = { name: y[0], luck: y[1] }; }
    return out;
  }

  var api = {
    SHAN: SHAN, SHAN_BY: SHAN_BY, TI: TI, PALACE: PALACE, PATH: PATH, STAR: STAR, GUA_NAME: GUA_NAME, COMBO: COMBO,
    fly: fly, shanAt: shanAt, opposite: opposite, yunOf: yunOf, yunSpan: YUN_SPAN, chart: chart, qiOf: qiOf, combo: combo,
    yearStar: yearStar, monthStar: monthStar, mingGua: mingGua, youNian: youNian, wrap: wrap, mod: mod
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KY = api;
})(this);
