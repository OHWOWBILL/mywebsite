// 六爻装卦自检：node scripts/liuyao/check.js
// 八宫六十四卦与梅花的 hexagrams.js 逐卦对照卦名与爻象；纳甲、六亲、世应、伏神、卦身、六神、动变逐项手算核对。
const fs = require('fs'), path = require('path'), vm = require('vm');
const LY = require('../../static/liuyao/liuyao.js');
let bad = 0, ok = 0;
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '得', JSON.stringify(a), '应', JSON.stringify(b)); } else ok++; };
const box = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../static/meihua/data/hexagrams.js'), 'utf8'), box);
const HEX = box.window.HEXAGRAMS;

// —— 八宫：六十四卦齐全、互不重复，卦名与梅花数据一致 ——
const keys = Object.keys(LY.TABLE);
eq(keys.length, 64, '八宫生成 64 卦');
eq(new Set(keys.map(k => LY.TABLE[k].name)).size, 64, '卦名不重');
keys.forEach(k => {
  const t = LY.TABLE[k], h = HEX.find(x => x.lines.join('') === k);
  eq(h && h.name, t.name, '卦名对照 ' + k);
});
// 世应：本宫六、一世初……游魂四、归魂三
eq(['乾为天', '天风姤', '天山遁', '天地否', '风地观', '山地剥', '火地晋', '火天大有'].map(n => { const t = Object.values(LY.TABLE).find(x => x.name === n); return t.shi + '' + t.ying; }),
  ['63', '14', '25', '36', '41', '52', '41', '36'], '乾宫八卦世应');

const yaoTxt = g => g.yao.map(y => y.qin + LY.GAN[y.gan] + LY.ZHI[y.zhi] + LY.WX[y.wx]);
const lines = s => [...s].map(Number);
// —— 乾为天：子孙子水、妻财寅木、父母辰土、官鬼午火、兄弟申金、父母戌土 ——
eq(yaoTxt(LY.zhuang(lines('111111'))), ['子孙甲子水', '妻财甲寅木', '父母甲辰土', '官鬼壬午火', '兄弟壬申金', '父母壬戌土'], '乾为天纳甲六亲');
// —— 坤为地（土宫）：未巳卯丑亥酉 ——
eq(yaoTxt(LY.zhuang(lines('000000'))), ['兄弟乙未土', '父母乙巳火', '官鬼乙卯木', '兄弟癸丑土', '妻财癸亥水', '子孙癸酉金'], '坤为地纳甲六亲');
// —— 地火明夷（坎宫游魂，水宫）：内离卯丑亥、外坤丑亥酉 ——
eq(yaoTxt(LY.zhuang(lines('101000'))), ['子孙己卯木', '官鬼己丑土', '兄弟己亥水', '官鬼癸丑土', '兄弟癸亥水', '父母癸酉金'], '地火明夷纳甲六亲（水宫：卯木为我生之子孙）');

