/* 校时 · 两盘参看：占星、七政、紫微共用的一小件
   ---------------------------------------------------------
   · 时段扫描：出生时刻只记得个大概（如二十点几分）时，把一段钟点逐分排盘，
     看盘面在哪几分换段（上升换座、命宫换宫、换时辰……），同一段里的盘是同一张。
   · 事件：记几件有日期的事，同一个生日（加姓名）在三件法宝里共用，只存本机 localStorage。
   · 求根：某条推运在哪一分出生的盘上恰好成相——逐分扫变号，再线性内插到分。
   不碰各家的排盘，只拿各家算好的盘来比。
   ========================================================= */
(function (root) {
  'use strict';
  var LS = 'jiaoshi.events.v1';
  var KINDS = [
    { k: 'qing', n: '感情' }, { k: 'gong', n: '工作' }, { k: 'xue', n: '学业' }, { k: 'qian', n: '迁移' },
    { k: 'cai', n: '钱财' }, { k: 'bing', n: '伤病' }, { k: 'qin', n: '亲人' }, { k: 'qi', n: '其他' }
  ];
  var KIND_N = {}; KINDS.forEach(function (x) { KIND_N[x.k] = x.n; });
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var wrap180 = function (x) { return ((x % 360) + 540) % 360 - 180; };

  // 钟点分（当日零点起的分钟数）⇄ 'HH:MM'
  function fmt(m) { m = Math.round(m); var d = Math.floor(m / 1440); m -= d * 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60) + (d > 0 ? '⁺' : d < 0 ? '⁻' : ''); }
  function parse(s) { var r = /^(\d{1,2}):(\d{2})/.exec(s || ''); return r ? +r[1] * 60 + +r[2] : null; }

  // 候选钟点：几段 [[m0, m1], …]（当日零点起的分钟，含两端），排序并合并重叠、相接的
  function norm(ranges) {
    var R = (ranges || []).map(function (r) { return [Math.max(0, Math.min(1439, Math.round(r[0]))), Math.max(0, Math.min(1439, Math.round(r[1])))]; })
      .filter(function (r) { return r[1] >= r[0]; }).sort(function (a, b) { return a[0] - b[0]; }), out = [];
    R.forEach(function (r) { var L = out[out.length - 1]; if (L && r[0] <= L[1] + 1) L[1] = Math.max(L[1], r[1]); else out.push(r.slice()); });
    return out;
  }
  function minsOf(ranges) { var out = []; norm(ranges).forEach(function (r) { for (var m = r[0]; m <= r[1]; m++) out.push(m); }); return out; }
  // 逐分排盘，相同 key 且钟点相接的连成一段：sig(m, k) → { key, ... }；段记首尾分与下标
  function segments(mins, sig) {
    var out = [], cur = null;
    mins.forEach(function (m, k) {
      var s = sig(m, k);
      if (!cur || cur.key !== s.key || m !== cur.to + 1) { cur = { from: m, to: m, i0: k, i1: k, key: s.key, at: s }; out.push(cur); }
      else { cur.to = m; cur.i1 = k; }
    });
    return out;
  }
  // 某量在哪几分过零：vals[k] 为第 mins[k] 分的有符号差（度），跳过 ±180 的折返与不相接的两分
  function zeros(mins, vals) {
    var out = [];
    for (var k = 0; k + 1 < vals.length; k++) {
      var a = vals[k], b = vals[k + 1];
      if (mins[k + 1] !== mins[k] + 1 || a == null || b == null || Math.abs(b - a) > 30) continue;
      if (a === 0) { out.push({ m: mins[k], rate: b - a }); continue; }
      if ((a < 0 && b > 0) || (a > 0 && b < 0)) out.push({ m: mins[k] + a / (a - b), rate: b - a });
    }
    return out;
  }

  /* ---------------- 事件（本机） ---------------- */
  function keyOf(y, mo, d, name) { return y + '-' + pad(mo) + '-' + pad(d) + (name ? '|' + name : ''); }
  function all() { try { var v = JSON.parse(localStorage.getItem(LS)); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
  function list(key) { var v = all()[key]; return Array.isArray(v) ? v.filter(function (e) { return e && /^\d{4}-\d{2}-\d{2}$/.test(e.d); }) : []; }
  function save(key, arr) {
    var A = all();
    if (arr.length) A[key] = arr.slice().sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; }); else delete A[key];
    try { localStorage.setItem(LS, JSON.stringify(A)); } catch (e) { /* 无痕模式 */ }
  }

  // 事件编辑：日期 + 类别 + 备注；改动后 onChange(list)
  function mountEvents(el, key, onChange) {
    var draw = function () {
      var L = list(key);
      el.innerHTML =
        '<div class="js-add"><input type="date" class="js-d" aria-label="事件日期" min="1885-01-01" max="2099-12-31">' +
        '<select class="js-k" aria-label="事件类别">' + KINDS.map(function (x) { return '<option value="' + x.k + '">' + x.n + '</option>'; }).join('') + '</select>' +
        '<input type="text" class="js-n" maxlength="40" placeholder="一句话记下这件事" aria-label="事件备注">' +
        '<button type="button" class="fb-btn js-go">记下</button></div>' +
        (L.length ? '<ul class="js-evs">' + L.map(function (e, i) {
          return '<li><b>' + esc(e.d) + '</b><span class="js-kind k-' + esc(e.k) + '">' + esc(KIND_N[e.k] || '其他') + '</span><span class="js-note">' + esc(e.n || '') + '</span><button type="button" class="fb-btn ghost js-del" data-i="' + i + '" aria-label="删去这件事">删</button></li>';
        }).join('') + '</ul>' : '<p class="fb-fine js-empty">还没记事件。</p>');
      el.querySelector('.js-go').onclick = function () {
        var d = el.querySelector('.js-d').value;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { if (root.Fabao) root.Fabao.toast('先选日期'); return; }
        var L2 = list(key); L2.push({ d: d, k: el.querySelector('.js-k').value, n: el.querySelector('.js-n').value.trim() });
        save(key, L2); draw(); onChange(list(key));
      };
      el.querySelectorAll('.js-del').forEach(function (b) {
        b.onclick = function () { var L2 = list(key); L2.splice(+b.dataset.i, 1); save(key, L2); draw(); onChange(list(key)); };
      });
    };
    draw();
    return list(key);
  }

  // 换段条：钟点不相接处留一道缝；段多（全天）时改成可换行的小牌
  function barHTML(segs, label, sel) {
    var many = segs.length > 8, span = segs.reduce(function (a, s) { return a + s.to - s.from + 1; }, 0) || 1;
    return '<div class="js-bar' + (many ? ' many' : '') + '">' + segs.map(function (s, i) {
      var w = (s.to - s.from + 1) / span * 100, gap = i && s.from !== segs[i - 1].to + 1 ? '<i class="js-gap" aria-hidden="true"></i>' : '';
      return gap + '<button type="button" class="js-seg s' + (i % 4) + (sel === i ? ' on' : '') + '" data-i="' + i + '"' + (many ? '' : ' style="flex:' + w.toFixed(3) + ' 1 0"') + ' title="' + fmt(s.from) + '–' + fmt(s.to) + '">' +
        '<b>' + label(s) + '</b><small>' + fmt(s.from) + '–' + fmt(s.to) + '</small></button>';
    }).join('') + '</div>';
  }
  // 命中分布：hits [{ m, w }]，每段相接的钟点各自按 bin 分钟一格画小柱，段与段之间留缝；返回 { html, best }
  function histHTML(mins, hits, bin) {
    if (!mins.length) return { html: '', best: null };
    bin = bin || 5;
    var runs = [], r = null;
    mins.forEach(function (m) { if (!r || m !== r[1] + 1) { r = [m, m]; runs.push(r); } else r[1] = m; });
    var cells = [];
    runs.forEach(function (R, ri) { for (var a = R[0]; a <= R[1]; a += bin) cells.push({ a: a, b: Math.min(R[1], a + bin - 1), v: 0, gap: ri > 0 && a === R[0] }); });
    hits.forEach(function (h) { for (var i = 0; i < cells.length; i++) if (h.m >= cells[i].a && h.m < cells[i].b + 1) { cells[i].v += h.w || 1; break; } });
    var mx = 0, best = -1; cells.forEach(function (c, i) { if (c.v > mx) { mx = c.v; best = i; } });
    var every = Math.max(1, Math.ceil(cells.length / 8));
    var html = '<div class="js-hist" role="img" aria-label="命中分布">' + cells.map(function (c, k) {
      return (c.gap ? '<b class="js-hgap"></b>' : '') + '<span class="' + (k === best ? 'top' : '') + '" title="' + fmt(c.a) + '–' + fmt(c.b) + ' · ' + (Math.round(c.v * 10) / 10) + '"><i style="height:' + (mx ? Math.max(c.v ? 8 : 0, c.v / mx * 100) : 0).toFixed(1) + '%"></i>' + (k % every === 0 || c.gap ? '<em>' + fmt(c.a) + '</em>' : '') + '</span>';
    }).join('') + '</div>';
    return { html: html, best: best < 0 ? null : { from: cells[best].a, to: cells[best].b, w: mx } };
  }

  /* ---------------- 候选钟点（本机，三件法宝共用） ---------------- */
  var LS_CAND = 'jiaoshi.cand.v1';
  // 按钟表时间的十三个时辰格（早子、晚子分开）
  var SHI = [['早子', 0, 59]].concat(['丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].map(function (n, i) { return [n, 60 + i * 120, 179 + i * 120]; }), [['晚子', 1380, 1439]]);
  function candGet(key) { try { var A = JSON.parse(localStorage.getItem(LS_CAND)) || {}; return Array.isArray(A[key]) ? norm(A[key]) : null; } catch (e) { return null; } }
  function candSet(key, R) { try { var A = JSON.parse(localStorage.getItem(LS_CAND)) || {}; A[key] = norm(R); localStorage.setItem(LS_CAND, JSON.stringify(A)); } catch (e) { /* 无痕模式 */ } }
  function minus(R, a, b) {
    var out = [];
    norm(R).forEach(function (r) { if (r[1] < a || r[0] > b) out.push(r); else { if (r[0] < a) out.push([r[0], a - 1]); if (r[1] > b) out.push([b + 1, r[1]]); } });
    return out;
  }
  function covered(R, a, b) { var n = 0; norm(R).forEach(function (r) { n += Math.max(0, Math.min(r[1], b) - Math.max(r[0], a) + 1); }); return n; }
  // 候选编辑：勾时辰、自加一段、全天、清空；onChange(ranges)
  function mountCand(el, key, def, onChange) {
    var R = candGet(key) || norm(def);
    var draw = function () {
      var total = covered(R, 0, 1439);
      el.innerHTML = '<div class="js-shi" role="group" aria-label="勾候选时辰（钟表时间）">' + SHI.map(function (x, i) {
        var c = covered(R, x[1], x[2]), st = c === 0 ? '' : c === x[2] - x[1] + 1 ? ' on' : ' half';
        return '<button type="button" class="js-chip' + st + '" data-i="' + i + '" title="' + fmt(x[1]) + '–' + fmt(x[2] + 1) + '">' + x[0] + '<small>' + fmt(x[1]).slice(0, 2) + '</small></button>';
      }).join('') + '</div>' +
        '<div class="js-add2"><label class="js-rg">自 <input type="time" class="js-a" step="60" aria-label="另加一段：起"></label><label class="js-rg">至 <input type="time" class="js-b" step="60" aria-label="另加一段：止"></label>' +
        '<button type="button" class="fb-btn js-plus">加一段</button><button type="button" class="fb-btn ghost js-all">全天</button><button type="button" class="fb-btn ghost js-clr">清空</button></div>' +
        '<div class="js-rl">' + (R.length ? R.map(function (r, i) { return '<span class="js-r">' + fmt(r[0]) + '–' + fmt(r[1]) + '<button type="button" class="js-x" data-i="' + i + '" aria-label="去掉这一段">×</button></span>'; }).join('') +
          '<span class="fb-fine">共 ' + total + ' 分</span>' : '<span class="fb-fine">还没有候选钟点。</span>') + '</div>';
      var set = function (N) { R = norm(N); candSet(key, R); draw(); onChange(R); };
      el.querySelectorAll('.js-chip').forEach(function (b) {
        b.onclick = function () { var x = SHI[+b.dataset.i]; set(covered(R, x[1], x[2]) === x[2] - x[1] + 1 ? minus(R, x[1], x[2]) : R.concat([[x[1], x[2]]])); };
      });
      el.querySelectorAll('.js-x').forEach(function (b) { b.onclick = function () { var N = R.slice(); N.splice(+b.dataset.i, 1); set(N); }; });
      el.querySelector('.js-plus').onclick = function () {
        var a = parse(el.querySelector('.js-a').value), b = parse(el.querySelector('.js-b').value);
        if (a == null || b == null) { if (root.Fabao) root.Fabao.toast('先填起止钟点'); return; }
        set(b >= a ? R.concat([[a, b]]) : R.concat([[a, 1439], [0, b]]));     // 跨半夜拆两段
      };
      el.querySelector('.js-all').onclick = function () { set([[0, 1439]]); };
      el.querySelector('.js-clr').onclick = function () { set([]); };
    };
    draw();
    return R;
  }

  var CSS = '' +
    '.js-bar{display:flex;gap:3px;margin:12px 0 6px;min-height:52px}.js-bar.many{flex-wrap:wrap}.js-bar.many .js-seg{flex:0 0 auto;max-width:100%}' +
    '.js-gap{flex:0 0 10px;align-self:stretch;background:repeating-linear-gradient(135deg,var(--rule-2) 0 2px,transparent 2px 5px);border-radius:2px}' +
    '.js-shi{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 8px}' +
    '.js-chip{border:1px solid var(--rule-2);background:var(--bg-3);color:var(--muted);border-radius:var(--r-sm);padding:3px 8px;font-family:var(--font-title);font-size:14px;cursor:pointer;display:inline-flex;gap:4px;align-items:baseline}' +
    '.js-chip small{font-family:var(--font-mark);font-size:11px;color:var(--faint)}.js-chip.on{background:var(--zi);border-color:var(--zi);color:#fff}.js-chip.on small{color:#e6defa}' +
    '.js-chip.half{border-color:var(--zi-2);color:var(--fg);background:color-mix(in srgb,var(--zi) 22%,var(--bg-3))}' +
    '.js-add2{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.js-rl{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px}' +
    '.js-r{font-family:var(--font-mark);font-size:13px;border:1px solid var(--rule-2);border-radius:var(--r-xs);padding:1px 2px 1px 7px;display:inline-flex;align-items:center;gap:2px;color:var(--fg-2)}' +
    '.js-x{border:0;background:none;color:var(--faint);cursor:pointer;font-size:15px;line-height:1;padding:0 4px}.js-x:hover{color:var(--zhu)}' +
    '.js-hgap{flex:0 0 8px;align-self:stretch;background:repeating-linear-gradient(135deg,var(--rule) 0 2px,transparent 2px 5px)}' +
    '.js-seg{min-width:0;border:1px solid var(--rule-2);background:var(--bg-3);color:var(--fg-2);border-radius:var(--r-sm);padding:6px 6px 5px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:2px;overflow:hidden;font:inherit}' +
    '.js-seg b{font-family:var(--font-title);font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.js-seg small{font-family:var(--font-mark);font-size:12px;color:var(--faint);white-space:nowrap}' +
    '.js-seg.s1{background:color-mix(in srgb,var(--zi) 16%,var(--bg-3))}.js-seg.s2{background:color-mix(in srgb,var(--qing) 14%,var(--bg-3))}.js-seg.s3{background:color-mix(in srgb,var(--jin) 12%,var(--bg-3))}' +
    '.js-seg.on{border-color:var(--jin);box-shadow:0 0 0 1px var(--jin) inset}' +
    '.js-chg{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:4px;font-size:14px}' +
    '.js-chg li{display:flex;gap:10px;align-items:baseline}.js-chg time{font-family:var(--font-mark);color:var(--jin);min-width:3.4em}' +
    '.js-add{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.js-add .js-n{flex:1 1 12em;min-width:0}' +
    '.js-evs{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:4px}' +
    '.js-evs li{display:flex;gap:8px;align-items:center;font-size:14px;border-bottom:1px dashed var(--rule);padding:3px 0}' +
    '.js-evs b{font-family:var(--font-mark);font-weight:500;color:var(--fg)}.js-note{flex:1;color:var(--fg-2);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.js-kind{font-size:12px;border:1px solid var(--rule-2);border-radius:var(--r-xs);padding:0 5px;color:var(--zi-2)}.js-kind.k-qing{color:var(--zhu);border-color:color-mix(in srgb,var(--zhu) 50%,transparent)}' +
    '.js-rg{display:inline-flex;gap:6px;align-items:center;color:var(--muted);font-size:14px;margin-right:8px}' +
    '.js-hist{display:flex;align-items:flex-end;gap:2px;height:72px;margin:12px 0 22px;border-bottom:1px solid var(--rule-2)}' +
    '.js-hist span{flex:1 1 0;height:100%;display:flex;align-items:flex-end;position:relative}' +
    '.js-hist i{display:block;width:100%;background:var(--zi);border-radius:2px 2px 0 0;opacity:.75}.js-hist span.top i{background:var(--jin);opacity:1}' +
    '.js-hist em{position:absolute;top:100%;left:0;font-style:normal;font-family:var(--font-mark);font-size:11px;color:var(--faint);margin-top:3px;white-space:nowrap}' +
    '.js-ev{border-top:1px solid var(--rule);padding-top:10px;margin-top:12px}.js-ev h4{margin:0 0 6px;font-family:var(--font-title);font-size:15px;font-weight:600;color:var(--fg)}' +
    '.js-ev h4 small{font-weight:400;color:var(--muted);margin-left:.6em;font-size:13px}' +
    '.js-hits{list-style:none;margin:0;padding:0;display:grid;gap:3px;font-size:14px}' +
    '.js-hits li{display:flex;gap:10px;align-items:baseline}.js-hits time{font-family:var(--font-mark);color:var(--jin);min-width:5.2em;white-space:nowrap}' +
    '.js-hits .sp{font-size:12px;border-radius:var(--r-xs);padding:0 4px;border:1px solid var(--rule-2);color:var(--muted);white-space:nowrap}' +
    '.js-hits .sp.f{color:var(--lv);border-color:color-mix(in srgb,var(--lv) 45%,transparent)}.js-hits .sp.p{color:var(--qing);border-color:color-mix(in srgb,var(--qing) 45%,transparent)}' +
    '.js-hits li.slow{color:var(--muted)}' +
    '.js-two{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}@media (max-width:640px){.js-two{grid-template-columns:1fr}}' +
    '.js-pick{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0 10px}' +
    '.js-cmp{width:100%;border-collapse:collapse;font-size:14px}.js-cmp th,.js-cmp td{padding:4px 6px;border-bottom:1px solid var(--rule);text-align:left;vertical-align:top}' +
    '.js-cmp th{color:var(--muted);font-weight:400;white-space:nowrap}.js-cmp tr.same td{color:var(--faint)}.js-cmp tr.diff td{color:var(--fg)}.js-cmp tr.diff th{color:var(--jin)}' +
    '.js-cmp td.ch{background:color-mix(in srgb,var(--jin) 10%,transparent)}' +
    '.js-segrow{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:14px;margin:4px 0}.js-segrow time{font-family:var(--font-mark);color:var(--muted);white-space:nowrap}' +
    '.js-segrow .hit{color:var(--fg)}.js-segrow .hit b{color:var(--jin);font-weight:500}.js-segrow .no{color:var(--faint)}';
  if (root.document && !root.document.getElementById('js-css')) {
    var st = root.document.createElement('style'); st.id = 'js-css'; st.textContent = CSS; root.document.head.appendChild(st);
  }

  /* =========================================================
     各家的算法：只拿各家引擎算好的盘来比，引擎作参数传进来（node 里也能跑自检）
     ========================================================= */
  var DAYMS = 864e5;
  function evUtc(ev, tz) { var r = /^(\d{4})-(\d{2})-(\d{2})/.exec(ev.d); return Date.UTC(+r[1], +r[2] - 1, +r[3], 12) - tz * 3600e3; }
  function ageAt(birthUtc, y, mo, d, ev) {   // 事件那天的足岁
    var r = /^(\d{4})-(\d{2})-(\d{2})/.exec(ev.d), a = +r[1] - y;
    if (+r[2] < mo || (+r[2] === mo && +r[3] < d)) a--;
    return Math.max(0, a);
  }

  /* ---------- 占星 ---------- */
  var XP_SIGNS = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'];
  var XP_N = { sun: '太阳', moon: '月亮', mercury: '水星', venus: '金星', mars: '火星', jupiter: '木星', saturn: '土星', uranus: '天王', neptune: '海王', pluto: '冥王' };
  var XP_TEN = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  var XP_SPEED = { sun: 'f', mercury: 'f', venus: 'f', mars: 'f', jupiter: 'm', saturn: 'm', uranus: 's', neptune: 's', pluto: 's' };
  var XP_W = { f: 2, m: 1, s: 0.5, p: 2 };
  // 每类事件另看哪几个宫头（四轴、宿命点总看）
  var XP_CUSP = { qing: [5], gong: [6], xue: [3, 9], qian: [9], cai: [2, 8], bing: [6, 12], qin: [], qi: [] };
  var CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  var sgOf = function (l) { return Math.floor((((l % 360) + 360) % 360) / 30); };
  // 刑：左刑右刑都算，返回离精确的有符号差
  var sq = function (d) { d = wrap180(d); return d >= 0 ? d - 90 : d + 90; };
  // base: { y, mo, d, tz, dst, lat, lon, house }；mins 为出生日钟点分（可不相接）
  function astroCharts(XP, base, mins) {
    return mins.map(function (m) { return XP.chart({ y: base.y, mo: base.mo, d: base.d, h: 0, mi: m, tz: base.tz, dst: base.dst, lat: base.lat, lon: base.lon, house: base.house || 'placidus' }); });
  }
  function astroScan(XP, charts, mins) {
    var segs = segments(mins, function (m, k) { var a = sgOf(charts[k].angles.asc); return { key: a, asc: a }; });
    var chg = [];
    for (var k = 1; k < charts.length; k++) {
      if (mins[k] !== mins[k - 1] + 1) continue;
      var A = charts[k - 1], B = charts[k], m = mins[k];
      var pt = function (name, a, b) { if (sgOf(a) !== sgOf(b)) chg.push({ m: m, t: name + ' ' + XP_SIGNS[sgOf(a)] + '→' + XP_SIGNS[sgOf(b)] }); };
      pt('上升', A.angles.asc, B.angles.asc); pt('中天', A.angles.mc, B.angles.mc);
      [2, 3, 5, 6, 8, 9, 11, 12].forEach(function (i) { pt('第' + CN_NUM[i] + '宫头', A.cusps[i], B.cusps[i]); });
      if (A.extra.vertex && B.extra.vertex) pt('宿命点', A.extra.vertex.lon, B.extra.vertex.lon);
      XP_TEN.forEach(function (id) { if (A.bodies[id].house !== B.bodies[id].house) chg.push({ m: m, t: XP_N[id] + ' 第' + CN_NUM[A.bodies[id].house] + '宫→第' + CN_NUM[B.bodies[id].house] + '宫' }); });
      if (sgOf(A.bodies.moon.lon) !== sgOf(B.bodies.moon.lon)) pt('月亮', A.bodies.moon.lon, B.bodies.moon.lon);
    }
    return { segs: segs, changes: chg };
  }
  // 一件事在候选钟点里的精确命中：
  //   行运日水金火木土天海冥对本命四轴（合刑冲）、宿命点（合冲）、此类事之宫头（合）；
  //   次限上升、中天对本命十星；次限月亮对四轴；次限日、月、金对宿命点（合冲）；
  //   太阳弧宿命点对本命十星（合刑冲）。宿命点一分钟走七八角分，比上升快，最能分出钟点
  function astroHits(XP, charts, mins, base, ev) {
    var t = evUtc(ev, base.tz), T = XP.bodies(t), hits = [];
    var cusps = XP_CUSP[ev.k] || [];
    var vx = function (C) { return C.extra.vertex ? C.extra.vertex.lon : null; };
    var push = function (vals, label, cls, speed) {
      zeros(mins, vals).forEach(function (z) {
        var unc = speed != null && z.rate ? Math.abs(speed) * 0.5 / Math.abs(z.rate) : null;   // 事发时辰不明：行运星半日所走，折成出生分
        hits.push({ m: z.m, t: label, cls: cls, unc: unc, w: XP_W[cls], vx: /宿命点/.test(label) });
      });
    };
    Object.keys(XP_SPEED).forEach(function (id) {
      var cls = XP_SPEED[id], L = T[id].lon, sp = XP.speedOf(id, t), nm = '行运' + XP_N[id];
      [[0, 'asc', '合上升'], [180, 'asc', '合下降'], [90, 'asc', '刑上升'], [0, 'mc', '合中天'], [180, 'mc', '合天底'], [90, 'mc', '刑中天']].forEach(function (a) {
        push(charts.map(function (C) { var p = a[1] === 'asc' ? C.angles.asc : C.angles.mc; return a[0] === 90 ? sq(L - p) : wrap180(L - p - a[0]); }), nm + a[2], cls, sp);
      });
      push(charts.map(function (C) { var v = vx(C); return v == null ? null : wrap180(L - v); }), nm + '合宿命点', cls, sp);
      push(charts.map(function (C) { var v = vx(C); return v == null ? null : wrap180(L - v - 180); }), nm + '冲宿命点', cls, sp);
      cusps.forEach(function (i) { push(charts.map(function (C) { return wrap180(L - C.cusps[i]); }), nm + '合第' + CN_NUM[i] + '宫头', cls, sp); });
    });
    var P = charts.map(function (C) { return XP.progressed(C, t); });
    XP_TEN.forEach(function (id) {
      [[0, '合'], [180, '冲'], [90, '刑']].forEach(function (a) {
        ['asc', 'mc'].forEach(function (w) {
          push(charts.map(function (C, k) { var d = P[k][w] - C.bodies[id].lon; return a[0] === 90 ? sq(d) : wrap180(d - a[0]); }), '次限' + (w === 'asc' ? '上升' : '中天') + a[1] + '本命' + XP_N[id], 'p', null);
        });
        // 太阳弧宿命点：本命宿命点加上太阳弧
        push(charts.map(function (C, k) { var v = vx(C); if (v == null) return null; var d = v + P[k].arc - C.bodies[id].lon; return a[0] === 90 ? sq(d) : wrap180(d - a[0]); }), '太阳弧宿命点' + a[1] + '本命' + XP_N[id], 'p', null);
      });
    });
    [[0, 'asc', '合上升'], [180, 'asc', '合下降'], [0, 'mc', '合中天'], [180, 'mc', '合天底']].forEach(function (a) {
      push(charts.map(function (C, k) { return wrap180(P[k].bodies.moon.lon - (a[1] === 'asc' ? C.angles.asc : C.angles.mc) - a[0]); }), '次限月亮' + a[2], 'p', null);
    });
    ['sun', 'moon', 'venus'].forEach(function (id) {
      [[0, '合'], [180, '冲']].forEach(function (a) {
        push(charts.map(function (C, k) { var v = vx(C); return v == null ? null : wrap180(P[k].bodies[id].lon - v - a[0]); }), '次限' + XP_N[id] + a[1] + '宿命点', 'p', null);
      });
    });
    hits.sort(function (x, y) { return x.m - y.m; });
    return hits;
  }
  // 小限年主：按段（上升换座才变）
  function astroLords(XP, charts, segs, base, ev) {
    return segs.map(function (s) {
      var C = charts[s.i0], pr = XP.profection(C, ageAt(C.utc, base.y, base.mo, base.d, ev));
      return { seg: s, sign: pr.sign, lord: pr.lord, house: pr.house };
    });
  }

  /* ---------- 七政 ---------- */
  var QZ_KIND = { qing: '夫妻', gong: '官禄', xue: '官禄', qian: '迁移', cai: '财帛', bing: '疾厄', qin: '田宅', qi: null };
  var QZ_SPEED = { ri: 'f', shui: 'f', jin: 'f', huo: 'f', mu: 'm', tu: 'm', luo: 's', ji: 's', qi: 's', bo: 's' };
  function qzCharts(QZ, base, mins) {
    return mins.map(function (m) { return QZ.chart({ y: base.y, mo: base.mo, d: base.d, h: 0, mi: m, tz: base.tz, dst: base.dst, lat: base.lat, lon: base.lon, luoji: base.luoji }); });
  }
  function qzScan(QZ, charts, mins) {
    var segs = segments(mins, function (m, k) { var C = charts[k]; return { key: C.ming.zhi + '|' + C.ming.xiu + '|' + C.shen.zhi }; });
    var chg = [], Z = QZ.ZHI;
    for (var k = 1; k < charts.length; k++) {
      if (mins[k] !== mins[k - 1] + 1) continue;
      var A = charts[k - 1], B = charts[k], m = mins[k];
      if (A.ming.zhi !== B.ming.zhi) chg.push({ m: m, t: '命宫 ' + Z[A.ming.zhi] + '→' + Z[B.ming.zhi] + '，命主' + QZ.STAR[A.mingZhu].n + '→' + QZ.STAR[B.mingZhu].n });
      if (A.ming.xiu !== B.ming.xiu) chg.push({ m: m, t: '命度 ' + QZ.XIU[A.ming.xiu].n + '宿→' + QZ.XIU[B.ming.xiu].n + '宿' + (A.duZhu !== B.duZhu ? '，度主' + QZ.STAR[A.duZhu].n + '→' + QZ.STAR[B.duZhu].n : '') });
      if (A.shen.zhi !== B.shen.zhi) chg.push({ m: m, t: '身宫 ' + Z[A.shen.zhi] + '→' + Z[B.shen.zhi] });
      if (A.mcPt.zhi !== B.mcPt.zhi) chg.push({ m: m, t: '天顶 ' + Z[A.mcPt.zhi] + '→' + Z[B.mcPt.zhi] });
    }
    return { segs: segs, changes: chg };
  }
  // 事件那天（正午）十一曜所在之宫，对每段盘看：入命宫的、入此类事之宫的；另求行星合命度的出生分
  function qzEvent(QZ, charts, mins, segs, base, ev) {
    var t = evUtc(ev, base.tz), E = QZ.chartAt(t, { lat: base.lat, lon: base.lon, luoji: base.luoji }), kh = QZ_KIND[ev.k];
    var rows = segs.map(function (s) {
      var C = charts[s.i0], kz = kh ? C.houses.filter(function (h) { return h.n === kh; })[0].zhi : null;
      var at = function (z) { return E.stars.filter(function (x) { return x.zhi === z; }).map(function (x) { return x.id; }); };
      return { seg: s, ming: C.ming.zhi, mingStars: at(C.ming.zhi), kind: kh, kindZhi: kz, kindStars: kz == null ? [] : at(kz) };
    });
    var hits = [];
    E.stars.forEach(function (x) {
      if (x.id === 'yue') return;
      var cls = QZ_SPEED[x.id] || 's';
      zeros(mins, charts.map(function (C) { return wrap180(x.lon - C.asc); })).forEach(function (z) {
        hits.push({ m: z.m, t: '行' + x.n + '合命度', cls: cls, unc: z.rate ? Math.abs(x.speed || 0) * 0.5 / Math.abs(z.rate) : null, w: XP_W[cls] });
      });
    });
    return { E: E, rows: rows, hits: hits.sort(function (a, b) { return a.m - b.m; }) };
  }

  /* ---------- 紫微 ---------- */
  var ZW_KIND = { qing: ['夫妻'], gong: ['官禄'], xue: ['官禄', '父母'], qian: ['迁移'], cai: ['财帛'], bing: ['疾厄'], qin: ['父母', '兄弟'], qi: [] };
  var ZW_TAO = ['贪狼', '廉贞', '天姚', '咸池', '红鸾', '天喜'];
  var zwName = function (n) { return n === '仆役' ? '交友' : n; };
  // 真太阳时下，出生那天钟表几点几分换时辰：[{ m, t }]，t 为 ZW.TIMES 下标
  function zwShiChanges(ZW, y, mo, d, lon, tz, sun) {
    var out = [], prev = null;
    for (var m = 0; m < 1440; m++) {
      var dt = new Date(y, mo - 1, d, 0, m), clock = sun ? ZW.solarClock(dt, lon, tz).date : dt, t = ZW.timeIndexOf(clock.getHours());
      if (t !== prev) { out.push({ m: m, t: t }); prev = t; }
    }
    return out;
  }
  // 候选钟点里有哪些时辰（真太阳时下按换点算），返回 [{ t, mins }]（mins 为落在此时辰的候选分钟数）
  function zwCandShi(ZW, ranges, y, mo, d, lon, tz, sun) {
    var ch = zwShiChanges(ZW, y, mo, d, lon, tz, sun), cnt = {};
    minsOf(ranges).forEach(function (m) { var k = 0; for (var i = 0; i < ch.length; i++) if (ch[i].m <= m) k = i; cnt[ch[k].t] = (cnt[ch[k].t] || 0) + 1; });
    return Object.keys(cnt).map(Number).sort(function (a, b) { return a - b; }).map(function (t) { return { t: t, mins: cnt[t] }; });
  }
  // 一件事在一张盘上：大限、流年、流月、流日的命宫与此类事之宫落本命哪宫；鸾喜、四化落哪宫；落到要紧宫的标 hit
  function zwEvent(ZW, c, ev) {
    var h = c.astro.horoscope(ev.d, 6), want = ZW_KIND[ev.k] || [];
    var nat = function (br) { return c.palaces[br].name; };
    var layers = [['decadal', '大限', '运'], ['yearly', '流年', '流'], ['monthly', '流月', '月'], ['daily', '流日', '日']];
    return layers.map(function (L) {
      var s = h[L[0]]; if (!s || s.index == null) return null;
      var names = new Array(12); s.palaceNames.forEach(function (n, i) { names[(i + 2) % 12] = zwName(n); });
      var mingBr = (s.index + 2) % 12, keyBr = [mingBr];
      want.forEach(function (n) { var b = names.indexOf(n); if (b >= 0) keyBr.push(b); });
      var keyNat = []; for (var b = 0; b < 12; b++) if (want.indexOf(nat(b)) >= 0) keyNat.push(b);
      var isKey = function (br) { return keyBr.indexOf(br) >= 0 || keyNat.indexOf(br) >= 0; };
      var luan = [];
      (s.stars || []).forEach(function (arr, i) { arr.forEach(function (x) { if (/鸾|喜/.test(x.name)) luan.push({ name: x.name, br: (i + 2) % 12 }); }); });
      var hua = (s.mutagen || []).map(function (star, k) { return { h: ZW.HUA[k], star: star, br: ZW.starBranch(c, star) }; });
      var tao = ev.k === 'qing' ? c.palaces[mingBr].major.concat(c.palaces[mingBr].minor, c.palaces[mingBr].adj || []).map(function (x) { return x.name || x; }).filter(function (n) { return ZW_TAO.indexOf(n) >= 0; }) : [];
      var score = luan.filter(function (x) { return isKey(x.br); }).length + hua.filter(function (x) { return x.br >= 0 && isKey(x.br) && (x.h === '禄' || x.h === '忌'); }).length + (tao.length ? 1 : 0);
      return {
        key: L[0], label: L[1], gz: s.heavenlyStem + s.earthlyBranch, mingBr: mingBr, mingNat: nat(mingBr),
        kind: want.map(function (n) { var b = names.indexOf(n); return { n: n, br: b, nat: b >= 0 ? nat(b) : '' }; }),
        luan: luan.map(function (x) { return { name: x.name, br: x.br, nat: nat(x.br), hit: isKey(x.br) }; }),
        hua: hua.map(function (x) { return { h: x.h, star: x.star, br: x.br, nat: x.br >= 0 ? nat(x.br) : '', hit: x.br >= 0 && isKey(x.br) }; }),
        tao: tao, score: score
      };
    }).filter(Boolean);
  }

  var api = {
    astroCharts: astroCharts, astroScan: astroScan, astroHits: astroHits, astroLords: astroLords, XP_N: XP_N, XP_SIGNS: XP_SIGNS,
    qzCharts: qzCharts, qzScan: qzScan, qzEvent: qzEvent, QZ_KIND: QZ_KIND,
    zwShiChanges: zwShiChanges, zwCandShi: zwCandShi, zwEvent: zwEvent, ZW_KIND: ZW_KIND,
    KINDS: KINDS, KIND_N: KIND_N, fmt: fmt, parse: parse, segments: segments, zeros: zeros, wrap180: wrap180,
    keyOf: keyOf, list: list, save: save, mountEvents: mountEvents, mountCand: mountCand, norm: norm, minsOf: minsOf, SHI: SHI, candGet: candGet, barHTML: barHTML, histHTML: histHTML, esc: esc
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.QJ_JS = api;
})(typeof window !== 'undefined' ? window : this);
