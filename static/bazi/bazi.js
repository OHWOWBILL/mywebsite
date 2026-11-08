/* =========================================================
   八字排盘 · 核心
   ---------------------------------------------------------
   节气取奇门手记同一张表（/qimen/jieqi.js，太阳视黄经算出，
   与寿星万年历相差一分钟内），农历取 /fabao/lunar.js。
   不读浏览器时区：出生时间一律按「出生地钟表时间 + 出生地时区」解读，
   人在东京给北京出生的人排盘，节令交接也不会差一小时。

   口径
     年柱以立春换，月柱以十二节换（交节时刻精确到分）；
     日柱、时柱按出生地钟点（开真太阳时则按真太阳时）；
     子时两派可选：「次日」23 点起换日（默认，与紫微、奇门同）、
     「当日」晚子时日柱仍算本日，时柱照五鼠遁接次日子时。
     流日按当地日期，自交节当日起；流时按五鼠遁，子时口径同上。
     大运阳男阴女顺、阴男阳女逆；起运以出生到前后节的分钟数折算：
     三日一年、一日四月、一时辰十日（一分钟折两小时）。

   浏览器里挂 window.BZ；node 里 require 即得同一对象。
   调候用神查《穷通宝鉴》，表在 /bazi/qiongtong.js（页面须另行载入；
   没载入时 analyze() 的 tiaohou 为 null，合盘、六爻等页照旧）。
   ========================================================= */
