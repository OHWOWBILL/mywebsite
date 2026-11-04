/* =========================================================
   通书 · 黄历底座 —— 只管算，不碰页面（另附一个存 .ics 的小工具）
   ---------------------------------------------------------
   给日课、黄历、择日、流年共用：某一天的干支纳音、建除、值神（黄道黑道）、冲煞、吉神方位、彭祖百忌，
   协纪辨方的全套宜忌与神煞、胎神占方、二十八宿、七十二候，十二时辰吉凶，以及日本历注（六曜、選日、雑節）。
   口径
     · 节月以「节」换：交节那一天整天算新月（日本暦注同此）；节气取 /qimen/jieqi.js（精确到分）。
     · 建除：日支与月建同为「建」，顺数；交节之日自然重复前一日。
     · 值神：青龙起法「寅申需加子，卯酉却居寅，辰戌龙位上，巳亥午中寻，子午临申地，丑未戌坐行」，
       日按月建起、时按日支起；青龙、明堂、金匮、天德、玉堂、司命为黄道。
     · 冲煞：天克地冲（冲干为日干后四位，冲支对冲）；申子辰煞南、寅午戌煞北、巳酉丑煞东、亥卯未煞西。
     · 喜神：甲己东北、乙庚西北、丙辛西南、丁壬正南、戊癸东南；
       财神：甲乙东北、丙丁西南、戊己正北、庚辛正东、壬癸正南；
       阳贵阴贵：甲戊庚牛羊（庚日阳贵丑、阴贵未，与天气网老黄历同；lunar-javascript 作庚日午寅，不取）。
     · 宜忌、吉神宜趋、凶煞宜忌、胎神、二十八宿：《协纪辨方书》的每日表，取自 lunar-javascript 1.7.7
       （6tail，MIT，移植在 /fabao/tongshu-shensha.js）：宜忌按节月干支与日干支、神煞按月建与日干支、
       胎神按日干支（月胎神按农历月）、二十八宿按日支与星期。1901–2099 年逐日与该库对照：以北京时间计全同
       （只有 4 天因中国当年行夏令时，交节那天早晚一日）；日本时间下约有百日因交节落在北京时间 23 点后而早一日换月——
       按本机民用日，口径如此。建除、值神、冲煞、喜神财神、胎神、星宿也逐日相同；阳贵阴贵（庚日）与彭祖（壬日「汲水」）
       从天气网老黄历，与该库不同。
       没载入该件时退回建除十二神的简本宜忌（与 data/rike.yaml 同一份）。
       另标黄道黑道、岁破、四离四绝、杨公忌（这几样不在协纪的每日表里）。
     · 七十二候：太阳黄经每 5° 一候（立春初候 315°），两端用精确节气、中间按低精度太阳黄经插值；
       入候那一天整天算新候。候名中国取《逸周书·时训解》与宣明暦本，日本取略本暦的本朝七十二候（/fabao/tongshu-hou.js）。
     · 六曜、不成就日按日本旧暦（/fabao/kyureki.js，日本时间落朔）；
       一粒万倍日、天赦日、三隣亡、受死日、十死日按节月；母倉日按季节与土用；
       土用、入梅、半夏生用低精度太阳黄经（误差一刻钟内）。
   日期一律按本机时区的民用日。
   浏览器里挂 window.TS；node 里 require 即得同一对象。
   ========================================================= */
