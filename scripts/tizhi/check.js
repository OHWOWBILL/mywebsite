// 中医体质辨识自检：node scripts/tizhi/check.js
// 对照值都是手算的（逐项写在注释里），不拿程序自己的结果去对自己。
//   · 条目数、归型、逆向计分：中华中医药学会《中医体质分类与判定》（ZYYXH/T157-2009）附录 A 表 A.1～A.9。
//   · 转化分 = [(原始分 − 条目数) / (条目数 × 4)] × 100。
//   · 判定：平和质 ≥60 且其余 <30 为「是」、其余 <40 为「基本是」；偏颇 ≥40「是」、30～39「倾向是」、<30「否」。
const T = require('../../static/tizhi/tizhi.js');
let bad = 0, ok = 0;
const eq = (a, b, what) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '\n    得', JSON.stringify(a), '\n    应', JSON.stringify(b)); }
  else { ok++; console.log('✓', what); }
};
const near = (a, b, what) => {
  const good = typeof a === 'number' && Math.abs(a - b) < 1e-9;
  if (!good) { bad++; console.log('✗', what, '\n    得', a, '\n    应', b); } else { ok++; console.log('✓', what); }
};
// 一套答案：所有条目先填 base，再按 id 改几条
const make = (base, over) => { const a = {}; T.Q.forEach(q => { a[q.id] = base; }); return Object.assign(a, over || {}); };
const r2 = x => Math.round(x * 100) / 100;
const sc2 = sc => { const o = {}; T.ORDER.forEach(k => { o[k] = sc[k] == null ? null : r2(sc[k]); }); return o; };
const pick = v => ({ kind: v.kind, main: v.main, jian: v.jian, qing: v.qing });

/* —— 一、条目数（表 A.1～A.9）——
   平和 8、气虚 8、阳虚 7、阴虚 8、痰湿 8、湿热 7（每人 6）、血瘀 7、气郁 7、特禀 7，共 67 处；
   重复 6 条（疲乏、声音低弱、闷闷不乐、耐受不了寒冷、健忘、易患感冒）→ 61 条；性别二选一 → 每人 60 条 */
const COUNT = { pinghe: 8, qixu: 8, yangxu: 7, yinxu: 8, tanshi: 8, shire: 7, xueyu: 7, qiyu: 7, tebing: 7 };
eq(T.ORDER, ['pinghe', 'qixu', 'yangxu', 'yinxu', 'tanshi', 'shire', 'xueyu', 'qiyu', 'tebing'], '九型及次序（A～I 型）');
eq(T.TYPES.map(t => t.code + t.name).join(' '), 'A平和质 B气虚质 C阳虚质 D阴虚质 E痰湿质 F湿热质 G血瘀质 H气郁质 I特禀质', '九型名称与代号');
eq(Object.fromEntries(T.ORDER.map(k => [k, T.ITEMS[k].length])), COUNT, '各型条目数与标准表一致');
eq([T.ORDER.reduce((s, k) => s + T.ITEMS[k].length, 0), T.Q.length, T.questions('f').length, T.questions('m').length], [67, 61, 60, 60], '共 67 处、去重 61 条、女男各答 60 条');
eq([T.itemsOf('shire', 'f').length, T.itemsOf('shire', 'm').length], [6, 6], '湿热质按性别各计 6 条');
eq([T.questions('f').some(q => q.id === 'F6'), T.questions('f').some(q => q.id === 'F7'), T.questions('m').some(q => q.id === 'F6'), T.questions('m').some(q => q.id === 'F7')],
  [true, false, false, true], '「带下色黄」只问女、「阴囊潮湿」只问男');
eq(new Set(T.Q.map(q => q.id)).size + new Set(T.Q.map(q => q.t)).size, 122, '61 条 id 与题干都不重复');

