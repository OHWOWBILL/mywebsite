// 大六壬自检：TZ=Asia/Tokyo node scripts/liuren/check.js
// 对照值都写在下面，不拿程序自己的结果去对自己：
//   · 九宗门逐门手推（每课的四课、取法写在注释里），三传另与 look-fate/liuren-ts-lib 的 720 课表
//     （src/sanchuan.json，Apache-2.0，作者声明严禁商用）核对过——这里只抄各课的对照值，整表不入库。
//   · kentang2017/kinliuren（MIT）README 的示例：驚蟄、己未日、午時。
//   · liuren-ts-lib 测试里的古籍写法：亥将未时丁巳日。
//   · 交气、换日、年命按 /qimen/jieqi.js 与口诀手算。
// 另可对整表：LR_TABLE=<sanchuan.json 路径> 对 720 课三传；LR_KIN=<kinliuren 输出 JSON> 对天将、四课、遁干、六亲。
process.env.TZ = process.env.TZ || 'Asia/Tokyo';
const fs = require('fs');
const LR = require('../../static/liuren/liuren.js');
const QM = require('../../static/qimen/core.js');
const J = require('../../static/qimen/jieqi.js');
const Z = LR.ZHI, G = LR.GAN;
let bad = 0, ok = 0;
const eq = (a, b, what) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '\n    得', JSON.stringify(a), '\n    应', JSON.stringify(b)); }
  else { ok++; console.log('✓', what); }
};
const zs = arr => arr.map(i => Z[i]).join('');
// 某将加某时某日 → [三传, 课名]
const K = (jiang, hour, day, o) => { const c = LR.byJiang(jiang, hour, day, o); return [zs(c.sc), c.name + (c.sub ? '·' + c.sub : '')]; };

/* ================= 一、九宗门逐门（月将加午时） ================= */

