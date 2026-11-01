// 星盘核心自检：node scripts/xingpan/check.js
// 太阳对照奇门手记节气表（astronomy-engine 算出）；行星对照公认天象的时刻；宫制对照 Raphael 宫位表。
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

console.log(bad ? `\n${bad} 项不合，${ok} 项相合` : `全部相合（${ok} 项）`);
process.exit(bad ? 1 : 0);
