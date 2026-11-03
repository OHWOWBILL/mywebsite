// 九星气学自检：TZ=Asia/Tokyo node scripts/jiuxing/check.js
// 对照值都是手算的（逐格写在下面），不拿程序自己的结果去对自己。
//   · 年紫白：2026 丙午一白入中；2022 壬寅五黄入中。
//   · 月紫白：子午卯酉年寅月八白、辰戌丑未年五黄、寅申巳亥年二黑，逐月减一。
//   · 1990 立春 2 月 4 日 10:14、立夏 5 月 6 日 02:36（北京时间）；2026 寒露 10/8、立冬 11/7、白露 9/7（日本时间）。
process.env.TZ = process.env.TZ || 'Asia/Tokyo';
const JX = require('../../static/jiuxing/jiuxing.js');
let bad = 0, ok = 0;
const eq = (a, b, what) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '\n    得', JSON.stringify(a), '\n    应', JSON.stringify(b)); }
  else { ok++; console.log('✓', what); }
};
const N = s => JX.STAR[s].n;
const dirs = ps => ps.map(p => JX.PAL[p].dir);
// 盘面按「南上」三行写：东南 南 西南 / 东 中 西 / 东北 北 西北
const grid = b => [0, 3, 6].map(i => JX.SOUTH_UP.slice(i, i + 3).map(p => b.pan[p]).join('')).join('/');
// 某种凶方落在哪些方位
const markAt = (J, k) => dirs(JX.COMPASS.filter(p => J.cells[p].marks.includes(k)));

/* —— 一、年盘 2026（丙午）：一白入中顺飞 ——
   中1 → 乾2 兑3 艮4 离5 坎6 坤7 震8 巽9
   南上：东南九 南五 西南七 / 东八 中一 西三 / 东北四 北六 西北二
   五黄在离（南）→ 五黄杀南、暗剑杀北；年支午，冲子 → 岁破北 */
const y26 = JX.yearBoard(2026);
eq([y26.center, N(y26.center)], [1, '一白'], '2026 年盘中宫一白');
eq(grid(y26), '957/813/462', '2026 年盘九宫（南上）');
const jy0 = JX.judge(y26, null);
eq([markAt(jy0, '五黄杀'), markAt(jy0, '暗剑杀'), markAt(jy0, '岁破')], [['南'], ['北'], ['北']], '2026 年盘：五黄杀南、暗剑杀北、岁破北');
eq(JX.boardText(y26), '东南九紫 南五黄 西南七赤 / 东八白 中一白 西三碧 / 东北四绿 北六白 西北二黑', '盘面一行字');

/* —— 二、月盘 2026-11-03：寒露（10/8）后、立冬（11/7）前 → 戌月 ——
   午年属子午卯酉：寅八 卯七 辰六 巳五 午四 未三 申二 酉一 戌九 → 九紫入中
   中9 → 乾1 兑2 艮3 离4 坎5 坤6 震7 巽8
   南上：东南八 南四 西南六 / 东七 中九 西二 / 东北三 北五 西北一
   五黄在坎（北）→ 五黄杀北、暗剑杀南；月建戌，冲辰，辰在巽 → 月破东南 */
const d1 = JX.forDate(2026, 11, 3);
eq([d1.Y, d1.year.gz, d1.month.name, d1.month.gz, d1.month.center], [2026, '丙午', '戌月', '戊戌', 9], '2026-11-03 为丙午年戊戌月，九紫入中');
eq(grid(d1.month), '846/792/351', '戌月月盘九宫（南上）');
const jm0 = JX.judge(d1.month, null);
eq([markAt(jm0, '五黄杀'), markAt(jm0, '暗剑杀'), markAt(jm0, '月破')], [['北'], ['南'], ['东南']], '戌月：五黄杀北、暗剑杀南、月破东南');
eq(JX.span(d1.month.from, d1.month.to).text, '10/8–11/6', '戌月起讫 10/8–11/6');

/* —— 三、立冬当日（2026-11-07）算新月：亥月八白入中 ——
   中8 → 乾9 兑1 艮2 离3 坎4 坤5 震6 巽7；南上：东南七 南三 西南五 / 东六 中八 西一 / 东北二 北四 西北九
   五黄在坤（西南）→ 五黄杀西南、暗剑杀东北；亥冲巳，巳在巽 → 月破东南 */
