// 灵签自检：node scripts/lingqian/check.js
// 对照值不拿程序自己的结果去对自己：
//   · 签数、等级分布、首末几签的签诗，是对着出处逐条核过、手抄在下面的。
//   · 掷筊机会按四种落法手算（圣杯 1/2、笑杯 1/4、阴杯 1/4）；连得三圣杯平均 14 掷，按 (1−p³)/((1−p)p³) 手算。
//   · FNV-1a 用公开的测试向量（"" → 811c9dc5，"a" → e40c292c，"foobar" → bf9cf968）；
//     固定种子的抽签序列由另写的 Python（FNV-1a + mulberry32 + 拒绝采样，不读本站 JS）算出。
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', '..', 'static', 'lingqian');
const LQ = require(path.join(DIR, 'lingqian.js'));
let bad = 0, ok = 0;
const eq = (a, b, what) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '\n    得', JSON.stringify(a), '\n    应', JSON.stringify(b)); }
  else { ok++; console.log('✓', what); }
};
const near = (a, b, tol, what) => {
  if (!(Math.abs(a - b) <= tol)) { bad++; console.log('✗', what, `\n    得 ${a}，应 ${b} ± ${tol}`); }
  else { ok++; console.log('✓', what, `（${+a.toFixed(4)}）`); }
};
const count = arr => arr.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {});

/* —— 一、五套签：齐全、无空白 —— */
const WANT = { guanyin: 100, guandi: 100, jiazi: 60, wongtaisin: 100, sensoji: 100 };
eq(LQ.sets().map(D => D.id), ['guanyin', 'guandi', 'jiazi', 'wongtaisin', 'sensoji'], '五套签按序载入');
for (const D of LQ.sets()) {
  const n = WANT[D.id], L = D.lots, len = D.id === 'sensoji' ? 5 : 7;
  const probs = [];
  if (D.count !== n || L.length !== n) probs.push(`签数 ${L.length}/${D.count}`);
  L.forEach((x, i) => {
    const at = `第${i + 1}签`;
    if (x.n !== i + 1) probs.push(`${at} 签号 ${x.n}`);
    if (!Array.isArray(x.p) || x.p.length !== 4) probs.push(`${at} 签诗不是四句`);
    else x.p.forEach((l, j) => { if (typeof l !== 'string' || [...l].length !== len || /\s|[，。？！、]/.test(l)) probs.push(`${at} 第${j + 1}句「${l}」`); });
    if (x.pt && (x.pt.length !== 4 || x.pt.some((l, j) => [...l].length !== [...x.p[j]].length))) probs.push(`${at} 繁体与简体句长不合`);
    if (!x.j || x.j.length < 20 || x.j.length > 120) probs.push(`${at} 白话解长度 ${x.j ? x.j.length : 0}`);
    const g = LQ.grade(D, x);
    if (!LQ.scaleOf(D).includes(g)) probs.push(`${at} 等级「${g}」不在本套`);
    if (!LQ.TONE[g]) probs.push(`${at} 等级「${g}」无色调`);
    if (D.id === 'guanyin' || D.id === 'wongtaisin') { if (!x.s) probs.push(`${at} 缺典故`); }
    if (D.id === 'jiazi') {
      if (!/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/.test(x.gz || '')) probs.push(`${at} 干支 ${x.gz}`);
      if (!/^[○●]{3}　[○●]{3}$/.test(x.gua || '')) probs.push(`${at} 卦象 ${x.gua}`);
      if (!x.el || !x.st || !x.st.length || !x.it || x.it.length < 10 || x.it.some(i => !i[0] || !i[1])) probs.push(`${at} 卦象/典故/断语不全`);
    }
  });
  const poems = new Set(L.map(x => x.p.join('')));
  if (poems.size !== L.length) probs.push(`有 ${L.length - poems.size} 首签诗重复`);
  eq(probs, [], `${D.name}：${n} 签齐全，四句皆 ${len} 字，白话解、等级${D.id === 'jiazi' ? '（倾向）、干支卦象断语' : ''}无空白，签诗不重复`);
}
// 六十甲子：台湾宫庙排法，天干依次、地支隔一（甲子、甲寅、甲辰……乙丑、乙卯……）
const GAN = '甲乙丙丁戊己庚辛壬癸', ZHI = '子丑寅卯辰巳午未申酉戌亥';
const tw = []; for (let g = 0; g < 10; g++) for (let k = 0; k < 6; k++) tw.push(GAN[g] + ZHI[(g % 2) + 2 * k]);
eq(LQ.set('jiazi').lots.map(x => x.gz), tw, '六十甲子签：60 个干支各一，排法与台湾宫庙同（甲子、甲寅、甲辰…癸亥）');