// 重审 · 甲子日申将加午：一课辰加甲（甲木克辰土，下贼上），二课午加辰，三课寅加子，四课辰加寅（下贼上）。
// 两处下贼上同为辰 → 一处 → 重审，辰发用；辰上午，午上申。
eq(K('申', '午', '甲子'), ['辰午申', '重审'], '重审：甲子日申将午时 辰午申');
// 元首 · 甲子日戌将加午：一课午加甲，二课戌加午，三课辰加子（辰土克子水，上克下），四课申加辰。只一处上克下。
eq(K('戌', '午', '甲子'), ['辰申子', '元首'], '元首：甲子日戌将午时 辰申子');
// 比用 · 甲子日亥将加午：一课未加甲、二课子加未、三课巳加子皆下贼上；甲阳，三者中只子为阳 → 子发用。
eq(K('亥', '午', '甲子'), ['子巳戌', '比用·知一'], '比用：甲子日亥将午时 子巳戌');
// 涉害·见机 · 己巳日戌将加午：亥加己（土克水）、酉加巳（火克金）两处下贼上，己阴、亥酉俱阴（俱比）；
// 亥临未（季）、酉临巳（孟）→ 取临孟之酉。
eq(K('戌', '午', '己巳'), ['酉丑巳', '涉害·见机'], '涉害见机：己巳日戌将午时 酉丑巳');
// 涉害·察微 · 庚午日申将加午：子加戌、申加午两处下贼上，庚阳、子申俱阳；子临戌（季）、申临午（仲）→ 无孟，取临仲之申。
eq(K('申', '午', '庚午'), ['申戌子', '涉害·察微'], '涉害察微：庚午日申将午时 申戌子');
// 涉害·缀瑕 · 戊辰日丑将加午：子加戊、亥加辰、午加亥三处下贼上，戊阳取子、午（俱比）；子临巳、午临亥都临孟 → 复等，刚日取干上神子。
eq(K('丑', '午', '戊辰'), ['子未寅', '涉害·缀瑕'], '涉害缀瑕：戊辰日丑将午时 子未寅');
// 遥克·蒿矢 · 丙寅日卯将加午：四课寅加丙、亥加寅、亥加寅、申加亥皆无克；亥水遥克丙火 → 神克日。
eq(K('卯', '午', '丙寅'), ['亥申巳', '遥克·蒿矢'], '遥克蒿矢：丙寅日卯将午时 亥申巳');
// 遥克·弹射 · 戊辰日酉将加午：申加戊、亥加申、未加辰、戌加未皆无克；无神克日，戊土遥克亥水 → 日克神。
eq(K('酉', '午', '戊辰'), ['亥寅巳', '遥克·弹射'], '遥克弹射：戊辰日酉将午时 亥寅巳');
// 昴星·虎视转蓬 · 庚午日未将加午：酉加庚、戌加酉、未加午、申加未，无克无遥克，四课俱全；阳日地盘酉上戌为初，中支上未，末干上酉。
eq(K('未', '午', '庚午'), ['戌未酉', '昴星·虎视转蓬'], '昴星虎视：庚午日未将午时 戌未酉');
// 昴星·冬蛇掩目 · 丁丑日酉将加午：戌加丁、丑加戌、辰加丑、未加辰，无克无遥克；阴日天盘酉下午为初，中干上戌，末支上辰。
eq(K('酉', '午', '丁丑'), ['午戌辰', '昴星·冬蛇掩目'], '昴星冬蛇掩目：丁丑日酉将午时 午戌辰');
// 别责（阳）· 戊辰日未将加午：一课午加巳（戊寄巳）与四课午加巳相同，只得三课；无克无遥克 → 干合癸寄丑，丑上寅为初，中末干上午。
eq(K('未', '午', '戊辰'), ['寅午午', '别责'], '别责阳日：戊辰日未将午时 寅午午');
// 别责（阴）· 辛未日酉将加午：一课丑加戌（辛寄戌）与四课丑加戌同；无克无遥克 → 支未三合前一辰亥为初，中末干上丑。
eq(K('酉', '午', '辛未'), ['亥丑丑', '别责'], '别责阴日：辛未日酉将午时 亥丑丑');
// 八专（阳）· 甲寅日戌将加午：午加甲、戌加午两课无克（若论遥克，甲木克戌土当为弹射——八专日不看遥克，与 720 课表同）；
// 干上午顺数三位得申，中末午。
eq(K('戌', '午', '甲寅'), ['申午午', '八专'], '八专阳日：甲寅日戌将午时 申午午');
// 八专（阴）· 丁未日酉将加午：戌加丁、丑加戌两课无克；四课上神丑逆数三位得亥，中末干上戌。
eq(K('酉', '午', '丁未'), ['亥戌戌', '八专'], '八专阴日：丁未日酉将午时 亥戌戌');
// 八专·独足 · 己未日申将加午：酉加己、亥加酉无克；亥逆数三位得酉，恰是干上神 → 三传皆酉。
eq(K('申', '午', '己未'), ['酉酉酉', '八专·独足'], '八专独足：己未日申将午时 酉酉酉');
// 伏吟 · 甲子日：无克，刚日干上寅，寅刑巳、巳刑申。
eq(K('午', '午', '甲子'), ['寅巳申', '伏吟·自任'], '伏吟自任：甲子日 寅巳申');
// 伏吟有克 · 乙丑日：辰加乙（乙木克辰土）有克取克；辰自刑，干上发用 → 以支上丑为中；丑刑戌。
eq(K('午', '午', '乙丑'), ['辰丑戌', '伏吟·自信'], '伏吟有克：乙丑日 辰丑戌');
// 伏吟 · 辛未日：戌加辛无克，柔日支上未，未刑丑、丑刑戌。
eq(K('午', '午', '辛未'), ['未丑戌', '伏吟·自信'], '伏吟自信：辛未日 未丑戌');
// 伏吟杜传 · 壬午日：干上亥自刑 → 中取支上午，午又自刑 → 末取午冲子。
eq(K('午', '午', '壬午'), ['亥午子', '伏吟·自任·杜传'], '伏吟杜传：壬午日 亥午子');
// 伏吟 · 丁卯日：柔日支上卯，卯刑子，子刑回卯 → 末取子冲午。
eq(K('午', '午', '丁卯'), ['卯子午', '伏吟·自信·杜传'], '伏吟刑回初传取冲：丁卯日 卯子午');
// 返吟有克 · 甲子日子将加午：申加甲、子加午上克下，寅加申、午加子下贼上；贼先 → 寅午俱阳俱比 → 寅临申（孟）见机。
eq(K('子', '午', '甲子'), ['寅申寅', '返吟·无依'], '返吟无依：甲子日子将午时 寅申寅');
// 返吟无克 · 丁丑日子将加午：丑加丁、未加丑、未加丑、丑加未皆比和 → 日支丑驿马亥为初，支上未、干上丑。
eq(K('子', '午', '丁丑'), ['亥未丑', '返吟·井栏射'], '返吟井栏射：丁丑日子将午时 亥未丑');
// 涉害「数克」古法 · 丁卯日辰将加午：丑临卯、亥临丑两处下贼上，俱阴。
//   丑（土）自卯顺数至丑：卯木、辰之寄干乙木克之 → 2 重；
//   亥（水）自丑数至亥：丑、辰、巳之寄干戊、未、未之寄干己、戌皆土 → 6 重 → 亥深。孟仲季法则取临仲之丑。
eq([K('辰', '午', '丁卯')[0], K('辰', '午', '丁卯', { shehai: 'shuke' })], ['丑亥酉', ['亥酉未', '涉害']], '涉害两法：丁卯日辰将午时 孟仲季丑亥酉、数克亥酉未');

