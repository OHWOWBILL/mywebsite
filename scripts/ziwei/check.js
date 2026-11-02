// 核对紫微排盘核心：node scripts/ziwei/check.js
global.self = global;
const ZW = require('../../static/ziwei/ziwei.js');
let bad = 0;
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', msg, '得', JSON.stringify(a), '应', JSON.stringify(b)); } else console.log('✓', msg); };
const at = (c, name) => c.palaces.find(p => p.major.concat(p.minor).some(s => s.name === name)).zhi;

// 例一：公历 1990-06-15 午时 男 = 农历庚午年五月廿三
const c = ZW.chart({ cal: 'solar', y: 1990, m: 6, d: 15, t: 6, g: '男' });
eq(c.info.gz, ['庚午', '壬午', '辛亥', '甲午'], '四柱');
eq(ZW.ZHI[c.ming] + ZW.ZHI[c.shen], '子子', '命宫、身宫（五月午时：命身同宫在子）');
eq(c.info.ju, '火六局', '五行局（命宫戊子，霹雳火）');
eq(at(c, '紫微'), '辰', '紫微（火六局廿三日：6×4=24，差一逆退，巳退辰）');
eq(at(c, '天府'), '子', '天府与紫微以寅申为轴对称');
eq([c.info.soul, c.info.body], ['贪狼', '火星'], '命主（子）、身主（午年）');
// 农历输入同盘
const cl = ZW.chart({ cal: 'lunar', y: 1990, m: 5, d: 23, t: 6, g: '男' });
eq(cl.palaces.map(p => p.major.map(s => s.name)), c.palaces.map(p => p.major.map(s => s.name)), '农历输入与公历同盘');
// 生年四化：庚 阳武阴同
const hua = {}; c.palaces.forEach(p => p.major.concat(p.minor).forEach(s => { if (s.hua) hua[s.hua] = s.name; }));
eq([hua['禄'], hua['权'], hua['科'], hua['忌']], ['太阳', '武曲', '太阴', '天同'], '庚年四化');
// 飞化：命宫干飞出四化，落宫与星所在一致
const f = ZW.fly(c, c.ming);
eq(f.every(x => x.to === -1 || c.palaces[x.to].major.concat(c.palaces[x.to].minor).some(s => s.name === x.star)), true, '命宫飞化落宫');
// 转宫：以夫妻宫为太极，夫妻宫本身是「夫之命」，它的夫妻宫是「夫之夫」= 本命财帛
const fu = c.palaces.find(p => p.name === '夫妻').br;
eq(ZW.zhuanName(c, fu, fu), '夫之命', '转宫 夫之命');
const fufu = (fu - 2 + 12) % 12;
eq([ZW.zhuanName(c, fu, fufu), c.palaces[fufu].name], ['夫之夫', '财帛'], '夫之夫 = 本命财帛');
// 庙旺（全书）：太阴在亥庙、紫微在子平
eq(ZW.brightOf('太阴', 11) + ZW.brightOf('紫微', 0), '庙平', '全书庙旺表取数');
// 运限：2026 丙午年，虚岁 37
const y = ZW.yun(c, 2026);
eq([y.yearly.gan + y.yearly.zhi, y.yearly.hua], ['丙午', ['天同', '天机', '文昌', '廉贞']], '2026 流年干支与四化');
eq(ZW.nominalAge(c, 2026), 37, '虚岁');
const dx = c.palaces.find(p => p.dx[0] <= 37 && p.dx[1] >= 37);
eq(y.decadal.br, dx.br, '大限宫与宫上岁数一致');
// 晚子时作次日子时
const z1 = ZW.chart({ cal: 'solar', y: 1990, m: 6, d: 15, t: 12, g: '男' }), z2 = ZW.chart({ cal: 'solar', y: 1990, m: 6, d: 16, t: 0, g: '男' });
eq(z1.palaces.map(p => p.major.map(s => s.name)), z2.palaces.map(p => p.major.map(s => s.name)), '晚子时 = 次日早子');
eq(ZW.isChinaDST(1988, 5, 1) && !ZW.isChinaDST(1992, 5, 1), true, '夏令时 1986–1991');
// 八字年月按节气换（不随农历）：交节前后各一分钟，北京时间
const bj = (y, m, d, h, mi) => Date.UTC(y, m - 1, d, h, mi) - 8 * 3600000;
const gzAt = (y, m, d, h, mi) => ZW.chart({ cal: 'solar', y, m, d, t: ZW.timeIndexOf(h), g: '男', ms: bj(y, m, d, h, mi) }).info.gz.slice(0, 2).join(' ');
eq(gzAt(2024, 2, 4, 16, 26), '癸卯 乙丑', '2024 立春前一分（16:27 交）');
eq(gzAt(2024, 2, 4, 16, 28), '甲辰 丙寅', '2024 立春后一分');
eq(gzAt(2024, 2, 8, 12, 0), '甲辰 丙寅', '立春后、春节前：年月按节气，不按农历腊月');
eq(gzAt(2024, 3, 5, 10, 21), '甲辰 丙寅', '2024 惊蛰前（10:22 交）');
eq(gzAt(2024, 3, 5, 10, 24), '甲辰 丁卯', '2024 惊蛰后');
eq(gzAt(2023, 8, 8, 12, 0), '癸卯 庚申', '2023 立秋当天交节后（农历仍六月）');
eq(gzAt(2025, 1, 5, 12, 0), '甲辰 丁丑', '2025 小寒后（1/5 10:33 交）');
eq(gzAt(2026, 11, 2, 12, 0), '丙午 戊戌', '2026-11-02 立冬前');
// 农历入参：按时辰中点、东八区折算
const lc = ZW.chart({ cal: 'lunar', y: 2023, m: 12, d: 29, t: 6, g: '男' });
eq(lc.info.gz.slice(0, 2).join(' '), '甲辰 丙寅', '农历腊月廿九（公历 2024-02-08）');
console.log(bad ? `\n${bad} 项不符` : '\n全部相符');
process.exit(bad ? 1 : 0);