const day = (mz, dg, dz) => ({ monthZhi: LY.ZHI.indexOf(mz), dayGan: LY.GAN.indexOf(dg), dayZhi: LY.ZHI.indexOf(dz) });
// —— 天风姤：缺妻财，伏乾为天二爻甲寅木于亥水子孙之下；卦身阴世从午数至初爻为午，落四爻 ——
const gou = LY.cast([8, 7, 7, 7, 7, 7], day('子', '甲', '子'));
eq(gou.ben.name, '天风姤', '姤');
eq(gou.fu.map(f => f.pos + f.qin + LY.ZHI[f.zhi]), ['2妻财寅'], '姤卦伏神：寅木妻财伏二爻');
eq(gou.fu[0].rel, '飞生伏', '亥水（飞）生寅木（伏）');
eq([LY.ZHI[gou.guaShen.zhi], gou.guaShen.at], ['午', [4]], '姤卦卦身在午（四爻）');
// —— 乾为天世爻阳在六，从子数至六为巳，卦中无巳 ——
const qian = LY.cast([7, 7, 7, 7, 7, 7], day('子', '甲', '子'));
eq([LY.ZHI[qian.guaShen.zhi], qian.guaShen.at], ['巳', []], '乾卦卦身巳，不上卦');
eq(qian.bian, null, '静卦无变卦');
// —— 六神：甲乙青龙、丙丁朱雀、戊勾陈、己螣蛇、庚辛白虎、壬癸玄武，自初爻起 ——
['甲', '丙', '戊', '己', '庚', '壬'].forEach((g, i) => {
  eq(LY.cast([7, 7, 7, 7, 7, 7], day('子', g, '子')).ben.yao[0].shen, ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'][i], g + '日初爻六神');
});
eq(LY.cast([7, 7, 7, 7, 7, 7], day('子', '甲', '子')).ben.yao.map(y => y.shen), ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'], '甲日六神自下而上');

// —— 动变：乾为天初九动 → 天风姤；甲子水化辛丑土，回头克 ——
const q1 = LY.cast([9, 7, 7, 7, 7, 7], day('午', '丙', '寅'));
eq(q1.bian.name, '天风姤', '乾初爻动之姤');
eq(q1.bian.yao[0].qin + LY.ZHI[q1.bian.yao[0].zhi], '父母丑', '变爻六亲随本卦乾宫（丑土生金为父母）');
eq(q1.ben.yao[0].hua.includes('回头克'), true, '子水化丑土回头克');
eq(q1.ben.yao[0].marks.includes('月破'), true, '午月子爻月破');
// —— 震为雷六二动 → 雷泽归妹；庚寅木化丁卯木，化进神 ——
const zhen = LY.cast([7, 6, 8, 7, 8, 8], day('寅', '甲', '辰'));
eq([zhen.ben.name, zhen.bian.name], ['震为雷', '雷泽归妹'], '震之归妹');
eq(zhen.ben.yao[1].hua.includes('化进神'), true, '寅化卯进神');
eq(zhen.ben.yao[1].marks.includes('临月建'), true, '寅月寅爻临月建');
// —— 暗动与日破：静爻逢日冲，旺相为暗动，休囚为日破 ——
const k = LY.cast([7, 7, 7, 7, 7, 7], day('申', '甲', '午'));   // 申月金旺水相木死；日午冲子
eq(k.ben.yao[0].marks.includes('暗动'), true, '申月子水相，逢午日冲为暗动');
const k2 = LY.cast([7, 7, 7, 7, 7, 7], day('午', '甲', '午'));
eq(k2.ben.yao[0].marks.includes('日破'), true, '午月子水囚，逢午日冲为日破');
// 旬空：甲子日戌亥空
eq(LY.cast([7, 7, 7, 7, 7, 7], day('子', '甲', '子')).ben.yao[5].marks.includes('旬空'), true, '甲子旬戌空');
// 互卦：乾为天互乾，天风姤互乾
eq(gou.hu.name, '乾为天', '姤互乾');

// —— 报数起卦：上一乾、下八坤、动爻九除六余三 ——
eq(LY.cast(LY.fromNumbers(1, 8)).ben.name, '天地否', '报数 1、8 得否');
eq(LY.fromNumbers(1, 8).map(n => n === 6 || n === 9), [false, false, true, false, false, false], '动三爻');
eq(LY.fromNumbers(3, 5, 12)[5] === 6 || LY.fromNumbers(3, 5, 12)[5] === 9, true, '第三数十二，余零作六，上爻动');

// —— 六冲卦十、六合卦八 ——
const chList = t => Object.values(LY.TABLE).filter(x => LY.chongHe(LY.zhuang(x.lines)) === t).map(x => x.name).sort();
eq(chList('六冲'), ['乾为天', '坤为地', '震为雷', '巽为风', '坎为水', '离为火', '艮为山', '兑为泽', '天雷无妄', '雷天大壮'].sort(), '六冲卦：八纯卦与无妄、大壮');
eq(chList('六合'), ['天地否', '地天泰', '雷地豫', '地雷复', '水泽节', '泽水困', '山火贲', '火山旅'].sort(), '六合卦：否泰豫复节困贲旅');
// —— 小六壬：正月初一子时大安；三月初五卯时：月上速喜，日上大安，时上赤口 ——
eq(LY.xiaoLiuRen(1, 1, 1).hour, '大安', '小六壬 正月初一子时');
eq(LY.xiaoLiuRen(3, 5, 4), { month: '速喜', day: '大安', hour: '赤口', idx: 3 }, '小六壬 三月初五卯时');

// —— 用神 ——
eq(LY.yongShen(qian, '妻财'), { yong: '妻财', yongWx: 0, yuan: '子孙', ji: '兄弟', chou: '父母' }, '乾宫求财：财木，原神子孙水、忌神兄弟金、仇神父母土');

console.log(bad ? `\n${bad} 项不合，${ok} 项相合` : `全部相合（${ok} 项）`);
process.exit(bad ? 1 : 0);
