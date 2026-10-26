// =========================================================
// 潜蛟阁 · 历（站内各处共用的历法小库）
// 节气、月相、干支、建除、农历、梅花时间起卦，都在浏览器里现算，
// 不连任何接口。公式与星盘（partials/qj-compass-live.html）、
// 法宝库（static/fabao/fabao.js、static/meihua/js/app.js）同一套口径，
// 低精度，误差在一刻钟以内，看个意思够了。
// 对外只露一个 window.QJ。
// =========================================================

(function () {
  'use strict';

  var GAN = '甲乙丙丁戊己庚辛壬癸', ZHI = '子丑寅卯辰巳午未申酉戌亥';
  // 黄经 0° 起：春分、清明……惊蛰
  var JIEQI = ['春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
    '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰'];
  var YUE = ['朔', '蛾眉', '上弦', '盈凸', '望', '亏凸', '下弦', '残月'];
  var JIANCHU = '建除满平定执破危成收开闭';
  var LUNAR_MONTH = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  // 先天八卦数：乾一兑二离三震四巽五坎六艮七坤八；爻自下而上
  var BAGUA = [null,
    { n: '乾', x: '天', l: [1, 1, 1] }, { n: '兑', x: '泽', l: [1, 1, 0] }, { n: '离', x: '火', l: [1, 0, 1] },
    { n: '震', x: '雷', l: [1, 0, 0] }, { n: '巽', x: '风', l: [0, 1, 1] }, { n: '坎', x: '水', l: [0, 1, 0] },
    { n: '艮', x: '山', l: [0, 0, 1] }, { n: '坤', x: '地', l: [0, 0, 0] }];

  function mod(a, n) { return ((a % n) + n) % n; }
  var DAY = 86400000;

  // —— 太阳视黄经（度） ——
  function sunLon(d) {
    var n = d.getTime() / DAY + 2440587.5 - 2451545.0;
    var L = 280.460 + 0.9856474 * n, g = (357.528 + 0.9856003 * n) * Math.PI / 180;
    return mod(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g), 360);
  }

  // 太阳到达某黄经的时刻：先按日行一度估，再迭代三次
  function sunAt(target, from) {
    var t = from.getTime() + mod(target - sunLon(from), 360) / 0.9856 * DAY;
    for (var i = 0; i < 3; i++) {
      t += (mod(target - sunLon(new Date(t)) + 180, 360) - 180) / 0.9856 * DAY;
    }
    return new Date(t);
  }

  function dayStart(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function daysBetween(a, b) { return Math.round((dayStart(b) - dayStart(a)) / DAY); }

  // —— 节气：当令之气、第几日、下一气还有几日 ——
  function jieqi(now) {
    var lon = sunLon(now), i = Math.floor(lon / 15);
    var began = sunAt(i * 15, new Date(now.getTime() - 17 * DAY));
    var next = sunAt(mod((i + 1) * 15, 360), now);
    return {
      i: i, name: JIEQI[i], began: began,
      day: daysBetween(began, now) + 1,
      next: JIEQI[(i + 1) % 24], nextAt: next, left: daysBetween(now, next),
      season: season(i)
    };
  }
  // 立春至谷雨为春，立夏至大暑为夏，立秋至霜降为秋，立冬至大寒为冬
  function season(i) {
    var k = mod(i - 21, 24);
    return ['spring', 'summer', 'autumn', 'winter'][Math.floor(k / 6)];
  }

  // —— 月相 ——
  function moon(now) {
    var jd = now.getTime() / DAY + 2440587.5;
    var f = mod((jd - 2451550.1) / 29.530588853, 1);
    return { f: f, age: f * 29.53, lit: (1 - Math.cos(2 * Math.PI * f)) / 2, name: YUE[Math.floor(mod(f * 8 + 0.5, 8))] };
  }
  // 月相 SVG 路径（圆心在原点，半径 r）：亮面一侧是半圆，另一侧是明暗交界的半椭圆
  function moonPath(f, r) {
    var k = Math.cos(2 * Math.PI * f), rx = Math.abs(k) * r, waxing = f < 0.5;
    var limb = waxing ? 1 : 0, term = waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
    return 'M0,' + (-r) + 'A' + r + ',' + r + ' 0 0 ' + limb + ' 0,' + r +
      'A' + rx.toFixed(2) + ',' + r + ' 0 0 ' + term + ' 0,' + (-r) + 'Z';
  }

  // —— 干支 ——
  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  // 日柱（按民用日，不跨子时）。1900-01-01 为甲戌日
  function dayGZ(d) {
    var i = mod(jdn(d.getFullYear(), d.getMonth() + 1, d.getDate()) - 2415021 + 10, 60);
    return { i: i, gan: i % 10, zhi: i % 12, name: GAN[i % 10] + ZHI[i % 12] };
  }
  function hourZhi(d) { return Math.floor(mod(d.getHours() + 1, 24) / 2); }

  // 建除十二神：日支与月建（节气月）相同为「建」，顺数下去
  function jianchu(d) {
    var noon = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
    var m = Math.floor(mod(sunLon(noon) - 315, 360) / 30);   // 0 = 寅月
    return JIANCHU[mod(dayGZ(d).zhi - (m + 2), 12)];
  }

  // —— 农历（浏览器内置 chinese 历） ——
  function lunar(date) {
    try {
      var parts = new Intl.DateTimeFormat('en-u-ca-chinese', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date);
      var get = function (t) { var p = parts.find(function (x) { return x.type === t; }); return p ? p.value : ''; };
      var year = parseInt(get('relatedYear') || get('year'), 10), mraw = get('month');
      var month = parseInt(mraw, 10), day = parseInt(get('day'), 10);
      if (!year || !month || !day || year < 1000) return null;
      var yi = mod(year - 4, 60);
      return {
        year: year, month: month, day: day, leap: /bis/i.test(mraw),
        yearZhi: yi % 12,
        text: GAN[yi % 10] + ZHI[yi % 12] + '年' + (/bis/i.test(mraw) ? '闰' : '') + LUNAR_MONTH[month - 1] + '月' + lunarDay(day)
      };
    } catch (e) { return null; }
  }
  function lunarDay(d) {
    if (d === 10) return '初十';
    if (d === 20) return '二十';
    if (d === 30) return '三十';
    return ['初', '十', '廿', '三'][Math.floor(d / 10)] + '一二三四五六七八九'[(d % 10) - 1];
  }

  // —— 梅花易数 · 年月日时起卦（与 /meihua/ 同法） ——
  // 年支数 + 农历月 + 农历日 → 上卦；再加时支数 → 下卦；÷6 余 → 动爻
  function cast(date) {
    var h = date.getHours();
    var L = lunar(h === 23 ? new Date(date.getTime() + 3600000) : date);
    if (!L) return null;
    var Y = L.yearZhi + 1, H = hourZhi(date) + 1, s1 = Y + L.month + L.day, s2 = s1 + H;
    var up = (s1 % 8) || 8, lo = (s2 % 8) || 8, dong = (s2 % 6) || 6;
    var lines = BAGUA[lo].l.concat(BAGUA[up].l);
    var bian = lines.slice(); bian[dong - 1] = 1 - bian[dong - 1];
    return { upper: up, lower: lo, dong: dong, lines: lines, bian: bian, lunar: L, shi: ZHI[H - 1] };
  }

  // 六十四卦名与释义取自梅花的数据文件，只在用到时加载一次
  var guaP = null;
  function gua() {
    if (!guaP) {
      guaP = new Promise(function (ok, no) {
        if (window.HEXAGRAMS) return ok(window.HEXAGRAMS);
        var s = document.createElement('script');
        s.src = '/meihua/data/hexagrams.js';
        s.onload = function () { ok(window.HEXAGRAMS || []); };
        s.onerror = no;
        document.head.appendChild(s);
      });
    }
    return guaP;
  }
  function findGua(list, lines) {
    return list.find(function (h) { return h.lines.every(function (v, i) { return v === lines[i]; }); });
  }
  function yaoName(lines, i) {
    var n = lines[i] ? '九' : '六';
    return i === 0 ? '初' + n : i === 5 ? '上' + n : n + '二三四五'[i - 1];
  }

  // 卦象 SVG：六爻自上而下画，动爻用 .dong 标出
  function guaSVG(lines, dong, w) {
    w = w || 24;
    var h = w * 0.9, gap = h / 6, bar = gap * 0.56, out = '';
    for (var k = 0; k < 6; k++) {
      var i = 5 - k, y = (k * gap + (gap - bar) / 2).toFixed(2), cls = i === dong - 1 ? ' class="dong"' : '';
      out += lines[i]
        ? '<rect' + cls + ' x="0" y="' + y + '" width="' + w + '" height="' + bar.toFixed(2) + '"/>'
        : '<rect' + cls + ' x="0" y="' + y + '" width="' + (w * 0.42).toFixed(2) + '" height="' + bar.toFixed(2) + '"/>' +
          '<rect' + cls + ' x="' + (w * 0.58).toFixed(2) + '" y="' + y + '" width="' + (w * 0.42).toFixed(2) + '" height="' + bar.toFixed(2) + '"/>';
    }
    return '<svg class="qj-gua-svg" viewBox="0 0 ' + w + ' ' + h.toFixed(2) + '" width="' + w + '" height="' + h.toFixed(2) + '" aria-hidden="true">' + out + '</svg>';
  }

  // 一至九十九的汉字数
  function hanNum(n) {
    var D = '〇一二三四五六七八九', t = Math.floor(n / 10), u = n % 10;
    if (n < 10) return D[n];
    return (t > 1 ? D[t] : '') + '十' + (u ? D[u] : '');
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  // 测试与截图用：网址带 ?jieqi=冬至 可预览各节气的换肤
  function forcedJieqi() {
    try {
      var q = new URLSearchParams(location.search).get('jieqi');
      var i = JIEQI.indexOf(q);
      return i < 0 ? null : i;
    } catch (e) { return null; }
  }

  window.QJ = {
    GAN: GAN, ZHI: ZHI, JIEQI: JIEQI, BAGUA: BAGUA,
    mod: mod, sunLon: sunLon, jieqi: jieqi, season: season, forcedJieqi: forcedJieqi,
    moon: moon, moonPath: moonPath, dayGZ: dayGZ, hourZhi: hourZhi, jianchu: jianchu,
    lunar: lunar, cast: cast, gua: gua, findGua: findGua, yaoName: yaoName, guaSVG: guaSVG,
    ymd: ymd, pad: pad, hanNum: hanNum, daysBetween: daysBetween,
    still: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
})();
