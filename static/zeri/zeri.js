/* =========================================================
   择日 · 择时 —— 只管算，不碰页面
   ---------------------------------------------------------
   某件事放在某个时刻好不好，合看三层：
     一、日：通书底座（/fabao/tongshu.js）给这一天对这件事的分（协纪辨方的每日宜忌、黄道黑道、大吉神、
        二十八宿、冲本命、岁破四离四绝杨公忌、彭祖百忌，开了日本历注再加六曜選日）；
     二、时：这个时辰的值神黄道黑道、时辰冲本命；开了日本历注再看六曜的上午下午（先勝、先負、赤口）；
     附：嫁娶填了新娘出生年，再按《尅择讲义·嫁娶碎金赋》看女命（利月、杀翁姑、夫星天嗣、夫妻男女宫、埋儿时、孤寡），见 nvming.js；
     三、奇门：按事项取题型（面试→求职、考试面谈→考试……），用奇门手记的白话断语（QM.verdict）打分，
        年命填了也一并看。
   三层相加排先后；23 点以后按奇门惯例算次日子时。
   另有 parse()：把「11/18 20:00」「１１月１８日（水）２０：００」「11/16 夕方」这类写法读成时刻；
   toEvent()：把一条结果写成日历事项（UTC 起止，交给 TS.ics 存 .ics）。
   浏览器里挂 window.ZR；node 里 require 即得同一对象。
   ========================================================= */