const d2 = JX.forDate(2026, 11, 7), jm2 = JX.judge(d2.month, null);
eq([d2.month.name, d2.month.center, grid(d2.month)], ['亥月', 8, '735/681/249'], '立冬当日即亥月，八白入中');
eq([markAt(jm2, '五黄杀'), markAt(jm2, '暗剑杀'), markAt(jm2, '月破')], [['西南'], ['东北'], ['东南']], '亥月：五黄杀西南、暗剑杀东北、月破东南');
eq(JX.forDate(2026, 11, 6).month.name, '戌月', '立冬前一日仍是戌月');

/* —— 四、立春换年：2026 立春在 2 月 4 日（日本时间 05:02） ——
   2/3：乙巳年（二黑入中）丑月（寅申巳亥年丑月九紫）；2/4：丙午年（一白）寅月（八白） */
const a = JX.forDate(2026, 2, 3), b = JX.forDate(2026, 2, 4);
eq([a.year.gz, a.year.center, a.month.name, a.month.center], ['乙巳', 2, '丑月', 9], '2026-02-03：乙巳年二黑、丑月九紫');
eq([b.year.gz, b.year.center, b.month.name, b.month.center], ['丙午', 1, '寅月', 8], '2026-02-04 立春当日：丙午年一白、寅月八白');

/* —— 五、五黄入中：2022 壬寅年 —— 八方无五黄杀、暗剑杀；寅冲申，申在坤 → 岁破西南 */
const y22 = JX.yearBoard(2022), j22 = JX.judge(y22, null);
eq([y22.center, markAt(j22, '五黄杀'), markAt(j22, '暗剑杀'), markAt(j22, '岁破')], [5, [], [], ['西南']], '2022 五黄入中：无五黄杀暗剑杀，岁破西南');

/* —— 六、本命星、月命星 —— */
const n1 = JX.natal('1990-05-17T08:30');
eq([n1.Y, n1.gz, n1.month, N(n1.honmei), N(n1.getsumei)], [1990, '庚午', '巳月', '一白', '五黄'], '1990-05-17 生：本命一白、月命五黄（庚午年巳月）');
eq([N(JX.natal('1990-05-17T08:30', { tz: 8 }).honmei), N(JX.natal('1990-05-17', {}).getsumei)], ['一白', '五黄'], '同上（按东八区、无时刻）');
const n2 = JX.natal('1990-01-20');
eq([n2.Y, n2.gz, n2.month, N(n2.honmei), N(n2.getsumei)], [1989, '己巳', '丑月', '二黑', '九紫'], '1990-01-20（立春前）：算 1989 己巳年，本命二黑，丑月九紫');
// 立春精确到分：1990-02-04 10:14（东八区）= 11:14（日本）
eq([
  N(JX.natal('1990-02-04T10:13', { tz: 8 }).honmei), N(JX.natal('1990-02-04T10:14', { tz: 8 }).honmei),
  N(JX.natal('1990-02-04T11:13').honmei), N(JX.natal('1990-02-04T11:14').honmei)
], ['二黑', '一白', '二黑', '一白'], '立春按分换年（东八区 10:14、本机日本 11:14）');
eq(N(JX.natal('1990-02-04T11:14', { tz: 9, dst: true }).honmei), '二黑', '夏令时先扣一小时（11:14 夏令 = 10:14 标准，未到立春）');
// 立夏 1990-05-06 02:36（东八区）：之前辰月六白，之后巳月五黄
eq([JX.natal('1990-05-06T02:35', { tz: 8 }).month, N(JX.natal('1990-05-06T02:35', { tz: 8 }).getsumei), JX.natal('1990-05-06T02:36', { tz: 8 }).month],
  ['辰月', '六白', '巳月'], '月命按节换（立夏 02:36 前辰月六白）');
