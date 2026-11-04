/* =========================================================
   通书 · 日月出没与月龄 —— 只管算，不碰页面
   ---------------------------------------------------------
   日出日落：NOAA 太阳计算式（NOAA Global Monitoring Laboratory「Solar Calculator」所用、出自 Meeus
     《Astronomical Algorithms》的简式），太阳上边缘切地平为出没（天顶距 90.833°，含大气折射 34′、日半径 16′），
     先按当日 0 时算一遍，再按所得时刻重算一遍。
   月出月落：月亮地心黄经黄纬取星盘的 /xingpan/xingpan.js（XP.bodies，Schlyter 法，精一二角分），
     月地距离取 Meeus 第 47 章距离级数的主项，得地平视差 π；月心视高度为 0（地心高度 h0 = π − 34′）即出没，
     与国立天文台「月の出入り」同口径（月の中心が地平線に一致する時刻）。当地一日里每二十分钟取一点，
     变号处二分求根，精到十秒以内。
   月龄：上一次朔（日月黄经相合）到当地正午的天数，与国立天文台「月齢は正午の値」同。
   地点用 /fabao/cities.js 的 QJ_CITIES（[名, 东经, 北纬, 时区]）；欧美澳几城另记 IANA 时区，
   浏览器 Intl 换算夏令时，其余按城市表的固定时区。时刻一律回 UTC 毫秒，hm() 换成当地「时:分」。
   对照：国立天文台暦計算室「各地のこよみ」东京 2026 年 11 月（scripts/tongshu/check.js 有逐日核对）。
   浏览器里挂 window.TS_SKY（月亮要先载 /xingpan/xingpan.js）；node 里 require 即得同一对象。
   ========================================================= */