/* —— 二、各型条目按表内序号（手抄每条的关键词，逐条对） —— */
const KEY = {
  pinghe: ['精力充沛', '容易疲乏', '声音低弱无力', '闷闷不乐', '耐受不了寒冷', '适应外界自然和社会环境', '容易失眠', '容易忘事'],
  qixu: ['容易疲乏', '气短', '心慌', '头晕或站起时晕眩', '容易患感冒', '喜欢安静、懒得说话', '声音低弱无力', '出虚汗'],
  yangxu: ['手脚发凉', '胃脘部、背部或腰膝部怕冷', '衣服比别人穿得多', '耐受不了寒冷', '容易患感冒', '会感到不舒服', '容易腹泻'],
  yinxu: ['手脚心发热', '身体、脸上发热', '皮肤或口唇干', '口唇的颜色比一般人红', '便秘或大便干燥', '两颧潮红', '眼睛干涩', '口干咽燥'],
  tanshi: ['胸闷或腹部胀满', '身体沉重', '腹部肥满松软', '额部油脂', '上眼睑比别人肿', '黏黏的感觉', '痰多', '舌苔厚腻'],
  shire: ['油腻感或者油亮发光', '痤疮或疮疖', '口苦', '大便黏滞不爽', '尿道有发热感', '带下色黄', '阴囊部位潮湿'],
  xueyu: ['青紫瘀斑', '细微红丝', '有哪里疼痛', '面色晦黯', '黑眼圈', '容易忘事', '口唇颜色偏黯'],
  qiyu: ['闷闷不乐', '焦虑不安', '多愁善感', '害怕或受到惊吓', '胁肋部或乳房胀痛', '无缘无故叹气', '咽喉部有异物感'],
  tebing: ['打喷嚏', '鼻塞、流鼻涕', '咳喘', '容易过敏', '荨麻疹', '紫癜', '一抓就红']
};
T.ORDER.forEach(k => {
  const miss = T.ITEMS[k].map((it, i) => T.QMAP[it.id].t.includes(KEY[k][i]) ? null : `${i + 1}:${it.id}`).filter(Boolean);
  eq(miss, [], `${T.TYPE[k].name}各条与表内序号对得上`);
});

/* —— 三、逆向计分与共用条目 ——
   平和质 (2)(3)(4)(5)(7)(8) 带 *；(1) 精力充沛、(6) 能适应环境为正向；其余八型无逆向。
   共用（在平和质里都逆向）：疲乏 平和、气虚；声音低弱 平和、气虚；闷闷不乐 平和、气郁；
   耐受不了寒冷 平和、阳虚；健忘 平和、血瘀；另有易患感冒 气虚、阳虚（都正向） */
eq(T.ITEMS.pinghe.map(it => it.rev), [false, true, true, true, true, false, true, true], '平和质逆向条目：第 2、3、4、5、7、8 条');
eq(T.PIAN.filter(k => T.ITEMS[k].some(it => it.rev)), [], '八种偏颇体质没有逆向条目');
const shared = T.Q.filter(q => q.types.length > 1).map(q => q.id + ':' + q.types.map(x => x.k + (x.rev ? '*' : '')).join('/'));
eq(shared, ['A2:pinghe*/qixu', 'A3:pinghe*/qixu', 'A4:pinghe*/qiyu', 'A5:pinghe*/yangxu', 'A8:pinghe*/xueyu', 'B5:qixu/yangxu'], '共用条目只有 6 条，每条只问一次');

/* —— 四、转化分公式 —— */
near(T.conv(8, 8), 0, '8 条全「没有」：(8−8)/32×100 = 0');
near(T.conv(40, 8), 100, '8 条全「总是」：(40−8)/32×100 = 100');
near(T.conv(24, 8), 50, '8 条全「有时」：(24−8)/32×100 = 50');
near(T.conv(27, 8), 59.375, '8 条原始分 27：19/32×100 = 59.375');
near(T.conv(28, 8), 62.5, '8 条原始分 28：20/32×100 = 62.5');
near(T.conv(18, 7), 1100 / 28, '7 条原始分 18：11/28×100 = 39.29');
near(T.conv(19, 7), 1200 / 28, '7 条原始分 19：12/28×100 = 42.86');
near(T.conv(15, 7), 800 / 28, '7 条原始分 15：8/28×100 = 28.57');
near(T.conv(16, 7), 900 / 28, '7 条原始分 16：9/28×100 = 32.14');
near(T.conv(13, 6), 700 / 24, '6 条原始分 13：7/24×100 = 29.17');
near(T.conv(16, 6), 1000 / 24, '6 条原始分 16：10/24×100 = 41.67');

/* —— 五、整套答案 ——
   全「没有」(1)：平和 = 正向 1+1 + 逆向 6×5 = 32 → (32−8)/32 = 75；偏颇全 0
   全「总是」(5)：平和 = 5+5 + 6×1 = 16 → 25；偏颇全 100（湿热按 6 条）
   全「有时」(3)：平和 = 3+3 + 6×3 = 24 → 50；偏颇全 50 */
