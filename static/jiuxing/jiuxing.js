/* =========================================================
   九星气学 · 本命星、月命星、年盘月盘与八方吉凶 —— 只管算，不碰页面
   ---------------------------------------------------------
   口径
     · 本命星：出生时刻（精确到分）落在哪个立春之后，就取那一干支年的年紫白（年盘中宫之星，KY.yearStar）。
     · 月命星：出生前最后交的「节」定月（寅月起），取该月的月紫白（月盘中宫之星，KY.monthStar）。
       出生时刻按生辰所记的时区（小时）换算；没记时区就按本机时区。夏令时扣回一小时。
     · 年盘、月盘：中宫星顺飞——乾 +1、兑 +2、艮 +3、离 +4、坎 +5、坤 +6、震 +7、巽 +8（KY.fly）。
       看某一天：年以立春、月以节换，交节当日整天算新月（同通书 TS.jieMonth）。
     · 凶方：五黄杀（五黄所在）、暗剑杀（五黄对宫；五黄入中则无）、岁破（年盘，年支对冲）/
       月破（月盘，月建对冲）、本命杀（本命星所在）、本命的杀（其对宫）、月命杀、月命的杀（同理）。
       本命星、月命星入中宫则无相应的杀。
     · 吉星：与本命星相生（生我为生气、我生为退气）或比和；五黄永不为吉，本命星自身也不算（那是本命杀）。
       吉方：方位上是吉星且无任何凶方；最大吉方：该星又是月命星的吉星。本命（月命）五黄者按土论。
     · 方位取八方各四十五度，只到方位，不分二十四山；不排日盘。
   浏览器里挂 window.JX（需先载 /qimen/jieqi.js、/fabao/lunar.js、/fabao/kyureki.js、/fabao/tongshu.js、/kanyu/kanyu.js）；
   node 里 require 即得同一对象。
   ========================================================= */
