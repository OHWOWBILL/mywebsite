// 星盘核心自检：node scripts/xingpan/check.js
// 太阳对照奇门手记节气表（astronomy-engine 算出）；行星对照公认天象的时刻；宫制对照 Raphael 宫位表。
// 推运部分：2026 年水星等星之留对照公开星历，太阳回归读回黄经，月亮空亡对照公开空亡表（出处见各段注释）。
const XP = require('../../static/xingpan/xingpan.js');
const J = require('../../static/qimen/jieqi.js');
let bad = 0, ok = 0;
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '得', JSON.stringify(a), '应', JSON.stringify(b)); } else ok++; };
const near = (x, y, tol, what) => { const d = Math.abs(XP.mod(x - y + 180, 360) - 180); if (d > tol) { bad++; console.log('✗', what, '差', d.toFixed(4), '° 容', tol); } else ok++; };
const at = iso => XP.bodies(Date.parse(iso));

// —— 太阳：两百年节气，偏差不过一角分半 ——
let worst = 0;
for (let k = 0; k < J.terms.length; k += 3) {
  const t = J.terms[k], want = J.NAMES.indexOf(t.n) * 15, d = Math.abs(XP.mod(XP.bodies(t.t).sun.lon - want + 180, 360) - 180);
  worst = Math.max(worst, d);
}
eq(worst < 0.025, true, '太阳黄经对照节气表（最大偏差 ' + (worst * 60).toFixed(2) + ' 角分）');

// —— 行星：公认天象 ——
let b = at('2020-12-21T18:20Z'); near(b.jupiter.lon, b.saturn.lon, 0.05, '2020-12-21 木土大合相'); near(b.saturn.lon, 300.48, 0.1, '大合相在水瓶 0°29′');
b = at('2024-04-08T18:21Z'); near(b.moon.lon, b.sun.lon, 0.05, '2024-04-08 日全食之朔'); near(b.sun.lon, 19.4, 0.05, '朔在白羊 19°24′');
b = at('2020-10-13T23:20Z'); near(b.mars.lon, b.sun.lon + 180, 0.05, '2020-10-13 火星冲日');
// 逆行起讫：速度在公认时刻前后十二小时内变号
const station = (iso, id, what) => {
  const t = Date.parse(iso), sp = dt => { const a = XP.bodies(t + dt - 3600e3)[id].lon, c = XP.bodies(t + dt + 3600e3)[id].lon; return XP.mod(c - a + 180, 360) - 180; };
  eq(Math.sign(sp(-12 * 3600e3)) !== Math.sign(sp(12 * 3600e3)), true, what);
};
station('2024-04-01T22:14Z', 'mercury', '水星 2024-04-01 留逆');
station('2024-04-25T12:54Z', 'mercury', '水星 2024-04-25 留顺');
station('2023-07-23T01:33Z', 'venus', '金星 2023-07-23 留逆');
station('2023-09-04T01:20Z', 'venus', '金星 2023-09-04 留顺');
// 换座：公认时刻前后一日内过界
const ingress = (iso, id, deg, what) => { const t = Date.parse(iso); const before = XP.bodies(t - 864e5)[id].lon, after = XP.bodies(t + 864e5)[id].lon;
  eq(XP.mod(before - deg + 180, 360) - 180 < 0 && XP.mod(after - deg + 180, 360) - 180 > 0, true, what); };
ingress('2020-03-22T03:58Z', 'saturn', 300, '土星 2020-03-22 入水瓶');
ingress('2023-03-23T12:13Z', 'pluto', 300, '冥王星 2023-03-23 入水瓶');
ingress('2024-11-19T20:29Z', 'pluto', 300, '冥王星 2024-11-19 终入水瓶');
ingress('2024-05-25T23:15Z', 'jupiter', 60, '木星 2024-05-25 入双子');
ingress('2025-03-30T12:00Z', 'neptune', 0, '海王星 2025-03-30 入白羊');
ingress('2025-05-25T03:35Z', 'saturn', 0, '土星 2025-05-25 入白羊');
ingress('2025-06-09T21:03Z', 'jupiter', 90, '木星 2025-06-09 入巨蟹');
ingress('2025-07-07T07:45Z', 'uranus', 60, '天王星 2025-07-07 入双子');

