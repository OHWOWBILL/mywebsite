// =========================================================
// 五运六气 · 司天在泉 —— 只管算，不碰页面
// static/yunqi/index.html 拿去画；node 里也能直接 require 来核对。
// 干支一律用序号：甲0 … 癸9，子0 … 亥11。
// 运气年从大寒交：某公历年大寒之后，才算进入该年的干支之运气。
// 节气用低精度太阳黄经公式（与 assets/js/qj/li.js 同一口径），
// 误差在一刻钟以内。
// =========================================================

(function (root) {
  'use strict';

  const GAN = '甲乙丙丁戊己庚辛壬癸';
  const ZHI = '子丑寅卯辰巳午未申酉戌亥';
  const WX = ['木', '火', '土', '金', '水'];            // 相生之序
  const sheng = (a, b) => WX[(WX.indexOf(a) + 1) % 5] === b;   // a 生 b
  const ke = (a, b) => WX[(WX.indexOf(a) + 2) % 5] === b;      // a 克 b
  const mod = (a, n) => ((a % n) + n) % n;

  // —— 五运：甲己化土，乙庚化金，丙辛化水，丁壬化木，戊癸化火；阳干太过，阴干不及 ——
  const GAN_YUN = ['土', '金', '水', '木', '火', '土', '金', '水', '木', '火'];
  const YIN = { '木': '角', '火': '徵', '土': '宫', '金': '商', '水': '羽' };  // 五音建运
  const YUN_ORDER = ['木', '火', '土', '金', '水'];    // 主运：角徵宫商羽，年年从木起
  // 《素问·气交变大论》岁运太过、不及之首句
  const YUN_JING = {
    '木': ['岁木太过，风气流行，脾土受邪', '岁木不及，燥乃大行'],
    '火': ['岁火太过，炎暑流行，肺金受邪', '岁火不及，寒乃大行'],
    '土': ['岁土太过，雨湿流行，肾水受邪', '岁土不及，风乃大行'],
    '金': ['岁金太过，燥气流行，肝木受邪', '岁金不及，炎火乃行'],
    '水': ['岁水太过，寒气流行，邪害心火', '岁水不及，湿乃大行']
  };

  // —— 六气：一阴厥阴、二阴少阴、三阴太阴、一阳少阳、二阳阳明、三阳太阳（客气之序） ——
  const QI = [
    { name: '厥阴风木', short: '厥阴', wx: '木', sym: '风' },
    { name: '少阴君火', short: '少阴', wx: '火', sym: '热' },
    { name: '太阴湿土', short: '太阴', wx: '土', sym: '湿' },
    { name: '少阳相火', short: '少阳', wx: '火', sym: '火' },
    { name: '阳明燥金', short: '阳明', wx: '金', sym: '燥' },
    { name: '太阳寒水', short: '太阳', wx: '水', sym: '寒' }
  ];
  // 子午少阴，丑未太阴，寅申少阳，卯酉阳明，辰戌太阳，巳亥厥阴
  const ZHI_SITIAN = [1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0];
  // 主气六步，年年不变：厥阴、少阴、少阳、太阴、阳明、太阳
  const ZHUQI = [0, 1, 3, 2, 4, 5];
  const STEP = ['初之气', '二之气', '三之气', '四之气', '五之气', '终之气'];
  // 岁支本身五行（平气「得岁支之助」用）；岁会只取四正与四季之支
  const ZHI_WX = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];
  const SUIHUI_ZHI = [0, 1, 3, 4, 6, 7, 9, 10];       // 子丑卯辰午未酉戌

  // —— 年 ——
  const ganzhi = y => { const i = mod(y - 4, 60); return { idx: i, gan: i % 10, zhi: i % 12, name: GAN[i % 10] + ZHI[i % 12] }; };
  const gzFromIdx = i => ({ idx: i, gan: i % 10, zhi: i % 12, name: GAN[i % 10] + ZHI[i % 12] });

  function suiyun(gan) {
    const wx = GAN_YUN[gan], tai = gan % 2 === 0;
    return { wx, tai, yin: YIN[wx], name: `${wx}运${tai ? '太过' : '不及'}`, yinName: (tai ? '太' : '少') + YIN[wx], jing: YUN_JING[wx][tai ? 0 : 1] };
  }

  // 本年每一音的太少：岁运那一音随岁运，相邻之音太少相间（《六元正纪大论》五音建运）
  function yinTai(gan) {
    const s = suiyun(gan), k = YUN_ORDER.indexOf(s.wx);
    const t = {};
    YUN_ORDER.forEach((w, i) => { t[w] = (Math.abs(i - k) % 2 === 0) === s.tai; });
    return t;
  }
  const yunStep = (wx, t) => ({ wx, yin: YIN[wx], tai: t[wx], name: (t[wx] ? '太' : '少') + YIN[wx] });
  // 主运：角起羽终；客运：以岁运为初运，五行相生而下
  function zhuyun(gan) { const t = yinTai(gan); return YUN_ORDER.map(w => yunStep(w, t)); }
  function keyun(gan) {
    const t = yinTai(gan), k = YUN_ORDER.indexOf(GAN_YUN[gan]);
    return [0, 1, 2, 3, 4].map(i => yunStep(YUN_ORDER[(k + i) % 5], t));
  }

  // 客气六步：司天居三之气，在泉居终之气
  function keqi(zhi) { const s = ZHI_SITIAN[zhi]; return [0, 1, 2, 3, 4, 5].map(i => (s + i + 4) % 6); }

  // 客主加临：客胜为从，主胜为逆；二火同位，君位臣则顺，臣位君则逆（《至真要大论》）
  function jialin(ke_, zhu) {
    const a = QI[ke_], b = QI[zhu];
    if (ke_ === zhu) return { name: '同气', shun: true, note: '客主同气' };
    if (a.wx === b.wx) return ke_ === 1 ? { name: '君位臣', shun: true, note: '君火加临相火，顺' } : { name: '臣位君', shun: false, note: '相火加临君火，逆' };
    if (ke(a.wx, b.wx)) return { name: '客胜', shun: true, note: `客${a.wx}克主${b.wx}，客胜为从` };
    if (ke(b.wx, a.wx)) return { name: '主胜', shun: false, note: `主${b.wx}克客${a.wx}，主胜为逆` };
    if (sheng(a.wx, b.wx)) return { name: '相得', shun: true, note: `客${a.wx}生主${b.wx}` };
    return { name: '相得', shun: true, note: `主${b.wx}生客${a.wx}` };
  }

  // 运气异同：以司天之气对中运
  function yunqiRel(yunWx, qiWx) {
    if (yunWx === qiWx) return { name: '天符', note: '运与司天同气' };
    if (sheng(qiWx, yunWx)) return { name: '顺化', note: `气（${qiWx}）生运（${yunWx}）` };
    if (ke(qiWx, yunWx)) return { name: '天刑', note: `气（${qiWx}）克运（${yunWx}）` };
    if (sheng(yunWx, qiWx)) return { name: '小逆', note: `运（${yunWx}）生气（${qiWx}）` };
    return { name: '不和', note: `运（${yunWx}）克气（${qiWx}）` };
  }

  // 天符、岁会、太乙天符、同天符、同岁会、平气
  function tags(gan, zhi) {
    const s = suiyun(gan), st = QI[ZHI_SITIAN[zhi]], zq = QI[(ZHI_SITIAN[zhi] + 3) % 6];
    const tianfu = s.wx === st.wx;
    const suihui = SUIHUI_ZHI.indexOf(zhi) >= 0 && ZHI_WX[zhi] === s.wx;
    const out = [];
    if (tianfu && suihui) out.push({ k: 'taiyi', name: '太乙天符', note: '既为天符，又为岁会' });
    else {
      if (tianfu) out.push({ k: 'tianfu', name: '天符', note: `中运与司天之气同属${s.wx}` });
      if (suihui) out.push({ k: 'suihui', name: '岁会', note: `中运与岁支同属${s.wx}` });
    }
    if (zq.wx === s.wx) out.push(s.tai
      ? { k: 'tongtianfu', name: '同天符', note: `太过之运与在泉之气同属${s.wx}` }
      : { k: 'tongsuihui', name: '同岁会', note: `不及之运与在泉之气同属${s.wx}` });
    // 平气：太过而被司天所抑，不及而得司天或岁支之助（干德符之说未计）
    let ping = null;
    if (s.tai && ke(st.wx, s.wx)) ping = `${s.wx}运太过，${st.name}司天抑之`;
    else if (!s.tai && st.wx === s.wx) ping = `${s.wx}运不及，${st.name}司天助之`;
    else if (!s.tai && ZHI_WX[zhi] === s.wx) ping = `${s.wx}运不及，岁支${ZHI[zhi]}${s.wx}助之`;
    if (ping) out.push({ k: 'ping', name: '平气', note: ping });
    return out;
  }

  // —— 节气 ——
  const DAY = 86400000;
  function sunLon(d) {
    const n = d.getTime() / DAY + 2440587.5 - 2451545.0;
    const L = 280.460 + 0.9856474 * n, g = (357.528 + 0.9856003 * n) * Math.PI / 180;
    return mod(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g), 360);
  }
  function sunAt(target, from) {
    let t = from.getTime() + mod(target - sunLon(from), 360) / 0.9856 * DAY;
    for (let i = 0; i < 3; i++) t += (mod(target - sunLon(new Date(t)) + 180, 360) - 180) / 0.9856 * DAY;
    return new Date(t);
  }
  const term = (y, lon) => sunAt(lon, new Date(y, lon >= 300 ? 0 : 2, 1));   // 某年某黄经节气（大寒、小寒在正月）
  const dayStart = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d, n) => { const r = dayStart(d); r.setDate(r.getDate() + n); return r; };

  // 运气年 y：大寒(y) → 大寒(y+1)
  // 六气：大寒、春分、小满、大暑、秋分、小雪，各交一步
  // 五运：初运大寒日、二运春分后十三日、三运芒种后十日、四运处暑后七日、五运立冬后四日
  const QI_TERMS = [['大寒', 300], ['春分', 0], ['小满', 60], ['大暑', 120], ['秋分', 180], ['小雪', 240]];
  const YUN_TERMS = [['大寒', 300, 0], ['春分', 0, 13], ['芒种', 75, 10], ['处暑', 150, 7], ['立冬', 225, 4]];
  function bounds(y) {
    const end = term(y + 1, 300);
    const qi = QI_TERMS.map(([n, lon]) => ({ term: n, at: term(y, lon) }));
    qi.forEach((s, i) => { s.end = i < 5 ? qi[i + 1].at : end; });
    const yun = YUN_TERMS.map(([n, lon, plus]) => {
      const t = term(y, lon);
      return { term: n, plus, termAt: t, at: plus ? addDays(t, plus) : t };
    });
    yun.forEach((s, i) => { s.end = i < 4 ? yun[i + 1].at : end; });
    return { start: qi[0].at, end, qi, yun };
  }
  function yearOf(d) { const y = d.getFullYear(); return d >= term(y, 300) ? y : y - 1; }

  // 一整年的运气
  function year(y) {
    const gz = ganzhi(y), s = suiyun(gz.gan), st = ZHI_SITIAN[gz.zhi], zq = (st + 3) % 6;
    const kq = keqi(gz.zhi), b = bounds(y);
    return {
      y, gz, yun: s, sitian: st, zaiquan: zq,
      // 左右间气：司天之左为四之气、右为二之气；在泉之左为初之气、右为五之气
      jian: { stLeft: kq[3], stRight: kq[1], zqLeft: kq[0], zqRight: kq[4] },
      rel: yunqiRel(s.wx, QI[st].wx),
      tags: tags(gz.gan, gz.zhi),
      start: b.start, end: b.end,
      steps: kq.map((k, i) => ({ i, name: STEP[i], ke: k, zhu: ZHUQI[i], jl: jialin(k, ZHUQI[i]), term: b.qi[i].term, at: b.qi[i].at, end: b.qi[i].end })),
      zhuyun: zhuyun(gz.gan).map((u, i) => Object.assign(u, b.yun[i])),
      keyun: keyun(gz.gan).map((u, i) => Object.assign(u, { at: b.yun[i].at, end: b.yun[i].end }))
    };
  }

  // 某一刻：落在哪一年、哪一步、哪一运
  function at(d) {
    const Y = year(yearOf(d));
    const step = Y.steps.findIndex(s => d >= s.at && d < s.end);
    const yun = Y.zhuyun.findIndex(s => d >= s.at && d < s.end);
    const cur = Y.steps[step];
    return { d, year: Y, step, yun, frac: cur ? (d - cur.at) / (cur.end - cur.at) : 0 };
  }

  const api = {
    GAN, ZHI, WX, QI, STEP, ZHUQI, ZHI_SITIAN, GAN_YUN, YIN, YUN_JING,
    ganzhi, gzFromIdx, suiyun, zhuyun, keyun, keqi, jialin, yunqiRel, tags, sunLon, term, bounds, yearOf, year, at
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Yunqi = api;
})(this);
