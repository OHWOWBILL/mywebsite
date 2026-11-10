// 大衍自检：node scripts/dayan/check.js
// 一、每一变去策数：第一变 5 或 9，第二三变 4 或 8；二、十六万爻统计 6/7/8/9 ≈ 1/5/7/3（÷16）；三、朱熹变占取辞。
const DY = require('../../static/dayan/dayan.js');
global.window = {};
require('../../static/meihua/data/hexagrams.js'); require('../../static/meihua/data/yao.js');
const H = window.HEXAGRAMS, T = window.YAO_TEXT;
let bad = 0, ok = 0;
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '得', JSON.stringify(a), '应', JSON.stringify(b)); } else { ok++; console.log('✓', what); } };
const outs = [new Set(), new Set(), new Set()], cnt = { 6: 0, 7: 0, 8: 0, 9: 0 }, N = 160000;
for (let i = 0; i < N; i++) { const y = DY.yao(); cnt[y.v]++; y.bians.forEach((b, k) => outs[k].add(b.out)); }
eq(outs.map(s => [...s].sort((a, b) => a - b)), [[5, 9], [4, 8], [4, 8]], '每变去策');
const r = [6, 7, 8, 9].map(v => Math.round(cnt[v] / N * 16 * 10) / 10);
eq(r.map((x, i) => Math.abs(x - [1, 5, 7, 3][i]) < 0.15), [true, true, true, true], '机率 1:5:7:3（实得 ' + r.join(':') + '）');
const rd = v => { const x = DY.read(v, H, T); return [x.ben.name, x.zhi && x.zhi.name, x.items.map(i => i.title), x.main]; };
eq(rd([7, 7, 7, 7, 7, 7]), ['乾为天', null, ['本卦卦辞'], null], '不变');
eq(rd([9, 7, 7, 7, 7, 7]), ['乾为天', '天风姤', ['初九'], null], '一爻变');
eq(rd([9, 9, 7, 7, 7, 7]), ['乾为天', '天山遁', ['九二', '初九'], 0], '二爻变以上爻为主');
eq(rd([9, 9, 9, 8, 8, 8]), ['地天泰', '坤为地', ['本卦卦辞', '之卦卦辞'], null], '三爻变');
eq(rd([9, 9, 9, 9, 8, 8]), ['雷天大壮', '坤为地', ['六五', '上六'], 0], '四爻变占之卦二不变爻，下爻为主');
eq(rd([9, 9, 9, 9, 9, 8]), ['泽天夬', '坤为地', ['上六'], null], '五爻变');
eq(rd([9, 9, 9, 9, 9, 9]), ['乾为天', '坤为地', ['用九'], null], '乾六爻变用九');
eq(rd([6, 9, 6, 9, 6, 9]), ['火水未济', '水火既济', ['之卦卦辞'], null], '他卦六爻变占之卦');
console.log(`\n${ok} 过，${bad} 错`);
process.exit(bad ? 1 : 0);