// —— 宫制：Raphael 伦敦（北纬 51°32′）恒星时 0h：11 金牛 9、12 双子 22、上升巨蟹 26°36′、2 狮子 12、3 处女 3 ——
const R = Math.PI / 180, phi = 51.53, eps = 23.44;
const A = { ramc: 0, eps, mc: 0, asc: XP.mod(Math.atan2(1, -Math.tan(phi * R) * Math.sin(eps * R)) / R, 360) };
const c = XP.houses('placidus', A, phi);
eq([11, 12, 2, 3].map(i => Math.round(c[i] % 30)), [9, 22, 13, 3], 'Placidus 宫头（取整度）');
near(A.asc, 116.6, 0.05, '上升巨蟹 26°36′');
eq(XP.houses('porphyry', A, phi)[11] > A.mc && XP.houses('porphyry', A, phi)[12] < A.asc, true, '波菲利宫三分象限');
eq(XP.houses('whole', A, phi).slice(1).map(x => x / 30), [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2], '整宫：上升所在巨蟹为一宫');
// 赤道上 Placidus 等于赤经三分
const c0 = XP.houses('placidus', { ramc: 0, eps, mc: 0, asc: 90 }, 0);
near(c0[11], XP.mod(Math.atan2(Math.sin(30 * R), Math.cos(30 * R) * Math.cos(eps * R)) / R, 360), 1e-6, '赤道 Placidus 十一宫 = 赤经 30° 之黄道点');

// —— 上升、中天：北京日出时上升合太阳，太阳中天时中天合太阳 ——
const lat = 39.9, lon = 116.4;
const altSun = t => { const s = XP.bodies(t).sun.lon, A2 = XP.angles(t, lat, lon), e = A2.eps * R, l = s * R;
  const ra = Math.atan2(Math.sin(l) * Math.cos(e), Math.cos(l)) / R, de = Math.asin(Math.sin(e) * Math.sin(l)) / R;
  return Math.asin(Math.sin(lat * R) * Math.sin(de * R) + Math.cos(lat * R) * Math.cos(de * R) * Math.cos((A2.ramc - ra) * R)) / R; };
let t = Date.parse('2026-06-20T19:00Z'); while (altSun(t) < 0) t += 15e3;
near(XP.angles(t, lat, lon).asc, XP.bodies(t).sun.lon, 0.1, '日出（几何）时上升合太阳');
let tb = 0, db = 9; for (let x = Date.parse('2026-06-21T03:50Z'); x < Date.parse('2026-06-21T04:40Z'); x += 15e3) { const d = Math.abs(XP.mod(XP.angles(x, lat, lon).mc - XP.bodies(x).sun.lon + 180, 360) - 180); if (d < db) { db = d; tb = x; } }
eq(db < 0.07, true, '太阳上中天时中天合太阳');

// —— 庙旺陷弱 ——
eq(['狮子', '白羊', '水瓶', '天秤'].map(s => XP.dignity('sun', XP.SIGNS.indexOf(s))), ['庙', '旺', '陷', '弱'], '太阳庙旺陷弱');
eq(['巨蟹', '金牛', '摩羯', '天蝎'].map(s => XP.dignity('moon', XP.SIGNS.indexOf(s))), ['庙', '旺', '陷', '弱'], '月亮庙旺陷弱');
eq(['处女', '双鱼'].map(s => XP.dignity('mercury', XP.SIGNS.indexOf(s))), ['庙', '陷'], '水星处女庙且旺（取庙）、双鱼陷且弱（取陷）');