eq(sc2(T.scores(make(1), 'f')), { pinghe: 75, qixu: 0, yangxu: 0, yinxu: 0, tanshi: 0, shire: 0, xueyu: 0, qiyu: 0, tebing: 0 }, '全答「没有」：平和 75，偏颇全 0');
eq(sc2(T.scores(make(5), 'm')), { pinghe: 25, qixu: 100, yangxu: 100, yinxu: 100, tanshi: 100, shire: 100, xueyu: 100, qiyu: 100, tebing: 100 }, '全答「总是」：平和 25，偏颇全 100');
eq(sc2(T.scores(make(3), 'f')), { pinghe: 50, qixu: 50, yangxu: 50, yinxu: 50, tanshi: 50, shire: 50, xueyu: 50, qiyu: 50, tebing: 50 }, '全答「有时」：九型都是 50');
// 只把「容易疲乏」答「总是」：平和 1+1 + (6−5) + 5×5 = 28 → 62.5；气虚 5 + 7×1 = 12 → (12−8)/32 = 12.5
eq(sc2(T.scores(make(1, { A2: 5 }), 'f')), { pinghe: 62.5, qixu: 12.5, yangxu: 0, yinxu: 0, tanshi: 0, shire: 0, xueyu: 0, qiyu: 0, tebing: 0 }, '逆向：「容易疲乏」总是 → 平和计 1 分（62.5）、气虚计 5 分（12.5）');
// 「精力充沛」答「没有」不逆向：全答「总是」再把 A1 改成 1 → 平和 1+5+6×1 = 12 → (12−8)/32 = 12.5
near(T.scores(make(5, { A1: 1 }), 'f').pinghe, 12.5, '正向：「精力充沛」没有 → 平和计 1 分（12.5）');

/* —— 六、判定：造几套答案 —— */
// 纯平和：精力充沛、能适应都「总是」，其余全「没有」→ 平和 5+5+30 = 40 → 100，偏颇全 0 →「是」
const vPure = T.verdict(T.scores(make(1, { A1: 5, A6: 5 }), 'f'));
eq([r2(vPure.scores.pinghe), vPure.ping, pick(vPure)], [100, '是', { kind: 'pinghe', main: ['pinghe'], jian: [], qing: [] }], '纯平和：平和 100，「是」');
eq(T.lines(vPure), { key: '你是平和质', sub: '平和质 100 分；八种偏颇体质都不到 30 分。' }, '纯平和的白话结论');

// 明显气虚：气虚 8 条都「经常」(4)，其余「没有」
//   气虚 32 → 75「是」；平和 1+1 + (6−4)×2 + 5×4 = 26 → 56.25「否」；阳虚 6×1 + 4（感冒）= 10 → 3/28 = 10.71
const vQi = T.verdict(T.scores(make(1, { A2: 4, B2: 4, B3: 4, B4: 4, B5: 4, B6: 4, A3: 4, B8: 4 }), 'f'));
eq([r2(vQi.scores.qixu), r2(vQi.scores.pinghe), r2(vQi.scores.yangxu), vQi.levels.qixu, vQi.ping], [75, 56.25, 10.71, '是', '否'], '明显气虚：气虚 75「是」，平和 56.25，阳虚 10.71');
eq(pick(vQi), { kind: 'pian', main: ['qixu'], jian: [], qing: [] }, '明显气虚：主体质气虚质，无兼夹');
eq(T.lines(vQi), { key: '主体质：气虚质', sub: '其余各型都没到判定线。' }, '明显气虚的白话结论');

