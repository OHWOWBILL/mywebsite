/* 潜蛟阁 · 日本旧暦月表（1899 冬月 至 2100 腊月）
   由 scripts/lunar/gen-kyureki.js 生成，勿手改。与站内农历（/fabao/lunar.js）同法，
   只是朔与中气按日本时间（UTC+9）落日；六曜、不成就日用它。
   存法与 lunar.js 相同：1899 冬月初一的日序（Unix 日），两个前置月的天数，之后每个旧暦年 5 位十六进制。
   浏览器里挂 window.QJ_KYUREKI；node 里 require 即得同一对象。 */
(function (root) {
  'use strict';
  var DAY = 86400000, FIRST = -25596, PRE = [29,30];
  var DATA =
    '816d20075200ea550d4a0054b00a97415560055a00b55216d2007526172500b2500a4b5129b00aad0056a20b6900ba971b52' +
    '00d9200d2551a4d00956002b5415ad006d400da921d9200e9260d260052700a57512b600ada006d430ea9007497169300a93' +
    '0052b60a5b0096d00b6a41b5400ba400b4921a9300a957152b0052d00aad5156a00db200da431d4900d4a81a9500a9600556' +
    '60ab500ad5006d240ea500ea500e4a30c9600a9b715560056a00b595175200752007254164b00a4b812ab002ad0056b60b69' +
    '00da900d9241b2500d25a1a4d00a56002b6615ad006d400da951d9200e9200d2630a5600a57812b600b5a006d450ec900749' +
    '00693415270052b00a5b2155a0036a71b5500ba400b4951a9300a950052d30a5d00aad915aa005d200da551d4a00d4a00a95' +
    '4152d0055600ab5215aa006d260ea500ea500e4a50c9600c9b0055a30ad500b69b17520075200b256164b00a4b004ab5055b' +
    '0056d00b6921b5200d9271d2500d2500a4d514ad002b6005b530da900ea981d9200e9200d2660a5600a57004d6406b5006d5' +
    '00ec930e92006937152b0052b00a5b5155a0056a00b554174900b4981a9300a950052d60aad00ab5005aa40ba500da500d4a' +
    '31a9500c957152e0055600ab5515b2006d200ea541e4a0064a80c9700cab0055a60ad500b6900752416a500b250064b31497' +
    '004ab';
  var MONTHS = null;   // [{ y, m, leap, day, len }]
  function build() {
    if (MONTHS) return MONTHS;
    MONTHS = [{ y: 1899, m: 11, leap: false, day: FIRST, len: PRE[0] }, { y: 1899, m: 12, leap: false, day: FIRST + PRE[0], len: PRE[1] }];
    var day = FIRST + PRE[0] + PRE[1];
    for (var k = 0; k < DATA.length / 5; k++) {
      var Y = 1900 + k, leap = parseInt(DATA[k * 5], 16), bits = parseInt(DATA.substr(k * 5 + 1, 4), 16), i = 0;
      for (var m = 1; m <= 12; m++) {
        var len = (bits >> i++) & 1 ? 30 : 29;
        MONTHS.push({ y: Y, m: m, leap: false, day: day, len: len }); day += len;
        if (m === leap) { len = (bits >> i++) & 1 ? 30 : 29; MONTHS.push({ y: Y, m: m, leap: true, day: day, len: len }); day += len; }
      }
    }
    return MONTHS;
  }
  var RANGE = { from: [1899, 12, 3], to: [2101, 1, 28] };
  // 公历（年、月、日）→ 农历 { y, m, d, leap, len }；超出范围返回 null
  function toLunar(y, m, d) {
    var M = build(), day = Math.floor(Date.UTC(y, m - 1, d) / DAY);
    if (day < M[0].day || day >= M[M.length - 1].day + M[M.length - 1].len) return null;
    var lo = 0, hi = M.length - 1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (M[mid].day <= day) lo = mid; else hi = mid - 1; }
    var e = M[lo];
    return { y: e.y, m: e.m, d: day - e.day + 1, leap: e.leap, len: e.len };
  }
  // 农历 → 公历 { y, m, d }；日子越过该月天数或月份不存在返回 null
  function toSolar(Y, mo, d, leap) {
    var M = build();
    for (var i = 0; i < M.length; i++) {
      var e = M[i];
      if (e.y === Y && e.m === mo && e.leap === !!leap) {
        if (d < 1 || d > e.len) return null;
        var t = new Date((e.day + d - 1) * DAY);
        return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
      }
    }
    return null;
  }
  // 某农历年的各月 [{ m, leap, len }]
  function monthsOf(Y) { return build().filter(function (e) { return e.y === Y; }).map(function (e) { return { m: e.m, leap: e.leap, len: e.len }; }); }
  function leapOf(Y) { var r = monthsOf(Y).filter(function (e) { return e.leap; })[0]; return r ? r.m : 0; }
  var MONTH_CN = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  function dayCN(d) { return d <= 10 ? '初' + '一二三四五六七八九十'[d - 1] : d < 20 ? '十' + '一二三四五六七八九'[d - 11] : d === 20 ? '二十' : d < 30 ? '廿' + '一二三四五六七八九'[d - 21] : '三十'; }
  function text(L) { return L ? (L.leap ? '闰' : '') + MONTH_CN[L.m - 1] + '月' + dayCN(L.d) : ''; }
  var api = { toLunar: toLunar, toSolar: toSolar, monthsOf: monthsOf, leapOf: leapOf, text: text, dayCN: dayCN, MONTH_CN: MONTH_CN, RANGE: RANGE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.QJ_KYUREKI = api;
})(this);
