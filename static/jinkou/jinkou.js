/* =========================================================
   大六壬金口诀 · 起课引擎
   四位（自上而下）：人元（干）· 贵神 · 将神 · 地分。
   · 地分：问事所在方位或来人方位，十二支之一；不定方位的，以占时为地分。
   · 将神：月将加占时，地分上所临之天盘支（月将以中气换，与本站大六壬同一张表，见 /liuren/liuren.js qiAt）。
   · 贵神：以日干取贵人（昼夜按占时，卯至申昼），贵人起于地盘本位，
           在亥子丑寅卯辰顺布、在巳午未申酉戌逆布十二贵神，数到地分即得贵神。
           贵神五行、阴阳按其本家支：贵丑、蛇巳、雀午、合卯、勾辰、龙寅、空戌、虎申、常未、玄子、阴酉、后亥。
   · 人元：以日干五子元遁（甲己起甲子、乙庚丙子、丙辛戊子、丁壬庚子、戊癸壬子）遁至地分所得之干；
           贵神、将神之干同法遁出。
   · 用爻：四位论阴阳，阳多取阴、阴多取阳，少者为用；二阴二阳或纯阴纯阳，诸家取法不一，只标出生克，不强取。
   浏览器里挂 window.JK（需先载 /qimen/jieqi.js、/fabao/lunar.js、/bazi/bazi.js、/liuren/liuren.js）；
   node 里 require 即得同一对象。
   ========================================================= */
