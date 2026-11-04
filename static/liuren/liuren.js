/* =========================================================
   大六壬 · 起课核心 —— 只管算，不碰页面
   ---------------------------------------------------------
   cast(date, opts)                 按某一时刻起课（四柱取 /bazi/bazi.js，月将取 /qimen/jieqi.js 的中气）
   byJiang(月将, 占时, 日干支, opts)  古籍常见写法「某将某时某日」直接起课（不反推公历）
   core(日序, 天盘差, opts)          只算四课三传（720 课都可遍历，自检用）
   plain(chart)                     白话几行（只作读课提纲）
   text(chart, extra)               复制 / 问 AI 用的文字盘
   rules(opts)                      口径条目（页面「口径」一栏与问 AI 共用）

   口径（流派不同处都写在这里，要改只改这里）
   · 月将：以中气换将，交气时刻精确到分。雨水后亥将（登明）、春分后戌（河魁）、谷雨后酉（从魁）、小满后申（传送）、
     夏至后未（小吉）、大暑后午（胜光）、处暑后巳（太乙）、秋分后辰（天罡）、霜降后卯（太冲）、小雪后寅（功曹）、
     冬至后丑（大吉）、大寒后子（神后）。
   · 占时：起课时刻所在时辰，按本机钟表时间；23 点起为次日子时，日柱同时换日（与奇门、八字默认一致）。
   · 四柱：BZ.chart（年以立春、月以节，精确到分）。
   · 天地盘：月将加占时，十二支顺布。
   · 四课：一课干上（日干寄宫的上神）、二课干阴、三课支上、四课支阴。
     寄宫：甲寅、乙辰、丙戊巳、丁己未、庚申、辛戌、壬亥、癸丑。一课的「下」论日干本身的五行。
   · 三传九宗门（次第：伏吟、返吟先看天地盘；其余依贼克、比用、涉害、遥克、八专、别责、昴星）：
     贼克：下贼上优先于上克下；同一上神算一处。一处下贼上为重审，一处上克下为元首。
     比用：克有两处以上，取与日干同阴阳者（比）；只一个比，名比用（知一）。
     涉害：俱比或俱不比，默认按所临地盘孟仲季分深浅（《占事略诀》《大六壬指南》）：临孟为见机，无孟取临仲为察微；
       孟仲皆无或不止一个，刚日取干上神、柔日取支上神（缀瑕）。可改「数克」古法（《大六壬大全》）：
       从所临地盘顺数归本家（两头都数），数地盘支与寄宫干：下贼上数克上神者，上克下数上神所克者；深者发用，等则依孟、仲、干支上神。
     中传、末传：初传上神为中传，中传上神为末传（递传）。
     遥克：四课无克，取二三四课上神遥克日干者（蒿矢）；无则取日干遥克之神（弹射）；多个取比。
     八专（甲寅、庚申、丁未、己未、癸丑，干支同位）无克：阳日干上神顺数三位、阴日四课上神逆数三位为初传，中末俱干上神；三传同一支名独足。
     别责：四课只得三课、无克无遥克：阳日取干合之寄宫上神，阴日取支三合前一辰；中末俱干上神。
     昴星：四课俱全而无克无遥克：阳日取地盘酉上神为初、支上神为中、干上神为末（虎视转蓬）；
       阴日取天盘酉下神为初、干上神为中、支上神为末（冬蛇掩目）。
     伏吟（月将即占时）：有克取克；无克刚日干上神、柔日支上神为初传（刚日自任，柔日自信）。中传取初传所刑；
       初传自刑，干上发用则以支上神为中，支上发用则以干上神为中。末传取中传所刑；中传自刑或刑回初传，取中传之冲（杜传）。
     返吟（月将冲占时）：有克依贼克比用取初传，中传为其冲，末传还原（无依）；
       无克（丁丑、丁未、己丑、己未、辛丑、辛未六日）以日支驿马为初、支上神为中、干上神为末（井栏射）。
   · 十二天将：贵人、腾蛇、朱雀、六合、勾陈、青龙、天空、白虎、太常、玄武、太阴、天后。
     贵人默认「甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸蛇兔藏，六辛逢马虎」：前一字昼贵、后一字夜贵；
     可改「甲羊戊庚牛」一说（《协纪辨方书》阴阳贵人，本站通书同用）。
     昼夜默认按占时：卯至申为昼，酉至寅为夜；可手动指定。贵人临地盘亥子丑寅卯辰顺布，临巳午未申酉戌逆布。
   · 遁干：旬遁，以日旬旬首之甲起于旬首地支，顺排十干，余二支为旬空。
   · 六亲以日干论：生我父母，我生子孙，克我官鬼，我克妻财，比和兄弟。旺衰按月建：旺相休囚死。
   参照：kentang2017/kinliuren（MIT，Ken Tang）：月将表、寄宫、贵人两说、天将顺逆、旬遁表据其核对；
   三传另按九宗门逐条写，用 look-fate/liuren-ts-lib 的 720 课三传表交叉核对（Apache-2.0，作者声明严禁商用，只作参照，未拷入本站）。
   浏览器里挂 window.LR（需先载 /qimen/jieqi.js、/fabao/lunar.js、/bazi/bazi.js）；node 里 require 即得同一对象。
   ========================================================= */
