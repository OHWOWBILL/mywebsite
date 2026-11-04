// 姓名学自检：node scripts/xingming/check.js
// 对照值都是手写的（康熙笔画逐字写明部首原画 + 部外画），不拿程序自己的结果去对自己。
//   一、康熙笔画：常见姓（劉15 張11 陳16 黃12 林8 王4 李7 吳7 趙14 周8 …），简体先转繁体；
//   二、部首按原字：氵4 扌4 忄4 艹6 辶7 阝左8 阝右7 王旁5 礻5 衤6 ⺼6 犭4 罒6，月亮的月仍 4；
//   三、数字按数意：一1 … 十10，百6 千3 萬15；
//   四、五格公式：单姓单名、单姓双名、复姓单名、复姓双名，外格四种写法与「天＋地－人」一致，过 81 减 80；
//   五、81 数理与三才 125 种齐全；六、拆姓名（复姓、空格手分）；七、候选名排序；八、数据文件完整。
const path = require('path');
const XM = require('../../static/xingming/xingming.js');
const KX = require('../../static/xingming/data/kangxi.js');
const STS = require('../../static/xingming/data/st.js');

let bad = 0, ok = 0;
const eq = (a, b, what) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '\n    得', JSON.stringify(a), '\n    应', JSON.stringify(b)); }
  else { ok++; console.log('✓', what); }
};
const N = c => { const s = XM.strokesOf(c); return s ? s.n : null; };
const T = (c, sur) => XM.tradOf(c, sur)[0];
// 输入一个（简或繁）字、按名中字处理后所得 [繁体, 笔画]
const one = (c, sur) => { const R = XM.analyze(sur ? [c] : ['王'], sur ? ['一'] : [c]); const x = R.chars[sur ? 0 : 1]; return [x.t, x.n]; };

/* —— 一、康熙笔画：常见姓 ——
   劉 刀部13（2+13）、張 弓部8（3+8）、陳 阜部8（8+8）、黃 黃部0（12）、林 木部4（4+4）、
   王 玉部-1（5-1，王字本身 4 画）、李 木部3（4+3）、吳 口部4（3+4）、趙 走部7（7+7）、周 口部5（3+5） */
const SURN = { 劉: 15, 張: 11, 陳: 16, 黃: 12, 林: 8, 王: 4, 李: 7, 吳: 7, 趙: 14, 周: 8 };
eq(Object.keys(SURN).map(c => c + N(c)).join(' '), Object.entries(SURN).map(([c, n]) => c + n).join(' '), '常见姓康熙笔画（繁体直查）：劉15 張11 陳16 黃12 林8 王4 李7 吳7 趙14 周8');
eq('刘张陈黄林王李吴赵周'.split('').map(c => one(c, true).join('')).join(' '), '劉15 張11 陳16 黃12 林8 王4 李7 吳7 趙14 周8', '简体输入先转繁体再查（刘→劉 15、陈→陳 16、吴→吳 7、赵→趙 14）');
eq('杨孙郑冯萧叶华邓罗谢'.split('').map(c => one(c, true).join('')).join(' '), '楊13 孫10 鄭19 馮12 蕭18 葉15 華14 鄧19 羅20 謝17', '又十个姓：楊 孫 鄭 馮 蕭 葉 華 鄧 羅 謝');
// 姓名用字取舍：这些字作姓时本身就是正字
eq('后余于范郁涂游岳党咸干朴种'.split('').map(c => one(c, true).join('')).join(' '), '后6 余7 于3 范11 郁13 涂11 游13 岳8 党10 咸9 干3 朴6 种9', '作姓不转：后6（非後9）余7 于3 范11 郁13 涂11 游13 岳8 党10 咸9 干3 朴6 种9');
eq(['范', '朴', '种'].map(c => one(c, false).join('')).join(' '), '範15 樸16 種14', '作名照常转：範15 樸16 種14');
eq('钟万沈姜艳'.split('').map(c => one(c, true).join('')).join(' '), '鍾17 萬15 沈8 姜9 艷24', '钟→鍾17、万→萬15、沈 姜不转、艳取艷24');
eq([XM.tradOf('后', true), XM.tradOf('杰', false), XM.tradOf('肖', true)], [['后', '後'], ['傑', '杰'], ['肖', '蕭']], '有几种繁体的字给出候选，可在页上改选');
// 校订与另说（见 data/kangxi.js 文件头）
eq([N('熙'), XM.strokesOf('熙').alt, N('曹'), XM.strokesOf('曹').alt, N('姬'), N('妍'), N('羲')], [13, 14, 10, 11, 9, 7, 17], '校订字：熙13（另说14）、曹10（另说11）、姬9、妍7、羲17');
eq([XM.strokesOf('張').alt, XM.strokesOf('劉').alt], [undefined, undefined], '无异说的字不标另说');

