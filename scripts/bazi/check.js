// 八字排盘核心自检：node scripts/bazi/check.js
// 一、四柱与奇门手记 core.js（同一张节气表）逐一对照两千个随机时刻；
// 二、与 iztro（另一套独立实现，年柱按立春）对照三百个随机日；
// 三、已知命例、神煞、干支关系、命宫胎元胎息逐项手算核对；
// 四、子时两派、真太阳时、起运、农历、四柱反推；
// 五、《穷通宝鉴》调候表：一百二十格齐全、逐格抽对原文、透干藏支的判法；
// 六、流日流时：逐日对照日柱、月份首尾相接，时柱两种子时口径。
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
const ZHI_OF = z => '子丑寅卯辰巳午未申酉戌亥'[z];
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
// 时辰不详：只给年月日三柱，列出的整日必含出生时刻，且每段不超过一日
for (let k = 0; k < 40; k++) {
  const t = Date.UTC(1950, 0, 1) + Math.floor(rnd() * (Date.UTC(2050, 0, 1) - Date.UTC(1950, 0, 1)));
  const f = new Date(t + 8 * 3600e3), zi = rnd() < 0.5 ? 'next' : 'same';
  const c = at(f.getUTCFullYear(), f.getUTCMonth() + 1, f.getUTCDate(), f.getUTCHours(), f.getUTCMinutes(), { zi });
  const r = B.fromPillars(c.pillars.slice(0, 3).map(p => p.name).concat([null]), { tz: 8, zi });
  const me = B.fmtF(c.std);
  if (!(r.list || []).some(w => w.from <= me && me < w.to) || r.list.some(w => Date.parse(w.to.replace(' ', 'T') + 'Z') - Date.parse(w.from.replace(' ', 'T') + 'Z') > 864e5)) {
    eq(me, r.list, '时辰不详反推 ' + names(c) + ' ' + zi); break;
  } else ok++;
}
const r90 = B.fromPillars(['庚午', '壬午', '辛亥', null], { tz: 8, zi: 'next' }).list.map(w => w.from);
eq(r90.includes('1990-06-14 23:00'), true, '庚午 壬午 辛亥：1990-06-14 23:00 起（子时换日）');