const n3 = JX.natal('2000-01-01T12:00');
eq([n3.gz, n3.month, N(n3.honmei), N(n3.getsumei)], ['己卯', '子月', '一白', '七赤'], '2000-01-01：己卯年子月，本命一白、月命七赤');
eq([JX.natal('1990-02-04', { tz: 8 }).near && JX.natal('1990-02-04', { tz: 8 }).near.n, JX.natal('1990-02-04', { tz: 8 }).near.sameDay, JX.natal('1990-05-17').near], ['立春', true, null], '交节当日出生会提示补时刻');
eq(JX.natal('1899-01-01'), null, '表外之年不硬算');

/* —— 七、吉星表（与本命星相生比和；五黄不吉，本命自身不吉） —— */
const JI = {
  1: [3, 4, 6, 7], 2: [6, 7, 8, 9], 8: [2, 6, 7, 9], 3: [1, 4, 9], 4: [1, 3, 9],
  6: [1, 2, 7, 8], 7: [1, 2, 6, 8], 9: [2, 3, 4, 8], 5: [2, 6, 7, 8, 9]
};
for (let s = 1; s <= 9; s++) eq(JX.jiStars(s).map(N), JI[s].map(N), N(s) + ' 的吉星');
eq([JX.relText(1, 6), JX.relText(1, 3), JX.relText(1, 2), JX.relText(1, 9), JX.relText(3, 4)],
  ['金生水，生气', '水生木，退气', '土克水，杀气', '水克火，死气', '同属木，比和'], '生克说法');

/* —— 八、一个人：1990-05-17（本命一白、月命五黄）看 2026-11-03 ——
   月盘（戌月）：西北一白=本命杀，其对宫东南=本命的杀（又是月破）；北五黄=五黄杀兼月命杀，南=暗剑杀兼月命的杀。
     一白的吉星三碧（东北）、四绿（南，凶）、六白（西南）、七赤（东）→ 吉方东北、东、西南；
     又是五黄（土）的吉星者：六白、七赤 → 最大吉方东、西南。
   年盘（2026）：本命一白入中，无本命杀；月命五黄在南 → 月命杀南、月命的杀北。
     三碧（西）、四绿（东北）、六白（北，凶）、七赤（西南）→ 吉方东北、西南、西；七赤又吉于土 → 最大吉方西南。
   搬家：年月都吉 → 东北、西南；西南两盘皆最大吉 */
const P = { honmei: n1.honmei, getsumei: n1.getsumei };
const jm = JX.judge(d1.month, P), jy = JX.judge(d1.year, P);
eq([dirs(jm.ji), dirs(jm.best)], [['东北', '东', '西南'], ['东', '西南']], '戌月吉方与最大吉方');
eq(jm.xiong.map(p => JX.PAL[p].dir + ':' + jm.cells[p].marks.join('、')), ['北:五黄杀、月命杀', '南:暗剑杀、月命的杀', '东南:月破、本命的杀', '西北:本命杀'], '戌月凶方（含本命杀、的杀、月命杀）');
eq([dirs(jy.ji), dirs(jy.best), jy.hmAt, jy.phase.k], [['东北', '西南', '西'], ['西南'], 5, '顶点 · 八方塞'], '2026 年盘吉方、本命入中（八方塞）');
eq(jy.xiong.map(p => JX.PAL[p].dir + ':' + jy.cells[p].marks.join('、')), ['南:五黄杀、月命杀', '北:暗剑杀、岁破、月命的杀'], '2026 年盘凶方');
eq([jy.cells[1].marks.includes('本命杀'), Object.values(jy.cells).some(c => c.marks.includes('本命杀') || c.marks.includes('本命的杀'))], [false, false], '本命星入中则无本命杀、本命的杀');
eq([jm.hmAt, jm.phase.k], [6, '充实 · 忙碌'], '戌月月运：本命在乾宫');
const mv = JX.move(jy, jm);
eq([dirs(mv.both), dirs(mv.bestBoth)], [['东北', '西南'], ['西南']], '搬家方位（年月皆吉）');