// —— 法达 ——
const fd = XP.firdaria(true, 0), fn = XP.firdaria(false, 0), fb = XP.firdaria(false, 0, true);
eq(fd.map(p => p.lord + p.years).join(' '), 'sun10 venus8 mercury13 moon9 saturn11 jupiter12 mars7 node3 snode2', '昼生法达序');
eq(fn.map(p => p.lord).join(' '), 'moon saturn jupiter mars node snode sun venus mercury', '夜生法达序（交点在火星后）');
eq(fb.map(p => p.lord).join(' '), 'moon saturn jupiter mars sun venus mercury node snode', '夜生法达序（波那提）');
eq(fd.reduce((s, p) => s + p.years, 0), 75, '法达一轮七十五年');
eq([fd[0].subs.map(s => s.lord).join(' '), fd[7].subs.length], ['sun venus mercury moon saturn jupiter mars', 0], '太阳主运七子运依迦勒底序；交点无子运');

// —— 小限 ——
const C = XP.chart({ y: 1990, mo: 6, d: 15, h: 12, mi: 0, tz: 8, lat: 39.9, lon: 116.4 });
const s0 = Math.floor(C.angles.asc / 30);
eq([XP.profection(C, 0).sign, XP.profection(C, 1).sign, XP.profection(C, 12).sign], [s0, (s0 + 1) % 12, s0], '小限一年一宫，十二年一周');
eq(C.day, true, '北京正午出生为昼生');
eq(XP.chart({ y: 1990, mo: 6, d: 15, h: 23, mi: 0, tz: 8, lat: 39.9, lon: 116.4 }).day, false, '北京夜十一点为夜生');

/* =========================================================
   推运：留与逆行、太阳回归、月亮空亡、行运、次限
   ========================================================= */
const DAY = 864e5, MIN = 60e3;
const within = (t, iso, tolMin, what) => { const d = (t - Date.parse(iso)) / MIN; if (!(Math.abs(d) <= tolMin)) { bad++; console.log('✗', what, '差', d.toFixed(1), '分 容', tolMin); } else ok++; };

// —— 一致：lonOf 与 bodies() 同值，chartAt 与 chart 同盘 ——
for (const iso of ['1900-03-01T00:00Z', '1990-05-16T23:30Z', '2026-11-04T07:00Z', '2099-12-31T12:00Z']) {
  const t = Date.parse(iso), B = XP.bodies(t);
  eq(Object.keys(B).every(id => XP.lonOf(id, t) === B[id].lon), true, 'lonOf 与 bodies 同值 ' + iso);
}
eq(JSON.stringify(XP.chartAt(C.utc, C.input)), JSON.stringify(C), 'chartAt(utc) 与 chart(钟表时间) 同盘');

// —— 2026 年水星留：对照公开星历（Swiss Ephemeris 系），本页约差十分钟内，容十五分钟 ——
// Cafe Astrology 各事件页（时刻为美东时间，已换 UT）：
//   https://cafeastrology.com/events/mercury-turns-retrograde-in-pisces-2026/   02-26 1:48 am EST = 06:48 UT，双鱼 22°33′
//   https://cafeastrology.com/events/mercury-turns-direct-in-pisces-2026/       03-20 3:33 pm EDT = 19:33 UT，双鱼 8°30′
//   https://cafeastrology.com/events/mercury-turns-retrograde-in-scorpio-2026/  10-24 3:12 am EDT = 07:12 UT，天蝎 20°59′
//   https://cafeastrology.com/events/mercury-turns-direct-in-scorpio-2026/      11-13 10:53 am EST = 15:53 UT，天蝎 5°02′
//   https://cafeastrology.com/events/mercury-turns-retrograde-in-cancer-2026    06-29 1:35 pm EDT = 17:35 UT，巨蟹 26°15′
//     （chani.com 2026 key dates 10:35 am PT、astrology.com 同为 26°15′；另有一家写 26°26′，与众不合，不取）
// 巨蟹留顺：07-23 5:57 pm EDT = 22:57 UT（https://www.astrologyhoroscopereadings.com/2026-mercury-retrograde-calendar.html），
//   巨蟹 16°18′（https://synthesisastrology.com/blog/mercury-retrograde-2026）
const MER26 = [['R', '2026-02-26T06:48Z', 352.55], ['D', '2026-03-20T19:33Z', 338.5], ['R', '2026-06-29T17:35Z', 116.25],
  ['D', '2026-07-23T22:57Z', 106.3], ['R', '2026-10-24T07:12Z', 230.98], ['D', '2026-11-13T15:53Z', 215.03]];
