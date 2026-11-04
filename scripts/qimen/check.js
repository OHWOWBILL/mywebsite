// 奇门手记排盘自检：node scripts/qimen/check.js（用 TZ=Asia/Tokyo 跑，与样盘同一时区）
// 样盘取自一款专业时家奇门 App 的截图（2026-11-01 01:57，阴遁五局拆补），逐宫对照。
// 文末「定局流派」一段：置闰对照 atopx/qimen 的十六张置闰样盘与 arc119226/qimen_dunjia 所录算例，
// 茅山对照 ChesterRa/mingpan 的样盘与 deminzhang/qimen-go 的定义；那一段按北京时间跑。
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

// 用神：样盘求财，生门、戊同落乾六；日干己在坤二，坤土生乾金 → 日干生之
const ys = QM.yongshen(c, '求财');
eq(ys.map(y => [y.name, y.ps]), [['生门', [6]], ['戊', [6]], ['日干', [2]], ['时干', [8]]], '求财用神落宫');
eq(ys[0].rel, ['日干生之'], '用神宫与日干宫生克');
eq(QM.yongshen(c, '婚姻').map(y => y.ps), [[8], [9], [9], [2]], '婚姻用神（乙、庚、六合、日干）');
// 应期：乾六（戌亥）临马、时空戌亥；戊入墓（墓戌）待辰日冲
const yq = QM.yingqi(c, 6, '戊');
eq(yq.speed, ['临马主速'], '应期快慢');
eq(yq.items.map(i => i.why + ':' + i.branches.join('')), ['落宫地支、时空填实:戌亥', '时空冲空:辰巳', '冲马:巳', '戊入墓待冲:辰'], '应期条目');
const fmtD = d => `${d.getMonth() + 1}-${d.getDate()}`;
eq(yq.items[0].days[0].dates.map(fmtD), ['11-8', '11-20'], '戌日（2026-11-08 丙戌）');

/* ================= 定局流派 =================
   拆补（默认）一字不动；置闰、茅山只换「用哪一气、哪一元」。 */
const plain = QM.computeChart(new Date(2026, 10, 1, 1, 57));
eq(JSON.stringify(QM.computeChart(new Date(2026, 10, 1, 1, 57), null, { school: 'chaibu' })), JSON.stringify(plain), '传 chaibu 与不传相同');
eq(['school', 'schoolName', 'juTerm', 'leap', 'chao', 'shichen'].filter(k => k in plain), [], '拆补盘不多带流派字段');
// 样盘同一刻三家：拆补 霜降上元阴五；置闰 符头己卯先到（立冬 11-07 交，超神六日）用立冬上元阴六；茅山 交节后第 101 时辰为中元阴八
const s3 = [undefined, 'zhirun', 'maoshan'].map(s => QM.computeChart(new Date(2026, 10, 1, 1, 57), null, { school: s }));
eq(s3.map(k => [k.juTerm || k.term, k.yuan, k.dun + k.ju]), [['霜降', '上元', '阴遁5'], ['立冬', '上元', '阴遁6'], ['霜降', '中元', '阴遁8']], '样盘一刻三家定局');
eq([s3[1].chaoName, s3[1].chao, s3[2].shichen], ['超神', 6, 100], '置闰超神日数 / 茅山时辰数');
eq(s3.every(k => Array.isArray(QM.analyze(k)) && QM.verdict(k, '求财').lines.length === 4 && QM.palaceDetail(k, 6).rows.length > 4), true, '格局、断语、宫位详解三家都能算');
eq(QM.findHours(new Date(2026, 10, 1, 1, 57), 2, { school: 'zhirun' }).every(x => x.ji.length), true, '择时按流派起盘');
// 1900–2100 两端与全程都能排（含真太阳时）
{
  let n = 0, fail = null;
  const ends = [QM.RANGE.min, QM.RANGE.max];
  for (let t = QM.RANGE.min; t <= QM.RANGE.max; t += 6.37 * 86400e3) ends.push(t);
  for (const t of ends) for (const o of [{ school: 'zhirun' }, { school: 'maoshan' }, { school: 'zhirun', solarLon: 87.6 }, { school: 'maoshan', solarLon: 139.69 }]) {
    const k = QM.computeChart(new Date(t), null, o); n++;
    if (!k || !(k.ju >= 1 && k.ju <= 9) || !k.juTerm || (o.school === 'zhirun' ? typeof k.leap !== 'boolean' : !(k.shichen >= 0))) { fail = new Date(t).toISOString() + ' ' + JSON.stringify(o); break; }
  }
  eq(fail, null, `两家全程可排（${n} 盘）`);
}