/* —— 二、等级分布（对着出处数过） —— */
const sortObj = o => Object.fromEntries(Object.entries(o).sort((x, y) => x[0] < y[0] ? -1 : 1));
const dist = id => sortObj(count(LQ.set(id).lots.map(x => LQ.grade(LQ.set(id), x))));
eq(dist('sensoji'), sortObj({ '大吉': 17, '小吉': 4, '凶': 30, '吉': 35, '末吉': 6, '半吉': 5, '末小吉': 3 }), '浅草寺：大吉17 吉35 半吉5 小吉4 末小吉3 末吉6 凶30（与浅草寺公开比例同）');
eq(dist('guandi'), sortObj({ '大吉': 3, '上吉': 14, '中吉': 8, '下下': 28, '中平': 37, '上上': 10 }), '关帝：大吉3 上上10 上吉14 中吉8 中平37 下下28（清刊本原刻）');
eq(dist('wongtaisin'), sortObj({ '上上': 3, '上吉': 10, '中平': 40, '中吉': 29, '下下': 18 }), '黄大仙：上上3 上吉10 中吉29 中平40 下下18（两份 MIT 本一致）');
eq(dist('guanyin'), sortObj({ '上签': 24, '下签': 18, '中签': 58 }), '观音：上签24 中签58 下签18（三本互校）');
eq(Object.keys(dist('jiazi')).sort(), ['凶', '吉', '平'].sort(), '六十甲子：只用本站倾向吉、平、凶');

/* —— 三、几签抽查（逐字对过出处） —— */
const P = (id, n) => { const x = LQ.lot(id, n); return [x.g || x.t, x.s || x.gz || '', x.p.join('|')]; };
eq(P('guanyin', 1), ['上签', '钟离成道', '开天辟地作良缘|吉日良时万物全|若得此签非小可|人行忠正帝王宣'], '观音第一签');
eq(P('guanyin', 100), ['下签', '三教谈道', '佛神灵变与君知|痴人说事转昏迷|老人求得灵签去|不如守旧待时来'], '观音第一百签');
eq(P('guandi', 1), ['大吉', '', '巍巍独步向云间|玉殿仙官第一班|富贵荣华天付汝|福如东海寿如山'], '关帝第一签（清刊本作「仙官」）');
eq(LQ.lot('guandi', 100).pt.join('|'), '我本天仙雷雨師|吉凶禍福我先知|至誠禱祝皆靈應|抽得終籤百事宜', '关帝第一百签繁体原文');
eq(P('jiazi', 1), ['吉', '甲子', '日出便见风云散|光明清净照世间|一向前途通大道|万事清吉保平安'], '六十甲子第一签 甲子');
eq(P('jiazi', 60), ['平', '癸亥', '月出光辉本清吉|浮云总是蔽阴色|户内用心再作福|当官分理便有益'], '六十甲子第六十签 癸亥');
eq(P('wongtaisin', 1), ['上上', '姜公封相', '灵签求得第一枝|龙虎风云际会时|一旦凌霄扬自乐|任君来往赴瑶池'], '黄大仙第一签');
eq(P('wongtaisin', 9), ['上吉', '陶渊明赏菊', '瑶琴一曲奏新腔|明月清风枕簟凉|咸集嘉宾同赏菊|或歌或舞或飞觞'], '黄大仙第九签（qiantong 本误抄邻签，此取两份 MIT 本）');
eq(P('sensoji', 1), ['大吉', '', '七宝浮图塔|高峰顶上安|众人皆仰望|莫作等闲看'], '浅草寺第一番');
eq(P('sensoji', 100), ['凶', '', '禄走白云间|携琴走远山|不遇神仙面|空惹意阑珊'], '浅草寺第一百番');

/* —— 四、出处与许可文件就在数据旁边 —— */
const notes = LQ.sets().map(D => [D.id, D.note, fs.existsSync(path.join(DIR, 'data', D.note)) && fs.statSync(path.join(DIR, 'data', D.note)).size > 500]);
eq(notes.filter(x => !x[2]).map(x => x[0]), [], '每套数据旁都有出处或许可文件（' + notes.map(x => x[1]).join('、') + '）');
const mit = ['guandi.LICENSE.md', 'jiazi.LICENSE.md', 'wongtaisin.LICENSE.md'].filter(f => !/Permission is hereby granted, free of charge/.test(fs.readFileSync(path.join(DIR, 'data', f), 'utf8')));
eq(mit, [], '三份 MIT 来源的许可全文都附上了');