// 偏颇的 30 / 40 线（阳虚 7 条；感冒、耐受不了寒冷两条共用题都留「没有」，免得动到别型）
//   C1 C2 C3 = 4、C6 = 3 → 4+4+4+1+1+3+1 = 18 → 39.29「倾向是」；C6 = 4 → 19 → 42.86「是」
//   C1 C2 C3 C6 = 3 → 15 → 28.57「否」；再加 C7 = 2 → 16 → 32.14「倾向是」
const yang = o => T.verdict(T.scores(make(1, o), 'm'));
const y39 = yang({ C1: 4, C2: 4, C3: 4, C6: 3 }), y43 = yang({ C1: 4, C2: 4, C3: 4, C6: 4 });
const y29 = yang({ C1: 3, C2: 3, C3: 3, C6: 3 }), y32 = yang({ C1: 3, C2: 3, C3: 3, C6: 3, C7: 2 });
eq([y39, y43, y29, y32].map(v => [r2(v.scores.yangxu), v.levels.yangxu]), [[39.29, '倾向是'], [42.86, '是'], [28.57, '否'], [32.14, '倾向是']], '阳虚 39.29 倾向是、42.86 是、28.57 否、32.14 倾向是');
// 这几套平和都是 75：阳虚 39.29 / 32.14 → 平和「基本是」；42.86 → 平和「否」；28.57 → 平和「是」
eq([y39.ping, y43.ping, y29.ping, y32.ping], ['基本是', '否', '是', '基本是'], '平和 75 时：偏颇最高 39.29 → 基本是，42.86 → 否，28.57 → 是');
eq([pick(y39), pick(y43)], [{ kind: 'pinghe-ji', main: ['pinghe'], jian: [], qing: ['yangxu'] }, { kind: 'pian', main: ['yangxu'], jian: [], qing: [] }], '基本是平和兼阳虚倾向；阳虚到 40 即为主体质');
eq(T.lines(y39).key + '｜' + T.lines(y39).sub, '基本是平和质｜平和质 75 分；另有阳虚质倾向（30～39 分），可留意下面的建议。', '基本是平和的白话结论');
eq(T.lines(y43).sub, '其余各型都没到判定线。平和质虽有 75 分，但有偏颇到了 40 分，按标准不判平和。', '平和过 60 但偏颇到 40：说明为何不判平和');

// 平和的 60 线：「容易失眠」只属平和质，答「总是」→ 平和 1+1 + 1 + 5×5 = 28 → 62.5
//   再把「容易疲乏」答「很少」(2) → 平和 27 → 59.375；气虚 9 → 1/32 = 3.13
const p62 = T.verdict(T.scores(make(1, { A7: 5 }), 'f'));
const p59 = T.verdict(T.scores(make(1, { A7: 5, A2: 2 }), 'f'));
eq([r2(p62.scores.pinghe), p62.ping, r2(p59.scores.pinghe), p59.ping, r2(p59.scores.qixu)], [62.5, '是', 59.38, '否', 3.13], '平和 62.5「是」，59.375「否」');
eq([p59.kind, T.lines(p59).key], ['none', '未见明显偏颇'], '平和差一点到 60、偏颇都 <30：不下结论');
const p62y32 = T.verdict(T.scores(make(1, { A7: 5, C1: 3, C2: 3, C3: 3, C6: 3, C7: 2 }), 'f'));
const p62y43 = T.verdict(T.scores(make(1, { A7: 5, C1: 4, C2: 4, C3: 4, C6: 4 }), 'f'));
const p62y29 = T.verdict(T.scores(make(1, { A7: 5, C1: 3, C2: 3, C3: 3, C6: 3 }), 'f'));
eq([p62y32.ping, p62y43.ping, p62y29.ping, p62y43.main], ['基本是', '否', '是', ['yangxu']], '平和 62.5 配阳虚 32.14 → 基本是；配 42.86 → 否（阳虚为主）；配 28.57 → 是');

// 兼夹与倾向的排序：阳虚 5 条「总是」→ 2+25 = 27 → 71.43；气虚 B2 B3 B4 = 4、B6 B8 = 3 → 21 → 40.63；痰湿 E1～E5 = 3 → 18 → 31.25
const vMix = T.verdict(T.scores(make(1, { C1: 5, C2: 5, C3: 5, C6: 5, C7: 5, B2: 4, B3: 4, B4: 4, B6: 3, B8: 3, E1: 3, E2: 3, E3: 3, E4: 3, E5: 3 }), 'f'));
eq([r2(vMix.scores.yangxu), r2(vMix.scores.qixu), r2(vMix.scores.tanshi)], [71.43, 40.63, 31.25], '兼夹例：阳虚 71.43、气虚 40.63、痰湿 31.25');
eq(pick(vMix), { kind: 'pian', main: ['yangxu'], jian: ['qixu'], qing: ['tanshi'] }, '分最高的阳虚为主体质，气虚兼夹，痰湿倾向');
eq(T.lines(vMix).sub.split('。')[0], '兼夹气虚质；有痰湿质倾向', '兼夹例的白话结论');
eq([T.roleOf(vMix, 'yangxu'), T.roleOf(vMix, 'qixu'), T.roleOf(vMix, 'tanshi'), T.roleOf(vMix, 'yinxu')], ['主体质', '兼夹', '倾向', ''], '各型在结果里的身份');

