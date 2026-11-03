// 合盘核心自检：TZ=Asia/Tokyo node scripts/hepan/check.js
// 一、地支、天干关系表逐对核对，并与本库八字 relations() 的结果一一对照；
// 二、纳音、五行互补、命卦（东西四命与游年）；
// 三、星盘：容许度边界；取节气时刻出生的两人（太阳黄经已知：春分 0°、小满 60°、夏至 90°、大暑 120°、秋分 180°）验交叉相位；
// 四、样例合盘（东京甲、大阪乙）整体跑通，结果不随本机时区而变。
const HP = require('../../static/hepan/hepan.js');
const BZ = require('../../static/bazi/bazi.js');
const XP = require('../../static/xingpan/xingpan.js');
const KY = require('../../static/kanyu/kanyu.js');
const J = require('../../static/qimen/jieqi.js');

let bad = 0, ok = 0;
const eq = (a, b, what) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '得', JSON.stringify(a), '应', JSON.stringify(b)); }
  else { ok++; console.log('✓', what); }
};
const Z = s => BZ.ZHI.indexOf(s), G = s => BZ.GAN.indexOf(s);
const zr = (a, b) => HP.zhiRel(Z(a), Z(b));

// —— 一、地支 ——
eq([zr('子', '丑').main, zr('子', '丑').hua], ['六合', '土'], '子丑六合（化土）');
eq(zr('子', '午').main, '六冲', '子午冲');
eq(['寅午', '午戌', '寅戌'].map(p => [zr(p[0], p[1]).main, zr(p[0], p[1]).group]), [['三合', '寅午戌火局'], ['三合', '寅午戌火局'], ['三合', '寅午戌火局']], '寅午戌三合（两两皆算）');
eq([zr('子', '卯').main, zr('子', '卯').xing], ['相刑', '子卯无礼之刑'], '子卯刑');
eq(zr('子', '未').main, '相害', '子未害');
eq(zr('子', '酉').main, '相破', '子酉破');
eq([zr('子', '子').main, zr('子', '子').tone], ['同属', 'mid'], '子子同属（平）');
eq([zr('辰', '辰').word, zr('辰', '辰').types, zr('辰', '辰').tone], ['自刑', ['相刑', '同属'], 'bad'], '辰辰同属而自刑');
eq([zr('子', '寅').main, zr('子', '寅').tone], ['无', 'mid'], '子寅无关系');
eq([zr('巳', '申').types, zr('巳', '申').main, zr('巳', '申').tone], [['六合', '相刑', '相破'], '六合', 'good'], '巳申合中带刑破，取六合为主');
eq([zr('寅', '申').types, zr('寅', '申').main], [['六冲', '相刑'], '六冲'], '寅申冲而兼刑，取冲');
eq(zr('寅', '亥').types, ['六合', '相破'], '寅亥合而带破');
eq([zr('寅', '巳').types, zr('未', '戌').types], [['相刑', '相害'], ['相刑', '相破']], '寅巳刑害、未戌刑破');
// 各类对数（不同两支 66 对）
const cnt = {};
for (let a = 0; a < 12; a++) for (let b = a + 1; b < 12; b++) HP.zhiRel(a, b).types.forEach(t => { cnt[t] = (cnt[t] || 0) + 1; });
eq(['六合', '三合', '六冲', '相刑', '相害', '相破'].map(t => cnt[t]), [6, 12, 6, 7, 6, 6], '六合 6、三合 12、六冲 6、相刑 7、相害 6、相破 6 对');
eq([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(z => HP.zhiRel(z, z).word === '自刑').map(z => BZ.ZHI[z]).join(''), '辰午酉亥', '自刑只辰午酉亥');
// 对称
let sym = true;
for (let a = 0; a < 12; a++) for (let b = 0; b < 12; b++) if (JSON.stringify(HP.zhiRel(a, b).types) !== JSON.stringify(HP.zhiRel(b, a).types)) sym = false;
eq(sym, true, '地支关系两两对称（144 对）');
// 与八字 relations() 对照：六合↔六合、半合/拱↔三合、冲、刑（含自刑）、害、破
const BZTYPE = r => r.type === '合' ? (/六合/.test(r.text) ? '六合' : '三合') : { 冲: '六冲', 刑: '相刑', 害: '相害', 破: '相破' }[r.type];
let agree = 0, diff = [];
for (let a = 0; a < 12; a++) for (let b = 0; b < 12; b++) {
  const want = BZ.relations([{ gan: 0, zhi: a, label: '甲' }, { gan: 0, zhi: b, label: '乙' }]).map(BZTYPE).sort().join(',');
  const got = HP.zhiRel(a, b).types.filter(t => t !== '同属').sort().join(',');
  if (want === got) agree++; else diff.push(BZ.ZHI[a] + BZ.ZHI[b] + ' ' + got + ' / ' + want);
}
eq([agree, diff.slice(0, 3)], [144, []], '地支关系与八字 relations() 一一相合');

// —— 天干 ——
const gr = (a, b) => HP.ganRel(G(a), G(b));
eq(['甲己', '乙庚', '丙辛', '丁壬', '戊癸'].map(p => gr(p[0], p[1]).main + gr(p[0], p[1]).hua), ['五合土', '五合金', '五合水', '五合木', '五合火'], '天干五合：甲己土 乙庚金 丙辛水 丁壬木 戊癸火');
let nHe = 0, nChong = 0;
for (let a = 0; a < 10; a++) for (let b = a + 1; b < 10; b++) { const m = HP.ganRel(a, b).main; if (m === '五合') nHe++; if (m === '相冲') nChong++; }
eq([nHe, nChong], [5, 4], '五合恰五对，相冲恰四对');
eq(['甲庚', '乙辛', '丙壬', '丁癸'].map(p => gr(p[0], p[1]).main), ['相冲', '相冲', '相冲', '相冲'], '天干相冲：甲庚 乙辛 丙壬 丁癸');
eq([gr('甲', '甲').main, gr('甲', '乙').main, gr('甲', '丙').main + gr('甲', '丙').from, gr('丙', '甲').from, gr('甲', '戊').main + gr('甲', '戊').from],
  ['同干', '比和', '相生a', 'b', '相克a'], '其余：同干、比和、相生、相克（含方向）');
eq([gr('甲', '己').ssA, gr('甲', '己').ssB], ['正财', '正官'], '甲见己为正财、己见甲为正官');
let gAgree = 0;
for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) {
  const want = BZ.relations([{ gan: a, zhi: 0, label: '甲' }, { gan: b, zhi: 1, label: '乙' }]).filter(r => /干/.test(r.text)).map(r => r.type).join(',');
  const m = HP.ganRel(a, b).main, got = m === '五合' ? '合' : m === '相冲' ? '冲' : '';
  if (want === got) gAgree++;
}
eq(gAgree, 100, '天干合冲与八字 relations() 一一相合');

