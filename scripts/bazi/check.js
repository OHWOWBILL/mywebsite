// 八字排盘核心自检：node scripts/bazi/check.js
// 一、四柱与奇门手记 core.js（同一张节气表）逐一对照两千个随机时刻；
// 二、与 iztro（另一套独立实现，年柱按立春）对照三百个随机日；
// 三、已知命例、神煞、干支关系、命宫胎元胎息逐项手算核对；
// 四、子时两派、真太阳时、起运、农历、四柱反推。
process.env.TZ = 'Etc/GMT-8';   // 让 core.js 按东八区解读本机时间（不含 1986–1991 夏令时）
global.self = global;
const B = require('../../static/bazi/bazi.js');
const QM = require('../../static/qimen/core.js');
const iztro = require('../../static/ziwei/iztro.min.js');
iztro.astro.config({ yearDivide: 'exact', horoscopeDivide: 'exact' });

let bad = 0, ok = 0;
const eq = (a, b, what) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '得', JSON.stringify(a), '应', JSON.stringify(b)); }
  else ok++;
};
const names = c => c.pillars.map(p => p.name).join(' ');
const at = (y, mo, d, h, mi, extra) => B.chart(Object.assign({ y, mo, d, h, mi, tz: 8, male: true }, extra || {}));
let seed = 20261101;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

// —— 一、对照奇门 core.js ——
for (let k = 0; k < 2000; k++) {
  const t = Date.UTC(1900, 1, 10) + Math.floor(rnd() * (Date.UTC(2100, 10, 1) - Date.UTC(1900, 1, 10)));
  const f = new Date(t + 8 * 3600e3);
  const y = f.getUTCFullYear(), mo = f.getUTCMonth() + 1, d = f.getUTCDate(), h = f.getUTCHours(), mi = f.getUTCMinutes();
  const a = names(at(y, mo, d, h, mi));
  const q = QM.computeChart(new Date(y, mo - 1, d, h, mi));
  const b = [q.pillars.year, q.pillars.month, q.pillars.day, q.pillars.hour].join(' ');
  if (a !== b) { eq(a, b, `与奇门四柱不合 ${y}-${mo}-${d} ${h}:${mi}`); if (bad > 5) break; } else ok++;
}

// —— 二、对照 iztro（避开交节前后一日，两套节气算法在交接分钟上可能各差一点）——
for (let k = 0; k < 300; k++) {
  const t = Date.UTC(1901, 0, 1) + Math.floor(rnd() * (Date.UTC(2099, 11, 1) - Date.UTC(1901, 0, 1)) / 864e5) * 864e5;
  const f = new Date(t), y = f.getUTCFullYear(), mo = f.getUTCMonth() + 1, d = f.getUTCDate();
  const ti = 1 + Math.floor(rnd() * 11), h = ti * 2;                   // 丑至亥时的正点，避开子时口径之争
  const c = at(y, mo, d, h, 0);
  const near = Math.min(Math.abs(c.utc - c.jie.prev.t), Math.abs(c.jie.next.t - c.utc)) < 864e5;
  if (near) continue;
  const r = iztro.astro.bySolar(`${y}-${mo}-${d}`, ti, '男', true, 'zh-CN').rawDates.chineseDate;
  eq(names(c), [r.yearly, r.monthly, r.daily, r.hourly].map(x => x.join('')).join(' '), `与 iztro 四柱不合 ${y}-${mo}-${d} ${h}时`);
}