// 只有倾向：痰湿 31.25；再把失眠、健忘答「总是」把平和压到 50（1+1 + 4×5 + 1 + 1 = 24 → 50）；血瘀 11 → 4/28 = 14.29
const vQing = T.verdict(T.scores(make(1, { E1: 3, E2: 3, E3: 3, E4: 3, E5: 3, A7: 5, A8: 5 }), 'm'));
eq([r2(vQing.scores.pinghe), r2(vQing.scores.xueyu), pick(vQing), T.lines(vQing).key], [50, 14.29, { kind: 'qing', main: ['tanshi'], jian: [], qing: [] }, '有痰湿质倾向'], '无一型到 40、平和不到 60：只说倾向');

// 同分并列：全答「有时」→ 八种偏颇都是 50「是」
const v50 = T.verdict(T.scores(make(3), 'f'));
eq([v50.kind, v50.main.length, v50.jian.length, T.lines(v50).key], ['pian', 8, 0, '主体质：气虚质、阳虚质、阴虚质等 8 种'], '八型同分：并列为主体质');

/* —— 七、判定线本身（30、40、60 用答案凑不出整数，直接喂分数） —— */
eq([T.levelPian(40), T.levelPian(39.999), T.levelPian(30), T.levelPian(29.999), T.levelPian(0), T.levelPian(100)], ['是', '倾向是', '倾向是', '否', '否', '是'], '偏颇：40 是，39.999 倾向是，30 倾向是，29.999 否');
const S = (p, o) => Object.assign({ pinghe: p, qixu: 0, yangxu: 0, yinxu: 0, tanshi: 0, shire: 0, xueyu: 0, qiyu: 0, tebing: 0 }, o || {});
eq([T.levelPing(S(60, { qiyu: 29.999 })), T.levelPing(S(60, { qiyu: 30 })), T.levelPing(S(60, { qiyu: 39.999 })), T.levelPing(S(60, { qiyu: 40 })), T.levelPing(S(59.999))],
  ['是', '基本是', '基本是', '否', '否'], '平和：60 且他型 <30 是，=30 或 39.999 基本是，=40 否；59.999 否');
// 用 6、7、8 条能凑出的所有转化分：没有一个正好落在 30、40、60 上；取整显示也不会跨过判定线
let hits = [], cross = [];
[6, 7, 8].forEach(n => { for (let raw = n; raw <= 5 * n; raw++) {
  const x = T.conv(raw, n);
  if ([30, 40, 60].some(l => Math.abs(x - l) < 1e-9)) hits.push(`${n}:${raw}`);
  [Math.round(x), Math.round(x * 10) / 10].forEach(y => {
    if (T.levelPian(y) !== T.levelPian(x) || (y >= 60) !== (x >= 60)) cross.push(`${n}:${raw}:${x}`);
  });
} });
eq([hits, cross], [[], []], '可达的转化分不落在 30/40/60，整数或一位小数显示不改判定');

/* —— 八、性别条目 ——
   女：F1～F5 = 1、F6 = 5 → 10 → (10−6)/24 = 16.67（F7 答了也不算）；男换成 F7 同理；对方的那条不计 */
eq([r2(T.scores(make(1, { F6: 5, F7: 5 }), 'f').shire), r2(T.scores(make(1, { F6: 5, F7: 5 }), 'm').shire), r2(T.scores(make(1, { F6: 5 }), 'm').shire), r2(T.scores(make(1, { F7: 5 }), 'f').shire)],
  [16.67, 16.67, 0, 0], '湿热：女计带下、男计阴囊，各按 6 条');
const partial = make(1); delete partial.B3;
eq([T.scores(partial, 'f').qixu, r2(T.scores(partial, 'f').pinghe), T.verdict(T.scores(partial, 'f'))], [null, 75, null], '缺一条：该型不算分，不出结论');
const noF6 = make(1); delete noF6.F6;
eq([T.scores(noF6, 'm').shire, T.scores(noF6, 'f').shire], [0, null], '男不必答带下；女缺带下则湿热不算分');

