// 嫁娶女命专项自检：TZ=Asia/Tokyo node scripts/zeri/nvming-check.js
// 对照：竹林书局《尅择讲义》第二期〈嫁娶碎金赋〉的例子（甲子命禄寅、申为妻妾宫；子女丑日杀翁、未日杀姑；
// 甲女食神丙寅；夫星辛未遇丁丑日为正冲），与常见通书「嫁娶月」表（子午女大利六腊、卯酉女大利正七……）。
process.env.TZ = process.env.TZ || 'Asia/Tokyo';
const NM = require('../../static/zeri/nvming.js');
const TS = require('../../static/fabao/tongshu.js');
const ZR = require('../../static/zeri/zeri.js');
let bad = 0;
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '得', a, '应', b); } };
const ok = (c, what) => { if (!c) { bad++; console.log('✗', what); } };
const Z = '子丑寅卯辰巳午未申酉戌亥', G = '甲乙丙丁戊己庚辛壬癸';
const gz = p => G[p.gan] + Z[p.zhi];

const a = NM.of(1984);                                   // 甲子
eq(a.name, '甲子', '年干支');
eq([gz(a.fuxing), gz(a.tiansi)], ['辛未', '丙寅'], '甲女夫星天嗣');
eq([Z[a.lu], Z[a.fuqi], Z[a.nannv]], ['寅', '申', '戌'], '甲子命禄、夫妻宫、男女宫');
eq([Z[a.weng], Z[a.gu]], ['丑', '未'], '子女杀翁杀姑');
eq(Z[a.maier], '丑', '子女埋儿时');
eq([Z[a.guchen], Z[a.guasu]], ['寅', '戌'], '亥子丑命孤寡');

// 利月表（月支）：子午 大利未丑；卯酉 大利寅申；丑未 大利午子；巳亥 大利亥巳
const li = y => Object.fromEntries(Object.entries(NM.of(y).li).map(([k, v]) => [k, v.map(z => Z[z]).join('')]));
eq(li(1984), { 大利: '丑未', 小利: '寅申', 翁姑: '卯酉', 父母: '辰戌', 妨夫: '巳亥', 妨妇: '子午' }, '子女利月');
eq(li(1987).大利, '寅申', '卯女大利正七');
eq(li(1985).大利, '子午', '丑女大利冬五');
eq(li(1989).大利, '辰戌', '巳女大利三九');
eq(li(1990).大利, '未丑', '午女大利六腊');

// 每个年干的夫星天嗣（五虎遁）
const FX = ['辛未', '庚辰', '癸巳', '壬寅', '乙卯', '甲戌', '丁亥', '丙申', '己酉', '戊午'];
const TSI = ['丙寅', '丁亥', '戊戌', '己酉', '庚申', '辛未', '壬午', '癸巳', '甲辰', '乙卯'];
for (let g = 0; g < 10; g++) { const b = NM.of(1984 + g); eq([gz(b.fuxing), gz(b.tiansi)], [FX[g], TSI[g]], G[g] + '女夫星天嗣'); }

// 日子上的条目：找一个丁丑日，甲子女应得「正冲真夫星辛未」与「杀翁」
let d = new Date(2026, 10, 1), r;
for (let i = 0; i < 60; i++, d.setDate(d.getDate() + 1)) { r = TS.day(d); if (r.gz.name === '丁丑') break; }
eq(r.gz.name, '丁丑', '找到丁丑日');
const its = NM.items(r, 1, a).map(x => x.t);
ok(its.some(t => /正冲真夫星辛未/.test(t)), '丁丑日正冲辛未：' + its.join(' | '));
ok(its.some(t => /杀翁/.test(t)), '丑日杀翁');
ok(its.some(t => /埋儿时/.test(t)), '丑时埋儿');

// 接进择日：同一时刻，嫁娶 + 新娘出生年 应比不填多出女命条目，别的事项不受影响
const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 2, 0);
const e0 = ZR.evalTime(at, { ev: '嫁娶', jp: false, sx: null, ming: null });
const e1 = ZR.evalTime(at, { ev: '嫁娶', jp: false, sx: null, ming: null, bride: 1984 });
const e2 = ZR.evalTime(at, { ev: '面试', jp: false, sx: null, ming: null, bride: 1984 });
eq(e0.nm.length, 0, '不填新娘不算女命');
ok(e1.nm.length >= 3 && e1.total < e0.total, '填了新娘、丁丑日丑时应扣分');
eq(e2.nm.length, 0, '非嫁娶不算女命');

console.log(bad ? `✗ ${bad} 处不符` : '✓ 嫁娶女命全部相符');
process.exit(bad ? 1 : 0);