// —— 二、纳音 ——
eq([BZ.nayin(0), HP.nayinWx(0)], ['海中金', 3], '甲子海中金，属金');
eq(Array.from({ length: 60 }, (_, i) => HP.nayinWx(i) >= 0).every(Boolean), true, '六十甲子纳音皆可取五行');
eq([HP.nayinRel(2, 3).main + HP.nayinRel(2, 3).from, HP.nayinRel(3, 0).main + HP.nayinRel(3, 0).from, HP.nayinRel(4, 4).main, HP.nayinRel(0, 3).from],
  ['相生a', '相克a', '比和', 'b'], '纳音：土生金、金克木、水水比和、木被金克');

// —— 五行互补 ——
const E = w => HP.extremes(w);
eq(HP.wxBu(E([1.3, 2, 1.3, 2.3, 1.1]), E([0.4, 0.4, 1.3, 1.9, 4])), { main: '单补', tone: 'good', by: 'b' }, '甲弱水、乙水最旺：乙补甲（单补）');
eq(HP.wxBu(E([3, 1, 1, 1, 0.5]), E([0.2, 1, 1, 1, 3])).main, '互补', '甲旺木弱水、乙旺水弱木：互补');
eq(HP.wxBu(E([3, 1, 1, 2, 0.2]), E([1, 3, 1, 1, 0.1])).main, '同缺', '两人都弱水：同缺');
eq(HP.wxBu(E([3, 1, 0.5, 1, 1]), E([3, 0.5, 1, 1, 1])).main, '同旺', '两人都旺木：同旺');
eq(E([1, 2, 2, 0, 0]), { max: 2, min: 0, strong: [1, 2], weak: [3, 4] }, '并列最旺、最弱都算');