(function (root) {
  'use strict';
  var NODE = typeof module !== 'undefined' && module.exports;
  var KY = NODE ? require('../kanyu/kanyu.js') : root.KY;
  var J = NODE ? require('../qimen/jieqi.js') : root.QM_JIEQI;
  var TS = NODE ? require('../fabao/tongshu.js') : root.TS;
  var mod = KY.mod, DAY = 86400000;
  var GAN = '甲乙丙丁戊己庚辛壬癸', ZHI = '子丑寅卯辰巳午未申酉戌亥';

  /* —— 九星 —— */
  var STAR = [null,
    { n: '一白', full: '一白水星', wx: '水', home: 1, xiang: '坎 · 中男 · 冬',
      sketch: '外柔内刚，像水一样随形就势、善于适应；思虑深、能忍耐，人缘广却不轻易交心，韧性足，也容易多疑多虑。' },
    { n: '二黑', full: '二黑土星', wx: '土', home: 2, xiang: '坤 · 母 · 大地',
      sketch: '踏实勤恳，像大地一样包容、肯付出；重责任、守本分，最宜辅佐与长期经营，只是慢热，凡事过于谨慎。' },
    { n: '三碧', full: '三碧木星', wx: '木', home: 3, xiang: '震 · 长男 · 雷',
      sketch: '朝气蓬勃，如春雷乍响：行动快、点子多、直率敢言，开创力强；缺点是性急，容易虎头蛇尾、祸从口出。' },
    { n: '四绿', full: '四绿木星', wx: '木', home: 4, xiang: '巽 · 长女 · 风',
      sketch: '温和圆融，如风四处通达；重信用、善交际，远方与买卖的事多顺手，只是优柔寡断，怕得罪人。' },
    { n: '五黄', full: '五黄土星', wx: '土', home: 5, xiang: '中宫 · 帝王 · 腐朽与再生',
      sketch: '气场强、主见重，居中统摄八方，有领袖与整合之力；能成大事也易大起大落，宜以宽厚服人，忌刚愎自用。' },
    { n: '六白', full: '六白金星', wx: '金', home: 6, xiang: '乾 · 父 · 天',
      sketch: '刚健自律，如天行健；责任心与上进心都强，重原则、宜担当领导，只是自尊心重，不肯低头认输。' },
    { n: '七赤', full: '七赤金星', wx: '金', home: 7, xiang: '兑 · 少女 · 泽',
      sketch: '开朗健谈，懂享受、善社交，口才与魅力俱佳，如秋收之喜；只是爱玩贪欢，花钱大方，说话易伤人。' },
    { n: '八白', full: '八白土星', wx: '土', home: 8, xiang: '艮 · 少男 · 山',
      sketch: '沉稳坚毅，如山一样可靠；善积蓄、守家业，遇事有韧性，常能逢变得转机，但固执，不轻易改主意。' },
    { n: '九紫', full: '九紫火星', wx: '火', home: 9, xiang: '离 · 中女 · 火',
      sketch: '聪慧热情，有美感与洞察力，喜欢被看见；如火一般光明耀眼，情绪却来得快去得快，好面子、易冷热不定。' }
  ];

  /* —— 九宫与方位 —— */
  var PAL = {
    1: { g: '坎', dir: '北' }, 2: { g: '坤', dir: '西南' }, 3: { g: '震', dir: '东' }, 4: { g: '巽', dir: '东南' }, 5: { g: '中', dir: '中宫' },
    6: { g: '乾', dir: '西北' }, 7: { g: '兑', dir: '西' }, 8: { g: '艮', dir: '东北' }, 9: { g: '离', dir: '南' }
  };
  var OPP = { 1: 9, 9: 1, 2: 8, 8: 2, 3: 7, 7: 3, 4: 6, 6: 4, 5: 5 };
  var ZHI_PAL = [1, 8, 8, 3, 4, 4, 9, 2, 2, 7, 6, 6];      // 子丑寅卯辰巳午未申酉戌亥 所在宫
  var SOUTH_UP = [4, 9, 2, 3, 5, 7, 8, 1, 6];              // 南上：东南 南 西南 / 东 中 西 / 东北 北 西北
  var COMPASS = [1, 8, 3, 4, 9, 2, 7, 6];                  // 北起顺时针，列方位时用

  /* —— 凶方：名字、先后与意思 —— */
  var MARK = {
    五黄杀: { pri: 0, d: '五黄所在，自己招来的祸：事业停滞、大病、破财，最凶' },
    暗剑杀: { pri: 1, d: '五黄对宫，外来的祸：被牵连、意外、背叛，与五黄杀同为大凶' },
    岁破: { pri: 2, d: '太岁对冲：计划破裂、谈判不成、关系破损，一年里都忌' },
    月破: { pri: 2, d: '月建对冲：事情易破、半途而废，这个月里忌' },
    本命杀: { pri: 3, d: '本命星所在：伤及自身，健康与体力受损' },
    本命的杀: { pri: 4, d: '本命星对宫：判断失误、目标落空' },
    月命杀: { pri: 5, d: '月命星所在：主内在与身心，凶意较本命杀轻' },
    月命的杀: { pri: 6, d: '月命星对宫：凶意较本命的杀轻' }
  };

  /* —— 年运、月运：本命星落在哪一宫 —— */
  var PHASE = {
    1: { k: '停滞 · 蓄力', d: '运势落在谷底，如冬藏之时：宜休养、进修、打磨实力，不宜冒进扩张；此时默默耕耘的事，日后会发芽。' },
    2: { k: '准备 · 打基础', d: '从低谷慢慢回升，宜脚踏实地、勤勉做事，为后面几年铺路；重在耕耘而非收割，跟着前辈做事最稳。' },
    3: { k: '萌发 · 行动', d: '如春雷惊蛰，干劲足、机会多，适合开始新计划、主动表现；只是易冲动、多口舌，宜三思而行。' },
    4: { k: '顺遂 · 人缘信用', d: '运势渐盛，人缘与信用都好，买卖、远方、婚恋的事容易谈成；用心经营人际，事情自然顺。' },
    5: { k: '顶点 · 八方塞', d: '运势到了顶点，受人瞩目，压力与责任也最重；旧说「八方塞」，大事宜守不宜动，搬迁远行尤须谨慎，留意健康。' },
    6: { k: '充实 · 忙碌', d: '事业心强、担子加重，忙碌而充实，易得长辈与上级提携；量力而行，别逞强过劳。' },
    7: { k: '收获 · 喜悦', d: '前面的努力开始结果，钱财、交际、口福都有喜事；享乐之余，防口舌是非与花费过度。' },
    8: { k: '变化 · 转机', d: '运势的转折点，工作、住所或人际可能有变；顺势调整、当断则断，变动之中可得转机。' },
    9: { k: '光明显露 · 离合', d: '才华与名声显露，容易被看见、被赏识；光明之下是非也显，或有分离与聚合，宜明辨取舍。' }
  };

  /* —— 五行生克 —— */
  var WX5 = '木火土金水';                                  // 相生之序
  var REL = ['比和', '退气', '死气', '杀气', '生气'];      // 方位星对人星：同类、我生、我克、克我、生我
  function rel(me, s) { return REL[mod(WX5.indexOf(STAR[s].wx) - WX5.indexOf(STAR[me].wx), 5)]; }
  function isJi(me, s) {
    if (!me || !s || s === 5 || s === me) return false;
    var r = rel(me, s);
    return r === '生气' || r === '比和' || r === '退气';
  }
  function jiStars(me) { var out = []; for (var s = 1; s <= 9; s++) if (isJi(me, s)) out.push(s); return out; }
  // 「金生水，生气」之类的一句
  function relText(me, s) {
    if (s === me) return '同星';
    var a = STAR[me].wx, b = STAR[s].wx, r = rel(me, s);
    return { 比和: '同属' + a + '，比和', 退气: a + '生' + b + '，退气', 死气: a + '克' + b + '，死气', 杀气: b + '克' + a + '，杀气', 生气: b + '生' + a + '，生气' }[r];
  }

  /* —— 节 —— */
  var JIE_ZHI = { 大雪: 0, 小寒: 1, 立春: 2, 惊蛰: 3, 清明: 4, 立夏: 5, 芒种: 6, 小暑: 7, 立秋: 8, 白露: 9, 寒露: 10, 立冬: 11 };
  var JIE = J.terms.filter(function (x) { return JIE_ZHI[x.n] !== undefined; });
  function lastAtOrBefore(t) {               // JIE 中 t 及以前最后一项的下标
    var lo = 0, hi = JIE.length - 1;
    if (!JIE.length || JIE[0].t > t) return -1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (JIE[mid].t <= t) lo = mid; else hi = mid - 1; }
    return lo;
  }
  // 时刻 → 民用日时（tz 为时区小时；缺省按本机）
  function civil(t, tz) {
    var x;
    if (tz != null && isFinite(tz)) { x = new Date(t + tz * 3600e3); return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate(), h: x.getUTCHours(), mi: x.getUTCMinutes() }; }
    x = new Date(t); return { y: x.getFullYear(), m: x.getMonth() + 1, d: x.getDate(), h: x.getHours(), mi: x.getMinutes() };
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtT(t, tz, withYear) { var c = civil(t, tz); return (withYear ? c.y + '-' + pad2(c.m) + '-' + pad2(c.d) : c.m + '/' + c.d) + ' ' + pad2(c.h) + ':' + pad2(c.mi); }
  function lichunOf(Y) { for (var i = 0; i < JIE.length; i++) if (JIE[i].n === '立春' && new Date(JIE[i].t).getUTCFullYear() === Y) return JIE[i]; return null; }
  function gzName(Y) { return GAN[mod(Y - 4, 10)] + ZHI[mod(Y - 4, 12)]; }

  /* =========================================================
     本命星、月命星
     when: 'YYYY-MM-DD' 或 'YYYY-MM-DDTHH:MM'（出生地钟表时间；无时刻按正午）
     opt: { tz: 出生地时区（小时）, dst: 夏令时 }
     ========================================================= */
  function birthMoment(when, tz, dst) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(when || '');
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3], noTime = m[4] == null, h = noTime ? 12 : +m[4], mi = noTime ? 0 : +m[5];
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
    var hasTz = tz != null && tz !== '' && isFinite(tz);
    var t = hasTz ? Date.UTC(y, mo - 1, d, h, mi) - tz * 3600e3 - (dst ? 3600e3 : 0) : new Date(y, mo - 1, d, h, mi).getTime();
    return { t: t, y: y, m: mo, d: d, h: h, mi: mi, noTime: noTime, tz: hasTz ? +tz : null };
  }
  function natal(when, opt) {
    opt = opt || {};
    var b = birthMoment(when, opt.tz, opt.dst);
    if (!b) return null;
    var k = lastAtOrBefore(b.t);
    if (k < 0 || k >= JIE.length - 1) return null;
    var lc = k; while (lc >= 0 && JIE[lc].n !== '立春') lc--;
    if (lc < 0) return null;
    var Y = new Date(JIE[lc].t).getUTCFullYear(), zhi = JIE_ZHI[JIE[k].n], mi = mod(zhi - 2, 12);
    // 生在交节前后一天内：时刻要准；没填时刻而当天就交节，更要补时刻
    var near = null;
    [JIE[k], JIE[k + 1]].forEach(function (x) {
      if (near || Math.abs(x.t - b.t) >= DAY) return;
      var c = civil(x.t, b.tz);
      near = { n: x.n, t: x.t, sameDay: c.y === b.y && c.m === b.m && c.d === b.d, after: b.t >= x.t };
    });
    return {
      t: b.t, when: when, noTime: b.noTime, tz: b.tz,
      Y: Y, gz: gzName(Y), zhi: zhi, mi: mi, month: ZHI[zhi] + '月',
      honmei: KY.yearStar(Y), getsumei: KY.monthStar(Y, mi),
      lichun: JIE[lc], jie: JIE[k], next: JIE[k + 1], near: near
    };
  }

  /* =========================================================
     年盘、月盘
     ========================================================= */
  function makeBoard(kind, center, zhi) {
    var pan = KY.fly(center, 1), at = {};
    for (var p = 1; p <= 9; p++) at[pan[p]] = p;
    return { kind: kind, center: center, pan: pan, at: at, zhi: zhi, po: ZHI_PAL[mod(zhi + 6, 12)], poName: kind === 'year' ? '岁破' : '月破' };
  }
  function yearBoard(Y) {
    var b = makeBoard('year', KY.yearStar(Y), mod(Y - 4, 12));
    b.Y = Y; b.gz = gzName(Y); b.name = b.gz + '年';
    b.from = lichunOf(Y); b.to = lichunOf(Y + 1);
    return b;
  }
  function monthBoard(Y, mi) {
    var zhi = mod(mi + 2, 12), b = makeBoard('month', KY.monthStar(Y, mi), zhi);
    var mg = mod((mod(Y - 4, 10) % 5) * 2 + 2 + mi, 10);           // 五虎遁
    b.Y = Y; b.mi = mi; b.name = ZHI[zhi] + '月'; b.gz = GAN[mg] + ZHI[zhi];
    return b;
  }
  // 某个民用日（本机时区）的年盘月盘
  function forDate(y, m, d) {
    var jm = TS.jieMonth(y, m, d);
    if (!jm) return null;
    var yb = yearBoard(jm.yearNum), mb = monthBoard(jm.yearNum, jm.mi);
    mb.from = jm.jie; mb.to = jm.next;
    return { y: y, m: m, d: d, Y: jm.yearNum, year: yb, month: mb };
  }
  // 翻到前（dir = −1）或后（+1）一个节月的第一天（交节那天）
  function stepMonth(y, m, d, dir) {
    var e = new Date(y, m - 1, d + 1).getTime(), lo = 0, hi = JIE.length - 1;
    if (JIE[0].t >= e) return null;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (JIE[mid].t < e) lo = mid; else hi = mid - 1; }
    var j = JIE[lo + (dir < 0 ? -1 : 1)];
    if (!j) return null;
    var c = civil(j.t);
    return { y: c.y, m: c.m, d: c.d };
  }
  // 交节时刻 → 那个节月（年）的起讫民用日
  function span(from, to) {
    if (!from) return null;
    var a = civil(from.t), b = to ? civil(to.t) : null, e = b ? new Date(b.y, b.m - 1, b.d - 1) : null;
    return { a: a, b: e ? { y: e.getFullYear(), m: e.getMonth() + 1, d: e.getDate() } : null, text: a.m + '/' + a.d + (e ? '–' + (e.getMonth() + 1) + '/' + e.getDate() : '') };
  }

  /* =========================================================
     八方吉凶
     person: { honmei, getsumei } 或 null（只标人人皆忌的五黄杀、暗剑杀、破）
     ========================================================= */
  function judge(board, person) {
    var pan = board.pan, at = board.at, hm = person ? person.honmei : 0, gm = person ? person.getsumei : 0;
    var cells = {}, ji = [], best = [], xiong = [];
    for (var p = 1; p <= 9; p++) {
      var s = pan[p], marks = [];
      if (p !== 5) {
        if (s === 5) marks.push('五黄杀');
        if (at[5] !== 5 && p === OPP[at[5]]) marks.push('暗剑杀');
        if (p === board.po) marks.push(board.poName);
        if (hm) { if (s === hm) marks.push('本命杀'); if (at[hm] !== 5 && p === OPP[at[hm]]) marks.push('本命的杀'); }
        if (gm) { if (s === gm) marks.push('月命杀'); if (at[gm] !== 5 && p === OPP[at[gm]]) marks.push('月命的杀'); }
      }
      var c = { p: p, star: s, marks: marks, xiong: marks.length > 0, jiH: isJi(hm, s), jiG: isJi(gm, s) };
      c.ji = p !== 5 && !c.xiong && c.jiH;
      c.best = c.ji && c.jiG;
      cells[p] = c;
    }
    COMPASS.forEach(function (p) {
      if (cells[p].ji) ji.push(p);
      if (cells[p].best) best.push(p);
      if (cells[p].xiong) xiong.push(p);
    });
    var pri = function (p) { return Math.min.apply(null, cells[p].marks.map(function (k) { return MARK[k].pri; })); };
    xiong.sort(function (a, b) { return pri(a) - pri(b) || COMPASS.indexOf(a) - COMPASS.indexOf(b); });
    return {
      board: board, person: person || null, cells: cells, ji: ji, best: best, xiong: xiong,
      hmAt: hm ? at[hm] : null, gmAt: gm ? at[gm] : null,
      phase: hm ? PHASE[at[hm]] : null
    };
  }
  // 搬家：年盘月盘都吉
  function move(jy, jm) {
    var both = jy.ji.filter(function (p) { return jm.ji.indexOf(p) >= 0; });
    return { both: both, bestBoth: both.filter(function (p) { return jy.cells[p].best && jm.cells[p].best; }) };
  }

  /* —— 白话摘要：三行（本月、今年、搬家）——
     wrap(kind, text) 给方位上色：kind 为 'best' 'ji' 'xiong' 'none'；缺省原样返回（纯文字） */
  function lines(info, person, opt) {
    opt = opt || {};
    var wrap = opt.wrap || function (k, t) { return t; };
    var jy = judge(info.year, person), jm = judge(info.month, person), mv = move(jy, jm), now = opt.now || null;
    var D = function (p, k) { return wrap(k, PAL[p].dir); };
    var ms = span(info.month.from, info.month.to);
    var mLab = info.month.name, mSub = ms ? ms.text : '';
    if (now) {
      if (now.month.from && info.month.from && now.month.from.t === info.month.from.t) { mLab = '本月'; mSub = info.month.name + (ms ? ' · ' + ms.text : ''); }
      else if (now.month.to && info.month.from && now.month.to.t === info.month.from.t) { mLab = '下月'; mSub = info.month.name + (ms ? ' · ' + ms.text : ''); }
      else if (info.month.to && now.month.from && info.month.to.t === now.month.from.t) { mLab = '上月'; mSub = info.month.name + (ms ? ' · ' + ms.text : ''); }
      else { mLab = info.year.gz + '年' + info.month.name; }
    }
    var yLab = info.year.name, ySub = '';
    if (now) {
      var dy = info.Y - now.Y, rl = { '-1': '去年', 0: '今年', 1: '明年' }[dy];
      if (rl) { yLab = rl; ySub = info.year.name; }
    }
    function body(J, scope) {
      var s = '';
      if (J.person) {
        s += '你的吉方：' + (J.ji.length ? J.ji.map(function (p) { return D(p, J.cells[p].best ? 'best' : 'ji'); }).join('、') : wrap('none', '无'));
        if (J.best.length) s += '（最大吉方：' + J.best.map(function (p) { return D(p, 'best'); }).join('、') + '）';
        s += '；';
      }
      s += '避开：' + J.xiong.map(function (p) { return D(p, 'xiong') + '（' + J.cells[p].marks.join('、') + '）'; }).join('、');
      if (J.person && J.hmAt === 5) s += '。本命星' + scope + '入中宫，旧说「八方塞」，大动宜慎';
      return s;
    }
    var mvBody = '看年盘与月盘都吉的方位：';
    if (!person) mvBody += '填出生日期后才能算';
    else if (mv.both.length) {
      mvBody += mv.both.map(function (p) { return D(p, mv.bestBoth.indexOf(p) >= 0 ? 'best' : 'ji'); }).join('、');
      if (mv.bestBoth.length) mvBody += '（' + mv.bestBoth.map(function (p) { return D(p, 'best'); }).join('、') + '两盘都是最大吉方）';
      if (jy.hmAt === 5) mvBody += '；但本命星这一年入中宫，旧说八方塞，宜缓';
    } else mvBody += wrap('none', '这个月没有') + '，可往后翻几个月看';
    return {
      jy: jy, jm: jm, mv: mv,
      month: { lab: mLab, sub: mSub, body: body(jm, '这个月') },
      year: { lab: yLab, sub: ySub, body: body(jy, '这一年') },
      move: { lab: '搬家', sub: '', body: mvBody }
    };
  }
  function lineText(x) { return x.lab + (x.sub ? '（' + x.sub + '）' : '') + x.body; }
  // 盘面一行字：东南九紫 南五黄 西南七赤 / 东八白 中一白 西三碧 / 东北四绿 北六白 西北二黑
  function boardText(board) {
    return [0, 3, 6].map(function (i) {
      return SOUTH_UP.slice(i, i + 3).map(function (p) { return (p === 5 ? '中' : PAL[p].dir) + STAR[board.pan[p]].n; }).join(' ');
    }).join(' / ');
  }
  // 某星的本命年（按立春；1 月 1 日至立春前出生的算上一年）
  function yearsOf(s, from, to) { var out = []; for (var Y = from; Y <= to; Y++) if (KY.yearStar(Y) === s) out.push(Y); return out; }

  var api = {
    STAR: STAR, PAL: PAL, OPP: OPP, ZHI_PAL: ZHI_PAL, SOUTH_UP: SOUTH_UP, COMPASS: COMPASS, MARK: MARK, PHASE: PHASE, JIE: JIE,
    rel: rel, relText: relText, isJi: isJi, jiStars: jiStars,
    natal: natal, birthMoment: birthMoment, yearBoard: yearBoard, monthBoard: monthBoard, forDate: forDate, stepMonth: stepMonth, span: span,
    judge: judge, move: move, lines: lines, lineText: lineText, boardText: boardText, yearsOf: yearsOf,
    civil: civil, fmtT: fmtT, gzName: gzName, lichunOf: lichunOf
  };
  if (NODE) module.exports = api; else root.JX = api;
})(this);