(function (root) {
  'use strict';
  var isNode = typeof module !== 'undefined' && module.exports;
  var J = isNode ? require('../qimen/jieqi.js') : root.QM_JIEQI;
  var LUNAR = isNode ? require('../fabao/lunar.js') : root.QJ_LUNAR;
  var TERMS = J.terms;

  var DAY = 86400000, MIN = 60000;
  var GAN = '甲乙丙丁戊己庚辛壬癸', ZHI = '子丑寅卯辰巳午未申酉戌亥';
  var SX = '鼠牛虎兔龙蛇马羊猴鸡狗猪';
  var WX = ['木', '火', '土', '金', '水'];
  var GAN_WX = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  var ZHI_WX = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  // 地支藏干：本气、中气、余气
  var CANG = [[9], [5, 9, 7], [0, 2, 4], [1], [4, 1, 9], [2, 6, 4], [3, 5], [5, 3, 1], [6, 8, 4], [7], [4, 7, 3], [8, 0]];
  var CANG_W = { 1: [1], 2: [0.7, 0.3], 3: [0.6, 0.3, 0.1] };
  var QI_NAME = ['本气', '中气', '余气'];
  var SS = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'];
  var SS_SHORT = { 比肩: '比', 劫财: '劫', 食神: '食', 伤官: '伤', 偏财: '才', 正财: '财', 七杀: '杀', 正官: '官', 偏印: '枭', 正印: '印' };
  var STAGES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
  var STAGE_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];   // 各干长生之支；阳干顺、阴干逆，戊己随丙丁
  var NAYIN = ['海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
    '泉中水', '屋上土', '霹雳火', '松柏木', '长流水', '沙中金', '山下火', '平地木', '壁上土', '金箔金',
    '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木', '大溪水', '沙中土', '天上火', '石榴木', '大海水'];
  var JIE = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
  var JIE_BRANCH = { 立春: 2, 惊蛰: 3, 清明: 4, 立夏: 5, 芒种: 6, 小暑: 7, 立秋: 8, 白露: 9, 寒露: 10, 立冬: 11, 大雪: 0, 小寒: 1 };
  var PILLAR_NAME = ['年', '月', '日', '时'];

  function mod(a, n) { return ((a % n) + n) % n; }
  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  function gzIdx(g, z) { for (var n = 0; n < 60; n++) if (n % 10 === g && n % 12 === z) return n; return -1; }
  function gzName(i) { return GAN[i % 10] + ZHI[i % 12]; }
  function parseGZ(s) { var g = GAN.indexOf(s[0]), z = ZHI.indexOf(s[1]); return g < 0 || z < 0 ? -1 : gzIdx(g, z); }
  function pillar(i) { return { idx: i, gan: i % 10, zhi: i % 12, name: gzName(i) }; }
  function fields(ms) { var d = new Date(ms); return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes() }; }
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function fmtF(f, withTime) { return f.y + '-' + pad(f.mo) + '-' + pad(f.d) + (withTime === false ? '' : ' ' + pad(f.h) + ':' + pad(f.mi)); }

  // —— 节气表查找 ——
  function termIndexAt(ms) {               // 最后一个 t <= ms
    var lo = 0, hi = TERMS.length - 1;
    if (ms < TERMS[0].t || ms >= TERMS[hi].t) return -1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (TERMS[mid].t <= ms) lo = mid; else hi = mid - 1; }
    return lo;
  }
  function isJie(n) { return JIE_BRANCH[n] !== undefined; }
  function prevJieIdx(k) { while (k >= 0 && !isJie(TERMS[k].n)) k--; return k; }
  function nextJieIdx(k) { k++; while (k < TERMS.length && !isJie(TERMS[k].n)) k++; return k < TERMS.length ? k : -1; }
  // 表首为 1899 大雪：1900 年 1 月的生日也排得出（年柱按己亥补）
  var RANGE = { min: TERMS[0].t, max: TERMS[TERMS.length - 1].t - DAY };

  // —— 真太阳时：均时差（分钟），NOAA 分数年公式；与奇门、紫微两件法宝同式 ——
  function eqTime(f) {
    var doy = Math.floor((Date.UTC(f.y, f.mo - 1, f.d) - Date.UTC(f.y, 0, 1)) / DAY);
    var g = 2 * Math.PI / 365 * (doy + (f.h - 12) / 24);
    return 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  }

  // 中国大陆 1986–1991 夏令时（起止日都含；只判日期）
  var DST_CN = { 1986: [5, 4, 9, 14], 1987: [4, 12, 9, 13], 1988: [4, 17, 9, 11], 1989: [4, 16, 9, 17], 1990: [4, 15, 9, 16], 1991: [4, 14, 9, 15] };
  function isChinaDST(y, m, d) {
    var r = DST_CN[y]; if (!r) return false;
    var v = m * 100 + d;
    return v >= r[0] * 100 + r[1] && v <= r[2] * 100 + r[3];
  }

  // —— 十神、长生、纳音、空亡 ——
  function shishen(dg, g) {
    var rel = mod(GAN_WX[g] - GAN_WX[dg], 5);
    return SS[rel * 2 + ((dg % 2) === (g % 2) ? 0 : 1)];
  }
  function stage(g, z) { return STAGES[g % 2 ? mod(STAGE_START[g] - z, 12) : mod(z - STAGE_START[g], 12)]; }
  function nayin(i) { return NAYIN[i >> 1]; }
  function kongOf(i) { var x = (i - i % 10) % 12; return [mod(x + 10, 12), mod(x + 11, 12)]; }
  function wangshuai(wx, ling) {          // 五行在月令的旺相休囚死
    if (wx === ling) return '旺';
    if (mod(ling + 1, 5) === wx) return '相';
    if (mod(wx + 1, 5) === ling) return '休';
    if (mod(wx + 2, 5) === ling) return '囚';
    return '死';
  }

  /* =========================================================
     起盘
     input: { y, mo, d, h, mi, tz, dst, lon, zi: 'next'|'same', male }
       y/mo/d/h/mi 为出生地钟表时间；tz 为出生地时区（小时，可带小数）；
       dst 为真：当时钟表比标准时快一小时（夏令时），先减一小时；
       lon 为东经（数字）则开真太阳时，否则不开。
     ========================================================= */
  function chart(inp) {
    var tz = +inp.tz, zi = inp.zi === 'same' ? 'same' : 'next';
    if (!isFinite(tz)) tz = 8;
    var wallMs = Date.UTC(inp.y, inp.mo - 1, inp.d, inp.h, inp.mi || 0);
    var stdMs = wallMs - (inp.dst ? 3600e3 : 0);          // 出生地标准时（以 UTC 字段表示）
    var utc = stdMs - tz * 3600e3;                         // 绝对时刻
    if (!(utc >= RANGE.min && utc <= RANGE.max)) return null;
    var std = fields(stdMs);
    var solar = null, clockMs = stdMs;
    if (typeof inp.lon === 'number' && isFinite(inp.lon)) {
      var lonFix = (inp.lon - tz * 15) * 4, eot = eqTime(std);
      solar = { lon: inp.lon, lonFix: lonFix, eot: eot, shift: lonFix + eot };
      clockMs = stdMs + Math.round(solar.shift * MIN);
    }
    var clock = fields(clockMs);

    // 日柱、时柱（时柱逐时辰连续，23 点的子时即次日子时）
    var Jd = jdn(clock.y, clock.mo, clock.d);
    var late = clock.h >= 23;
    var dayIdx = mod(Jd + (late && zi === 'next' ? 1 : 0) - 2415021 + 10, 60);
    var baseDay = mod(Jd + (late ? 1 : 0) - 2415021 + 10, 60);          // 定时干用的那一日
    var hz = Math.floor(((clock.h + 1) % 24) / 2);
    var hourIdx = gzIdx(((baseDay % 10) % 5 * 2 + hz) % 10, hz);

    // 年柱、月柱
    var k = termIndexAt(utc);
    var kJie = prevJieIdx(k), kNext = nextJieIdx(k);
    var jie = TERMS[kJie], jieNext = TERMS[kNext];
    var liChun = null;
    for (var q = kJie; q >= 0; q--) if (TERMS[q].n === '立春') { liChun = TERMS[q]; break; }
    var yAdj = liChun ? new Date(liChun.t + 8 * 3600e3).getUTCFullYear() : std.y - 1;
    var yearIdx = mod(yAdj - 1984, 60);
    var mb = JIE_BRANCH[jie.n];
    var monthIdx = gzIdx(((yearIdx % 10) % 5 * 2 + 2 + mod(mb - 2, 12)) % 10, mb);

    var P = [pillar(yearIdx), pillar(monthIdx), pillar(dayIdx), pillar(hourIdx)];
    var lunar = LUNAR.toLunar(std.y, std.mo, std.d);

    // 起运
    var yang = P[0].gan % 2 === 0, forward = yang === !!inp.male;
    var target = forward ? jieNext : jie;
    var diffMin = Math.abs(target.t - utc) / MIN;
    var rem = diffMin;
    var sy = Math.floor(rem / 4320); rem -= sy * 4320;
    var sm = Math.floor(rem / 360); rem -= sm * 360;
    var sd = Math.floor(rem / 12); rem -= sd * 12;
    var sh = Math.floor(rem * 2);
    var startMs = Date.UTC(std.y + sy, std.mo - 1 + sm, std.d + sd, std.h + sh, std.mi);
    var start = fields(startMs);
    var dayun = [];
    for (var n = 0; n < 10; n++) {
      var gi = mod(monthIdx + (forward ? n + 1 : -(n + 1)), 60), y0 = start.y + n * 10;
      dayun.push({ n: n, idx: gi, name: gzName(gi), gan: gi % 10, zhi: gi % 12, startYear: y0, endYear: y0 + 9, startAge: y0 - std.y + 1, endAge: y0 - std.y + 10 });
    }
    // 小运：起运前逐年，从时柱起，顺逆同大运
    var xiaoyun = [];
    for (var yy = std.y; yy < start.y; yy++) {
      var xi = mod(hourIdx + (forward ? 1 : -1) * (yy - std.y + 1), 60);
      xiaoyun.push({ year: yy, age: yy - std.y + 1, idx: xi, name: gzName(xi) });
    }

    // 前后节气（含中气），给页面写「生于某节后几日」
    var qiPrev = TERMS[k], qiNext = TERMS[k + 1];

    return {
      input: inp, tz: tz, zi: zi, male: !!inp.male, utc: utc,
      wall: fields(wallMs), std: std, clock: clock, solar: solar, late: late,
      pillars: P, lunar: lunar,
      jie: { prev: { n: jie.n, t: jie.t }, next: { n: jieNext.n, t: jieNext.t } },
      qi: { prev: { n: qiPrev.n, t: qiPrev.t }, next: { n: qiNext.n, t: qiNext.t } },
      yun: {
        forward: forward, target: { n: target.n, t: target.t }, diffMin: diffMin,
        span: { y: sy, m: sm, d: sd, h: sh }, start: start, startAge: start.y - std.y + 1,
        dayun: dayun, xiaoyun: xiaoyun
      }
    };
  }

  /* =========================================================
     神煞
     每条：name、查法（how）、按什么查（by）、查哪里（hit）
     ========================================================= */
  var SANHE_GROUP = [0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3];      // 申子辰 0 · 寅午戌 1 · 巳酉丑 2 · 亥卯未 3
  function byGroup(arr) { return function (z) { return arr[SANHE_GROUP[z]]; }; }
  var SHA_SANHE = [
    { name: '驿马', how: '申子辰马在寅，寅午戌马在申，巳酉丑马在亥，亥卯未马在巳', f: byGroup([2, 8, 11, 5]) },
    { name: '桃花', how: '咸池：申子辰在酉，寅午戌在卯，巳酉丑在午，亥卯未在子', f: byGroup([9, 3, 6, 0]) },
    { name: '华盖', how: '申子辰见辰，寅午戌见戌，巳酉丑见丑，亥卯未见未', f: byGroup([4, 10, 1, 7]) },
    { name: '将星', how: '申子辰见子，寅午戌见午，巳酉丑见酉，亥卯未见卯', f: byGroup([0, 6, 9, 3]) },
    { name: '劫煞', how: '申子辰见巳，寅午戌见亥，巳酉丑见寅，亥卯未见申', f: byGroup([5, 11, 2, 8]) },
    { name: '灾煞', how: '申子辰见午，寅午戌见子，巳酉丑见卯，亥卯未见酉', f: byGroup([6, 0, 3, 9]) },
    { name: '亡神', how: '申子辰见亥，寅午戌见巳，巳酉丑见申，亥卯未见寅', f: byGroup([11, 5, 8, 2]) }
  ];
  var TIANYI = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [3, 5], [3, 5]];
  var TAIJI = [[0, 6], [0, 6], [3, 9], [3, 9], [4, 10, 1, 7], [4, 10, 1, 7], [2, 11], [2, 11], [5, 8], [5, 8]];
  var WENCHANG = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3];
  var GUOYIN = [10, 11, 1, 2, 1, 2, 4, 5, 7, 8];
  var LU = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
  var HONGYAN = [6, 8, 2, 7, 4, 4, 10, 9, 0, 8];
  var SHA_GAN = [   // 以日干（部分兼年干）查地支
    { name: '天乙贵人', how: '甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢马虎；以日干、年干查', also: true, f: function (g) { return TIANYI[g]; } },
    { name: '太极贵人', how: '甲乙子午，丙丁卯酉，戊己辰戌丑未，庚辛寅亥，壬癸巳申；以日干、年干查', also: true, f: function (g) { return TAIJI[g]; } },
    { name: '文昌贵人', how: '甲乙巳午报君知，丙戊申宫丁己鸡，庚猪辛鼠壬逢虎，癸人见卯；以日干、年干查', also: true, f: function (g) { return [WENCHANG[g]]; } },
    { name: '国印贵人', how: '甲戌乙亥丙丑丁寅，戊丑己寅庚辰辛巳，壬未癸申；以日干、年干查', also: true, f: function (g) { return [GUOYIN[g]]; } },
    { name: '禄神', how: '甲禄寅，乙禄卯，丙戊禄巳，丁己禄午，庚禄申，辛禄酉，壬禄亥，癸禄子；以日干查', f: function (g) { return [LU[g]]; } },
    { name: '羊刃', how: '禄前一位：甲卯乙辰，丙戊午丁己未，庚酉辛戌，壬子癸丑；以日干查', f: function (g) { return [mod(LU[g] + 1, 12)]; } },
    { name: '金舆', how: '禄前二位：甲辰乙巳，丙戊未丁己申，庚戌辛亥，壬丑癸寅；以日干查', f: function (g) { return [mod(LU[g] + 2, 12)]; } },
    { name: '红艳煞', how: '甲午乙申，丙寅丁未，戊己辰，庚戌辛酉，壬子癸申；以日干查', f: function (g) { return [HONGYAN[g]]; } }
  ];
  // 以月支查：t 为 'g' 查天干，'z' 查地支
  var TIANDE = ['巳', '庚', '丁', '申', '壬', '辛', '亥', '甲', '癸', '寅', '丙', '乙'];       // 子起
  var TIANDE_HE = ['申', '乙', '壬', '巳', '丁', '丙', '寅', '己', '戊', '亥', '辛', '庚'];
  var YUEDE = ['壬', '丙', '庚', '甲'];        // 按 SANHE_GROUP：申子辰壬 · 寅午戌丙 · 巳酉丑庚 · 亥卯未甲
  var YUEDE_HE = ['丁', '辛', '乙', '己'];
  function charOf(ch) { var g = GAN.indexOf(ch); return g >= 0 ? { t: 'g', i: g } : { t: 'z', i: ZHI.indexOf(ch) }; }
  var SHA_MONTH = [
    { name: '天德贵人', how: '正丁二申宫，三壬四辛同，五亥六甲上，七癸八寅逢，九丙十归乙，子巳丑庚中；以月支查', f: function (mz) { return charOf(TIANDE[mz]); } },
    { name: '天德合', how: '天德之合：寅月壬，卯月巳，辰月丁，巳月丙，午月寅，未月己，申月戊，酉月亥，戌月辛，亥月庚，子月申，丑月乙', f: function (mz) { return charOf(TIANDE_HE[mz]); } },
    { name: '月德贵人', how: '寅午戌月丙，申子辰月壬，亥卯未月甲，巳酉丑月庚；以月支查天干', f: function (mz) { return charOf(YUEDE[SANHE_GROUP[mz]]); } },
    { name: '月德合', how: '月德之合：寅午戌月辛，申子辰月丁，亥卯未月己，巳酉丑月乙', f: function (mz) { return charOf(YUEDE_HE[SANHE_GROUP[mz]]); } },
    { name: '天医', how: '月支前一位：寅月见丑，卯月见寅……', f: function (mz) { return { t: 'z', i: mod(mz - 1, 12) }; } }
  ];
  var SHA_YEAR = [   // 以年支查地支
    { name: '孤辰', how: '亥子丑见寅，寅卯辰见巳，巳午未见申，申酉戌见亥；以年支查', f: function (yz) { return [2, 5, 8, 11][Math.floor(mod(yz + 1, 12) / 3)]; } },
    { name: '寡宿', how: '亥子丑见戌，寅卯辰见丑，巳午未见辰，申酉戌见未；以年支查', f: function (yz) { return [10, 1, 4, 7][Math.floor(mod(yz + 1, 12) / 3)]; } },
    { name: '红鸾', how: '子年卯，丑年寅，逆行十二支；以年支查', f: function (yz) { return mod(3 - yz, 12); } },
    { name: '天喜', how: '红鸾对冲：子年酉，丑年申……；以年支查', f: function (yz) { return mod(9 - yz, 12); } }
  ];
  var DAY_SPECIAL = [
    { name: '魁罡', how: '日柱庚辰、庚戌、壬辰、戊戌', list: ['庚辰', '庚戌', '壬辰', '戊戌'] },
    { name: '十恶大败', how: '日柱甲辰、乙巳、丙申、丁亥、戊戌、己丑、庚辰、辛巳、壬申、癸亥', list: ['甲辰', '乙巳', '丙申', '丁亥', '戊戌', '己丑', '庚辰', '辛巳', '壬申', '癸亥'] },
    { name: '阴差阳错', how: '日柱丙子、丁丑、戊寅、辛卯、壬辰、癸巳、丙午、丁未、戊申、辛酉、壬戌、癸亥', list: ['丙子', '丁丑', '戊寅', '辛卯', '壬辰', '癸巳', '丙午', '丁未', '戊申', '辛酉', '壬戌', '癸亥'] },
    { name: '孤鸾煞', how: '日柱乙巳、丁巳、辛亥、戊申、甲寅、丙午、戊午、壬子', list: ['乙巳', '丁巳', '辛亥', '戊申', '甲寅', '丙午', '戊午', '壬子'] }
  ];
  var TIANSHE = ['甲子', '甲子', '戊寅', '戊寅', '戊寅', '甲午', '甲午', '甲午', '戊申', '戊申', '戊申', '甲子'];  // 以月支（子起）定季

  // cols: [{ gan, zhi, idx, role }]，前四个必须是年月日时；之后可接大运、流年等
  function shensha(cols) {
    var dg = cols[2].gan, yg = cols[0].gan, yz = cols[0].zhi, dz = cols[2].zhi, mz = cols[1].zhi;
    var out = cols.map(function () { return []; });
    var push = function (i, s, why) { if (!out[i].some(function (x) { return x.name === s.name; })) out[i].push({ name: s.name, how: s.how, why: why }); };
    cols.forEach(function (c, i) {
      SHA_GAN.forEach(function (s) {
        if (s.f(dg).indexOf(c.zhi) >= 0) push(i, s, '日干' + GAN[dg]);
        else if (s.also && s.f(yg).indexOf(c.zhi) >= 0) push(i, s, '年干' + GAN[yg]);
      });
      SHA_SANHE.forEach(function (s) {
        if (s.f(yz) === c.zhi) push(i, s, '年支' + ZHI[yz]);
        else if (s.f(dz) === c.zhi) push(i, s, '日支' + ZHI[dz]);
      });
      SHA_MONTH.forEach(function (s) {
        var r = s.f(mz);
        if ((r.t === 'g' && r.i === c.gan) || (r.t === 'z' && r.i === c.zhi)) push(i, s, '月支' + ZHI[mz]);
      });
      SHA_YEAR.forEach(function (s) { if (s.f(yz) === c.zhi) push(i, s, '年支' + ZHI[yz]); });
    });
    var dname = cols[2].name || gzName(cols[2].idx);
    DAY_SPECIAL.forEach(function (s) { if (s.list.indexOf(dname) >= 0) push(2, s, '日柱'); });
    if (TIANSHE[mz] === dname) push(2, { name: '天赦', how: '春戊寅、夏甲午、秋戊申、冬甲子（以月令定季）' }, '日柱');
    return out;
  }

  /* =========================================================
     干支关系：合、冲、刑、害、破、会
     cols: [{ gan, zhi, label }]
     ========================================================= */
  var GAN_HE = { '0-5': '土', '1-6': '金', '2-7': '水', '3-8': '木', '4-9': '火' };
  var GAN_CHONG = ['0-6', '1-7', '2-8', '3-9'];
  var LIUHE = { '0-1': '土', '2-11': '木', '3-10': '火', '4-9': '金', '5-8': '水', '6-7': '土' };
  var SANHE = [[8, 0, 4, '水'], [2, 6, 10, '火'], [5, 9, 1, '金'], [11, 3, 7, '木']];
  var SANHUI = [[2, 3, 4, '木'], [5, 6, 7, '火'], [8, 9, 10, '金'], [11, 0, 1, '水']];
  var HAI = ['0-7', '1-6', '2-5', '3-4', '8-11', '9-10'];
  var PO = ['0-9', '3-6', '1-4', '7-10', '2-11', '5-8'];
  var XING = { '2-5': '寅刑巳', '5-8': '巳刑申', '2-8': '申刑寅', '1-10': '丑刑戌', '7-10': '戌刑未', '1-7': '未刑丑', '0-3': '子卯相刑' };
  var ZIXING = [4, 6, 9, 11];
  function key(a, b) { return a < b ? a + '-' + b : b + '-' + a; }
  function relations(cols) {
    var R = [];
    var add = function (type, text, members) { R.push({ type: type, text: text, members: members }); };
    for (var i = 0; i < cols.length; i++) {
      for (var j = i + 1; j < cols.length; j++) {
        var a = cols[i], b = cols[j], A = a.label, B = b.label, kg = key(a.gan, b.gan), kz = key(a.zhi, b.zhi);
        if (GAN_HE[kg]) add('合', A + '干' + GAN[a.gan] + '合' + B + '干' + GAN[b.gan] + '（化' + GAN_HE[kg] + '）', [i, j]);
        if (GAN_CHONG.indexOf(kg) >= 0) add('冲', A + '干' + GAN[a.gan] + '冲' + B + '干' + GAN[b.gan], [i, j]);
        if (LIUHE[kz]) add('合', A + '支' + ZHI[a.zhi] + '合' + B + '支' + ZHI[b.zhi] + '（六合' + LIUHE[kz] + '）', [i, j]);
        if (mod(a.zhi - b.zhi, 12) === 6) add('冲', A + '支' + ZHI[a.zhi] + '冲' + B + '支' + ZHI[b.zhi], [i, j]);
        if (XING[kz]) add('刑', A + '支' + ZHI[a.zhi] + '、' + B + '支' + ZHI[b.zhi] + ' ' + XING[kz], [i, j]);
        if (a.zhi === b.zhi && ZIXING.indexOf(a.zhi) >= 0) add('刑', A + '支、' + B + '支 ' + ZHI[a.zhi] + ZHI[a.zhi] + '自刑', [i, j]);
        if (HAI.indexOf(kz) >= 0) add('害', A + '支' + ZHI[a.zhi] + '害' + B + '支' + ZHI[b.zhi], [i, j]);
        if (PO.indexOf(kz) >= 0) add('破', A + '支' + ZHI[a.zhi] + '破' + B + '支' + ZHI[b.zhi], [i, j]);
        // 半合（生旺、旺墓）与拱合（生墓）
        SANHE.forEach(function (s) {
          var ia = s.indexOf(a.zhi), ib = s.indexOf(b.zhi);
          if (ia < 0 || ib < 0 || ia > 2 || ib > 2 || ia === ib) return;
          var hasAll = cols.some(function (c) { return c.zhi === s[0]; }) && cols.some(function (c) { return c.zhi === s[1]; }) && cols.some(function (c) { return c.zhi === s[2]; });
          if (hasAll) return;
          var pair = [ia, ib].sort().join('');
          add('合', A + '支' + ZHI[a.zhi] + B + '支' + ZHI[b.zhi] + (pair === '02' ? ' 拱' : ' 半合') + s[3] + '局', [i, j]);
        });
      }
    }
    SANHE.forEach(function (s) {
      var m = [0, 1, 2].map(function (q) { return cols.findIndex(function (c) { return c.zhi === s[q]; }); });
      if (m.every(function (x) { return x >= 0; })) add('合', ZHI[s[0]] + ZHI[s[1]] + ZHI[s[2]] + '三合' + s[3] + '局', m);
    });
    SANHUI.forEach(function (s) {
      var m = [0, 1, 2].map(function (q) { return cols.findIndex(function (c) { return c.zhi === s[q]; }); });
      if (m.every(function (x) { return x >= 0; })) add('会', ZHI[s[0]] + ZHI[s[1]] + ZHI[s[2]] + '三会' + s[3] + '方', m);
    });
    // 寅巳申、丑戌未三刑齐全
    [[2, 5, 8, '寅巳申无恩之刑'], [1, 10, 7, '丑戌未恃势之刑']].forEach(function (s) {
      var m = [0, 1, 2].map(function (q) { return cols.findIndex(function (c) { return c.zhi === s[q]; }); });
      if (m.every(function (x) { return x >= 0; })) add('刑', s[3] + '（三刑全）', m);
    });
    return R;
  }

  /* =========================================================
     分析：十神、藏干、长生、纳音、空亡、五行、司令、通根透干……
     ========================================================= */
  // 人元司令（《渊海子平》分野）：子起，每月 [干, 日数]
  var SILING = [
    [['壬', 10], ['癸', 20]], [['癸', 9], ['辛', 3], ['己', 18]], [['戊', 7], ['丙', 7], ['甲', 16]], [['甲', 10], ['乙', 20]],
    [['乙', 9], ['癸', 3], ['戊', 18]], [['戊', 5], ['庚', 9], ['丙', 16]], [['丙', 10], ['己', 9], ['丁', 11]], [['丁', 9], ['乙', 3], ['己', 18]],
    [['戊己', 10], ['壬', 3], ['庚', 17]], [['庚', 10], ['辛', 20]], [['辛', 9], ['丁', 3], ['戊', 18]], [['戊', 7], ['甲', 5], ['壬', 18]]
  ];
  function analyze(C) {
    var P = C.pillars, dg = P[2].gan;
    var cols = P.map(function (p, i) {
      var cang = CANG[p.zhi].map(function (g, j) { return { gan: g, name: GAN[g], qi: QI_NAME[j], ss: shishen(dg, g) }; });
      return {
        role: PILLAR_NAME[i], gan: p.gan, zhi: p.zhi, idx: p.idx, name: p.name,
        ganSS: i === 2 ? (C.male ? '元男' : '元女') : shishen(dg, p.gan),
        cang: cang, xingyun: stage(dg, p.zhi), zizuo: stage(p.gan, p.zhi), nayin: nayin(p.idx),
        kong: kongOf(p.idx), label: PILLAR_NAME[i]
      };
    });
    var dayKong = kongOf(P[2].idx), yearKong = kongOf(P[0].idx);
    cols.forEach(function (c, i) {
      c.isKong = dayKong.indexOf(c.zhi) >= 0 && i !== 2;
      c.isYearKong = yearKong.indexOf(c.zhi) >= 0 && i !== 0;
    });
    var sha = shensha(cols);
    cols.forEach(function (c, i) { c.sha = sha[i]; });

    // 五行
    var count = [0, 0, 0, 0, 0], weight = [0, 0, 0, 0, 0];
    P.forEach(function (p) {
      count[GAN_WX[p.gan]]++; count[ZHI_WX[p.zhi]]++;
      weight[GAN_WX[p.gan]] += 1;
      CANG[p.zhi].forEach(function (g, j) { weight[GAN_WX[g]] += CANG_W[CANG[p.zhi].length][j]; });
    });
    var ling = ZHI_WX[P[1].zhi];
    var wuxing = WX.map(function (n, i) { return { name: n, count: count[i], weight: Math.round(weight[i] * 10) / 10, ws: wangshuai(i, ling) }; });

    // 日主通根、月令透干
    var dw = GAN_WX[dg], roots = [];
    P.forEach(function (p, i) {
      CANG[p.zhi].forEach(function (g, j) { if (GAN_WX[g] === dw) roots.push({ pillar: PILLAR_NAME[i], zhi: ZHI[p.zhi], gan: GAN[g], qi: QI_NAME[j] }); });
    });
    var tou = [];
    CANG[P[1].zhi].forEach(function (g, j) {
      [0, 1, 3].forEach(function (i) { if (P[i].gan === g) tou.push({ gan: GAN[g], qi: QI_NAME[j], pillar: PILLAR_NAME[i], ss: shishen(dg, g) }); });
    });

    // 人元司令
    var daysIn = (C.utc - C.jie.prev.t) / DAY, acc = 0, siling = null;
    var seg = SILING[P[1].zhi];
    for (var s = 0; s < seg.length; s++) { acc += seg[s][1]; if (daysIn < acc || s === seg.length - 1) { siling = { gan: seg[s][0], segs: seg, day: Math.floor(daysIn) + 1 }; break; } }

    // 十神分布：天干（除日主）与地支藏干
    var ssCount = {};
    SS.forEach(function (n) { ssCount[n] = { gan: 0, cang: 0 }; });
    P.forEach(function (p, i) {
      if (i !== 2) ssCount[shishen(dg, p.gan)].gan++;
      CANG[p.zhi].forEach(function (g) { ssCount[shishen(dg, g)].cang++; });
    });

    // 月令取格（《子平真诠》法，仅供参考）：月令为日主之禄为建禄、阳干帝旺为阳刃；
    // 余则看月令藏干透出（本气先、中气次、余气后，比劫不取），皆不透取本气
    var geju = (function () {
      var mz = P[1].zhi, lu = LU[dg];
      if (mz === lu) return { name: '建禄格', why: '月令' + ZHI[mz] + '为日主' + GAN[dg] + '之禄' };
      if (dg % 2 === 0 && mz === mod(lu + 1, 12)) return { name: '阳刃格', why: '月令' + ZHI[mz] + '为日主' + GAN[dg] + '之刃（帝旺）' };
      var cg = CANG[mz], j, g, ss, at;
      for (j = 0; j < cg.length; j++) {
        g = cg[j]; ss = shishen(dg, g);
        if (ss === '比肩' || ss === '劫财') continue;
        at = [0, 1, 3].filter(function (i) { return P[i].gan === g; });
        if (at.length) return { name: ss + '格', why: '月令' + ZHI[mz] + '藏' + GAN[g] + '（' + QI_NAME[j] + '），透于' + at.map(function (i) { return PILLAR_NAME[i] + '干'; }).join('、') };
      }
      for (j = 0; j < cg.length; j++) {
        g = cg[j]; ss = shishen(dg, g);
        if (ss !== '比肩' && ss !== '劫财') return { name: ss + '格', why: '月令' + ZHI[mz] + '藏干皆不透，取' + QI_NAME[j] + GAN[g] };
      }
      return null;
    })();

    // 胎元、命宫、胎息
    var taiyuan = gzIdx(mod(P[1].gan + 1, 10), mod(P[1].zhi + 3, 12));
    var mNum = mod(P[1].zhi - 2, 12) + 1;
    var mgZ = mod(4 - mNum - P[3].zhi, 12);
    var minggong = gzIdx(((P[0].gan % 5) * 2 + 2 + mod(mgZ - 2, 12)) % 10, mgZ);
    var taixi = gzIdx(mod(P[2].gan + 5, 10), mod(1 - P[2].zhi, 12));

    return {
      cols: cols, wuxing: wuxing, ling: WX[ling], roots: roots, tou: tou, siling: siling, ssCount: ssCount, geju: geju,
      dayKong: dayKong, yearKong: yearKong,
      taiyuan: { name: gzName(taiyuan), nayin: nayin(taiyuan) },
      minggong: { name: gzName(minggong), nayin: nayin(minggong) },
      taixi: { name: gzName(taixi), nayin: nayin(taixi) },
      relations: relations(cols),
      tiaohou: tiaohou(C)
    };
  }

  /* =========================================================
     调候：《穷通宝鉴》以日干、月令取用神（表在 /bazi/qiongtong.js）
     逐个看在原局里透干（年、月、时三干；日干本身不算）、藏支（四支藏干）与否。
     页面没载入那张表（合盘、六爻等借用本文件的页）就返回 null。仅供参考。
     ========================================================= */
  var QTONG = isNode ? require('./qiongtong.js') : null;
  function tiaohou(C) {
    var Q = QTONG || root.BZ_QIONGTONG;
    if (!Q) return null;
    var P = C.pillars, dg = P[2].gan, e = Q.get(dg, P[1].zhi);
    if (!e) return null;
    var stems = e.y.split('').map(function (ch, k) {
      var g = GAN.indexOf(ch), tou = [], cang = [];
      [0, 1, 3].forEach(function (i) { if (P[i].gan === g) tou.push(PILLAR_NAME[i]); });
      P.forEach(function (p, i) {
        CANG[p.zhi].forEach(function (h, j) { if (h === g) cang.push({ pillar: PILLAR_NAME[i], zhi: ZHI[p.zhi], qi: QI_NAME[j] }); });
      });
      return { gan: ch, ss: shishen(dg, g), tou: tou, cang: cang, state: tou.length ? '透' : cang.length ? '藏' : '无', main: k === 0 };
    });
    return {
      key: e.key, gan: e.gan, wx: e.wx, zhi: e.zhi, month: e.month, season: e.season, chapter: e.chapter,
      y: e.y, q: e.q, ji: e.ji, n: e.n, v: e.v, cite: Q.BOOK.cite, stems: stems,
      tou: stems.filter(function (s) { return s.state === '透'; }).length,
      cang: stems.filter(function (s) { return s.state === '藏'; }).length
    };
  }

  // 某柱（大运、流年、流月）相对日干的十神与长生
  function extraCol(C, idx, label, role) {
    var dg = C.pillars[2].gan, g = idx % 10, z = idx % 12;
    return {
      role: role || label, label: label, idx: idx, name: gzName(idx), gan: g, zhi: z, ganSS: shishen(dg, g),
      cang: CANG[z].map(function (h, j) { return { gan: h, name: GAN[h], qi: QI_NAME[j], ss: shishen(dg, h) }; }),
      xingyun: stage(dg, z), zizuo: stage(g, z), nayin: nayin(idx), kong: kongOf(idx)
    };
  }

  // 流年：公历年 Y 的干支（以立春换）
  function yearGZ(Y) { return mod(Y - 1984, 60); }
  // 流月：干支年 Y（立春至次年立春）的十二个月，含交节时刻
  function liuyue(Y) {
    var yi = yearGZ(Y), out = [];
    for (var k = 0; k < TERMS.length; k++) {
      var t = TERMS[k];
      if (!isJie(t.n)) continue;
      var yy = new Date(t.t + 8 * 3600e3).getUTCFullYear();
      var inYear = (t.n === '小寒') ? yy === Y + 1 : yy === Y;
      if (!inYear) continue;
      var mb = JIE_BRANCH[t.n];
      var idx = gzIdx(((yi % 10) % 5 * 2 + 2 + mod(mb - 2, 12)) % 10, mb);
      out.push({ jie: t.n, t: t.t, idx: idx, name: gzName(idx), zhi: mb });
    }
    out.sort(function (a, b) { return a.t - b.t; });
    return out;
  }

  // 公历某日的日柱（与 chart() 同一算法，不论子时）
  function dayGZ(y, mo, d) { return mod(jdn(y, mo, d) - 2415021 + 10, 60); }
  // 流日：干支年 Y 第 k 个流月所辖各日。按 tz 当地日期，自交节当日排到下一节前一日；
  // 交节那天记上节名与交节时刻（那天交节前仍属上一月，页面上注出）。
  function liuri(Y, k, tz) {
    tz = isFinite(+tz) ? +tz : 8;
    var L = liuyue(Y), m = L[k];
    if (!m) return [];
    var nx = L[k + 1] || liuyue(Y + 1)[0];
    var endT = nx ? nx.t : TERMS[TERMS.length - 1].t;
    var d0 = Math.floor((m.t + tz * 3600e3) / DAY) * DAY, d1 = Math.floor((endT + tz * 3600e3) / DAY) * DAY;
    var out = [];
    for (var d = d0; d < d1; d += DAY) {
      var f = fields(d), idx = dayGZ(f.y, f.mo, f.d);
      out.push({ y: f.y, mo: f.mo, d: f.d, idx: idx, name: gzName(idx), jie: d === d0 ? m.jie : null, jieT: d === d0 ? m.t : null });
    }
    return out;
  }
  // 流时：某干支日 dayIdx 的十二时辰，时干按五鼠遁。
  // zi 'next'（默认）：子时为前一日 23 点至本日 1 点，十二个；
  // zi 'same'：早子 0–1 点接本日，另有晚子 23–24 点，时干接次日，共十三个。
  var HOUR_SPAN = ['23–1', '1–3', '3–5', '5–7', '7–9', '9–11', '11–13', '13–15', '15–17', '17–19', '19–21', '21–23'];
  function liushi(dayIdx, zi) {
    var dg = dayIdx % 10, out = [];
    for (var z = 0; z < 12; z++) {
      var idx = gzIdx((dg % 5 * 2 + z) % 10, z);
      out.push({ zhi: z, idx: idx, name: gzName(idx), span: z === 0 && zi === 'same' ? '0–1' : HOUR_SPAN[z], late: false });
    }
    if (zi === 'same') {
      var li = gzIdx(((dg + 1) % 10) % 5 * 2 % 10, 0);
      out.push({ zhi: 0, idx: li, name: gzName(li), span: '23–24', late: true });
    }
    return out;
  }

  /* =========================================================
     四柱反推：给四柱干支，列出 1900–2100 年间合得上的时段
     names[3]（时柱）可空：时辰不详时列出合年月日三柱的整日
     zi: 'next' | 'same'，tz 为出生地时区（用来把交节时刻换成当地钟点）
     ========================================================= */
  function fromPillars(names, opts) {
    opts = opts || {};
    var tz = isFinite(+opts.tz) ? +opts.tz : 8, zi = opts.zi === 'same' ? 'same' : 'next';
    var noHour = !names[3];
    var I = names.map(function (n, k) { return k === 3 && noHour ? 0 : parseGZ(n); });
    if (I.some(function (x) { return x < 0; })) return { error: '干支写得不对' };
    var yi = I[0], mi = I[1], di = I[2], hi = I[3];
    var mb = mi % 12;
    if (((yi % 10) % 5 * 2 + 2 + mod(mb - 2, 12)) % 10 !== mi % 10) return { error: '月干与年干不合五虎遁：' + names[0] + '年无' + names[1] + '月' };
    var hz = hi % 12;
    if (!noHour) {
      // 时干照五鼠遁接日干；「当日」派的晚子时，时干接的是次日
      var okDirect = ((di % 10) % 5 * 2 + hz) % 10 === hi % 10;
      var okLate = hz === 0 && zi === 'same' && (((di + 1) % 10) % 5 * 2) % 10 === hi % 10;
      if (!okDirect && !okLate) return { error: '时干与日干不合五鼠遁：' + names[2] + '日无' + names[3] + '时' };
    }
    var res = [];
    for (var k = 0; k < TERMS.length - 1; k++) {
      var t = TERMS[k];
      if (!isJie(t.n) || JIE_BRANCH[t.n] !== mb) continue;
      var kn = nextJieIdx(k); if (kn < 0) break;
      var a = t.t, b = TERMS[kn].t;
      if (a < RANGE.min || b > RANGE.max) continue;
      // 该月所在干支年
      var lc = null;
      for (var q = k; q >= 0; q--) if (TERMS[q].n === '立春') { lc = TERMS[q]; break; }
      if (!lc || yearGZ(new Date(lc.t + 8 * 3600e3).getUTCFullYear()) !== yi) continue;
      // 逐日找日柱、时柱
      var la = a + tz * 3600e3, lb = b + tz * 3600e3;   // 换成当地钟点（UTC 字段表示）
      for (var d0 = Math.floor(la / DAY) * DAY - DAY; d0 < lb + DAY; d0 += DAY) {
        var f = fields(d0), Jd = jdn(f.y, f.mo, f.d);
        if (noHour) {
          // 一个干支日：「次日」派自前一日 23 点起至本日 23 点，「当日」派即本日 0 至 24 点
          if (mod(Jd - 2415021 + 10, 60) !== di) continue;
          var ds = zi === 'next' ? d0 - 3600e3 : d0, de = ds + DAY;
          var fr = Math.max(ds, la), tt = Math.min(de, lb);
          if (fr < tt) res.push({ from: fmtF(fields(fr)), to: fmtF(fields(tt)), cut: fr > ds || tt < de, day: true });
          continue;
        }
        // 时辰 hz 在钟点上的区间；子时跨两日
        var spans = hz === 0 ? [[-1, 1]] : [[hz * 2 - 1, hz * 2 + 1]];
        spans.forEach(function (sp) {
          var s = d0 + sp[0] * 3600e3, e = d0 + sp[1] * 3600e3;          // 本日 sp[0] 点至 sp[1] 点（子时为前一日 23 点至本日 1 点）
          // 日柱：早子（0–1 点）属本日；晚子（23–24 点）属前一日钟面，派别决定算哪天
          var parts = hz === 0 ? [[s, d0, Jd - 1, true], [d0, e, Jd, false]] : [[s, e, Jd, false]];
          parts.forEach(function (pt) {
            var lateZi = pt[3], jdCivil = pt[2];
            var dayJd = lateZi && zi === 'next' ? jdCivil + 1 : jdCivil;
            var baseJd = lateZi ? jdCivil + 1 : jdCivil;
            if (mod(dayJd - 2415021 + 10, 60) !== di) return;
            var bd = mod(baseJd - 2415021 + 10, 60);
            if (gzIdx(((bd % 10) % 5 * 2 + hz) % 10, hz) !== hi) return;
            var from = Math.max(pt[0], la), to = Math.min(pt[1], lb);
            if (from >= to) return;
            res.push({ from: fmtF(fields(from)), to: fmtF(fields(to)), cut: from > pt[0] || to < pt[1] });
          });
        });
      }
    }
    return { list: res };
  }

  var api = {
    GAN: GAN, ZHI: ZHI, SX: SX, WX: WX, GAN_WX: GAN_WX, ZHI_WX: ZHI_WX, CANG: CANG, SS: SS, SS_SHORT: SS_SHORT, STAGES: STAGES,
    JIE: JIE, PILLAR_NAME: PILLAR_NAME, RANGE: RANGE, TERMS: TERMS, LUNAR: LUNAR,
    chart: chart, analyze: analyze, extraCol: extraCol, shensha: shensha, relations: relations, tiaohou: tiaohou,
    shishen: shishen, stage: stage, nayin: nayin, kongOf: kongOf, wangshuai: wangshuai,
    yearGZ: yearGZ, liuyue: liuyue, liuri: liuri, liushi: liushi, dayGZ: dayGZ, fromPillars: fromPillars, gzName: gzName, parseGZ: parseGZ, gzIdx: gzIdx,
    isChinaDST: isChinaDST, eqTime: eqTime, fmtF: fmtF, fields: fields, mod: mod
  };
  if (isNode) module.exports = api; else root.BZ = api;
})(this);