/* —— 五、掷筊 —— */
eq([LQ.kindOf(1, 0), LQ.kindOf(0, 1), LQ.kindOf(1, 1), LQ.kindOf(0, 0)], ['sheng', 'sheng', 'xiao', 'yin'], '一阴一阳为圣杯，两阳笑杯，两阴阴杯');
eq(LQ.P, { sheng: 0.5, xiao: 0.25, yin: 0.25 }, '四种落法各 1/4：圣杯 1/2、笑杯 1/4、阴杯 1/4');
eq([LQ.expectedRun(3, 0.5), LQ.expectedRun(1, 0.5), LQ.expectedRun(2, 0.5)], [14, 2, 6], '连得 k 次圣杯的平均掷数：k=3 为 14，k=1 为 2，k=2 为 6');
{
  const r = new LQ.Rite(3), seq = ['sheng', 'sheng', 'xiao', 'sheng', 'yin', 'sheng', 'sheng', 'sheng'];
  const got = seq.map(k => [r.push(k), r.streak]);
  eq(got, [[false, 1], [false, 2], [false, 0], [false, 1], [false, 0], [false, 1], [false, 2], [true, 3]], '三圣杯：笑杯、阴杯都让连数归零，第三个连续圣杯才算');
  eq([r.tosses, r.best, r.done()], [8, 3, true], '三圣杯：共掷 8 次，最长连 3');
}
{ // 固定种子掷 20 万次（两片 40 万个阴阳），频率应近 1/2、1/4、1/4
  const rnd = LQ.seeded('jiao'), N = 200000, c = { sheng: 0, xiao: 0, yin: 0 };
  let yang = 0;
  for (let i = 0; i < N; i++) { const t = LQ.toss(rnd); c[t.kind]++; yang += t.a + t.b; }
  near(c.sheng / N, 0.5, 0.005, '模拟 20 万掷：圣杯比例');
  near(c.xiao / N, 0.25, 0.005, '模拟 20 万掷：笑杯比例');
  near(c.yin / N, 0.25, 0.005, '模拟 20 万掷：阴杯比例');
  near(yang / (2 * N), 0.5, 0.004, '模拟：单片阳面比例');
}
{ // 求签 2 万回：平均几掷连得三圣杯（理论 14，标准差约 12.3，均值的标准误约 0.09）
  const rnd = LQ.seeded('rite'), R = 20000;
  let sum = 0, first3 = 0;
  for (let i = 0; i < R; i++) { const r = new LQ.Rite(3); while (!r.push(LQ.toss(rnd).kind)); sum += r.tosses; if (r.tosses === 3) first3++; }
  near(sum / R, 14, 0.4, '模拟 2 万回：平均掷数 ≈ 14');
  near(first3 / R, 1 / 8, 0.01, '模拟 2 万回：头三掷即成 ≈ 1/8');
}

/* —— 六、随机：种子固定则结果固定 —— */
eq([LQ.fnv1a(''), LQ.fnv1a('a'), LQ.fnv1a('foobar')].map(h => h.toString(16)), ['811c9dc5', 'e40c292c', 'bf9cf968'], 'FNV-1a 合公开测试向量');
eq(LQ.fnv1a('灵签').toString(16), 'b6909562', 'FNV-1a 按 UTF-8 字节散列中文种子');
{ const g = LQ.seeded('lingqian'); eq([g(), g(), g(), g(), g()], [1501791464, 2198370029, 3715557127, 3711993987, 2496212918], 'mulberry32：种子 lingqian 头五个数（与 Python 独立实现同）'); }
const drawSeq = (id, seed, k) => { const g = LQ.seeded(seed); return Array.from({ length: k }, () => LQ.draw(id, g).n); };
eq(drawSeq('guanyin', 'lingqian', 10), [65, 30, 28, 88, 19, 8, 81, 25, 13, 7], '种子 lingqian 连抽观音十签（与 Python 独立实现同）');
eq(drawSeq('jiazi', 'lingqian', 10), [45, 30, 8, 28, 39, 28, 41, 5, 13, 7], '种子 lingqian 连抽六十甲子十签（与 Python 独立实现同）');
eq(drawSeq('guanyin', 'lingqian', 10), drawSeq('guanyin', 'lingqian', 10), '同一种子，再抽一遍结果相同');
eq(JSON.stringify(drawSeq('guanyin', 'lingqian', 10)) === JSON.stringify(drawSeq('guanyin', 'lingqian2', 10)), false, '换个种子，结果不同');
{ // 页面的流程：同一个随机源先掷筊、再抽签
  const run = seed => { const g = LQ.seeded(seed), r = new LQ.Rite(3), ks = []; while (!r.push((ks[ks.length] = LQ.toss(g).kind))); return [r.tosses, ks.map(k => k[0].toUpperCase()).join(''), LQ.draw('guanyin', g).n]; };
  eq(run('demo'), [3, 'SSS', 51], '种子 demo：三掷即三圣杯，抽得观音第五十一签（与 Python 独立实现同）');
  eq(run('lingqian'), [9, 'SXSYYXSSS', 32], '种子 lingqian：九掷连得三圣杯，抽得观音第三十二签（与 Python 独立实现同）');
}
{ // 拒绝采样：n=100 时 2³² 末尾 96 个值要丢掉
  const feed = [4294967295, 4294967200, 4294967199, 7];
  let i = 0; const src = () => feed[i++];
  eq([LQ.randInt(100, src), i], [99, 3], '拒绝采样：≥ 4294967200 的两个值被丢掉，第三个 4294967199 → 99');
  eq(LQ.randInt(100, src), 7, '拒绝采样：接着取到 7');
}
{ // 均匀：10 万次抽 100 签，卡方（自由度 99，p=0.001 的界约 148.2）
  const g = LQ.seeded('uniform'), N = 100000, c = new Array(100).fill(0);
  for (let i = 0; i < N; i++) c[LQ.randInt(100, g)]++;
  const chi = c.reduce((s, x) => s + (x - N / 100) ** 2 / (N / 100), 0);
  eq(chi < 148.2, true, `十万次抽一百签，卡方 ${chi.toFixed(1)} < 148.2（每签机会均等）`);
}
{ const c = LQ.cryptoSource(); const xs = Array.from({ length: 8 }, c); eq(xs.every(x => Number.isInteger(x) && x >= 0 && x < 4294967296) && new Set(xs).size > 1, true, '密码学随机源给出 32 位整数'); }

