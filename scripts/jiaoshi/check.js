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
eq(J.zeros([0, 1, 2, 3], [-2, -1, 1, 2]).map(z => z.m), [1.5], '过零内插');
eq(J.zeros([0, 1], [170, -170]).length, 0, '±180 折返不算过零');
eq(J.zeros([0, 5], [-1, 1]).length, 0, '不相接的两分之间不内插');
eq(J.segments([0, 1, 2, 3, 4, 5], m => ({ key: m < 3 ? 'a' : 'b' })).map(s => [s.from, s.to, s.key]), [[0, 2, 'a'], [3, 5, 'b']], '分段');
eq(J.segments([0, 1, 5, 6], () => ({ key: 'a' })).map(s => [s.from, s.to]), [[0, 1], [5, 6]], '同 key 但钟点断开另起一段');
// 候选钟点：可不连续、可全天
eq(J.norm([[300, 400], [100, 200], [190, 250], [401, 410], [-5, 3]]), [[0, 3], [100, 250], [300, 410]], '候选段排序合并（重叠、相接都并）');
eq(J.minsOf([[0, 1439]]).length, 1440, '全天 1440 分');
eq(J.minsOf([[10, 12], [20, 21]]), [10, 11, 12, 20, 21], '不连续的两段');

// 例：2004-12-08 台北 20:00–20:59
const base = { y: 2004, mo: 12, d: 8, tz: 8, dst: false, lat: 25.03, lon: 121.56, house: 'placidus', luoji: 'qing' };
const M = J.minsOf([[1200, 1259]]), ch = J.astroCharts(XP, base, M), sc = J.astroScan(XP, ch, M);
// 独立：逐分直接排盘，找上升由巨蟹（90–120）进狮子的第一分
let first = null; for (let mi = 0; mi < 60; mi++) { const C = XP.chart(Object.assign({}, base, { h: 20, mi })); if (C.angles.asc >= 120 && first == null) first = mi; }
eq(sc.segs.map(s => J.fmt(s.from)), ['20:00', '20:' + String(first).padStart(2, '0')], '上升换座之分');
eq(sc.changes.some(c => c.t.startsWith('上升 巨蟹→狮子')), true, '换段清单记上升换座');
// 行运太阳合第五宫头：独立求太阳黄经与第五宫头最接近的一分
const ev = { d: '2026-11-21', k: 'qing' }, sun = XP.bodies(Date.UTC(2026, 10, 21, 4)).sun.lon;
let best = 0, bd = 99; for (let mi = 0; mi < 60; mi++) { const C = XP.chart(Object.assign({}, base, { h: 20, mi })); const d = Math.abs(J.wrap180(sun - C.cusps[5])); if (d < bd) { bd = d; best = mi; } }
const H = J.astroHits(XP, ch, M, base, ev), h5 = H.find(h => h.t === '行运太阳合第五宫头');
eq(!!h5 && Math.abs(h5.m - (1200 + best)) <= 1, true, '行运太阳合第五宫头之分（独立求得 20:' + best + '）');
eq(h5 && h5.unc > 1 && h5.unc < 4, true, '事发时辰不明的出入在几分之内');
eq(H.every(h => h.m >= 1200 && h.m <= 1259), true, '命中都在时段内');
eq(J.astroLords(XP, ch, sc.segs, base, ev).map(l => l.lord), ['mars', 'venus'], '小限年主：升巨蟹走白羊（火），升狮子走金牛（金）');
eq(J.histHTML(M, [{ m: 1201, w: 1 }, { m: 1216, w: 2 }, { m: 1218, w: 2 }], 5).best, { from: 1215, to: 1219, w: 4 }, '命中分布取最密一格');

