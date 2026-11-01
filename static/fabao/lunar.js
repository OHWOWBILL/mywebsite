/* 潜蛟阁 · 农历月表（1899 冬月 至 2100 腊月）
   由 scripts/lunar/gen.js 生成，勿手改。口径为寿星万年历（与紫金山天文台历书一致），
   不用浏览器的 Intl 中国历：后者在 1917、1922、1987 的闰月归属与 2027、2030 春节等十余处差一个月或一天。
   存法：1899 冬月初一的日序（Unix 日），两个前置月的天数，之后每个农历年 5 位十六进制：
   首位为闰月（0 无闰），后四位为各月大小（第 i 位为 1 即三十日，闰月按月序插在其本月之后）。
   浏览器里挂 window.QJ_LUNAR；node 里 require 即得同一对象。 */
(function (root) {
  'use strict';
  var DAY = 86400000, FIRST = -25596, PRE = [29,30];
  var DATA =
    '816d20075200ea55164a0064b00a9b415560056a00b59217520075261b2500b2500a4b514ab002ad0056b20b6900da971d92' +
    '00e9200d2551a4d00a56002b6415b5006d400ea921e9200e9260d260052b00a57512b600b5a006d430ec9007497169300a93' +
    '0052b60a5b00aad0056a41b5500ba400b4921a9300a957152d0053600aad515aa005b200da531d4a00d4a80a9500a9700556' +
    '60ab500ad5006d240ea500ea50064a30c9700a9b7155a0056a00b695175200b5200b254164b00a4b814ab002ad0056d60b69' +
    '00da900d9241d2500d25a1a4d00a56002b6605b5006d500ea951e9200e9200d2630a5600a57814d60035a006d5516c900749' +
    '006934152b0052b00a5b2155a0056a71b5500ba400b4951a9300a950052d40aad00ab5915aa005d200da561d4a00d4a00c95' +
    '4152e0055600ab5215b2006d260ea5007250064b50c9700cab0055a30ad600b69b175200b5200b2561a4b00a4b004ab5055b' +
    '005ad00b6a21b5200d9271d2500d2500a55514ad004b6005b530daa00ec981e9200e9200d2660a5600a57004d6406d500755' +
    '0074930e93006937152b0052b00a5b5155a0056a00b654174a00b4a81a9500a950052d60aad00ab5005aa40ba500da500d4a' +
    '31c9500c967194e0055600ab5515b2006d200ea540e4a0068b80c97004ab0055b60ad600b6a007524172500b4500a8b2149b' +
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
  else root.QJ_LUNAR = api;
})(this);