// —— 置闰：对照两份开源实现 ——
// ① atopx/qimen（MIT，Go）qimen_golden_test.go @20ba0d5：「authoritative chart transcribed from reference paipan
//   software output」，时家转盘置闰，北京时间。逐宫比 天盘干 地盘干 暗干 星 门 神（星门神取首字）；
//   值符值使落中五的，本站寄坤二。下面一段换到北京时间跑，跑完换回。
// ② arc119226/qimen_dunjia（MIT，JS）README @c8070be：2024-06-15 12:00 符头法「夏至上元 陰遁9局」；
//   其 test.js 所录《奇门法窍》〈论拆局补局〉两则逐日算例。
// 两家的规则一致：二至由交节日前 0–7 日的上元符头统领，8 日以上（古书含头计「超九日」）则芒种 / 大雪闰。
const TZ0 = process.env.TZ;
process.env.TZ = 'Asia/Shanghai';
const ZR = { school: 'zhirun' };
const bj = (s, h = 12, mi = 0) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, h, mi); };
const GOLD = [   // [时刻, 四柱, 遁局, 值符 落宫, 值使 落宫, 坎一…离九每宫六字]
  ['2026-02-18 22:59', '丙午 庚寅 癸亥 癸亥', '阳2', '天柱7', '惊7', '乙乙乙蓬休阴 戊戊戊芮死天 己己己冲伤虎 庚庚庚辅杜玄 辛辛辛--- 壬壬壬心开蛇 癸癸癸柱惊符 丁丁丁任生合 丙丙丙英景地'],
  ['2026-02-18 23:00', '丙午 庚寅 甲子 甲子', '阳9', '天英9', '景9', '己己己蓬休虎 庚庚庚芮死蛇 辛辛辛冲伤地 壬壬壬辅杜天 癸癸癸--- 丁丁丁心开合 丙丙丙柱惊阴 乙乙乙任生玄 戊戊戊英景符'],
  ['2026-01-14 18:45', '乙巳 己丑 戊子 辛酉', '阳8', '天辅2', '杜2', '乙庚乙柱惊合 癸辛癸辅杜符 庚壬庚蓬休玄 戊癸戊任生地 丁丁丁--- 辛丙辛芮死阴 己乙己英景蛇 丙戊丙心开虎 壬己壬冲伤天'],
  ['2026-01-05 13:00', '乙巳 戊子 己卯 辛未', '阳2', '天芮2', '死9', '乙乙丁蓬生合 戊戊癸芮惊符 己己庚冲杜玄 庚庚丙辅景地 辛辛辛--- 壬壬乙心休阴 癸癸壬柱开蛇 丁丁己任伤虎 丙丙戊英死天'],
  ['2026-03-02 18:30', '丙午 庚寅 乙亥 乙酉', '阳3', '天禽2', '死6', '丙丙壬蓬惊合 乙乙己芮杜符 戊戊丙冲休玄 己己癸辅生地 庚庚庚--- 辛辛乙心死阴 壬壬丁柱景蛇 癸癸辛任开虎 丁丁戊英伤天'],
  ['2026-10-31 12:02', '丙午 戊戌 戊寅 戊午', '阴2', '天心2', '开2', '乙己乙冲伤玄 癸戊癸心开符 庚乙庚英景合 戊丙戊芮死阴 丁丁丁--- 辛癸辛任生地 己壬己蓬休天 丙辛丙辅杜虎 壬庚壬柱惊蛇'],
  ['2024-12-06 12:00', '甲辰 乙亥 甲辰 庚午', '阴1', '天蓬8', '休4', '壬戊乙心死蛇 己乙丙英伤虎 庚丙壬任开天 丙丁戊冲休地 癸癸癸--- 辛壬己柱景阴 乙辛丁芮杜合 戊庚辛蓬惊符 丁己庚辅生玄'],
  ['2026-02-03 23:30', '乙巳 己丑 己酉 甲子', '阳8', '天任8', '生8', '庚庚庚蓬休天 辛辛辛芮死虎 壬壬壬冲伤蛇 癸癸癸辅杜阴 丁丁丁--- 丙丙丙心开地 乙乙乙柱惊玄 戊戊戊任生符 己己己英景合'],
  ['2024-12-31 12:00', '甲辰 丙子 己巳 庚午', '阳7', '天柱9', '惊4', '癸辛丁冲杜虎 乙壬辛心休蛇 庚癸壬英死地 壬丁戊芮惊天 丙丙丙--- 己乙癸任伤合 辛戊己蓬生阴 丁己庚辅景玄 戊庚乙柱开符'],
  ['2024-12-21 12:00', '甲辰 丙子 己未 庚午', '阴1', '天蓬8', '休4', '壬戊乙心死蛇 己乙丙英伤虎 庚丙壬任开天 丙丁戊冲休地 癸癸癸--- 辛壬己柱景阴 乙辛丁芮杜合 戊庚辛蓬惊符 丁己庚辅生玄'],
  ['2024-12-28 12:00', '甲辰 丙子 丙寅 甲午', '阳1', '天辅4', '杜4', '戊戊戊蓬休玄 己己己芮死阴 庚庚庚冲伤天 辛辛辛辅杜符 壬壬壬--- 癸癸癸心开虎 丁丁丁柱惊合 丙丙丙任生地 乙乙乙英景蛇'],
  ['2033-06-14 12:00', '癸丑 戊午 丙申 甲午', '阳6', '天英9', '景9', '壬壬壬蓬休虎 癸癸癸芮死蛇 丁丁丁冲伤地 丙丙丙辅杜天 乙乙乙--- 戊戊戊心开合 己己己柱惊阴 庚庚庚任生玄 辛辛辛英景符'],
  ['2027-12-18 12:00', '丁未 壬子 辛未 甲午', '阴7', '天辅4', '杜4', '丁丁丁蓬休合 癸癸癸芮死地 壬壬壬冲伤蛇 辛辛辛辅杜符 庚庚庚--- 己己己心开虎 戊戊戊柱惊玄 乙乙乙任生阴 丙丙丙英景天'],
  ['1995-12-15 12:00', '乙亥 戊子 庚辰 壬午', '阴4', '天冲9', '伤4', '丁辛丙柱开虎 戊庚壬辅景天 辛己癸蓬生阴 癸戊己任伤蛇 乙乙乙--- 庚丙丁芮惊玄 壬丁庚英死地 丙癸辛心休合 己壬戊冲杜符'],
  ['2024-12-10 04:00', '甲辰 丙子 戊申 甲寅', '阴1', '天禽2', '死2', '戊戊戊蓬休玄 乙乙乙芮死符 丙丙丙冲伤合 丁丁丁辅杜阴 癸癸癸--- 壬壬壬心开地 辛辛辛柱惊天 庚庚庚任生虎 己己己英景蛇'],
  ['2024-12-25 12:00', '甲辰 丙子 癸亥 戊午', '阴1', '天禽1', '死1', '乙戊乙芮死符 丙乙丙冲伤合 壬丙壬心开地 戊丁戊蓬休玄 癸癸癸--- 己壬己英景蛇 丁辛丁辅杜阴 辛庚辛柱惊天 庚己庚任生虎']
];
const ab = s => s.replace(/^天/, '').replace(/门$/, '');
const GOD1 = { 值符: '符', 腾蛇: '蛇', 太阴: '阴', 六合: '合', 白虎: '虎', 玄武: '玄', 九地: '地', 九天: '天' };
for (const [when, pil, ju, zf, zs, pal] of GOLD) {
  const [d, hm] = when.split(' '), [h, mi] = hm.split(':').map(Number);
  const k = QM.computeChart(bj(d, h, mi), null, ZR), p6 = pal.split(' ');
  const got = [Object.values(k.pillars).join(' '), k.dun[0] + k.ju, k.zhifuStar + k.zfPalace, ab(k.zhishiDoor) + k.zhishiPalace];
  for (let p = 1; p <= 9; p++) {
    got.push(p === 5 ? k.earth[5] + k.earth[5] + k.hidden[5] + '---'
      : k.sky[p].stems[0] + k.earth[p] + k.hidden[p] + ab(k.sky[p].star) + ab(k.doors[p]) + GOD1[k.gods[p]]);
  }
  eq(got, [pil, ju, zf, zs].concat(p6), '置闰样盘 ' + when);
}
// atopx qimen_test.go TestJuRule：2024-01-01 12:00 符头先于小寒（01-06），置闰用小寒二局，拆补仍冬至一局
const j1 = QM.computeChart(bj('2024-01-01'), null, ZR);
eq([j1.term, j1.juTerm, j1.ju, j1.chaoName, QM.computeChart(bj('2024-01-01')).ju], ['冬至', '小寒', 2, '超神', 1], '置闰超神（2024-01-01）');
// 芒种 / 大雪前后拆补与置闰分道的日子：[日期, 置闰, 拆补]
//   2024-06-15 见 arc README（超神七日不闰，夏至上元）；2024-12-06、12-25 即上面 atopx 样盘；
//   1995、2027、2033 三年取 atopx 闰奇样盘（1995-12-15 闰大雪上元第 2 天、2027-12-18 闰大雪中元第 3 天、
//   2033-06-14 闰芒种上元第 3 天）同一循环里交过二至之后的日子：闰奇循环十五日、五日一元，两家实现同此。
const SPLIT = [
  ['2024-06-15', '夏至上元 阴遁9', '芒种上元 阳遁6'],
  ['2024-12-06', '大雪下元 阴遁1', '小雪下元 阴遁2'],
  ['2024-12-25', '闰大雪下元 阴遁1', '冬至下元 阳遁4'],
  ['1995-12-23', '闰大雪中元 阴遁7', '冬至中元 阳遁7'],
  ['1995-12-26', '闰大雪下元 阴遁1', '冬至下元 阳遁4'],
  ['2027-12-24', '闰大雪下元 阴遁1', '冬至下元 阳遁4'],
  ['2033-06-21', '闰芒种中元 阳遁3', '夏至中元 阴遁3'],
  ['2033-06-24', '闰芒种下元 阳遁9', '夏至下元 阴遁6']
];
for (const [d, wz, wc] of SPLIT) {
  const z = QM.computeChart(bj(d), null, ZR), c0 = QM.computeChart(bj(d));
  eq([(z.leap ? '闰' : '') + z.juTerm + z.yuan + ' ' + z.dun + z.ju, c0.term + c0.yuan + ' ' + c0.dun + c0.ju], [wz, wc], '置闰 / 拆补 ' + d);
}
// 闰奇过完次日换二至上元（接气）
eq(['1995-12-29', '2027-12-26', '2033-06-27'].map(d => { const z = QM.computeChart(bj(d), null, ZR); return z.juTerm + z.yuan + (z.leap ? '闰' : '') + z.chaoName; }),
  ['冬至上元接气', '冬至上元接气', '夏至上元接气'], '闰奇之后接气');