// 宿命点：独立逐分取宿命点黄经，验行运合宿命点之分与几分一变
const vxAt = mi => XP.chart(Object.assign({}, base, { h: 20, mi })).extra.vertex.lon;
const dv = Math.abs(J.wrap180(vxAt(30) - vxAt(29)));
eq(dv > 0.1 && dv < 2, true, '宿命点一分钟走 ' + dv.toFixed(2) + '°（几分钟即见不同）');
const vh = H.filter(h => h.vx);
eq(vh.length > 0 && vh.every(h => /宿命点/.test(h.t)), true, '宿命点命中有标记');
vh.filter(h => /^行运.+合宿命点$/.test(h.t)).forEach(h => {
  const id = Object.keys(XP.bodies(0)).find(k => '行运' + ({ sun: '太阳', moon: '月亮', mercury: '水星', venus: '金星', mars: '火星', jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星', pluto: '冥王星' }[k]) + '合宿命点' === h.t);
  if (!id) return; const L = XP.bodies(Date.UTC(2026, 10, 21, 4)).sun && XP.bodies(Date.UTC(2026, 10, 21, 4))[id].lon;
  let bm = 0, bdd = 99; for (let mi = 0; mi < 60; mi++) { const d = Math.abs(J.wrap180(L - vxAt(mi))); if (d < bdd) { bdd = d; bm = mi; } }
  eq(Math.abs(h.m - (1200 + bm)) <= 1, true, h.t + '之分（独立求得 20:' + bm + '）');
});
// 候选不连续：两段命中只落在候选里
const M2 = J.minsOf([[1200, 1209], [1250, 1259]]), ch2 = J.astroCharts(XP, base, M2);
eq(J.astroHits(XP, ch2, M2, base, ev).every(h => (h.m >= 1200 && h.m <= 1209) || (h.m >= 1250 && h.m <= 1259)), true, '不连续候选的命中只在候选内');
eq(J.astroScan(XP, ch2, M2).segs.map(s => [J.fmt(s.from), J.fmt(s.to)]), [['20:00', '20:09'], ['20:50', '20:59']], '两段各自成段');

// 七政：命宫换宫与上升同一分，命度入鬼宿处度主由木换金
const qc = J.qzCharts(QZ, base, M), qs = J.qzScan(QZ, qc, M);
eq(qs.segs[1].from, 1200 + first, '七政命宫换宫与上升换座同分');
eq(qs.changes.some(c => /命度 井宿→鬼宿，度主木星→金星/.test(c.t)), true, '命度换宿、度主换星');
const qe = J.qzEvent(QZ, qc, M, qs.segs, base, ev);
eq(qe.rows.map(r => r.kind), ['夫妻', '夫妻', '夫妻'], '感情看夫妻宫');
eq(qe.rows[1].mingStars.includes('mu'), true, '2026-11-21 木星在午宫，午宫命那段见木');

// 紫微：真太阳时下 20:47 入亥时；不开则 21:00
const sh = J.zwShiChanges(ZW, 2004, 12, 8, 121.56, 8, true).find(x => ZW.TIMES[x.t] === '亥');
eq(J.fmt(sh.m), '20:47', '真太阳时换亥时之分');
eq(J.fmt(J.zwShiChanges(ZW, 2004, 12, 8, 121.56, 8, false).find(x => ZW.TIMES[x.t] === '亥').m), '21:00', '钟表时换亥时');
eq(J.zwCandShi(ZW, [[1200, 1259]], 2004, 12, 8, 121.56, 8, true).map(x => [ZW.TIMES[x.t], x.mins]), [['戌', 47], ['亥', 13]], '候选 20:00–20:59 含戌 47 分、亥 13 分');
eq(J.zwCandShi(ZW, [[0, 1439]], 2004, 12, 8, 121.56, 8, true).length >= 12, true, '时辰全然不知：全天列出各时辰');
eq(J.zwCandShi(ZW, [[180, 200], [600, 620]], 2004, 12, 8, 121.56, 8, false).map(x => ZW.TIMES[x.t]), ['寅', '巳'], '记得的两个时辰不相接也可');
const c = ZW.chart({ cal: 'solar', y: 2004, m: 12, d: 8, t: 10, g: '男' }), zr = J.zwEvent(ZW, c, ev);
eq(zr.map(l => l.label + l.gz), ['大限丁卯', '流年丙午', '流月己亥', '流日己亥'], '四层运限干支');
eq([zr[1].mingNat, zr[2].mingNat], ['交友', '田宅'], '流年命宫落本命交友、流月命宫落田宅');
eq(zr[2].luan.find(x => x.name === '月鸾').hit, true, '月鸾入流月命宫算要紧');

// 事件存取（无 localStorage 时不出错）
eq(J.list('x'), [], '无存储时事件为空');
console.log(`\n${ok} 过，${bad} 错`);
process.exit(bad ? 1 : 0);
