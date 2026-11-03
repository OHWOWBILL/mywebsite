// 生成日本旧暦月表 static/fabao/kyureki.js（与 assets/js/qj/kyureki.js 同一份）：node scripts/lunar/gen-kyureki.js
// 六曜、不成就日按日本旧暦算。旧暦与中国农历同法（定朔、中气定月、冬至在十一月、无中气之月置闰），
// 只是「哪一天」按日本时间（UTC+9）切：朔若落在北京时间 23 点到 24 点之间，日本那边已是次日，月首差一天。
// 做法：
//   1. 朔按 Meeus《天文算法》第 49 章（平朔加周期项与十四项行星摄动），力学时以 Espenak–Meeus 的 ΔT 化世界时；
//   2. 先拿同一批朔按北京时间落日，逐月对照站内农历月表（寿星万年历口径，scripts/lunar/gen.js 所出），必须全数吻合；
//   3. 再按日本时间落日，中气取奇门手记的节气表（/qimen/jieqi.js，精确到分）定月序与闰月。
const fs = require('fs'), path = require('path');
const LUNAR = require('../../static/fabao/lunar.js');
const J = require('../../static/qimen/jieqi.js');
const DAY = 86400000, RAD = Math.PI / 180;

// —— ΔT（秒），Espenak & Meeus 多项式 ——
function deltaT(y) {
  let t;
  if (y < 1900) { t = y - 1860; return 7.62 + 0.5737 * t - 0.251754 * t * t + 0.01680668 * t ** 3 - 0.0004473624 * t ** 4 + t ** 5 / 233174; }
  if (y < 1920) { t = y - 1900; return -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t ** 3 - 0.000197 * t ** 4; }
  if (y < 1941) { t = y - 1920; return 21.20 + 0.84493 * t - 0.076100 * t * t + 0.0020936 * t ** 3; }
  if (y < 1961) { t = y - 1950; return 29.07 + 0.407 * t - t * t / 233 + t ** 3 / 2547; }
  if (y < 1986) { t = y - 1975; return 45.45 + 1.067 * t - t * t / 260 - t ** 3 / 718; }
  if (y < 2005) { t = y - 2000; return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5; }
  if (y < 2050) { t = y - 2000; return 62.92 + 0.32217 * t + 0.005589 * t * t; }
  return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y);
}

// —— 第 k 个朔（k=0 为 2000-01-06）的世界时（Unix 毫秒）——
function newMoon(k) {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T, T4 = T3 * T;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.000000150 * T3 + 0.00000000073 * T4;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = (2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3) * RAD;
  const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4) * RAD;
  const F = (160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4) * RAD;
  const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3) * RAD;
  const s = Math.sin;
  jde += -0.40720 * s(Mp) + 0.17241 * E * s(M) + 0.01608 * s(2 * Mp) + 0.01039 * s(2 * F)
    + 0.00739 * E * s(Mp - M) - 0.00514 * E * s(Mp + M) + 0.00208 * E * E * s(2 * M) - 0.00111 * s(Mp - 2 * F)
    - 0.00057 * s(Mp + 2 * F) + 0.00056 * E * s(2 * Mp + M) - 0.00042 * s(3 * Mp) + 0.00042 * E * s(M + 2 * F)
    + 0.00038 * E * s(M - 2 * F) - 0.00024 * E * s(2 * Mp - M) - 0.00017 * s(Om) - 0.00007 * s(Mp + 2 * M)
    + 0.00004 * s(2 * Mp - 2 * F) + 0.00004 * s(3 * M) + 0.00003 * s(Mp + M - 2 * F) + 0.00003 * s(2 * Mp + 2 * F)
    - 0.00003 * s(Mp + M + 2 * F) + 0.00003 * s(Mp - M + 2 * F) - 0.00002 * s(Mp - M - 2 * F) - 0.00002 * s(3 * Mp + M)
    + 0.00002 * s(4 * Mp);
  const A = [
    [299.77 + 0.107408 * k - 0.009173 * T2, 0.000325], [251.88 + 0.016321 * k, 0.000165], [251.83 + 26.651886 * k, 0.000164],
    [349.42 + 36.412478 * k, 0.000126], [84.66 + 18.206239 * k, 0.000110], [141.74 + 53.303771 * k, 0.000062],
    [207.14 + 2.453732 * k, 0.000060], [154.84 + 7.306860 * k, 0.000056], [34.52 + 27.261239 * k, 0.000047],
    [207.19 + 0.121824 * k, 0.000042], [291.34 + 1.844379 * k, 0.000040], [161.72 + 24.198154 * k, 0.000037],
    [239.56 + 25.513099 * k, 0.000035], [331.55 + 3.592518 * k, 0.000023]
  ];
  A.forEach(([a, c]) => { jde += c * s(a * RAD); });
  const ms = (jde - 2440587.5) * DAY;
  const y = new Date(ms).getUTCFullYear() + new Date(ms).getUTCMonth() / 12;
  return ms - deltaT(y) * 1000;
}