// —— 命卦 ——
const P1 = HP.person({ when: '1990-05-17T08:30', male: true, name: '甲', tz: 9, lon: 139.69, lat: 35.68 });
const P2 = HP.person({ when: '1992-11-03T21:15', male: false, name: '乙', tz: 9, lon: 135.5, lat: 34.69 });
eq([P1.gua.name, P1.gua.east, P2.gua.name, P2.gua.east], ['坎', true, '兑', false], '1990 男坎（东四）、1992 女兑（西四），与堪舆命卦同');
eq(HP.mingRel(P1.gua, P2.gua), { main: '异组', tone: 'bad', you: '祸害', luck: '凶', gloss: '主口角' }, '坎兑异组，游年祸害');
let mAll = true;
const GUA = [1, 2, 3, 4, 6, 7, 8, 9], east = g => [1, 3, 4, 9].includes(g);
for (const a of GUA) for (const b of GUA) {
  const r = HP.mingRel({ num: a, east: east(a) }, { num: b, east: east(b) }), r2 = HP.mingRel({ num: b, east: east(b) }, { num: a, east: east(a) });
  if ((r.main === '同组') !== (r.luck === '吉') || r.you !== r2.you) mAll = false;
}
eq(mAll, true, '八卦两两：同组即游年四吉，游年两向相同');
// 立春前生的算上一年：1990-02-03 生（立春 1990-02-04 10:14）
const pre = HP.person({ when: '1990-02-03T12:00', male: true, tz: 8 });
eq([pre.gy, pre.pillars[0].name, pre.gua.name], [1989, '己巳', KY.mingGua(1989, true).name], '立春前生，命卦按上一年（己巳）');

// —— 三、星盘：容许度 ——
const asp = s => { const m = HP.aspectOf(s); return m ? m.type.n : null; };
eq([0, 8, 8.01, 54.9, 55, 65, 65.1, 82.9, 83, 97, 113, 127, 127.1, 171.9, 172, 180, 45, 150].map(asp),
  ['合', '合', null, null, '六合', '六合', null, null, '刑', '刑', '拱', '拱', null, null, '冲', '冲', null, null], '容许度：合冲 8°，刑拱 7°，六合 5°');
