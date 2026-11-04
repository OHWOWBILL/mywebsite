/* =========================================================
   奇门手记 · 排盘核心（时家 · 转盘 · 拆补定局）
   ---------------------------------------------------------
   computeChart(date, override)  排出一盘：四柱、局、九宫的
       天盘干 / 九星 / 八门 / 八神 / 地盘干 / 隐干 / 地盘八神，
       日空时空、驿马，以及每宫的击刑 / 入墓 / 门迫标记。
   analyze(chart)                列出本盘格局（全盘 + 各宫）。
   palaceDetail(chart, p)        一宫的逐项解读。
   solarClock(date, lon)         真太阳时：按经度与均时差校正后的钟点。
   yongshen(chart, topic)        按题型取用神，标出各自落宫及与日干宫的生克。
   yingqi(chart, p, stem)        某宫的应期候选：落宫地支、空亡填实冲空、马星、冲墓。

   口径（流派不同处都写在这里，要改只改这里）：
   · 隐干：地盘干随八门同转（值使门从本宫转到哪，原宫地盘干就跟到哪）。
   · 地盘八神：值符起于旬首本宫（中五寄坤二），阳顺阴逆，不随时干转。
   · 入墓：按十二长生阳顺阴逆，乙丙戊墓乾，丁己庚墓艮，辛壬墓巽，癸墓坤。
   · 击刑：戊震、己坤、庚艮、辛离、壬巽、癸巽。
   · 门迫：门的五行克所落宫的五行。
   · 刑、墓只标天盘干（含寄宫干），和常见排盘软件一致。
   · 旺衰按月令：八门、天干用五行旺相休囚死（当令旺、令生相、生令休、克令囚、令克死）；
     九星用奇门星法（我生令旺、同令相、令生我休、令克我囚、我克令废）。
   · 真太阳时只改日柱、时柱（钟点）；节气、年柱、月柱按真实时刻。
   · 年命：出生年的年干（甲遁旬首六仪），看天盘落宫。
   浏览器里挂 window.QM；node 里 require 即得同一对象。
   ========================================================= */
