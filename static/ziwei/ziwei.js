/* =========================================================
   紫微斗数 · 排盘核心
   ---------------------------------------------------------
   安星交给 iztro（MIT，https://github.com/SylarLong/iztro），
   本文件只做三件事：
     1. 定口径：正月初一换年；闰月以十五为界，前半归本月、后半归下月；
        晚子时（23 点后）作次日子时。
     2. 星曜庙旺改用《斗数全书》口径（数据取自 Renhuai123/ziwei-doushu
        的 SB_QS 表，MIT，Copyright (c) 2026 紫微研究）。
     3. 把 iztro 的结果整理成按地支（子=0）索引的十二宫，
        并补上飞化、自化、三方四正、转宫这些盘面要用的算法。

   浏览器里挂 window.ZW；node 里 require 即得同一对象
   （node 需先设 global.self = global 再 require iztro）。
   ========================================================= */
(function (root) {
  'use strict';
  var NODE = typeof module !== 'undefined' && module.exports;
  var iztro = NODE ? require('./iztro.min.js') : root.iztro;
  // 节气表（与奇门手记共用，1899 大雪 至 2101 惊蛰，精确到分）
  var TERMS = (NODE ? require('../qimen/jieqi.js') : root.QM_JIEQI).terms;
  var astro = iztro.astro;
  astro.config({ yearDivide: 'normal', horoscopeDivide: 'normal' });

  var GAN = '甲乙丙丁戊己庚辛壬癸';
  var ZHI = '子丑寅卯辰巳午未申酉戌亥';
  var HUA = ['禄', '权', '科', '忌'];
  // 十干四化（禄权科忌）。庚干取「阳武阴同」，与 iztro 默认一致。
  var SIHUA = {
    甲: ['廉贞', '破军', '武曲', '太阳'], 乙: ['天机', '天梁', '紫微', '太阴'],
    丙: ['天同', '天机', '文昌', '廉贞'], 丁: ['太阴', '天同', '天机', '巨门'],
    戊: ['贪狼', '太阴', '右弼', '天机'], 己: ['武曲', '贪狼', '天梁', '文曲'],
    庚: ['太阳', '武曲', '太阴', '天同'], 辛: ['巨门', '太阳', '文曲', '文昌'],
    壬: ['天梁', '紫微', '左辅', '武曲'], 癸: ['破军', '巨门', '太阴', '贪狼']
  };
  // 十二宫：从命宫起逆行
  var PALACES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'];
  var SHORT = ['命', '兄', '夫', '子', '财', '疾', '迁', '友', '官', '田', '福', '父'];
  var IZ_NAME = { 仆役: '交友' };
  var TIMES = ['早子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '晚子'];
  var TIME_RANGE = ['00:00–00:59', '01–03', '03–05', '05–07', '07–09', '09–11', '11–13', '13–15', '15–17', '17–19', '19–21', '21–23', '23:00–23:59'];

  // 《斗数全书》庙旺：每星 12 位，子起；1庙 2旺 3得 4利 5平 6不 7陷，0 不标
  var BRIGHT_QS = {
    紫微: '512232112232', 天机: '173245173245', 太阳: '762122233567', 武曲: '213415213415',
    天同: '264551762551', 廉贞: '541547541547', 天府: '111313213213', 太阴: '112777664221',
    贪狼: '215417215417', 巨门: '261172261172', 天相: '111733131733', 天梁: '121113127317',
    七杀: '211215211215', 破军: '123725123725', 文昌: '317431743174', 文曲: '315231723172',
    左辅: '211715215716', 右弼: '112715216715', 天魁: '220100100002', 天钺: '002002021100',
    禄存: '101101101101', 天马: '002005002005', 火星: '731473147314', 铃星: '731473147314',
    擎羊: '710710710710', 陀罗: '017017017017', 地空: '577571151177', 地劫: '775576151557'
  };
  var BRIGHT_CN = ['', '庙', '旺', '得', '利', '平', '不', '陷'];
  function brightOf(name, br) {
    var row = BRIGHT_QS[name];
    return row ? BRIGHT_CN[+row[br]] : '';
  }

  // 钟点 → 时辰序号（0 早子 … 12 晚子）
  function timeIndexOf(h) { return h === 0 ? 0 : h === 23 ? 12 : Math.floor((h + 1) / 2); }
  var izIdx2br = function (i) { return (i + 2) % 12; };   // iztro 宫序（寅=0）→ 地支（子=0）
  var br2izIdx = function (b) { return (b + 10) % 12; };

  function cleanName(n) { return IZ_NAME[n] || n; }

  function mapStar(s, br, kind) {
    var o = { name: s.name, kind: kind, type: s.type };
    var b = brightOf(s.name, br);
    if (b) o.bright = b;
    if (s.mutagen) o.hua = s.mutagen;
    return o;
  }

  // 八字四柱的年、月：年以立春、月以节的交节时刻换（不随农历年月）。
  // ms = 出生时刻（UTC 毫秒）。超出节气表范围时返回 null，由调用方退回 iztro 的结果。
  var MONTH_BRANCH_BY_JIE = { 立春: 2, 惊蛰: 3, 清明: 4, 立夏: 5, 芒种: 6, 小暑: 7, 立秋: 8, 白露: 9, 寒露: 10, 立冬: 11, 大雪: 0, 小寒: 1 };
  function yearMonthGZ(ms) {
    if (!(ms >= TERMS[0].t && ms < TERMS[TERMS.length - 1].t)) return null;
    var lo = 0, hi = TERMS.length - 1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (TERMS[mid].t <= ms) lo = mid; else hi = mid - 1; }
    var jie = null, liChun = null;
    for (var k = lo; k >= 0 && (!jie || !liChun); k--) {
      if (!jie && MONTH_BRANCH_BY_JIE[TERMS[k].n] != null) jie = TERMS[k];
      if (!liChun && TERMS[k].n === '立春') liChun = TERMS[k];
    }
    if (!jie || !liChun) return null;
    var y = new Date(liChun.t + 8 * 3600000).getUTCFullYear();     // 立春所在公历年
    var yi = ((y - 1984) % 60 + 60) % 60;
    var mb = MONTH_BRANCH_BY_JIE[jie.n];
    var ms_ = ((yi % 10) % 5 * 2 + 2 + (mb - 2 + 12) % 12) % 10;   // 五虎遁
    return { year: GAN[yi % 10] + ZHI[yi % 12], month: GAN[ms_] + ZHI[mb], jie: jie, liChun: liChun };
  }
  // 出生时刻：公历入参带 ms 就用；否则按 iztro 的公历日期 + 时辰中点，按出生地时区（默认东八区）折成 UTC
  function birthMs(inp, solarDate) {
    if (typeof inp.ms === 'number' && isFinite(inp.ms)) return inp.ms;
    var d = String(solarDate).split('-').map(Number);
    var hm = inp.t === 0 ? [0, 30] : inp.t === 12 ? [23, 30] : [inp.t * 2, 0];
    var tz = typeof inp.tz === 'number' && isFinite(inp.tz) ? inp.tz : 8;
    return Date.UTC(d[0], d[1] - 1, d[2], hm[0], hm[1]) - tz * 3600000;
  }

  // 入参：{ cal:'solar'|'lunar', y, m, d, leap(农历闰月), t(时辰序号 0–12), g:'男'|'女' }
  function chart(inp) {
    var date = inp.y + '-' + inp.m + '-' + inp.d;
    var a = inp.cal === 'lunar'
      ? astro.byLunar(date, inp.t, inp.g, !!inp.leap, true, 'zh-CN')
      : astro.bySolar(date, inp.t, inp.g, true, 'zh-CN');
    var raw = a.rawDates;
    var yGan = raw.chineseDate.yearly[0], yZhi = raw.chineseDate.yearly[1];
    var pal = new Array(12);
    a.palaces.forEach(function (p, i) {
      var br = izIdx2br(i);
      pal[br] = {
        br: br, zhi: ZHI[br], gan: p.heavenlyStem, name: cleanName(p.name),
        body: p.isBodyPalace, laiyin: p.isOriginalPalace,
        major: p.majorStars.map(function (s) { return mapStar(s, br, 'major'); }),
        minor: p.minorStars.map(function (s) { return mapStar(s, br, 'minor'); }),
        adj: p.adjectiveStars.map(function (s) { return { name: s.name, kind: 'adj', type: s.type }; }),
        cs12: p.changsheng12, bs12: p.boshi12, jq12: p.jiangqian12, sq12: p.suiqian12,
        dx: p.decadal.range, ages: p.ages
      };
    });
    var ming = ZHI.indexOf(a.earthlyBranchOfSoulPalace);
    var shen = ZHI.indexOf(a.earthlyBranchOfBodyPalace);
    pal.forEach(function (p) { p.rel = (ming - p.br + 12) % 12; });   // 命宫起逆数第几宫
    // 自化（离心）：本宫干所化之星就坐本宫
    pal.forEach(function (p) {
      var list = SIHUA[p.gan];
      p.major.concat(p.minor).forEach(function (s) {
        var k = list.indexOf(s.name);
        if (k >= 0) s.self = HUA[k];
      });
    });
    var yinyang = (GAN.indexOf(yGan) % 2 === 0 ? '阳' : '阴') + inp.g;
    // 四柱：日、时用 iztro（晚子作次日）；年、月按节气换，iztro 的 chineseDate 在「正月初一换年」口径下给的是农历年月
    var gz = [raw.chineseDate.yearly, raw.chineseDate.monthly, raw.chineseDate.daily, raw.chineseDate.hourly].map(function (x) { return x.join(''); });
    var ym = yearMonthGZ(birthMs(inp, a.solarDate));
    if (ym) { gz[0] = ym.year; gz[1] = ym.month; }
    return {
      input: inp, astro: a, palaces: pal, ming: ming, shen: shen,
      info: {
        solar: a.solarDate, lunar: a.lunarDate + ' ' + a.time, lunarRaw: raw.lunarDate,
        gz: gz,
        time: a.time, timeRange: a.timeRange, ju: a.fiveElementsClass,
        soul: a.soul, body: a.body, zodiac: a.zodiac, sign: a.sign,
        yinyang: yinyang, yGan: yGan, yZhi: yZhi
      }
    };
  }

  // 找星所在宫（地支），没有返回 -1
  function starBranch(c, name) {
    for (var b = 0; b < 12; b++) {
      var p = c.palaces[b];
      if (p.major.some(function (s) { return s.name === name; }) || p.minor.some(function (s) { return s.name === name; })) return b;
    }
    return -1;
  }

  // 某干四化落在哪些宫：[{hua:'禄', star:'廉贞', to:地支}]
  function flyByGan(c, gan) {
    return SIHUA[gan].map(function (star, k) { return { hua: HUA[k], star: star, to: starBranch(c, star) }; });
  }
  // 宫干飞化：从 br 宫出
  function fly(c, br) {
    return flyByGan(c, c.palaces[br].gan).map(function (f) { f.from = br; f.self = f.to === br; return f; });
  }

  // 三方四正：本宫、对宫、两三合
  function sanfang(br) { return { self: br, opp: (br + 6) % 12, he: [(br + 4) % 12, (br + 8) % 12] }; }

  // 转宫：以 base 宫为太极点（视作「命」），br 宫在其下是第几宫
  function relFrom(base, br) { return (base - br + 12) % 12; }
  // 「命之夫」式名称：太极宫的本命短名 + 之 + 转后短名
  function zhuanName(c, base, br) {
    return SHORT[c.palaces[base].rel] + '之' + SHORT[relFrom(base, br)];
  }

  // 运限：给公历年（可选月）取大限、流年、小限、流月
  // 农历某年某月十五 → 公历日期串（借 iztro 的农历排盘取 solarDate）
  var l2sCache = {};
  function lunarToSolar(y, m, d) {
    var k = y + '-' + m + '-' + d;
    if (!l2sCache[k]) l2sCache[k] = astro.byLunar(k, 0, '男', false, true, 'zh-CN').solarDate;
    return l2sCache[k];
  }
  // 运限：给农历年（可选农历月）取大限、流年、小限、流月
  function yun(c, year, lunarMonth) {
    var h = c.astro.horoscope(lunarToSolar(year, lunarMonth || 6, 15), 0);
    function scope(s, label) {
      if (!s || s.index == null) return null;
      var names = new Array(12), stars = new Array(12);
      s.palaceNames.forEach(function (n, i) { names[izIdx2br(i)] = cleanName(n); });
      if (s.stars) s.stars.forEach(function (arr, i) { stars[izIdx2br(i)] = arr.map(function (x) { return x.name; }); });
      return {
        label: label, br: izIdx2br(s.index), gan: s.heavenlyStem, zhi: s.earthlyBranch,
        names: names, stars: stars, hua: s.mutagen, nominalAge: s.nominalAge
      };
    }
    return {
      decadal: scope(h.decadal, '大限'),
      yearly: scope(h.yearly, '流年'),
      age: scope(h.age, '小限'),
      monthly: lunarMonth ? scope(h.monthly, '流月') : null,
      lunar: h.lunarDate, solar: h.solarDate
    };
  }

  // 当前公历年对应的虚岁（按农历年）
  function nominalAge(c, year) { return year - c.info.lunarRaw.lunarYear + 1; }

  // 中国大陆 1986–1991 夏令时（起止日都含；只判日期，不自动扣）
  var DST_CN = { 1986: [5, 4, 9, 14], 1987: [4, 12, 9, 13], 1988: [4, 17, 9, 11], 1989: [4, 16, 9, 17], 1990: [4, 15, 9, 16], 1991: [4, 14, 9, 15] };
  function isChinaDST(y, m, d) {
    var r = DST_CN[y]; if (!r) return false;
    var v = m * 100 + d;
    return v >= r[0] * 100 + r[1] && v <= r[2] * 100 + r[3];
  }

  // 真太阳时：clock 为出生地钟表时间（Date，按本机时区解读其年月日时分），tz 为出生地时区（小时）
  function eqTime(dt) {
    var start = new Date(dt.getFullYear(), 0, 1);
    var doy = Math.floor((dt - start) / 86400000);
    var g = 2 * Math.PI / 365 * (doy + (dt.getHours() - 12) / 24);
    return 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  }
  function solarClock(dt, lon, tz) {
    var lonFix = (lon - tz * 15) * 4, eot = eqTime(dt), shift = lonFix + eot;
    return { date: new Date(dt.getTime() + shift * 60000), shift: shift, lonFix: lonFix, eot: eot };
  }

  var ZW = {
    GAN: GAN, ZHI: ZHI, HUA: HUA, SIHUA: SIHUA, PALACES: PALACES, SHORT: SHORT, TIMES: TIMES, TIME_RANGE: TIME_RANGE,
    chart: chart, yearMonthGZ: yearMonthGZ, fly: fly, flyByGan: flyByGan, sanfang: sanfang, relFrom: relFrom, zhuanName: zhuanName,
    yun: yun, lunarToSolar: lunarToSolar, nominalAge: nominalAge, timeIndexOf: timeIndexOf, brightOf: brightOf, starBranch: starBranch,
    isChinaDST: isChinaDST, solarClock: solarClock
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = ZW; else root.ZW = ZW;
})(this);
