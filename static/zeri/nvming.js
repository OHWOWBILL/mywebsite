/* =========================================================
   择日 · 嫁娶女命专项 —— 只管算，不碰页面
   ---------------------------------------------------------
   嫁娶以女命为主（竹林书局《尅择讲义》第二期〈嫁娶碎金赋〉：「次用男命配选日，女命为主要吉利」）。
   这里只收能由「新娘出生年」一个数推出来、讲义里讲明了算法的几条：
     · 女命利月：阳女（子寅辰午申戌）顺进、阴女逆退；进一位与其冲为大利月，进二小利，进三翁姑，进四父母，
       进五妨夫，本位与其冲为妨妇。月按节月。
     · 杀翁杀姑：女命前一位之日为杀翁，其冲为杀姑；天德、月德（含合）可解，否则翁或姑进门时暂避。
     · 真夫星、天嗣：女命正官、食神，以五虎遁定柱。嫁娶日正冲夫星（日干克之、日支冲之）大忌，偏冲可用；
       冲天嗣正偏皆忌，惟寅申巳亥之偏冲从权。（讲义例「夫星子未遇丁丑日为正冲」，「子」为「辛」之误。）
     · 夫妻宫、男女宫：女命从禄位起命宫逆数，第七为夫妻宫、第五为男女宫。日冲夫妻宫为杀夫杀妇，
       日冲男女宫为灭子胎（大凶不用）。
     · 埋儿时：子午卯酉女丑时、寅申巳亥女申时、辰戌丑未女卯时；进房、安床大忌。
     · 孤辰寡宿：课中（年月日时四支）全见大凶、吉不能制，单见不忌。亥子丑命忌寅戌全，寅卯辰命忌巳丑全，
       巳午未命忌申辰全，申酉戌命忌亥未全。
   出生年按立春换年（与择日页「出生年」同一口径），年干支 = (年 − 4)。
   分值与 tongshu.js 的打分同一尺度（冲本命 −3、宜忌正项 ±3–4）。
   浏览器里挂 window.ZR_NM；node 里 require 即得同一对象。
   ========================================================= */
