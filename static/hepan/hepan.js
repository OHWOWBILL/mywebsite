/* =========================================================
   合盘 · 核心
   ---------------------------------------------------------
   两人的生辰各起一盘八字（/bazi/bazi.js）与星盘（/xingpan/xingpan.js），
   命卦取堪舆（/kanyu/kanyu.js），只做两盘之间的比较：
     八字合婚：年支生肖、日干、日支（夫妻宫）、年柱纳音、五行互补、东西四命；
     星盘比较：两人日月水金火木土（都有出生时刻与地点时加上升）的交叉相位，
               日月、金火、月月、金金、日日、上升与日月几对另附白话。
   不读设备时区：时间一律按「出生地钟表时间 + 出生地时区」解读（同八字、星盘）。

   浏览器里挂 window.HP；node 里 require 即得同一对象。
   ========================================================= */
(function (root) {
  'use strict';
  var isNode = typeof module !== 'undefined' && module.exports;
  var BZ = isNode ? require('../bazi/bazi.js') : root.BZ;
  var XP = isNode ? require('../xingpan/xingpan.js') : root.XP;
  var KY = isNode ? require('../kanyu/kanyu.js') : root.KY;

  var GAN = BZ.GAN, ZHI = BZ.ZHI, SX = BZ.SX, WX = BZ.WX, GAN_WX = BZ.GAN_WX;
  var mod = BZ.mod;
  function key(a, b) { return a < b ? a + '-' + b : b + '-' + a; }
  function num(v) { return v === null || v === undefined || v === '' || !isFinite(+v) ? null : +v; }

  /* —— 地支关系（与 /bazi/bazi.js 同表）—— */
  var LIUHE = { '0-1': '土', '2-11': '木', '3-10': '火', '4-9': '金', '5-8': '水', '6-7': '土' };
  var SANHE = [[8, 0, 4, '申子辰水局'], [2, 6, 10, '寅午戌火局'], [5, 9, 1, '巳酉丑金局'], [11, 3, 7, '亥卯未木局']];
  var HAI = ['0-7', '1-6', '2-5', '3-4', '8-11', '9-10'];
  var PO = ['0-9', '3-6', '1-4', '7-10', '2-11', '5-8'];
  var XING = { '0-3': '子卯无礼之刑', '2-5': '寅巳无恩之刑', '5-8': '巳申无恩之刑', '2-8': '寅申无恩之刑', '1-10': '丑戌恃势之刑', '7-10': '戌未恃势之刑', '1-7': '丑未恃势之刑' };
  var ZIXING = [4, 6, 9, 11];                       // 辰午酉亥自刑
  // 一对兼有几种时取哪一种为主
  var ZHI_ORDER = ['六冲', '六合', '三合', '相刑', '相害', '相破', '同属'];
  function sanheOf(z) { for (var i = 0; i < SANHE.length; i++) if (SANHE[i].indexOf(z) >= 0 && SANHE[i].indexOf(z) < 3) return i; return -1; }

  // 两支之间：types 依 ZHI_ORDER 排；main 为主；word 为页面上的一个词
  function zhiRel(a, b) {
    var k = key(a, b), t = [], r = { a: a, b: b };
    if (a === b) {
      t.push('同属');
      if (ZIXING.indexOf(a) >= 0) { t.push('相刑'); r.xing = ZHI[a] + ZHI[a] + '自刑'; r.zixing = true; }
    } else {
      if (LIUHE[k]) { t.push('六合'); r.hua = LIUHE[k]; }
      if (sanheOf(a) === sanheOf(b)) { t.push('三合'); r.group = SANHE[sanheOf(a)][3]; }
      if (mod(a - b, 12) === 6) t.push('六冲');
      if (XING[k]) { t.push('相刑'); r.xing = XING[k]; }
      if (HAI.indexOf(k) >= 0) t.push('相害');
      if (PO.indexOf(k) >= 0) t.push('相破');
    }
    t.sort(function (x, y) { return ZHI_ORDER.indexOf(x) - ZHI_ORDER.indexOf(y); });
    r.types = t;
    r.main = t[0] || '无';
    r.word = r.zixing ? '自刑' : r.main;
    r.extra = t.slice(1).filter(function (x) { return x !== '同属'; });
    r.tone = r.main === '六合' || r.main === '三合' ? 'good' : r.main === '同属' && !r.zixing || r.main === '无' ? 'mid' : 'bad';
    return r;
  }

  /* —— 天干 —— */
  var GAN_HE = { '0-5': '土', '1-6': '金', '2-7': '水', '3-8': '木', '4-9': '火' };
  var GAN_CHONG = ['0-6', '1-7', '2-8', '3-9'];
  // 五行之间（a 对 b）：比和、a 生 b、b 生 a、a 克 b、b 克 a
  function wxRel(wa, wb) {
    if (wa === wb) return { main: '比和' };
    if (mod(wa + 1, 5) === wb) return { main: '相生', from: 'a' };
    if (mod(wb + 1, 5) === wa) return { main: '相生', from: 'b' };
    if (mod(wa + 2, 5) === wb) return { main: '相克', from: 'a' };
    return { main: '相克', from: 'b' };
  }
  function ganRel(a, b) {
    var k = key(a, b), r;
    if (GAN_HE[k]) r = { main: '五合', hua: GAN_HE[k], tone: 'good' };
    else if (GAN_CHONG.indexOf(k) >= 0) r = { main: '相冲', tone: 'bad' };
    else if (a === b) r = { main: '同干', tone: 'mid' };
    else { r = wxRel(GAN_WX[a], GAN_WX[b]); r.tone = 'mid'; }
    r.a = a; r.b = b;
    r.ssA = BZ.shishen(a, b);          // a 见 b
    r.ssB = BZ.shishen(b, a);          // b 见 a
    return r;
  }

  /* —— 纳音 —— */
  function nayinWx(idx) { var n = BZ.nayin(idx); return WX.indexOf(n.charAt(n.length - 1)); }
  function nayinRel(wa, wb) {
    var r = wxRel(wa, wb);
    r.tone = r.main === '相生' ? 'good' : r.main === '相克' ? 'bad' : 'mid';
    return r;
  }

  /* —— 五行力量：取八字 analyze 的权重；时辰不详则去掉时柱 —— */
  var CANG_W = { 1: [1], 2: [0.7, 0.3], 3: [0.6, 0.3, 0.1] };   // 同 bazi.js
  var r1 = function (x) { return Math.round(x * 10) / 10 + 0; };
  function weights(C, A, noTime) {
    var w = A.wuxing.map(function (x) { return x.weight; });
    if (noTime) {
      var h = C.pillars[3], cg = BZ.CANG[h.zhi];
      w[GAN_WX[h.gan]] -= 1;
      cg.forEach(function (g, j) { w[GAN_WX[g]] -= CANG_W[cg.length][j]; });
    }
    return w.map(r1);
  }
  function extremes(w) {
    var mx = Math.max.apply(null, w), mn = Math.min.apply(null, w), strong = [], weak = [];
    w.forEach(function (v, i) { if (Math.abs(v - mx) < 1e-9) strong.push(i); if (Math.abs(v - mn) < 1e-9) weak.push(i); });
    return { max: mx, min: mn, strong: strong, weak: weak };
  }
  var meet = function (x, y) { return x.some(function (i) { return y.indexOf(i) >= 0; }); };
  function wxBu(ea, eb) {
    var bA = meet(eb.strong, ea.weak), aB = meet(ea.strong, eb.weak);
    if (bA && aB) return { main: '互补', tone: 'good' };
    if (bA || aB) return { main: '单补', tone: 'good', by: bA ? 'b' : 'a' };
    if (meet(ea.weak, eb.weak)) return { main: '同缺', tone: 'mid', els: ea.weak.filter(function (i) { return eb.weak.indexOf(i) >= 0; }) };
    if (meet(ea.strong, eb.strong)) return { main: '同旺', tone: 'mid', els: ea.strong.filter(function (i) { return eb.strong.indexOf(i) >= 0; }) };
    return { main: '不补', tone: 'mid' };
  }

  /* —— 命卦：东西四命与游年 —— */
  var YOU_GLOSS = { 生气: '生机旺', 延年: '主和睦长久', 天医: '主扶持', 伏位: '主平稳', 祸害: '主口角', 六煞: '主是非', 五鬼: '主不和', 绝命: '最不宜' };
  function mingRel(ga, gb) {
    var y = KY.youNian(ga.num)[gb.num], same = ga.east === gb.east;
    return { main: same ? '同组' : '异组', tone: same ? 'good' : 'bad', you: y.name, luck: y.luck, gloss: YOU_GLOSS[y.name] };
  }

  /* —— 星盘 —— */
  var IDS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
  var BODY = { asc: { id: 'asc', n: '上升', g: 'Asc' } };
  XP.BODIES.forEach(function (b) { BODY[b.id] = b; });
  // 两人之间只取主要相位，容许度用星盘那张表（合冲 8°，刑拱 7°，六合 5°），不另加日月
  function aspectOf(sep) {
    for (var i = 0; i < XP.ASPECTS.length; i++) {
      var as = XP.ASPECTS[i], orb = Math.abs(sep - as.a);
      if (orb <= as.orb + 1e-9) return { type: as, orb: orb };
    }
    return null;
  }
  function sepOf(x, y) { return Math.abs(mod(x - y + 180, 360) - 180); }
  function nature(a) { return a === 0 ? '合' : a === 90 ? '刑' : a === 180 ? '冲' : '和'; }
  var KEYP = { 'moon|sun': '日月', 'mars|venus': '金火', 'moon|moon': '月月', 'venus|venus': '金金', 'sun|sun': '日日', 'asc|sun': '升日', 'asc|moon': '升月' };
  var KEY_NAME = { 日月: '日月', 金火: '金火', 月月: '月月', 金金: '金金', 日日: '日日', 升日: '上升·日', 升月: '上升·月' };
  function keyPair(x, y) { return KEYP[[x, y].sort().join('|')] || null; }
  // 要紧几对的白话：[tone, 白话]；「和」为拱与六合
  var MEAN = {
    日月: { 合: ['good', '一方的太阳正照着另一方的月亮：志向与情感相合，最经典的伴侣相位'], 和: ['good', '性情与情感需要相投，相处自然，彼此照应'],
      刑: ['bad', '做事的方式与情感的需要错位，容易一方觉得不被体贴'], 冲: ['mid', '日月相望：互补又相吸，也容易拉扯，要彼此迁就'] },
    日日: { 合: ['good', '核心性格相近，志同道合；也可能谁都不肯退让'], 和: ['good', '气质相投，彼此欣赏，容易做成伙伴'],
      刑: ['bad', '意志方向不同，容易较劲，各自要留出空间'], 冲: ['mid', '性格两极，可互补互鉴，大事上易起分歧'] },
    月月: { 合: ['good', '情绪节奏相同，生活习惯合得来，像一家人'], 和: ['good', '情感需要相通，在一起放松、舒服'],
      刑: ['bad', '情绪需要不同，一个要静一个要闹，小摩擦多'], 冲: ['bad', '情感需要相反，容易误会对方的心情，要多说出口'] },
    金金: { 合: ['good', '审美与爱的方式相同，喜欢的东西差不多'], 和: ['good', '品味相投，相处愉快，懂得对方的好意'],
      刑: ['bad', '表达爱意的方式不同，品味、花钱上易有分歧'], 冲: ['mid', '喜好相反，既相互吸引又相互看不惯'] },
    金火: { 合: ['good', '强烈的吸引，火花四溅的激情相位'], 和: ['good', '吸引自然而和顺，亲密关系融洽'],
      刑: ['bad', '吸引强也易起摩擦，热情与争执一体两面'], 冲: ['mid', '相互吸引又相互挑动，激情与较劲并存'] },
    升日: { 合: ['good', '太阳落在对方上升：一见如故，认同感强'], 和: ['good', '性格与对方的外在气质相合，相处自在'],
      刑: ['bad', '行事风格与对方的自我表达相抵，初见不易投缘'], 冲: ['good', '太阳落在对方下降点（七宫头），常见于伴侣、搭档'] },
    升月: { 合: ['good', '月亮落在对方上升：亲切、有安全感'], 和: ['good', '情感与举止合拍，照顾得到彼此'],
      刑: ['bad', '情绪反应与对方的举止相冲，易觉得不被理解'], 冲: ['good', '月亮落在对方下降点，情感上自然视对方为伴'] }
  };

  function cross(PA, PB) {
    var asc = PA.asc != null && PB.asc != null;
    var ids = IDS.concat(asc ? ['asc'] : []), out = [];
    ids.forEach(function (x) {
      ids.forEach(function (y) {
        if (x === 'asc' && y === 'asc') return;
        var la = x === 'asc' ? PA.asc : PA.planets[x], lb = y === 'asc' ? PB.asc : PB.planets[y];
        var sep = sepOf(la, lb), m = aspectOf(sep);
        if (!m) return;
        var kp = keyPair(x, y), nat = nature(m.type.a), mean = kp ? MEAN[kp][nat] : null;
        out.push({
          a: x, b: y, sep: sep, type: m.type, orb: m.orb, nat: nat, key: kp,
          tone: mean ? mean[0] : nat === '刑' || nat === '冲' ? 'bad' : nat === '合' ? 'conj' : 'good',
          meaning: mean ? mean[1] : '',
          approx: (x === 'moon' && PA.noTime) || (y === 'moon' && PB.noTime)
        });
      });
    });
    return out.sort(function (p, q) { return p.orb - q.orb; });
  }

  /* =========================================================
     一个人：b = { when: 'YYYY-MM-DDTHH:MM'（出生地钟表时间）, male, name, tz, lon, lat, sun, dst }
     opt: { noTime: 时辰不详（按正午排，不排上升、时柱不计五行）, name: 称呼 }
     ========================================================= */
  function person(b, opt) {
    opt = opt || {};
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec((b && b.when) || '');
    if (!m) return { error: '生辰不全' };
    var y = +m[1], mo = +m[2], d = +m[3], h = +m[4], mi = +m[5], noTime = !!opt.noTime;
    if (noTime) { h = 12; mi = 0; }
    var tz = num(b.tz), lon = num(b.lon), lat = num(b.lat), male = b.male !== false, dst = !!b.dst;
    if (tz === null) tz = 8;
    if (y < 1900 || y > 2100) return { error: '只合 1900–2100 年' };
    var C = BZ.chart({ y: y, mo: mo, d: d, h: h, mi: mi, tz: tz, dst: dst, lon: b.sun && lon !== null && !noTime ? lon : null, zi: 'next', male: male });
    if (!C) return { error: '只合 1900–2100 年' };
    var A = BZ.analyze(C), w = weights(C, A, noTime);
    var P = XP.bodies(C.utc), planets = {};
    IDS.forEach(function (id) { planets[id] = P[id].lon; });
    var asc = !noTime && lat !== null && lon !== null && Math.abs(lat) < 90 ? XP.angles(C.utc, lat, lon).asc : null;
    // 时辰不详：月亮一日走十三度，列出当日可能的星座
    var moonSigns = [Math.floor(P.moon.lon / 30)];
    if (noTime) {
      var d0 = Date.UTC(y, mo - 1, d) - (dst ? 3600e3 : 0) - tz * 3600e3;
      var s0 = Math.floor(XP.bodies(d0).moon.lon / 30), s1 = Math.floor(XP.bodies(d0 + 86340000).moon.lon / 30);
      moonSigns = s0 === s1 ? [s0] : [s0, s1];
    }
    // 命卦以立春换年：年柱干支即所在之年
    var gy = mod(C.std.y - 1984, 60) === C.pillars[0].idx ? C.std.y : C.std.y - 1;
    var P0 = C.pillars;
    return {
      b: b, name: opt.name || b.name || '', male: male, noTime: noTime, C: C, A: A, pillars: P0,
      yz: P0[0].zhi, dg: P0[2].gan, dz: P0[2].zhi, sx: SX[P0[0].zhi],
      nayin: BZ.nayin(P0[0].idx), nayinWx: nayinWx(P0[0].idx),
      wx: w, ext: extremes(w), gy: gy, gua: KY.mingGua(gy, male),
      planets: planets, asc: asc, moonSigns: moonSigns,
      sunSign: Math.floor(planets.sun / 30), moonSign: Math.floor(planets.moon / 30), ascSign: asc === null ? null : Math.floor(asc / 30)
    };
  }

  /* =========================================================
     比较：rows 为八字合婚六项，aspects 为交叉相位，verdict 为一句总评
     每项：{ id, label, pair, word, tone: good|bad|mid, text, pos?, neg? }
     pos / neg：[优先序, 短语]，供总评挑选（数小者先）
     ========================================================= */
  var wxs = function (list) { return list.map(function (i) { return WX[i]; }).join(''); };
  function rowYear(PA, PB) {
    var r = zhiRel(PA.yz, PB.yz), za = ZHI[PA.yz], zb = ZHI[PB.yz], text;
    var also = r.extra.length ? '只是又带' + r.extra.map(function (x) { return x.slice(1); }).join('、') + '，合中有磨。' : '';
    switch (r.main) {
      case '六合': text = za + zb + '六合（合' + r.hua + '），生肖相合，脾性投契，旧称上等婚配。' + also; break;
      case '三合': text = '同在' + r.group + '，生肖三合，志趣相通、彼此扶持，旧称上等婚配。'; break;
      case '六冲': text = za + zb + '相冲' + (r.extra.length ? '又兼相刑' : '') + '，脾气与步调易相左，旧说合婚最忌。'; break;
      case '相刑': text = r.zixing ? '同属' + PA.sx + '，' + r.xing + '：性情太像，易各执己见。' : r.xing + (r.extra.length ? '，又兼' + r.extra.join('、') : '') + '：相处易因小事伤和气，说话宜留余地。'; break;
      case '相害': text = za + zb + '相害（六害）：易生误会与猜疑，凡事多沟通。'; break;
      case '相破': text = za + zb + '相破：小有磨损，影响不大。'; break;
      case '同属': text = '同属' + PA.sx + '，性情相近，平和无冲。'; break;
      default: text = '属' + PA.sx + '与属' + PB.sx + '不合不冲，生肖上不添助力，也无妨碍。';
    }
    var row = { id: 'year', label: '生肖', pair: za + PA.sx + ' × ' + zb + PB.sx, word: r.word, tone: r.tone, text: text, rel: r };
    if (r.main === '六合' || r.main === '三合') row.pos = [3, '生肖' + r.main];
    if (r.main === '六冲') row.neg = [2, '生肖相冲，遇事先缓一缓'];
    else if (r.main === '相刑' || r.main === '相害') row.neg = [6, '生肖' + r.word + '，小事别较真'];
    else if (r.main === '相破') row.neg = [11, '生肖相破，小磨小损'];
    return row;
  }
  function rowDayGan(PA, PB) {
    var r = ganRel(PA.dg, PB.dg), ga = GAN[PA.dg], gb = GAN[PB.dg], text;
    var fa = ga + WX[GAN_WX[PA.dg]], fb = gb + WX[GAN_WX[PB.dg]];
    var ss = '（' + ga + '见' + gb + '为' + r.ssA + '，' + gb + '见' + ga + '为' + r.ssB + '）';
    switch (r.main) {
      case '五合': text = ga + gb + '相合（合化' + r.hua + '）' + ss + '：日主五合，旧说夫妻最喜，彼此吸引、心意易通。'; break;
      case '相冲': text = ga + gb + '相冲：日主相冲，主见不同，遇事易各不相让。'; break;
      case '同干': text = '同为' + fa + '，日主相同，互为比肩：性情相似，可并肩也会较劲。'; break;
      case '比和': text = ga + gb + '同属' + WX[GAN_WX[PA.dg]] + '，互为劫财：气性相近，相帮也相争。'; break;
      case '相生': text = (r.from === 'a' ? fa + '生' + fb : fb + '生' + fa) + ss + '：一方多付出，一方多受惠。'; break;
      default: text = (r.from === 'a' ? fa + '克' + fb : fb + '克' + fa) + ss + '：一方管束、一方承受，宜互相体谅。';
    }
    var row = { id: 'dgan', label: '日干', pair: ga + WX[GAN_WX[PA.dg]] + ' × ' + gb + WX[GAN_WX[PB.dg]], word: r.main, tone: r.tone, text: text, rel: r };
    if (r.main === '五合') row.pos = [1, '日干相合'];
    if (r.main === '相冲') row.neg = [3, '日干相冲，主意常相左，多商量'];
    return row;
  }
  function rowDayZhi(PA, PB) {
    var r = zhiRel(PA.dz, PB.dz), za = ZHI[PA.dz], zb = ZHI[PB.dz], text;
    var also = r.extra.length ? '只是又带' + r.extra.map(function (x) { return x.slice(1); }).join('、') + '，合中有磨。' : '';
    switch (r.main) {
      case '六合': text = '日支' + za + zb + '六合：夫妻宫相合，情感亲密，最为相宜。' + also; break;
      case '三合': text = '日支同在' + r.group + '：夫妻宫三合，相处融洽。'; break;
      case '六冲': text = '日支' + za + zb + '相冲：夫妻宫相冲，旧说易争执、聚少离多，宜多让一步。'; break;
      case '相刑': text = r.zixing ? '日支同为' + za + '，' + r.xing + '：彼此太像，容易互不相让。' : '日支' + r.xing + '：夫妻宫相刑，言语易伤和气。'; break;
      case '相害': text = '日支' + za + zb + '相害：夫妻宫相害，易生隔阂，心里话要说出来。'; break;
      case '相破': text = '日支' + za + zb + '相破：夫妻宫小破，小磨小损。'; break;
      case '同属': text = '日支同为' + za + '：夫妻宫同气，习性相近。'; break;
      default: text = '日支' + za + '、' + zb + '不合不冲：夫妻宫平稳。';
    }
    var row = { id: 'dzhi', label: '日支', pair: PA.pillars[2].name + ' × ' + PB.pillars[2].name, word: r.word, tone: r.tone, text: text, rel: r };
    if (r.main === '六合' || r.main === '三合') row.pos = [2, '日支相合'];
    if (r.main === '六冲') row.neg = [1, '日支相冲，相处要多让一步'];
    else if (r.main === '相刑' || r.main === '相害') row.neg = [5, '日支' + r.word + '，说话多留余地'];
    else if (r.main === '相破') row.neg = [11, '日支相破，小磨小损'];
    return row;
  }
  function rowNayin(PA, PB) {
    var r = nayinRel(PA.nayinWx, PB.nayinWx), sa = PA.name + '的' + PA.nayin, sb = PB.name + '的' + PB.nayin, text;
    if (r.main === '比和') text = '同为' + WX[PA.nayinWx] + '命（' + PA.nayin + '、' + PB.nayin + '）：纳音比和，气味相投。';
    else {
      var x = r.from === 'a' ? sa : sb, yy = r.from === 'a' ? sb : sa;
      text = x + (r.main === '相生' ? '生' : '克') + yy + (r.main === '相生' ? '：年命纳音相生，根基相助。' : '：年命纳音相克，旧说需多包容。');
    }
    var row = { id: 'nayin', label: '纳音', pair: PA.nayin + ' × ' + PB.nayin, word: r.main, tone: r.tone, text: text, rel: r };
    if (r.main === '相生') row.pos = [7, '纳音相生'];
    if (r.main === '相克') row.neg = [7, '纳音相克，多些包容'];
    return row;
  }
  function rowWx(PA, PB) {
    var ea = PA.ext, eb = PB.ext, r = wxBu(ea, eb), na = PA.name, nb = PB.name, text;
    var wA = wxs(ea.weak), wB = wxs(eb.weak);
    var giveA = na + '最弱的' + wA + '正是' + nb + '所旺', giveB = nb + '最弱的' + wB + '正是' + na + '所旺';
    switch (r.main) {
      case '互补': text = giveA + '，' + giveB + '：五行互补。'; break;
      case '单补': text = r.by === 'b' ? giveA + '，补得上；' + nb + '最弱的' + wB + '，' + na + '却不旺。' : giveB + '，补得上；' + na + '最弱的' + wA + '，' + nb + '却不旺。'; break;
      case '同缺': text = '两人都以' + wxs(r.els) + '最弱，在一起补不上，宜从起居、方位外补。'; break;
      case '同旺': text = '两人都以' + wxs(r.els) + '最旺，同气相投，也一同偏' + wxs(r.els) + '；' + na + '弱' + wA + '、' + nb + '弱' + wB + '，彼此补不上。'; break;
      default: text = na + '最弱是' + wA + '、' + nb + '最弱是' + wB + '，对方都不以此为旺，谈不上互补。';
    }
    var row = { id: 'wx', label: '五行', pair: '', word: r.main, tone: r.tone, text: text, rel: r, wx: [PA.wx, PB.wx], ext: [ea, eb] };
    if (r.main === '互补') row.pos = [5, '五行互补'];
    if (r.main === '单补') row.pos = [8, '五行可补'];
    if (r.main === '同缺') row.neg = [13, '两人同缺' + wxs(r.els) + '，宜从外补'];
    return row;
  }
  function rowMing(PA, PB) {
    var ga = PA.gua, gb = PB.gua, r = mingRel(ga, gb), na = PA.name, nb = PB.name, text;
    var ew = function (g) { return g.east ? '东四' : '西四'; };
    if (r.main === '同组') text = na + ga.name + '命、' + nb + gb.name + '命，同为' + ew(ga) + '命；两卦游年为「' + r.you + '」（' + r.gloss + '），起居朝向可共取吉方。';
    else text = na + ga.name + '命（' + ew(ga) + '）、' + nb + gb.name + '命（' + ew(gb) + '），东西不同；两卦游年为「' + r.you + '」（' + r.gloss + '），择宅难两全，可各取本命吉方。';
    var row = { id: 'ming', label: '命卦', pair: ga.name + '（' + ew(ga) + '）× ' + gb.name + '（' + ew(gb) + '）', word: r.main, tone: r.tone, text: text, rel: r };
    if (r.main === '同组') row.pos = [9, '命卦同组'];
    else row.neg = [10, '命卦东西不同，择宅可各取吉方'];
    return row;
  }

  // 星盘要紧几对 → 总评短语
  var ASP_POS = { 日月: [4, { 合: '日月相合', 和: '日月相应' }], 金火: [6, { 合: '金火相吸', 和: '金火相吸' }], 月月: [10, { 合: '月亮同频', 和: '月亮相应' }],
    金金: [11, { 合: '金星相投', 和: '金星相投' }], 日日: [12, { 合: '太阳相投', 和: '太阳相投' }],
    升日: [13, { 合: '上升合太阳', 和: '上升应太阳', 冲: '太阳落伴侣位' }], 升月: [13, { 合: '上升合月亮', 和: '上升应月亮', 冲: '月亮落伴侣位' }] };
  var ASP_NEG = { 日月: [4, '日月相刑，节奏不同要互相迁就'], 金火: [8, '金火相刑，热情里也藏摩擦'], 月月: [9, '月亮相{n}，心情要多说出口'],
    金金: [12, '金星相刑，喜好不同多包容'], 日日: [12, '太阳相刑，各有主张要互相让'], 升日: [12, '上升刑太阳，初见未必投缘'], 升月: [12, '上升刑月亮，情绪易被误读'] };

  function compare(PA, PB) {
    var rows = [rowYear(PA, PB), rowDayGan(PA, PB), rowDayZhi(PA, PB), rowNayin(PA, PB), rowWx(PA, PB), rowMing(PA, PB)];
    var aspects = cross(PA, PB), keys = aspects.filter(function (x) { return x.key; });
    var t = { good: 0, bad: 0, mid: 0, bz: { good: 0, bad: 0, mid: 0 }, xp: { good: 0, bad: 0, mid: 0 } };
    rows.forEach(function (r) { t[r.tone]++; t.bz[r.tone]++; });
    keys.forEach(function (k) { t[k.tone]++; t.xp[k.tone]++; });
    return { A: PA, B: PB, rows: rows, aspects: aspects, keys: keys, tally: t, verdict: verdict(rows, keys, t) };
  }

  function overallOf(g, b) {
    if (!g && !b) return '不见大合，也不见大冲';
    if (g - b >= 3) return '底子相合';
    if (g > b) return '合多冲少';
    if (g === b) return '合冲参半';
    if (b - g >= 3) return '冲多合少，要多用心经营';
    return '冲略多于合';
  }
  function verdict(rows, keys, t) {
    var bzPos = [], xpPos = [], neg = [];
    rows.forEach(function (r) { if (r.pos) bzPos.push(r.pos); if (r.neg) neg.push(r.neg); });
    keys.forEach(function (k) {
      var p = ASP_POS[k.key], n = ASP_NEG[k.key];
      if (k.tone === 'good' && p && p[1][k.nat]) xpPos.push([p[0], p[1][k.nat]]);
      if (k.tone === 'bad' && n) neg.push([n[0], n[1].replace('{n}', k.nat)]);
    });
    var by = function (x, y) { return x[0] - y[0]; }, uniq = function (list) { var seen = {}; return list.filter(function (x) { if (seen[x[1]]) return false; seen[x[1]] = 1; return true; }); };
    bzPos = uniq(bzPos.sort(by)); xpPos = uniq(xpPos.sort(by)); neg = uniq(neg.sort(by));
    // 八字取二、星盘取一，哪边不够由另一边补足三条；显示时八字在前
    var nb = Math.min(bzPos.length, Math.max(2, 3 - xpPos.length)), nx = Math.min(xpPos.length, 3 - nb);
    var pos = bzPos.slice(0, nb).concat(xpPos.slice(0, nx)).map(function (x) { return x[1]; });
    var overall = overallOf(t.good, t.bad);
    var head = (pos.length ? pos.join('、') : '两盘少见明显的合') + '——' + overall;
    var tail = neg.length ? '留意' + neg[0][1] : t.bad ? '' : '少见冲克';
    return { pos: pos, overall: overall, neg: neg.map(function (x) { return x[1]; }), head: head, tail: tail, text: head + (tail ? '；' + tail : '') };
  }

  /* —— 纯文字：复制、问 AI 用 —— */
  var fmtOrb = function (o) { var d = Math.floor(o), m = Math.round((o - d) * 60); if (m === 60) { d++; m = 0; } return d + '°' + (m < 10 ? '0' : '') + m + '′'; };
  function signTxt(P) {
    return '太阳' + XP.SIGNS[P.sunSign] + ' · 月亮' + P.moonSigns.map(function (s) { return XP.SIGNS[s]; }).join('或') + (P.ascSign === null ? '' : ' · 上升' + XP.SIGNS[P.ascSign]);
  }
  function personTxt(P, place) {
    var w = P.b.when.replace('T', ' ');
    return P.name + '：' + (P.male ? '男' : '女') + ' ' + (P.noTime ? w.slice(0, 10) + ' 时辰不详' : w) + (P.b.dst ? '（夏令时）' : '') + (place ? ' ' + place : '') +
      ' · 四柱 ' + P.pillars.map(function (p, i) { return i === 3 && P.noTime ? '—' : p.name; }).join(' ') + ' · 属' + P.sx + ' · ' + signTxt(P);
  }
  function aspTxt(R, x) {
    return R.A.name + BODY[x.a].n + ' ' + x.type.n + ' ' + R.B.name + BODY[x.b].n + ' ' + fmtOrb(x.orb) + (x.approx ? '（约）' : '');
  }
  function toText(R, places) {
    places = places || [];
    var L = [], t = R.tally;
    L.push('合盘 · ' + R.A.name + ' × ' + R.B.name);
    L.push(personTxt(R.A, places[0]));
    L.push(personTxt(R.B, places[1]));
    L.push('总评（参考）：' + R.verdict.text);
    L.push('契合：合 ' + t.good + ' · 冲 ' + t.bad + ' · 平 ' + t.mid + '（八字六项 + 星盘要紧相位 ' + R.keys.length + ' 条）');
    L.push('');
    L.push('【八字合婚】');
    R.rows.forEach(function (r) {
      var pair = r.id === 'wx' ? R.A.name + ' ' + WX.map(function (n, i) { return n + R.A.wx[i]; }).join(' ') + ' / ' + R.B.name + ' ' + WX.map(function (n, i) { return n + R.B.wx[i]; }).join(' ') : r.pair;
      L.push(r.label + '：' + pair + ' —— ' + r.word + '。' + r.text);
    });
    L.push('');
    L.push('【星盘比较】' + (R.A.asc !== null && R.B.asc !== null ? '' : '（未计上升）'));
    if (!R.aspects.length) L.push('七政之间无主要相位');
    R.aspects.forEach(function (x) { L.push(aspTxt(R, x) + (x.key ? ' —— ' + x.meaning : '')); });
    return L.join('\n');
  }

  var RULES = [
    '生肖、日支：六合 子丑 寅亥 卯戌 辰酉 巳申 午未；三合 申子辰 寅午戌 巳酉丑 亥卯未（两人同在一组即算）；六冲 子午 丑未 寅申 卯酉 辰戌 巳亥；相刑 子卯、寅巳申、丑戌未，辰午酉亥自刑；相害 子未 丑午 寅巳 卯辰 申亥 酉戌；相破 子酉 卯午 丑辰 未戌 寅亥 巳申（与本库八字同表）。一对兼有几种时，按 冲＞合＞刑＞害＞破 取主，其余附注。',
    '日干：五合 甲己 乙庚 丙辛 丁壬 戊癸；相冲 甲庚 乙辛 丙壬 丁癸；其余只记生克与十神，不论吉凶。',
    '纳音：取两人年柱纳音五行，相生为吉，比和为平，相克为忌；纳音「相克反成」诸说不取。',
    '五行：力量照本库八字（天干各一，地支藏干本中余气 0.6 / 0.3 / 0.1，二藏 0.7 / 0.3），时辰不详者去掉时柱；最弱为所缺，最旺为所长，对方所长正是己之所缺即为补。不论旺衰用神。',
    '命卦：三元命卦，立春换年，男五寄坤、女五寄艮；坎离震巽为东四命，乾坤艮兑为西四命，同组为吉；游年按大游年歌。',
    '星盘：回归黄道，行星按 Schlyter 算法；两人日月水金火木土交叉相位，容许度 合、冲 8°，刑、拱 7°，六合 5°（两人之间不另加日月）；两人都有出生时刻与地点才加上升。要紧几对：日月、金火、月月、金金、日日、上升与日月。时辰不详者按正午排，月亮可差六七度，不排上升。',
    '契合：八字六项各计一次，星盘只计要紧几对的相位；合为相合、相生、互补与和谐相位，冲为冲刑害破、相克与刑冲相位。合多冲少只是粗看，仅供参考。'
  ];

  var api = {
    LIUHE: LIUHE, SANHE: SANHE, HAI: HAI, PO: PO, XING: XING, ZIXING: ZIXING, GAN_HE: GAN_HE, GAN_CHONG: GAN_CHONG,
    IDS: IDS, BODY: BODY, KEY_NAME: KEY_NAME, MEAN: MEAN, YOU_GLOSS: YOU_GLOSS, RULES: RULES,
    zhiRel: zhiRel, ganRel: ganRel, wxRel: wxRel, nayinWx: nayinWx, nayinRel: nayinRel, weights: weights, extremes: extremes, wxBu: wxBu,
    mingRel: mingRel, aspectOf: aspectOf, sepOf: sepOf, keyPair: keyPair, cross: cross, person: person, compare: compare,
    verdict: verdict, toText: toText, fmtOrb: fmtOrb, signTxt: signTxt
  };
  if (isNode) module.exports = api; else root.HP = api;
})(this);