// 《奇门法窍》〈论拆局补局〉两则（干支序列见 arc test.js FA_QIAO_JU_CASES；1974 立春交于丙子日、1962 白露交于己酉日）
//   一：「先年大寒下元…甲戌下局之符头统领…己卯…立春上元；甲申…立春中元；己丑…立春下局」——节先符后，接气
//   二：「甲午…处暑上局；己亥…处暑中局；甲辰…处暑下局；己酉…白露」——符与节同日（日粒度）
const faqiao = (y, m, d0, want) => {
  const seen = {};
  for (let k = 0; k < 30; k++) {
    const z = QM.computeChart(new Date(y, m - 1, d0 + k, 12), null, ZR);
    if (want[z.pillars.day]) seen[z.pillars.day] = z.juTerm + z.yuan;
  }
  return seen;
};
const FQ1 = { 丙子: '大寒下元', 丁丑: '大寒下元', 戊寅: '大寒下元', 己卯: '立春上元', 甲申: '立春中元', 己丑: '立春下元' };
const FQ2 = { 甲午: '处暑上元', 己亥: '处暑中元', 甲辰: '处暑下元', 己酉: '白露上元' };
eq(faqiao(1974, 2, 1, FQ1), FQ1, '《法窍》例一（1974 立春接气）');
eq(faqiao(1962, 8, 20, FQ2), FQ2, '《法窍》例二（1962 白露）');
eq(QM.computeChart(new Date(QM.TERMS.find(t => t.n === '立春' && new Date(t.t).getFullYear() === 1974).t)).pillars.day, '丙子', '1974 立春交于丙子日');
// 整条符头链（1900–2100）：闰只落芒种、大雪，节气一个不漏；闰约 2.86 年一次（arc README：1800–2100 每 2.87 年一闰）
{
  const NM = ['冬至', '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪'];
  let prev = null, leaps = [], badStep = 0, lo = 99, hi = -99, sol = [];
  let t = new Date(1900, 0, 10, 12); while (QM.computeChart(t).idx.day % 15) t = new Date(t.getTime() + 86400e3);
  for (; t < new Date(2100, 11, 20); t = new Date(t.getTime() + 15 * 86400e3)) {
    const z = QM.computeChart(t, null, ZR), i = NM.indexOf(z.juTerm);
    if (prev != null) {
      const adv = (i - prev + 24) % 24;
      if (z.leap ? adv !== 0 || !/芒种|大雪/.test(z.juTerm) : adv !== 1) badStep++;
    }
    if (z.leap) leaps.push(t.getFullYear() + z.juTerm); else { lo = Math.min(lo, z.chao); hi = Math.max(hi, z.chao); }
    if (/冬至|夏至/.test(z.juTerm)) sol.push(z.chao);
    prev = i;
  }
  eq([badStep, leaps.length, lo >= -9 && hi <= 11, Math.min(...sol) >= -7 && Math.max(...sol) <= 7], [0, 70, true, true], '符头链 1900–2100（闰 70 次）');
  eq(['1995大雪', '2024大雪', '2027大雪', '2033芒种'].every(x => leaps.includes(x)) && !leaps.includes('2024芒种'), true, '闰年对得上样盘');
}
process.env.TZ = TZ0;