/* —— 二、部首按原字 —— 每字：部首原画 + 部外画 */
const RAD = [
  ['氵＝水4', { 江: 7, 河: 9, 清: 12, 洪: 10 }],   // 4+3 4+5 4+8 4+6
  ['扌＝手4', { 振: 11, 扶: 8 }],                  // 4+7 4+4
  ['忄＝心4', { 情: 12, 性: 9 }],                  // 4+8 4+5
  ['艹＝艸6', { 英: 11, 華: 14, 花: 10 }],          // 6+5 6+8 6+4
  ['辶＝辵7', { 連: 14, 進: 15, 道: 16, 達: 16 }],  // 7+7 7+8 7+9 7+9
  ['阝在左＝阜8', { 陳: 16, 陽: 17, 陸: 16, 院: 15 }],  // 8+8 8+9 8+8 8+7
  ['阝在右＝邑7', { 鄭: 19, 郭: 15, 鄧: 19, 都: 16 }],  // 7+12 7+8 7+12 7+9
  ['王旁＝玉5', { 玲: 10, 珍: 10, 琳: 13, 瑤: 15 }],    // 5+5 5+5 5+8 5+10
  ['礻＝示5', { 福: 14, 祥: 11, 禮: 18 }],              // 5+9 5+6 5+13
  ['衤＝衣6', { 裕: 13, 被: 11, 補: 13 }],              // 6+7 6+5 6+7
  ['月作肉旁＝肉6', { 肖: 9, 胡: 11, 育: 10, 能: 12 }],  // 6+3 6+5 6+4 6+6
  ['月亮之月仍4', { 朋: 8, 期: 12, 服: 8 }],            // 4+4 4+8 4+4
  ['犭＝犬4', { 狗: 9, 獅: 14, 猛: 12 }],               // 4+5 4+10 4+8
  ['罒＝网6', { 羅: 20, 罕: 9, 置: 14 }]                // 6+14 6+3 6+8
];
RAD.forEach(([rule, m]) => eq(Object.keys(m).map(c => c + N(c)).join(' '), Object.entries(m).map(([c, n]) => c + n).join(' '), '部首 ' + rule + '：' + Object.keys(m).join('')));
eq('江河清连进阳陆郑邓玲琳福祥罗猛'.split('').map(c => one(c, false).join('')).join(' '), '江7 河9 清12 連14 進15 陽17 陸16 鄭19 鄧19 玲10 琳13 福14 祥11 羅20 猛12', '简体照样按原字部首：连→連14、阳→陽17、罗→羅20');
eq('红铭语门页饭贵车'.split('').map(c => one(c, false).join('')).join(' '), '紅9 銘14 語14 門8 頁9 飯13 貴12 車7', '简化偏旁随繁体还原：纟→糸6、钅→金8、讠→言7、门8、页9、饣→食9、贝7、车7');

/* —— 三、数字 —— */
eq('一二三四五六七八九十'.split('').map(N), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], '一至十按数意：四作4、五作5、六作6、七作7、八作8、九作9、十作10');
eq('四五六七八九十'.split('').map(c => XM.strokesOf(c).kx), [5, 4, 4, 2, 2, 2, 2], '（康熙原书：四5 五4 六4 七2 八2 九2 十2）');
eq([N('百'), N('千'), N('萬'), one('万', false).join('')], [6, 3, 15, '萬15'], '百6、千3、萬15（万→萬）照康熙笔画');

