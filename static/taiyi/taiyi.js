/* =========================================================
   太乙神数 · 年计 月计 日计 时计 —— 只管算，不碰页面
   ---------------------------------------------------------
   口径（出处见 /taiyi/ 页面「口径」一栏与 scripts/taiyi/check.js）
     · 积年：依《太乙金镜式经》（唐王希明，四库全书文渊阁本）卷一「推上元积年」：
       上元甲子至唐开元十二年甲子（724）积 1,937,281 算，往后每年加一 → 积年 = 公元年 + 1,936,557。
       《太乙统宗宝鉴》积年 = 公元年 + 10,153,917，两者相差 8,217,360 = 360 × 22,826，
       所以纪、元、局完全相同（kintaiyi 的「金镜」「统宗」两式同此）。年以立春换（节气年）。
     · 积月：同经卷一李淳风月计法「五年六十个月……若有闰月只以逐月节气时刻为正」：
       积月 = (积年 − 1) × 12 + 2 + 节月序（寅月 1 … 丑月 12），月以「节」换，精确到分。
     · 积日：同经卷一「梁天监三年六月八日凡得七亿七百五十万一千六十一日」（第五纪，局四十五，
       太乙在八宫、和德为天目）。该日为儒略日 1,905,331（甲申），故 积日 = 儒略日数 + 705,595,730；
       积日除六十的余数恰是日干支序（甲子 = 1）。与 kintaiyi 现行版（708,011,105 @ 1900-12-21）同。
       夜 23 点起算次日（子初换日）。
     · 积时：积时 = (积日 − 1) × 12 + 时辰序（子 1 … 亥 12）。冬至后阳遁、夏至后阴遁（按交气时刻）。
       年计、月计、日计皆阳遁（经卷一：「命起一宫顺行」）。
     · 局：积数除 360（周纪法）余数，再除 72（元法）余数为局（余 0 作 72）；
       纪 = 第 ⌈余/60⌉ 纪；元按 72 一元：甲子、丙子、戊子、庚子、壬子。
     · 太乙：每宫三局（年计即三年），阳遁一、二、三、四、六、七、八、九宫顺行，阴遁自九宫逆行，不入中五。
       宫数用太乙九宫：一乾、二离、三艮、四震、五中、六兑、七坤、八坎、九巽。
     · 文昌（天目、主目）：阳遁起武德（申）、阴遁起吕申（寅），顺行十六神，
       阳遁遇阴德（乾）、大武（坤）重留一局，阴遁遇大炅（巽）、和德（艮）重留一局，十八局一周。
     · 计神：阳遁起寅、阴遁起申，按太岁支逆行（子年在寅……）。合神：阳遁取太岁之六合（子丑、寅亥……）；
       阴遁随计神对冲一宫（子未、寅巳……），依经卷一时计例「阴遁……午为计神，巳为合神」（寅时）。
       「太岁」在年计是年支，月计是月建，日计是日辰，时计是时支。
     · 始击（客目）：「以计神加和德，文昌所临即始击」= 文昌 + (艮 − 计神)。
     · 定目：「以合神加太岁，文昌所临即定计目」= 文昌 + (太岁 − 合神)。
     · 算：从目所在起，顺行（子→丑→艮→寅→卯……）累加所经各宫之数，至太乙宫止（不计太乙宫）；
       目在间神（十二支中的丑寅辰巳未申戌亥）先得一算；目与太乙同宫，算即本宫之数。
       主算看文昌，客算看始击，定算看定目。
     · 大将：算的个位所在之宫；算满十（十、二十、三十、四十）取其十位（经卷二「若得十置一」，
       《淘金歌》晋隆安元年「主算得三十，主大将三宫」）。参将：大将数乘三取个位。
     · 阴阳和：两位数的十位与个位一奇一偶为和（上和 14、18；次和 23、29、32；下和 12、16、27、34、38，
       经卷二王希明说），单数及同奇同偶者不和（纯阳、杂阳、纯阴、杂阴、重阳、重阴之名同出卷二）。
       长短：满十为长、不满十为短。三才：不满十无天，个位不满五无地，个位为零无人，十以上且个位过五为三才足数。
     · 格局：经卷三掩、击、迫、囚、关、格、对、四郭固、四郭杜、执提、提挟诸法（逐条见 GEJU_NOTE）。
       十六神上相邻一位为「辰」、相邻一宫为「宫」；顺行在前为外、在后为内。
     · 八门：直使门加太乙宫，八门依开休生伤杜景死惊顺布。年、月、日计直使：积数除 240 后每 30 换一门
       （经卷四）；时计依卷一：阳遁开、生、惊、休，阴遁杜、死、伤、景，三十时一移。
       三门具不具：太乙、文昌（落在正宫时）临开、休、生三门即不具（经卷四）。
       五将发不发：始击无掩击、文昌无囚迫、主客大小将无关，且大将不囚、不入中五，为发。
   浏览器里挂 window.TY（需先载 /qimen/jieqi.js）；node 里 require 即得同一对象。
   规则移植参照 kentang2017/kintaiyi（MIT License, Copyright (c) 2023-2026 kentang2017），见 /taiyi/LICENSE-kintaiyi.txt。
   ========================================================= */