// —— 茅山：不论符头，交节所在时辰起，上元、中元各六十时辰，下元用到下一节气 ——
// ChesterRa/mingpan（Apache-2.0）test/__snapshots__/qimen.test.ts.snap @0c55bc5「時盤轉盤茅山 2024-2-4 14時」：
//   大寒下元阳遁六局（拆补为大寒上元阳三），旬首甲寅，值符天芮、值使死门同落兑七；逐宫 天盘干 地盘干 星 门 神
//   （快照把玄武记作「武」，这里统一写「玄」）
process.env.TZ = 'Asia/Shanghai';
const MS = { school: 'maoshan' };
const ms1 = QM.computeChart(bj('2024-02-04', 14), null, MS);
const MS_WANT = '戊壬心开阴 辛癸英景天 庚丁任生虎 丁丙冲伤玄 - 己戊柱惊蛇 癸己芮死符 壬庚蓬休合 丙辛辅杜地'.split(' ');
eq([ms1.term, ms1.yuan, ms1.dun + ms1.ju, ms1.zhifuStar + ms1.zfPalace, ms1.zhishiDoor + ms1.zhishiPalace, ms1.kong.join(''), QM.computeChart(bj('2024-02-04', 14)).ju],
  ['大寒', '下元', '阳遁6', '天芮7', '死门7', '子丑', 3], '茅山样盘（mingpan 2024-02-04 14 时）');