/* —— 四、五格 —— */
const G5 = R => ['tian', 'ren', 'di', 'wai', 'zong'].map(k => R.ge[k].n);
eq(G5(XM.analyze('劉', '德華')), [16, 30, 29, 15, 44], '单姓双名 劉德華（15·15·14）：天16＝15+1 人30 地29 外15＝14+1 总44');
eq(G5(XM.analyze('刘', '德华')), [16, 30, 29, 15, 44], '简体刘德华同上');
eq(G5(XM.analyze('王', '菲')), [5, 18, 15, 2, 18], '单姓单名 王菲（4·14）：天5 人18 地15＝14+1 外2 总18');
eq(G5(XM.analyze('歐陽', '娜娜')), [32, 27, 20, 25, 52], '复姓双名 歐陽娜娜（15·17·10·10）：天32 人27 地20 外25＝15+10 总52');
eq(G5(XM.analyze('司馬', '遷')), [15, 29, 20, 6, 34], '复姓单名 司馬遷（5·10·19）：天15 人29 地20＝19+1 外6＝5+1 总34');
eq(G5(XM.analyze('诸葛', '亮')), [31, 24, 10, 17, 40], '复姓单名 诸葛亮（諸16·葛15·亮9）：天31 人24 地10 外17 总40');
// 外格四种写法与「天＋地－人」处处一致；总格不含假数
let wOK = true, zOK = true;
for (let a = 1; a <= 30; a++) for (let b = 0; b <= 30; b++) for (let c = 1; c <= 30; c++) for (let d = 0; d <= 30; d += 3) {
  const S = b ? [a, b] : [a], G = d ? [c, d] : [c], w = XM.wuge(S, G);
  const want = !b && !d ? 2 : !b ? d + 1 : !d ? a + 1 : a + d;
  if (w.wai !== want) wOK = false;
  if (w.zong !== a + b + c + d) zOK = false;
}
eq([wOK, zOK], [true, true], '外格：单姓单名恒2、单姓双名＝名末+1、复姓单名＝姓首+1、复姓双名＝姓首+名末；总格不加假数');
eq([82, 81, 160, 161, 2].map(XM.shuliNum), [2, 81, 80, 81, 2], '数过81减80再查：82→2、160→80、161→81');
eq([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 23, 30].map(XM.wxOf).join(''), '木木火火土土金金水水火水', '数的五行看尾数：1、2木 3、4火 5、6土 7、8金 9、0水');
eq([XM.analyze('劉', '德華').sancai.key, XM.analyze('王', '菲').sancai.key], ['土水水', '土金土'], '三才：劉德華 土水水、王菲 土金土');
eq([XM.rel('木', '火'), XM.rel('火', '木'), XM.rel('木', '土'), XM.rel('土', '木'), XM.rel('水', '水')], ['生', '被生', '克', '被克', '比和'], '五行生克');

/* —— 五、81 数理、三才 —— */
const SL = XM.SHULI.slice(1);
eq([SL.length, SL.every(e => ['吉', '半吉', '凶'].includes(e[0]) && e[1].length >= 8), new Set(SL.map(e => e[1])).size], [81, true, 81], '81 数理齐全：每数有吉凶与一行白话，白话不重');
const LV = lv => SL.map((e, i) => e[0] === lv ? i + 1 : 0).filter(Boolean);
eq(LV('吉'), [1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 18, 21, 23, 24, 25, 29, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52, 57, 61, 63, 65, 67, 68, 81], '吉数 34 个');
eq(LV('半吉'), [17, 27, 30, 38, 49, 50, 51, 55, 58, 71, 73, 75, 77], '半吉 13 个');
eq(LV('凶').length, 34, '凶数 34 个');
const SC = Object.keys(XM.SANCAI), W5 = '木火土金水';
eq([SC.length, [...W5].every(a => [...W5].every(b => [...W5].every(c => XM.SANCAI[a + b + c])))], [125, true], '三才 125 种齐全');
eq(Object.values(XM.SANCAI).every(v => ['大吉', '吉', '半吉', '凶', '大凶'].includes(v)), true, '三才五档：大吉、吉、半吉、凶、大凶');
eq(['木木木', '木火土', '水木木', '金金火', '水火火', '木金木', '土土土', '木木水'].map(k => XM.SANCAI[k]), ['大吉', '大吉', '大吉', '凶', '大凶', '大凶', '大吉', '半吉'], '三才抽查：木木木 木火土 水木木 大吉，金金火 凶，水火火 木金木 大凶，木木水 半吉');

/* —— 六、拆姓名 —— */
const sp = s => { const p = XM.split(s); return p.err ? 'ERR' : p.sur.join('') + '|' + p.giv.join('') + '|' + p.how; };
eq(['张伟', '欧阳娜娜', '歐陽娜娜', '司马迁', '诸葛亮', '張 子涵', '欧 阳娜', '张简志明', '张简明', '上官婉儿', '东方'].map(sp),
  ['张|伟|dan', '欧阳|娜娜|fu', '歐陽|娜娜|fu', '司马|迁|fu', '诸葛|亮|fu', '張|子涵|sep', '欧|阳娜|sep', '张简|志明|fu4', '张|简明|dan', '上官|婉儿|fu', '东方||fu'],
  '拆姓名：认复姓（简繁皆可）、空格手分、台湾双姓只认四字、只填复姓也认');