(function (root) {
  'use strict';
  var NODE = typeof module !== 'undefined' && module.exports;
  var TS = NODE ? require('../fabao/tongshu.js') : root.TS;
  var QM = NODE ? require('../qimen/core.js') : root.QM;
  var NM = NODE ? require('./nvming.js') : root.ZR_NM;
  var HOUR = 3600e3;

  // —— 读候选时间 ——
  var WORD_H = [[/早上|早晨|上午|午前|朝/, 9], [/中午|正午|昼/, 12], [/下午|午後/, 15], [/傍晚|黄昏|夕方|夕/, 17], [/晚上|夜晚|夜|晚/, 20]];
  function half(s) {
    return String(s).replace(/[！-～]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/　/g, ' ').replace(/[：]/g, ':');
  }
  // 一行一个（也可用逗号、顿号、分号隔开）；年份缺省取 base 那年，已过去超过两个月的算明年
  function parse(text, base) {
    base = base || new Date();
    var out = [], lastY = null, lastMo = null;
    half(text).split(/[\n,，、;；]+/).forEach(function (line) {
      line = line.trim(); if (!line) return;
      var y = null, mo = null, d = null, h = null, mi = 0, m;
      if ((m = /(\d{4})\s*[-\/.年]\s*(\d{1,2})\s*[-\/.月]\s*(\d{1,2})/.exec(line))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
      else if ((m = /(\d{1,2})\s*[\/.月-]\s*(\d{1,2})\s*日?/.exec(line))) { mo = +m[1]; d = +m[2]; }
      else if (lastMo && (m = /(\d{1,2})\s*[日号號]/.exec(line))) { y = lastY; mo = lastMo; d = +m[1]; }   // 「18日（水）20:00」接上一行的月
      else return;
      var rest = line.slice(m.index + m[0].length);
      var t = /(\d{1,2})\s*:\s*(\d{2})/.exec(rest) || /(\d{1,2})\s*(?:点|時|时)\s*(?:(\d{1,2})\s*分|(半))?/.exec(rest) || /(\d{1,2})\s*(am|pm)/i.exec(rest);
      if (t) { h = +t[1]; mi = t[3] === '半' ? 30 : t[2] && /^\d+$/.test(t[2]) ? +t[2] : 0; }
      if (h != null && /下午|午後|晚|夜|pm/i.test(rest) && h < 12) h += 12;
      if (h === 12 && /am|午前/i.test(rest)) h = 0;
      if (h == null) WORD_H.some(function (w) { if (w[0].test(rest)) { h = w[1]; return true; } return false; });
      if (h == null) h = 12;
      if (!y) {
        y = base.getFullYear();
        var probe = new Date(y, mo - 1, d, h, mi);
        if (probe.getTime() < base.getTime() - 62 * 24 * HOUR) y++;
      }
      var dt = new Date(y, mo - 1, d, h, mi);
      if (!isNaN(dt) && dt.getMonth() === mo - 1) { out.push(dt); lastY = y; lastMo = mo; }
    });
    return out;
  }

  // —— 一个时刻 ——
  // opt: { ev: 事项键, jp: 日本历注, sx: 本命年支或 null, ming: 出生年（奇门年命）或 null, bride: 新娘出生年（只嫁娶用）或 null }
  function evalTime(date, opt) {
    var ev = TS.EV_BY[opt.ev] || TS.EVENTS[0];
    var civil = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var r = TS.day(civil);
    if (!r) return null;
    var dayS = TS.score(r, ev.k, { jp: opt.jp, sx: opt.sx });
    // 时辰：23 点后为次日子时，值神按次日日支起
    var hz = TS.hourOf(date), rH = date.getHours() >= 23 ? TS.day(new Date(civil.getTime() + 36 * HOUR)) : r;
    var hr = TS.hours(rH)[hz];
    var hourItems = [];
    hourItems.push({ t: hr.name + (hr.huang ? '黄道' : '黑道') + '（' + hr.shen + '）', v: hr.huang ? 1.5 : -1.5 });
    if (opt.sx != null && (hz + 6) % 12 === opt.sx) hourItems.push({ t: hr.name + '冲本命（属' + TS.SX[opt.sx] + '）', v: -2 });
    if (opt.jp && r.rokuyo) {
      var am = date.getHours() < 12, rk = r.rokuyo;
      if (rk === '先勝') hourItems.push({ t: '先勝' + (am ? '上午吉' : '下午凶'), v: am ? 0.5 : -0.5 });
      if (rk === '先負') hourItems.push({ t: '先負' + (am ? '上午凶' : '下午吉'), v: am ? -0.5 : 0.5 });
      if (rk === '赤口') hourItems.push({ t: '赤口' + (hz === 6 ? '午时可用' : '午时以外凶'), v: hz === 6 ? 0.5 : -0.5 });
    }
    var hourS = 0; hourItems.forEach(function (x) { hourS += x.v; });
    // 奇门：常见时辰多在 −10 到 +3（中位约 −5），先挪到以 0 为中，再按题型给权
    var c = QM.computeChart(date, null, { mingYear: opt.ming || undefined });
    var v = c ? QM.verdict(c, ev.qm) : null;
    var w = ev.qm === '自由' ? 0.3 : 0.55;
    var qmS = v ? (v.score + 3) * w : 0;
    var nm = ev.k === '嫁娶' && opt.bride && NM ? NM.items(r, hz, NM.of(opt.bride)) : [];
    var nmS = 0; nm.forEach(function (x) { nmS += x.v; });
    var total = Math.round((dayS.score + hourS + qmS + nmS) * 10) / 10;
    var items = []
      .concat(dayS.plus.concat(dayS.minus).map(function (x) { return { t: x.t, v: x.v, src: '日' }; }))
      .concat(hourItems.map(function (x) { return { t: x.t, v: x.v, src: '时' }; }))
      .concat(nm.map(function (x) { return { t: x.t, v: x.v, src: '女命' }; }))
      .concat(v ? v.items.map(function (x) { return { t: x.t, v: x.v * w, src: '奇门' }; }) : []);
    var pros = items.filter(function (x) { return x.v > 0; }).sort(function (a, b) { return b.v - a.v; });
    var cons = items.filter(function (x) { return x.v < 0; }).sort(function (a, b) { return a.v - b.v; });
    return {
      date: date, day: r, hour: hr, ev: ev,
      dayScore: dayS.score, dayGrade: TS.grade(dayS.score, opt.jp), dayPlus: dayS.plus, dayMinus: dayS.minus,
      hourScore: Math.round(hourS * 10) / 10, hourItems: hourItems,
      qm: v, qmScore: Math.round(qmS * 10) / 10, chart: c,
      nm: nm, nmScore: Math.round(nmS * 10) / 10,
      total: total, grade: grade(total, opt.jp), pros: pros, cons: cons
    };
  }
  // 分档按试算的分布定（2026-11-04 起一整年逐时辰、十种事项合算，每档约 4.4 万个时刻）：
  //   日本历注关：上吉 10.5%、吉 21.5%、平 35.7%、次 17.6%、凶 14.7%（中位约 −1.1）
  //   日本历注开：上吉 9.6%、吉 19.4%、平 34.6%、次 21.7%、凶 14.7%（六曜選日多扣分，凶的门槛放低 0.7）
  function grade(s, jp) { return s >= 4.7 ? '上吉' : s >= 1.2 ? '吉' : s >= -3.3 ? '平' : s >= (jp ? -6.8 : -6.1) ? '次' : '凶'; }

  // —— 在一段日子里逐时辰找 ——
  // win: [起点钟, 止点钟)（如 [9, 18]）；days: 'all' | 'work' | 'weekend'
  function search(from, to, win, opt, days) {
    var out = [], t0 = new Date(from.getFullYear(), from.getMonth(), from.getDate()), t1 = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
    var now = Date.now();
    for (var d = new Date(t0); d < t1; d.setDate(d.getDate() + 1)) {
      var wd = d.getDay();
      if (days === 'work' && (wd === 0 || wd === 6)) continue;
      if (days === 'weekend' && wd !== 0 && wd !== 6) continue;
      for (var h = 1; h < 24; h += 2) {                 // 丑时 1–3 点 …… 子时 23–1 点（算次日）；子时只从 23 点那头取一次
        var start = Math.max(win[0], h), end = Math.min(win[1], h + 2);
        if (end - start < 1) continue;                  // 时辰与时段重叠不足一小时的不算
        var at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), start, 0);
        if (at.getTime() < now - HOUR) continue;
        var e = evalTime(at, opt);
        if (e) { e.span = [start, end]; out.push(e); }
      }
    }
    out.sort(function (a, b) { return b.total - a.total || a.date - b.date; });
    return out;
  }

  // —— 写成日历事项 ——
  // 起止：找时辰时用那一段（span，整点）；自己给的时刻从那一刻到该时辰末（至少半小时）。时刻一律 UTC
  var WEEK = '日一二三四五六';
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function toEvent(e) {
    var d = e.date, start = d.getTime(), end;
    if (e.span) end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), e.span[1], 0).getTime();
    else {
      var h0 = 2 * Math.floor((d.getHours() + 1) / 2) - 1;       // 所在时辰的起点（子时起于前一日 23 点）
      end = Math.max(new Date(d.getFullYear(), d.getMonth(), d.getDate(), h0 + 2, 0).getTime(), start + 30 * 60000);
    }
    var E = e.ev, ed = new Date(end), short = function (t) { return t.replace(/：.*/, '').replace(/（[^）]*）$/, ''); };
    var when = (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + WEEK[d.getDay()] + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + '–' + p2(ed.getHours()) + ':' + p2(ed.getMinutes());
    var iso = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + 'T' + p2(d.getHours()) + ':' + p2(d.getMinutes());
    return {
      uid: new Date(start).toISOString().replace(/[-:]/g, '').slice(0, 13) + '-zr-' + (E.py || 'ev') + '@ohwowbill.com',
      start: start, end: end,
      title: E.name + ' · ' + e.grade + '（' + e.hour.name + '）',
      url: 'https://ohwowbill.com/qimen/?t=' + iso + (E.qm !== '自由' ? '&type=' + encodeURIComponent(E.qm) : ''),
      desc: when + ' ' + e.hour.name + ' · ' + e.day.gz.name + '日\n' +
        '黄历' + e.dayGrade + '（' + e.day.jianchu + '日 · ' + e.day.shen + (e.day.huang ? '黄道' : '黑道') + '），时辰' + e.hour.shen + (e.hour.huang ? '黄道' : '黑道') + '，奇门' + (e.qm ? e.qm.grade : '—') + '\n' +
        '好在' + (e.pros.slice(0, 3).map(function (x) { return short(x.t); }).join('、') || '—') + '；要留意' + (e.cons.slice(0, 2).map(function (x) { return short(x.t); }).join('、') || '—') + '\n' +
        '链接是这一刻的奇门盘 · 潜蛟阁择日'
    };
  }

  var api = { parse: parse, evalTime: evalTime, search: search, grade: grade, half: half, toEvent: toEvent };
  if (NODE) module.exports = api; else root.ZR = api;
})(this);