(function (root) {
  'use strict';
  var NODE = typeof module !== 'undefined' && module.exports;
  var LR = NODE ? require('../liuren/liuren.js') : root.LR;
  var GAN = LR.GAN, ZHI = LR.ZHI, WX = LR.WX, GAN_WX = LR.GAN_WX, ZHI_WX = LR.ZHI_WX, mod = LR.mod;

  var GEN = LR.GEN;                                              // 贵人、腾蛇……天后
  var GEN_ZHI = [1, 5, 6, 3, 4, 2, 10, 8, 7, 0, 9, 11];          // 十二贵神本家支
  var GEN_JI = LR.GEN_JI;
  var POS = ['人元', '贵神', '将神', '地分'];
  // 地分所对的方位（子正北，顺时针）
  var FANG = ['正北', '北偏东', '东北', '正东', '东偏南', '东南', '正南', '南偏西', '西南', '正西', '西偏北', '西北'];

  function ke(a, b) { return mod(b - a, 5) === 2; }
  function sheng(a, b) { return mod(b - a, 5) === 1; }
  function dunGan(dg, z) { return mod((dg % 5) * 2 + z, 10); }   // 五子元遁

  // 上位 a 对下位 b（五行序号）
  function rel(a, b) {
    if (a === b) return { k: 'bi', n: '比和' };
    if (ke(a, b)) return { k: 'ke', n: '上克下' };
    if (ke(b, a)) return { k: 'zei', n: '下贼上' };
    if (sheng(a, b)) return { k: 'sheng', n: '上生下' };
    return { k: 'sheng2', n: '下生上' };
  }

  function norm(o) {
    o = o || {};
    return { gui: LR.GUI[o.gui] ? o.gui : 'niuyang', dn: ['day', 'night'].indexOf(o.dn) >= 0 ? o.dn : 'auto', difen: o.difen };
  }

  // base：{ di 日干支序, hourZhi, jiang, monthZhi } ；o.difen 缺省取占时
  function build(base, o) {
    o = norm(o);
    var dg = base.di % 10, hz = base.hourZhi, jiang = base.jiang;
    var d = o.difen == null || o.difen === '' || isNaN(+o.difen) ? hz : mod(+o.difen, 12);
    var c = { base: base, opts: o, difen: d, difenAuto: o.difen == null || o.difen === '', hour: hz, jiang: jiang, jiangName: LR.JIANG_NAME[jiang] };

    // 将神
    var js = mod(d + jiang - hz, 12);
    // 贵神：地盘布贵
    var auto = hz >= 3 && hz <= 8, isDay = o.dn === 'auto' ? auto : o.dn === 'day';
    var G = LR.GUI[o.gui], gz = (isDay ? G.day : G.night)[dg];
    var shun = [11, 0, 1, 2, 3, 4].indexOf(gz) >= 0;
    var gi = shun ? mod(d - gz, 12) : mod(gz - d, 12);
    var gzh = GEN_ZHI[gi];
    c.gui = { zhi: gz, day: isDay, auto: o.dn === 'auto', shun: shun, rule: G.name };
    c.genAt = [];                                                 // 十二地盘位上各是何贵神
    for (var p = 0; p < 12; p++) c.genAt[p] = shun ? mod(p - gz, 12) : mod(gz - p, 12);

    // 旬空
    var x0 = mod(base.di - dg, 12);
    c.xun = { shou: x0, name: '甲' + ZHI[x0], kong: [mod(x0 + 10, 12), mod(x0 + 11, 12)] };
    var mw = base.monthZhi != null ? ZHI_WX[base.monthZhi] : null;
    var ws = function (w) {
      if (mw == null) return '';
      return w === mw ? '旺' : sheng(mw, w) ? '相' : sheng(w, mw) ? '休' : ke(w, mw) ? '囚' : '死';
    };
    var rg = dunGan(dg, d);
    c.wei = [
      { pos: '人元', gan: rg, name: GAN[rg], wx: GAN_WX[rg], yang: rg % 2 === 0 },
      { pos: '贵神', gen: gi, zhi: gzh, name: GEN[gi], gan: dunGan(dg, gzh), wx: ZHI_WX[gzh], yang: gzh % 2 === 0, ji: !!GEN_JI[gi] },
      { pos: '将神', zhi: js, name: LR.JIANG_NAME[js], gan: dunGan(dg, js), wx: ZHI_WX[js], yang: js % 2 === 0 },
      { pos: '地分', zhi: d, name: ZHI[d], wx: ZHI_WX[d], yang: d % 2 === 0, fang: FANG[d] }
    ];
    c.wei.forEach(function (w) {
      w.ws = ws(w.wx);
      w.kong = w.zhi != null && c.xun.kong.indexOf(w.zhi) >= 0;
    });
    // 相邻上下生克
    c.rels = [0, 1, 2].map(function (i) { var r = rel(c.wei[i].wx, c.wei[i + 1].wx); r.up = i; r.down = i + 1; return r; });
    // 人元与将神、地分隔位之克也标出（五动之意：干与支神相克）
    c.far = [[0, 2], [0, 3], [1, 3]].map(function (pr) { var r = rel(c.wei[pr[0]].wx, c.wei[pr[1]].wx); r.up = pr[0]; r.down = pr[1]; return r; })
      .filter(function (r) { return r.k === 'ke' || r.k === 'zei'; });
    c.wei.forEach(function (w, i) {
      w.dong = c.rels.concat(c.far).some(function (r) { return (r.k === 'ke' || r.k === 'zei') && (r.up === i || r.down === i); });
    });
    // 用爻：阴阳少者
    var ny = c.wei.filter(function (w) { return w.yang; }).length;
    c.yinyang = { yang: ny, yin: 4 - ny };
    c.yong = null;
    if (ny === 1 || ny === 3) {
      var want = ny === 1;                                         // 一阳三阴取阳，三阳一阴取阴
      c.yong = c.wei.findIndex(function (w) { return w.yang === want; });
    }
    c.wei.forEach(function (w, i) { w.yong = i === c.yong; });
    c.title = c.wei[0].name + ' ' + GEN[gi] + ' ' + c.wei[2].name + ' ' + ZHI[d];
    return c;
  }

  function cast(date, opts) {
    var o = norm(opts);
    var lc = LR.cast(date, { gui: o.gui, dn: o.dn });
    if (!lc) return null;
    var c = build({ di: lc.day.idx, hourZhi: lc.hour, jiang: lc.jiang, monthZhi: lc.monthZhi }, o);
    c.pillars = lc.pillars; c.date = lc.date; c.qi = lc.qi; c.lunarText = lc.lunarText; c.nearQi = lc.nearQi;
    c.day = lc.day;
    return c;
  }

  /* ---------- 白话（读课提纲） ---------- */
  var POS_SAY = {
    人元: '自己、问事之人，事情外露的样子',
    贵神: '贵人、上级与助力，事情的起因与动机',
    将神: '对方、所问之事本身，事情的走向与结果',
    地分: '所处环境、地点与根基，事情的底子'
  };
  var GEN_SAY = ['尊长贵人，主扶助、喜庆、官事', '惊恐怪异、虚惊缠绕、梦寐', '文书口舌、消息、是非', '和合交易、婚姻、中介', '争斗牵连、田土、迟滞',
    '喜庆钱财、酒食、婚事', '虚诈不实、奴仆、落空', '凶丧疾病、道路急速、刀兵', '衣食宴会、印绶、礼服', '盗贼暗昧、失物、奸私', '阴私隐秘、暗中相助、妇人', '妇女恩泽、婚姻阴私、后宫'];
  var JIANG_SAY = ['阴私、妇女、水边与暗中之事', '田宅、喜庆、尊长、牛', '文书、官吏、木器、信件', '门户、车船、林木，也主盗贼', '争斗、刚猛、牢狱、旧事翻起',
    '惊恐、文书、炉冶、光亮', '信息、文书、血光、马与红色', '酒食、婚姻、宴会、羊与药物', '道路、行人、传递、变动', '金银、奴婢、阴私、小口',
    '欺诈、狱讼、奴仆、犬与墙垣', '征召、阴私、沐浴、猪与池水'];
  var REL_SAY = {
    ke: '上克下：上位压住下位，事由上面或外面来，主动可控，但下位受制',
    zei: '下贼上：下位冲犯上位，事从下面、内部或晚辈起，多阻滞反复',
    sheng: '上生下：上位扶下位，主顺、得助',
    sheng2: '下生上：下位奉上位，主付出、供养',
    bi: '比和：两位同气，主平稳、彼此相当'
  };
  var WS_SAY = { 旺: '当令有力', 相: '得令生扶', 休: '休而无力', 囚: '受制少力', 死: '失时无力' };

  function plain(c) {
    var W = c.wei, rows = [];
    var y = c.yong;
    if (y != null) rows.push({ lab: '用爻', html: '<b>' + W[y].pos + '</b>（' + (W[y].pos === '人元' ? W[y].name : W[y].name + (W[y].zhi != null ? ZHI[W[y].zhi] : '')) + '）：' + POS_SAY[W[y].pos] + '。四位' + (c.yinyang.yang === 3 ? '三阳一阴，以阴为用' : '三阴一阳，以阳为用') + '，先从这一位看起。' });
    else rows.push({ lab: '用爻', html: '四位' + (c.yinyang.yang === 2 ? '二阴二阳' : c.yinyang.yang === 4 ? '纯阳' : '纯阴') + '，诸家取用不一；以下面标「动」的克处为要。' });
    rows.push({ lab: '贵神', html: '<b>' + GEN[W[1].gen] + '</b>' + (W[1].ji ? '（吉神）' : '（凶神）') + '：' + GEN_SAY[W[1].gen] + '。' });
    rows.push({ lab: '将神', html: '<b>' + W[2].name + '</b>（' + ZHI[W[2].zhi] + '）：' + JIANG_SAY[W[2].zhi] + '。' });
    var ks = c.rels.filter(function (r) { return r.k === 'ke' || r.k === 'zei'; });
    rows.push({ lab: '生克', html: ks.length
      ? ks.map(function (r) { return W[r.up].pos + '与' + W[r.down].pos + '，' + REL_SAY[r.k]; }).join('；') + '。'
      : '四位上下相生或比和，没有克处，事势平顺，宜顺水推舟。' });
    var strong = W.filter(function (w) { return w.ws === '旺' || w.ws === '相'; }).map(function (w) { return w.pos; });
    var weak = W.filter(function (w) { return w.ws === '囚' || w.ws === '死'; }).map(function (w) { return w.pos; });
    if (strong.length || weak.length) rows.push({ lab: '旺衰', html: (strong.length ? strong.join('、') + '得令有力' : '') + (strong.length && weak.length ? '；' : '') + (weak.length ? weak.join('、') + '失令少力' : '') + '。克者旺则克得动，受克者旺则克不倒。' });
    var ko = W.filter(function (w) { return w.kong; }).map(function (w) { return w.pos; });
    if (ko.length) rows.push({ lab: '旬空', html: ko.join('、') + '落空：所主之事虚而不实，或时机未到，出旬再看。' });
    return rows;
  }

  function text(c, extra) {
    extra = extra || {};
    var W = c.wei, pad = function (n) { return String(n).padStart(2, '0'); }, d = c.date;
    var lines = [];
    lines.push('大六壬金口诀');
    if (d) lines.push('起课：' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()));
    if (c.pillars) lines.push('四柱：' + c.pillars.map(function (p) { return p ? p.name : '—'; }).join(' '));
    lines.push(ZHI[c.jiang] + '将（' + c.jiangName + '）加' + ZHI[c.hour] + '时；地分 ' + ZHI[c.difen] + '（' + FANG[c.difen] + '）' + (c.difenAuto ? '，以占时为地分' : ''));
    lines.push((c.gui.day ? '昼' : '夜') + '贵' + ZHI[c.gui.zhi] + '，地盘' + (c.gui.shun ? '顺' : '逆') + '布；旬空 ' + c.xun.kong.map(function (z) { return ZHI[z]; }).join(''));
    if (extra.ask) lines.push('所问：' + extra.ask);
    lines.push('');
    W.forEach(function (w) {
      var s = w.pos + '：';
      if (w.pos === '人元') s += w.name + '（' + WX[w.wx] + '）';
      else if (w.pos === '贵神') s += GAN[w.gan] + ' ' + w.name + '（' + ZHI[w.zhi] + WX[w.wx] + '）';
      else if (w.pos === '将神') s += GAN[w.gan] + ZHI[w.zhi] + ' ' + w.name + '（' + WX[w.wx] + '）';
      else s += w.name + '（' + WX[w.wx] + '，' + w.fang + '）';
      s += ' ' + (w.yang ? '阳' : '阴') + (w.ws ? ' ' + w.ws : '') + (w.kong ? ' 旬空' : '') + (w.yong ? ' 【用爻】' : '');
      lines.push(s);
    });
    lines.push('生克：' + c.rels.map(function (r) { return POS[r.up] + '对' + POS[r.down] + r.n; }).join('，'));
    return lines.join('\n');
  }

  function rules(opts) {
    var o = norm(opts), G = LR.GUI[o.gui];
    return [
      ['四位', '自上而下：人元（天干）、贵神、将神、地分。人元为己、为表；贵神为贵人、为动机；将神为对方、为事体；地分为环境、为根基。'],
      ['地分', '问事所在或来人所在的方位，十二支之一（子正北，顺时针）；不定方位的，以占时之支为地分。'],
      ['将神', '月将以中气换（雨水后亥将……大寒后子将，交气精确到分，与本站大六壬同表），月将加占时，取地分上所临之天盘支。'],
      ['贵神', '贵人用「' + G.name + '」，昼夜' + (o.dn === 'auto' ? '按占时（卯至申昼，酉至寅夜）' : '手动定为' + (o.dn === 'day' ? '昼' : '夜')) + '。贵人起于地盘本位（地盘布贵），在亥子丑寅卯辰顺布、巳午未申酉戌逆布十二贵神，数到地分即是贵神。贵神五行、阴阳按本家支。'],
      ['人元', '以日干五子元遁到地分得干：甲己起甲子，乙庚起丙子，丙辛起戊子，丁壬起庚子，戊癸起壬子。贵神、将神之干同法遁出。'],
      ['用爻', '四位论阴阳（干以甲丙戊庚壬为阳，支以子寅辰午申戌为阳）：三阳一阴以阴为用，三阴一阳以阳为用。二阴二阳、纯阴纯阳诸家取法不一，本站不强取，只把有克的几位标「动」。'],
      ['生克旺衰', '相邻上下论生克：上克下、下贼上、上生下、下生上、比和；人元对将神、地分，贵神对地分有克者也标出。旺衰按月建五行，旬空以日旬。'],
      ['参照', '月将、贵人两说与本站大六壬（/liuren/）共用一套表。白话只作读课提纲，断事仍要合所问类象与旺衰。']
    ];
  }

  var api = { POS: POS, FANG: FANG, GEN_ZHI: GEN_ZHI, cast: cast, build: build, plain: plain, text: text, rules: rules, dunGan: dunGan, norm: norm };
  if (NODE) module.exports = api; else root.JK = api;
})(this);
