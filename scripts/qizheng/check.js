// 七政四余自检：node scripts/qizheng/check.js
// 对照值取自独立来源，不拿程序结果对自己：
//   角宿距星角宿一（Spica）回归黄经：J2000 203°50′，2026 年约 204°12′（年差 50.3″）；
//   J2000.0 月亮平升交点 125.04°、平近地点 83.35°（Meeus《天文算法》47 章），平远地点即 263.35°；
//   2000-03-20 07:35 UT 春分，太阳回归黄经 0°，应入戌宫降娄；
//   1990-05-17 10:30 北京：月孛在氐六度（另一家七政排盘 ChroniQ 的公开样例，同用平远地点）。
const QZ = require('../../static/qizheng/qizheng.js');
let bad = 0, ok = 0;
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '得', JSON.stringify(a), '应', JSON.stringify(b)); } else { ok++; console.log('✓', what); } };
const near = (a, b, tol, what) => { const d = Math.abs(((a - b + 540) % 360) - 180); if (d > tol) { bad++; console.log('✗', what, '得', a.toFixed(3), '应', b, '差', d.toFixed(3)); } else { ok++; console.log('✓', what, a.toFixed(3)); } };
const J2000 = Date.UTC(2000, 0, 1, 12);

const S = QZ.xiuStarts(J2000);
near(S[0], 203.84, 0.02, '角宿距星 J2000');
near(QZ.xiuStarts(Date.UTC(2026, 0, 1))[0], 204.20, 0.03, '角宿距星 2026');
const w = S.map((s, i) => ((S[(i + 1) % 28] - s) % 360 + 360) % 360);
near(w.reduce((a, b) => a + b, 0), 0, 1e-6, '二十八宿宽合一周天（模 360）');
eq(w.every(x => x > 0.5 && x < 32), true, '各宿宽在半度至三十二度之间');
eq(QZ.XIU.map(x => x.full).join(''), '角木蛟亢金龙氐土貉房日兔心月狐尾火虎箕水豹斗木獬牛金牛女土蝠虚日鼠危月燕室火猪壁水貐奎木狼娄金狗胃土雉昴日鸡毕月乌觜火猴参水猿井木犴鬼金羊柳土獐星日马张月鹿翼火蛇轸水蚓', '二十八宿全名');

const L = QZ.lonsAt(J2000, {});
near(L.luo, 125.04, 0.05, '罗睺（升交点）J2000');
near(L.ji, 305.04, 0.05, '计都（降交点）J2000');
near(L.bo, 263.35, 0.3, '月孛（平远地点）J2000');
near(L.qi, 270, 1e-6, '紫气历元');
near(QZ.ziqiLon(J2000 + 28 * 365.2422 * 864e5), 270, 1e-6, '紫气二十八年一周天');
const Lm = QZ.lonsAt(J2000, { luoji: 'ming' });
near(Lm.luo, 305.04, 0.05, '罗计互换：罗睺取降交点');

const eqx = QZ.chartAt(Date.UTC(2000, 2, 20, 7, 35), { lat: 30, lon: 120 });
near(eqx.byId.ri.lon, 0, 0.02, '春分太阳黄经');
eq(QZ.gongOf(0.5).zhi, 10, '白羊初度入戌宫');
eq(QZ.gongOf(359.5).zhi, 11, '双鱼末度入亥宫');
eq(QZ.gongOf(270.5).zhi, 1, '摩羯初度入丑宫');

const C = QZ.chart({ y: 1990, mo: 5, d: 17, h: 10, mi: 30, tz: 8, lat: 39.9, lon: 116.4 });
eq([C.byId.bo.xiu, Math.floor(C.byId.bo.xdeg)], [2, 6], '1990-05-17 北京 月孛氐六度');
eq(C.houses.slice(0, 3).map(h => h.zhi), [C.ming.zhi, (C.ming.zhi + 11) % 12, (C.ming.zhi + 10) % 12], '十二宫自命宫逆布');
eq(C.shen.zhi, C.byId.yue.zhi, '身宫即太阴之宫');
eq(QZ.LORD[C.ming.zhi], C.mingZhu, '命主为命宫宫主');
eq(C.byId.luo.retro && C.byId.ji.retro && !C.byId.qi.retro && !C.byId.bo.retro, true, '罗计逆行，气孛顺行');
eq(C.byId.tu.yuan, true, '土星在丑宫入垣');
console.log(`\n${ok} 过，${bad} 错`);
process.exit(bad ? 1 : 0);
