// 校时 · 两盘参看自检：node scripts/jiaoshi/check.js
// 换段时刻与命中分钟对照独立算法（直接逐分比上升黄经、行运太阳黄经），不拿模块自己的结果对自己。
global.self = global;
process.env.TZ = 'Asia/Taipei';
const J = require('../../static/fabao/jiaoshi.js');
const XP = require('../../static/xingpan/xingpan.js');
const QZ = require('../../static/qizheng/qizheng.js');
const ZW = require('../../static/ziwei/ziwei.js');
let bad = 0, ok = 0;
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '得', JSON.stringify(a), '应', JSON.stringify(b)); } else { ok++; console.log('✓', what); } };

// 基础
eq([J.fmt(1213), J.parse('20:13'), J.fmt(1440 + 5)], ['20:13', 1213, '00:05⁺'], '钟点分换算');
eq(J.zeros(0, [-2, -1, 1, 2]).map(z => z.m), [1.5], '过零内插');
eq(J.zeros(0, [170, -170]).length, 0, '±180 折返不算过零');
eq(J.segments(0, 5, m => ({ key: m < 3 ? 'a' : 'b' })).map(s => [s.from, s.to, s.key]), [[0, 2, 'a'], [3, 5, 'b']], '分段');

// 例：2004-12-08 台北 20:00–20:59
const base = { y: 2004, mo: 12, d: 8, tz: 8, dst: false, lat: 25.03, lon: 121.56, house: 'placidus', luoji: 'qing' };
const ch = J.astroCharts(XP, base, 1200, 1259), sc = J.astroScan(XP, ch, 1200);
// 独立：逐分直接排盘，找上升由巨蟹（90–120）进狮子的第一分
let first = null; for (let mi = 0; mi < 60; mi++) { const C = XP.chart(Object.assign({}, base, { h: 20, mi })); if (C.angles.asc >= 120 && first == null) first = mi; }
eq(sc.segs.map(s => J.fmt(s.from)), ['20:00', '20:' + String(first).padStart(2, '0')], '上升换座之分');
eq(sc.changes.some(c => c.t.startsWith('上升 巨蟹→狮子')), true, '换段清单记上升换座');
// 行运太阳合第五宫头：独立求太阳黄经与第五宫头最接近的一分
const ev = { d: '2026-11-21', k: 'qing' }, sun = XP.bodies(Date.UTC(2026, 10, 21, 4)).sun.lon;
let best = 0, bd = 99; for (let mi = 0; mi < 60; mi++) { const C = XP.chart(Object.assign({}, base, { h: 20, mi })); const d = Math.abs(J.wrap180(sun - C.cusps[5])); if (d < bd) { bd = d; best = mi; } }
const H = J.astroHits(XP, ch, 1200, base, ev), h5 = H.find(h => h.t === '行运太阳合第五宫头');
eq(!!h5 && Math.abs(h5.m - (1200 + best)) <= 1, true, '行运太阳合第五宫头之分（独立求得 20:' + best + '）');
eq(h5 && h5.unc > 1 && h5.unc < 4, true, '事发时辰不明的出入在几分之内');
eq(H.every(h => h.m >= 1200 && h.m <= 1259), true, '命中都在时段内');
eq(J.astroLords(XP, ch, 1200, sc.segs, base, ev).map(l => l.lord), ['mars', 'venus'], '小限年主：升巨蟹走白羊（火），升狮子走金牛（金）');
eq(J.histHTML(1200, 1259, [{ m: 1201, w: 1 }, { m: 1216, w: 2 }, { m: 1218, w: 2 }], 5).best, { from: 1215, to: 1219, w: 4 }, '命中分布取最密一格');

// 七政：命宫换宫与上升同一分，命度入鬼宿处度主由木换金
const qc = J.qzCharts(QZ, base, 1200, 1259), qs = J.qzScan(QZ, qc, 1200);
eq(qs.segs[1].from, 1200 + first, '七政命宫换宫与上升换座同分');
eq(qs.changes.some(c => /命度 井宿→鬼宿，度主木星→金星/.test(c.t)), true, '命度换宿、度主换星');
const qe = J.qzEvent(QZ, qc, 1200, qs.segs, base, ev);
eq(qe.rows.map(r => r.kind), ['夫妻', '夫妻', '夫妻'], '感情看夫妻宫');
eq(qe.rows[1].mingStars.includes('mu'), true, '2026-11-21 木星在午宫，午宫命那段见木');

// 紫微：真太阳时下 20:47 入亥时；不开则 21:00
const sh = J.zwShiChanges(ZW, 2004, 12, 8, 121.56, 8, true).find(x => ZW.TIMES[x.t] === '亥');
eq(J.fmt(sh.m), '20:47', '真太阳时换亥时之分');
eq(J.fmt(J.zwShiChanges(ZW, 2004, 12, 8, 121.56, 8, false).find(x => ZW.TIMES[x.t] === '亥').m), '21:00', '钟表时换亥时');
const c = ZW.chart({ cal: 'solar', y: 2004, m: 12, d: 8, t: 10, g: '男' }), zr = J.zwEvent(ZW, c, ev);
eq(zr.map(l => l.label + l.gz), ['大限丁卯', '流年丙午', '流月己亥', '流日己亥'], '四层运限干支');
eq([zr[1].mingNat, zr[2].mingNat], ['交友', '田宅'], '流年命宫落本命交友、流月命宫落田宅');
eq(zr[2].luan.find(x => x.name === '月鸾').hit, true, '月鸾入流月命宫算要紧');

// 事件存取（无 localStorage 时不出错）
eq(J.list('x'), [], '无存储时事件为空');
console.log(`\n${ok} 过，${bad} 错`);
process.exit(bad ? 1 : 0);
