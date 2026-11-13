/* =========================================================
   七政四余 · 排盘核心
   ---------------------------------------------------------
   七政（日月水金火木土）的位置借占星页的星历（/xingpan/xingpan.js，Schlyter 算法，约一二角分），
   四余：
     罗睺、计都 —— 月亮轨道与黄道的两个平交点。默认罗睺取升交点（正交）、计都取降交点（中交），
                    即清《时宪历》以来的通行说；「罗计互换」一键改成明以前的反过来。
     月孛 —— 月亮轨道的平远地点。
     紫气 —— 天上没有对应的实体，只是一个二十八年一周天的匀速虚点。
              这里取每日行 360° ÷ (28 × 365.2422)，即约二分零七秒；历元见 ZIQI_EPOCH。
   十二宫按回归黄道（以中气分宫，太阳过春分入戌宫降娄），与本站月将、奇门同一口径；
   二十八宿按恒星：各宿距星取 J2000 实测黄经，按岁差推到当日，宿宽因此不等（觜宿只一度上下）。
   命宫取东方地平所出的黄道度（上升点）所在之宫，命度即上升点的宿度；身宫取月亮所在之宫。
   十二宫自命宫起逆数地支（命宫戌则财帛酉）。
   浏览器里挂 window.QZ（要先载 /xingpan/xingpan.js）；node 里 require 即得同一对象。
   ========================================================= */