/* ================= 二、kinliuren README 示例：驚蟄（亥将）己未日午時 ================= */
// 原书输出：三傳 巳虎父丁 / 戌雀兄壬 / 卯玄官乙；四課 一課 子己 貴、二課 巳子 虎、三課 子未 貴、四課 巳子 虎；
// 天地盤 地盤午起，天盤 亥子丑…戌，天將 蛇貴后陰玄常虎空龍勾合雀；日馬巳；神煞 日德寅、日祿午、丁馬巳、天馬申。
// （kinliuren 记作「賊尅·重審」；本站按两处下贼上取比，记作比用，三传相同。）
{
  const c = LR.byJiang('亥', '午', '己未', null, '卯');
  eq(c.chuan.map(x => [Z[x.zhi], LR.GEN_S[x.gen], x.lq[0], G[x.dun]].join('')), ['巳虎父丁', '戌雀兄壬', '卯玄官乙'], 'kinliuren 示例：三传、天将、六亲、遁干');
  eq(c.ke.map(k => Z[k.up] + k.lowName + LR.GEN_S[k.gen]), ['子己贵', '巳子虎', '子未贵', '巳子虎'], 'kinliuren 示例：四课与天将');
  const ps = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];
  eq([ps.map(p => Z[c.sky[p]]).join(''), ps.map(p => LR.GEN_S[c.gen[c.sky[p]]]).join('')], ['亥子丑寅卯辰巳午未申酉戌', '蛇贵后阴玄常虎空龙勾合雀'], 'kinliuren 示例：天地盘与天将（地盘午起）');
  const ss = n => Z[c.shensha.find(s => s.n === n).zhi];
  eq(['驿马', '日德', '日禄', '丁马', '天马'].map(ss), ['巳', '寅', '午', '巳', '申'], 'kinliuren 示例：驿马、日德、日禄、丁马、天马');
}

/* ================= 三、liuren-ts-lib 测试：亥将未时丁巳日 ================= */
// 原测试：天盘未上亥；旬空子丑；驿马亥；旬甲寅；丁马巳；不给月令时天马午（由月将反推寅月），给月令未时天马辰。
{
  const c = LR.byJiang('亥', '未', '丁巳'), c2 = LR.byJiang('亥', '未', '丁巳', null, '未');
  const ss = (x, n) => Z[x.shensha.find(s => s.n === n).zhi];
  eq([Z[c.sky[7]], zs(c.xun.kong), ss(c, '驿马'), c.xun.name, ss(c, '丁马'), ss(c, '天马'), ss(c2, '天马'), c.pillars[3].name],
    ['亥', '子丑', '亥', '甲寅', '巳', '午', '辰', '丁未'], 'liuren-ts-lib 示例：天盘、旬空、驿马、旬、丁马、天马、时柱');
}