eq(XP.ASPECTS.map(a => a.n + a.orb).join(' '), '合8 六合5 刑7 拱7 冲8', '用的是星盘那张相位表');
// 节气时刻出生：太阳黄经即节气度数
const termAt = (n, y) => J.terms.find(t => t.n === n && new Date(t.t).getUTCFullYear() === y).t;
const wall = (t, tz) => { const f = new Date(t + tz * 3600e3); const p = x => String(x).padStart(2, '0'); return `${f.getUTCFullYear()}-${p(f.getUTCMonth() + 1)}-${p(f.getUTCDate())}T${p(f.getUTCHours())}:${p(f.getUTCMinutes())}`; };
const born = (n, y, tz) => HP.person({ when: wall(termAt(n, y), tz), male: true, tz, lon: 116.4, lat: 39.9 });
const chun = born('春分', 2000, 8);
const near = (x, y, tol) => Math.abs(XP.mod(x - y + 180, 360) - 180) <= tol;
eq(near(chun.planets.sun, 0, 0.05), true, '2000 春分生：太阳在白羊 0°');
const sunSun = (X, Y) => HP.cross(X, Y).filter(x => x.a === 'sun' && x.b === 'sun').map(x => [x.type.n, x.key, x.orb < 0.1]);
eq(sunSun(chun, born('秋分', 2000, 8)), [['冲', '日日', true]], '春分生 × 秋分生：日日相冲（容许 < 0.1°）');
eq(sunSun(chun, born('夏至', 2000, -5)), [['刑', '日日', true]], '春分生 × 夏至生（纽约）：日日相刑');
eq(sunSun(chun, born('大暑', 1999, 9)), [['拱', '日日', true]], '春分生 × 大暑生（东京）：日日相拱');
eq(sunSun(chun, born('小满', 2001, 0)), [['六合', '日日', true]], '春分生 × 小满生（伦敦）：日日六合');
eq(sunSun(chun, born('春分', 1987, 8)), [['合', '日日', true]], '春分生 × 另一年春分生：日日相合');
eq(sunSun(chun, born('立夏', 2000, 8)), [], '春分生 × 立夏生（相距 45°）：日日无主要相位');
const autumn = born('秋分', 2000, 8);
const sig = list => list.map(x => [x.a, x.b, x.type.n, x.orb.toFixed(6)].join()).sort();
eq(sig(HP.cross(autumn, chun)), sig(HP.cross(chun, autumn).map(x => Object.assign({}, x, { a: x.b, b: x.a }))), '互换两人：交叉相位相同，只是甲乙对调');
eq(HP.cross(chun, autumn).every((x, i, l) => !i || l[i - 1].orb <= x.orb), true, '相位按紧密排序');