eq([1, 2, 3, 4, 5, 6, 7, 8, 9].map(p => p === 5 ? '-' : ms1.sky[p].stems[0] + ms1.earth[p] + ab(ms1.sky[p].star) + ab(ms1.doors[p]) + GOD1[ms1.gods[p]]), MS_WANT, '茅山样盘逐宫');
// 时辰对齐（deminzhang/qimen-go @4673761 QMJuTypeMaoShan「节气开始上元60时辰,中元60时辰,再下元60时辰,下元满60时辰不到下个节气继用下元」，
// 从交节所在时辰起数）：2024 大寒 01-20 22:07 交，亥时（21 点）起数
const msAt = (d, h, mi) => { const k = QM.computeChart(bj(d, h, mi), null, MS); return k.term + k.yuan + k.ju; };
eq([msAt('2024-01-20', 22, 30), msAt('2024-01-25', 20, 59), msAt('2024-01-25', 21, 0), msAt('2024-01-30', 20, 59), msAt('2024-01-30', 21, 0)],
  ['大寒上元3', '大寒上元3', '大寒中元9', '大寒中元9', '大寒下元6'], '茅山上中下元以六十时辰为界');
// 节气长过一百八十时辰：2024 芒种 06-05 08:10 交、夏至 06-21 04:51 交，06-20 仍用芒种下元
eq([msAt('2024-06-20', 12, 0), msAt('2024-06-21', 5, 0)], ['芒种下元9', '夏至上元9'], '茅山下元续用到下一节气');
process.env.TZ = TZ0;

console.log(bad ? `✗ ${bad} 处不符` : '✓ 全部相符');
process.exit(bad ? 1 : 0);