(function (root) {
  'use strict';
  var NODE = typeof module !== 'undefined' && module.exports;
  var J = NODE ? require('../qimen/jieqi.js') : root.QM_JIEQI;
  var BZ = NODE ? require('../bazi/bazi.js') : root.BZ;

  var GAN = '甲乙丙丁戊己庚辛壬癸', ZHI = '子丑寅卯辰巳午未申酉戌亥', WX = '木火土金水';
  var GAN_WX = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  var ZHI_WX = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  var JI = [2, 4, 5, 7, 5, 7, 8, 10, 11, 1];                       // 日干寄宫
  var JIANG_NAME = ['神后', '大吉', '功曹', '太冲', '天罡', '太乙', '胜光', '小吉', '传送', '从魁', '河魁', '登明'];
  var GEN = ['贵人', '腾蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后'];
  var GEN_S = '贵蛇雀合勾龙空虎常玄阴后';
  var GEN_JI = [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1];               // 吉将：贵、合、龙、常、阴、后
  var GEN_WX = [2, 1, 1, 0, 2, 0, 2, 3, 2, 4, 3, 4];
  var LIUQIN = ['兄弟', '子孙', '妻财', '官鬼', '父母'];            // (支五行 − 日干五行) mod 5
  var XING = [3, 10, 5, 0, 4, 8, 6, 1, 2, 9, 7, 11];               // 子刑卯 丑刑戌 寅刑巳 卯刑子 辰自刑 巳刑申 午自刑 未刑丑 申刑寅 酉自刑 戌刑未 亥自刑
  var ZIXING = [4, 6, 9, 11];
  var MENG = [2, 5, 8, 11], ZHONG = [0, 3, 6, 9];
  var KE_NAME = ['一课', '二课', '三课', '四课'];
  // 贵人：day 昼贵、night 夜贵（甲至癸）
  var GUI = {
    niuyang: { name: '甲戊庚牛羊', day: [1, 0, 11, 11, 1, 0, 1, 6, 5, 5], night: [7, 8, 9, 9, 7, 8, 7, 2, 3, 3] },
    yangniu: { name: '甲羊戊庚牛', day: [7, 8, 9, 11, 1, 0, 1, 2, 3, 5], night: [1, 0, 11, 9, 7, 8, 7, 6, 5, 3] }
  };
  var SHEHAI = { mzj: '孟仲季', shuke: '数克' };

  function mod(a, n) { return ((a % n) + n) % n; }
  function ke(a, b) { return mod(b - a, 5) === 2; }               // 五行 a 克 b
  function sheng(a, b) { return mod(b - a, 5) === 1; }            // 五行 a 生 b
  function gzIdx(g, z) { for (var n = 0; n < 60; n++) if (n % 10 === g && n % 12 === z) return n; return -1; }
  function gzName(i) { return GAN[i % 10] + ZHI[i % 12]; }
  function parseGZ(s) { var g = GAN.indexOf((s || '')[0]), z = ZHI.indexOf((s || '')[1]); return g < 0 || z < 0 ? -1 : gzIdx(g, z); }
  function isYang(b) { return b % 2 === 0; }
  function norm(o) {
    o = o || {};
    return {
      gui: GUI[o.gui] ? o.gui : 'niuyang',
      dn: o.dn === 'day' || o.dn === 'night' ? o.dn : 'auto',
      shehai: SHEHAI[o.shehai] ? o.shehai : 'mzj',
      mingYear: +o.mingYear >= 1900 && +o.mingYear <= 2100 ? +o.mingYear : null,
      male: o.male === false ? false : o.male === true ? true : null
    };
  }

  // 某地盘位上的寄干（涉害数克用）
  var JI_AT = {};
  JI.forEach(function (p, g) { (JI_AT[p] = JI_AT[p] || []).push(g); });

  /* =========================================================
     四课三传（九宗门）
     di：日干支序（0 甲子 … 59 癸亥）；r：天盘差（月将 − 占时，0 伏吟，6 返吟）
     ========================================================= */
  function core(di, r, o) {
    o = norm(o);
    r = mod(r, 12);
    var dg = di % 10, dz = di % 12, yang = dg % 2 === 0;
    var sky = function (p) { return mod(p + r, 12); }, under = function (b) { return mod(b - r, 12); };
    var g1 = sky(JI[dg]), g3 = sky(dz);
    var K = [
      { up: g1, low: JI[dg], stem: dg, dwx: GAN_WX[dg] },
      { up: sky(g1), low: g1, dwx: ZHI_WX[g1] },
      { up: g3, low: dz, dwx: ZHI_WX[dz] },
      { up: sky(g3), low: g3, dwx: ZHI_WX[g3] }
    ];
    K.forEach(function (k, i) {
      var uw = ZHI_WX[k.up];
      k.i = i; k.name = KE_NAME[i];
      k.zei = ke(k.dwx, uw); k.ke = ke(uw, k.dwx);
      k.rel = k.zei ? '下贼上' : k.ke ? '上克下' : uw === k.dwx ? '比和' : sheng(uw, k.dwx) ? '上生下' : '下生上';
      k.lowName = k.stem != null ? GAN[k.stem] : ZHI[k.low];
    });
    var gs = g1, zs = g3;
    var seen = {};                                             // 四课备不备：上神与所临地盘位都同，算同一课（一课以寄宫论）
    K.forEach(function (k) { seen[k.up + '/' + k.low] = 1; });
    var distinct = Object.keys(seen).length;
    var res = function (a, b, c, gate, name, sub, why) { return { sc: [a, b, c], gate: gate, name: name, sub: sub || '', why: why }; };
    var pass = function (a, gate, name, sub, why) { return res(a, sky(a), sky(sky(a)), gate, name, sub, why); };
    var kdesc = function (k) { return k.name + ZHI[k.up] + '加' + k.lowName; };
    var list = function (bs) { return bs.map(function (b) { return ZHI[b]; }).join('、'); };
    var lvl = function (p) { return MENG.indexOf(p) >= 0 ? '孟' : ZHONG.indexOf(p) >= 0 ? '仲' : '季'; };

    // 涉害数克：从所临地盘顺行归本家（两头都数），数地盘支与寄宫干
    function depth(u, type) {
      var start = under(u), len = mod(u - start, 12), n = 0;
      for (var i = 0; i <= len; i++) {
        var p = mod(start + i, 12), items = [ZHI_WX[p]].concat((JI_AT[p] || []).map(function (g) { return GAN_WX[g]; }));
        items.forEach(function (w) { if (type === 'zei' ? ke(w, ZHI_WX[u]) : ke(ZHI_WX[u], w)) n++; });
      }
      return n;
    }
    // 孟仲季定深浅：临孟见机，次临仲察微，复等缀瑕
    function mzj(pool, pre) {
      var at = pool.map(function (u) { return ZHI[u] + '临' + ZHI[under(u)] + '（' + lvl(under(u)) + '）'; }).join('、');
      var meng = pool.filter(function (u) { return MENG.indexOf(under(u)) >= 0; });
      if (meng.length === 1) return { pick: meng[0], sub: '见机', why: pre + at + '，取临孟者' + ZHI[meng[0]] + '（见机）' };
      if (!meng.length) {
        var zhong = pool.filter(function (u) { return ZHONG.indexOf(under(u)) >= 0; });
        if (zhong.length === 1) return { pick: zhong[0], sub: '察微', why: pre + at + '，无临孟，取临仲者' + ZHI[zhong[0]] + '（察微）' };
      }
      var pick = yang ? gs : zs;
      return { pick: pick, sub: '缀瑕', why: pre + at + '，深浅复等，' + (yang ? '刚日取干上神' : '柔日取支上神') + ZHI[pick] + '（缀瑕）' };
    }
    function shehai(pool, type, why0) {
      if (o.shehai === 'shuke') {
        var ds = pool.map(function (u) { return depth(u, type); }), mx = Math.max.apply(null, ds);
        var best = pool.filter(function (u, i) { return ds[i] === mx; });
        var cnt = pool.map(function (u, i) { return ZHI[u] + '临' + ZHI[under(u)] + ds[i] + '重'; }).join('、');
        if (best.length === 1) return { pick: best[0], sub: '', why: why0 + '涉害数克（' + (type === 'zei' ? '数受克' : '数所克') + '）：' + cnt + '，取深者' + ZHI[best[0]] };
        return mzj(best, why0 + '涉害数克：' + cnt + '，深者相等；');
      }
      return mzj(pool, why0 + '涉害：');
    }
    // 贼克 → 比用 → 涉害
    function select(cands, type) {
      var ups = [];
      cands.forEach(function (k) { if (ups.indexOf(k.up) < 0) ups.push(k.up); });
      var tn = type === 'zei' ? '下贼上' : '上克下';
      var where = cands.map(function (k) { return kdesc(k) + '（' + (type === 'zei' ? WX[k.dwx] + '克' + WX[ZHI_WX[k.up]] : WX[ZHI_WX[k.up]] + '克' + WX[k.dwx]) + '）'; }).join('，');
      if (ups.length === 1) {
        return { pick: ups[0], gate: '贼克', name: type === 'zei' ? '重审' : '元首', sub: '',
          why: where + '，' + tn + (cands.length > 1 ? '同一上神' : '只此一处') + '，以' + ZHI[ups[0]] + '发用' };
      }
      var bi = ups.filter(function (u) { return isYang(u) === yang; });
      var head = where + '，' + tn + '有' + list(ups) + '；';
      if (bi.length === 1) return { pick: bi[0], gate: '比用', name: '比用', sub: '知一', why: head + '日干' + GAN[dg] + (yang ? '阳' : '阴') + '，取同' + (yang ? '阳' : '阴') + '之' + ZHI[bi[0]] + '（比用）' };
      var pool = bi.length > 1 ? bi : ups;
      var s = shehai(pool, type, head + (bi.length > 1 ? '俱比' : '俱不比') + '，');
      return { pick: s.pick, gate: '涉害', name: '涉害', sub: s.sub, why: s.why };
    }

    var zei = K.filter(function (k) { return k.zei; }), kk = K.filter(function (k) { return k.ke; });
    var bazhuan = JI[dg] === dz, out;

    if (r === 0) {
      // 伏吟
      var hasKe = K[0].zei || K[0].ke;
      var a = hasKe || yang ? gs : zs, b, c, du = false, why;
      why = '月将即占时，天地盘不动（伏吟）；' + (hasKe ? '一课' + kdesc(K[0]) + K[0].rel + '，有克取克，' + ZHI[a] + '为初传' : (yang ? '无克，刚日取干上神' : '无克，柔日取支上神') + ZHI[a] + '为初传');
      if (ZIXING.indexOf(a) >= 0) { b = a === gs ? zs : gs; why += '；' + ZHI[a] + '自刑，取' + (a === gs ? '支上神' : '干上神') + ZHI[b] + '为中传'; }
      else { b = XING[a]; why += '；' + ZHI[a] + '刑' + ZHI[b] + '为中传'; }
      if (ZIXING.indexOf(b) >= 0 || XING[b] === a) { c = mod(b + 6, 12); du = true; why += '；' + ZHI[b] + (ZIXING.indexOf(b) >= 0 ? '自刑' : '刑回初传') + '，取其冲' + ZHI[c] + '为末传'; }
      else { c = XING[b]; why += '；' + ZHI[b] + '刑' + ZHI[c] + '为末传'; }
      out = res(a, b, c, '伏吟', '伏吟', (yang ? '自任' : '自信') + (du ? '·杜传' : ''), why);
    } else if (r === 6) {
      if (zei.length || kk.length) {
        var s6 = zei.length ? select(zei, 'zei') : select(kk, 'ke');
        out = pass(s6.pick, '返吟', '返吟', '无依', '月将冲占时，天地盘相冲（返吟）；' + s6.why + '（' + s6.name + (s6.sub ? '·' + s6.sub : '') + '取法），中传为其冲，末传还原');
      } else {
        var ma = [2, 11, 8, 5][dz % 4];
        out = res(ma, zs, gs, '返吟', '返吟', '井栏射', '月将冲占时（返吟），四课无克：以日支' + ZHI[dz] + '驿马' + ZHI[ma] + '为初传，支上神' + ZHI[zs] + '为中传，干上神' + ZHI[gs] + '为末传（井栏射）');
      }
    } else if (zei.length || kk.length) {
      var s0 = zei.length ? select(zei, 'zei') : select(kk, 'ke');
      out = pass(s0.pick, s0.gate, s0.name, s0.sub, s0.why);
    } else if (bazhuan) {
      var a8 = yang ? mod(gs + 2, 12) : mod(K[3].up - 2, 12);
      out = res(a8, gs, gs, '八专', '八专', '', '干支同位（' + gzName(di) + '），两课无克：' + (yang ? '阳日自干上神' + ZHI[gs] + '顺数三位' : '阴日自四课上神' + ZHI[K[3].up] + '逆数三位') + '，得' + ZHI[a8] + '为初传，中传、末传俱取干上神' + ZHI[gs]);
      if (a8 === gs) out.sub = '独足';
    } else {
      // 遥克：先神克日，后日克神
      var others = K.slice(1), yk = others.filter(function (k) { return ke(ZHI_WX[k.up], GAN_WX[dg]); }), nm = '蒿矢';
      if (!yk.length) { yk = others.filter(function (k) { return ke(GAN_WX[dg], ZHI_WX[k.up]); }); nm = '弹射'; }
      if (yk.length) {
        var ups = [];
        yk.forEach(function (k) { if (ups.indexOf(k.up) < 0) ups.push(k.up); });
        var bi = ups.filter(function (u) { return isYang(u) === yang; });
        var pick = ups.length === 1 ? ups[0] : bi.length === 1 ? bi[0] : (yang ? (ups.indexOf(gs) >= 0 ? gs : ups[0]) : (ups.indexOf(zs) >= 0 ? zs : ups[0]));
        var w = nm === '蒿矢' ? '上神' + list(ups) + '遥克日干' + GAN[dg] : '日干' + GAN[dg] + '遥克上神' + list(ups);
        out = pass(pick, '遥克', '遥克', nm, '四课无上下克；' + w + (ups.length > 1 ? '，取与日干同' + (yang ? '阳' : '阴') + '之' + ZHI[pick] : '') + '，以' + ZHI[pick] + '发用（' + nm + '）');
      } else {
        if (distinct < 4) {
          var hg = (dg + 5) % 10, ab = yang ? sky(JI[hg]) : mod(dz + 4, 12);
          out = res(ab, gs, gs, '别责', '别责', '', '四课只得三课，无克亦无遥克（别责）：' + (yang ? '阳日取干合' + GAN[hg] + '（寄' + ZHI[JI[hg]] + '）上神' + ZHI[ab] : '阴日取支' + ZHI[dz] + '三合前一辰' + ZHI[ab]) + '为初传，中传、末传俱取干上神' + ZHI[gs]);
        } else if (yang) {
          out = res(sky(9), zs, gs, '昴星', '昴星', '虎视转蓬', '四课俱全，无克亦无遥克（昴星）：阳日取地盘酉上神' + ZHI[sky(9)] + '为初传，支上神' + ZHI[zs] + '为中传，干上神' + ZHI[gs] + '为末传');
        } else {
          out = res(under(9), gs, zs, '昴星', '昴星', '冬蛇掩目', '四课俱全，无克亦无遥克（昴星）：阴日取天盘酉下神' + ZHI[under(9)] + '为初传，干上神' + ZHI[gs] + '为中传，支上神' + ZHI[zs] + '为末传');
        }
      }
    }
    out.ke = K; out.r = r; out.di = di; out.distinct = distinct; out.bazhuan = bazhuan;
    return out;
  }

  /* =========================================================
     课体：九宗门之名 + 三传之形 + 几个常用格
     ========================================================= */
  var SANHE = [[8, 0, 4, '润下'], [2, 6, 10, '炎上'], [11, 3, 7, '曲直'], [5, 9, 1, '从革']];
  function keti(c) {
    var out = [], sc = c.sc, a = sc[0], b = sc[1], d = sc[2];
    var main = c.name + '课' + (c.sub ? '·' + c.sub : '');
    out.push({ n: main, k: 'main' });
    if (a !== b && b !== d) {
      if (mod(b - a, 12) === 1 && mod(d - b, 12) === 1) out.push({ n: '进茹', k: 'shape' });
      else if (mod(a - b, 12) === 1 && mod(b - d, 12) === 1) out.push({ n: '退茹', k: 'shape' });
      else if (mod(b - a, 12) === 2 && mod(d - b, 12) === 2) out.push({ n: '间传（顺）', k: 'shape' });
      else if (mod(a - b, 12) === 2 && mod(b - d, 12) === 2) out.push({ n: '间传（逆）', k: 'shape' });
    }
    var s = [a, b, d].slice().sort(function (x, y) { return x - y; }).join(',');
    SANHE.forEach(function (g) { if (g.slice(0, 3).slice().sort(function (x, y) { return x - y; }).join(',') === s) out.push({ n: g[3], k: 'shape' }); });
    if ([a, b, d].every(function (z) { return ZHI_WX[z] === 2; })) out.push({ n: '稼穑', k: 'shape' });
    if ([a, b, d].every(function (z) { return MENG.indexOf(z) >= 0; })) out.push({ n: '元胎', k: 'shape' });
    if (a === 5 && b === 10 && d === 3) out.push({ n: '铸印', k: 'ge' });
    if (a === 3 && c.under(3) === 8) out.push({ n: '斫轮', k: 'ge' });
    if ((a === 4 || a === 10) && (a === c.ke[0].up || a === c.ke[2].up)) out.push({ n: '斩关', k: 'ge' });
    if (a === c.xun.shou) out.push({ n: '六仪', k: 'ge' });
    return out;
  }

  /* =========================================================
     整盘
     base: { di, hourZhi, jiang, monthZhi, pillars?, date?, qi?, lunar?, Y? }
     ========================================================= */
  function build(base, o) {
    o = norm(o);
    var di = base.di, dg = di % 10, dz = di % 12, hz = base.hourZhi, jiang = base.jiang;
    var r = mod(jiang - hz, 12);
    var c = core(di, r, o);
    var sky = function (p) { return mod(p + r, 12); }, under = function (b) { return mod(b - r, 12); };
    c.sky = []; for (var p = 0; p < 12; p++) c.sky.push(sky(p));
    c.under = under;
    c.opts = o; c.base = base;
    c.day = { idx: di, gan: dg, zhi: dz, name: gzName(di) };
    c.hour = hz; c.jiang = jiang; c.jiangName = JIANG_NAME[jiang];
    c.monthZhi = base.monthZhi;

    // 贵人与十二天将（以天盘支记）
    var auto = hz >= 3 && hz <= 8, isDay = o.dn === 'auto' ? auto : o.dn === 'day';
    var G = GUI[o.gui], gz = (isDay ? G.day : G.night)[dg], gp = under(gz);
    var shun = [11, 0, 1, 2, 3, 4].indexOf(gp) >= 0;
    c.gui = { zhi: gz, at: gp, day: isDay, auto: o.dn === 'auto', shun: shun, rule: G.name, dayZhi: G.day[dg], nightZhi: G.night[dg] };
    c.gen = [];                                               // c.gen[天盘支] = 天将序
    for (var b = 0; b < 12; b++) c.gen[b] = shun ? mod(b - gz, 12) : mod(gz - b, 12);

    // 旬、遁干、旬空
    var x0 = mod(di - dg, 12);
    c.xun = { shou: x0, name: '甲' + ZHI[x0], kong: [mod(x0 + 10, 12), mod(x0 + 11, 12)] };
    c.dun = [];
    for (b = 0; b < 12; b++) { var kk = mod(b - x0, 12); c.dun[b] = kk < 10 ? kk : null; }
    var isKong = function (z) { return c.xun.kong.indexOf(z) >= 0; };
    var lq = function (z) { return LIUQIN[mod(ZHI_WX[z] - GAN_WX[dg], 5)]; };
    var mw = base.monthZhi != null ? ZHI_WX[base.monthZhi] : null;
    var ws = function (z) {
      if (mw == null) return '';
      var w = ZHI_WX[z];
      return w === mw ? '旺' : sheng(mw, w) ? '相' : sheng(w, mw) ? '休' : ke(w, mw) ? '囚' : '死';
    };
    var info = function (z) { return { zhi: z, gen: c.gen[z], genName: GEN[c.gen[z]], lq: lq(z), dun: c.dun[z], kong: isKong(z), ws: ws(z), at: under(z) }; };
    c.ke.forEach(function (k) { k.gen = c.gen[k.up]; k.genName = GEN[k.gen]; k.lq = lq(k.up); k.kong = isKong(k.up); });
    c.chuan = c.sc.map(info);
    c.lq = lq; c.info = info;

    // 神煞（地支）
    var mz = base.monthZhi;
    var S = [];
    var add = function (n, z, how) { S.push({ n: n, zhi: z, how: how }); };
    add('日禄', [2, 3, 5, 6, 5, 6, 8, 9, 11, 0][dg], '甲禄寅、乙卯、丙戊巳、丁己午、庚申、辛酉、壬亥、癸子');
    add('日德', [2, 8, 5, 11, 5, 2, 8, 5, 11, 5][dg], '甲己寅、乙庚申、丙辛巳、丁壬亥、戊癸巳');
    add('羊刃', mod([2, 3, 5, 6, 5, 6, 8, 9, 11, 0][dg] + 1, 12), '禄前一辰');
    add('昼贵', G.day[dg], G.name + '，前一字');
    add('夜贵', G.night[dg], G.name + '，后一字');
    add('驿马', [2, 11, 8, 5][dz % 4], '以日支：申子辰马寅，寅午戌马申，巳酉丑马亥，亥卯未马巳');
    add('丁马', mod(x0 + 3, 12), '旬中丁所遁之支');
    if (mz != null) add('天马', [6, 8, 10, 0, 2, 4][mod(mz - 2, 6)], '以月建：寅申午、卯酉申、辰戌戌、巳亥子、午子寅、未丑辰');
    add('华盖', [4, 1, 10, 7][dz % 4], '以日支三合之墓：申子辰辰，巳酉丑丑，寅午戌戌，亥卯未未');
    add('桃花', [9, 6, 3, 0][dz % 4], '咸池，以日支：申子辰酉，巳酉丑午，寅午戌卯，亥卯未子');
    add('劫煞', [5, 2, 11, 8][dz % 4], '以日支：申子辰巳，巳酉丑寅，寅午戌亥，亥卯未申');
    if (mz != null) {
      add('天喜', [7, 7, 10, 10, 10, 1, 1, 1, 4, 4, 4, 7][mz], '以月建四季：春戌、夏丑、秋辰、冬未');
      add('生气', mod(mz - 2, 12), '以月建：正月子，顺行');
      add('死气', mod(mz + 4, 12), '以月建：正月午，顺行');
    }
    var inSc = function (z) { return c.sc.map(function (x, i) { return x === z ? ['初', '中', '末'][i] : ''; }).filter(Boolean); };
    var inKe = function (z) { return c.ke.some(function (k) { return k.up === z; }); };
    S.forEach(function (s) { s.at = under(s.zhi); s.inSc = inSc(s.zhi); s.inKe = inKe(s.zhi); s.kong = isKong(s.zhi); });
    c.shensha = S;

    // 年命：本命（出生年支）与行年
    c.ming = null;
    if (o.mingYear) {
      var my = o.mingYear, mIdx = mod(my - 4, 60), mzh = mIdx % 12;
      var ming = { year: my, gz: gzName(mIdx), zhi: mzh, up: sky(mzh) };
      ming.upInfo = info(ming.up);
      if (base.Y != null && o.male != null && base.Y >= my) {
        var age = base.Y - my + 1;
        var xi = o.male ? mod(2 + age - 1, 60) : mod(8 - (age - 1), 60);
        ming.age = age; ming.male = o.male;
        ming.xing = { idx: xi, gz: gzName(xi), zhi: xi % 12, up: sky(xi % 12) };
        ming.xing.upInfo = info(ming.xing.up);
      }
      c.ming = ming;
    }
    c.keti = keti(c);
    c.title = c.keti[0].n;
    return c;
  }

  // 中气：某一时刻之前最后交的中气，与下一个
  var TERMS = J.terms;
  function qiAt(t) {
    var lo = 0, hi = TERMS.length - 1;
    if (t < TERMS[0].t || t >= TERMS[hi].t) return null;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (TERMS[mid].t <= t) lo = mid; else hi = mid - 1; }
    var k = lo;
    while (k >= 0 && J.NAMES.indexOf(TERMS[k].n) % 2 !== 0) k--;
    if (k < 0) return null;
    var n = k + 2 < TERMS.length ? TERMS[k + 2] : null;
    return { prev: TERMS[k], next: n, jiang: mod(10 - J.NAMES.indexOf(TERMS[k].n) / 2, 12) };
  }
  var RANGE = { min: new Date(1900, 0, 1).getTime(), max: new Date(2100, 11, 31, 23, 59).getTime() };
  function inRange(d) { var t = d.getTime(); return t >= RANGE.min && t <= RANGE.max; }

  function cast(date, opts) {
    if (!(date instanceof Date) || isNaN(date) || !inRange(date)) return null;
    var t = date.getTime();
    var q = qiAt(t);
    var bz = BZ.chart({ y: date.getFullYear(), mo: date.getMonth() + 1, d: date.getDate(), h: date.getHours(), mi: date.getMinutes(), tz: -date.getTimezoneOffset() / 60 });
    if (!q || !bz) return null;
    var P = bz.pillars, y = date.getFullYear();
    var Y = mod(y - 4, 60) === P[0].idx ? y : y - 1;          // 干支年对应的公历年（立春前算上一年）
    var c = build({ di: P[2].idx, hourZhi: P[3].zhi, jiang: q.jiang, monthZhi: P[1].zhi, pillars: P, date: new Date(t), qi: q, lunar: bz.lunar, Y: Y }, opts);
    c.pillars = P.map(function (x) { return { idx: x.idx, gan: x.gan, zhi: x.zhi, name: x.name }; });
    c.date = new Date(t);
    c.qi = q;
    c.lunarText = BZ.LUNAR && bz.lunar ? BZ.LUNAR.text(bz.lunar) : '';
    c.nearQi = (q.next && q.next.t - t < 3600e3) || (t - q.prev.t < 3600e3);
    return c;
  }
  // 古籍写法：某将某时某日（时干按五鼠遁）。monthZhi 可省（省则按「月将与月建相合」反推，只影响天马、天喜、生气死气、旺衰）
  function byJiang(jiang, hour, dayGZ, opts, monthZhi) {
    var j = typeof jiang === 'number' ? jiang : ZHI.indexOf(jiang), h = typeof hour === 'number' ? hour : ZHI.indexOf(hour);
    var di = typeof dayGZ === 'number' ? dayGZ : parseGZ(dayGZ);
    if (j < 0 || h < 0 || di < 0) return null;
    var mz = monthZhi == null ? mod(13 - j, 12) : typeof monthZhi === 'number' ? monthZhi : ZHI.indexOf(monthZhi);
    var c = build({ di: di, hourZhi: h, jiang: j, monthZhi: mz }, opts);
    var hi = gzIdx(((di % 10) % 5 * 2 + h) % 10, h);
    c.pillars = [null, null, { idx: di, gan: di % 10, zhi: di % 12, name: gzName(di) }, { idx: hi, gan: hi % 10, zhi: h, name: gzName(hi) }];
    return c;
  }

  /* =========================================================
     白话（只作读课提纲）
     ========================================================= */
  var KETI_SAY = {
    重审: '下贼上：事从下面、晚辈或内部起，先难后易；宜谨慎、后动，不宜抢先。',
    元首: '上克下：事从上面、尊长或外头来，顺而易成；先动者利，名正言顺。',
    比用: '两处都有克，择同类而用：事有两端、人有两心，宜选定一头，和而不争。',
    涉害: '克处多而难取，按深浅发用：事多牵连、阻隔、迟延，宜耐心周旋。',
    遥克: '四课无克，克在远处：事势轻、来去不实，祸福都不大。',
    昴星: '四课无克可取，仰观俯察：事多疑惧、关隔，宜静守观望，不宜轻动。',
    别责: '四课不全，另寻其责：事不完备，要靠旁人、借力而成，多迟滞。',
    八专: '干支同位，内外一体：多人合一事，公私不分；须防家内与情感上的纠缠。',
    伏吟: '天地盘不动：事主静守、伏藏，欲动不得；宜守旧待时，不宜远图。',
    返吟: '天地盘相冲：事主反复、来去，离合不定；动而速，得失往返。'
  };
  var SUB_SAY = {
    见机: '临孟发用，事在初起，见机而作', 察微: '临仲发用，宜察其细微', 缀瑕: '深浅相等，事难决断，留意瑕疵',
    蒿矢: '神来克日，外来之事，多虚惊', 弹射: '日去克神，事由我起，求而不切',
    虎视转蓬: '阳日，主动而有阻，出行防惊', 冬蛇掩目: '阴日，暗昧不明，宜伏藏',
    自任: '刚日，自强以待', 自信: '柔日，守静自持', 杜传: '刑而又冲，事有阻隔',
    无依: '有克而反复', 井栏射: '无克而动，事从远方、驿马起', 独足: '三传同一支，进退无路', 知一: '比用，事近而不远'
  };
  var SHAPE_SAY = {
    进茹: '三传顺进，事渐向前，宜进', 退茹: '三传逆退，事渐后退，宜守', '间传（顺）': '隔位而进，事有跳跃、间隔', '间传（逆）': '隔位而退，事有反复、间隔',
    润下: '三传水局，事如流水，主流动、智谋', 炎上: '三传火局，事主明显、急躁、文书', 曲直: '三传木局，事主生发、曲折', 从革: '三传金局，事主变革、更改',
    稼穑: '三传皆土，事主迟重、田宅', 元胎: '三传皆孟，事在萌芽、胎孕', 铸印: '巳戌卯，主印信、升迁', 斫轮: '卯临申，斫木成轮，主改造成器',
    斩关: '魁罡发用于干支上，主冲关而出、远行', 六仪: '旬首发用，主得尊者扶助'
  };
  var LQ_SAY = {
    父母: ['文书、长辈、房屋车舟、消息', '也主操劳'],
    兄弟: ['同辈、朋友、竞争', '主耗财、分夺'],
    子孙: ['子女、晚辈、福德', '主解忧、喜悦，问官不利'],
    妻财: ['钱财、妻室、物产', '主得财'],
    官鬼: ['官府、职位、压力', '问功名为官，问病讼为鬼']
  };
  var GEN_SAY = ['尊长贵人，主扶助、喜庆', '惊恐怪异、虚惊缠绕', '文书口舌、消息', '和合交易、婚姻、中介', '争斗牵连、田土、迟滞',
    '喜庆钱财、酒食', '虚诈不实、奴仆', '凶丧疾病、道路急速', '衣食宴会、印绶', '盗贼暗昧、失物', '阴私隐秘、暗中相助', '妇女恩泽、婚姻阴私'];
  var WS_SAY = { 旺: '当令得时', 相: '得令生扶', 休: '休而无力', 囚: '受制', 死: '失时' };
  function plain(c) {
    var rows = [], i0 = c.chuan[0], i1 = c.chuan[1], i2 = c.chuan[2];
    var main = c.keti[0], shapes = c.keti.slice(1);
    var subs = c.sub ? c.sub.split('·').filter(function (s) { return SUB_SAY[s]; }).map(function (s) { return s + '：' + SUB_SAY[s]; }) : [];
    rows.push({ lab: '课体', html: '<b>' + main.n + '</b>——' + KETI_SAY[c.name] + (subs.length ? '（' + subs.join('；') + '）' : '') });
    var w0 = ZHI[i0.zhi] + WX[ZHI_WX[i0.zhi]];
    var t = '初传<b>' + w0 + '</b>乘<b>' + i0.genName + '</b>，为<b>' + i0.lq + '</b>：关乎' + LQ_SAY[i0.lq][0] + '，' + LQ_SAY[i0.lq][1] + '；' + i0.genName + '主' + GEN_SAY[i0.gen] + '。';
    if (i0.ws) t += w0 + '在月令为' + i0.ws + '，' + WS_SAY[i0.ws] + '。';
    if (i0.kong) t += '初传旬空，事多虚而不实，或要等出空。';
    rows.push({ lab: '发端', html: t });
    rows.push({ lab: '走向', html: '中传' + ZHI[i1.zhi] + '（' + i1.genName + '·' + i1.lq + '）承接，末传<b>' + ZHI[i2.zhi] + '</b>（' + i2.genName + '·' + i2.lq + '）为归结，落在' + LQ_SAY[i2.lq][0] + '上' + (i2.kong ? '；末传旬空，结果难落实' : '') + '。' });
    if (shapes.length) rows.push({ lab: '形', html: shapes.map(function (s) { return '<b>' + s.n + '</b>' + (SHAPE_SAY[s.n] ? '：' + SHAPE_SAY[s.n] : ''); }).join('；') + '。' });
    if (c.ming) {
      var m = c.ming, u = m.upInfo;
      var y = '本命' + ZHI[m.zhi] + '（' + m.gz + '年）上见' + ZHI[m.up] + '乘' + u.genName + '，为' + u.lq + (u.kong ? '，旬空' : '');
      if (m.xing) y += '；行年' + m.xing.gz + '（' + (m.male ? '男' : '女') + '，' + m.age + '岁）上见' + ZHI[m.xing.up] + '乘' + m.xing.upInfo.genName + '，为' + m.xing.upInfo.lq;
      rows.push({ lab: '年命', html: y + '。' });
    }
    return rows;
  }

  /* =========================================================
     文字盘
     ========================================================= */
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function fmtT(t) { var d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function text(c, extra) {
    extra = extra || {};
    var L = [];
    if (c.date) {
      L.push('大六壬 · ' + fmtT(c.date.getTime()) + ' 周' + '日一二三四五六'[c.date.getDay()] + (c.lunarText ? ' · 农历' + c.lunarText : ''));
      L.push('四柱 ' + c.pillars.map(function (p) { return p.name; }).join(' ') + ' · ' + c.qi.prev.n + '后 ' + ZHI[c.jiang] + '将（' + c.jiangName + '）加' + ZHI[c.hour] + '时');
    } else {
      L.push('大六壬 · ' + ZHI[c.jiang] + '将（' + c.jiangName + '）加' + ZHI[c.hour] + '时 · ' + c.day.name + '日');
    }
    L.push((c.gui.day ? '昼' : '夜') + '占，贵人' + ZHI[c.gui.zhi] + '临' + ZHI[c.gui.at] + (c.gui.shun ? '顺布' : '逆布') + '（' + c.gui.rule + '）· 旬首' + c.xun.name + ' · 旬空' + c.xun.kong.map(function (z) { return ZHI[z]; }).join(''));
    if (extra.ask) L.push('所问：' + extra.ask);
    L.push('');
    L.push('课体：' + c.keti.map(function (k) { return k.n; }).join(' · '));
    L.push('发用：' + c.why);
    L.push('三传：');
    c.chuan.forEach(function (x, i) {
      L.push('  ' + ['初', '中', '末'][i] + '传 ' + ZHI[x.zhi] + ' ' + x.genName + ' ' + x.lq + ' 遁' + (x.dun == null ? '空' : GAN[x.dun]) + (x.kong ? ' 旬空' : '') + (x.ws ? ' ' + x.ws : ''));
    });
    L.push('四课：' + c.ke.map(function (k) { return k.name + ' ' + ZHI[k.up] + '加' + k.lowName + '（' + k.genName + '，' + k.rel + '）'; }).join('；'));
    L.push('天地盘（地盘→天盘·天将）：' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (p) { return ZHI[p] + '→' + ZHI[c.sky[p]] + '·' + GEN[c.gen[c.sky[p]]]; }).join(' '));
    L.push('神煞：' + c.shensha.map(function (s) { return s.n + ZHI[s.zhi] + (s.inSc.length ? '（入' + s.inSc.join('') + '传）' : ''); }).join(' '));
    if (c.ming) {
      var m = c.ming;
      L.push('年命：本命' + ZHI[m.zhi] + '（' + m.gz + '）上见' + ZHI[m.up] + m.upInfo.genName + m.upInfo.lq + (m.xing ? '；行年' + m.xing.gz + '上见' + ZHI[m.xing.up] + m.xing.upInfo.genName + m.xing.upInfo.lq : ''));
    }
    return L.join('\n');
  }

  function rules(opts) {
    var o = norm(opts), G = GUI[o.gui];
    return [
      ['月将', '以中气换将，交气时刻精确到分：雨水后亥将（登明）、春分后戌、谷雨后酉、小满后申、夏至后未、大暑后午、处暑后巳、秋分后辰、霜降后卯、小雪后寅、冬至后丑、大寒后子。'],
      ['占时', '起课时刻所在时辰，按本机钟表时间，不作真太阳时校正；23 点起为次日子时，日柱同时换日。年柱以立春、月柱以节换，精确到分。'],
      ['天地盘', '月将加占时，十二支顺布；月将即占时为伏吟，月将冲占时为返吟。'],
      ['四课', '一课干上（日干寄宫上神）、二课干阴、三课支上、四课支阴。寄宫：甲寅、乙辰、丙戊巳、丁己未、庚申、辛戌、壬亥、癸丑；一课论日干本身的五行。'],
      ['贼克比用', '下贼上优先于上克下，同一上神算一处：一处下贼上为重审，一处上克下为元首；两处以上取与日干同阴阳者（比用）。中传取初传上神，末传取中传上神。'],
      ['涉害', o.shehai === 'mzj'
        ? '俱比或俱不比时，按所临地盘的孟仲季定深浅（《占事略诀》《大六壬指南》一路）：临孟者发用为见机，无孟取临仲者为察微，孟仲皆无或不止一个，刚日取干上神、柔日取支上神（缀瑕）。另有「数克」古法，可在设置里改。'
        : '俱比或俱不比时，用「数克」古法（《大六壬大全》一路）：从所临地盘顺数归本家，两头都数，地盘支与寄宫干一并计——下贼上数克上神者，上克下数上神所克者，深者发用；深浅相等，依临孟（见机）、临仲（察微）、刚日干上柔日支上（缀瑕）。'],
      ['遥克', '四课无上下克，先取二三四课上神遥克日干者（蒿矢），无则取日干遥克之神（弹射）；有两个取与日干同阴阳者。'],
      ['昴星', '（俗作昂星）四课俱全、无克无遥克：阳日取地盘酉上神为初，中支上、末干上（虎视转蓬）；阴日取天盘酉下神为初，中干上、末支上（冬蛇掩目）。'],
      ['别责', '四课只得三课、无克无遥克：阳日取干合之寄宫上神，阴日取支三合前一辰为初传，中末俱干上神。'],
      ['八专', '甲寅、庚申、丁未、己未、癸丑干支同位，两课无克时不看遥克：阳日干上神顺数三位、阴日四课上神逆数三位为初传，中末俱干上神；三传同一支名独足。'],
      ['伏吟', '有克取克；无克刚日干上神、柔日支上神发用（自任、自信）。中传取初传所刑，初传自刑则换取支上或干上神；末传取中传所刑，中传自刑或刑回初传则取其冲（杜传）。'],
      ['返吟', '有克依贼克比用发用，中传为冲、末传还原（无依）；无克（丁丑、丁未、己丑、己未、辛丑、辛未）以日支驿马为初、支上神为中、干上神为末（井栏射）。'],
      ['天将', '贵人用「' + G.name + '」，' + (o.gui === 'niuyang' ? '前字昼贵、后字夜贵（甲戊庚昼丑夜未，乙己子申，丙丁亥酉，壬癸巳卯，辛午寅）；另有「甲羊戊庚牛」一说（《协纪辨方书》，本站通书同用）可改' : '「甲羊戊庚牛，乙猴己鼠求，丙鸡丁猪位，壬兔癸蛇游，六辛逢虎上」为昼贵，「甲牛戊庚羊，乙鼠己猴乡，丙猪丁鸡上，壬蛇癸兔藏，六辛逢午马」为夜贵（《协纪辨方书》）') +
        '。昼夜' + (o.dn === 'auto' ? '按占时：卯至申为昼，酉至寅为夜' : '手动指定为' + (o.dn === 'day' ? '昼' : '夜')) + '。贵人临地盘亥子丑寅卯辰顺布、临巳午未申酉戌逆布：贵人、腾蛇、朱雀、六合、勾陈、青龙、天空、白虎、太常、玄武、太阴、天后。'],
      ['遁干旬空', '以日旬遁干：旬首之甲起于旬首地支，顺排十干，余下两支为旬空。'],
      ['六亲旺衰', '六亲以日干论：生我父母、我生子孙、克我官鬼、我克妻财、比和兄弟。旺衰按月建五行：同旺、所生相、生月休、克月囚、受克死。'],
      ['课体', '先列九宗门之名（含见机、察微、缀瑕、蒿矢、弹射、虎视转蓬、冬蛇掩目、自任、自信、杜传、无依、井栏射、独足），再看三传之形：进茹、退茹、间传、润下炎上曲直从革、稼穑、元胎，与铸印（巳戌卯）、斫轮（卯临申）、斩关（辰戌发用于干支上）、六仪（旬首发用）。'],
      ['神煞', '日禄、日德、羊刃（禄前一辰）、昼贵夜贵以日干；驿马、华盖、桃花、劫煞以日支三合；丁马以日旬；天马、天喜、生气、死气以月建。'],
      ['年命', '本命取出生年支（立春前出生填上一年），看其上神；行年男一岁丙寅顺行、女一岁壬申逆行，以起课之年计虚岁。'],
      ['参照', '月将、寄宫、贵人两说、天将顺逆、旬遁据 kentang2017/kinliuren（MIT）核对；三传按九宗门逐条写，与 look-fate/liuren-ts-lib 的 720 课表交叉核对（只作参照，未拷入本站）。白话只作读课提纲，断事仍看类神与年命。']
    ];
  }

  var api = {
    GAN: GAN, ZHI: ZHI, WX: WX, GAN_WX: GAN_WX, ZHI_WX: ZHI_WX, JI: JI, GEN: GEN, GEN_S: GEN_S, GEN_JI: GEN_JI, GEN_WX: GEN_WX,
    JIANG_NAME: JIANG_NAME, LIUQIN: LIUQIN, XING: XING, GUI: GUI, SHEHAI: SHEHAI, RANGE: RANGE,
    core: core, cast: cast, byJiang: byJiang, plain: plain, text: text, rules: rules, keti: keti, qiAt: qiAt, inRange: inRange,
    gzName: gzName, parseGZ: parseGZ, gzIdx: gzIdx, mod: mod, norm: norm
  };
  if (NODE) module.exports = api; else root.LR = api;
})(this);