const mer = XP.stations('mercury', Date.UTC(2026, 0, 1), Date.UTC(2027, 0, 1));
eq(mer.map(s => s.kind).join(''), 'RDRDRD', '2026 水星三逆：留逆留顺各三次');
MER26.forEach(([k, iso, lon], i) => {
  const s = mer[i] || { t: 0, lon: 0 };
  within(s.t, iso, 15, `水星 ${iso.slice(0, 10)} 留${k === 'R' ? '逆' : '顺'}`);
  near(s.lon, lon, 0.25, `水星 ${iso.slice(0, 10)} 留时度数`);
});
// 影子期：前影 02-11 起、后影 04-09 止（thepsychicline.com 同上页；selfgazer.com/sky/mercury/retrograde/2026 同）
const rr = XP.retrogrades('mercury', Date.UTC(2026, 1, 1), Date.UTC(2026, 3, 1))[0];
eq([new Date(rr.pre).toISOString().slice(0, 10), new Date(rr.post).toISOString().slice(0, 10)], ['2026-02-11', '2026-04-09'], '水逆影子期 2026-02-11 至 04-09');
near(XP.lonOf('mercury', rr.pre), rr.D.lon, 0.001, '前影之始水星正在留顺度数');
near(XP.lonOf('mercury', rr.post), rr.R.lon, 0.001, '后影之终水星回到留逆度数');
// 其他星的留：金星 10-03 07:07 UT 留逆、11-14 00:22 UT 留顺（astroo.ai/blog/retrograde-dates-2026-2027；selfgazer 07:09、00:21）；
// 木星 03-11 03:30 UT 留顺、土星 07-26 19:56 UT 留逆（tropicalastro.com/planetary-retrograde-calendar）；
// 海王星 07-07 10:55 UT 留逆（horoscopes.astro-seek.com/retrograde-planets-astrology-calendar-2026）。留时行星几乎不动，越慢越难定，容差随之放宽
const stAt = (id, k, iso) => { const T = Date.parse(iso); return XP.stations(id, T - 20 * DAY, T + 20 * DAY).filter(s => s.kind === k).sort((a, b) => Math.abs(a.t - T) - Math.abs(b.t - T))[0] || { t: 0 }; };
within(stAt('venus', 'R', '2026-10-03T07:07Z').t, '2026-10-03T07:07Z', 45, '金星 2026-10-03 留逆');
within(stAt('venus', 'D', '2026-11-14T00:22Z').t, '2026-11-14T00:22Z', 45, '金星 2026-11-14 留顺');
within(stAt('jupiter', 'D', '2026-03-11T03:30Z').t, '2026-03-11T03:30Z', 90, '木星 2026-03-11 留顺');
within(stAt('saturn', 'R', '2026-07-26T19:56Z').t, '2026-07-26T19:56Z', 90, '土星 2026-07-26 留逆');
within(stAt('neptune', 'R', '2026-07-07T10:55Z').t, '2026-07-07T10:55Z', 360, '海王星 2026-07-07 留逆');
// 留时视速度为零、前后一日变号
const sp0 = mer.map(s => Math.abs(XP.speedOf('mercury', s.t)) < 1e-4 && Math.sign(XP.speedOf('mercury', s.t - DAY)) !== Math.sign(XP.speedOf('mercury', s.t + DAY)));
eq(sp0.every(Boolean), true, '留：视速度为零，前后一日变号');
eq(XP.stations('mars', Date.UTC(2026, 0, 1), Date.UTC(2027, 0, 1)).length, 0, '火星 2026 年不留（2027-01-10 才留逆）');

