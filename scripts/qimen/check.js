// 奇门手记排盘自检：node scripts/qimen/check.js（用 TZ=Asia/Tokyo 跑，与样盘同一时区）
// 样盘取自一款专业时家奇门 App 的截图（2026-11-01 01:57，阴遁五局拆补），逐宫对照。
process.env.TZ = process.env.TZ || 'Asia/Tokyo';
const QM = require('../../static/qimen/core.js');
let bad = 0;
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '得', a, '应', b); } };

const c = QM.computeChart(new Date(2026, 10, 1, 1, 57));
eq(Object.values(c.pillars), ['丙午', '戊戌', '己卯', '乙丑'], '四柱');
eq([c.dun, c.ju, c.term], ['阴遁', 5, '霜降'], '局');
// 宫: [八神, 九星, 天盘干(含寄), 八门, 地盘干, 隐干, 地盘神]
const want = {
  4: ['白虎', '天任', '丁', '死门', '己', '辛', '太阴'],
  9: ['六合', '天冲', '庚', '惊门', '癸', '丙', '腾蛇'],
  2: ['太阴', '天辅', '己', '开门', '辛', '乙', '值符'],
  3: ['玄武', '天蓬', '壬', '景门', '庚', '癸', '六合'],
  7: ['腾蛇', '天英', '癸', '休门', '丙', '壬', '九天'],
  8: ['九地', '天心', '乙', '杜门', '丁', '己', '白虎'],
  1: ['九天', '天柱', '丙', '伤门', '壬', '庚', '玄武'],
  6: ['值符', '天芮', '辛戊', '生门', '乙', '丁', '九地']
};
for (const [p, w] of Object.entries(want)) {
  const s = c.sky[p];
  eq([c.gods[p], s.star, s.stems.join('') + (s.ji || ''), c.doors[p], c.earth[p], c.hidden[p], c.diGods[p]], w, p + '宫');
}
eq(c.hidden[5], '戊', '中五隐干');
eq([c.zfPalace, c.zhishiPalace, c.horseP], [6, 4, 6], '值符/值使/马');
eq([c.kong.join(''), c.dayKong.join(''), c.dayKongP], ['戌亥', '申酉', [2, 7]], '空亡');
eq([c.marks[2].xing, c.marks[6].mu, c.marks[8].po], [['己'], ['戊'], true], '刑墓迫');
const others = [1, 3, 4, 7, 9].filter(p => c.marks[p].xing.length || c.marks[p].mu.length || c.marks[p].po);
eq(others, [], '其余宫无刑墓迫');

// 交节时刻（与寿星万年历相差一分钟内）
const at = (n, y) => QM.TERMS.find(t => t.n === n && new Date(t.t).getFullYear() === y);
eq(Math.abs(at('立冬', 2026).t - Date.UTC(2026, 10, 7, 9, 52)) <= 2 * 60000, true, '2026 立冬 ≈ 11-07 17:52 北京时间');

// 年份范围两端能排、年月柱换得对
eq(QM.computeChart(new Date(1900, 0, 1, 12, 0)).pillars.year, '己亥', '1900-01-01 年柱（立春前）');
eq(QM.computeChart(new Date(1900, 0, 31, 12, 0)).pillars.day, '甲辰', '1900-01-31 日柱');
eq(QM.computeChart(new Date(2100, 11, 31, 12, 0)) !== null, true, '2100 年底可排');
eq(QM.computeChart(new Date(1899, 0, 1)), null, '1899 年初超出范围');

// 每个时辰都能排，九宫齐全
for (let t = Date.UTC(1900, 1, 1); t < Date.UTC(2100, 11, 1); t += 7.13 * 3600e3 * 97) {
  const k = QM.computeChart(new Date(t));
  const ok = k && [1, 2, 3, 4, 6, 7, 8, 9].every(p => k.sky[p] && k.doors[p] && k.gods[p] && k.diGods[p] && k.hidden[p]);
  if (!ok) { bad++; console.log('✗ 排不全', new Date(t).toISOString()); break; }
  QM.analyze(k);
}
// 真太阳时：东京经度，11-01 均时差约 +16.4 分，经度 +18.8 分
const so = QM.computeChart(new Date(2026, 10, 1, 1, 57), null, { solarLon: 139.69 }).solar;
eq(Math.round(so.shift), 35, '真太阳时校正（东京 11-01）');
// 子时换日：钟点 22:50、东京真太阳时已过 23:00 → 日柱换到次日
const z = QM.computeChart(new Date(2026, 10, 1, 22, 50), null, { solarLon: 139.69 });
eq([z.pillars.day, z.pillars.hour], ['庚辰', '丙子'], '真太阳时过子换日');
eq(QM.computeChart(new Date(2026, 10, 1, 22, 50)).pillars.day, '己卯', '钟点未过子不换日');
// 年命：1990 庚午，命干庚，天盘落离九
const mg = QM.computeChart(new Date(2026, 10, 1, 1, 57), null, { mingYear: 1990 }).ming;
eq([mg.gz, mg.stem, mg.skyP], ['庚午', '庚', [9]], '年命');
eq(QM.computeChart(new Date(2026, 10, 1, 1, 57), null, { mingYear: 1984 }).ming.stem, '戊', '甲子年命遁戊');
// 旺衰：戌月土令
const w = QM.computeChart(new Date(2026, 10, 1, 1, 57)).ws;
eq([w.ling, w.door[6], w.door[7], w.star[7], w.star[2], w.stem['庚']], ['戌土', '旺', '死', '旺', '废', '相'], '旺衰');
// 择时：七日内逐时辰，只收大吉格
const zs = QM.findHours(new Date(2026, 10, 1, 1, 57), 7, {});
eq(zs.length > 0 && zs.every(x => x.ji.length && x.end - x.start === 7200e3), true, '择时结果');
eq(zs[0].start.getHours() % 2, 1, '择时从单数钟点起');

console.log(bad ? `✗ ${bad} 处不符` : '✓ 全部相符');
process.exit(bad ? 1 : 0);