eq([XM.split('爱新觉罗').err.length > 0, XM.split('张小明明').err.length > 0, XM.split('abc').err], [true, true, '只认汉字'], '认不出的四字名、非汉字给提示');
eq(XM.analyzeName('Mary 李').ok, false, '缺名不排');
eq(XM.analyzeName('佐々木').chars.map(x => x.t).join(''), '佐佐木', '叠字符号照前一字');

/* —— 七、候选名 —— */
const cs = XM.compare('子涵 梓萱，一诺、浩然 子涵 x 欧阳娜娜', ['張']);
const G3 = { 吉: 2, 半吉: 1, 凶: 0 }, S5 = { 大吉: 4, 吉: 3, 半吉: 2, 凶: 1, 大凶: 0 };
eq(cs.map(r => r.name), cs.slice().sort((a, b) => b.score - a.score || G3[b.ge.ren.lv] - G3[a.ge.ren.lv] || G3[b.ge.zong.lv] - G3[a.ge.zong.lv] || S5[b.sancai.lv] - S5[a.sancai.lv] || a.order - b.order).map(r => r.name),
  '候选按参考分从高到低排；同分看人格、总格、三才，再按输入次序');
eq([cs.length, cs.some(r => r.name === '欧阳娜娜'), cs.filter(r => r.name === '張子涵').length], [5, true, 1], '空格逗号顿号都能分；三字以上当全名；重复的只算一次');
const score = R => Math.round(30 * { 吉: 1, 半吉: .5, 凶: 0 }[R.ge.ren.lv] + 20 * { 吉: 1, 半吉: .5, 凶: 0 }[R.ge.di.lv] + 20 * { 吉: 1, 半吉: .5, 凶: 0 }[R.ge.zong.lv] + 10 * { 吉: 1, 半吉: .5, 凶: 0 }[R.ge.wai.lv] + 20 * { 大吉: 1, 吉: .8, 半吉: .5, 凶: .2, 大凶: 0 }[R.sancai.lv]);
eq(cs.every(r => r.score === score(r)), true, '参考分＝人格30＋地格20＋总格20＋外格10＋三才20');
const W = XM.analyze('王', '菲'), L = XM.analyze('劉', '德華');
eq([W.score, W.grade, L.score, L.grade], [90, '上佳', 45, '偏弱'], '王菲 90 上佳（外格2凶，余皆吉、三才大吉）；劉德華 45 偏弱');
// 手改笔画、改选繁体
const H = XM.analyze(['后'], ['羿'], { pick: { 后: '後' } }), F2 = XM.analyze(['刘'], ['备'], { fix: { 劉: 16 } });
eq([H.chars[0].t, H.chars[0].n, F2.chars[0].n, F2.chars[0].src, F2.ge.tian.n], ['後', 9, 16, 'user', 17], '可改选繁体（后→後9），可手改笔画（劉改16，天格随之为17）');

/* —— 八、数据文件 —— */
eq([KX.ALPH.length, new Set(KX.ALPH).size, KX.kx.length, [...KX.kx].filter(c => c !== '.').length], [64, 64, 0x9FFF - 0x4E00 + 1, 20717], 'kangxi.js：基本区 20,992 位，有数 20,717 字');
eq(Object.values(KX.fix).concat(Object.values(KX.alt), Object.values(KX.more), Object.values(KX.est)).every(n => Number.isInteger(n) && n > 0 && n < 70), true, 'fix / alt / more / est 的数都合理');
const stToks = STS.split(' ').map(t => Array.from(t));
const noStroke = stToks.filter(t => !t.slice(1).some(x => XM.strokesOf(x)));
eq([stToks.length, noStroke.length], [4012, 0], 'OpenCC 简繁表 4012 条，每个简体字转繁后都查得到笔画');
eq(Object.keys(KX.fix).every(c => KX.alt[c] != null), true, '校订字都留了「另说」');

console.log(bad ? `\n${bad} 项不合，${ok} 项相合` : `\n全部相合（${ok} 项）`);
process.exit(bad ? 1 : 0);