(function (root) {
  'use strict';
  var NODE = typeof module !== 'undefined' && module.exports;
  var J = NODE ? require('../qimen/jieqi.js') : root.QM_JIEQI;
  function mod(a, n) { return ((a % n) + n) % n; }

  var GAN = '甲乙丙丁戊己庚辛壬癸', ZHI = '子丑寅卯辰巳午未申酉戌亥';
  // 十六神（顺行，子起）：位序 0–15
  var RING = '子丑艮寅卯辰巽巳午未坤申酉戌乾亥'.split('');
  var SHEN = ['地主', '阳德', '和德', '吕申', '高丛', '太阳', '大炅', '大神', '大威', '天道', '大武', '武德', '太簇', '阴主', '阴德', '大义'];
  // 太乙九宫：一乾 二离 三艮 四震 五中 六兑 七坤 八坎 九巽；pos = 十六神位
  var GONG = [null,
    { n: 1, gua: '乾', zhi: '乾', dir: '西北', pos: 14 },
    { n: 2, gua: '离', zhi: '午', dir: '南', pos: 8 },
    { n: 3, gua: '艮', zhi: '艮', dir: '东北', pos: 2 },
    { n: 4, gua: '震', zhi: '卯', dir: '东', pos: 4 },
    { n: 5, gua: '中', zhi: '中', dir: '中', pos: -1 },
    { n: 6, gua: '兑', zhi: '酉', dir: '西', pos: 12 },
    { n: 7, gua: '坤', zhi: '坤', dir: '西南', pos: 10 },
    { n: 8, gua: '坎', zhi: '子', dir: '北', pos: 0 },
    { n: 9, gua: '巽', zhi: '巽', dir: '东南', pos: 6 }];
  var POS_GONG = [8, 0, 3, 0, 4, 0, 9, 0, 2, 0, 7, 0, 6, 0, 1, 0];   // 十六神位 → 宫数（0 为间神）
  var ZHI_POS = [0, 1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15];             // 子丑寅…亥 → 十六神位
  var CLOCK8 = [8, 3, 4, 9, 2, 7, 6, 1];                               // 顺行八宫（子起）
  var YANG_TY = [1, 2, 3, 4, 6, 7, 8, 9], YIN_TY = [9, 8, 7, 6, 4, 3, 2, 1];
  var YANG_WC = [11, 12, 13, 14, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10];   // 申酉戌乾乾亥子丑艮寅卯辰巽巳午未坤坤
  var YIN_WC = [3, 4, 5, 6, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 2];      // 寅卯辰巽巽巳午未坤申酉戌乾亥子丑艮艮
  var YUAN = ['甲子', '丙子', '戊子', '庚子', '壬子'];
  var LI = ['理天', '理地', '理人'];
  var CN = '〇一二三四五六七八九';
  var DOORS = ['开', '休', '生', '伤', '杜', '景', '死', '惊'];
  var KIND = { year: '年计', month: '月计', day: '日计', hour: '时计' };
  var KIND_JI = { year: '积年', month: '积月', day: '积日', hour: '积时' };
  var KIND_SUI = { year: '太岁', month: '月建', day: '日辰', hour: '时支' };
  var KIND_UNIT = { year: '年', month: '月', day: '日', hour: '时' };
  // 太乙在天外地内（经卷四）：八三四（及一）为地内助主，九二七六为天外助客
  var HELP = { 1: '主', 8: '主', 3: '主', 4: '主', 9: '客', 2: '客', 7: '客', 6: '客' };
  // 八宫阴阳（经卷二）：八三四九为阳宫，二七六一为阴宫；一宫绝阳、九宫绝阴，二、八冬夏至为绝气
  var JUE = { 1: '绝阳之地', 9: '绝阴之地', 2: '绝气之地', 8: '绝气之地' };

  var EPOCH = { nian: 1936557, ri: 705595730 };

  function cnNum(n) {
    if (n <= 10) return n === 10 ? '十' : CN[n];
    var t = Math.floor(n / 10), u = n % 10;
    return (t > 1 ? CN[t] : '') + '十' + (u ? CN[u] : '');
  }
  function gzName(i) { return GAN[i % 10] + ZHI[i % 12]; }
  function posName(p) { return SHEN[p] + '（' + RING[p] + '）'; }
  function gongName(g) { return g === 5 ? '中五' : cnNum(g) + '宫' + GONG[g].gua; }

  /* ================= 算 ================= */
  // 目在十六神 pos，太乙在宫 T：顺行累加至太乙宫止
  function suan(pos, T) {
    var s, p;
    if (POS_GONG[pos]) {
      if (POS_GONG[pos] === T) return T;
      s = 0; p = pos;
    } else { s = 1; p = mod(pos + 1, 16); }
    while (POS_GONG[p] !== T) { s += POS_GONG[p]; p = mod(p + 2, 16); }
    return s;
  }
  function daJiang(n) { return n % 10 || n / 10; }
  function canJiang(d) { return d * 3 % 10; }
  var HE_GRADE = { 14: '上和', 18: '上和', 23: '次和', 29: '次和', 32: '次和', 12: '下和', 16: '下和', 27: '下和', 34: '下和', 38: '下和' };
  var BUHE = { 1: '杂阴', 7: '杂阴', 2: '纯阴', 6: '纯阴', 3: '纯阳', 9: '纯阳', 4: '杂阳', 8: '杂阳',
    11: '阴中重阳', 17: '阴中重阳', 13: '杂阳', 19: '杂阳', 31: '杂阳', 37: '杂阳', 33: '重阳', 39: '重阳',
    22: '重阴', 26: '重阴', 24: '杂阴', 28: '杂阴' };
  function suanInfo(n) {
    var t = Math.floor(n / 10), u = n % 10;
    var du = u === 5, gu = u === 0;
    var he = t > 0 && !du && !gu && (t % 2) !== (u % 2);
    var name = du ? '杜' : gu ? (t % 2 ? '孤阳' : '孤阴') : he ? (HE_GRADE[n] || '和') : (BUHE[n] || '不和');
    var sancai = [];
    if (n < 10) sancai.push('无天');
    if (u < 5) sancai.push('无地');
    if (u === 0) sancai.push('无人');
    if (n > 10 && u > 5) sancai.push('三才足');
    var chang = n >= 10;
    var tags = [chang ? '长' : '短', he ? '和' : '不和'];
    return { n: n, chang: chang, he: he, du: du, name: name, sancai: sancai,
      label: (chang ? '长' : '短') + (du ? '·杜' : he ? '·' + name : '·不和' + (name !== '不和' ? '（' + name + '）' : '')),
      tags: tags };
  }

  /* ================= 局 ================= */
  // k：局（1–72），yin：阴遁，b：太岁支（0=子）
  function ju(k, yin, b) {
    var i = k - 1;
    if (b == null) b = mod(i, 12);
    var T = (yin ? YIN_TY : YANG_TY)[Math.floor(mod(i, 24) / 3)];
    var wc = (yin ? YIN_WC : YANG_WC)[mod(i, 18)];
    var js = ZHI_POS[mod((yin ? 8 : 2) - b, 12)];
    var hs = ZHI_POS[mod((yin ? 7 : 1) - b, 12)], ts = ZHI_POS[b];
    var sj = mod(wc + 2 - js, 16);
    var dm = mod(wc + ts - hs, 16);
    var zs = suan(wc, T), ks = suan(sj, T), ds = suan(dm, T);
    var zd = daJiang(zs), kd = daJiang(ks), dd = daJiang(ds);
    return {
      k: k, yin: !!yin, T: T, ruGong: mod(i, 3) + 1, li: LI[mod(i, 3)],
      b: b, wc: wc, js: js, hs: hs, ts: ts, sj: sj, dm: dm,
      zs: zs, ks: ks, ds: ds,
      zd: zd, zc: canJiang(zd), kd: kd, kc: canJiang(kd), dd: dd, dc: canJiang(dd)
    };
  }

  /* ================= 格局 ================= */
  var GEJU_NOTE = {
    掩: '始击临太乙宫为掩：掩袭劫杀之义，岁计遇之王纲失序、臣强君弱',
    掩将: '始击临主将之宫，掩主将：主算和尚可，不和则凶',
    击: '始击在太乙前后一辰（辰击）或一宫（宫击）：臣凌君、下凌上，将相相伐',
    迫: '文昌或主客大小将在太乙前后（前为外、后为内）：辰迫灾急，宫迫灾缓',
    囚: '文昌或诸将与太乙同宫为囚：篡戮之义，算和者利、不和谋不成',
    关: '主客将同宫为关：将相相忌、相持争锋，事不及君',
    格: '始击或大小将在太乙对宫为格：政事上下相格，格太乙者侮其君',
    对: '文昌与太乙对冲为对：大臣怀二心，君弱、奸生、下欺上',
    提挟: '目或将左右两旁被对方之将（或将与太乙）夹住：在正宫为提、在间神为挟，被夹者不利',
    四郭固: '文昌囚太乙宫，又有主客将相关或始击临之：主人坚守则胜，不利先起',
    四郭杜: '主参将与文昌并、主客大将相并：出兵闭杜不通，谋事不成',
    执提: '开、生二门与太乙同宫为执提，对冲为提格：不可举事',
    杜: '大将参将不出中宫：杜塞无门，宜固守'
  };
  function rel(pos, TP) { return mod(pos - TP, 16); }   // 0 同宫，1 外辰，15 内辰，2 外宫，14 内宫，8 对冲

  function analyse(c) {
    var T = c.T, TP = GONG[T].pos, G = [];
    var add = function (k, who, txt, side) { G.push({ k: k, who: who, txt: txt, side: side || '' }); };
    var gpos = function (g) { return g === 5 ? -1 : GONG[g].pos; };
    // —— 目 ——
    var dw = rel(c.wc, TP), ds = rel(c.sj, TP);
    var st = { wc: [], sj: [], zd: [], zc: [], kd: [], kc: [] };
    if (dw === 0) { st.wc.push('囚'); add('囚', '文昌', '文昌与太乙同宫（关囚）', '主'); }
    else if (dw === 1 || dw === 15) { st.wc.push((dw === 1 ? '外' : '内') + '辰迫'); add('迫', '文昌', '文昌在太乙' + (dw === 1 ? '前' : '后') + '一辰，' + (dw === 1 ? '外' : '内') + '辰迫', '主'); }
    else if (dw === 2 || dw === 14) { st.wc.push((dw === 2 ? '外' : '内') + '宫迫'); add('迫', '文昌', '文昌在太乙' + (dw === 2 ? '前' : '后') + '一宫，' + (dw === 2 ? '外' : '内') + '宫迫', '主'); }
    else if (dw === 8) { st.wc.push('对'); add('对', '文昌', '文昌与太乙对冲', '主'); }
    if (ds === 0) { st.sj.push('掩'); add('掩', '始击', '始击临太乙宫，掩太乙', '客'); }
    else if (ds === 1 || ds === 15) { st.sj.push((ds === 1 ? '外' : '内') + '辰击'); add('击', '始击', '始击在太乙' + (ds === 1 ? '前' : '后') + '一辰，' + (ds === 1 ? '外' : '内') + '辰击', '客'); }
    else if (ds === 2 || ds === 14) { st.sj.push((ds === 2 ? '外' : '内') + '宫击'); add('击', '始击', '始击在太乙' + (ds === 2 ? '前' : '后') + '一宫，' + (ds === 2 ? '外' : '内') + '宫击', '客'); }
    else if (ds === 8) { st.sj.push('格'); add('格', '始击', '始击在太乙对宫，客目格太乙', '客'); }
    // —— 四将 ——
    var GEN = [['zd', '主大将', '主'], ['zc', '主参将', '主'], ['kd', '客大将', '客'], ['kc', '客参将', '客']];
    GEN.forEach(function (x) {
      var g = c[x[0]], s = st[x[0]];
      if (g === 5) { s.push('杜'); return; }
      if (g === T) { s.push('囚'); add('囚', x[1], x[1] + '在' + cnNum(g) + '宫，与太乙同宫为囚', x[2]); return; }
      var d = rel(gpos(g), TP);
      if (d === 2 || d === 14) { s.push((d === 2 ? '外' : '内') + '迫'); add('迫', x[1], x[1] + '在太乙' + (d === 2 ? '前' : '后') + '一宫，' + (d === 2 ? '外' : '内') + '宫迫', x[2]); }
      else if (d === 8) { s.push('格'); add('格', x[1], x[1] + '在太乙对宫为格', x[2]); }
    });
    // 杜：大将入中五（参将必随之）
    if (c.zd === 5) add('杜', '主', '主大将、主参将不出中宫，主人杜塞无门', '主');
    if (c.kd === 5) add('杜', '客', '客大将、客参将不出中宫，客人杜塞无门', '客');
    // 始击掩主将
    ['zd', 'zc'].forEach(function (k) {
      if (c[k] !== 5 && c[k] !== T && GONG[c[k]].pos === c.sj) {
        st[k].push('被掩'); add('掩', '始击', '始击临' + (k === 'zd' ? '主大将' : '主参将') + '之宫（' + gongName(c[k]) + '），掩' + (k === 'zd' ? '主大将' : '主参将'), '主');
      }
    });
    // 关：主将与客将同宫
    [['zd', '主大将'], ['zc', '主参将']].forEach(function (a) {
      [['kd', '客大将'], ['kc', '客参将']].forEach(function (b) {
        if (c[a[0]] !== 5 && c[a[0]] === c[b[0]]) {
          st[a[0]].push('关'); st[b[0]].push('关');
          add('关', a[1] + '、' + b[1], a[1] + '与' + b[1] + '同在' + gongName(c[a[0]]) + '，相关', '');
        }
      });
    });
    // 提挟：目或将左右两旁皆为对方之目、将（或其一为太乙）
    var side = { 主: [['wc', '文昌', c.wc], ['zd', '主大将', gpos(c.zd)], ['zc', '主参将', gpos(c.zc)]],
      客: [['sj', '始击', c.sj], ['kd', '客大将', gpos(c.kd)], ['kc', '客参将', gpos(c.kc)]] };
    ['主', '客'].forEach(function (me) {
      var other = me === '主' ? '客' : '主';
      var occ = {};
      side[other].forEach(function (o) { if (o[2] >= 0) (occ[o[2]] = occ[o[2]] || []).push(o[1]); });
      side[me].forEach(function (x) {
        var p = x[2];
        if (p < 0) return;                                            // 中五不论（与太乙同宫者两旁仍可被挟，如《秘书》阳遁二局「客大将一宫囚，主挟」）
        var step = POS_GONG[p] ? 2 : 1, a = mod(p - step, 16), b = mod(p + step, 16);
        var fa = occ[a] ? occ[a][0] : (a === TP ? '太乙' : null), fb = occ[b] ? occ[b][0] : (b === TP ? '太乙' : null);
        if (fa && fb && (occ[a] || occ[b])) {
          st[x[0]].push(other + '挟');
          add('提挟', other + '挟' + x[1], fa + '、' + fb + '左右夹住' + x[1] + '（' + (POS_GONG[p] ? '在正宫为提' : '在间神为挟') + '），' + other + '挟' + me, me);
        }
      });
    });
    // 二目夹太乙
    if (dw && ds && ((dw <= 2 && ds >= 14) || (ds <= 2 && dw >= 14))) add('提挟', '二目', '文昌、始击分居太乙两旁，二目挟太乙：政由大臣、下专权', '');
    // 四郭固、四郭杜
    var hasGuan = G.some(function (x) { return x.k === '关'; });
    if (dw === 0 && (ds === 0 || hasGuan)) add('四郭固', '文昌', '文昌囚太乙宫，' + (ds === 0 ? '始击又临之' : '主客将又相关') + '，四郭固', '');
    if (c.zc !== 5 && GONG[c.zc].pos === c.wc && c.zd !== 5 && c.zd === c.kd) add('四郭杜', '主参将', '主参将与文昌并，主客大将相并，四郭杜', '');
    // 八门：执提
    var dT = c.doors[T], dOpp = c.doors[10 - T];
    if (dT === '开' || dT === '生') add('执提', '太乙', dT + '门与太乙同宫，执提', '');
    if (dOpp === '开' || dOpp === '生') add('执提', '太乙', dOpp + '门与太乙对冲，提格', '');
    // 发
    ['zd', 'zc', 'kd', 'kc'].forEach(function (k) { if (!st[k].length) st[k].push('发'); });
    return { list: G, st: st };
  }

  /* ================= 三门五将 ================= */
  function sanMen(c) {
    var why = [];
    var dT = c.doors[c.T];
    if (dT === '开' || dT === '休' || dT === '生') why.push(dT + '门临太乙宫');
    var gw = POS_GONG[c.wc];
    if (gw && gw !== c.T) { var dw = c.doors[gw]; if (dw === '开' || dw === '休' || dw === '生') why.push(dw + '门临文昌（' + gongName(gw) + '）'); }
    return { ju: !why.length, why: why };
  }
  function wuJiang(c, A) {
    var why = [];
    var s = A.st;
    if (s.sj.some(function (x) { return x === '掩' || /击/.test(x); })) why.push('始击' + s.sj.filter(function (x) { return x === '掩' || /击/.test(x); }).join('、'));
    if (s.wc.some(function (x) { return x === '囚' || /迫/.test(x); })) why.push('文昌' + s.wc.filter(function (x) { return x === '囚' || /迫/.test(x); }).join('、'));
    if (A.list.some(function (x) { return x.k === '关'; })) why.push('主客将相关');
    [['zd', '主大将'], ['kd', '客大将']].forEach(function (x) {
      if (s[x[0]].indexOf('囚') >= 0) why.push(x[1] + '囚');
      if (s[x[0]].indexOf('杜') >= 0) why.push(x[1] + '入中五');
    });
    return { fa: !why.length, why: why };
  }

  /* ================= 主客胜负（参考） ================= */
  // 仿《太乙秘书》各局断法：先看大将能不能用（发），再比太乙助谁、算的长短和不和与多少。
  //   大将囚、迫、被挟、入中五 → 这一方不能用；大将格而参将发 → 仍可用；关、被掩 → 可用但减分。
  //   两方都不能用 → 主客俱不利；只一方能用 → 利那一方；都能用 → 比分，差不过一分为相持。
  function verdict(c, A) {
    var s = A.st, sc = { 主: 0, 客: 0 }, why = { 主: [], 客: [] }, ok = {};
    var put = function (who, v, t) { sc[who] += v; why[who].push(t); };
    var help = HELP[c.T];
    put(help, 1, '太乙在' + cnNum(c.T) + '宫' + (help === '主' ? '（地内）助主' : '（天外）助客'));
    [['主', 'zd', 'zc', c.zsI], ['客', 'kd', 'kc', c.ksI]].forEach(function (x) {
      var w = x[0], d = s[x[1]], p = s[x[2]], I = x[3], nm = w + '大将', pn = w + '参将';
      var bad = d.filter(function (y) { return y === '囚' || y === '杜' || /迫|挟/.test(y); });
      if (I.du) { ok[w] = false; put(w, -1, w + '算' + I.n + '，大将参将不出中宫（杜塞无门）'); return; }
      if (bad.length) { ok[w] = false; put(w, -1, nm + bad.join('、')); }
      else if (d.indexOf('格') >= 0) {
        ok[w] = p.indexOf('发') >= 0;
        put(w, ok[w] ? -0.5 : -1, nm + '格' + (ok[w] ? '，参将发' : '，参将亦不发'));
      } else {
        ok[w] = true;
        var soft = d.filter(function (y) { return y === '关' || y === '被掩'; });
        if (soft.length) put(w, -0.5, nm + soft.join('、')); else put(w, 0.5, nm + '发');
      }
      if (ok[w] && d.indexOf('格') < 0) { if (p.indexOf('发') >= 0) put(w, 0.5, pn + '发'); else put(w, -0.5, pn + p.join('、')); }
      put(w, I.he ? 1 : -0.5, w + '算' + I.n + (I.he ? I.name : '不和'));
      if (I.chang) put(w, 0.5, w + '算长');
    });
    if (!c.zsI.du && !c.ksI.du && c.zs !== c.ks) put(c.zs > c.ks ? '主' : '客', 0.5, (c.zs > c.ks ? '主' : '客') + '算多');
    var wcBad = s.wc.filter(function (x) { return x === '囚' || /迫|挟/.test(x); }), sjBad = s.sj.filter(function (x) { return x === '掩' || /击|挟/.test(x) || x === '格'; });
    if (wcBad.length) put('主', -0.5, '文昌' + wcBad.join('、'));
    if (sjBad.length) put('客', -0.5, '始击' + sjBad.join('、'));
    var d = sc.主 - sc.客, side;
    if (!ok.主 && !ok.客) side = '俱不利';
    else if (ok.主 && !ok.客) side = '主';
    else if (ok.客 && !ok.主) side = '客';
    else side = d >= 1 ? '主' : d <= -1 ? '客' : '相持';
    return { side: side, score: sc, diff: d, ok: ok, why: why };
  }

  /* ================= 八门 ================= */
  function zhiShi(ji, kind, yin) {
    if (kind === 'hour') return (yin ? ['杜', '死', '伤', '景'] : ['开', '生', '惊', '休'])[Math.floor(mod(ji - 1, 120) / 30)];
    return DOORS[Math.floor(mod(ji - 1, 240) / 30)];
  }
  function doorsOf(T, zs) {
    var a = CLOCK8.indexOf(T), b = DOORS.indexOf(zs), out = {};
    for (var i = 0; i < 8; i++) out[CLOCK8[(a + i) % 8]] = DOORS[(b + i) % 8];
    return out;
  }

  /* ================= 由积数起盘 ================= */
  function chart(ji, kind, yin) {
    kind = kind || 'year';
    var r = mod(ji, 360) || 360, k = mod(r, 72) || 72;
    var c = ju(k, kind === 'hour' && yin, mod(ji - 1, 12));
    c.kind = kind; c.ji = ji; c.r360 = r;
    c.jiNo = Math.floor((r - 1) / 60) + 1; c.ruJi = (r - 1) % 60 + 1;
    c.yuan = YUAN[Math.floor((r - 1) / 72)];
    c.gz = gzName(mod(ji - 1, 60));
    c.zsI = suanInfo(c.zs); c.ksI = suanInfo(c.ks); c.dsI = suanInfo(c.ds);
    c.zhishi = zhiShi(ji, kind, c.yin);
    c.doors = doorsOf(c.T, c.zhishi);
    var A = analyse(c);
    c.geju = A.list; c.st = A.st;
    c.sanmen = sanMen(c);
    c.wujiang = wuJiang(c, A);
    c.v = verdict(c, A);
    c.help = HELP[c.T];
    c.jue = JUE[c.T] || '';
    return c;
  }

  /* ================= 历法：由时刻求积数 ================= */
  var TERMS = J.terms, NAMES = J.NAMES;
  function lastBefore(t, pred) {          // t 之前（含）最后一个满足 pred 的节气
    var lo = 0, hi = TERMS.length - 1, k = -1;
    while (lo <= hi) { var mid = (lo + hi) >> 1; if (TERMS[mid].t <= t) { k = mid; lo = mid + 1; } else hi = mid - 1; }
    for (; k >= 0; k--) if (pred(TERMS[k])) return { i: k, t: TERMS[k].t, n: TERMS[k].n };
    return null;
  }
  function nextAfter(i, pred) { for (var k = i + 1; k < TERMS.length; k++) if (pred(TERMS[k])) return { i: k, t: TERMS[k].t, n: TERMS[k].n }; return null; }
  var isJie = function (x) { return NAMES.indexOf(x.n) % 2 === 1; };
  var isLichun = function (x) { return x.n === '立春'; };
  var isZhi = function (x) { return x.n === '冬至' || x.n === '夏至'; };
  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  var RANGE = { min: Date.UTC(1900, 1, 5), max: Date.UTC(2101, 0, 1) };
  function inRange(date) { var t = +date; return t >= RANGE.min && t < RANGE.max; }

  // 一个时刻的四种积数与边界
  function moment(date) {
    var t = +date;
    var lc = lastBefore(t, isLichun);
    var Y = lc ? new Date(lc.t + 8 * 3600e3).getUTCFullYear() : date.getFullYear() - 1;
    var jie = lastBefore(t, isJie);
    if (!jie) return null;
    var m = mod((NAMES.indexOf(jie.n) - 21) / 2, 12) + 1;           // 寅月 1 … 丑月 12
    var h = date.getHours(), late = h >= 23;
    var dd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + (late ? 1 : 0));
    var JD = jdn(dd.getFullYear(), dd.getMonth() + 1, dd.getDate());
    var zi = Math.floor(mod(h + 1, 24) / 2);                         // 时辰 0=子
    var zhi = lastBefore(t, isZhi);
    var nian = Y + EPOCH.nian, yue = (nian - 1) * 12 + 2 + m, ri = JD + EPOCH.ri, shi = (ri - 1) * 12 + zi + 1;
    return {
      t: t, Y: Y, m: m, JD: JD, zi: zi,
      ji: { year: nian, month: yue, day: ri, hour: shi },
      lichun: lc, lichunNext: lc ? nextAfter(lc.i, isLichun) : null,
      jie: jie, jieNext: nextAfter(jie.i, isJie),
      zhi: zhi, zhiNext: zhi ? nextAfter(zhi.i, isZhi) : null,
      yin: !!zhi && zhi.n === '夏至',
      pillars: [gzName(mod(nian - 1, 60)), gzName(mod(yue - 1, 60)), gzName(mod(ri - 1, 60)), gzName(mod(shi - 1, 60))]
    };
  }
  function cast(date, kind) {
    kind = KIND[kind] ? kind : 'hour';
    var M = inRange(date) ? moment(date) : null;
    if (!M) return null;
    var c = chart(M.ji[kind], kind, M.yin);
    c.M = M; c.date = date;
    return c;
  }
  // 年计按公元年（立春年）直接起，可上溯古例
  function nianJi(Y) { return chart(Y + EPOCH.nian, 'year', false); }

  /* ================= 文字 ================= */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtT(t) { var d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function fmtN(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function stText(a) { return a.join('、'); }
  function genLine(c, k, name) { var g = c[k]; return name + (g === 5 ? '中五' : cnNum(g) + '宫') + '（' + stText(c.st[k]) + '）'; }
  var SIDE_TXT = { 主: '利主（宜后动、守）', 客: '利客（宜先动、攻）', 相持: '主客相持，难分高下', 俱不利: '主客俱不利，各宜固守' };

  // 一段纯文字（复制、问 AI 用）
  function text(c) {
    var M = c.M, L = [];
    L.push('太乙神数 · ' + KIND[c.kind] + (c.date ? ' · ' + fmtT(+c.date) : ''));
    if (M) L.push('四柱：' + M.pillars.join(' '));
    L.push(KIND_JI[c.kind] + ' ' + fmtN(c.ji) + '（依《太乙金镜式经》）· 第' + cnNum(c.jiNo) + '纪 ' + c.yuan + '元 · ' + (c.yin ? '阴遁' : '阳遁') + cnNum(c.k) + '局');
    L.push('太乙在' + gongName(c.T) + '（' + GONG[c.T].dir + '），入宫第' + cnNum(c.ruGong) + KIND_UNIT[c.kind] + '（' + c.li + '）' + (c.jue ? '，' + c.jue : '') + '；' + (c.help === '主' ? '地内助主' : '天外助客'));
    L.push('文昌（主目）' + posName(c.wc) + '；始击（客目）' + posName(c.sj) + '；定目 ' + posName(c.dm));
    L.push(KIND_SUI[c.kind] + ' ' + RING[c.ts] + '；计神 ' + posName(c.js) + '；合神 ' + posName(c.hs));
    L.push('主算 ' + c.zs + '（' + c.zsI.label + (c.zsI.sancai.length ? '，' + c.zsI.sancai.join('') : '') + '）：' + genLine(c, 'zd', '主大将') + '，' + genLine(c, 'zc', '主参将'));
    L.push('客算 ' + c.ks + '（' + c.ksI.label + (c.ksI.sancai.length ? '，' + c.ksI.sancai.join('') : '') + '）：' + genLine(c, 'kd', '客大将') + '，' + genLine(c, 'kc', '客参将'));
    L.push('定算 ' + c.ds + '（' + c.dsI.label + '）：定大将' + (c.dd === 5 ? '中五' : cnNum(c.dd) + '宫') + '，定参将' + (c.dc === 5 ? '中五' : cnNum(c.dc) + '宫'));
    L.push('八门：直使' + c.zhishi + '门加太乙宫；' + CLOCK8.map(function (g) { return GONG[g].gua + c.doors[g]; }).join(' '));
    L.push('三门' + (c.sanmen.ju ? '具' : '不具（' + c.sanmen.why.join('；') + '）') + '；五将' + (c.wujiang.fa ? '发' : '不发（' + c.wujiang.why.join('；') + '）'));
    L.push('格局：' + (c.geju.length ? c.geju.map(function (g) { return g.txt; }).join('；') : '无掩迫关囚击格对'));
    L.push('倾向（参考）：' + SIDE_TXT[c.v.side] + '。主：' + c.v.why.主.join('，') + '；客：' + c.v.why.客.join('，'));
    return L.join('\n');
  }

  var api = {
    RING: RING, SHEN: SHEN, GONG: GONG, POS_GONG: POS_GONG, ZHI: ZHI, ZHI_POS: ZHI_POS, CLOCK8: CLOCK8, DOORS: DOORS,
    YUAN: YUAN, KIND: KIND, KIND_JI: KIND_JI, KIND_SUI: KIND_SUI, KIND_UNIT: KIND_UNIT, HELP: HELP, EPOCH: EPOCH,
    GEJU_NOTE: GEJU_NOTE, SIDE_TXT: SIDE_TXT,
    mod: mod, cnNum: cnNum, gzName: gzName, posName: posName, gongName: gongName, fmtN: fmtN, fmtT: fmtT,
    suan: suan, daJiang: daJiang, canJiang: canJiang, suanInfo: suanInfo,
    ju: ju, chart: chart, cast: cast, moment: moment, nianJi: nianJi, inRange: inRange, RANGE: RANGE, jdn: jdn,
    zhiShi: zhiShi, doorsOf: doorsOf, text: text
  };
  if (NODE) module.exports = api; else root.TY = api;
})(this);