// 1899 年 11 月前后到 2101 年 3 月的全部朔
const k0 = Math.floor((Date.UTC(1899, 9, 1) / DAY + 2440587.5 - 2451550.09766) / 29.530588861);
const moons = [];
for (let k = k0; ; k++) { const t = newMoon(k); if (t > Date.UTC(2101, 3, 1)) break; moons.push(t); }
const dayOf = (t, tz) => Math.floor((t + tz * 3600e3) / DAY);

// —— 1. 按北京时间落日，对照站内农历月表 ——
const cnStarts = new Set();
for (let d = Date.UTC(1899, 11, 3); d < Date.UTC(2101, 0, 28); d += DAY) {
  const x = new Date(d), L = LUNAR.toLunar(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate());
  if (L && L.d === 1) cnStarts.add(d / DAY);
}
const lo = Date.UTC(1899, 11, 3) / DAY, hi = Date.UTC(2101, 0, 28) / DAY;
// 民国初年（1912–1928）的历书按北京地方平时（东经 116°25′，UTC+7:45:40）落日，其余按东八区（寿星万年历如此）
const cnTz = t => (t >= Date.UTC(1912, 0, 1) && t < Date.UTC(1929, 0, 1) ? (7 * 3600 + 45 * 60 + 40) / 3600 : 8);
const nearMidnight = t => { const r = ((t + cnTz(t) * 3600e3) % DAY + DAY) % DAY; return r < 60e3 || r > DAY - 60e3; };
const mineList = moons.map(t => ({ t, d: dayOf(t, cnTz(t)) })).filter(x => x.d >= lo && x.d < hi);
const mine = new Set(mineList.map(x => x.d));
let miss = 0, edge = 0;
mineList.forEach(x => {
  if (cnStarts.has(x.d)) return;
  if (nearMidnight(x.t) && (cnStarts.has(x.d + 1) || cnStarts.has(x.d - 1))) {   // 朔距北京日界不足一分钟，各家历表会差一天
    edge++; console.log('· 朔贴着北京日界，从农历月表', new Date(x.t).toISOString()); return;
  }
  miss++; console.log('✗ 多出的朔日', new Date(x.d * DAY).toISOString().slice(0, 10));
});
cnStarts.forEach(d => { if (!mine.has(d) && !mine.has(d - 1) && !mine.has(d + 1)) { miss++; console.log('✗ 农历月首对不上', new Date(d * DAY).toISOString().slice(0, 10)); } });
console.log(`北京时间核对：农历月首 ${cnStarts.size} 个，算得 ${mine.size} 个，不符 ${miss} 处（贴日界 ${edge} 处）`);
if (miss) process.exit(1);
// 离日界太近的朔（一分钟内）列出来，ΔT 与历表误差可能翻转日子
moons.forEach(t => {
  const r = ((t + 9 * 3600e3) % DAY + DAY) % DAY;
  if (r < 60e3 || r > DAY - 60e3) console.log('⚠ 朔距日本日界不足一分钟', new Date(t).toISOString());
});