(function (root) {
  'use strict';
  var isNode = typeof module !== 'undefined' && module.exports;
  var XP = isNode ? require('../xingpan/xingpan.js') : root.XP;
  var mod = function (a, n) { return ((a % n) + n) % n; };
  var n360 = function (x) { return mod(x, 360); };
  var DAY = 864e5;

  var ZHI = '子丑寅卯辰巳午未申酉戌亥';
  // 十二次（宫的古名），按地支
  var CI = ['玄枵', '星纪', '析木', '大火', '寿星', '鹑尾', '鹑火', '鹑首', '实沈', '大梁', '降娄', '娵訾'];
  // 对应的黄道十二宫（按地支），只作对照
  var SIGN_BY_ZHI = ['宝瓶', '摩羯', '人马', '天蝎', '天秤', '双女', '狮子', '巨蟹', '双子', '金牛', '白羊', '双鱼'];
  // 宫主（七政）：子丑土，寅亥木，卯戌火，辰酉金，巳申水，午日，未月
  var LORD = ['tu', 'tu', 'mu', 'huo', 'jin', 'shui', 'ri', 'yue', 'shui', 'jin', 'huo', 'mu'];
  var HOUSES = ['命宫', '财帛', '兄弟', '田宅', '男女', '奴仆', '夫妻', '疾厄', '迁移', '官禄', '福德', '相貌'];

  // 十一曜
  var STARS = [
    { id: 'ri', n: '太阳', s: '日', wx: '火', src: 'sun' },
    { id: 'yue', n: '太阴', s: '月', wx: '水', src: 'moon' },
    { id: 'shui', n: '水星', s: '水', wx: '水', src: 'mercury' },
    { id: 'jin', n: '金星', s: '金', wx: '金', src: 'venus' },
    { id: 'huo', n: '火星', s: '火', wx: '火', src: 'mars' },
    { id: 'mu', n: '木星', s: '木', wx: '木', src: 'jupiter' },
    { id: 'tu', n: '土星', s: '土', wx: '土', src: 'saturn' },
    { id: 'luo', n: '罗睺', s: '罗', wx: '火', yu: 1 },
    { id: 'ji', n: '计都', s: '计', wx: '土', yu: 1 },
    { id: 'qi', n: '紫气', s: '气', wx: '木', yu: 1 },
    { id: 'bo', n: '月孛', s: '孛', wx: '水', yu: 1 }
  ];
  var STAR = {}; STARS.forEach(function (s) { STAR[s.id] = s; });
  // 四余各为一政之余：罗睺火余，计都土余，紫气木余，月孛水余
  var YU_OF = { luo: 'huo', ji: 'tu', qi: 'mu', bo: 'shui' };

  // 二十八宿：名、四象、宿主（七曜，角木起依木金土日月火水循环）、距星、J2000 黄经（度）
  // 距星黄经由 ICRS 赤经赤纬换算（瑞士星历 sefstars 表；35 Ari、θ Cnc、υ¹ Hya 表中无，取星表值）。
  var XIU = [
    ['角', 'α Vir', 203.841], ['亢', 'κ Vir', 214.494], ['氐', 'α² Lib', 225.083], ['房', 'π Sco', 242.940],
    ['心', 'σ Sco', 247.800], ['尾', 'μ¹ Sco', 256.156], ['箕', 'γ Sgr', 271.261],
    ['斗', 'φ Sgr', 280.181], ['牛', 'β Cap', 304.047], ['女', 'ε Aqr', 311.723], ['虚', 'β Aqr', 323.395],
    ['危', 'α Aqr', 333.352], ['室', 'α Peg', 353.486], ['壁', 'γ Peg', 9.156],
    ['奎', 'ζ And', 20.580], ['娄', 'β Ari', 33.970], ['胃', '35 Ari', 46.935], ['昴', '17 Tau', 59.412],
    ['毕', 'ε Tau', 68.465], ['觜', 'λ Ori', 83.707], ['参', 'ζ Ori', 84.681],
    ['井', 'μ Gem', 95.302], ['鬼', 'θ Cnc', 125.728], ['柳', 'δ Hya', 130.304], ['星', 'α Hya', 147.279],
    ['张', 'υ¹ Hya', 155.691], ['翼', 'α Crt', 173.689], ['轸', 'γ Crv', 190.726]
  ].map(function (r, i) {
    return { i: i, n: r[0], star: r[1], lon0: r[2], xiang: ['青龙', '玄武', '白虎', '朱雀'][Math.floor(i / 7)],
      dir: ['东', '北', '西', '南'][Math.floor(i / 7)], lord: ['mu', 'jin', 'tu', 'ri', 'yue', 'huo', 'shui'][i % 7] };
  });
  var QIN = ['蛟', '龙', '貉', '兔', '狐', '虎', '豹', '獬', '牛', '蝠', '鼠', '燕', '猪', '貐', '狼', '狗', '雉', '鸡', '乌', '猴', '猿', '犴', '羊', '獐', '马', '鹿', '蛇', '蚓'];
  XIU.forEach(function (x, i) { x.qin = QIN[i]; x.full = x.n + STAR[x.lord].s + QIN[i]; });

  // 岁差（黄经总岁差，IAU 2006 前两项）
  function precess(utc) { var T = (utc / DAY + 2440587.5 - 2451545.0) / 36525; return (5028.796195 * T + 1.1054348 * T * T) / 3600; }
  function xiuStarts(utc) { var p = precess(utc); return XIU.map(function (x) { return n360(x.lon0 + p); }); }
  // 某黄经所在之宿与入宿度
  function xiuOf(lon, starts) {
    var best = -1, bd = 999;
    for (var i = 0; i < 28; i++) { var d = n360(lon - starts[i]); if (d < bd) { bd = d; best = i; } }
    var w = n360(starts[(best + 1) % 28] - starts[best]);
    return { i: best, n: XIU[best].n, deg: bd, width: w };
  }
  // 宫（地支）：白羊 0° 起戌宫，黄经增则地支减
  function gongOf(lon) { var s = Math.floor(n360(lon) / 30); return { zhi: mod(10 - s, 12), deg: n360(lon) - s * 30 }; }

  // 紫气：J2000.0 时在星纪（丑宫）初度，即回归黄经 270°；二十八回归年一周天，顺行
  var ZIQI_EPOCH = { jd: 2451545.0, lon: 270 }, ZIQI_RATE = 360 / (28 * 365.2422);
  function ziqiLon(utc) { return n360(ZIQI_EPOCH.lon + (utc / DAY + 2440587.5 - ZIQI_EPOCH.jd) * ZIQI_RATE); }

  // 留：日行不足此数（度）就标「留」
  var STILL = { shui: 0.12, jin: 0.06, huo: 0.03, mu: 0.012, tu: 0.008 };

  function lonsAt(utc, opt) {
    var B = XP.bodies(utc), d = XP.dayNum(utc), L = {};
    STARS.forEach(function (s) { if (s.src) L[s.id] = B[s.src].lon; });
    var asc = B.node.lon, desc = n360(asc + 180), swap = opt && opt.luoji === 'ming';
    L.luo = swap ? desc : asc; L.ji = swap ? asc : desc;
    L.qi = ziqiLon(utc);
    L.bo = XP.lilithLon(d);
    return L;
  }

  /* inp：{ y, mo, d, h, mi（出生地钟表时间）, tz, dst, lat, lon, luoji: 'qing'|'ming' } */
  function chart(inp) {
    var wall = Date.UTC(inp.y, inp.mo - 1, inp.d, inp.h, inp.mi || 0);
    var utc = wall - (inp.dst ? 3600e3 : 0) - (+inp.tz) * 3600e3;
    return chartAt(utc, inp);
  }
  function chartAt(utc, inp) {
    var opt = { luoji: inp.luoji === 'ming' ? 'ming' : 'qing' };
    var L = lonsAt(utc, opt), L0 = lonsAt(utc - 3600e3, opt), L1 = lonsAt(utc + 3600e3, opt);
    var starts = xiuStarts(utc);
    var A = XP.angles(utc, +inp.lat, +inp.lon);
    var stars = STARS.map(function (s) {
      var lon = L[s.id], sp = (mod(L1[s.id] - L0[s.id] + 180, 360) - 180) * 12;
      var g = gongOf(lon), x = xiuOf(lon, starts);
      var lord = LORD[g.zhi];
      return {
        id: s.id, n: s.n, s: s.s, wx: s.wx, yu: !!s.yu, lon: lon, speed: sp,
        retro: sp < 0, still: STILL[s.id] != null && Math.abs(sp) < STILL[s.id],
        zhi: g.zhi, gdeg: g.deg, xiu: x.i, xdeg: x.deg,
        lord: lord, yuan: lord === s.id || (s.yu && lord === YU_OF[s.id])   // 入垣：落在自己（或所余之政）主的宫
      };
    });
    var byId = {}; stars.forEach(function (s) { byId[s.id] = s; });
    var asc = A.asc, gm = gongOf(asc), xm = xiuOf(asc, starts);
    var ming = gm.zhi, shen = byId.yue.zhi;
    var mc = A.mc, gmc = gongOf(mc), xmc = xiuOf(mc, starts);
    var houses = HOUSES.map(function (n, k) { return { k: k, n: n, zhi: mod(ming - k, 12) }; });
    var houseAt = {}; houses.forEach(function (h) { houseAt[h.zhi] = h; });
    var gongs = [];
    for (var z = 0; z < 12; z++) {
      gongs.push({ zhi: z, ci: CI[z], sign: SIGN_BY_ZHI[z], lord: LORD[z], house: houseAt[z].n, k: houseAt[z].k,
        stars: stars.filter(function (s) { return s.zhi === z; }).sort(function (a, b) { return b.gdeg - a.gdeg; }).map(function (s) { return s.id; }) });
    }
    // 昼夜：太阳在地平之上（上升点往回数半圈之内）为昼生
    var day = n360(byId.ri.lon - asc) >= 180;
    var xiuArr = starts.map(function (st, i) { return { i: i, n: XIU[i].n, full: XIU[i].full, start: st, width: n360(starts[(i + 1) % 28] - st), lord: XIU[i].lord, xiang: XIU[i].xiang, star: XIU[i].star }; });
    return {
      input: inp, utc: utc, luoji: opt.luoji, stars: stars, byId: byId, gongs: gongs, houses: houses, xiu: xiuArr,
      asc: asc, mc: mc, day: day,
      ming: { zhi: ming, gdeg: gm.deg, xiu: xm.i, xdeg: xm.deg },
      mcPt: { zhi: gmc.zhi, gdeg: gmc.deg, xiu: xmc.i, xdeg: xmc.deg },
      shen: { zhi: shen },
      mingZhu: LORD[ming],            // 命主：命宫之主
      duZhu: XIU[xm.i].lord,          // 度主：命度所在宿之主
      shenZhu: LORD[shen]             // 身主：身宫之主
    };
  }

  var CN = '〇一二三四五六七八九';
  function cnNum(n) { if (n < 10) return n === 0 ? '初' : CN[n]; if (n < 20) return '十' + (n % 10 ? CN[n % 10] : ''); return CN[Math.floor(n / 10)] + '十' + (n % 10 ? CN[n % 10] : ''); }
  // 度数写法：入宿 3.4° → 「三度」；带分时「3°24′」
  function dm(x) { var d = Math.floor(x), m = Math.floor((x - d) * 60 + 1e-9); return d + '°' + String(m).padStart(2, '0') + '′'; }
  function xiuText(i, deg) { return XIU[i].n + cnNum(Math.floor(deg)) + '度'; }

  function text(C, extra) {
    var L = [];
    var gz = function (z) { return ZHI[z] + '宫' + CI[z]; };
    L.push('七政四余（果老星宗）');
    if (extra && extra.head) L.push(extra.head);
    L.push('命宫：' + gz(C.ming.zhi) + '，命度' + xiuText(C.ming.xiu, C.ming.xdeg) + '（' + dm(C.ming.xdeg) + '）；命主' + STAR[C.mingZhu].n + '，度主' + STAR[C.duZhu].n);
    L.push('身宫：' + gz(C.shen.zhi) + '，身主' + STAR[C.shenZhu].n + '；' + (C.day ? '昼生' : '夜生'));
    L.push('');
    C.stars.forEach(function (s) {
      L.push(s.n + '：' + gz(s.zhi) + ' ' + dm(s.gdeg) + '，' + xiuText(s.xiu, s.xdeg) + '（' + dm(s.xdeg) + '）' + (s.retro ? '，逆' : '') + (s.still ? '，留' : '') + (s.yuan ? '，入垣' : '') + '，落' + C.gongs[s.zhi].house);
    });
    L.push('');
    C.houses.forEach(function (h) {
      var g = C.gongs[h.zhi];
      L.push(h.n + '：' + gz(h.zhi) + '，宫主' + STAR[g.lord].n + (g.stars.length ? '，' + g.stars.map(function (id) { return STAR[id].n; }).join('、') : ''));
    });
    return L.join('\n');
  }
  function rules(C) {
    return [
      '十二宫按回归黄道以中气分宫（太阳过春分入戌宫），二十八宿按恒星，距星取实测黄经推岁差到当日，宿宽不等。',
      '命宫取上升点所在之宫，命度为上升点宿度；身宫取太阴所在之宫；十二宫自命宫逆布：命宫、财帛、兄弟、田宅、男女、奴仆、夫妻、疾厄、迁移、官禄、福德、相貌。',
      '宫主：子丑土，寅亥木，卯戌火，辰酉金，巳申水，午日，未月；宿主依角木亢金氐土房日心月尾火箕水循环。',
      C.luoji === 'ming' ? '罗睺取降交点、计都取升交点（明以前之说）。' : '罗睺取升交点（正交）、计都取降交点（中交），清以来通行之说。',
      '月孛为月亮平远地点；紫气为二十八年一周天的匀速虚点（本站历元：J2000 在星纪初度），流派不同处请以所学为准。'
    ];
  }

  var api = {
    ZHI: ZHI, CI: CI, SIGN_BY_ZHI: SIGN_BY_ZHI, LORD: LORD, HOUSES: HOUSES, STARS: STARS, STAR: STAR, XIU: XIU, YU_OF: YU_OF,
    ZIQI_EPOCH: ZIQI_EPOCH, ZIQI_RATE: ZIQI_RATE,
    chart: chart, chartAt: chartAt, lonsAt: lonsAt, xiuStarts: xiuStarts, xiuOf: xiuOf, gongOf: gongOf, ziqiLon: ziqiLon, precess: precess,
    cnNum: cnNum, dm: dm, xiuText: xiuText, text: text, rules: rules
  };
  if (isNode) module.exports = api; else root.QZ = api;
})(this);