/* ================= 四、十二天将：贵人两说、昼夜、顺逆 ================= */
{
  // 甲子日申将加午（昼）：甲戊庚牛羊 → 昼贵丑，丑临亥（地盘亥）→ 顺布：寅蛇卯雀辰合巳勾午龙未空申虎酉常戌玄亥阴子后
  const a = LR.byJiang('申', '午', '甲子');
  eq([Z[a.gui.zhi], Z[a.gui.at], a.gui.shun, a.gui.day, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0].map(b => LR.GEN_S[a.gen[b]]).join('')],
    ['丑', '亥', true, true, '贵蛇雀合勾龙空虎常玄阴后'], '甲日昼贵丑临亥顺布');
  // 甲子日戌将加午（昼）：贵人丑临酉（地盘酉）→ 逆布：子蛇亥雀戌合酉勾申龙未空午虎巳常辰玄卯阴寅后
  const b = LR.byJiang('戌', '午', '甲子');
  eq([Z[b.gui.zhi], Z[b.gui.at], b.gui.shun, [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2].map(z => LR.GEN_S[b.gen[z]]).join('')],
    ['丑', '酉', false, '贵蛇雀合勾龙空虎常玄阴后'], '甲日昼贵丑临酉逆布');
  // 昼夜按占时：申时仍昼（丑），酉时入夜（未）
  const d1 = LR.byJiang('戌', '申', '甲子'), n1 = LR.byJiang('亥', '酉', '甲子');
  eq([Z[d1.gui.zhi], d1.gui.day, Z[n1.gui.zhi], n1.gui.day], ['丑', true, '未', false], '卯至申为昼、酉至寅为夜');
  // 甲羊戊庚牛：甲昼未夜丑、辛昼寅夜午、丁昼亥夜酉
  const yn = (d, h) => Z[LR.byJiang('午', h, d, { gui: 'yangniu' }).gui.zhi];
  eq([yn('甲子', '午'), yn('甲子', '子'), yn('辛未', '午'), yn('辛未', '子'), yn('丁卯', '午'), yn('丁卯', '子')], ['未', '丑', '寅', '午', '亥', '酉'], '甲羊戊庚牛一说');
  eq([Z[LR.byJiang('午', '子', '甲子', { dn: 'day' }).gui.zhi], Z[LR.byJiang('午', '午', '甲子', { dn: 'night' }).gui.zhi]], ['丑', '未'], '昼夜可手动指定');
}

/* ================= 五、交气换将、换日、四柱 ================= */
{
  // 2026 霜降：/qimen/jieqi.js 记 10-23 18:38（日本时间）；前一分仍辰将（天罡），交气即卯将（太冲）
  const sj = J.terms.find(t => t.n === '霜降' && new Date(t.t).getFullYear() === 2026);
  const d = new Date(sj.t);
  eq([d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()], [10, 23, 18, 38], '2026 霜降 10-23 18:38（日本时间）');
  eq([Z[LR.cast(new Date(sj.t - 60000)).jiang], Z[LR.cast(new Date(sj.t)).jiang], LR.cast(new Date(sj.t)).jiangName], ['辰', '卯', '太冲'], '霜降按分换将：辰 → 卯');
  // 雨水换亥将、大寒换子将（2026）
  const at = n => J.terms.find(t => t.n === n && new Date(t.t).getFullYear() === 2026).t;
  eq([Z[LR.cast(new Date(at('雨水') - 60000)).jiang], Z[LR.cast(new Date(at('雨水'))).jiang], Z[LR.cast(new Date(at('大寒'))).jiang]], ['子', '亥', '子'], '雨水亥将、大寒子将');
  // 立冬（节）不换将：立冬前后都是卯将
  eq([Z[LR.cast(new Date(at('立冬') - 60000)).jiang], Z[LR.cast(new Date(at('立冬') + 60000)).jiang]], ['卯', '卯'], '节（立冬）不换将');
  // 23 点换日：2026-11-04 22:59 壬午日亥时，23:00 癸未日子时（时柱壬子）
  const a = LR.cast(new Date(2026, 10, 4, 22, 59)), b = LR.cast(new Date(2026, 10, 4, 23, 0));
  eq([a.day.name, Z[a.hour], b.day.name, Z[b.hour], b.pillars[3].name], ['壬午', '亥', '癸未', '子', '壬子'], '23 点起换日、子时');
  // 四柱与奇门手记同一口径：两百年里抽 3000 个时刻对照
  let same = 0, first = null;
  for (let i = 0; i < 3000; i++) {
    const t = new Date(Date.UTC(1900, 1, 1) + Math.floor((i * 2654435761 % 4294967296) / 4294967296 * (Date.UTC(2100, 10, 1) - Date.UTC(1900, 1, 1))));
    const c = LR.cast(t), q = QM.computeChart(t);
    const x = c.pillars.map(p => p.name).join(''), y = [q.pillars.year, q.pillars.month, q.pillars.day, q.pillars.hour].join('');
    if (x === y) same++; else if (!first) first = t.toISOString() + ' ' + x + ' / ' + y;
  }
  eq([same, first], [3000, null], '四柱与 QM.computeChart 一致（3000 个时刻）');
  eq([LR.cast(new Date(1899, 11, 31, 12)), !!LR.cast(new Date(1900, 0, 1, 0, 30)), !!LR.cast(new Date(2100, 11, 31, 23, 0))], [null, true, true], '可排 1900–2100');
}