// —— 四、样例合盘 ——
const R = HP.compare(P1, P2);
eq(R.rows.map(r => r.label + r.word), ['生肖无', '日干比和', '日支六合', '纳音相生', '五行单补', '命卦异组'], '东京甲 × 大阪乙：八字六项');
eq([P1.pillars.map(p => p.name).join(' '), P2.pillars.map(p => p.name).join(' ')], ['庚午 辛巳 壬午 甲辰', '壬申 庚戌 癸未 癸亥'], '两人四柱');
eq(R.aspects.some(x => x.a === 'asc' && x.b === 'mars' && x.type.n === '合'), true, '两人都有时刻地点：带上升（甲上升合乙火星）');
eq(R.keys.map(k => k.key + k.type.n).sort(), ['日月刑', '日月刑', '月月合', '金火刑', '金金拱'].sort(), '要紧几对：日月刑×2、金火刑、金金拱、月月合');
eq(R.keys.every(k => k.meaning), true, '要紧几对都有白话');
eq(R.tally.good + R.tally.bad + R.tally.mid, R.rows.length + R.keys.length, '契合数 = 八字六项 + 要紧相位');
eq([R.verdict.pos, R.verdict.overall, R.verdict.neg[0]], [['日支相合', '纳音相生', '月亮同频'], '合多冲少', '日月相刑，节奏不同要互相迁就'], '总评取八字二、星盘一，提一条冲');
console.log('  总评：' + R.verdict.text);
// 生肖六合、日干五合的一对：1984 甲子年 × 1985 乙丑年
const Q1 = HP.person({ when: '1984-06-01T12:00', male: true, name: '甲', tz: 8 }), Q2 = HP.person({ when: '1985-06-01T12:00', male: false, name: '乙', tz: 8 });
const R2 = HP.compare(Q1, Q2);
eq([R2.rows[0].word, R2.verdict.pos.includes('生肖六合')], ['六合', true], '甲子年 × 乙丑年：生肖六合，进总评');
eq(R2.aspects.some(x => x.a === 'asc' || x.b === 'asc'), false, '缺纬度：不排上升');
// 时辰不详
const N = HP.person({ when: '1992-11-03T21:15', male: false, name: '乙', tz: 9, lon: 135.5, lat: 34.69 }, { noTime: true });
eq([N.asc, N.wx.reduce((s, x) => s + x, 0), N.C.clock.h], [null, 6, 12], '时辰不详：按正午排，不排上升，五行只计三柱（共 6）');
const RN = HP.compare(P1, N);
eq([RN.aspects.some(x => x.a === 'asc' || x.b === 'asc'), RN.aspects.filter(x => x.b === 'moon').every(x => x.approx)], [false, true], '时辰不详：一方无上升则两边都不排；月亮相位标「约」');
eq(HP.person({ when: '1899-05-01T12:00', tz: 8 }).error, '只合 1900–2100 年', '超出年限给出提示');
// —— 随机两千对：文字里不漏 undefined / NaN，计数自洽，相位两向对称，每种判语都出现过 ——
const CITY = require('../../static/fabao/cities.js').LIST;
let seed = 20261103;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const randBirth = () => {
  const t = Date.UTC(1901, 0, 1) + Math.floor(rnd() * (Date.UTC(2099, 11, 1) - Date.UTC(1901, 0, 1)));
  const c = CITY[Math.floor(rnd() * CITY.length)], f = new Date(t + c[3] * 3600e3), p = x => String(x).padStart(2, '0');
  return { b: { when: `${f.getUTCFullYear()}-${p(f.getUTCMonth() + 1)}-${p(f.getUTCDate())}T${p(f.getUTCHours())}:${p(f.getUTCMinutes())}`, male: rnd() < 0.5, name: '某' + Math.floor(rnd() * 100), tz: c[3], lon: c[1], lat: c[2] }, noTime: rnd() < 0.15 };
};
const seenWords = {}, fuzzBad = [];
for (let k = 0; k < 2000; k++) {
  const x = randBirth(), y = randBirth();
  const PX = HP.person(x.b, { noTime: x.noTime, name: '甲' }), PY = HP.person(y.b, { noTime: y.noTime, name: '乙' });
  const RR = HP.compare(PX, PY), s = HP.toText(RR) + RR.verdict.text;
  RR.rows.forEach(r => { seenWords[r.label + r.word] = 1; });
  const why = /undefined|NaN|null|\[object/.test(s) ? '文字有空值' :
    RR.tally.good + RR.tally.bad + RR.tally.mid !== 6 + RR.keys.length ? '计数不合' :
    !/——/.test(RR.verdict.text) ? '总评无结论' :
    RR.aspects.some(a => a.orb > a.type.orb + 1e-9) ? '超出容许度' :
    HP.cross(PY, PX).length !== RR.aspects.length ? '相位两向不对称' :
    (x.noTime || y.noTime) && RR.aspects.some(a => a.a === 'asc' || a.b === 'asc') ? '时辰不详却排了上升' : '';
  if (why) { fuzzBad.push(why + ' ' + x.b.when + ' / ' + y.b.when); if (fuzzBad.length > 3) break; }
}
eq(fuzzBad, [], '随机两千对：文字无空值、计数自洽、相位不超容许、两向对称');
const WANT = ['生肖六合', '生肖三合', '生肖六冲', '生肖相刑', '生肖自刑', '生肖相害', '生肖相破', '生肖同属', '生肖无',
  '日干五合', '日干相冲', '日干同干', '日干比和', '日干相生', '日干相克', '日支六合', '日支三合', '日支六冲', '日支相刑', '日支自刑', '日支相害', '日支相破', '日支同属', '日支无',
  '纳音相生', '纳音比和', '纳音相克', '五行互补', '五行单补', '五行同缺', '五行同旺', '五行不补', '命卦同组', '命卦异组'];
eq(WANT.filter(w => !seenWords[w]), [], '每种判语在随机样本里都出现过（' + WANT.length + ' 种）');
// 不随本机时区：换到纽约时区再算一遍，结果全同
const txt = HP.toText(R, ['东京', '大阪']);
process.env.TZ = 'America/New_York';
const R3 = HP.compare(HP.person(P1.b), HP.person(P2.b));
eq(HP.toText(R3, ['东京', '大阪']), txt, '本机时区换成纽约，合盘结果一字不差');

console.log(bad ? `\n${bad} 项不合，${ok} 项相合` : `\n全部相合（${ok} 项）`);
process.exit(bad ? 1 : 0);
