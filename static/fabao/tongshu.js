/* =========================================================
   通书 · 黄历底座 —— 只管算，不碰页面
   ---------------------------------------------------------
   给日课、黄历、择日、流年共用：某一天的干支纳音、建除、值神（黄道黑道）、
   冲煞、吉神方位、彭祖百忌、宜忌、十二时辰吉凶，以及日本历注（六曜、選日、雑節）。
   口径
     · 节月以「节」换：交节那一天整天算新月（日本暦注同此）；节气取 /qimen/jieqi.js（精确到分）。
     · 建除：日支与月建同为「建」，顺数；交节之日自然重复前一日。
     · 值神：青龙起法「寅申需加子，卯酉却居寅，辰戌龙位上，巳亥午中寻，子午临申地，丑未戌坐行」，
       日按月建起、时按日支起；青龙、明堂、金匮、天德、玉堂、司命为黄道。
     · 冲煞：天克地冲（冲干为日干后四位，冲支对冲）；申子辰煞南、寅午戌煞北、巳酉丑煞东、亥卯未煞西。
     · 喜神：甲己东北、乙庚西北、丙辛西南、丁壬正南、戊癸东南；
       财神：甲乙东北、丙丁西南、戊己正北、庚辛正东、壬癸正南；
       阳贵阴贵：《协纪辨方书》表。
     · 宜忌：以建除十二神为主（通书常见简本，与 data/rike.yaml 同一份），
       再标黄道黑道、岁破、四离四绝、杨公忌。神煞全套（天德月德、往亡、归忌……）不在此列。
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
  var LUNAR = NODE ? require('./lunar.js') : root.QJ_LUNAR;
  var KYU = NODE ? require('./kyureki.js') : root.QJ_KYUREKI;
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
  var PENG_GAN = ['甲不开仓，财物耗散', '乙不栽植，千株不长', '丙不修灶，必见灾殃', '丁不剃头，头必生疮', '戊不受田，田主不祥',
    '己不破券，二比并亡', '庚不经络，织机虚张', '辛不合酱，主人不尝', '壬不汲水，更难提防', '癸不词讼，理弱敌强'];
  var PENG_ZHI = ['子不问卜，自惹祸殃', '丑不冠带，主不还乡', '寅不祭祀，神鬼不尝', '卯不穿井，水泉不香', '辰不哭泣，必主重丧',
    '巳不远行，财物伏藏', '午不苫盖，屋主更张', '未不服药，毒气入肠', '申不安床，鬼祟入房', '酉不会客，醉坐颠狂',
    '戌不吃犬，作怪上床', '亥不嫁娶，不利新郎'];
  // 建除宜忌：通书常见简本。与 data/rike.yaml（首页日课）是同一份，改一处另一处也要改（scripts/tongshu/check.js 会核对）
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
    var L = LUNAR && LUNAR.toLunar(y, m, d), K = KYU && KYU.toLunar(y, m, d);
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
    var yj = YIJI[jc];
    var r = {
      key: key, y: y, m: m, d: d, w: w, week: '周' + WEEK[w],
      gz: g, nayin: nayin(g.i), year: jm.year, yearNum: jm.yearNum, month: jm.month, jie: jm,
      lunar: L, lunarText: L ? LUNAR.text(L) : '', kyu: K, kyuText: K ? (K.leap ? '閏' : '') + K.m + '月' + K.d + '日' : '',
      jieqi: jq, season: season, doyo: doyo,
      jianchu: jc, jcTone: JC_TONE[jc], shen: shen, huang: !!HUANG[shen],
      chong: chongOf(g),
      fang: { xi: XI[g.gan % 5], cai: CAI[g.gan], yangGui: ZHI_DIR[YANG_GUI[g.gan]], yinGui: ZHI_DIR[YIN_GUI[g.gan]] },
      pengzu: [PENG_GAN[g.gan], PENG_ZHI[g.zhi]],
      yi: yj.yi.slice(), ji: yj.ji.slice(), notes: notes,
      rokuyo: K ? ROKUYO[(K.m + K.d) % 6] : null,
      sen: senjitsu(g, jm, K, season, doyo),
      fest: festOf(y, m, d, L)
    };
    if (doyo && g.zhi === 1) r.fest.push({ n: '土用の丑', kind: 'jp' });
    if (jc === '破' || notes.length) r.ji.unshift('诸事不宜');
    r.rokuyoNote = r.rokuyo ? ROKUYO_NOTE[r.rokuyo] : '';
    return (cache[key] = r);
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
     yi：通书里对应的条目；jp：日本历注的加减；qm：奇门题型（择日用） */
  var EVENTS = [
    { k: '面试', name: '面试求职', yi: ['上任', '谒贵', '求谋', '会友'], qm: '求职', jp: { 一粒万倍日: 1, 十方暮: -1 } },
    { k: '考试', name: '考试面谈', yi: ['入学', '求谋', '谒贵'], qm: '考试', jp: { 一粒万倍日: 0.5 } },
    { k: '签约', name: '签约交易', yi: ['立契', '交易', '纳财'], qm: '签约', jp: { 一粒万倍日: 1, 巳の日: 0.5, 己巳の日: 1, 十方暮: -1.5 } },
    { k: '开业', name: '开业开市', yi: ['开市', '纳财'], qm: '开业', jp: { 一粒万倍日: 1.5, 寅の日: 0.5, 巳の日: 0.5, 己巳の日: 1, 甲子の日: 0.5, 仏滅: -1 } },
    { k: '搬家', name: '搬家入宅', yi: ['移徙', '入宅'], qm: '搬家', jp: { 三隣亡: -1.5, 仏滅: -0.5 } },
    { k: '出行', name: '出行旅行', yi: ['出行'], qm: '出行', jp: { 寅の日: 0.5, 一粒万倍日: 0.5 } },
    { k: '嫁娶', name: '嫁娶提亲', yi: ['嫁娶'], qm: '婚姻', jp: { 母倉日: 1, 八専: -1, 仏滅: -1.5, 友引: 0.5 } },
    { k: '求医', name: '求医治病', yi: ['求医', '治病'], qm: '疾病', jp: { 一粒万倍日: -0.5 } },
    { k: '动土', name: '动土装修', yi: ['动土', '修造', '修饰垣墙'], qm: '自由', jp: { 三隣亡: -2, 大犯土: -2, 小犯土: -1.5, 八専: -1, 母倉日: 1 } },
    { k: '祭祀', name: '祭祀祈福', yi: ['祭祀', '祈福'], qm: '自由', jp: { 八専: -1 } }
  ];
  var EV_BY = {}; EVENTS.forEach(function (e) { EV_BY[e.k] = e; });
  // 彭祖百忌与事项的抵触
  var PENG_HIT = { 0: ['开业'], 2: ['动土'], 4: ['动土'], 5: ['签约'], 9: [], 1: [], 3: [], 6: [], 7: [], 8: [] };
  var PENG_HIT_Z = { 0: [], 1: ['面试'], 2: ['祭祀'], 5: ['出行'], 6: ['动土'], 7: ['求医'], 8: ['搬家'], 9: ['面试', '签约'], 11: ['嫁娶'] };
  var JP_BASE = { 天赦日: 2, 天恩日: 0.5, 母倉日: 0.5, 不成就日: -2, 受死日: -2, 十死日: -1.5 };
  var RK_BASE = { 大安: 1, 仏滅: -1, 赤口: -0.5 };

  /* 某天对某事的打分。opt: { jp: 计日本历注, sx: 本命年支（0 子 … 11 亥）或 null }
     返回 { score, plus: [{t, v}], minus: [{t, v}] }；分数大致在 −10 到 +8 之间 */
  function score(r, k, opt) {
    opt = opt || {};
    var ev = EV_BY[k] || null, plus = [], minus = [], put = function (t, v, src) { (v >= 0 ? plus : minus).push({ t: t, v: v, src: src }); };
    if (ev) {
      var yi = ev.yi.filter(function (x) { return r.yi.indexOf(x) >= 0; }), ji = ev.yi.filter(function (x) { return YIJI[r.jianchu].ji.indexOf(x) >= 0; });
      if (yi.length) put(r.jianchu + '日宜' + yi.join('、'), 3, '建除');
      if (ji.length) put(r.jianchu + '日忌' + ji.join('、'), -3.5, '建除');
      if (!yi.length && !ji.length) put(r.jianchu + '日（建除' + (r.jcTone > 0 ? '吉' : '凶') + '日）', r.jcTone * 0.5, '建除');
    } else put(r.jianchu + '日（建除' + (r.jcTone > 0 ? '吉' : '凶') + '日）', r.jcTone, '建除');
    if (r.jianchu === '破' && !(ev && ev.k === '求医')) put('月破（破日）大事勿用', -3, '建除');
    put((r.huang ? '黄道 · ' : '黑道 · ') + r.shen, r.huang ? 1.5 : -1.5, '值神');
    r.notes.forEach(function (x) { put(x.n + '：' + x.d, -3.5, '通书'); });        // 岁破、四离四绝、杨公忌：大事勿用
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
  function grade(s) { return s >= 4.5 ? '上吉' : s >= 2 ? '吉' : s >= -0.5 ? '平' : s >= -3.5 ? '次' : '凶'; }

  // 年里的节气（排节气表用）：[{ n, t }]
  function termsOfYear(Y) { return TERMS.filter(function (x) { return new Date(x.t).getFullYear() === Y; }); }

  var api = {
    GAN: GAN, ZHI: ZHI, SX: SX, WEEK: WEEK, NAYIN: NAYIN, JIANCHU: JIANCHU, SHEN12: SHEN12, HUANG: HUANG, ZHI_DIR: ZHI_DIR,
    YIJI: YIJI, ROKUYO: ROKUYO, ROKUYO_NOTE: ROKUYO_NOTE, EVENTS: EVENTS, EV_BY: EV_BY,
    day: day, month: month, hours: hours, hourOf: hourOf, score: score, grade: grade, jieMonth: jieMonth,
    dayGZ: dayGZ, gzOf: gzOf, nayin: nayin, chongOf: chongOf, sunLon: sunLon, sunAt: sunAt, termsOfYear: termsOfYear, yearMarks: yearMarks, mod: mod
  };
  if (NODE) module.exports = api; else root.TS = api;
})(this);