// —— 太阳回归：读回太阳黄经，与本命相差不到 0.1″（太阳一分钟走约 2.5″）；前后半分钟恰好跨过本命黄经 ——
const N = XP.chart({ y: 1990, mo: 5, d: 17, h: 8, mi: 30, tz: 9, lat: 35.68, lon: 139.69 });
for (const Y of [1991, 2026, 2027, 2099]) {
  const t = XP.solarReturn(N.bodies.sun.lon, Date.UTC(Y, 4, 16, 23, 30)), f = x => XP.mod(XP.lonOf('sun', x) - N.bodies.sun.lon + 180, 360) - 180;
  eq(Math.abs(f(t)) * 3600 < 0.1 && f(t - 30e3) < 0 && f(t + 30e3) > 0, true, `太阳回归 ${Y}：读回黄经差 ${(f(t) * 3600).toFixed(3)}″，根夹在一分钟内`);
}
eq(new Date(XP.solarReturn(N.bodies.sun.lon, Date.UTC(2026, 4, 16, 23, 30))).toISOString().slice(0, 16), '2026-05-16T16:26', '1990-05-17 08:30 东京生人 2026 年回归在 05-16 16:26 UT（东京 05-17 01:26）');
// 外部对照：生于 1990 年春分那一刻者，每年回归即春分；与节气表（astronomy-engine 视黄经）差不过半小时（两边章动、光行差之差）
const EQX = Y => J.terms.find(x => x.n === '春分' && new Date(x.t).getUTCFullYear() === Y).t;
const sun90 = XP.lonOf('sun', EQX(1990));
[2000, 2010, 2020, 2026, 2030].forEach(Y => within(XP.solarReturn(sun90, EQX(Y)), new Date(EQX(Y)).toISOString(), 35, `春分生人 ${Y} 年回归 ≈ 当年春分`));

// —— 月亮：换座时黄经正在座界 ——
const ing = XP.moonIngresses(Date.UTC(2026, 10, 1), Date.UTC(2026, 11, 1));
eq(ing.length >= 13 && ing.every(x => Math.abs(XP.mod(XP.lonOf('moon', x.t) - x.sign * 30 + 180, 360) - 180) < 1e-4), true, '2026 年 11 月月亮换座 ' + ing.length + ' 次，换座时刻正在座界');