// —— 2. 按日本时间落日，排月序与闰月 ——
const ZHONG = { 雨水: 1, 春分: 2, 谷雨: 3, 小满: 4, 夏至: 5, 大暑: 6, 处暑: 7, 秋分: 8, 霜降: 9, 小雪: 10, 冬至: 11, 大寒: 12 };
const zq = J.terms.filter(x => ZHONG[x.n]).map(x => ({ day: dayOf(x.t, 9), m: ZHONG[x.n] }));
const months = moons.map((t, i) => ({ day: dayOf(t, 9) })).filter((m, i, a) => i < a.length - 1);
months.forEach((m, i) => {
  m.len = dayOf(moons[i + 1], 9) - m.day;
  m.zq = zq.filter(z => z.day >= m.day && z.day < m.day + m.len).map(z => z.m);
});
const winter = months.map((m, i) => m.zq.includes(11) ? i : -1).filter(i => i >= 0);
for (let w = 0; w < winter.length - 1; w++) {
  const a = winter[w], b = winter[w + 1], n = b - a;
  months[a].m = 11; months[a].leap = false;
  let leapDone = n === 12, prev = 11;
  for (let j = a + 1; j <= b; j++) {
    if (!leapDone && months[j].zq.length === 0) { months[j].m = prev; months[j].leap = true; leapDone = true; continue; }
    prev = prev % 12 + 1; months[j].m = prev; months[j].leap = false;
  }
  if (months[b].m !== 11) throw new Error('月序排不齐 ' + new Date(months[a].day * DAY).toISOString());
}
// 节气表止于 2101 惊蛰，2100 冬月之后没有下一个冬至可依：依次往后排（只需排到 2101 正月收尾）
for (let j = winter[winter.length - 1] + 1, prev = 11; j < months.length; j++) { prev = prev % 12 + 1; months[j].m = prev; months[j].leap = false; }
// 年：正月（非闰）换年；最前面的冬月、腊月属上一年
let Y = null;
months.forEach(m => {
  if (m.m == null) return;
  const d = new Date(m.day * DAY);
  if (m.m === 1 && !m.leap) Y = d.getUTCFullYear();
  else if (Y == null) Y = d.getUTCFullYear() - (d.getUTCMonth() <= 1 ? 1 : 0);
  m.y = Y;
});
// 1899 冬月起、2101 正月止
const i0 = months.findIndex(m => m.y === 1899 && m.m === 11 && !m.leap);
const iEnd = months.findIndex(m => m.y === 2101 && m.m === 1 && !m.leap);
const ms = months.slice(i0, iEnd + 1);
let enc = '';
for (let y = 1900; y <= 2100; y++) {
  const list = ms.filter(x => x.y === y);
  const leap = (list.find(x => x.leap) || { m: 0 }).m;
  let bits = 0;
  list.forEach((x, i) => { if (x.len === 30) bits |= 1 << i; else if (x.len !== 29) throw new Error('month len ' + x.len); });
  if (list.length !== (leap ? 13 : 12)) throw new Error(y + ' 年月数 ' + list.length);
  enc += leap.toString(16) + bits.toString(16).padStart(4, '0');
}
const pre = [ms[1].day - ms[0].day, ms[2].day - ms[1].day];
const src = fs.readFileSync(path.join(__dirname, 'template.js'), 'utf8')
  .replace(/^\/\*[\s\S]*?\*\//, `/* 潜蛟阁 · 日本旧暦月表（1899 冬月 至 2100 腊月）
   由 scripts/lunar/gen-kyureki.js 生成，勿手改。与站内农历（/fabao/lunar.js）同法，
   只是朔与中气按日本时间（UTC+9）落日；六曜、不成就日用它。
   存法与 lunar.js 相同：1899 冬月初一的日序（Unix 日），两个前置月的天数，之后每个旧暦年 5 位十六进制。
   浏览器里挂 window.QJ_KYUREKI；node 里 require 即得同一对象。 */`)
  .replace('__FIRST__', ms[0].day).replace('__PRE__', JSON.stringify(pre))
  .replace('__DATA__', enc.match(/.{1,100}/g).map(s => `'${s}'`).join(' +\n    '))
  .replace('root.QJ_LUNAR = api', 'root.QJ_KYUREKI = api');
if (!/root\.QJ_KYUREKI = api/.test(src)) throw new Error('模板里没找到挂载名');
fs.writeFileSync(path.join(__dirname, '../../static/fabao/kyureki.js'), src);
fs.writeFileSync(path.join(__dirname, '../../assets/js/qj/kyureki.js'), src);

// —— 3. 与中国农历相异之处 ——
delete require.cache[require.resolve('../../static/fabao/kyureki.js')];
const KY = require('../../static/fabao/kyureki.js');
const diff = [];
for (let d = Date.UTC(1900, 0, 31); d < Date.UTC(2101, 0, 1); d += DAY) {
  const x = new Date(d), a = LUNAR.toLunar(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()),
    b = KY.toLunar(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate());
  if (!a || !b) continue;
  if (a.y !== b.y || a.m !== b.m || a.d !== b.d || a.leap !== b.leap) diff.push(x.toISOString().slice(0, 7));
}
const span = [...new Set(diff)];
console.log(`写入 static/fabao/kyureki.js 与 assets/js/qj/kyureki.js；与农历相异 ${diff.length} 日，涉及 ${span.length} 个公历月`);
console.log('  ' + span.filter(s => s >= '1990' && s <= '2040').join(' '));