// —— 三、已知命例 ——
eq(names(at(2000, 1, 1, 0, 0)), '己卯 丙子 戊午 壬子', '2000-01-01 00:00');
eq(names(at(1949, 10, 1, 15, 0)), '己丑 癸酉 甲子 壬申', '1949-10-01 15:00（开国大典，甲子日）');
eq(names(at(1990, 6, 15, 12, 0)), '庚午 壬午 辛亥 甲午', '1990-06-15 午时（紫微自检同例）');
eq(names(B.chart({ y: 2026, mo: 11, d: 1, h: 1, mi: 57, tz: 9, male: true })), '丙午 戊戌 己卯 乙丑', '2026-11-01 01:57 东京（奇门自检样盘）');
eq(names(at(1900, 1, 10, 12, 0)), '己亥 丁丑 癸未 戊午', '1900-01-10 表首可排（立春前补己亥年；1900-01-01 甲戌起数九日为癸未）');
// 立春交接：1990 立春 2 月 4 日 10:14（北京时间）
const lc = B.TERMS.find(x => x.n === '立春' && new Date(x.t).getUTCFullYear() === 1990);
const lcBJ = new Date(lc.t + 8 * 3600e3);
eq([lcBJ.getUTCMonth() + 1, lcBJ.getUTCDate(), lcBJ.getUTCHours(), lcBJ.getUTCMinutes()], [2, 4, 10, 14], '1990 立春时刻');
eq(at(1990, 2, 4, 10, 13).pillars[0].name + at(1990, 2, 4, 10, 15).pillars[0].name, '己巳庚午', '立春前一分己巳、后一分庚午');
// 出生地时区：同一钟点，东京（东九区）比北京早一小时到达交节
eq(B.chart({ y: 1990, mo: 2, d: 4, h: 11, mi: 0, tz: 9, male: true }).pillars[0].name, '己巳', '东京 11:00 = 北京 10:00，尚未立春');
eq(B.chart({ y: 1990, mo: 2, d: 4, h: 11, mi: 20, tz: 9, male: true }).pillars[0].name, '庚午', '东京 11:20 = 北京 10:20，已立春');

// —— 神煞、关系、命宫胎元胎息：1949-10-01 15:00 己丑 癸酉 甲子 壬申 手算 ——
const c49 = at(1949, 10, 1, 15, 0), A49 = B.analyze(c49);
const sha = A49.cols.map(x => x.sha.map(s => s.name).sort().join('、'));
eq(sha, [
  ['天乙贵人', '华盖', '太极贵人'].sort().join('、'),
  ['桃花', '将星', '文昌贵人'].sort().join('、'),
  ['太极贵人', '天乙贵人', '将星'].sort().join('、'),            // 日支子即申子辰之将星：日坐将星
  ['亡神', '天医', '天喜', '天乙贵人'].sort().join('、')
], '1949 例四柱神煞');
const rel = A49.relations.map(r => r.text);
['年干己合日干甲（化土）', '年支丑合日支子（六合土）', '月支酉破日支子', '日支子时支申 半合水局', '年支丑月支酉 半合金局']
  .forEach(t => eq(rel.includes(t), true, '关系：' + t));
eq([A49.minggong.name, A49.taiyuan.name, A49.taixi.name], ['丙子', '甲子', '己丑'], '命宫（子上起正月逆数八月至巳，巳上起申时顺数至卯落子）、胎元、胎息');
eq(A49.cols.map(x => x.ganSS), ['正财', '正印', '元男', '偏印'], '十神（日主甲）');
eq(A49.cols.map(x => x.xingyun), ['冠带', '胎', '沐浴', '绝'], '星运（甲木长生亥：丑冠带、酉胎、子沐浴、申绝）');
eq(A49.cols.map(x => x.nayin), ['霹雳火', '剑锋金', '海中金', '剑锋金'], '纳音');
eq(A49.cols[1].cang.map(h => h.name + h.ss), ['辛正官'], '月支酉藏辛（正官）');
eq(A49.siling.gan, '辛', '白露后第 24 日，酉月辛金司令（庚十日、辛二十日）');
eq(A49.roots.length, 0, '甲木在丑酉子申皆无木根');
const wx = A49.wuxing.map(w => w.name + w.count).join('');
eq(wx, '木1火0土2金2水3', '五行个数（干：己土 癸水 甲木 壬水；支本气：丑土 酉金 子水 申金）');

// —— 月令取格与十神分布 ——
eq([A49.geju.name, A49.geju.why], ['正官格', '月令酉藏干皆不透，取本气辛'], '1949 例：甲日酉月，辛金不透，取本气正官');
eq(Object.values(A49.ssCount).reduce((n, x) => n + x.gan + x.cang, 0), 3 + 1 + 3 + 1 + 3, '十神计数：三干 + 丑三酉一子一申三藏干');
const gj = (y, mo, d, h) => B.analyze(at(y, mo, d, h, 0)).geju.name;
eq(gj(1990, 6, 15, 12), '七杀格', '1990-06-15 辛日午月：午藏丁己，皆不透，取本气丁（七杀）');
eq(gj(2000, 1, 1, 0), '正财格', '2000-01-01 戊日子月：子藏癸（阳土见阴水为正财），不透取本气');