// —— 月亮空亡：对照 1001horoscopes 2026 年 11 月空亡表（美东标准时 EST，已换 UT），起讫容十五分钟 ——
// https://1001horoscopes.com/astrology/void-of-course-moon/november-2026/ 与 https://1001horoscopes.com/astrology/calendar/november/
//   11-04 1:57 am → 11-05 9:38 am EST，末相月亮六合水星，入天秤；11-17 9:25 am → 4:19 pm EST，末相月亮冲火星，入双鱼；
//   11-09 6:25 pm → 11-10 3:35 am EST，入射手；11-20 0:52 am EST 入白羊（前一晚 8:46 pm 起空）
const VOC = XP.voidMoon(Date.UTC(2026, 10, 1), Date.UTC(2026, 11, 1));
const vAt = iso => VOC.find(p => Math.abs(p.end - Date.parse(iso)) < 3 * 3600e3) || { start: 0, end: 0, last: null, sign: -1 };
[['2026-11-04T06:57Z', '2026-11-05T14:38Z', 6, 'mercury', '六合'], ['2026-11-17T14:25Z', '2026-11-17T21:19Z', 11, 'mars', '冲'],
  ['2026-11-09T23:25Z', '2026-11-10T08:35Z', 8, null, ''], ['2026-11-20T01:46Z', '2026-11-20T05:52Z', 0, null, '']].forEach(([a, b, sign, id, asp]) => {
  const p = vAt(b);
  within(p.start, a, 15, `空亡 ${a.slice(5, 10)} 起`); within(p.end, b, 15, `空亡 ${b.slice(5, 10)} 止（入${XP.SIGNS[sign]}）`);
  eq(p.sign, sign, `空亡 ${b.slice(5, 10)} 之后入${XP.SIGNS[sign]}`);
  if (id) eq([p.last && p.last.id, p.last && p.last.type.n], [id, asp], `空亡 ${a.slice(5, 10)} 末相月亮${asp}${id === 'mars' ? '火星' : '水星'}`);
});
// 定义自检：空亡起点正是一个精确托勒密相位；之后至入座再无相位；整个 11 月的空亡段不重叠、首尾相接于换座
eq(VOC.every(p => p.last && Math.abs(XP.mod(XP.lonOf('moon', p.start) - XP.lonOf(p.last.id, p.start) - p.last.A + 180, 360) - 180) < 1e-3), true, '空亡起点 = 末一相位精确成相之刻');
eq(VOC.every(p => XP.moonAspects(p.start + MIN, p.end).length === 0), true, '空亡之中月亮不再与九星成相');
eq(VOC.every((p, i) => !i || p.start >= VOC[i - 1].end), true, '空亡段前后不重叠');

// —— 行运：精确成相之日与逆行往返 ——
// 假本命：太阳放在白羊 10°，2026–27 年土星顺行经过、逆行退回、再顺行，应合三次（顺、逆、顺）
const fake = { bodies: {}, angles: { asc: 200, mc: 110 } };
XP.PLANETS.forEach((id, i) => { fake.bodies[id] = { lon: XP.mod(150 + i * 13, 360) }; });
fake.bodies.sun.lon = 10;
const hs = XP.transitHits(fake, Date.UTC(2026, 0, 1), Date.UTC(2027, 6, 1), ['saturn']).filter(h => h.na === 'sun' && h.A === 0);
eq(hs.map(h => h.retro), [false, true, false], '土星合白羊 10°：顺、逆、顺三次');
eq(hs.every(h => Math.abs(XP.mod(XP.lonOf('saturn', h.t) - 10 + 180, 360) - 180) < 1e-3), true, '三次精确成相时土星正在白羊 10°');
// 入相出相：月亮在前方 0.5° 的点为入相，在后方 0.5° 的点为出相
const t26 = Date.UTC(2026, 10, 4, 7), mL = XP.lonOf('moon', t26);
fake.bodies.venus.lon = XP.mod(mL + 0.5, 360); fake.bodies.mars.lon = XP.mod(mL - 0.5, 360);
const tr = XP.transits(fake, t26).filter(a => a.tr === 'moon' && a.type.a === 0);
eq([tr.find(a => a.na === 'venus').applying, tr.find(a => a.na === 'mars').applying], [true, false], '行运月亮：将合为入相、已过为出相');
eq(XP.transits(fake, t26).every(a => a.orb <= XP.TRANSIT_ORB[a.tr]), true, '行运相位都在各星容许度内');

// —— 次限：第 N 岁 = 出生后第 N 日；推运中天 = 本命中天 + 太阳弧 ——
const P30 = XP.progressed(N, N.utc + 30 * XP.TROP_YEAR * DAY);
near(P30.bodies.sun.lon, XP.lonOf('sun', N.utc + 30 * DAY), 1e-9, '三十岁推运太阳 = 出生后第三十日的太阳');
near(P30.mc, N.angles.mc + P30.bodies.sun.lon - N.bodies.sun.lon, 1e-9, '推运中天 = 本命中天 + 太阳弧');

console.log(bad ? `\n${bad} 项不合，${ok} 项相合` : `全部相合（${ok} 项）`);
process.exit(bad ? 1 : 0);