// —— 五、《穷通宝鉴》调候 ——
// 原文据殆知阁本（github.com/garychowcmu/daizhigev20「易藏/术数/穷通宝鉴.txt」）与维基文库本
// （zh.wikisource.org/wiki/穷通宝鉴）互校；下面注里引的是两本共有的句子，异体字已改简体。
const QT = require('../../static/bazi/qiongtong.js');
const STEMS = '甲乙丙丁戊己庚辛壬癸';
// 一百二十格：每格有用神（只含天干、不重复）与原文要句，所列每个用神都在要句或附注里点过名
{
  let n = 0;
  for (const g of STEMS) for (const z of B.ZHI) {
    const e = QT.T[g + z];
    if (!e) { eq(g + z, '有', '调候表缺格'); continue; }
    n++;
    const okY = /^[甲乙丙丁戊己庚辛壬癸]+$/.test(e.y) && new Set(e.y).size === e.y.length;
    const named = [...e.y].every(s => (e.q + (e.n || '')).replace(new RegExp(g + '(?=[木火土金水])', 'g'), '').includes(s));
    if (!okY || !e.q || !named) eq([g + z, e.y, okY, !!e.q, named], [g + z, e.y, true, true, true], '调候格式');
    else ok++;
  }
  eq([n, Object.keys(QT.T).length], [120, 120], '调候表十干 × 十二月共一百二十格');
}
eq([QT.get(0, 2).key, QT.get(0, 2).month, QT.get('甲', '子').month, QT.get('癸', '丑').month, QT.get(9, 1).key], ['甲寅', '正月', '十一月', '十二月', '癸丑'], '调候表取法：序号与字两用，月令以寅为正月');
// 逐格抽对原文（[格, 用神, 要句里必有的字]）
[
  ['甲寅', '丙癸', '得丙癸逢'],         // 「正月甲木，初春尚有余寒，得丙癸逢，富贵双全。」
  ['甲巳', '癸丁庚', '先癸后丁'],       // 「四月甲木退气，丙火司权，先癸后丁。」又「或癸丁与庚齐透天干，此命可言科甲」
  ['甲未', '丁庚', '先丁后庚'],         // 「六月三伏生寒，丁火退气。先丁后庚，无癸亦可。」（速查表多作癸丁庚，不从）
  ['甲申', '丁庚', '丁火为尊'],         // 「七月甲木，丁火为尊，庚金次之，庚金不可少。」（速查表多作庚丁壬，不从）
  ['甲酉', '丁丙庚', '丁火为先'],       // 「八月甲木，木囚金旺。丁火为先，次用丙火，庚金再次。」
  ['甲子', '丁庚丙', '丁先庚后'],       // 「十一月甲木，木性生寒，丁先庚后，丙火佐之。」
  ['甲丑', '庚丁', '先用庚劈甲'],       // 「十二月甲木……先用庚劈甲，方引丁火始得木火有通明之象，故丁次之。」
  ['乙寅', '丙癸', '丙火为先'],         // 「正月乙木，必须用丙……故以丙火为先，癸水次之。」
  ['乙辰', '癸丙', '先癸后丙'],         // 「三月乙木，阳气愈炽，先癸后丙。」
  ['乙子', '丙', '专用丙火'],           // 「十一月乙木，花木寒冻，一阳来复，喜用丙火解冻……故耑（专）用丙火。」
  ['丙寅', '壬庚', '取壬为尊'],         // 「正月丙火，三阳开泰，火气渐炎，取壬为尊，庚金佐之」
  ['丙戌', '甲壬', '先用甲木'],         // 「九月丙火，火气愈退，所忌土晦光，必须先用甲木，次取壬水。」
  ['丁卯', '庚甲', '先庚后甲'],         // 「二月丁火，湿乙伤丁，先庚后甲，非庚不能去乙，非甲不能引丁。」
  ['丁未', '甲壬庚', '专取甲木'],       // 「六月丁火……丁弱极矣，专取甲木，壬水次之。」又「无庚不妙」（维基文库本缺此起首句）
  ['丁子', '甲庚', '甲木为尊'],         // 「三冬丁火，甲木为尊，庚金佐之，戊癸权宜酌用可也。」
  ['戊寅', '丙甲癸', '先丙后甲'],       // 「正二月先丙后甲，癸又次之」（殆知阁本脱「甲」字，维基文库本有）
  ['戊戌', '甲癸丙', '先看甲木'],       // 「九月戊土当权，不可专用丙，先看甲木，次取癸水……见金先用癸水，后取丙火」
  ['己辰', '丙癸甲', '先丙后癸'],       // 「三月己土，正栽培禾稼之时，先丙后癸，土暖而润，随用甲疏」
  ['己巳', '癸丙', '取癸为要'],         // 「三夏己土……最喜甘沛，取癸为要，次用丙火」
  ['庚寅', '丙甲丁', '先用丙暖庚性'],   // 「先用丙暖庚性，又虑土厚埋金，须甲疏泄」；「总之正月庚金，丙甲为上，丁火次之」
  ['庚戌', '甲壬', '先用甲疏'],         // 「九月庚金……宜先用甲疏，后用壬洗，则金自出矣，忌见己土浊壬。」
  ['庚丑', '丙丁甲', '先取丙火解冻'],   // 「十二月庚金……先取丙火解冻，次取丁火炼金，甲亦不可少。」
  ['辛寅', '己壬庚', '先己后壬'],       // 「故正月辛金，先己后壬，己为君，庚为佐」
  ['辛丑', '丙壬戊己', '丙先壬后'],     // 「十二月辛金，丙先壬后，戊己次之。」
  ['壬卯', '戊辛庚', '先戊后辛'],       // 「二月壬水，先戊后辛，庚金次之。」
  ['壬亥', '戊丙庚', '专用戊丙'],       // 「十月壬水，专用戊丙，次取庚金。」
  ['壬丑', '丙丁甲', '先取丙火'],       // 「腊月壬水，先取丙火，丁甲为佐，故水冷金寒爱丙丁。」
  ['癸卯', '庚辛', '专以庚金为用'],     // 「二月癸水……乙木司令，泄弱元神，专以庚金为用，辛金次之」
  ['癸子', '丙辛', '专用丙火解冻']      // 「十一月癸水，值冰冻之时……专用丙火解冻，庶不致成冰，又要辛金滋扶」
].forEach(([k, y, w]) => eq([QT.T[k].y, QT.T[k].q.includes(w)], [y, true], '调候原文 ' + k + ' ' + y));
// 书中言忌，明白可据者
eq([QT.T['丁巳'].ji.includes('以癸为病'), QT.T['庚午'].ji, QT.T['己寅'].ji, QT.T['辛申'].ji], [true, '切忌戊己透干制水', '忌见壬水，反为己病', '癸水不可为用'],
  '调候言忌：四月丁火「故以癸为病」、五月庚金「切忌戊己透干制水」、正月己土「忌见壬水」、七月辛金「癸水不可为用」');
