// 金口诀自检：TZ=Asia/Tokyo node scripts/jinkou/check.js
// 对照值按口诀手推（不拿程序结果对自己）：
//   2026-11-10 09:30（霜降后卯将，戊子日，巳时）：
//     地分巳：卯加巳，巳上见卯 → 将神卯（太冲）；戊日昼贵丑，丑在亥子丑寅卯辰顺布：丑贵寅蛇卯雀辰合巳勾 → 贵神勾陈（辰土）；
//     戊癸起壬子，遁至巳得丁 → 人元丁；勾陈本家辰遁丙，将神卯遁乙。四位丁阴、辰阳、卯阴、巳阴 → 三阴一阳，以贵神为用。
//     地分午：午上见辰 → 将神天罡；丑顺数到午为青龙；人元戊。
//   甲日昼贵丑顺布，地分子：子为第十二位 → 天后。
process.env.TZ = process.env.TZ || 'Asia/Tokyo';
const JK = require('../../static/jinkou/jinkou.js');
const LR = require('../../static/liuren/liuren.js');
const Z = LR.ZHI, G = LR.GAN;
let bad = 0, ok = 0;
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '得', JSON.stringify(a), '应', JSON.stringify(b)); } else { ok++; console.log('✓', what); } };
const t = new Date(2026, 10, 10, 9, 30);
let c = JK.cast(t, {});
eq([Z[c.jiang], Z[c.hour], c.day.name], ['卯', '巳', '戊子'], '卯将巳时戊子日');
eq([G[c.wei[0].gan], c.wei[1].name, Z[c.wei[1].zhi], G[c.wei[1].gan], Z[c.wei[2].zhi], G[c.wei[2].gan], Z[c.wei[3].zhi]], ['丁', '勾陈', '辰', '丙', '卯', '乙', '巳'], '地分巳四位');
eq([c.yinyang.yang, c.yong], [1, 1], '三阴一阳，贵神为用');
eq(c.rels.map(r => r.k), ['sheng', 'zei', 'sheng'], '上下生克');
c = JK.cast(t, { difen: 6 });
eq([G[c.wei[0].gan], c.wei[1].name, Z[c.wei[2].zhi], c.wei[2].name], ['戊', '青龙', '辰', '天罡'], '地分午');
const b = JK.build({ di: 0, hourZhi: 4, jiang: 4, monthZhi: 2 }, { difen: 0 });
eq([b.wei[1].name, G[b.wei[0].gan]], ['天后', '甲'], '甲子日昼贵地分子');
const n = JK.build({ di: 0, hourZhi: 10, jiang: 4, monthZhi: 2 }, { difen: 0 });
eq([Z[n.gui.zhi], n.gui.shun, n.wei[1].name], ['未', false, '白虎'], '甲日夜贵未逆布（未贵午蛇巳雀辰合卯勾寅龙丑空子虎），地分子');
console.log(`\n${ok} 过，${bad} 错`);
process.exit(bad ? 1 : 0);
