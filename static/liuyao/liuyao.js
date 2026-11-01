/* =========================================================
   六爻纳甲 · 装卦核心
   ---------------------------------------------------------
   京房八宫：本宫纯卦起，一世至五世自初爻逐爻变，游魂复变四爻，
   归魂再复内卦；世爻依次在六、一、二、三、四、五、四、三爻。
   纳甲：乾内甲子寅辰、外壬午申戌；坤内乙未巳卯、外癸丑亥酉；
         震庚子寅辰午申戌；巽辛丑亥酉未巳卯；坎戊寅辰午申戌子；
         离己卯丑亥酉未巳；艮丙辰午申戌子寅；兑丁巳卯丑亥酉未。
   六亲以本卦所属之宫五行为「我」；六神按日干自初爻起；
   伏神取本宫纯卦同位之爻；卦身「阳世从子、阴世从午」数至世爻。

   爻以数记，自初爻往上：6 老阴（交，动）· 7 少阳（单）· 8 少阴（拆）· 9 老阳（重，动）。
   浏览器里挂 window.LY；node 里 require 即得同一对象。
   ========================================================= */
(function (root) {
  'use strict';
  var GAN = '甲乙丙丁戊己庚辛壬癸', ZHI = '子丑寅卯辰巳午未申酉戌亥';
  var WX = ['木', '火', '土', '金', '水'];
  var ZHI_WX = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  function mod(a, n) { return ((a % n) + n) % n; }

  // 八卦：爻自下而上，1 阳 0 阴
  var GUA8 = {
    乾: { l: [1, 1, 1], x: '天', wx: 3 }, 兑: { l: [1, 1, 0], x: '泽', wx: 3 }, 离: { l: [1, 0, 1], x: '火', wx: 1 }, 震: { l: [1, 0, 0], x: '雷', wx: 0 },
    巽: { l: [0, 1, 1], x: '风', wx: 0 }, 坎: { l: [0, 1, 0], x: '水', wx: 4 }, 艮: { l: [0, 0, 1], x: '山', wx: 2 }, 坤: { l: [0, 0, 0], x: '地', wx: 2 }
  };
  var GUA8_NAMES = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];   // 先天序，报数起卦用（乾一兑二……坤八）
  function guaOf(l) { for (var k in GUA8) { var g = GUA8[k].l; if (g[0] === l[0] && g[1] === l[1] && g[2] === l[2]) return k; } return null; }

  // 纳甲：[内卦三爻, 外卦三爻]，每爻 [干, 支]
  var NAJIA = {
    乾: [[[0, 0], [0, 2], [0, 4]], [[8, 6], [8, 8], [8, 10]]],
    坤: [[[1, 7], [1, 5], [1, 3]], [[9, 1], [9, 11], [9, 9]]],
    震: [[[6, 0], [6, 2], [6, 4]], [[6, 6], [6, 8], [6, 10]]],
    巽: [[[7, 1], [7, 11], [7, 9]], [[7, 7], [7, 5], [7, 3]]],
    坎: [[[4, 2], [4, 4], [4, 6]], [[4, 8], [4, 10], [4, 0]]],
    离: [[[5, 3], [5, 1], [5, 11]], [[5, 9], [5, 7], [5, 5]]],
    艮: [[[2, 4], [2, 6], [2, 8]], [[2, 10], [2, 0], [2, 2]]],
    兑: [[[3, 5], [3, 3], [3, 1]], [[3, 11], [3, 9], [3, 7]]]
  };

  // 八宫卦名（各宫按本宫、一世……游魂、归魂之序）
  var PALACE_ORDER = ['乾', '坎', '艮', '震', '巽', '离', '坤', '兑'];
  var NAMES = {
    乾: ['乾为天', '天风姤', '天山遁', '天地否', '风地观', '山地剥', '火地晋', '火天大有'],
    坎: ['坎为水', '水泽节', '水雷屯', '水火既济', '泽火革', '雷火丰', '地火明夷', '地水师'],
    艮: ['艮为山', '山火贲', '山天大畜', '山泽损', '火泽睽', '天泽履', '风泽中孚', '风山渐'],
    震: ['震为雷', '雷地豫', '雷水解', '雷风恒', '地风升', '水风井', '泽风大过', '泽雷随'],
    巽: ['巽为风', '风天小畜', '风火家人', '风雷益', '天雷无妄', '火雷噬嗑', '山雷颐', '山风蛊'],
    离: ['离为火', '火山旅', '火风鼎', '火水未济', '山水蒙', '风水涣', '天水讼', '天火同人'],
    坤: ['坤为地', '地雷复', '地泽临', '地天泰', '雷天大壮', '泽天夬', '水天需', '水地比'],
    兑: ['兑为泽', '泽水困', '泽地萃', '泽山咸', '水山蹇', '地山谦', '雷山小过', '雷泽归妹']
  };
  var GEN = ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂'];
  var SHI_POS = [6, 1, 2, 3, 4, 5, 4, 3];

  // 生成八宫六十四卦：键为六爻阴阳串（初→上）
  var TABLE = {};
  PALACE_ORDER.forEach(function (p) {
    var base = GUA8[p].l.concat(GUA8[p].l);
    var flips = [[], [0], [0, 1], [0, 1, 2], [0, 1, 2, 3], [0, 1, 2, 3, 4], [0, 1, 2, 4], [4]];
    flips.forEach(function (f, i) {
      var l = base.slice();
      f.forEach(function (k) { l[k] = 1 - l[k]; });
      TABLE[l.join('')] = { palace: p, gen: i, genName: GEN[i], name: NAMES[p][i], shi: SHI_POS[i], ying: SHI_POS[i] > 3 ? SHI_POS[i] - 3 : SHI_POS[i] + 3, lines: l };
    });
  });

  var LIUQIN = ['兄弟', '子孙', '妻财', '官鬼', '父母'];   // 同我、我生、我克、克我、生我
  function liuqin(me, wx) { return LIUQIN[mod(wx - me, 5)]; }
  var SHEN = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];
  var SHEN_START = [0, 0, 1, 1, 2, 3, 4, 4, 5, 5];

  // 装一卦（不含动变）：lines 为六爻阴阳（初→上）
  function zhuang(lines) {
    var key = lines.join(''), info = TABLE[key];
    var inner = guaOf(lines.slice(0, 3)), outer = guaOf(lines.slice(3));
    var me = GUA8[info.palace].wx;
    var yao = [];
    for (var i = 0; i < 6; i++) {
      var nj = i < 3 ? NAJIA[inner][0][i] : NAJIA[outer][1][i - 3];
      var z = nj[1];
      yao.push({ pos: i + 1, yang: lines[i], gan: nj[0], zhi: z, wx: ZHI_WX[z], qin: liuqin(me, ZHI_WX[z]) });
    }
    return {
      key: key, name: info.name, palace: info.palace, palaceWx: me, gen: info.gen, genName: info.genName,
      shi: info.shi, ying: info.ying, inner: inner, outer: outer, lines: lines.slice(), yao: yao
    };
  }

  // —— 日月作用 ——
  function wangshuai(wx, ling) {
    if (wx === ling) return '旺';
    if (mod(ling + 1, 5) === wx) return '相';
    if (mod(wx + 1, 5) === ling) return '休';
    if (mod(wx + 2, 5) === ling) return '囚';
    return '死';
  }
  var MU = [7, 10, 4, 1, 4];      // 墓：木未、火戌、土辰（随水）、金丑、水辰
  var JUE = [8, 11, 5, 2, 5];     // 绝：木申、火亥、土巳（随水）、金寅、水巳
  var LIUHE = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  var JIN = { 2: 3, 5: 6, 8: 9, 11: 0, 1: 4, 4: 7, 7: 10, 10: 1 };     // 化进神：寅→卯、巳→午、申→酉、亥→子、丑→辰、辰→未、未→戌、戌→丑
  var chong = function (a, b) { return mod(a - b, 12) === 6; };
  function kongOf(i60) { var x = (i60 - i60 % 10) % 12; return [mod(x + 10, 12), mod(x + 11, 12)]; }
  function gzIdx(g, z) { for (var n = 0; n < 60; n++) if (n % 10 === g && n % 12 === z) return n; return -1; }

  /* =========================================================
     排一卦
     nums: 六个数（初→上），6/7/8/9
     day: { monthZhi, dayGan, dayZhi }（月建、日辰）
     ========================================================= */
  function cast(nums, day) {
    var ben = nums.map(function (n) { return n % 2; });
    var moving = nums.map(function (n) { return n === 6 || n === 9; });
    var hasMove = moving.some(Boolean);
    var bian = ben.map(function (v, i) { return moving[i] ? 1 - v : v; });
    var B = zhuang(ben), V = hasMove ? zhuang(bian) : null;
    var hu = zhuang([ben[1], ben[2], ben[3], ben[2], ben[3], ben[4]]);
    var me = B.palaceWx;
    // 变卦各爻六亲随本卦宫
    if (V) V.yao.forEach(function (y) { y.qin = liuqin(me, y.wx); });

    // 伏神：本卦缺的六亲，到本宫纯卦里找
    var pure = zhuang(GUA8[B.palace].l.concat(GUA8[B.palace].l));
    var have = {}; B.yao.forEach(function (y) { have[y.qin] = true; });
    var fu = [];
    LIUQIN.forEach(function (q) {
      if (have[q]) return;
      pure.yao.forEach(function (y, i) { if (y.qin === q) fu.push({ pos: i + 1, qin: q, gan: y.gan, zhi: y.zhi, wx: y.wx }); });
    });

    // 卦身
    var shiYang = ben[B.shi - 1];
    var shenZhi = mod((shiYang ? 0 : 6) + B.shi - 1, 12);
    var shenAt = B.yao.filter(function (y) { return y.zhi === shenZhi; }).map(function (y) { return y.pos; });

    var out = { ben: B, bian: V, hu: hu, nums: nums.slice(), moving: moving, fu: fu, guaShen: { zhi: shenZhi, at: shenAt }, pure: pure };

    if (day) {
      var mz = day.monthZhi, dg = day.dayGan, dz = day.dayZhi;
      var ling = ZHI_WX[mz], dayWx = ZHI_WX[dz];
      var kong = kongOf(gzIdx(dg, dz));
      var s0 = SHEN_START[dg];
      out.day = { monthZhi: mz, dayGan: dg, dayZhi: dz, kong: kong };
      B.yao.forEach(function (y, i) {
        y.shen = SHEN[(s0 + i) % 6];
        y.ws = wangshuai(y.wx, ling);
        var t = [];
        if (y.zhi === mz) t.push('临月建');
        if (y.zhi === dz) t.push('临日');
        if (chong(y.zhi, mz)) t.push('月破');
        if (chong(y.zhi, dz)) t.push(moving[i] ? '日冲' : (y.ws === '旺' || y.ws === '相' ? '暗动' : '日破'));
        if (LIUHE[y.zhi] === dz) t.push('日合');
        if (LIUHE[y.zhi] === mz) t.push('月合');
        if (kong.indexOf(y.zhi) >= 0) t.push('旬空');
        if (MU[y.wx] === dz) t.push('入日墓');
        if (JUE[y.wx] === dz) t.push('日绝');
        y.marks = t;
        if (moving[i] && V) {
          var v = V.yao[i], c = [];
          if (JIN[y.zhi] === v.zhi && y.wx === v.wx) c.push('化进神');
          if (JIN[v.zhi] === y.zhi && y.wx === v.wx) c.push('化退神');
          if (v.zhi === y.zhi) c.push('伏吟');
          else if (chong(v.zhi, y.zhi)) c.push('反吟');
          if (mod(y.wx - v.wx, 5) === 1) c.push('回头生');
          if (mod(y.wx - v.wx, 5) === 2) c.push('回头克');
          if (kong.indexOf(v.zhi) >= 0) c.push('化空');
          if (chong(v.zhi, mz)) c.push('化破');
          if (MU[y.wx] === v.zhi) c.push('化墓');
          if (JUE[y.wx] === v.zhi) c.push('化绝');
          y.hua = c;
        }
      });
      fu.forEach(function (f) {
        var fei = B.yao[f.pos - 1];
        var r = mod(f.wx - fei.wx, 5);
        f.rel = r === 0 ? '比和' : r === 1 ? '飞生伏' : r === 4 ? '伏生飞' : r === 2 ? '飞克伏' : '伏克飞';
        f.kong = kong.indexOf(f.zhi) >= 0;
        f.ws = wangshuai(f.wx, ling);
      });
    }
    return out;
  }

  // 用神、原神、忌神、仇神（六亲），以用神所属五行推
  function yongShen(C, pick) {
    var me = C.ben.palaceWx, wxY;
    if (pick === '世爻') wxY = C.ben.yao[C.ben.shi - 1].wx;
    else wxY = mod(me + LIUQIN.indexOf(pick), 5);
    var q = function (wx) { return LIUQIN[mod(wx - me, 5)]; };
    return { yong: pick === '世爻' ? '世爻' : pick, yongWx: wxY, yuan: q(mod(wxY - 1, 5)), ji: q(mod(wxY - 2, 5)), chou: q(mod(wxY - 3, 5)) };
  }

  // 报数起卦：上卦、下卦取先天数（除八余几，余零作八），动爻取和数（或第三数）除六余几
  function fromNumbers(a, b, c) {
    var up = GUA8_NAMES[mod(a - 1, 8)], lo = GUA8_NAMES[mod(b - 1, 8)];
    var dong = mod((c != null ? c : a + b) - 1, 6);
    var l = GUA8[lo].l.concat(GUA8[up].l);
    return l.map(function (v, i) { return i === dong ? (v ? 9 : 6) : (v ? 7 : 8); });
  }

  var api = {
    GAN: GAN, ZHI: ZHI, WX: WX, ZHI_WX: ZHI_WX, GUA8: GUA8, GUA8_NAMES: GUA8_NAMES, NAJIA: NAJIA, NAMES: NAMES, TABLE: TABLE,
    LIUQIN: LIUQIN, SHEN: SHEN, PALACE_ORDER: PALACE_ORDER,
    zhuang: zhuang, cast: cast, yongShen: yongShen, fromNumbers: fromNumbers, guaOf: guaOf, kongOf: kongOf, wangshuai: wangshuai
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LY = api;
})(this);