/* —— 九、存档 —— */
const ansX = make(2, { A1: 5, F7: 3 }); delete ansX.F6;
const packed = T.pack(ansX);
eq([packed.length, packed[0], packed[T.QMAP.F6.i], packed[T.QMAP.F7.i], JSON.stringify(T.unpack(packed)) === JSON.stringify(ansX)], [61, '5', '0', '3', true], '61 位答案串：未答记 0，来回不走样');
eq(T.unpack('9x'), {}, '坏串不出错');

/* —— 十、四时 —— */
eq([0, 15, 45, 105, 135, 210, 222, 225, 270, 315, 359.9].map(T.termName), ['春分', '清明', '立夏', '小暑', '立秋', '霜降', '霜降', '立冬', '冬至', '立春', '惊蛰'], '黄经 → 节气');
eq([315, 359, 0, 44.9, 45, 104.9, 105, 134.9, 135, 224.9, 225, 314.9].map(T.seasonOf), ['春', '春', '春', '春', '夏', '夏', '长夏', '长夏', '秋', '秋', '冬', '冬'], '分季：立春、立夏、小暑（长夏）、立秋、立冬');
eq([T.seasonTip('yangxu', '冬').own, T.seasonTip('tanshi', '长夏').own, T.seasonTip('yinxu', '长夏').text === T.TYPE.yinxu.jie['夏'], T.seasonTip('pinghe', '秋').own], [true, true, true, false], '本型有就用本型的季节提醒，长夏借夏，没有就用通用四时起居');

/* —— 十一、内容齐全 —— */
const STD = ['zongti', 'xingti', 'biaoxian', 'xinli', 'fabing', 'shiying'], CARE = ['yi', 'shao', 'qiju', 'yundong', 'qingzhi'];
const holes = [];
T.TYPES.forEach(t => {
  if (!(t.gist && t.gist.length > 10)) holes.push(t.k + '.gist');
  STD.forEach(f => { if (!(t.std[f] && t.std[f].length > 1)) holes.push(t.k + '.std.' + f); });
  CARE.forEach(f => { if (!(t.care[f] && t.care[f].length > 8)) holes.push(t.k + '.care.' + f); });
  if (t.xue.length !== 2) holes.push(t.k + '.xue');
  t.xue.forEach(x => { if (!T.XUE[x.n]) holes.push(t.k + '.xue.' + x.n); if (!T.HOW[x.how]) holes.push(t.k + '.how.' + x.how); });
  if (!t.jie.all) holes.push(t.k + '.jie.all');
  Object.keys(t.jie).forEach(s => { if (s !== 'all' && !T.SEASON_TIP[s]) holes.push(t.k + '.jie.' + s); });
});
eq(holes, [], '九型的特征、调养、保健穴、季节提醒都齐');
const XUE = { pinghe: '涌泉足三里', qixu: '气海关元', yangxu: '关元命门', yinxu: '太溪三阴交', tanshi: '丰隆足三里', shire: '支沟阴陵泉', xueyu: '期门血海', qiyu: '合谷太冲', tebing: '神阙曲池' };
eq(Object.fromEntries(T.ORDER.map(k => [k, T.TYPE[k].xue.map(x => x.n).join('')])), XUE, '各型保健穴（体质保健指导常用的两穴）');
eq(T.Q.filter(q => !/吗？(（限[男女]性回答）)?$/.test(q.t) || /[()?,]/.test(q.t)).map(q => q.id), [], '题干都以「吗？」收尾，标点全角');

/* —— 十二、复制文字 —— */
const txt = T.summary({ v: vMix, ans: make(1, { C1: 5, C2: 5, C3: 5, C6: 5, C7: 5, B2: 4, B3: 4, B4: 4, B6: 3, B8: 3, E1: 3, E2: 3, E3: 3, E4: 3, E5: 3 }), sex: 'f', date: '2026-11-04' });
eq([txt.includes('结论：主体质：阳虚质。'), txt.includes('九型转化分：平和 75（否）｜气虚 41（是）｜阳虚 71（是）'), txt.includes('（8 条）'), txt.includes('您手脚发凉吗？——总是')], [true, true, true, true], '复制文字含结论、九型分数与答「经常」「总是」的条目');

console.log(bad ? `\n${bad} 项不合，${ok} 项相合` : `\n全部相合（${ok} 项）`);
process.exit(bad ? 1 : 0);