/* ================= 六、年命、神煞、旺衰 ================= */
{
  // 2026-11-04 15:30：丙午 戊戌 壬午 戊申，霜降后卯将加申时（r=7）
  const c = LR.cast(new Date(2026, 10, 4, 15, 30), { mingYear: 1990, male: true });
  eq([c.pillars.map(p => p.name).join(' '), Z[c.jiang], Z[c.hour]], ['丙午 戊戌 壬午 戊申', '卯', '申'], '2026-11-04 15:30 四柱、卯将申时');
  // 本命午（1990 庚午）上见午+7=丑；男 37 岁行年：丙寅起顺行 36 位 → 壬寅；女：壬申逆行 36 位 → 丙申
  eq([c.ming.gz, Z[c.ming.up], c.ming.age, c.ming.xing.gz], ['庚午', '丑', 37, '壬寅'], '年命：本命庚午上见丑，男行年壬寅');
  eq(LR.cast(new Date(2026, 10, 4, 15, 30), { mingYear: 1990, male: false }).ming.xing.gz, '丙申', '女行年壬申逆行：丙申');
  // 壬午日（甲戌旬）：旬空申酉；日禄亥、日德亥、羊刃子；驿马申（寅午戌）；丁马丑；月建戌：天马戌、天喜辰（秋）、生气申、死气寅
  const ss = n => Z[c.shensha.find(s => s.n === n).zhi];
  eq([zs(c.xun.kong), ...['日禄', '日德', '羊刃', '驿马', '丁马', '天马', '天喜', '生气', '死气', '华盖', '桃花', '劫煞'].map(ss)],
    ['申酉', '亥', '亥', '子', '申', '丑', '戌', '辰', '申', '寅', '戌', '卯', '亥'], '壬午日神煞与旬空');
  // 三传午丑申（重审：午加壬下贼上）；月建戌土：午火休、丑土旺、申金相；申旬空
  eq([zs(c.sc), c.name, c.chuan.map(x => x.ws).join(''), c.chuan.map(x => x.kong)], ['午丑申', '重审', '休旺相', [false, false, true]], '三传旺衰与旬空');
}

/* ================= 七、遍历 720 课 ================= */
{
  let n = 0, badSc = 0, chain = 0, perm = 0, fu = 0, fan = 0, txt = 0, hourStable = 0;
  const DI = ['贼克', '比用', '涉害', '遥克', '返吟'];
  for (let di = 0; di < 60; di++) for (let r = 0; r < 12; r++) {
    for (const o of [{}, { shehai: 'shuke', gui: 'yangniu' }]) {
      const c = LR.core(di, r, o); n++;
      if (!c.sc.every(x => x >= 0 && x < 12) || !c.name) badSc++;
      if (DI.includes(c.gate) && !(c.gate === '返吟' && c.sub === '井栏射') && (c.sc[1] !== (c.sc[0] + r) % 12 || c.sc[2] !== (c.sc[1] + r) % 12)) chain++;
      if (r === 0 && c.gate === '伏吟') fu++;
      if (r === 6 && c.gate === '返吟') fan++;
    }
    // 同一课换占时，三传不变；天将是十二将的一个排列
    const ref = zs(LR.core(di, r).sc);
    let stable = true;
    for (let h = 0; h < 12; h++) {
      const c = LR.byJiang((h + r) % 12, h, di);
      if (zs(c.sc) !== ref) stable = false;
      if (new Set(c.gen).size !== 12) perm++;
      const t = LR.text(c) + JSON.stringify(LR.plain(c));
      if (/undefined|NaN|null/.test(t)) txt++;
    }
    if (stable) hourStable++;
  }
  eq([n, badSc, chain, fu, fan], [1440, 0, 0, 120, 120], '720 课 × 两种口径：三传齐全、递传无误、伏吟返吟各 60');
  eq([hourStable, perm, txt], [720, 0, 0], '三传只随日与月将差变；天将成排列；文字盘与白话无缺字');
  // 两种涉害法只在涉害课上有出入
  let diff = 0, offShehai = 0;
  for (let di = 0; di < 60; di++) for (let r = 0; r < 12; r++) {
    const a = LR.core(di, r), b = LR.core(di, r, { shehai: 'shuke' });
    if (zs(a.sc) !== zs(b.sc)) { diff++; if (a.gate !== '涉害' && !(a.gate === '返吟' && /涉害|见机|察微|缀瑕/.test(a.why))) offShehai++; }
  }
  eq([diff > 0, offShehai], [true, 0], '孟仲季与数克只在涉害处有别（共 ' + diff + ' 课）');
}