/* —— 七、签号与文字 —— */
eq([1, 9, 10, 11, 20, 23, 60, 99, 100].map(LQ.cn), ['一', '九', '十', '十一', '二十', '二十三', '六十', '九十九', '一百'], '中文签号');
eq([LQ.label(LQ.set('guanyin'), 23), LQ.label(LQ.set('sensoji'), 23)], ['第二十三签', '第二十三番'], '浅草寺称「番」');
eq([LQ.tone(LQ.set('sensoji'), LQ.lot('sensoji', 1)), LQ.tone(LQ.set('guandi'), LQ.lot('guandi', 4)), LQ.tone(LQ.set('guanyin'), LQ.lot('guanyin', 5))], ['top', 'bad', 'mid'], '色调：大吉金、下下朱、中签平');
{
  const t = LQ.text(LQ.set('jiazi'), LQ.lot('jiazi', 1), { q: '换工作', when: '2026-11-04 15:30', how: '连得三圣杯后求得（掷筊 9 次）', ok: '签出后掷筊确认：圣杯' });
  const want = ['灵签 · 六十甲子签 第一签（甲子） · 倾向吉', '典故：包文极审张世真；包公请雷惊仁宗', '签诗：日出便见风云散，', '卦象：○○○　○○○ · 属金', '断语（原签）：作事 难成；', '白话（本站解）：太阳一出', '所问：换工作', '求签：2026-11-04 15:30 · 连得三圣杯后求得（掷筊 9 次） · 签出后掷筊确认：圣杯'];
  eq(want.filter(w => !t.includes(w)), [], '复制 / 问 AI 的文字带齐签号、典故、签诗、卦象、断语、白话、所问与求签经过');
}
eq(LQ.RULES.map(r => r[0]).slice(0, 3), ['掷筊', '三圣杯', '机会'], '口径写明掷筊、三圣杯与机会');
eq(/连得三次圣杯/.test(LQ.RULES_TEXT) && /1\/2/.test(LQ.RULES_TEXT) && /14 次/.test(LQ.RULES_TEXT), true, '口径里说了三圣杯、圣杯 1/2、平均 14 掷');

/* —— 八、求签记录（最新在前、可删、坏记录剔除） —— */
{
  let h = [];
  h = LQ.histAdd(h, { t: 1, s: 'guanyin', n: 3 });
  h = LQ.histAdd(h, { t: 2, s: 'sensoji', n: 7 });
  h = LQ.histAdd(h, { t: 3, s: 'jiazi', n: 60 });
  eq(h.map(r => r.t), [3, 2, 1], '记录最新在前');
  eq(LQ.histRemove(h, 1).map(r => r.t), [3, 1], '删去一条');
  eq(LQ.histClean([{ t: 1, s: 'guanyin', n: 101 }, { t: 2, s: 'nope', n: 1 }, null, { s: 'guanyin', n: 1 }, { t: 5, s: 'jiazi', n: 60 }]).map(r => r.t), [5], '坏记录（签号越界、无此签种、无时间）剔除');
  let big = []; for (let i = 0; i < LQ.HIST_MAX + 20; i++) big = LQ.histAdd(big, { t: i, s: 'guanyin', n: 1 });
  eq([big.length, big[0].t], [LQ.HIST_MAX, LQ.HIST_MAX + 19], `记录最多 ${LQ.HIST_MAX} 条，多了丢最旧的`);
}

console.log(bad ? `\n${bad} 项不合，${ok} 项相合` : `\n全部相合（${ok} 项）`);
process.exit(bad ? 1 : 0);