(function (root) {
  'use strict';
  var NODE = typeof module !== 'undefined' && module.exports;
  var XP0 = NODE ? require('../xingpan/xingpan.js') : null, CITY0 = NODE ? require('./cities.js') : null;
  function XP() { return XP0 || root.XP || null; }
  function CITIES() { return CITY0 || root.QJ_CITIES || null; }
  var DAY = 86400000, RAD = Math.PI / 180, DEG = 180 / Math.PI;
  function mod(a, n) { return ((a % n) + n) % n; }
  var sin = function (x) { return Math.sin(x * RAD); }, cos = function (x) { return Math.cos(x * RAD); };

  /* —— 地点与时区 —— */
  var IANA = { 伦敦: 'Europe/London', 巴黎: 'Europe/Paris', 柏林: 'Europe/Berlin', 纽约: 'America/New_York', 多伦多: 'America/Toronto',
    洛杉矶: 'America/Los_Angeles', 旧金山: 'America/Los_Angeles', 西雅图: 'America/Los_Angeles', 温哥华: 'America/Vancouver',
    悉尼: 'Australia/Sydney', 墨尔本: 'Australia/Melbourne', 奥克兰: 'Pacific/Auckland' };
  function place(name) {
    var C = CITIES(), c = C && C.byName(name);
    if (!c) return null;
    return { name: c[0], lon: c[1], lat: c[2], tz: c[3], iana: IANA[c[0]] || null };
  }
  var fmtCache = {};
  // 某一时刻在该地的时区偏移（分钟）
  function offsetMin(p, t) {
    if (!p.iana || typeof Intl === 'undefined') return p.tz * 60;
    try {
      var f = fmtCache[p.iana] || (fmtCache[p.iana] = new Intl.DateTimeFormat('en-US', { timeZone: p.iana, hourCycle: 'h23',
        year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }));
      var o = {}; f.formatToParts(new Date(t)).forEach(function (x) { o[x.type] = +x.value; });
      return Math.round((Date.UTC(o.year, o.month - 1, o.day, o.hour % 24, o.minute, o.second) - Math.floor(t / 1000) * 1000) / 60000);
    } catch (e) { return p.tz * 60; }
  }
  // 该地某日 0 时的 UTC 毫秒
  function midnight(y, m, d, p) {
    var t = Date.UTC(y, m - 1, d) - offsetMin(p, Date.UTC(y, m - 1, d, 12) - p.tz * 3600e3) * 60000;
    return Date.UTC(y, m - 1, d) - offsetMin(p, t) * 60000;
  }
  function hm(t, p) {
    if (t == null) return '';
    var x = new Date(Math.round((t + offsetMin(p, t) * 60000) / 60000) * 60000);
    return (x.getUTCHours() < 10 ? '0' : '') + x.getUTCHours() + ':' + (x.getUTCMinutes() < 10 ? '0' : '') + x.getUTCMinutes();
  }

  /* —— 太阳（NOAA） —— */
  function jc(t) { return (t / DAY + 2440587.5 - 2451545) / 36525; }
  function sunNOAA(T) {
    var L0 = mod(280.46646 + T * (36000.76983 + T * 0.0003032), 360), M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    var e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    var C = sin(M) * (1.914602 - T * (0.004817 + 0.000014 * T)) + sin(2 * M) * (0.019993 - 0.000101 * T) + sin(3 * M) * 0.000289;
    var om = 125.04 - 1934.136 * T, lam = L0 + C - 0.00569 - 0.00478 * sin(om);
    var eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * cos(om);
    var dec = Math.asin(sin(eps) * sin(lam)) * DEG, y = Math.pow(Math.tan(eps / 2 * RAD), 2);
    var eot = 4 * DEG * (y * sin(2 * L0) - 2 * e * sin(M) + 4 * e * y * sin(M) * cos(2 * L0) - 0.5 * y * y * sin(4 * L0) - 1.25 * e * e * sin(2 * M));
    return { dec: dec, eot: eot };
  }
  // kind: 1 日出、-1 日落、0 中天；u0 为该民用日 0 时（UTC）。回 { t, c }，c 越出 ±1 即极夜（> 1）极昼（< −1），t 为 NaN
  function sunEvent(u0, lat, lon, kind) {
    var t = u0 + DAY / 2 - lon / 360 * DAY, c = 0;
    for (var k = 0; k < 3; k++) {
      var s = sunNOAA(jc(t)), ha = 0;
      if (kind) {
        c = cos(90.833) / (cos(lat) * cos(s.dec)) - Math.tan(lat * RAD) * Math.tan(s.dec * RAD);
        if (c < -1 || c > 1) return { t: NaN, c: c };
        ha = Math.acos(c) * DEG * kind;
      }
      t = u0 + (720 - 4 * (lon + ha) - s.eot) * 60000;
    }
    return { t: t, c: c };
  }

  /* —— 月亮 —— */
  function moonDist(t) {               // Meeus 47.A 距离主项，公里
    var T = jc(t), E = 1 - 0.002516 * T;
    var D = 297.8501921 + 445267.1114034 * T, M = 357.5291092 + 35999.0502909 * T, Mp = 134.9633964 + 477198.8675055 * T, F = 93.2720950 + 483202.0175233 * T;
    return 385000.56 - 20905.355 * cos(Mp) - 3699.111 * cos(2 * D - Mp) - 2955.968 * cos(2 * D) - 569.925 * cos(2 * Mp)
      + 48.888 * E * cos(M) - 3.149 * cos(2 * F) + 246.158 * cos(2 * D - 2 * Mp) - 152.138 * E * cos(2 * D - M - Mp)
      - 170.733 * cos(2 * D + Mp) - 204.586 * E * cos(2 * D - M) - 129.620 * E * cos(M - Mp) + 108.743 * cos(D)
      + 104.755 * E * cos(M + Mp) + 10.321 * cos(2 * D - 2 * F) + 79.661 * cos(Mp - 2 * F) - 34.782 * cos(4 * D - Mp)
      - 23.210 * cos(3 * Mp) - 21.636 * cos(4 * D - 2 * Mp) + 24.208 * E * cos(2 * D + M - Mp) + 30.824 * E * cos(2 * D + M);
  }
  // 月心地心高度减去出没高度 h0（度）
  function moonH(t, lat, lon) {
    var X = XP(), b = X.bodies(t).moon, eps = 23.4393 - 3.563e-7 * X.dayNum(t);
    var sd = sin(b.lat) * cos(eps) + cos(b.lat) * sin(eps) * sin(b.lon), dec = Math.asin(sd) * DEG;
    var ra = Math.atan2(sin(b.lon) * cos(eps) - Math.tan(b.lat * RAD) * sin(eps), cos(b.lon)) * DEG;
    var H = X.gmst(t) + lon - ra, h = Math.asin(sin(lat) * sd + cos(lat) * cos(dec) * cos(H)) * DEG;
    var par = Math.asin(6378.14 / moonDist(t)) * DEG;
    return h - (par - 34 / 60);
  }
  // 一段时间里的月出、月落（各取第一次）
  function moonRiseSet(t0, t1, lat, lon) {
    var out = { rise: null, set: null }, step = 20 * 60000, a = t0, fa = moonH(a, lat, lon);
    while (a < t1 && (out.rise == null || out.set == null)) {
      var b = Math.min(a + step, t1), fb = moonH(b, lat, lon);
      if ((fa < 0) !== (fb < 0)) {
        var lo = a, hi = b, flo = fa;
        for (var k = 0; k < 18 && hi - lo > 5000; k++) {
          var mid = (lo + hi) / 2, fm = moonH(mid, lat, lon);
          if ((fm < 0) === (flo < 0)) { lo = mid; flo = fm; } else hi = mid;
        }
        var at = (lo + hi) / 2;
        if (fa < 0 && out.rise == null) out.rise = at;
        if (fa >= 0 && out.set == null) out.set = at;
      }
      a = b; fa = fb;
    }
    return out;
  }
  // 日月黄经差（月减日，0–360）
  function elong(t) { var b = XP().bodies(t); return mod(b.moon.lon - b.sun.lon, 360); }
  // t 之前最近一次朔
  function newMoonBefore(t) {
    var x = t - elong(t) / 12.1907 * DAY;
    for (var k = 0; k < 12; k++) {
      var e = elong(x), d = e > 180 ? e - 360 : e;
      x -= d / 12.1907 * DAY;
      if (Math.abs(d) < 1e-6) break;
    }
    return x > t ? newMoonBefore(x - 2 * DAY) : x;
  }
  var PHASE = ['朔', '蛾眉', '上弦', '盈凸', '望', '亏凸', '下弦', '残月'];

  /* —— 一天 ——
     y, m, d：该地的民用日；p：place() 所得。回 UTC 毫秒（没有就 null） */
  var cache = {};
  function day(y, m, d, p) {
    if (!p) return null;
    var key = p.name + y + '-' + m + '-' + d;
    if (cache[key]) return cache[key];
    var t0 = midnight(y, m, d, p), t1 = midnight(y, m, d + 1, p), u0 = Date.UTC(y, m - 1, d);
    var sr = sunEvent(u0, p.lat, p.lon, 1), ss = sunEvent(u0, p.lat, p.lon, -1);
    var r = { place: p, from: t0, to: t1, noon: sunEvent(u0, p.lat, p.lon, 0).t,
      sunrise: isNaN(sr.t) ? null : sr.t, sunset: isNaN(ss.t) ? null : ss.t, polar: isNaN(sr.t) ? (sr.c > 1 ? 'night' : 'day') : null };
    if (XP()) {
      var mo = moonRiseSet(t0, t1, p.lat, p.lon), noon = t0 + 12 * 3600e3;
      r.moonrise = mo.rise; r.moonset = mo.set;
      r.age = Math.round((noon - newMoonBefore(noon)) / DAY * 10) / 10;
      r.phase = PHASE[Math.floor(mod(elong(noon) / 45 + 0.5, 8))];
    }
    return (cache[key] = r);
  }

  var api = { IANA: IANA, place: place, day: day, hm: hm, midnight: midnight, offsetMin: offsetMin,
    sunEvent: sunEvent, moonRiseSet: moonRiseSet, newMoonBefore: newMoonBefore, elong: elong, PHASE: PHASE };
  if (NODE) module.exports = api; else root.TS_SKY = api;
})(this);
