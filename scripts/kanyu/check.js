// 堪舆核心自检：node scripts/kanyu/check.js
// 八运各盘取通行玄空书里公认的结论逐格核对；流年流月、命卦、游年、度数分金逐项核对。
const KY = require('../../static/kanyu/kanyu.js');
let bad = 0, ok = 0;
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '得', JSON.stringify(a), '应', JSON.stringify(b)); } else ok++; };
const grid = g => [4, 9, 2, 3, 5, 7, 8, 1, 6].map(p => g[p]).join('');      // 洛书九宫，巽离坤 / 震中兑 / 艮坎乾
const ge = c => c.ge.map(x => x.k);

// —— 八运子山午向（下卦）：运盘八入中；山星四顺飞、向星三逆飞；向首离宫山八向八，双星到向 ——
const c1 = KY.chart('子', 8, false);
eq(grid(c1.yunPan), '735681249', '八运运盘（巽七 离三 坤五 / 震六 中八 兑一 / 艮二 坎四 乾九）');
eq([c1.sa.center, c1.sa.dir, c1.xa.center, c1.xa.dir], [4, 1, 3, -1], '山星四（巽阳）顺、向星三（卯阴）逆');
eq(grid(c1.shan), '381246795', '山星盘（四入中顺飞：巽三 离八 坤一 / 震二 中四 兑六 / 艮七 坎九 乾五）');
eq(grid(c1.xiangPan), '486531972', '向星盘（三入中逆飞：巽四 离八 坤六 / 震五 中三 兑一 / 艮九 坎七 乾二）');
eq([c1.shan[9], c1.xiangPan[9]], [8, 8], '向首离宫山八向八');
eq(ge(c1)[0], '双星到向', '八运子山午向双星到向');
// —— 八运午山子向：双星到坐 ——
eq(ge(KY.chart('午', 8))[0], '双星到坐', '八运午山子向双星到坐');
// —— 八运丑山未向、未山丑向：旺山旺向 ——
eq(ge(KY.chart('丑', 8))[0], '旺山旺向', '八运丑山未向旺山旺向');
eq(ge(KY.chart('未', 8))[0], '旺山旺向', '八运未山丑向旺山旺向');
// —— 八运艮山坤向：上山下水，向首运星五、坤阳顺飞，向星伏吟 ——
const c5 = KY.chart('艮', 8);
eq(ge(c5)[0], '上山下水', '八运艮山坤向上山下水');
eq(ge(c5).includes('向星伏吟'), true, '艮山坤向向星伏吟（五入中顺飞）');
eq(ge(KY.chart('未', 8)).includes('山星反吟'), true, '未山（阴）坐上运星五，逆飞山星反吟');
// —— 九运：午山子向，坐上运星四、巽阳顺飞；子上运星五、子阴逆飞 → 双星到向？逐格算 ——
const c9 = KY.chart('午', 9);
eq([c9.yunPan[9], c9.yunPan[1], c9.sa.center, c9.sa.dir, c9.xa.center, c9.xa.dir], [4, 5, 4, 1, 5, -1], '九运午山子向起星');
// —— 替卦：用替星入中，顺逆依原山 ——
const t1 = KY.chart('子', 8, true);
eq([t1.sa.via.n, t1.sa.center, t1.sa.dir, t1.xa.via.n, t1.xa.center, t1.xa.dir], ['巽', 6, 1, '卯', 2, -1], '八运子山替卦：巽替武曲六顺，卯替巨门二逆');
eq(KY.chart('艮', 8, true).xa.center, 5, '五黄无替');
// —— 挨星诀二十四山各有替星 ——
eq(KY.SHAN.every(s => [1, 2, 6, 7, 9].includes(KY.TI[s.n])), true, '二十四山皆有替星');
// —— 合十、三般卦：凡标出者九宫皆合 ——
for (let n = 1; n <= 9; n++) for (const s of KY.SHAN) for (const ti of [false, true]) {
  const c = KY.chart(s.n, n, ti);
  if (ge(c).includes('向星合十')) for (let p = 1; p <= 9; p++) if (c.xiangPan[p] + c.yunPan[p] !== 10) { eq(false, true, '向星合十 ' + s.n + n); break; }
  if (ge(c).includes('山星合十')) for (let p = 1; p <= 9; p++) if (c.shan[p] + c.yunPan[p] !== 10) { eq(false, true, '山星合十 ' + s.n + n); break; }
  ok++;
}
// 每运每山都排得出一种旺星格
for (let n = 1; n <= 9; n++) KY.SHAN.forEach(s => { const k = ge(KY.chart(s.n, n))[0]; if (!['旺山旺向', '上山下水', '双星到向', '双星到坐', '旺星'].includes(k)) eq(k, '格', '格局 ' + s.n + n); else ok++; });

// —— 元运 ——
eq([KY.yunOf(1990), KY.yunOf(2023), KY.yunOf(2024), KY.yunOf(2026), KY.yunOf(2044)], [7, 8, 9, 9, 1], '三元九运');
// —— 流年、流月 ——
eq([KY.yearStar(2024), KY.yearStar(2025), KY.yearStar(2026), KY.yearStar(2027), KY.yearStar(1984), KY.yearStar(1864)], [3, 2, 1, 9, 7, 1], '流年紫白（下元甲子七赤、上元甲子一白）');
eq([KY.monthStar(2026, 0), KY.monthStar(2026, 9), KY.monthStar(2024, 0), KY.monthStar(2025, 0)], [8, 8, 5, 2], '流月：子午卯酉年正月八白、辰戌丑未五黄、寅申巳亥二黑；丙午十月八白');
// —— 命卦 ——
const mg = (y, m) => KY.mingGua(y, m).name;
eq([mg(1984, 1), mg(1984, 0), mg(1990, 1), mg(1990, 0), mg(2000, 1), mg(2000, 0), mg(1995, 1), mg(1995, 0)], ['兑', '艮', '坎', '艮', '离', '乾', '坤', '坎'], '三元命卦（男五寄坤、女五寄艮）');
// —— 游年：坎命 生气巽 天医震 延年离 伏位坎 祸害兑 六煞乾 五鬼艮 绝命坤 ——
const y1 = KY.youNian(1);
eq([4, 3, 9, 1, 7, 6, 8, 2].map(p => y1[p].name), ['生气', '天医', '延年', '伏位', '祸害', '六煞', '五鬼', '绝命'], '坎命游年');
const y6 = KY.youNian(6);
eq([7, 8, 2, 6, 4, 1, 3, 9].map(p => y6[p].name), ['生气', '天医', '延年', '伏位', '祸害', '六煞', '五鬼', '绝命'], '乾命游年');
// 东四命四吉方皆在东四宫
[1, 3, 4, 9].forEach(g => { const y = KY.youNian(g); eq([1, 3, 4, 9].every(p => y[p].luck === '吉'), true, KY.GUA_NAME[g] + '命东四宫皆吉'); });
// —— 度数分金 ——
const at = d => { const r = KY.shanAt(d); return r.shan.n + r.kind; };
eq([at(0), at(4), at(7), at(352), at(23), at(180), at(315), at(337.6)], ['子正', '子兼', '子小空亡', '壬小空亡', '丑大空亡', '午正', '乾正', '壬大空亡'], '度数定山与兼、空亡');

console.log(bad ? `\n${bad} 项不合，${ok} 项相合` : `全部相合（${ok} 项）`);
process.exit(bad ? 1 : 0);
