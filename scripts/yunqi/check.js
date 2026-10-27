// 核对 static/yunqi/yunqi.js 与经典运气表：node scripts/yunqi/check.js
// 时区按北京时间算节气：TZ=Asia/Shanghai node scripts/yunqi/check.js
const assert = require('assert');
const Y = require('../../static/yunqi/yunqi.js');

const all = [...Array(60)].map((_, i) => Y.gzFromIdx(i));
const pick = k => all.filter(g => Y.tags(g.gan, g.zhi).some(t => t.k === k)).map(g => g.name).sort();
const same = (a, b, what) => assert.deepStrictEqual([...a].sort(), [...b].sort(), what);

// 司天在泉
const st = { 子: ['少阴君火', '阳明燥金'], 丑: ['太阴湿土', '太阳寒水'], 寅: ['少阳相火', '厥阴风木'],
  卯: ['阳明燥金', '少阴君火'], 辰: ['太阳寒水', '太阴湿土'], 巳: ['厥阴风木', '少阳相火'] };
[...Y.ZHI].forEach((z, i) => {
  const [a, b] = st[Y.ZHI[i % 6]];
  const kq = Y.keqi(i);
  assert.strictEqual(Y.QI[kq[2]].name, a, z + '司天');
  assert.strictEqual(Y.QI[kq[5]].name, b, z + '在泉');
});
// 子午年客气六步
assert.deepStrictEqual(Y.keqi(0).map(k => Y.QI[k].short), ['太阳', '厥阴', '少阴', '太阴', '少阳', '阳明']);
// 天符十二、岁会八、太乙天符四、同天符六、同岁会六
same([...pick('tianfu'), ...pick('taiyi')], ['己丑', '己未', '戊寅', '戊申', '戊子', '戊午', '乙卯', '乙酉', '丁巳', '丁亥', '丙辰', '丙戌'], '天符');
same([...pick('suihui'), ...pick('taiyi')], ['甲辰', '甲戌', '己丑', '己未', '乙酉', '丁卯', '戊午', '丙子'], '岁会');
same(pick('taiyi'), ['戊午', '乙酉', '己丑', '己未'], '太乙天符');
same(pick('tongtianfu'), ['甲辰', '甲戌', '庚子', '庚午', '壬寅', '壬申'], '同天符');
same(pick('tongsuihui'), ['辛丑', '辛未', '癸卯', '癸酉', '癸巳', '癸亥'], '同岁会');
same(pick('ping'), ['戊辰', '戊戌', '庚子', '庚午', '庚寅', '庚申', '乙卯', '乙酉', '丁巳', '丁亥', '己丑', '己未', '丁卯', '辛亥', '癸巳'], '平气');
// 主运初运：壬癸甲乙丙太角，丁戊己庚辛少角
[...Y.GAN].forEach((g, i) => assert.strictEqual(Y.zhuyun(i)[0].name, '壬癸甲乙丙'.includes(g) ? '太角' : '少角', g + '主运'));
// 甲子年：太宫 少商 太羽 太角 少徵（《六元正纪大论》）
assert.deepStrictEqual(Y.keyun(0).map(u => u.name), ['太宫', '少商', '太羽', '太角', '少徵']);
assert.deepStrictEqual(Y.zhuyun(0).map(u => u.name), ['太角', '少徵', '太宫', '少商', '太羽']);
// 近年
const yr = y => { const r = Y.year(y); return `${r.gz.name} ${r.yun.name} ${Y.QI[r.sitian].name}司天 ${Y.QI[r.zaiquan].name}在泉`; };
assert.strictEqual(yr(2024), '甲辰 土运太过 太阳寒水司天 太阴湿土在泉');
assert.strictEqual(yr(2025), '乙巳 金运不及 厥阴风木司天 少阳相火在泉');
assert.strictEqual(yr(2026), '丙午 水运太过 少阴君火司天 阳明燥金在泉');
// 大寒交年
const a = Y.at(new Date(2026, 0, 10)), b = Y.at(new Date(2026, 0, 25)), c = Y.at(new Date(2026, 9, 27));
assert.strictEqual(a.year.gz.name, '乙巳'); assert.strictEqual(a.step, 5);
assert.strictEqual(b.year.gz.name, '丙午'); assert.strictEqual(b.step, 0);
assert.strictEqual(c.step, 4); assert.strictEqual(Y.QI[c.year.steps[4].ke].name, '少阳相火');

for (const y of [2024, 2025, 2026, 2027]) {
  const r = Y.year(y), f = d => d.toISOString().slice(0, 16);
  console.log(yr(y), '|', r.tags.map(t => t.name).join(' '), '|', r.rel.name);
  console.log('  六气', r.steps.map(s => `${s.term}${f(s.at)}`).join(' '));
  console.log('  五运', r.zhuyun.map(s => `${s.name}/${r.keyun[s === r.zhuyun[0] ? 0 : r.zhuyun.indexOf(s)].name} ${f(s.at)}`).join(' '));
}
console.log('全部核对通过');