(function (root) {
  'use strict';
  var NODE = typeof module !== 'undefined' && module.exports;
  var J = NODE ? require('../qimen/jieqi.js') : root.QM_JIEQI;
  // 农历、旧暦月表用时再取：首页的脚本包里农历表在本文件之后才载入
  var LUNAR0 = NODE ? require('./lunar.js') : null, KYU0 = NODE ? require('./kyureki.js') : null;
  // 协纪宜忌神煞表、七十二候名：另两件数据（/fabao/tongshu-shensha.js、/fabao/tongshu-hou.js），在就用
  var SS0 = NODE ? require('./tongshu-shensha.js') : null, HOU0 = NODE ? require('./tongshu-hou.js') : null;
  function LUNAR() { return LUNAR0 || root.QJ_LUNAR || null; }
  function KYU() { return KYU0 || root.QJ_KYUREKI || null; }
  function SS() { return SS0 || root.TS_SHENSHA || null; }
  function HOU() { return HOU0 || root.TS_HOU || null; }
  var DAY = 86400000;
  function mod(a, n) { return ((a % n) + n) % n; }

  var GAN = '甲乙丙丁戊己庚辛壬癸', ZHI = '子丑寅卯辰巳午未申酉戌亥', SX = '鼠牛虎兔龙蛇马羊猴鸡狗猪';
  var WEEK = '日一二三四五六';
  var NAYIN = ['海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
    '泉中水', '屋上土', '霹雳火', '松柏木', '长流水', '砂石金', '山下火', '平地木', '壁上土', '金箔金',
    '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木', '大溪水', '沙中土', '天上火', '石榴木', '大海水'];
  var JIANCHU = '建除满平定执破危成收开闭';
  var SHEN12 = ['青龙', '明堂', '天刑', '朱雀', '金匮', '天德', '白虎', '玉堂', '天牢', '玄武', '司命', '勾陈'];
  var HUANG = { 青龙: 1, 明堂: 1, 金匮: 1, 天德: 1, 玉堂: 1, 司命: 1 };
  var ZHI_DIR = ['正北', '东北', '东北', '正东', '东南', '东南', '正南', '西南', '西南', '正西', '西北', '西北'];
  var XI = ['东北', '西北', '西南', '正南', '东南'];                      // 甲己、乙庚、丙辛、丁壬、戊癸
  var CAI = ['东北', '东北', '西南', '西南', '正北', '正北', '正东', '正东', '正南', '正南'];
  var YANG_GUI = [7, 8, 9, 11, 1, 0, 1, 2, 3, 5], YIN_GUI = [1, 0, 11, 9, 7, 8, 7, 6, 5, 3];
  // 彭祖百忌：壬日作「汲水」（天气网老黄历同；lunar-javascript 作「泱水」）
  var PENG_GAN = ['甲不开仓，财物耗散', '乙不栽植，千株不长', '丙不修灶，必见灾殃', '丁不剃头，头必生疮', '戊不受田，田主不祥',
    '己不破券，二比并亡', '庚不经络，织机虚张', '辛不合酱，主人不尝', '壬不汲水，更难提防', '癸不词讼，理弱敌强'];
  var PENG_ZHI = ['子不问卜，自惹祸殃', '丑不冠带，主不还乡', '寅不祭祀，神鬼不尝', '卯不穿井，水泉不香', '辰不哭泣，必主重丧',
    '巳不远行，财物伏藏', '午不苫盖，屋主更张', '未不服药，毒气入肠', '申不安床，鬼祟入房', '酉不会客，醉坐颠狂',
    '戌不吃犬，作怪上床', '亥不嫁娶，不利新郎'];
  // 建除宜忌：通书常见简本，只在协纪全表（tongshu-shensha.js）没载入时顶用。
  // 与 data/rike.yaml（首页日课的退路）是同一份，改一处另一处也要改（scripts/tongshu/check.js 会核对）
  var YIJI = {
    建: { yi: ['出行', '上任', '谒贵', '求谋'], ji: ['动土', '开仓', '嫁娶', '安葬'] },
    除: { yi: ['祭祀', '扫舍', '求医', '治病', '沐浴'], ji: ['嫁娶', '远行', '移徙', '开市'] },
    满: { yi: ['祭祀', '祈福', '开市', '纳财', '交易'], ji: ['栽种', '上任', '求医', '安葬'] },
    平: { yi: ['修造', '修饰垣墙', '平治道涂'], ji: ['祈福', '开渠', '栽种', '嫁娶'] },
    定: { yi: ['会友', '冠带', '纳畜', '嫁娶', '立契'], ji: ['诉讼', '出行', '求医', '移徙'] },
    执: { yi: ['立契', '交易', '捕捉', '祭祀'], ji: ['开市', '移徙', '出行', '出财'] },
    破: { yi: ['求医', '治病', '破屋坏垣'], ji: ['嫁娶', '开市', '出行', '移徙', '立契', '上任'] },
    危: { yi: ['安床', '祭祀', '经营'], ji: ['登高', '行船', '出行', '嫁娶'] },
    成: { yi: ['入学', '开市', '嫁娶', '上任', '移徙', '立契', '出行'], ji: ['诉讼'] },
    收: { yi: ['纳财', '收藏', '入学', '捕捉'], ji: ['安葬', '出行', '开市', '上任'] },
    开: { yi: ['开市', '入学', '出行', '上任', '嫁娶', '移徙', '求医'], ji: ['安葬', '动土', '破土'] },
    闭: { yi: ['补垣', '塞穴', '安葬', '收藏'], ji: ['开市', '出行', '求医', '上任', '嫁娶'] }
  };
  // 建除吉凶口诀：「建满平收黑，除危定执黄，成开皆可用，闭破不相当」
  var JC_TONE = { 建: -1, 满: -1, 平: -1, 收: -1, 除: 1, 危: 1, 定: 1, 执: 1, 成: 1, 开: 1, 闭: -2, 破: -2 };
  var ROKUYO = ['大安', '赤口', '先勝', '友引', '先負', '仏滅'];
  var ROKUYO_NOTE = { 大安: '万事大吉', 赤口: '午时（11–13 点）以外皆凶', 先勝: '上午吉、下午凶', 友引: '大体吉，忌丧事', 先負: '上午凶、下午吉', 仏滅: '诸事不宜' };

  /* —— 节气 —— */
  var TERMS = J.terms, JIE = TERMS.filter(function (x, i) { return J.NAMES.indexOf(x.n) % 2 === 1; });
  var JIE_ZHI = function (n) { return mod((J.NAMES.indexOf(n) - 21) / 2 + 2, 12); };   // 立春→寅
  function lastBefore(list, t) {          // list 中 t 之前（严格小于）最后一项的下标
    var lo = 0, hi = list.length - 1;
    if (!list.length || list[0].t >= t) return -1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (list[mid].t < t) lo = mid; else hi = mid - 1; }
    return lo;
  }
  function startOf(y, m, d) { return new Date(y, m - 1, d).getTime(); }
  function endOf(y, m, d) { return new Date(y, m - 1, d + 1).getTime(); }

  /* —— 低精度太阳黄经（与 assets/js/qj/li.js 同式）与过某经度的时刻 —— */
  function sunLon(t) {
    var n = t / DAY + 2440587.5 - 2451545.0;
    var L = 280.460 + 0.9856474 * n, g = (357.528 + 0.9856003 * n) * Math.PI / 180;
    return mod(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g), 360);
  }
  function sunAt(target, from) {
    var t = from + mod(target - sunLon(from), 360) / 0.9856 * DAY;
    for (var i = 0; i < 4; i++) t += (mod(target - sunLon(t) + 180, 360) - 180) / 0.9856 * DAY;
    return t;
  }
  var yearCache = {};
  // 某公历年里要用到的时刻：四立、二分二至、土用入り、入梅、半夏生
  function yearMarks(Y) {
    if (yearCache[Y]) return yearCache[Y];
    var from = Date.UTC(Y, 0, 1) - 20 * DAY, to = Date.UTC(Y + 1, 0, 1) + 20 * DAY, by = {};
    TERMS.forEach(function (x) { if (x.t >= from && x.t < to) (by[x.n] = by[x.n] || []).push(x.t); });
    var at = function (lon) { return sunAt(lon, Date.UTC(Y, 0, 1)); };
    var r = { by: by, doyo: [297, 27, 117, 207].map(function (l) { return { lon: l, t: at(l) }; }), nyubai: at(80), hange: at(100) };
    return (yearCache[Y] = r);
  }
  function termOn(y, m, d) {                // 这一天交的节气（{ n, t } 或 null）
    var k = lastBefore(TERMS, endOf(y, m, d));
    return k >= 0 && TERMS[k].t >= startOf(y, m, d) ? TERMS[k] : null;
  }

  /* —— 七十二候：黄经每 5° 一候 ——
     初候即节气本身（精确到分）；二候、三候按低精度太阳黄经在前后两个精确节气之间插值，误差在一两分钟。
     k 为候序，立春初候 0 …… 大寒三候 71 */
  var houCache = {};
  function houMarks(Y) {                    // 覆盖公历 Y 年前后各一个多月
    if (houCache[Y]) return houCache[Y];
    var from = Date.UTC(Y - 1, 10, 15), to = Date.UTC(Y + 1, 1, 15), out = [];
    for (var i = 0; i + 1 < TERMS.length; i++) {
      var a = TERMS[i], b = TERMS[i + 1];
      if (a.t < from || a.t > to) continue;
      var idx = J.NAMES.indexOf(a.n), lon = idx * 15, q = mod(idx - 21, 24);
      var sa = sunAt(lon, a.t - 3 * DAY), sb = sunAt(lon + 15, a.t);
      out.push({ t: a.t, k: q * 3 });
      for (var n = 1; n < 3; n++) out.push({ t: a.t + (b.t - a.t) * (sunAt(lon + 5 * n, a.t) - sa) / (sb - sa), k: q * 3 + n });
    }
    return (houCache[Y] = out);
  }
  function houNamed(x) {
    var H = HOU(), o = H ? H.of(x.k) : { i: x.k, n: x.k % 3 };
    o.k = x.k; o.t = x.t;
    return o;
  }
  // 这一天的候（这一天结束前最后入的一候；入候那天整天算新候）：{ k, t, first, cn, jp, yomi, cnName, jpName … }
  function houOf(y, m, d) {
    var M = houMarks(y), k = lastBefore(M, endOf(y, m, d));
    if (k < 0) return null;
    var o = houNamed(M[k]);
    o.first = M[k].t >= startOf(y, m, d);
    return o;
  }
  // 某公历年里入的各候（排全年表用），按时刻先后
  function houOfYear(Y) {
    var a = startOf(Y, 1, 1), b = startOf(Y + 1, 1, 1);
    return houMarks(Y).filter(function (x) { return x.t >= a && x.t < b; }).map(houNamed);
  }

  /* —— 干支 —— */
  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  function gz(i) { return { i: i, gan: i % 10, zhi: i % 12, name: GAN[i % 10] + ZHI[i % 12] }; }
  function dayGZ(y, m, d) { return gz(mod(jdn(y, m, d) - 2415021 + 10, 60)); }
  function gzOf(g, z) { for (var n = 0; n < 60; n++) if (n % 10 === g && n % 12 === z) return n; return -1; }
  function nayin(i) { return NAYIN[i >> 1]; }

  // 节月：这一天结束前最后交的节；年以立春换
  function jieMonth(y, m, d) {
    var e = endOf(y, m, d), k = lastBefore(JIE, e);
    if (k < 0) return null;
    var zhi = JIE_ZHI(JIE[k].n);
    var lc = k; while (lc >= 0 && JIE[lc].n !== '立春') lc--;
    var Y = lc >= 0 ? new Date(JIE[lc].t + 8 * 3600e3).getUTCFullYear() : y;
    var yi = mod(Y - 4, 60), mi = mod(zhi - 2, 12);                    // mi：寅月 0
    var mg = mod((yi % 10 % 5) * 2 + 2 + mi, 10);
    return { zhi: zhi, jie: JIE[k], next: JIE[k + 1] || null, year: gz(yi), yearNum: Y, month: gz(gzOf(mg, zhi)), mi: mi };
  }

  /* —— 宜忌与神煞 —— */
  var ZA_START = { 0: 8, 1: 10, 2: 0, 3: 2, 4: 4, 5: 6, 6: 8, 7: 10, 8: 0, 9: 2, 10: 4, 11: 6 };   // 青龙起位，按月建（或日支）
  function shenOf(base, z) { return SHEN12[mod(z - ZA_START[base], 12)]; }
  function chongOf(g) {
    var cg = mod(g.gan + 4, 10), cz = mod(g.zhi + 6, 12);
    var sha = [8, 0, 4].indexOf(g.zhi) >= 0 ? '南' : [2, 6, 10].indexOf(g.zhi) >= 0 ? '北' : [5, 9, 1].indexOf(g.zhi) >= 0 ? '东' : '西';
    return { zhi: cz, sx: SX[cz], gz: GAN[cg] + ZHI[cz], sha: sha };
  }
  var YANGGONG = { 1: 13, 2: 11, 3: 9, 4: 7, 5: 5, 6: 3, 7: [1, 29], 8: 27, 9: 25, 10: 23, 11: 21, 12: 19 };

  /* —— 日本历注 —— */
  var ICHIRYU = { 2: [1, 6], 3: [9, 2], 4: [0, 3], 5: [3, 4], 6: [5, 6], 7: [9, 6], 8: [0, 7], 9: [3, 8], 10: [9, 6], 11: [9, 10], 0: [11, 0], 1: [3, 0] };
  var JUSHI = { 2: 10, 3: 4, 4: 11, 5: 5, 6: 0, 7: 6, 8: 1, 9: 7, 10: 2, 11: 8, 0: 3, 1: 9 };       // 受死日：节月 → 日支
  var FUJOJU = [[3, 11, 19, 27], [2, 10, 18, 26], [1, 9, 17, 25], [4, 12, 20, 28], [5, 13, 21, 29], [6, 14, 22, 30]];
  var TENON = ['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己卯', '庚辰', '辛巳', '壬午', '癸未', '己酉', '庚戌', '辛亥', '壬子', '癸丑'];
  var HASSEN = ['壬子', '甲寅', '乙卯', '丁巳', '己未', '庚申', '辛酉', '癸亥'];
  function inRange(name, a, b) { var i = gzIdxName(name), s = gzIdxName(a), e = gzIdxName(b); return mod(i - s, 60) <= mod(e - s, 60); }
  function gzIdxName(n) { return gzOf(GAN.indexOf(n[0]), ZHI.indexOf(n[1])); }

  function senjitsu(g, jm, kyu, season, doyo) {
    var out = [], add = function (n, good, note) { out.push({ n: n, good: good, note: note }); };
    var z = g.zhi, mz = jm.zhi, name = g.name;
    var TENSHA = { 春: '戊寅', 夏: '甲午', 秋: '戊申', 冬: '甲子' };
    if (TENSHA[season] === name) add('天赦日', true, '最上吉日，万事可为');
    if (ICHIRYU[mz].indexOf(z) >= 0) add('一粒万倍日', true, '宜开始、开业、存钱；忌借钱');
    if (TENON.indexOf(name) >= 0) add('天恩日', true, '吉，宜庆事');
    var BOSO = doyo ? [5, 6] : { 春: [11, 0], 夏: [2, 3], 秋: [4, 10, 1, 7], 冬: [8, 9] }[season];
    if (BOSO.indexOf(z) >= 0) add('母倉日', true, '宜嫁娶、动土');
    if (name === '甲子') add('甲子の日', true, '大黒天缘日，宜开始');
    if (name === '己巳') add('己巳の日', true, '弁财天缘日，财运最上');
    else if (z === 5) add('巳の日', true, '弁财天缘日，宜财事');
    if (z === 2) add('寅の日', true, '宜出行、开业、买钱包');
    if (kyu) { var fj = FUJOJU[(kyu.m - 1) % 6]; if (fj.indexOf(kyu.d) >= 0) add('不成就日', false, '万事难成'); }
    var SANRIN = [11, 2, 6];                                   // 寅巳申亥月亥日、卯午酉子月寅日、辰未戌丑月午日
    if (SANRIN[mod(mz - 2, 3)] === z) add('三隣亡', false, '忌动土、上梁、搬家');
    if (JUSHI[mz] === z) add('受死日', false, '大凶，丧事以外诸事不宜');
    if ([9, 5, 1][mod(mz - 2, 3)] === z) add('十死日', false, '大凶');
    if (HASSEN.indexOf(name) >= 0) add('八専', false, '忌嫁娶、动土、佛事');
    if (inRange(name, '甲申', '癸巳')) add('十方暮', false, '忌商谈、交涉');
    if (inRange(name, '庚午', '丙子')) add('大犯土', false, '忌动土');
    else if (inRange(name, '戊寅', '甲申')) add('小犯土', false, '忌动土');
    return out;
  }

  // 雑节、传统节日（落在这一天的）
  var CN_FEST = { '1-1': '春节', '1-15': '元宵', '2-2': '龙抬头', '3-3': '上巳', '5-5': '端午', '7-7': '七夕', '7-15': '中元',
    '8-15': '中秋', '9-9': '重阳', '10-1': '寒衣节', '10-15': '下元', '12-8': '腊八', '12-23': '小年' };
  function festOf(y, m, d, L) {
    var out = [], s = startOf(y, m, d), e = endOf(y, m, d), on = function (t) { return t >= s && t < e; };
    if (L && !L.leap) {
      var k = L.m + '-' + L.d;
      if (CN_FEST[k]) out.push({ n: CN_FEST[k], kind: 'cn' });
      if (L.m === 12 && L.d === L.len) out.push({ n: '除夕', kind: 'cn' });
    }
    var M = yearMarks(y);
    var dayOfT = function (t) { var x = new Date(t); return startOf(x.getFullYear(), x.getMonth() + 1, x.getDate()); };
    (M.by['立春'] || []).forEach(function (t) {
      var d0 = dayOfT(t);
      if (s === d0 - DAY) out.push({ n: '節分', kind: 'jp' });
      if (s === d0 + 87 * DAY) out.push({ n: '八十八夜', kind: 'jp' });
      if (s === d0 + 209 * DAY) out.push({ n: '二百十日', kind: 'jp' });
      if (s === d0 + 219 * DAY) out.push({ n: '二百二十日', kind: 'jp' });
    });
    ['春分', '秋分'].forEach(function (n) {
      (M.by[n] || []).forEach(function (t) {
        var d0 = dayOfT(t), h = n === '春分' ? '春' : '秋';
        if (s === d0 - 3 * DAY) out.push({ n: h + '彼岸入り', kind: 'jp' });
        if (s === d0 + 3 * DAY) out.push({ n: h + '彼岸明け', kind: 'jp' });
      });
    });
    M.doyo.forEach(function (x) { if (on(x.t)) out.push({ n: '土用入り', kind: 'jp' }); });
    if (on(M.nyubai)) out.push({ n: '入梅', kind: 'jp' });
    if (on(M.hange)) out.push({ n: '半夏生', kind: 'jp' });
    return out;
  }

  // 这一天是否在土用（四立前十八日左右，从土用入り那天起，到立X前一日止）
  function inDoyo(y, m, d, jm) {
    if ([4, 7, 10, 1].indexOf(jm.zhi) < 0) return false;          // 只在辰未戌丑月
    var lon = { 4: 27, 7: 117, 10: 207, 1: 297 }[jm.zhi];
    var t = sunAt(lon, jm.jie.t);
    var x = new Date(t);
    return startOf(y, m, d) >= startOf(x.getFullYear(), x.getMonth() + 1, x.getDate());
  }

  /* —— 一天 —— */
  var cache = {};
  function day(y, m, d) {
    if (y instanceof Date) { d = y.getDate(); m = y.getMonth() + 1; y = y.getFullYear(); }
    var key = y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
    if (cache[key]) return cache[key];
    var jm = jieMonth(y, m, d);
    if (!jm) return null;
    var g = dayGZ(y, m, d), w = new Date(y, m - 1, d).getDay();
    var LU = LUNAR(), KY = KYU();
    var L = LU && LU.toLunar(y, m, d), K = KY && KY.toLunar(y, m, d);
    var jc = JIANCHU[mod(g.zhi - jm.zhi, 12)];
    var shen = shenOf(jm.zhi, g.zhi);
    var season = ['冬', '冬', '春', '春', '春', '夏', '夏', '夏', '秋', '秋', '秋', '冬'][jm.zhi];
    var doyo = inDoyo(y, m, d, jm);
    var jq = termOn(y, m, d);
    var notes = [];                                                    // 通书大凶日
    if (mod(g.zhi - jm.year.zhi, 12) === 6) notes.push({ n: '岁破', d: '日冲太岁，大事勿用' });
    var nextT = function (n) { var k = lastBefore(TERMS, endOf(y, m, d + 1)); return k >= 0 && TERMS[k].n === n && TERMS[k].t >= endOf(y, m, d) ? TERMS[k] : null; };
    ['春分', '夏至', '秋分', '冬至'].forEach(function (n) { if (nextT(n)) notes.push({ n: '四离', d: '明日' + n + '，大事勿用' }); });
    ['立春', '立夏', '立秋', '立冬'].forEach(function (n) { if (nextT(n)) notes.push({ n: '四绝', d: '明日' + n + '，大事勿用' }); });
    if (L && !L.leap) { var yg = YANGGONG[L.m]; if (yg === L.d || (yg && yg.indexOf && yg.indexOf(L.d) >= 0)) notes.push({ n: '杨公忌', d: '杨公十三忌，大事勿用' }); }
    // 宜忌：有协纪全表用全表（「无」即空），否则用建除简本
    var S = SS(), none = function (a) { return a.length === 1 && a[0] === '无' ? [] : a; };
    var yj = S ? S.yiji(jm.month.i, g.i) : YIJI[jc], sha = S ? S.shensha(jm.zhi, g.i) : null;
    var r = {
      key: key, y: y, m: m, d: d, w: w, week: '周' + WEEK[w],
      gz: g, nayin: nayin(g.i), year: jm.year, yearNum: jm.yearNum, month: jm.month, jie: jm,
      lunar: L, lunarText: L ? LU.text(L) : '', kyu: K, kyuText: K ? (K.leap ? '閏' : '') + K.m + '月' + K.d + '日' : '',
      jieqi: jq, season: season, doyo: doyo,
      jianchu: jc, jcTone: JC_TONE[jc], shen: shen, huang: !!HUANG[shen],
      chong: chongOf(g),
      fang: { xi: XI[g.gan % 5], cai: CAI[g.gan], yangGui: ZHI_DIR[YANG_GUI[g.gan]], yinGui: ZHI_DIR[YIN_GUI[g.gan]] },
      pengzu: [PENG_GAN[g.gan], PENG_ZHI[g.zhi]],
      yi: none(yj.yi.slice()), ji: none(yj.ji.slice()), yjSrc: S ? 'xj' : 'jc', notes: notes,
      jishen: sha ? none(sha.ji) : [], xiongsha: sha ? none(sha.xiong) : [],
      tai: S ? S.tai(g.i, L && !L.leap ? L.m : 0) : null,
      xiu: S ? S.xiu(g.zhi, w) : null,
      hou: houOf(y, m, d),
      rokuyo: K ? ROKUYO[(K.m + K.d) % 6] : null,
      sen: senjitsu(g, jm, K, season, doyo),
      fest: festOf(y, m, d, L)
    };
    if (doyo && g.zhi === 1) r.fest.push({ n: '土用の丑', kind: 'jp' });
    if (!S && (jc === '破' || notes.length)) r.ji.unshift('诸事不宜');   // 简本才补；协纪全表自有「诸事不宜」「馀事勿取」
    r.rokuyoNote = r.rokuyo ? ROKUYO_NOTE[r.rokuyo] : '';
    return (cache[key] = r);
  }

  // 宜忌摘要（首页日课、日签用）：常用的排前面，「诸事不宜」「馀事勿取」照留；
  // 以顿号连起来总长不过 max 字。回 { items, more }（more：有没列出的）
  var PRI = ['诸事不宜', '嫁娶', '出行', '移徙', '入宅', '开市', '交易', '立券', '纳财', '动土', '修造', '安床', '祭祀', '祈福',
    '求医', '治病', '会亲友', '赴任', '入学', '订盟', '纳采', '安葬', '破土', '栽种', '沐浴', '裁衣', '理发', '解除', '扫舍', '开光', '求嗣', '上梁', '作灶'];
  function brief(list, max) {
    max = max || 14;
    var tail = list.indexOf('馀事勿取') >= 0 ? ['馀事勿取'] : [], room = max - (tail.length ? 5 : 0), n = -1, out = [];
    var rest = list.filter(function (x) { return x !== '馀事勿取'; }).map(function (x, i) { var p = PRI.indexOf(x); return { x: x, p: p < 0 ? 100 + i : p }; })
      .sort(function (a, b) { return a.p - b.p; });
    for (var i = 0; i < rest.length; i++) {
      if (n + 1 + rest[i].x.length > room && out.length) break;
      out.push(rest[i].x); n += 1 + rest[i].x.length;
    }
    return { items: out.concat(tail), more: out.length < rest.length };
  }

  // 十二时辰：干支（五鼠遁）、值神、冲
  function hours(r) {
    var g0 = (r.gz.gan % 5) * 2;
    return ZHI.split('').map(function (z, k) {
      var s = SHEN12[mod(k - ZA_START[r.gz.zhi], 12)], hg = gz(gzOf(mod(g0 + k, 10), k));
      return { zhi: k, name: z + '时', gz: hg.name, range: pad2(mod(2 * k - 1, 24)) + '–' + pad2(2 * k + 1),
        shen: s, huang: !!HUANG[s], chong: SX[mod(k + 6, 12)] };
    });
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function hourOf(date) { return Math.floor(mod(date.getHours() + 1, 24) / 2); }

  function month(y, m) {
    var out = [], n = new Date(y, m, 0).getDate();
    for (var d = 1; d <= n; d++) out.push(day(y, m, d));
    return out;
  }

  /* —— 事项：黄历「找吉日」与择日共用 ——
     yi：协纪宜忌里对应的条目，前 main 个为正项（宜得最重、忌也最重），其余为旁项；
     jc：建除简本里的条目（协纪全表没载入时用）；jp：日本历注的加减；qm：奇门题型（择日用）；py：存日历文件时用的拼音名 */
  var EVENTS = [
    { k: '面试', py: 'mianshi', name: '面试求职', yi: ['赴任', '会亲友', '见贵'], main: 2, jc: ['上任', '谒贵', '求谋', '会友'], qm: '求职', jp: { 一粒万倍日: 1, 十方暮: -1 } },
    { k: '考试', py: 'kaoshi', name: '考试面谈', yi: ['入学', '习艺', '见贵'], main: 1, jc: ['入学', '求谋', '谒贵'], qm: '考试', jp: { 一粒万倍日: 0.5 } },
    { k: '签约', py: 'qianyue', name: '签约交易', yi: ['立券', '交易', '纳财'], main: 2, jc: ['立契', '交易', '纳财'], qm: '签约', jp: { 一粒万倍日: 1, 巳の日: 0.5, 己巳の日: 1, 十方暮: -1.5 } },
    { k: '开业', py: 'kaiye', name: '开业开市', yi: ['开市', '挂匾', '纳财'], main: 1, jc: ['开市', '纳财'], qm: '开业', jp: { 一粒万倍日: 1.5, 寅の日: 0.5, 巳の日: 0.5, 己巳の日: 1, 甲子の日: 0.5, 仏滅: -1 } },
    { k: '搬家', py: 'banjia', name: '搬家入宅', yi: ['移徙', '入宅', '安香'], main: 2, jc: ['移徙', '入宅'], qm: '搬家', jp: { 三隣亡: -1.5, 仏滅: -0.5 } },
    { k: '出行', py: 'chuxing', name: '出行旅行', yi: ['出行'], main: 1, jc: ['出行'], qm: '出行', jp: { 寅の日: 0.5, 一粒万倍日: 0.5 } },
    { k: '嫁娶', py: 'jiaqu', name: '嫁娶提亲', yi: ['嫁娶', '纳采', '订盟'], main: 1, jc: ['嫁娶'], qm: '婚姻', jp: { 母倉日: 1, 八専: -1, 仏滅: -1.5, 友引: 0.5 } },
    { k: '求医', py: 'qiuyi', name: '求医治病', yi: ['求医', '治病', '针灸'], main: 2, jc: ['求医', '治病'], qm: '疾病', jp: { 一粒万倍日: -0.5 } },
    { k: '动土', py: 'dongtu', name: '动土装修', yi: ['动土', '修造', '破土', '起基', '修饰垣墙'], main: 2, jc: ['动土', '修造', '修饰垣墙'], qm: '自由', jp: { 三隣亡: -2, 大犯土: -2, 小犯土: -1.5, 八専: -1, 母倉日: 1 } },
    { k: '祭祀', py: 'jisi', name: '祭祀祈福', yi: ['祭祀', '祈福'], main: 2, jc: ['祭祀', '祈福'], qm: '自由', jp: { 八専: -1 } }
  ];
  var EV_BY = {}; EVENTS.forEach(function (e) { EV_BY[e.k] = e; });
  // 彭祖百忌与事项的抵触
  var PENG_HIT = { 0: ['开业'], 2: ['动土'], 4: ['动土'], 5: ['签约'], 9: [], 1: [], 3: [], 6: [], 7: [], 8: [] };
  var PENG_HIT_Z = { 0: [], 1: ['面试'], 2: ['祭祀'], 5: ['出行'], 6: ['动土'], 7: ['求医'], 8: ['搬家'], 9: ['面试', '签约'], 11: ['嫁娶'] };
  var JP_BASE = { 天赦日: 2, 天恩日: 0.5, 母倉日: 0.5, 不成就日: -2, 受死日: -2, 十死日: -1.5 };
  var RK_BASE = { 大安: 1, 仏滅: -1, 赤口: -0.5 };

  // 大吉神：遇之加分（协纪宜忌里已有其效，这里只轻加）
  var BIG_JI = ['天赦', '天愿', '天德', '月德', '天德合', '月德合'];

  /* 某天对某事的打分。opt: { jp: 计日本历注, sx: 本命年支（0 子 … 11 亥）或 null }
     返回 { score, plus: [{t, v, src}], minus: [{t, v, src}] }；分数大致在 −12 到 +8 之间。
     有协纪全表时：正项入宜 +3、只旁项入宜 +2（多一项再加 0.5，至多加 1）；正项入忌 −4、只旁项入忌 −2.5；
     都不在而这天「诸事不宜」−3.5、「馀事勿取」−2，否则看建除吉凶 ±0.5。
     另计：黄道黑道 ±1、破日 −1.5（求医与宜此事者不计）、岁破四离四绝杨公忌各 −4、大吉神每个 +0.5（至多 +1）、
     二十八宿吉凶 ±0.5、冲本命 −3、彭祖百忌 −1；开日本历注再加六曜選日。
     分档（grade）按 2025–2034 十年、十种事项试算的分布定，见 scripts/tongshu/check.js */
  function score(r, k, opt) {
    opt = opt || {};
    var ev = EV_BY[k] || null, plus = [], minus = [], put = function (t, v, src) { (v >= 0 ? plus : minus).push({ t: t, v: v, src: src }); };
    var tone = function (w) { put(r.jianchu + '日（建除' + (r.jcTone > 0 ? '吉' : '凶') + '日）', r.jcTone * w, '建除'); };
    var inYi = false;
    if (ev && r.yjSrc === 'xj') {
      var main = ev.yi.slice(0, ev.main), has = function (list) { return ev.yi.filter(function (x) { return list.indexOf(x) >= 0; }); };
      var yi = has(r.yi), ji = has(r.ji), mainYi = yi.some(function (x) { return main.indexOf(x) >= 0; });
      inYi = yi.length > 0;
      if (yi.length) put('宜' + yi.join('、'), (mainYi ? 3 : 2) + Math.min(1, 0.5 * (yi.length - 1)), '宜忌');
      if (ji.length) put('忌' + ji.join('、'), ji.some(function (x) { return main.indexOf(x) >= 0; }) ? -4 : -2.5, '宜忌');
      if (!yi.length && !ji.length) {
        if (r.yi.indexOf('诸事不宜') >= 0 || r.ji.indexOf('诸事不宜') >= 0) put('诸事不宜', -3.5, '宜忌');
        else if (r.yi.indexOf('馀事勿取') >= 0 || r.ji.indexOf('馀事勿取') >= 0) put('宜忌未列此事（馀事勿取）', -2, '宜忌');
        else tone(0.5);
      }
    } else if (ev) {                                   // 建除简本
      var yj = YIJI[r.jianchu], y2 = ev.jc.filter(function (x) { return yj.yi.indexOf(x) >= 0; }), j2 = ev.jc.filter(function (x) { return yj.ji.indexOf(x) >= 0; });
      inYi = y2.length > 0;
      if (y2.length) put(r.jianchu + '日宜' + y2.join('、'), 3, '建除');
      if (j2.length) put(r.jianchu + '日忌' + j2.join('、'), -3.5, '建除');
      if (!y2.length && !j2.length) tone(0.5);
    } else tone(1);
    if (r.jianchu === '破' && !(ev && (ev.k === '求医' || inYi))) put('月破（破日）大事勿用', r.yjSrc === 'xj' ? -1.5 : -3, '建除');
    put((r.huang ? '黄道日（' : '黑道日（') + r.shen + '）', r.huang ? 1 : -1, '值神');
    r.notes.forEach(function (x) { put(x.n + '：' + x.d, -4, '通书'); });        // 岁破、四离四绝、杨公忌：大事勿用
    var big = (r.jishen || []).filter(function (x) { return BIG_JI.indexOf(x) >= 0; });
    if (big.length) put(big.join('、') + '（大吉神）', Math.min(1, 0.5 * big.length), '神煞');
    if (r.xiu) put('二十八宿' + r.xiu.full + '（' + r.xiu.luck + '）', r.xiu.luck === '吉' ? 0.25 : -0.25, '星宿');
    if (opt.sx != null && opt.sx === r.chong.zhi) put('日冲本命（属' + SX[opt.sx] + '）', -3, '冲');
    if (ev) {
      if ((PENG_HIT[r.gz.gan] || []).indexOf(ev.k) >= 0) put('彭祖：' + r.pengzu[0], -1, '彭祖');
      if ((PENG_HIT_Z[r.gz.zhi] || []).indexOf(ev.k) >= 0) put('彭祖：' + r.pengzu[1], -1, '彭祖');
    }
    if (opt.jp) {
      var jp = (ev && ev.jp) || {};
      r.sen.forEach(function (s) {
        var v = jp[s.n] != null ? jp[s.n] : JP_BASE[s.n];
        if (v) put(s.n + (s.note ? '：' + s.note : ''), v, '日本历注');
      });
      if (r.rokuyo) {
        var v = jp[r.rokuyo] != null ? jp[r.rokuyo] : RK_BASE[r.rokuyo];
        if (v) put(r.rokuyo + '：' + r.rokuyoNote, v, '六曜');
      }
    }
    var s = 0; plus.concat(minus).forEach(function (x) { s += x.v; });
    plus.sort(function (a, b) { return b.v - a.v; }); minus.sort(function (a, b) { return a.v - b.v; });
    return { score: Math.round(s * 10) / 10, plus: plus, minus: minus };
  }
  // 分档：2025–2034 十年 × 十种事项试算（分数皆为 0.25 的倍数）。开日本历注时六曜選日多扣分，凶的门槛放低半分：
  // 日本历注关：上吉 11.4%、吉 22.4%、平 29.5%、次 22.3%、凶 14.4%
  // 日本历注开：上吉 10.6%、吉 20.6%、平 27.9%、次 25.1%、凶 15.8%
  function grade(s, jp) { return s >= 3.75 ? '上吉' : s >= 1.25 ? '吉' : s >= -1.75 ? '平' : s >= (jp ? -4.75 : -4.25) ? '次' : '凶'; }

  // 年里的节气（排节气表用）：[{ n, t }]
  function termsOfYear(Y) { return TERMS.filter(function (x) { return new Date(x.t).getFullYear() === Y; }); }

  /* —— 日历文件（.ics，RFC 5545）——
     events: [{ uid, title, desc?, url?, date: [y, m, d]（整天）| start, end（UTC 毫秒，定时） }]
     整天的写 DTSTART;VALUE=DATE 与次日的 DTEND；定时的一律写 UTC（…Z）。行以 CRLF 断，过 75 字节折行（按 UTF-8 计，不拆字） */
  function icsText(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function icsFold(line) {
    var out = [], cur = '', n = 0, lim = 75;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i], c = line.charCodeAt(i);
      if (c >= 0xD800 && c <= 0xDBFF && i + 1 < line.length) ch += line[++i];
      var b = c < 0x80 ? 1 : c < 0x800 ? 2 : ch.length > 1 ? 4 : 3;
      if (n + b > lim) { out.push(cur); cur = ''; n = 0; lim = 74; }     // 续行以一个空格开头，空格也算一字节
      cur += ch; n += b;
    }
    out.push(cur);
    return out.join('\r\n ');
  }
  function icsDate(a) { var t = new Date(Date.UTC(a[0], a[1] - 1, a[2])); return t.getUTCFullYear() + pad2(t.getUTCMonth() + 1) + pad2(t.getUTCDate()); }
  function icsUTC(ms) { return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  function ics(events, name) {
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ohwowbill.com//Qianjiao Tongshu//ZH', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    if (name) L.push('X-WR-CALNAME:' + icsText(name));
    var stamp = icsUTC(Date.now());
    events.forEach(function (e) {
      L.push('BEGIN:VEVENT', 'UID:' + e.uid, 'DTSTAMP:' + stamp);
      if (e.date) L.push('DTSTART;VALUE=DATE:' + icsDate(e.date), 'DTEND;VALUE=DATE:' + icsDate([e.date[0], e.date[1], e.date[2] + 1]), 'TRANSP:TRANSPARENT');
      else L.push('DTSTART:' + icsUTC(e.start), 'DTEND:' + icsUTC(e.end > e.start ? e.end : e.start + 3600e3));
      L.push('SUMMARY:' + icsText(e.title));
      if (e.desc) L.push('DESCRIPTION:' + icsText(e.desc));
      if (e.url) L.push('URL:' + e.url);
      L.push('END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.map(icsFold).join('\r\n') + '\r\n';
  }
  // 浏览器里存成文件：Blob + <a download>。iOS Safari 下载后点开即进「日历」；不支持 download 的老浏览器直接打开。
  // 文件名用 ASCII（有的浏览器遇到中文文件名会改成 download）
  // 回 'inapp' 表示像是 LINE、微信等应用内浏览器（多半存不下文件），页面可提示改用 Safari / Chrome 打开
  function saveICS(filename, text) {
    if (typeof document === 'undefined') return false;
    var blob = new Blob([text], { type: 'text/calendar;charset=utf-8' }), url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.rel = 'noopener'; a.style.display = 'none';
    if (!('download' in a)) location.href = url;
    else { document.body.appendChild(a); a.click(); a.remove(); }
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    return /\bLine\/|MicroMessenger|FBAN|FBAV|Instagram/i.test(navigator.userAgent || '') ? 'inapp' : true;
  }
  // 整天事项的 UID：日期 + 种类 + 名目的短散列（同一天同一名目再导入时日历会认作同一条）
  function uid(dateKey, kind, name) {
    var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return dateKey.replace(/\D/g, '') + '-' + kind + '-' + h.toString(36) + '@ohwowbill.com';
  }

  var api = {
    GAN: GAN, ZHI: ZHI, SX: SX, WEEK: WEEK, NAYIN: NAYIN, JIANCHU: JIANCHU, SHEN12: SHEN12, HUANG: HUANG, ZHI_DIR: ZHI_DIR,
    YIJI: YIJI, ROKUYO: ROKUYO, ROKUYO_NOTE: ROKUYO_NOTE, EVENTS: EVENTS, EV_BY: EV_BY,
    day: day, month: month, hours: hours, hourOf: hourOf, score: score, grade: grade, jieMonth: jieMonth, brief: brief, BIG_JI: BIG_JI,
    hou: houOf, houOfYear: houOfYear, ics: ics, saveICS: saveICS, uid: uid,
    dayGZ: dayGZ, gzOf: gzOf, nayin: nayin, chongOf: chongOf, sunLon: sunLon, sunAt: sunAt, termsOfYear: termsOfYear, yearMarks: yearMarks, mod: mod
  };
  if (NODE) module.exports = api; else root.TS = api;
})(this);