// —— 魁罡、天赦等日柱神煞 ——
eq(B.analyze(at(2000, 3, 15, 12, 0)).cols[2].sha.some(s => s.name === '魁罡'), names(at(2000, 3, 15, 12, 0)).split(' ')[2] === '庚辰' || names(at(2000, 3, 15, 12, 0)).split(' ')[2] === '壬辰' || names(at(2000, 3, 15, 12, 0)).split(' ')[2] === '庚戌' || names(at(2000, 3, 15, 12, 0)).split(' ')[2] === '戊戌', '魁罡只认四日');
for (let d = 1; d <= 60; d++) {                       // 2000 年头两个月里每一天
  const c = at(2000, 1, d, 12, 0), dn = c.pillars[2].name;
  const has = n => B.analyze(c).cols[2].sha.some(s => s.name === n);
  eq(has('魁罡'), ['庚辰', '庚戌', '壬辰', '戊戌'].includes(dn), '魁罡 ' + dn);
  eq(has('十恶大败'), ['甲辰', '乙巳', '丙申', '丁亥', '戊戌', '己丑', '庚辰', '辛巳', '壬申', '癸亥'].includes(dn), '十恶大败 ' + dn);
}

// —— 四、子时两派 ——
const zn = at(2026, 11, 1, 23, 30), zs = at(2026, 11, 1, 23, 30, { zi: 'same' });
eq([zn.pillars[2].name, zn.pillars[3].name], ['庚辰', '丙子'], '23:30「次日」派：日柱换到 11-02 庚辰，时柱丙子');
eq([zs.pillars[2].name, zs.pillars[3].name], ['己卯', '丙子'], '23:30「当日」派：日柱仍是 11-01 己卯，时柱照接丙子');
eq(at(2026, 11, 2, 0, 30).pillars.slice(2).map(p => p.name), ['庚辰', '丙子'], '00:30 早子时两派相同');

// —— 真太阳时：东京经度 139.69、东九区，11-01 均时差约 +16.4 分，经度 +18.8 分（与奇门自检同数）——
const so = B.chart({ y: 2026, mo: 11, d: 1, h: 1, mi: 57, tz: 9, lon: 139.69, male: true }).solar;
eq(Math.round(so.shift), 35, '真太阳时校正（东京 11-01）');
const sz = B.chart({ y: 2026, mo: 11, d: 1, h: 22, mi: 50, tz: 9, lon: 139.69, male: true });
eq([sz.pillars[2].name, sz.pillars[3].name], ['庚辰', '丙子'], '钟点 22:50、真太阳时已过 23 点 → 子时换日');
// 乌鲁木齐用北京时间：经度 87.62 比 120 度经线慢两个多小时
const uq = B.chart({ y: 1995, mo: 7, d: 1, h: 9, mi: 0, tz: 8, lon: 87.62, male: true });
eq([Math.round(uq.solar.lonFix), uq.clock.h], [-130, 6], '乌鲁木齐 09:00 → 真太阳时约 06:5x（卯时）');