(function (root) {
  'use strict';
  var J = (typeof module !== 'undefined' && module.exports) ? require('./jieqi.js') : root.QM_JIEQI;
  var TERMS = J.terms;

  var STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var RING = [1, 8, 3, 4, 9, 2, 7, 6];                 // 八宫顺时针
  var GRID = [4, 9, 2, 3, 5, 7, 8, 1, 6];              // 九宫格从左上起
  var STAR_HOME = { 1: '天蓬', 8: '天任', 3: '天冲', 4: '天辅', 9: '天英', 2: '天芮', 7: '天柱', 6: '天心', 5: '天禽' };
  var DOOR_HOME = { 1: '休门', 8: '生门', 3: '伤门', 4: '杜门', 9: '景门', 2: '死门', 7: '惊门', 6: '开门' };
  var GODS = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];
  var GOD_SHORT = { 值符: '符', 腾蛇: '蛇', 太阴: '阴', 六合: '合', 白虎: '虎', 玄武: '玄', 九地: '地', 九天: '天' };
  var PALACE_NAME = { 1: '坎一', 8: '艮八', 3: '震三', 4: '巽四', 9: '离九', 2: '坤二', 7: '兑七', 6: '乾六', 5: '中五' };
  var PNUM = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九' };
  var EARTH_SEQ = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
  var XUN_DUN = { 0: '戊', 10: '己', 20: '庚', 30: '辛', 40: '壬', 50: '癸' };
  var XUN_KONG = { 0: ['戌', '亥'], 10: ['申', '酉'], 20: ['午', '未'], 30: ['辰', '巳'], 40: ['寅', '卯'], 50: ['子', '丑'] };
  var JU = {
    '冬至': [1, 7, 4], '小寒': [2, 8, 5], '大寒': [3, 9, 6], '立春': [8, 5, 2], '雨水': [9, 6, 3], '惊蛰': [1, 7, 4],
    '春分': [3, 9, 6], '清明': [4, 1, 7], '谷雨': [5, 2, 8], '立夏': [4, 1, 7], '小满': [5, 2, 8], '芒种': [6, 3, 9],
    '夏至': [9, 3, 6], '小暑': [8, 2, 5], '大暑': [7, 1, 4], '立秋': [2, 5, 8], '处暑': [1, 4, 7], '白露': [9, 3, 6],
    '秋分': [7, 1, 4], '寒露': [6, 9, 3], '霜降': [5, 8, 2], '立冬': [6, 9, 3], '小雪': [5, 8, 2], '大雪': [4, 7, 1]
  };
  var YANG_TERMS = ['冬至', '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种'];
  var JIE = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
  var MONTH_BRANCH_BY_JIE = { 立春: 2, 惊蛰: 3, 清明: 4, 立夏: 5, 芒种: 6, 小暑: 7, 立秋: 8, 白露: 9, 寒露: 10, 立冬: 11, 大雪: 0, 小寒: 1 };
  var HORSE = { 2: '申', 6: '申', 10: '申', 8: '寅', 0: '寅', 4: '寅', 5: '亥', 9: '亥', 1: '亥', 11: '巳', 3: '巳', 7: '巳' };
  var BRANCH_PALACE = { 0: 1, 1: 8, 2: 8, 3: 3, 4: 4, 5: 4, 6: 9, 7: 2, 8: 2, 9: 7, 10: 6, 11: 6 };

  // —— 五行 ——
  var STEM_WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  var PALACE_WX = { 1: '水', 8: '土', 3: '木', 4: '木', 9: '火', 2: '土', 7: '金', 6: '金', 5: '土' };
  var DOOR_WX = { 休门: '水', 生门: '土', 伤门: '木', 杜门: '木', 景门: '火', 死门: '土', 惊门: '金', 开门: '金' };
  var STAR_WX = { 天蓬: '水', 天任: '土', 天冲: '木', 天辅: '木', 天英: '火', 天芮: '土', 天柱: '金', 天心: '金', 天禽: '土' };
  var GOD_WX = { 值符: '木', 腾蛇: '火', 太阴: '金', 六合: '木', 白虎: '金', 玄武: '水', 九地: '土', 九天: '金' };
  var KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };       // a 克 KE[a]
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };    // a 生 SHENG[a]

  // —— 标记口径 ——
  var XING = { 戊: 3, 己: 2, 庚: 8, 辛: 9, 壬: 4, 癸: 4 };
  var MU = { 乙: 6, 丙: 6, 戊: 6, 丁: 8, 己: 8, 庚: 8, 辛: 4, 壬: 4, 癸: 2 };

  var DAY = 86400000;
  function mod(a, n) { return ((a % n) + n) % n; }
  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  function gzName(i) { return STEMS[i % 10] + BRANCHES[i % 12]; }
  function gzIndex(stem, branch) { for (var n = 0; n < 60; n++) if (n % 10 === stem && n % 12 === branch) return n; return -1; }
  // 某干支的「用干」：甲遁于本旬旬首六仪
  function useStem(idx) { return idx % 10 === 0 ? XUN_DUN[idx - idx % 10] : STEMS[idx % 10]; }

  // 二分找最后一个 t <= ms 的节气
  function termAt(ms) {
    var lo = 0, hi = TERMS.length - 1;
    if (ms < TERMS[0].t || ms >= TERMS[hi].t) return -1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (TERMS[mid].t <= ms) lo = mid; else hi = mid - 1; }
    return lo;
  }
  var RANGE = { min: TERMS[0].t + 31 * DAY, max: TERMS[TERMS.length - 1].t - 31 * DAY };
  function inRange(dt) { var ms = dt.getTime(); return ms >= RANGE.min && ms <= RANGE.max; }

  // —— 真太阳时 ——
  // 均时差（分钟），NOAA 分数年公式，误差一分钟内
  function eqTime(dt) {
    var start = new Date(dt.getFullYear(), 0, 1);
    var doy = Math.floor((dt - start) / DAY);
    var g = 2 * Math.PI / 365 * (doy + (dt.getHours() - 12) / 24);
    return 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  }
  // 返回一个 Date，它的本机钟点就是该经度的真太阳时；shift 为校正分钟数
  function solarClock(dt, lon) {
    var meridian = -dt.getTimezoneOffset() / 60 * 15;
    var lonFix = (lon - meridian) * 4, eot = eqTime(dt);
    var shift = lonFix + eot;
    return { date: new Date(dt.getTime() + shift * 60000), shift: shift, lonFix: lonFix, eot: eot, meridian: meridian };
  }

  // —— 旺衰 ——
  var MONTH_WX = { 0: '水', 1: '土', 2: '木', 3: '木', 4: '土', 5: '火', 6: '火', 7: '土', 8: '金', 9: '金', 10: '土', 11: '水' };
  function wsStd(wx, ling) {
    if (wx === ling) return '旺';
    if (SHENG[ling] === wx) return '相';
    if (SHENG[wx] === ling) return '休';
    if (KE[wx] === ling) return '囚';
    return '死';
  }
  function wsStar(wx, ling) {
    if (SHENG[wx] === ling) return '旺';
    if (wx === ling) return '相';
    if (SHENG[ling] === wx) return '休';
    if (KE[ling] === wx) return '囚';
    return '废';
  }

  // opts: { solarLon: 经度（开真太阳时）, mingYear: 出生年（年命） }
  function computeChart(dt, juOverride, opts) {
    opts = opts || {};
    var ms = dt.getTime();
    var solar = typeof opts.solarLon === 'number' && isFinite(opts.solarLon) ? solarClock(dt, opts.solarLon) : null;
    var clock = solar ? solar.date : dt;
    var termIdx = termAt(ms);
    if (termIdx < 0) return null;
    var term = TERMS[termIdx], termNext = TERMS[termIdx + 1] || null;
    var nearBoundary = (termNext && termNext.t - ms < 3600e3) || (ms - term.t < 3600e3);

    // 四柱：日、时按本机钟点（23 点起换日），年以立春、月以节换
    var y = clock.getFullYear(), mo = clock.getMonth() + 1, d = clock.getDate(), h = clock.getHours();
    var Jd = jdn(y, mo, d); if (h >= 23) Jd += 1;
    var dayIdx = mod(Jd - 2415021 + 10, 60);
    var hb = Math.floor(((h + 1) % 24) / 2);
    var hs = ((dayIdx % 10) % 5 * 2 + hb) % 10;
    var hIdx = gzIndex(hs, hb);
    var lastJie = null, liChun = null;
    for (var k = termIdx; k >= 0 && (!lastJie || !liChun); k--) {
      if (!lastJie && JIE.indexOf(TERMS[k].n) >= 0) lastJie = TERMS[k];
      if (!liChun && TERMS[k].n === '立春') liChun = TERMS[k];
    }
    var yAdj = liChun ? new Date(liChun.t).getFullYear() : y - 1;
    var yearIdx = mod(yAdj - 1984, 60);
    var mb = MONTH_BRANCH_BY_JIE[lastJie.n];
    var mstem = ((yearIdx % 10) % 5 * 2 + 2 + mod(mb - 2, 12)) % 10;
    var monthIdx = gzIndex(mstem, mb);

    // 定局：拆补，符头定元
    var dstem = dayIdx % 10;
    var futou = mod(dayIdx - dstem % 5, 60), fb = futou % 12;
    var yuan = [0, 6, 3, 9].indexOf(fb) >= 0 ? 0 : [2, 8, 5, 11].indexOf(fb) >= 0 ? 1 : 2;
    var isYang = juOverride ? juOverride.yang : YANG_TERMS.indexOf(term.n) >= 0;
    var ju = juOverride ? juOverride.ju : JU[term.n][yuan];

    // 地盘
    var earth = {};
    for (var i = 0; i < 9; i++) {
      var p = isYang ? ((ju - 1 + i) % 9) + 1 : mod(ju - 1 - i, 9) + 1;
      earth[p] = EARTH_SEQ[i];
    }
    function palaceOfStem(s) { for (var q = 1; q <= 9; q++) if (earth[q] === s) return q; }
    var rpos = function (q) { return RING.indexOf(q); };

    // 旬首、值符、值使
    var xun = hIdx - hIdx % 10;
    var dun = XUN_DUN[xun];
    var kong = XUN_KONG[xun];
    var p0raw = palaceOfStem(dun);
    var home = p0raw === 5 ? 2 : p0raw;                 // 中五寄坤二
    var zhifuStar = STAR_HOME[p0raw];
    var zhishiDoor = p0raw === 5 ? '死门' : DOOR_HOME[p0raw];
    var anchorStem = hs === 0 ? dun : STEMS[hs];
    var pt = palaceOfStem(anchorStem); if (pt === 5) pt = 2;
    var rot = mod(rpos(pt) - rpos(home), 8);

    // 天盘：九星带本宫地盘干转，天禽随天芮
    var sky = {};
    for (i = 0; i < 8; i++) {
      var hp = RING[i], dp = RING[(i + rot) % 8];
      sky[dp] = hp === 2
        ? { star: '天芮', qin: true, stems: [earth[2]], ji: earth[5] }
        : { star: STAR_HOME[hp], qin: false, stems: [earth[hp]], ji: null };
    }
    // 人盘：值使按时辰距旬首几步，飞宫数到落宫
    var n = hIdx - xun;
    var destNum = isYang ? ((p0raw - 1 + n) % 9) + 1 : mod(p0raw - 1 - n, 9) + 1;
    if (destNum === 5) destNum = 2;
    var doorRot = mod(rpos(destNum) - rpos(home), 8);
    var doors = {}, hidden = { 5: earth[5] };
    for (i = 0; i < 8; i++) {
      doors[RING[(i + doorRot) % 8]] = DOOR_HOME[RING[i]];
      hidden[RING[(i + doorRot) % 8]] = earth[RING[i]];     // 隐干：地盘干随门转
    }
    // 神盘：天盘八神随值符；地盘八神起于旬首本宫
    var gods = {}, diGods = {};
    var zfP = RING[(rpos(home) + rot) % 8];
    for (i = 0; i < 8; i++) {
      gods[isYang ? RING[(rpos(zfP) + i) % 8] : RING[mod(rpos(zfP) - i, 8)]] = GODS[i];
      diGods[isYang ? RING[(rpos(home) + i) % 8] : RING[mod(rpos(home) - i, 8)]] = GODS[i];
    }

    // 空亡、驿马
    var dayXun = dayIdx - dayIdx % 10;
    var dayKong = XUN_KONG[dayXun];
    var toP = function (b) { return BRANCH_PALACE[BRANCHES.indexOf(b)]; };
    var horseBranch = HORSE[hb];

    // 四柱用干（甲遁旬首）
    var use = { year: useStem(yearIdx), month: useStem(monthIdx), day: useStem(dayIdx), hour: useStem(hIdx) };

    // 各宫标记
    var marks = {};
    for (p = 1; p <= 9; p++) {
      if (p === 5) continue;
      var s = sky[p], st = s.stems.concat(s.ji ? [s.ji] : []);
      marks[p] = {
        xing: st.filter(function (x) { return XING[x] === p; }),
        mu: st.filter(function (x) { return MU[x] === p; }),
        po: KE[DOOR_WX[doors[p]]] === PALACE_WX[p],
        zhi: KE[PALACE_WX[p]] === DOOR_WX[doors[p]]
      };
    }

    // 月令旺衰
    var ling = MONTH_WX[monthIdx % 12];
    var ws = { ling: BRANCHES[monthIdx % 12] + ling, star: {}, door: {}, stem: {} };
    for (p = 1; p <= 9; p++) {
      if (p === 5) continue;
      ws.star[p] = wsStar(STAR_WX[sky[p].star], ling);
      ws.door[p] = wsStd(DOOR_WX[doors[p]], ling);
    }
    STEMS.forEach(function (x) { ws.stem[x] = wsStd(STEM_WX[x], ling); });

    // 年命
    var ming = null;
    if (opts.mingYear) {
      var my = +opts.mingYear, mIdx = mod(my - 1984, 60), mStem = useStem(mIdx);
      var skyP = [];
      for (p = 1; p <= 9; p++) { if (p !== 5 && (sky[p].stems[0] === mStem || sky[p].ji === mStem)) skyP.push(p); }
      ming = { year: my, gz: gzName(mIdx), stem: mStem, skyP: skyP, earthP: palaceOfStem(mStem) };
    }

    return {
      date: new Date(ms), clock: clock, solar: solar, ming: ming, ws: ws,
      pillars: { year: gzName(yearIdx), month: gzName(monthIdx), day: gzName(dayIdx), hour: gzName(hIdx) },
      idx: { year: yearIdx, month: monthIdx, day: dayIdx, hour: hIdx },
      use: use,
      term: term.n, termStart: term, termNext: termNext, nearBoundary: nearBoundary,
      dun: isYang ? '阳遁' : '阴遁', yang: isYang, ju: ju, yuan: ['上元', '中元', '下元'][yuan], overridden: !!juOverride,
      xunShou: '甲' + BRANCHES[xun % 12] + '旬（遁' + dun + '）', dun6: dun,
      kong: kong, kongP: kong.map(toP), dayKong: dayKong, dayKongP: dayKong.map(toP),
      horseBranch: horseBranch, horseP: toP(horseBranch),
      zhifuStar: zhifuStar, zhishiDoor: zhishiDoor, zfPalace: pt, zhishiPalace: destNum,
      rot: rot, doorRot: doorRot,
      earth: earth, sky: sky, doors: doors, gods: gods, diGods: diGods, hidden: hidden, marks: marks,
      palaceName: PALACE_NAME
    };
  }

  /* ================= 格局 ================= */
  // 十干克应（天盘干 + 地盘干）。同干相加只在伏吟时出现，归到全盘「伏吟」里说。
  var KEYING = {
    '戊丙': ['青龙返首', '吉', '动作大利，谋为易成；若逢门迫、击刑，吉中有凶'],
    '丙戊': ['飞鸟跌穴', '吉', '百事可为，求谋洞彻，宜进取'],
    '戊丁': ['青龙耀明', '吉', '谒贵求名皆吉，利文书'],
    '乙丙': ['奇仪顺遂', '吉', '吉星则升迁进职，凶星则夫妻反目'],
    '乙丁': ['奇仪相佐', '吉', '文书、考试、求名有利'],
    '丁丙': ['星随月转', '吉', '贵人提携，越级而升；常人乐极防悲'],
    '乙辛': ['青龙逃走', '凶', '财散人离，奴仆拐带，防失脱'],
    '辛乙': ['白虎猖狂', '凶', '家败人伤，远行多灾，宜静守'],
    '丁癸': ['朱雀投江', '凶', '文书口舌沉溺，音信不通'],
    '癸丁': ['螣蛇夭矫', '凶', '文书官司缠身，虚惊不宁'],
    '庚丙': ['太白入荧', '凶', '贼必来；为客进利，为主破财'],
    '丙庚': ['荧入太白', '凶', '贼必去；门户破败，耗失'],
    '庚癸': ['大格', '凶', '行人不至，官事不止，诸事阻隔'],
    '庚壬': ['上格', '凶', '又称小格。远行迷路，音信难通'],
    '庚己': ['刑格', '凶', '官讼刑伤，车马有损'],
    '庚戊': ['天乙伏宫', '凶', '百事不可谋，主客皆不利'],
    '戊庚': ['值符飞宫', '凶', '吉事不吉，凶事更凶，宜守'],
    '乙庚': ['日奇被刑', '凶', '争讼财产，夫妻各怀私心'],
    '庚乙': ['奇格', '凶', '庚加三奇。退守则吉，进取则凶'],
    '庚丁': ['亭亭之格', '凶', '因私情、私匿起官非'],
    '辛庚': ['白虎出力', '凶', '刀刃相交，主客相残；退让为上']
  };
  var STAR_TONE = { 天辅: ['吉', '大吉星'], 天禽: ['吉', '大吉星'], 天心: ['吉', '大吉星'], 天冲: ['吉', '小吉星'], 天任: ['吉', '小吉星'],
    天蓬: ['凶', '大凶星'], 天芮: ['凶', '大凶星'], 天柱: ['凶', '小凶星'], 天英: ['凶', '小凶星'] };
  var DOOR_TONE = { 开门: ['吉', '吉门'], 休门: ['吉', '吉门'], 生门: ['吉', '吉门'], 伤门: ['凶', '凶门'], 杜门: ['平', '中平之门'],
    景门: ['平', '中平之门'], 死门: ['凶', '凶门'], 惊门: ['凶', '凶门'] };
  var GOD_TONE = { 值符: ['吉', '吉神'], 太阴: ['吉', '吉神'], 六合: ['吉', '吉神'], 九地: ['吉', '吉神'], 九天: ['吉', '吉神'],
    腾蛇: ['凶', '凶神'], 白虎: ['凶', '凶神'], 玄武: ['凶', '凶神'] };
  var STAR_XIANG = { 天蓬: '盗贼、暗昧、水', 天任: '稳重、田土、守成', 天冲: '冲动、出征、速决', 天辅: '文教、礼贤、辅佐',
    天英: '文明、血光、虚名', 天芮: '病、学习、阴柔', 天柱: '口舌、破坏、惊恐', 天心: '医药、谋略、领导', 天禽: '中正、调和' };
  var DOOR_XIANG = { 休门: '休养、人情、和合', 生门: '生财、产业、生机', 伤门: '伤害、索债、竞争', 杜门: '闭塞、隐藏、技术',
    景门: '文书、信息、血光', 死门: '死丧、田土、僵局', 惊门: '惊恐、口舌、官非', 开门: '开创、公职、出行' };
  var GOD_XIANG = { 值符: '贵人、首领', 腾蛇: '虚惊、缠绕、怪异', 太阴: '暗助、阴私、谋划', 六合: '婚姻、合作、中介',
    白虎: '凶险、伤灾、威权', 玄武: '盗贼、欺诈、小人', 九地: '坚守、潜藏、迟缓', 九天: '高远、扬威、远行' };

  function stemsOf(c, p) { var s = c.sky[p]; return s.stems.concat(s.ji ? [s.ji] : []); }
  function starLabel(s) { return s.qin ? '禽芮' : s.star; }

  function analyze(c) {
    var list = [];
    var add = function (name, tone, text, p) { list.push({ name: name, tone: tone, text: text, p: p || null }); };

    // 全盘
    if (c.rot === 0 && c.doorRot === 0) add('伏吟', '凶', '星门皆在本宫，天地盘干同位。事多迟滞，宜守旧、收敛，不宜妄动');
    else if (c.rot === 0) add('星伏吟', '凶', '九星在本宫，天地盘干同位。宜静守，不宜开新');
    else if (c.doorRot === 0) add('门伏吟', '凶', '八门在本宫。事多停滞，守成可，进取难');
    if (c.rot === 4 && c.doorRot === 4) add('反吟', '凶', '星门皆落对宫。事多反复、往返，得而复失');
    else if (c.rot === 4) add('星反吟', '凶', '九星落对宫。事多反复，宜速不宜迟');
    else if (c.doorRot === 4) add('门反吟', '凶', '八门落对宫。行动反复，去而复返');

    var hS = STEMS[c.idx.hour % 10], dS = STEMS[c.idx.day % 10];
    if (KE[STEM_WX[hS]] === STEM_WX[dS] && (STEMS.indexOf(hS) % 2) === (STEMS.indexOf(dS) % 2))
      add('五不遇时', '凶', '时干' + hS + '克日干' + dS + '（阴阳同性）。百事不利，出行谋事宜避');

    // 各宫
    for (var p = 1; p <= 9; p++) {
      if (p === 5) continue;
      var sky = c.sky[p], e = c.earth[p], door = c.doors[p], god = c.gods[p], ss = stemsOf(c, p);
      ss.forEach(function (s) {
        var k = KEYING[s + e];
        if (k) add(k[0], k[1], s + '加' + e + '。' + k[2], p);
        if (s === '庚') {
          if (e === c.use.year) add('岁格', '凶', '庚加年干' + e + '。主一年之内多阻，忌上书、谒长官', p);
          if (e === c.use.month) add('月格', '凶', '庚加月干' + e + '。一月之内事多阻滞', p);
          if (e === c.use.day) add('日格', '凶', '庚加日干' + e + '（伏干格）。求测者本身受制，主客皆伤', p);
          if (e === c.use.hour) add('时格', '凶', '庚加时干' + e + '。所问之事当下受阻', p);
        }
        if (s === c.use.day && e === '庚') add('飞干格', '凶', '日干' + s + '加庚。主动招惹是非，宜收敛', p);
      });
      var sk = sky.stems[0];
      if ((sk === '乙' && p === 3) || (sk === '丙' && p === 9) || (sk === '丁' && p === 7))
        add('三奇升殿', '吉', sk + '奇临' + PALACE_NAME[p] + '，得其本位，谋事有气', p);
      if (p === c.zhishiPalace && e === '丁') add('玉女守门', '吉', '值使' + door + '下临地盘丁奇。利婚姻、宴会、和合之事', p);

      var openDoors = door === '开门' || door === '休门' || door === '生门';
      if (sk === '丙' && door === '生门' && e === '丁') add('天遁', '吉', '丙奇合生门，下临丁奇。宜上书、求官、远行', p);
      if (sk === '乙' && door === '开门' && e === '己') add('地遁', '吉', '乙奇合开门，下临六己。宜安营、藏伏、修造', p);
      if (sk === '丁' && door === '休门' && god === '太阴') add('人遁', '吉', '丁奇合休门、太阴。宜求贤、和谈、交易', p);
      if (sk === '丙' && door === '生门' && god === '九天') add('神遁', '吉', '丙奇合生门、九天。宜祈祷、攻虚', p);
      if (sk === '丁' && door === '杜门' && god === '九地') add('鬼遁', '吉', '丁奇合杜门、九地。宜探密、偷营、伏藏', p);
      if (sk === '乙' && openDoors && p === 4) add('风遁', '吉', '乙奇合' + door + '临巽。宜借势、顺风行事', p);
      if (sk === '乙' && openDoors && e === '辛') add('云遁', '吉', '乙奇合' + door + '下临六辛。宜求雨、立营', p);
      if (sk === '乙' && openDoors && (p === 1 || e === '癸')) add('龙遁', '吉', '乙奇合' + door + (p === 1 ? '临坎' : '下临六癸') + '。宜水上之事、祈雨', p);
      if (sk === '乙' && (door === '休门' || door === '生门') && e === '辛' && p === 8) add('虎遁', '吉', '乙奇合' + door + '临艮，下临六辛。宜据险、招安', p);

      var m = c.marks[p];
      m.xing.forEach(function (s) { add('六仪击刑', '凶', '天盘' + s + '临' + PALACE_NAME[p] + '受刑。所主之事多刑伤、纠纷', p); });
      m.mu.forEach(function (s) {
        add(('乙丙丁'.indexOf(s) >= 0 ? '三奇' : '六仪') + '入墓', '凶', '天盘' + s + '临' + PALACE_NAME[p] + '入墓。力量受困，事多暗昧难伸' +
          (s === c.use.day ? '（日干入墓：求测者本身受困）' : s === c.use.hour ? '（时干入墓：所问之事受困）' : ''), p);
      });
      if (m.po) add('门迫', '凶', door + '（' + DOOR_WX[door] + '）克' + PALACE_NAME[p] + '（' + PALACE_WX[p] + '）。' +
        (DOOR_TONE[door][0] === '吉' ? '吉门被迫，吉事难成' : '凶门被迫，其凶更甚'), p);
    }
    var order = { 吉: 0, 凶: 1, 平: 2 };
    list.sort(function (a, b) { return order[a.tone] - order[b.tone]; });
    return list;
  }

  // 门与宫的生克
  function doorPalace(door, p) {
    var d = DOOR_WX[door], g = PALACE_WX[p];
    if (KE[d] === g) return '门迫（门克宫）';
    if (KE[g] === d) return '门受制（宫克门）';
    if (SHENG[d] === g) return '门生宫（泄气）';
    if (SHENG[g] === d) return '宫生门（得生）';
    return '门宫比和';
  }

  function palaceDetail(c, p) {
    if (p === 5) return { title: '中五宫', rows: [['地盘', c.earth[5] + '，寄坤二宫'], ['隐干', c.hidden[5]]], ge: [] };
    var s = c.sky[p], door = c.doors[p], god = c.gods[p], e = c.earth[p];
    var star = s.star, rows = [];
    var tags = [];
    if (p === c.zfPalace) tags.push('值符宫');
    if (p === c.zhishiPalace) tags.push('值使宫');
    if (c.kongP.indexOf(p) >= 0) tags.push('时空');
    if (c.dayKongP.indexOf(p) >= 0) tags.push('日空');
    if (p === c.horseP) tags.push('驿马');
    if (c.ming && c.ming.skyP.indexOf(p) >= 0) tags.push('年命宫');
    rows.push(['九星', starLabel(s) + '（' + STAR_WX[star] + '，' + STAR_TONE[star][1] + '，' + c.ws.star[p] + '）：' + STAR_XIANG[star] + (s.qin ? '；天禽寄坤随芮同行' : '')]);
    rows.push(['八门', door + '（' + DOOR_WX[door] + '，' + DOOR_TONE[door][1] + '，' + c.ws.door[p] + '）：' + DOOR_XIANG[door] + '；' + doorPalace(door, p)]);
    rows.push(['八神', god + '（' + GOD_TONE[god][1] + '）：' + GOD_XIANG[god]]);
    var wsOf = function (x) { return x + '（' + c.ws.stem[x] + '）'; };
    var pair = wsOf(s.stems[0]) + '加' + wsOf(e) + (s.ji ? '，寄干' + wsOf(s.ji) : '');
    rows.push(['天地盘', pair]);
    rows.push(['隐干', c.hidden[p]]);
    rows.push(['地盘神', c.diGods[p]]);
    var who = [];
    var lab = { year: '年', month: '月', day: '日', hour: '时' };
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
      var u = c.use[k];
      if (stemsOf(c, p).indexOf(u) >= 0) who.push('天盘' + lab[k] + '干' + u);
      if (e === u) who.push('地盘' + lab[k] + '干' + u);
    });
    if (c.ming) {
      if (c.ming.skyP.indexOf(p) >= 0) who.push('天盘年命' + c.ming.stem);
      if (c.ming.earthP === p) who.push('地盘年命' + c.ming.stem);
    }
    if (who.length) rows.push(['四柱', who.join('、')]);
    var ge = analyze(c).filter(function (g) { return g.p === p; });
    return { title: PALACE_NAME[p] + '宫', tags: tags, rows: rows, ge: ge };
  }

  /* ================= 用神 · 应期 ================= */
  // 题型 → 用神。k: door 门 / star 星 / god 神 / stem 天盘干 / day 日干 / hour 时干 / horse 马星
  var TOPICS = {
    天气: [{ k: 'star', v: '天蓬', l: '雨', d: '天蓬主雨' }, { k: 'star', v: '天英', l: '晴', d: '天英主晴' },
      { k: 'star', v: '天辅', l: '风', d: '天辅主风' }, { k: 'star', v: '天冲', l: '雷', d: '天冲主雷' }],
    求财: [{ k: 'door', v: '生门', l: '利', d: '生门为利润' }, { k: 'stem', v: '戊', l: '本', d: '戊为资本' },
      { k: 'day', l: '我', d: '日干为求测人' }, { k: 'hour', l: '事', d: '时干为所谋之事' }],
    婚姻: [{ k: 'stem', v: '乙', l: '女', d: '乙为女方' }, { k: 'stem', v: '庚', l: '男', d: '庚为男方' },
      { k: 'god', v: '六合', l: '媒', d: '六合为婚姻、媒妁' }, { k: 'day', l: '我', d: '日干为求测人' }],
    考试: [{ k: 'door', v: '景门', l: '卷', d: '景门为试卷、陈述与材料' }, { k: 'stem', v: '丁', l: '榜', d: '丁为成绩、录取文书' },
      { k: 'star', v: '天辅', l: '师', d: '天辅为考官、老师、教授' }, { k: 'day', l: '我', d: '日干为考生' }],
    求职: [{ k: 'door', v: '开门', l: '职', d: '开门为职位、单位' }, { k: 'god', v: '值符', l: '官', d: '值符为面试官、上司' },
      { k: 'day', l: '我', d: '日干为求职者' }, { k: 'hour', l: '事', d: '时干为这次面试' }],
    签约: [{ k: 'god', v: '六合', l: '约', d: '六合为契约、中间人' }, { k: 'door', v: '生门', l: '利', d: '生门为利益' },
      { k: 'day', l: '我', d: '日干为己方' }, { k: 'hour', l: '彼', d: '时干为对方' }],
    开业: [{ k: 'door', v: '开门', l: '张', d: '开门为开张' }, { k: 'door', v: '生门', l: '利', d: '生门为生意、利润' },
      { k: 'stem', v: '戊', l: '本', d: '戊为本钱' }, { k: 'day', l: '我', d: '日干为东家' }],
    搬家: [{ k: 'door', v: '生门', l: '宅', d: '生门为新宅' }, { k: 'horse', l: '马', d: '驿马为迁动' },
      { k: 'day', l: '我', d: '日干为宅主' }, { k: 'hour', l: '事', d: '时干为这次搬迁' }],
    疾病: [{ k: 'star', v: '天芮', l: '病', d: '天芮为病症', adv: true }, { k: 'star', v: '天心', l: '医', d: '天心为医生' },
      { k: 'stem', v: '乙', l: '药', d: '乙为药物' }, { k: 'day', l: '我', d: '日干为病人' }],
    官司: [{ k: 'door', v: '开门', l: '官', d: '开门为法官' }, { k: 'door', v: '惊门', l: '讼', d: '惊门为诉讼、律师' },
      { k: 'stem', v: '辛', l: '罪', d: '辛为罪名', adv: true }, { k: 'day', l: '我', d: '日干为己方' }, { k: 'hour', l: '彼', d: '时干为对方', adv: true }],
    出行: [{ k: 'door', v: '开门', l: '行', d: '开门为出行' }, { k: 'horse', l: '马', d: '驿马主动、行程' },
      { k: 'day', l: '我', d: '日干为出行人' }, { k: 'hour', l: '地', d: '时干为目的地、所办之事' }],
    失物: [{ k: 'hour', l: '物', d: '时干为失物' }, { k: 'god', v: '玄武', l: '贼', d: '玄武为盗贼', adv: true },
      { k: 'day', l: '我', d: '日干为失主' }],
    寻人: [{ k: 'hour', l: '人', d: '时干为所寻之人' }, { k: 'god', v: '六合', l: '踪', d: '六合为走失、藏匿' },
      { k: 'horse', l: '马', d: '驿马为动向' }, { k: 'day', l: '我', d: '日干为求测人' }],
    自由: [{ k: 'day', l: '我', d: '日干为求测人' }, { k: 'hour', l: '事', d: '时干为所问之事' }]
  };
  function relPalace(a, b) {        // 宫 a 对宫 b
    var x = PALACE_WX[a], y = PALACE_WX[b];
    if (x === y) return '比和';
    if (SHENG[x] === y) return '生日干';
    if (SHENG[y] === x) return '日干生之';
    if (KE[x] === y) return '克日干';
    return '日干克之';
  }
  function yongshen(c, topic) {
    var rules = TOPICS[topic] || [];
    var dayP = stemPalaces(c, c.use.day)[0];
    return rules.map(function (r) {
      var ps = [];
      for (var p = 1; p <= 9; p++) {
        if (p === 5) continue;
        var hit = r.k === 'door' ? c.doors[p] === r.v
          : r.k === 'star' ? c.sky[p].star === r.v
          : r.k === 'god' ? c.gods[p] === r.v
          : r.k === 'stem' ? stemsOf(c, p).indexOf(r.v) >= 0
          : r.k === 'day' ? stemsOf(c, p).indexOf(c.use.day) >= 0
          : r.k === 'hour' ? stemsOf(c, p).indexOf(c.use.hour) >= 0
          : r.k === 'horse' ? p === c.horseP : false;
        if (hit) ps.push(p);
      }
      var stem = r.k === 'stem' ? r.v : r.k === 'day' ? c.use.day : r.k === 'hour' ? c.use.hour : null;
      return { k: r.k, name: r.v || { day: '日干', hour: '时干', horse: '驿马' }[r.k], label: r.l, desc: r.d, stem: stem, ps: ps, adv: !!r.adv,
        rel: r.k !== 'day' && dayP ? ps.map(function (p) { return p === dayP ? '同宫' : relPalace(p, dayP); }) : [] };
    });
  }
  function stemPalaces(c, x) { var o = []; for (var p = 1; p <= 9; p++) if (p !== 5 && stemsOf(c, p).indexOf(x) >= 0) o.push(p); return o; }

  /* ================= 白话断语 =================
     按题型把用神逐个看一遍，给个分数和几句话。口径：
     · 全盘：伏吟、反吟、五不遇时先扣分；
     · 用神对日干：生你、同宫最好，比和次之，你克它尚可，你生它要付出，克你最忌；首个用神加重；
       「病、贼、罪名、对方」这类对头用神反着看：你能制它为好，它克你、缠身为凶；
     · 用神落宫：空亡、入墓、击刑、门迫扣分（对头用神逢之反为好），门的旺衰、临吉神凶神、本宫吉凶格加减；
     · 日干本宫、年命宫逢空墓刑，另扣。
     分数大致在 −20 到 +15 之间，常见时辰多在 −10 到 +3；只作读盘的提纲，断事仍以用神为主。 */
  var REL = { 生日干: ['生你', 3], 同宫: ['与你同宫', 3], 比和: ['与你比和', 2], 日干克之: ['你克它', 0.5], 日干生之: ['你生它，要你付出', -1], 克日干: ['克你', -3] };
  var REL_ADV = { 生日干: ['生你', 0], 同宫: ['与你同宫，缠身', -2], 比和: ['与你比和', -1], 日干克之: ['你能制它', 2], 日干生之: ['你去生它', -1], 克日干: ['克你', -3] };
  var VBAD = { 伏吟: -4, 星伏吟: -2.5, 门伏吟: -3, 反吟: -3.5, 星反吟: -2, 门反吟: -2.5, 五不遇时: -4 };
  var GOOD_GOD = { 值符: 1, 太阴: 1, 六合: 1, 九天: 1, 九地: 1 }, BAD_GOD = { 腾蛇: 1, 白虎: 1, 玄武: 1 };
  function verdict(c, topic) {
    var ge = analyze(c), ys = yongshen(c, topic), dayP = stemPalaces(c, c.use.day)[0];
    var items = [], lines = [];
    var put = function (v, t) { if (v) items.push({ v: v, t: t }); return v; };
    ge.forEach(function (g) { if (VBAD[g.name]) put(VBAD[g.name], g.name); });
    var spoilt = { 六仪击刑: 1, 三奇入墓: 1, 六仪入墓: 1, 门迫: 1 };
    function palaceState(p, y) {         // 返回 [{ v, t }]，adv 为对头用神
      var out = [], m = c.marks[p], adv = y && y.adv, k = adv ? -0.6 : 1;
      if (c.kongP.indexOf(p) >= 0) out.push({ v: -2 * k, t: '时空' });
      else if (c.dayKongP.indexOf(p) >= 0) out.push({ v: -1.5 * k, t: '日空' });
      var st = y ? y.stem : null;
      if (st && m.mu.indexOf(st) >= 0) out.push({ v: -2 * k, t: '入墓' });
      else if (!st && m.mu.length) out.push({ v: -1 * k, t: '宫逢入墓' });          // 星门神所乘之干入墓，减等
      if (st && m.xing.indexOf(st) >= 0) out.push({ v: -2 * k, t: '击刑' });
      else if (!st && m.xing.length) out.push({ v: -1 * k, t: '宫逢击刑' });
      if (y && y.k === 'door') {
        if (m.po) out.push({ v: -1.5 * k, t: '门迫' });
        else if (KE[PALACE_WX[p]] === DOOR_WX[c.doors[p]]) out.push({ v: -0.5 * k, t: '门受制' });
        var w = c.ws.door[p]; if (w === '旺' || w === '相') out.push({ v: 0.5 * k, t: '门' + w }); else if (w === '囚' || w === '死') out.push({ v: -0.5 * k, t: '门' + w });
      }
      if (y && y.k === 'star') { var ws = c.ws.star[p]; if (ws === '旺' || ws === '相') out.push({ v: 0.5 * k, t: '星' + ws }); else if (ws === '囚' || ws === '废') out.push({ v: -0.5 * k, t: '星' + ws }); }
      var god = c.gods[p];
      if (!(y && y.k === 'god' && y.name === god)) {
        if (GOOD_GOD[god]) out.push({ v: 0.5 * k, t: '临' + god }); else if (BAD_GOD[god]) out.push({ v: -1 * k, t: '临' + god });
      }
      var gs = 0;
      ge.filter(function (g) { return g.p === p && !spoilt[g.name]; }).forEach(function (g) {
        if (g.tone === '吉' && gs < 3) { gs += 1.5; out.push({ v: 1.5 * k, t: g.name }); }
        else if (g.tone === '凶') out.push({ v: -1 * k, t: g.name });
      });
      return out;
    }
    ys.forEach(function (y, i) {
      var p = y.ps[0];
      if (p == null) { lines.push({ y: y, text: y.name + '（' + y.label + '）不现', v: 0 }); return; }
      var sum = 0, bits = [];
      if (y.k !== 'day') {
        var rel = y.rel[0], R = (y.adv ? REL_ADV : REL)[rel === '同宫' ? '同宫' : rel] || ['', 0];
        var w = i === 0 ? 1.5 : i === 1 ? 1.2 : y.k === 'hour' ? 0.8 : 1;   // 首用神最重，次用神次之，时干稍轻
        sum += put(R[1] * w, y.name + '（' + y.label + '）' + R[0]);
        bits.push(R[0]);
      }
      palaceState(p, y).forEach(function (s) { sum += put(s.v * (y.k === 'day' ? 1 : 0.8), y.name + s.t); bits.push(s.t); });
      lines.push({ y: y, p: p, v: Math.round(sum * 10) / 10, text: y.name + '（' + y.label + '）落' + PALACE_NAME[p] + '：' + (bits.join('，') || '平平') });
    });
    if (dayP != null && !ys.some(function (y) { return y.k === 'day'; })) {
      palaceState(dayP, { k: 'day', stem: c.use.day }).forEach(function (s) { if (s.v < 0) put(s.v, '日干' + s.t); });
    }
    if (c.ming) {
      c.ming.skyP.forEach(function (p) {
        var m = c.marks[p];
        if (c.kongP.indexOf(p) >= 0 || c.dayKongP.indexOf(p) >= 0) put(-1, '年命落空');
        if (m.mu.indexOf(c.ming.stem) >= 0) put(-1, '年命入墓');
        if (m.xing.indexOf(c.ming.stem) >= 0) put(-1, '年命击刑');
      });
    }
    var score = 0; items.forEach(function (x) { score += x.v; });
    score = Math.round(score * 10) / 10;
    // 分档按一般时辰的分布定（两周逐时辰试算：中位约 −5，前一成约 +3）：上吉约一成，吉一成半，凶一成半
    var grade = score >= 3 ? '上吉' : score >= -0.5 ? '吉' : score >= -5.5 ? '平' : score >= -10 ? '次' : '凶';
    var pros = items.filter(function (x) { return x.v > 0; }).sort(function (a, b) { return b.v - a.v; });
    var cons = items.filter(function (x) { return x.v < 0; }).sort(function (a, b) { return a.v - b.v; });
    return { topic: topic, score: score, grade: grade, pct: Math.max(0, Math.min(100, Math.round(60 + score * 3.6))), lines: lines, pros: pros, cons: cons, items: items };
  }

  var PALACE_BRANCHES = { 1: ['子'], 8: ['丑', '寅'], 3: ['卯'], 4: ['辰', '巳'], 9: ['午'], 2: ['未', '申'], 7: ['酉'], 6: ['戌', '亥'] };
  var MU_BRANCH = { 乙: '戌', 丙: '戌', 戊: '戌', 丁: '丑', 己: '丑', 庚: '丑', 辛: '辰', 壬: '辰', 癸: '未' };
  function chong(b) { return BRANCHES[(BRANCHES.indexOf(b) + 6) % 12]; }
  function dayIndexOf(dt) { return mod(jdn(dt.getFullYear(), dt.getMonth() + 1, dt.getDate()) - 2415021 + 10, 60); }
  // 从 from 次日起，往后 days 日内日支为 b 的日子
  function nextDaysOf(from, b, n, days) {
    var out = [], bi = BRANCHES.indexOf(b);
    var d0 = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12);
    for (var i = 1; i <= (days || 40) && out.length < (n || 2); i++) {
      var d = new Date(d0.getTime() + i * DAY);
      if (dayIndexOf(d) % 12 === bi) out.push(d);
    }
    return out;
  }
  function yingqi(c, p, stem) {
    var items = [], speed = [];
    if (c.rot === 0 || c.doorRot === 0) speed.push('伏吟主迟');
    if (c.rot === 4 || c.doorRot === 4) speed.push('反吟主速');
    if (p === c.horseP) speed.push('临马主速');
    if (p === 5 || !PALACE_BRANCHES[p]) return { speed: speed, items: items };
    var from = c.date;
    var add = function (why, bs) {
      var key = bs.slice().sort().join('');
      for (var i = 0; i < items.length; i++) {                // 同一组地支只列一次，理由并在一起
        if (items[i].branches.slice().sort().join('') === key) { items[i].why += '、' + why; return; }
      }
      items.push({ why: why, branches: bs, days: bs.map(function (b) { return { b: b, dates: nextDaysOf(from, b, 2) }; }) });
    };
    add('落宫地支', PALACE_BRANCHES[p]);
    [['时空', c.kong], ['日空', c.dayKong]].forEach(function (kv) {
      var here = kv[1].filter(function (b) { return PALACE_BRANCHES[p].indexOf(b) >= 0; });
      if (here.length) { add(kv[0] + '填实', here); add(kv[0] + '冲空', here.map(chong)); }
    });
    if (p === c.horseP) add('冲马', [chong(c.horseBranch)]);
    if (stem && MU[stem] === p) add(stem + '入墓待冲', [chong(MU_BRANCH[stem])]);
    return { speed: speed, items: items };
  }

  // —— 择时：从 from 起往后 days 日，逐时辰起盘，挑出有吉格的时辰 ——
  // 择时只挑大吉格；奇仪顺遂之类小吉格太常见，列出来反而无从下手
  var BIG = ['青龙返首', '飞鸟跌穴', '天遁', '地遁', '人遁', '神遁', '鬼遁', '风遁', '云遁', '龙遁', '虎遁', '三奇升殿', '玉女守门'];
  var BAD = ['五不遇时', '伏吟', '星伏吟', '门伏吟', '反吟', '星反吟', '门反吟'];
  function findHours(from, days, opts) {
    opts = opts || {};
    var out = [];
    var shift = typeof opts.solarLon === 'number' && isFinite(opts.solarLon) ? solarClock(from, opts.solarLon).shift : 0;
    var start = new Date(from.getTime() + shift * 60000);     // 钟点（真太阳时或本机）
    var h = start.getHours();
    start.setMinutes(0, 0, 0);
    start.setHours(h % 2 === 1 ? h : h - 1);                  // 时辰起于单数钟点
    for (var i = 0; i < days * 12; i++) {
      var s0 = start.getTime() + i * 2 * 3600e3 - shift * 60000;   // 回到真实时刻
      var mid = new Date(s0 + 3600e3);
      if (!inRange(mid)) break;
      var c = computeChart(mid, null, opts);
      var g = analyze(c);
      var ji = g.filter(function (x) { return BIG.indexOf(x.name) >= 0; });
      if (!ji.length) continue;
      ji = ji.map(function (x) {
        var m = c.marks[x.p], warn = [];
        if (c.kongP.indexOf(x.p) >= 0 || c.dayKongP.indexOf(x.p) >= 0) warn.push('空');
        if (m.po) warn.push('迫'); if (m.xing.length) warn.push('刑'); if (m.mu.length) warn.push('墓');
        return { name: x.name, p: x.p, text: x.text, warn: warn };
      });
      out.push({ start: new Date(s0), end: new Date(s0 + 2 * 3600e3), mid: mid, hour: c.pillars.hour, day: c.pillars.day,
        ji: ji, bad: g.filter(function (x) { return BAD.indexOf(x.name) >= 0; }) });
    }
    return out;
  }

  var api = {
    computeChart: computeChart, analyze: analyze, palaceDetail: palaceDetail, inRange: inRange, RANGE: RANGE,
    solarClock: solarClock, findHours: findHours, yongshen: yongshen, verdict: verdict, yingqi: yingqi, TOPICS: TOPICS, dayIndexOf: dayIndexOf,
    TERMS: TERMS, STEMS: STEMS, BRANCHES: BRANCHES, GRID: GRID, PNUM: PNUM, PALACE_NAME: PALACE_NAME, GOD_SHORT: GOD_SHORT,
    STEM_WX: STEM_WX, STAR_WX: STAR_WX, DOOR_WX: DOOR_WX, GOD_WX: GOD_WX
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.QM = api;
})(this);