/* —— 九、白话摘要 —— */
const now = JX.forDate(2026, 11, 3), L = JX.lines(d1, P, { now });
eq(JX.lineText(L.month), '本月（戌月 · 10/8–11/6）你的吉方：东北、东、西南（最大吉方：东、西南）；避开：北（五黄杀、月命杀）、南（暗剑杀、月命的杀）、东南（月破、本命的杀）、西北（本命杀）', '摘要 · 本月');
eq(JX.lineText(L.year), '今年（丙午年）你的吉方：东北、西南、西（最大吉方：西南）；避开：南（五黄杀、月命杀）、北（暗剑杀、岁破、月命的杀）。本命星这一年入中宫，旧说「八方塞」，大动宜慎', '摘要 · 今年');
eq(JX.lineText(L.move), '搬家看年盘与月盘都吉的方位：东北、西南（西南两盘都是最大吉方）；但本命星这一年入中宫，旧说八方塞，宜缓', '摘要 · 搬家');
const L0 = JX.lines(d1, null, { now });
eq(JX.lineText(L0.month), '本月（戌月 · 10/8–11/6）避开：北（五黄杀）、南（暗剑杀）、东南（月破）', '没填生日：只标人人皆忌的方位');
eq(JX.lineText(JX.lines(d2, P, { now }).month).slice(0, 18), '下月（亥月 · 11/7–12/6）', '翻到下一节月叫「下月」');

/* —— 十、本命五黄（1986 丙寅年生）：按土论；本命杀与五黄杀同宫，本命的杀与暗剑杀同宫 —— */
const n5 = JX.natal('1986-06-15T09:00', { tz: 8 });
eq([N(n5.honmei), N(n5.getsumei)], ['五黄', '七赤'], '1986-06-15：本命五黄、月命七赤（寅年午月）');
const j5 = JX.judge(d1.month, { honmei: n5.honmei, getsumei: n5.getsumei });
eq([j5.cells[1].marks, j5.cells[9].marks], [['五黄杀', '本命杀'], ['暗剑杀', '本命的杀']], '本命五黄：本命杀随五黄、本命的杀随暗剑');

/* —— 十一、翻月：按节月跳到交节那天 —— */
const fmt = o => o && `${o.y}-${o.m}-${o.d}`;
eq([fmt(JX.stepMonth(2026, 11, 3, 1)), fmt(JX.stepMonth(2026, 11, 3, -1)), fmt(JX.stepMonth(2026, 11, 7, -1)), fmt(JX.stepMonth(2026, 12, 31, 1))],
  ['2026-11-7', '2026-9-7', '2026-10-8', '2027-1-5'], '‹ › 翻节月（立冬 11/7、白露 9/7、寒露 10/8、小寒 1/5）');

/* —— 十二、全表扫一遍：1901–2099 每个节月 —— */
let sweep = 0, sweepBad = 0;
for (let Y = 1901; Y <= 2099; Y++) for (let mi = 0; mi < 12; mi++) {
  const boards = [JX.yearBoard(Y), JX.monthBoard(Y, mi)];
  for (const B of boards) {
    const seen = new Set(Object.values(B.pan));
    const J0 = JX.judge(B, null);
    const cnt = k => JX.COMPASS.filter(p => J0.cells[p].marks.includes(k)).length;
    const want5 = B.center === 5 ? 0 : 1;
    if (seen.size !== 9 || cnt('五黄杀') !== want5 || cnt('暗剑杀') !== want5 || cnt(B.poName) !== 1) sweepBad++;
    for (let h = 1; h <= 9; h++) {
      const g = ((h + mi + Y) % 9) + 1, Jp = JX.judge(B, { honmei: h, getsumei: g });
      for (const p of JX.COMPASS) {
        const c = Jp.cells[p];
        if ((c.ji && (c.marks.length || c.star === 5 || c.star === h)) || (c.best && !c.ji)) sweepBad++;
      }
      sweep++;
    }
  }
}
eq(sweepBad, 0, `全表 ${sweep} 种人盘组合：吉方无凶、五黄与本命不吉、最大吉方必为吉方`);
eq([JX.STAR.slice(1).every(s => s.sketch.length > 20), Object.keys(JX.PHASE).length], [true, 9], '九星性情与九宫运程齐全');

console.log(bad ? `\n${bad} 项不合，${ok} 项相合` : `\n全部相合（${ok} 项）`);
process.exit(bad ? 1 : 0);