(function (root) {
  'use strict';
  var GAN = '甲乙丙丁戊己庚辛壬癸', ZHI = '子丑寅卯辰巳午未申酉戌亥';
  var MON = ['冬月', '腊月', '正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月'];
  function mod(a, n) { return ((a % n) + n) % n; }
  var WX_G = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];                 // 木火土金水
  function ke(a, b) { return mod(WX_G[b] - WX_G[a], 5) === 2; } // 干 a 克干 b
  var LU = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];                  // 甲禄寅 … 癸禄子

  // 利月：返回 { 大利: [支, 支], … }
  var LI_NAME = ['大利', '小利', '翁姑', '父母', '妨夫'];
  function liyue(bz) {
    var out = {}, dir = bz % 2 === 0 ? 1 : -1;
    LI_NAME.forEach(function (n, i) { var z = mod(bz + dir * (i + 1), 12); out[n] = [z, mod(z + 6, 12)]; });
    out['妨妇'] = [bz, mod(bz + 6, 12)];
    return out;
  }
  // 五虎遁：年干 g 起寅月，返回天干为 tg 的那一柱 { gan, zhi }
  function dun(g, tg) {
    var g0 = [2, 4, 6, 8, 0][g % 5];                          // 甲己丙寅、乙庚戊寅、丙辛庚寅、丁壬壬寅、戊癸甲寅
    for (var i = 0; i < 12; i++) if (mod(g0 + i, 10) === tg) return { gan: tg, zhi: mod(2 + i, 12) };
    return null;
  }
  function gzName(p) { return GAN[p.gan] + ZHI[p.zhi]; }

  // 新娘出生年 → 这一套神煞的位置
  function of(year) {
    var g = mod(year - 4, 10), z = mod(year - 4, 12);
    var guanG = g % 2 === 0 ? mod(g + 7, 10) : mod(g + 5, 10); // 正官：克我异性（甲见辛、乙见庚）
    var shiG = mod(g + 2, 10);                                 // 食神：我生同性
    var lu = LU[g];
    var gu = [2, 2, 5, 5, 5, 8, 8, 8, 11, 11, 11, 2][z], gua = [10, 10, 1, 1, 1, 4, 4, 4, 7, 7, 7, 10][z];
    return {
      year: year, gan: g, zhi: z, name: GAN[g] + ZHI[z], yang: z % 2 === 0,
      li: liyue(z),
      weng: mod(z + 1, 12), gu: mod(z + 7, 12),
      fuxing: dun(g, guanG), tiansi: dun(g, shiG),
      lu: lu, fuqi: mod(lu - 6, 12), nannv: mod(lu - 4, 12),
      maier: [1, 3, 8, 1, 3, 8, 1, 3, 8, 1, 3, 8][z],           // 子丑寅卯辰巳 … 依次 丑卯申
      guchen: gu, guasu: gua
    };
  }

  // 冲某柱：'正'（日干克柱干、日支冲柱支）、'偏'（只冲支）或 null
  function chong(dayG, dayZ, p) {
    if (mod(dayZ - p.zhi, 12) !== 6) return null;
    return ke(dayG, p.gan) ? '正' : '偏';
  }

  /* 某个时刻的女命条目。r: TS.day(民用日)；hz: 时辰支；bride: of(year)
     返回 [{ t, v, layer: '日' | '时' }]（v 与 tongshu 打分同尺度） */
  function items(r, hz, bride) {
    var B = bride, out = [], put = function (t, v, layer) { out.push({ t: t, v: v, layer: layer || '日' }); };
    var mz = r.month.zhi, dg = r.gz.gan, dz = r.gz.zhi;
    var de = (r.jishen || []).filter(function (x) { return /^(天德|月德|天德合|月德合)$/.test(x); });
    // 利月
    Object.keys(B.li).forEach(function (n) {
      if (B.li[n].indexOf(mz) < 0) return;
      var mon = MON[mz] + '（' + ZHI[mz] + '月）';
      if (n === '大利') put('女命大利月：' + mon, 2);
      else if (n === '小利') put('女命小利月：' + mon, 1);
      else if (n === '翁姑') put('女命翁姑月：可用，新妇过门三朝后再拜翁姑', 0.25);
      else if (n === '父母') put('女命父母月：可用，出阁时女家父母不送上轿', 0.25);
      else put('女命' + n + '月：' + mon + '，不取', -3);
    });
    // 杀翁杀姑
    if (dz === B.weng || dz === B.gu) {
      var who = dz === B.weng ? '杀翁' : '杀姑';
      if (de.length) put(who + '日，有' + de.join('、') + '解', 0);
      else put(who + '日：无德神解，进门时' + (who === '杀翁' ? '翁' : '姑') + '暂避', -1.5);
    }
    // 夫星、天嗣
    var cf = chong(dg, dz, B.fuxing), ct = chong(dg, dz, B.tiansi);
    if (cf === '正') put('正冲真夫星' + gzName(B.fuxing), -4);
    else if (cf === '偏') put('偏冲夫星' + gzName(B.fuxing) + '（可用）', 0);
    if (ct) {
      var siMeng = [2, 5, 8, 11].indexOf(B.tiansi.zhi) >= 0;
      if (ct === '偏' && siMeng) put('偏冲天嗣' + gzName(B.tiansi) + '（寅申巳亥，从权可用）', -1);
      else put((ct === '正' ? '正冲' : '偏冲') + '天嗣' + gzName(B.tiansi) + '（主缺子）', -4);
    }
    // 夫妻宫、男女宫
    if (mod(dz - B.fuqi, 12) === 6) put('日冲女命夫妻宫（' + ZHI[B.fuqi] + '）：杀夫杀妇，宜三合六合填实', -3);
    if (mod(dz - B.nannv, 12) === 6) put('日冲女命男女宫（' + ZHI[B.nannv] + '）：灭子胎，大凶', -4);
    // 时辰：埋儿时
    if (hz === B.maier) put(ZHI[hz] + '时为埋儿时：进房、安床大忌', -2.5, '时');
    // 课中孤辰寡宿全见
    var zs = [r.year.zhi, mz, dz, hz];
    if (zs.indexOf(B.guchen) >= 0 && zs.indexOf(B.guasu) >= 0)
      put('课中孤辰' + ZHI[B.guchen] + '、寡宿' + ZHI[B.guasu] + '全见：大凶，吉不能制', -4, '时');
    return out;
  }

  var api = { of: of, items: items, liyue: liyue, dun: dun, LI_NAME: LI_NAME, MON: MON };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ZR_NM = api;
})(this);