/* ================= 八、整表对照（可选） ================= */
if (process.env.LR_TABLE && fs.existsSync(process.env.LR_TABLE)) {
  // liuren-ts-lib 的 sanchuan.json：日干支 → 按干上神（子至亥）十二课的三传
  const T = JSON.parse(fs.readFileSync(process.env.LR_TABLE, 'utf8'));
  let same = 0; const diff = [];
  for (let di = 0; di < 60; di++) for (let r = 0; r < 12; r++) {
    const day = LR.gzName(di), want = T[day][(LR.JI[di % 10] + r) % 12]['干支组合'], got = zs(LR.core(di, r).sc);
    if (got === want) same++; else diff.push(day + ' 干上' + Z[(LR.JI[di % 10] + r) % 12] + ' 得' + got + ' 表' + want);
  }
  // 表内自相矛盾的三课：丁卯与己卯、辛卯与癸卯乙卯的辰将午时四课取法相同，表却一取亥一取丑；己亥与己卯的戌将午时同理
  eq([same, diff], [717, ['丁卯 干上巳 得丑亥酉 表亥酉未', '辛卯 干上申 得丑亥酉 表亥酉未', '己亥 干上亥 得未亥卯 表亥卯未']], '720 课表（liuren-ts-lib）：717 课相同，余三课表内自相矛盾');
} else console.log('·（未给 LR_TABLE，略过 720 课整表对照）');
if (process.env.LR_KIN && fs.existsSync(process.env.LR_KIN)) {
  // kinliuren 跑出的 60 日 × 12 月将差 × 12 占时（键「日干支|月将差|占时」）：天将（两说）、四课、遁干、六亲、日马
  const KN = JSON.parse(fs.readFileSync(process.env.LR_KIN, 'utf8'));
  const T2S = { 貴: '贵', 龍: '龙', 陰: '阴' }, s2 = ch => T2S[ch] || ch;
  const LQ = { 父: '父母', 兄: '兄弟', 子: '子孙', 妻: '妻财', 財: '妻财', 官: '官鬼', 鬼: '官鬼' };
  let n = 0, g = 0, k4 = 0, dl = 0;
  for (const key in KN) {
    const e = KN[key]; if (e.err) continue;
    const [day, r, h] = key.split('|'); const jiang = (+h + +r) % 12;
    const a = LR.byJiang(jiang, +h, day), b = LR.byJiang(jiang, +h, day, { gui: 'yangniu' }); n++;
    if (e.earth.every((ez, i) => { const p = Z.indexOf(ez); return LR.GEN_S[a.gen[a.sky[p]]] === s2(e.jiang0[i]) && LR.GEN_S[b.gen[b.sky[p]]] === s2(e.jiang1[i]); })) g++;
    if (a.ke.map(x => Z[x.up] + x.lowName + LR.GEN_S[x.gen]).join() === e.sk.map(s => s[0] + s[1] + s2(s[2])).join()) k4++;
    if (e.sc.split('').every((z, i) => { const zi = Z.indexOf(z), d = a.dun[zi]; return (d == null ? '空' : G[d]) === e.dun[i] && a.lq(zi) === LQ[e.lq[i]]; }) && Z[a.shensha.find(s => s.n === '驿马').zhi] === e.ma) dl++;
  }
  eq([g, k4, dl], [n, n, n], `kinliuren 输出（${n} 盘）：天将两说、四课、遁干六亲日马全同`);
} else console.log('·（未给 LR_KIN，略过 kinliuren 整表对照）');

console.log(`\n${bad ? '✗' : '✓'} ${ok} 项通过${bad ? `，${bad} 项不符` : ''}`);
process.exit(bad ? 1 : 0);
