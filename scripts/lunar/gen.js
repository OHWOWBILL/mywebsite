// 生成 static/fabao/lunar.js 的农历月表：node scripts/lunar/gen.js（约一分钟）
// 先用 Intl 中国历扫日找初一，再逐一交给 iztro（寿星万年历口径）核对，以 iztro 为准。
// 两者在 1900–2100 年间有 14 处不同（1917/1922/1987 闰月归属、2027/2030 春节等），iztro 与紫金山口径一致。
global.self = global;
const fs = require('fs'), path = require('path');
const iztro = require('../../static/ziwei/iztro.min.js');
const DAY = 86400000;
const f = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric' });
const intlDay = t => +(f.formatToParts(new Date(t + 4 * 3600e3)).find(x => x.type === 'day') || {}).value;
function iz(t) {
  const d = new Date(t);
  const r = iztro.astro.bySolar(`${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`, 6, '男', true, 'zh-CN').rawDates.lunarDate;
  return { y: r.lunarYear, m: r.lunarMonth, leap: r.isLeap, d: r.lunarDay };
}
const starts = [];
for (let t = Date.UTC(1899, 10, 20); t <= Date.UTC(2101, 1, 10); t += DAY) {
  if (intlDay(t) !== 1) continue;
  for (const dt of [0, -1, 1, -2, 2]) {
    const b = iz(t + dt * DAY);
    if (b.d === 1) { starts.push({ day: (t + dt * DAY) / DAY, y: b.y, m: b.m, leap: b.leap }); break; }
  }
}
// 1899 冬月、腊月 + 1900–2100 整年，2101 正月初一作收尾
const i0 = starts.findIndex(s => s.y === 1899 && s.m === 11);
const iEnd = starts.findIndex(s => s.y === 2101 && s.m === 1);
const ms = starts.slice(i0, iEnd + 1);
let enc = '';
for (let Y = 1900; Y <= 2100; Y++) {
  const list = ms.map((s, i) => ({ s, len: ms[i + 1] ? ms[i + 1].day - s.day : 0 })).filter(x => x.s.y === Y);
  const leap = (list.find(x => x.s.leap) || { s: { m: 0 } }).s.m;
  let bits = 0;
  list.forEach((x, i) => { if (x.len === 30) bits |= 1 << i; else if (x.len !== 29) throw new Error('month len ' + x.len); });
  enc += leap.toString(16) + bits.toString(16).padStart(4, '0');
}
const pre = [ms[1].day - ms[0].day, ms[2].day - ms[1].day];   // 1899 冬月、腊月天数
const src = fs.readFileSync(path.join(__dirname, 'template.js'), 'utf8')
  .replace('__FIRST__', ms[0].day).replace('__PRE__', JSON.stringify(pre)).replace('__DATA__', enc.match(/.{1,100}/g).map(s => `'${s}'`).join(' +\n    '));
// 法宝页从 /fabao/lunar.js 引；站内脚本包（日课、日签、五术门庭）从 assets/js/qj/lunar.js 拼进去
fs.writeFileSync(path.join(__dirname, '../../static/fabao/lunar.js'), src);
fs.writeFileSync(path.join(__dirname, '../../assets/js/qj/lunar.js'), src);
console.log('写入 static/fabao/lunar.js 与 assets/js/qj/lunar.js，月数', ms.length - 1);