eq(QT.T['乙丑'].n.includes('十一月乙木'), true, '十二月乙木：两本误题十一月，附注说明');

// 透干藏支：透看年、月、时三干（日干本身不算），藏看四支藏干
const thOf = (y, mo, d, h, mi, tz) => B.analyze(B.chart({ y, mo, d, h, mi, tz: tz == null ? 8 : tz, male: true })).tiaohou;
const brief = th => th.stems.map(s => s.gan + s.state + s.tou.join('') + (s.cang.length ? '/' + s.cang.map(c => c.pillar + c.zhi + c.qi).join(',') : ''));
const t90 = thOf(1990, 5, 17, 8, 30, 9);             // 庚午 辛巳 壬午 甲辰：壬日巳月取壬辛庚
eq([t90.key, t90.y, brief(t90)], ['壬巳', '壬辛庚', ['壬无', '辛透月', '庚透年/月巳中气']], '1990-05-17 东京：日干之壬不算，辛透月干，庚透年干兼藏巳');
eq([t90.tou, t90.cang, t90.stems.map(s => s.ss)], [2, 0, ['比肩', '正印', '偏印']], '透藏计数与十神');
eq(brief(thOf(1949, 10, 1, 15, 0)), ['丁无', '丙无', '庚藏/时申本气'], '1949 己丑 癸酉 甲子 壬申：甲日酉月丁丙庚，只庚藏申');
eq(brief(thOf(1984, 2, 10, 10, 0)), ['丙透月/月寅中气,时巳本气', '癸藏/年子本气'], '1984 甲子 丙寅 甲戌 己巳：丙透月干又藏寅巳，癸藏子');
eq(brief(thOf(2003, 8, 8, 6, 0)), ['庚无', '辛藏/日丑余气', '壬无', '癸透年/日丑中气'], '2003 癸未 己未 癸丑 乙卯：年干之癸算透，日干不算');
const t75 = thOf(1975, 12, 20, 18, 0);
eq([t75.key, t75.tou, t75.cang], ['庚子', 0, 0], '1975 乙卯 戊子 庚子 乙酉：丁甲丙全无');
// 月令以节换：1990 立春 2 月 4 日 10:14（北京时间），前一分丑月、后一分寅月
const lcA = thOf(1990, 2, 4, 10, 13), lcB = thOf(1990, 2, 4, 10, 15);
eq([lcA.gan, lcA.zhi, lcB.gan, lcB.zhi], [lcA.gan, '丑', lcA.gan, '寅'], '立春前后一分，调候换到寅月一格');
// 随机命盘：逐个用神照原局重算透藏
for (let k = 0; k < 400; k++) {
  const t = Date.UTC(1901, 0, 1) + Math.floor(rnd() * (Date.UTC(2099, 0, 1) - Date.UTC(1901, 0, 1)));
  const f = new Date(t + 8 * 3600e3);
  const c = at(f.getUTCFullYear(), f.getUTCMonth() + 1, f.getUTCDate(), f.getUTCHours(), f.getUTCMinutes());
  const th = B.analyze(c).tiaohou, P = c.pillars;
  const want = QT.T[B.GAN[P[2].gan] + B.ZHI[P[1].zhi]].y.split('').map(s => {
    const g = B.GAN.indexOf(s);
    return [0, 1, 3].some(i => P[i].gan === g) ? '透' : P.some(p => B.CANG[p.zhi].includes(g)) ? '藏' : '无';
  });
  if (JSON.stringify(th.stems.map(s => s.state)) !== JSON.stringify(want)) { eq(th.stems.map(s => s.state), want, '调候透藏重算 ' + names(c)); break; } else ok++;
}
// 浏览器里：没载入 qiongtong.js 的页（合盘、六爻）调候为 null；载入后与 node 结果一致
{
  const vm = require('vm'), fs = require('fs'), path = require('path');
  const box = vm.createContext({});
  const run = f => vm.runInContext(fs.readFileSync(path.join(__dirname, '../../static', f), 'utf8'), box, { filename: f });
  ['qimen/jieqi.js', 'fabao/lunar.js', 'bazi/bazi.js'].forEach(run);
  const inp = { y: 1990, mo: 5, d: 17, h: 8, mi: 30, tz: 9, male: true };
  eq(box.BZ.analyze(box.BZ.chart(inp)).tiaohou, null, '浏览器：未载入调候表时 tiaohou 为 null，其余照旧');
  run('bazi/qiongtong.js');
  eq(JSON.stringify(box.BZ.analyze(box.BZ.chart(inp)).tiaohou), JSON.stringify(t90), '浏览器：载入调候表后与 node 结果一致');
}