// —— 起运 ——
// 2000-01-01 00:00 男，己卯阴年 → 阴男逆排，数回 1999 大雪（12-07 21:4x 北京时间），约 24 日 2 时 → 8 年 0 月 11 日
const y1 = at(2000, 1, 1, 0, 0).yun;
eq([y1.forward, y1.target.n, y1.span.y, y1.span.m, y1.span.d], [false, '大雪', 8, 0, 11], '阴男逆排起运');
eq(B.fmtF(y1.start, false), '2008-01-12', '交运日');
eq(y1.dayun.slice(0, 3).map(d => d.name + d.startYear), ['乙亥2008', '甲戌2018', '癸酉2028'], '大运逆排自月柱丙子');
const y2 = at(2000, 1, 1, 0, 0, { male: false }).yun;
eq([y2.forward, y2.target.n], [true, '小寒'], '阴女顺排，数到小寒');
eq(y2.dayun.slice(0, 2).map(d => d.name), ['丁丑', '戊寅'], '大运顺排自月柱丙子');
// 起运折算：三日一年，用整日差验算
for (let k = 0; k < 200; k++) {
  const t = Date.UTC(1901, 0, 1) + Math.floor(rnd() * (Date.UTC(2099, 0, 1) - Date.UTC(1901, 0, 1)));
  const f = new Date(t + 8 * 3600e3);
  const c = at(f.getUTCFullYear(), f.getUTCMonth() + 1, f.getUTCDate(), f.getUTCHours(), f.getUTCMinutes(), { male: rnd() < 0.5 });
  const days = c.yun.diffMin / 1440, s = c.yun.span;
  const back = s.y * 3 + s.m / 4 + s.d / 120 + s.h / 2880;            // 1 年=3 日，1 月=6 时，1 日=12 分，1 时=0.5 分
  if (Math.abs(back - days) > 1 / 1440 + 1e-9) { eq(back, days, '起运折算'); break; } else ok++;
  if (!(days <= 32)) { eq(days, '≤ 32', '起运距节不超过一个节月'); break; }
}

// —— 流年、流月 ——
eq([B.gzName(B.yearGZ(2026)), B.gzName(B.yearGZ(1984))], ['丙午', '甲子'], '流年干支');
const ly = B.liuyue(2026);
eq([ly.length, ly[0].jie, ly[0].name, ly[11].jie, ly[11].name], [12, '立春', '庚寅', '小寒', '辛丑'], '2026 丙午年流月：庚寅起、辛丑止');

// —— 农历 ——
eq(B.LUNAR.text(B.LUNAR.toLunar(2027, 2, 6)), '正月初一', '2027 春节在 2 月 6 日（Intl 中国历误作 7 日）');
eq(B.LUNAR.text(B.LUNAR.toLunar(1987, 7, 26)), '闰六月初一', '1987 闰六月');
eq(at(2000, 1, 1, 0, 0).lunar, { y: 1999, m: 11, d: 25, leap: false, len: 30 }, '2000-01-01 = 己卯年冬月廿五');

// —— 夏令时 ——
eq([B.isChinaDST(1988, 4, 17), B.isChinaDST(1988, 4, 16), B.isChinaDST(1991, 9, 15), B.isChinaDST(1992, 7, 1)], [true, false, true, false], '大陆夏令时日期');
const dst = at(1988, 7, 1, 8, 30, { dst: true });
eq([dst.std.h, dst.std.mi, dst.pillars[3].name.slice(1)], [7, 30, '辰'], '夏令时钟表 08:30 → 标准时 07:30，仍辰时');

// —— 四柱反推：随机命盘的四柱必能反推回出生时刻 ——
for (let k = 0; k < 60; k++) {
  const t = Date.UTC(1950, 0, 1) + Math.floor(rnd() * (Date.UTC(2050, 0, 1) - Date.UTC(1950, 0, 1)));
  const f = new Date(t + 8 * 3600e3);
  const zi = rnd() < 0.5 ? 'next' : 'same';
  const c = at(f.getUTCFullYear(), f.getUTCMonth() + 1, f.getUTCDate(), f.getUTCHours(), f.getUTCMinutes(), { zi });
  const r = B.fromPillars(c.pillars.map(p => p.name), { tz: 8, zi });
  const me = B.fmtF(c.std);
  const hit = (r.list || []).some(w => w.from <= me && me < w.to);
  if (!hit) { eq(me, (r.list || []).map(w => w.from + '~' + w.to), '四柱反推 ' + names(c) + ' ' + zi); break; } else ok++;
}
eq(B.fromPillars(['甲子', '甲子', '甲子', '甲子']).error, '月干与年干不合五虎遁：甲子年无甲子月', '反推：五虎遁不合');

console.log(bad ? `\n${bad} 项不合，${ok} 项相合` : `全部相合（${ok} 项）`);
process.exit(bad ? 1 : 0);
