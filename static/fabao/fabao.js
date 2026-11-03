// =========================================================
// 法宝库 · 共用外框
// 顶栏与法宝切换只在这里写一次；各件法宝都在 <body data-tool="…">
// 里引入本文件，就会得到同一套导航、提示条与干支小工具。
// =========================================================

(function () {
  'use strict';

  const ICONS = {
    meihua: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 5h14M5 9.5h5.5M13.5 9.5H19M5 14h14M5 18.5h5.5M13.5 18.5H19"/></svg>',
    changsheng: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/></svg>',
    qimen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17"/></svg>',
    ziwu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M6.3 13.2c1.9-2.6 3.8-2.6 5.7 0s3.8 2.6 5.7 0"/><circle cx="12" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>',
    yunqi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M8.5 8.2c1.2-1.3 2.4-1.3 3.5 0s2.3 1.3 3.5 0M8.5 15.8c1.2 1.3 2.4 1.3 3.5 0s2.3-1.3 3.5 0"/></svg>',
    ziwei: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><rect x="8.2" y="8.2" width="7.6" height="7.6"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>',
    mingbu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 6.5l1.4 4.1 4.1 1.4-4.1 1.4-1.4 4.1-1.4-4.1-4.1-1.4 4.1-1.4z"/></svg>',
    bazi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="3.5" height="15" rx="1"/><rect x="8" y="4.5" width="3.5" height="15" rx="1"/><rect x="12.5" y="4.5" width="3.5" height="15" rx="1"/><rect x="17" y="4.5" width="3.5" height="15" rx="1"/><path d="M3.5 12h17"/></svg>',
    liuyao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><rect x="9.6" y="9.6" width="4.8" height="4.8"/><path d="M12 3.5v2.3M12 18.2v2.3M3.5 12h2.3M18.2 12h2.3"/></svg>',
    kanyu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.8 19.5l6-10 3.6 5.6 2.6-3.6 6.2 8z"/><path d="M8.8 9.5l1.3 2.1"/><circle cx="17.5" cy="6" r="1.6"/></svg>',
    xingpan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.3"/><ellipse cx="12" cy="12" rx="9.6" ry="3.5" transform="rotate(-22 12 12)"/></svg>',
    xiangbu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.8 12c2.4-4 5.5-6 9.2-6s6.8 2 9.2 6c-2.4 4-5.5 6-9.2 6s-6.8-2-9.2-6z"/><circle cx="12" cy="12" r="2.6"/></svg>'
  };
  // men = 归哪一门（五术门庭 data/wushu.toml）；desc = 法宝库大堂（/tools/）上那一行，短到一眼看完即可
  const TOOLS = [
    { id: 'meihua', name: '梅花', href: '/meihua/', men: '卜', desc: '此刻起卦，本互变并排' },
    { id: 'liuyao', name: '六爻纳甲', short: '六爻', href: '/liuyao/', men: '卜', desc: '摇卦装卦，旺衰逐爻标' },
    { id: 'changsheng', name: '十二长生', short: '长生', href: '/changsheng/', men: '命', desc: '干支旺衰速查' },
    { id: 'qimen', name: '奇门手记', short: '奇门', href: '/qimen/', men: '卜', desc: '起局记断，回头复盘' },
    { id: 'ziwu', name: '子午流注', short: '流注', href: '/ziwu/', men: '医', desc: '按时开穴，四法并排' },
    { id: 'yunqi', name: '五运六气', short: '运气', href: '/yunqi/', men: '医', desc: '岁运、司天在泉、六步' },
    { id: 'mingbu', name: '命部', href: '/bazi/', men: '命', desc: '八字 · 紫微 · 占星同参' },     // 星命同参：八字、紫微、占星、读盘四件都在命部里切换
    { id: 'kanyu', name: '堪舆', href: '/kanyu/', men: '山', desc: '玄空飞星、八宅、罗盘' },
    { id: 'xiangbu', name: '相部', href: '/xiangbu/', men: '相', lock: true, desc: '相法读书卡与字相九宫' }  // 口令加密页，未解禁时为锁屏
  ];

  // 命部 · 星命同参：顶栏只留「命部」一个标签，进来后在这一排里切换。
  // 八字、紫微、占星公开；读盘是口令加密页（/mingbu/），未解禁时为锁屏。
  const MINGBU = [
    { id: 'bazi', name: '八字', href: '/bazi/' },
    { id: 'ziwei', name: '紫微', href: '/ziwei/' },
    { id: 'xingpan', name: '占星', href: '/xingpan/' },
    { id: 'mingbu', name: '读盘', href: '/mingbu/', lock: true }
  ];
  const LS_LAST = 'mingbu.last', LS_BIRTH = 'mingbu.birth.v1', LS_KU_LAST = 'fabao.last';
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* 无痕模式 */ } };

  // —— 共享生辰：命部三件谁起了盘就记下来，换一件时带过去，同一个人三种看法 ——
  // { when: 出生地钟表时间 'YYYY-MM-DDTHH:MM', male, name, tz, lon, lat, sun（真太阳时）, dst（夏令时）, city }
  function loadBirth() { try { return JSON.parse(lsGet(LS_BIRTH)) || null; } catch (e) { return null; } }
  function saveBirth(b) {
    const old = loadBirth() || {}, nb = Object.assign({}, old);
    Object.keys(b).forEach(k => { if (b[k] !== undefined && b[k] !== null && b[k] !== '') nb[k] = b[k]; });
    if (b.name === '') delete nb.name;
    // 换了地方又没给纬度（八字自定义经度、紫微），旧纬度作废
    if (b.lon != null && old.lon != null && Math.abs(b.lon - old.lon) > 0.005 && b.lat == null) delete nb.lat;
    lsSet(LS_BIRTH, JSON.stringify(nb));
    refreshMingbuLinks();
  }
  const pad2 = n => String(n).padStart(2, '0');
  function minusHour(when) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(when || '');
    if (!m) return when;
    const t = new Date(Date.UTC(+m[1], m[2] - 1, +m[3], +m[4] - 1, +m[5]));
    return `${t.getUTCFullYear()}-${pad2(t.getUTCMonth() + 1)}-${pad2(t.getUTCDate())}T${pad2(t.getUTCHours())}:${pad2(t.getUTCMinutes())}`;
  }
  // 把共享生辰写成某件法宝认得的网址参数
  function birthQuery(id, b) {
    if (!b || !b.when || id === 'mingbu') return '';
    const q = new URLSearchParams();
    if (id === 'bazi') {
      q.set('d', b.when); q.set('g', b.male === false ? '0' : '1');
      if (b.tz != null) q.set('tz', b.tz);
      if (b.sun && b.lon != null) q.set('lon', b.lon);
      if (b.dst) q.set('dst', '1');
    } else if (id === 'ziwei') {
      q.set('d', b.dst ? minusHour(b.when) : b.when);       // 紫微不认夏令时，先扣回标准时
      q.set('g', b.male === false ? '女' : '男');
      if (b.sun && b.lon != null) { q.set('lon', b.lon); q.set('tz', b.tz != null ? b.tz : 8); }
    } else if (id === 'xingpan') {
      q.set('d', b.when);
      if (b.lat != null) q.set('lat', b.lat);
      if (b.lon != null) q.set('lon', b.lon);
      if (b.tz != null) q.set('tz', b.tz);
      if (b.dst) q.set('dst', '1');
    }
    if (b.name) q.set('n', b.name);
    return '?' + q.toString();
  }
  function mingbuHref(id) { const t = MINGBU.find(x => x.id === id) || MINGBU[0]; return t.href + birthQuery(t.id, loadBirth()); }
  function refreshMingbuLinks() {
    document.querySelectorAll('[data-mingbu]').forEach(a => { a.href = mingbuHref(a.dataset.mingbu); });
    const tab = document.querySelector('.fb-tab[data-tab="mingbu"]');
    if (tab) tab.href = mingbuHref(lsGet(LS_LAST) || 'bazi');
  }

  function mountShell() {
    const cur = document.body.dataset.tool;
    const fam = MINGBU.find(t => t.id === cur);
    const curTab = fam ? 'mingbu' : cur;
    const isKu = cur === 'ku';   // 法宝库大堂 /tools/：顶栏照旧，正文由 mountKu 现排
    // 记下上回用的是哪一件，大堂上给「接着用」；锁屏页不算
    if (!isKu && TOOLS.some(t => t.id === curTab) && !document.querySelector('.lock-wrap')) lsSet(LS_KU_LAST, curTab);
    // 记下上次用的是哪件；读盘只在真解开了才记（锁屏页上有 .lock-wrap），免得访客每次点「命部」都落到锁屏
    if (fam && !(fam.lock && document.querySelector('.lock-wrap'))) lsSet(LS_LAST, fam.id);
    const top = document.createElement('header');
    top.className = 'fb-top';
    top.innerHTML = `
      <a class="fb-back" href="${isKu ? '/' : '/tools/'}" title="${isKu ? '回潜蛟阁' : '回法宝库'}">
        <span class="mark">ohwowbill</span><span class="ge">潜蛟阁</span><span class="ku">法宝库</span>
      </a>
      <nav class="fb-tabs" aria-label="法宝">
        ${TOOLS.map(t => `
          <a class="fb-tab${t.id === curTab ? ' on' : ''}" href="${t.href}" data-tab="${t.id}"${t.id === curTab ? ' aria-current="page"' : ''}>
            ${ICONS[t.id]}<span class="full">${t.name}</span>
          </a>`).join('')}
      </nav>`;
    document.body.insertBefore(top, document.body.firstChild);
    // 命部四件：顶栏下加一排「星命同参」切换
    if (fam) {
      const bar = document.createElement('nav');
      bar.className = 'fb-mingbu';
      bar.setAttribute('aria-label', '命部 · 星命同参');
      bar.innerHTML = `
        <span class="lab">命部<small>星命同参</small></span>
        <span class="seg">${MINGBU.map(t => `
          <a data-mingbu="${t.id}" href="${t.href}" class="${t.id === cur ? 'on' : ''}"${t.id === cur ? ' aria-current="page"' : ''}>
            ${ICONS[t.id] || ''}<span>${t.name}</span>${t.lock ? '<i title="此宝被阁主下了禁制">禁</i>' : ''}
          </a>`).join('')}</span>
        <span class="hint">同一生辰，三种看法；换一件，人跟着走</span>`;
      top.after(bar);
    }
    refreshMingbuLinks();
    // 法宝一多，顶栏（与手机底栏）都用两字简称；当前这件滚进视野
    if (window.matchMedia('(max-width: 1500px)').matches) {
      top.querySelectorAll('.fb-tab .full').forEach((el, i) => { if (TOOLS[i].short) el.textContent = TOOLS[i].short; });
    }
    const on = top.querySelector('.fb-tab.on');
    if (on) requestAnimationFrame(() => {
      const nav = on.parentElement;
      nav.scrollLeft = on.offsetLeft - (nav.clientWidth - on.offsetWidth) / 2;
    });
  }

  let toastEl = null, toastTimer = 0;
  function toast(msg, ms) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'fb-toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms || 1800);
  }

  // —— 干支 ——
  const GAN = '甲乙丙丁戊己庚辛壬癸';
  const ZHI = '子丑寅卯辰巳午未申酉戌亥';
  function jdn(y, m, d) {
    const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  // 日柱、时柱（23 点起算次日子时）。1900-01-01 为甲戌日。
  function dayHour(date) {
    const h = date.getHours();
    let J = jdn(date.getFullYear(), date.getMonth() + 1, date.getDate());
    if (h >= 23) J += 1;
    const dayIdx = ((J - 2415021 + 10) % 60 + 60) % 60;
    const hz = Math.floor(((h + 1) % 24) / 2);
    const hg = ((dayIdx % 10) % 5 * 2 + hz) % 10;
    return {
      day: { gan: dayIdx % 10, zhi: dayIdx % 12, name: GAN[dayIdx % 10] + ZHI[dayIdx % 12] },
      hour: { gan: hg, zhi: hz, name: GAN[hg] + ZHI[hz] }
    };
  }

  const pad = n => String(n).padStart(2, '0');
  const toLocalInput = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

  // 网址带 ?t=2024-09-11T12:00 时，开页就排那一刻（文章的发文日卦印从这里链进来）
  function linkedTime() {
    try {
      const t = new URLSearchParams(location.search).get('t');
      const d = t ? new Date(t) : null;
      return d && !isNaN(d) ? d : null;
    } catch (e) { return null; }
  }

  // 「此刻」时间控件：datetime 输入 + 「此刻」按钮，改动时回调 onChange(date, isNow)
  function bindWhen(input, nowBtn, onChange) {
    const now = () => { const d = new Date(); d.setSeconds(0, 0); return d; };
    const first = linkedTime() || now();
    input.value = toLocalInput(first);
    input.addEventListener('change', () => {
      const d = new Date(input.value);
      if (!isNaN(d)) onChange(d, false);
    });
    nowBtn.addEventListener('click', () => {
      const d = now();
      input.value = toLocalInput(d);
      onChange(d, true);
    });
    return first;
  }

  function copy(text, okMsg) {
    const done = () => toast(okMsg || '已复制');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, () => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('复制失败，请手动选取'); }
      ta.remove();
    }
  }

  // —— 法宝库大堂（/tools/，body data-tool="ku"）——
  // 不再逐件写说明：按五门排成一屏小牌，一件一行字，点了就进；上回用过的放最前「接着用」。
  const MEN = [['山', '堪舆'], ['医', '方脉针灸'], ['命', '推命'], ['卜', '占断'], ['相', '观形']];
  function mountKu() {
    const box = document.getElementById('fbKu');
    if (!box) return;
    const href = t => t.id === 'mingbu' ? mingbuHref(lsGet(LS_LAST) || 'bazi') : t.href;
    const tile = t => `
      <a class="ku-tile${t.lock ? ' is-lock' : ''}" href="${href(t)}">
        <span class="ku-ico">${ICONS[t.id]}</span>
        <span class="ku-t">${t.name}${t.lock ? '<i title="此宝被阁主下了禁制，持诀者可开">禁</i>' : ''}</span>
        <span class="ku-s">${t.desc || ''}</span>
      </a>`;
    const last = TOOLS.find(t => t.id === lsGet(LS_KU_LAST));
    const dh = dayHour(new Date());
    box.innerHTML = `
      <p class="ku-now"><span>此刻</span><b>${dh.day.name}</b>日<b>${dh.hour.name}</b>时${last ? `
        <a class="ku-again" href="${href(last)}">接着用 · ${last.name} →</a>` : ''}</p>
      <div class="ku-men">${MEN.map(([seal, name]) => {
        const ts = TOOLS.filter(t => t.men === seal);
        return ts.length ? `
        <section class="ku-row" aria-label="${seal}门 · ${name}">
          <a class="ku-seal" href="/wushu/#men-${encodeURIComponent(seal)}" title="${seal}门 · ${name}：此门文章">${seal}</a>
          <div class="ku-tiles">${ts.map(tile).join('')}</div>
        </section>` : '';
      }).join('')}</div>`;
  }

  window.Fabao = { GAN, ZHI, dayHour, toLocalInput, fmt, bindWhen, linkedTime, toast, copy, birth: { save: saveBirth, load: loadBirth, query: birthQuery, minusHour } };
  mountShell();
  if (document.body.dataset.tool === 'ku') mountKu();
})();