// —— 六、流日 · 流时 ——
// 流日：随机抽年月，逐日与 chart() 当日正午的日柱、月柱对照；十二个月首尾相接、天数合计等于一年
for (let n = 0; n < 40; n++) {
  const Y = 1901 + Math.floor(rnd() * 198), tz = [8, 9, -5][n % 3];
  let total = 0, prevEnd = null;
  for (let k = 0; k < 12; k++) {
    const R = B.liuri(Y, k, tz), m = B.liuyue(Y)[k];
    total += R.length;
    eq(R.length >= 29 && R.length <= 32, true, `${Y} 第${k + 1}月流日天数 ${R.length}`);
    eq(R[0].jie, m.jie, `${Y} 第${k + 1}月首日标节`);
    const first = Date.UTC(R[0].y, R[0].mo - 1, R[0].d);
    if (prevEnd != null) eq(first - prevEnd, 864e5, `${Y} 第${k + 1}月与上月首尾相接`);
    prevEnd = Date.UTC(R.at(-1).y, R.at(-1).mo - 1, R.at(-1).d);
    R.forEach((r, i) => {
      const c = B.chart({ y: r.y, mo: r.mo, d: r.d, h: 12, mi: 0, tz, male: true });
      if (c.pillars[2].idx !== r.idx) eq(r.name, c.pillars[2].name, `流日 ${r.y}-${r.mo}-${r.d}`); else ok++;
      if (i > 0 && c.pillars[1].idx !== m.idx) eq(c.pillars[1].name, m.name, `流日 ${r.y}-${r.mo}-${r.d} 所属流月`);
    });
  }
  eq(total >= 365 && total <= 366, true, `${Y} 干支年流日合计 ${total}`);
}
// 流时：与 chart() 各时辰的时柱对照（两种子时口径）
for (let n = 0; n < 60; n++) {
  const t = Date.UTC(1901, 0, 1) + Math.floor(rnd() * 198 * 365) * 864e5, f = new Date(t);
  const y = f.getUTCFullYear(), mo = f.getUTCMonth() + 1, d = f.getUTCDate();
  ['next', 'same'].forEach(zi => {
    const di = B.dayGZ(y, mo, d), H = B.liushi(di, zi);
    eq(H.length, zi === 'same' ? 13 : 12, `流时个数 ${zi}`);
    for (let z = 1; z < 12; z++) eq(H[z].name, at(y, mo, d, z * 2, 30, { zi }).pillars[3].name, `流时 ${y}-${mo}-${d} ${ZHI_OF(z)} ${zi}`);
    // 子时：「子时换日」取前一日 23:30 那一刻；「晚子当日」早子取本日 0:30，晚子取本日 23:30
    const pv = new Date(t - 864e5);
    if (zi === 'next') eq(H[0].name, at(pv.getUTCFullYear(), pv.getUTCMonth() + 1, pv.getUTCDate(), 23, 30, { zi }).pillars[3].name, `子时换日 ${y}-${mo}-${d}`);
    else {
      eq(H[0].name, at(y, mo, d, 0, 30, { zi }).pillars[3].name, `早子 ${y}-${mo}-${d}`);
      const lc = at(y, mo, d, 23, 30, { zi });
      eq([H[12].name, lc.pillars[2].idx], [lc.pillars[3].name, di], `晚子 ${y}-${mo}-${d}`);
    }
  });
}
// 手算一例：2026-11-08 丙戌日；丙日戊子时起，酉时丁酉；晚子接丁日为庚子
eq(B.liuri(2026, 9, 8).find(r => r.mo === 11 && r.d === 8).name, '丙戌', '2026-11-08 流日丙戌');
eq(B.liushi(B.dayGZ(2026, 11, 8), 'same').map(h => h.name).join(''), '戊子己丑庚寅辛卯壬辰癸巳甲午乙未丙申丁酉戊戌己亥庚子', '丙戌日流时（晚子当日）');

console.log(bad ? `\n${bad} 项不合，${ok} 项相合` : `全部相合（${ok} 项）`);
process.exit(bad ? 1 : 0);
