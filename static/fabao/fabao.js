// =========================================================
// 法宝库 · 共用外框
// 顶栏与法宝切换只在这里写一次；各件法宝都在 <body data-tool="…">
// 里引入本文件，就会得到同一套导航、提示条与干支小工具。
// 几件同类的法宝合成「一家」（命部、堪舆、通书）：顶栏只留一个标签，进来后在家族条里切换。
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
    xiangbu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.8 12c2.4-4 5.5-6 9.2-6s6.8 2 9.2 6c-2.4 4-5.5 6-9.2 6s-6.8-2-9.2-6z"/><circle cx="12" cy="12" r="2.6"/></svg>',
    tongshu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8.5 3.5v3M15.5 3.5v3"/><circle cx="12" cy="14.6" r="1.7" fill="currentColor" stroke="none"/></svg>',
    huangli: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8.5 3.5v3M15.5 3.5v3M8 13h2M14 13h2M8 16.5h2M14 16.5h2"/></svg>',
    zeri: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8.5 3.5v3M15.5 3.5v3M9 14.6l2.1 2 3.9-4"/></svg>',
    liunian: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.5 1.5M16.5 16.5L18 18M6 18l1.5-1.5M16.5 7.5L18 6"/></svg>',
    jiuxing: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="6" cy="6" r="1.5"/><circle cx="12" cy="6" r="1.5"/><circle cx="18" cy="6" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="2.6"/><circle cx="18" cy="12" r="1.5"/><circle cx="6" cy="18" r="1.5"/><circle cx="12" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/></svg>',
    hepan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="5.6"/><circle cx="15" cy="12" r="5.6"/></svg>'
  };
  const TOOLS = [
    { id: 'tongshu', name: '通书', href: '/huangli/' },  // 黄历、择日、流年三件在通书里切换
    { id: 'meihua', name: '梅花', href: '/meihua/' },
    { id: 'liuyao', name: '六爻纳甲', short: '六爻', href: '/liuyao/' },
    { id: 'qimen', name: '奇门手记', short: '奇门', href: '/qimen/' },
    { id: 'mingbu', name: '命部', href: '/bazi/' },     // 星命同参：八字、紫微、占星、合盘、读盘都在命部里切换
    { id: 'kanyu', name: '堪舆', href: '/kanyu/' },     // 玄空八宅、九星气学
    { id: 'changsheng', name: '十二长生', short: '长生', href: '/changsheng/' },
    { id: 'ziwu', name: '子午流注', short: '流注', href: '/ziwu/' },
    { id: 'yunqi', name: '五运六气', short: '运气', href: '/yunqi/' },
    { id: 'xiangbu', name: '相部', href: '/xiangbu/' }  // 口令加密页，未解禁时为锁屏
  ];

  // —— 一家：顶栏一个标签，进来后在家族条里切换 ——
  // 命部：八字、紫微、占星、合盘公开；读盘是口令加密页（/mingbu/），未解禁时为锁屏。
  const FAMILIES = {
    mingbu: {
      name: '命部', sub: '星命同参', hint: '同一生辰，几种看法；换一件，人跟着走', people: true, lsLast: 'mingbu.last',
      items: [
        { id: 'bazi', name: '八字', href: '/bazi/' },
        { id: 'ziwei', name: '紫微', href: '/ziwei/' },
        { id: 'xingpan', name: '占星', href: '/xingpan/' },
        { id: 'hepan', name: '合盘', href: '/hepan/' },
        { id: 'mingbu', name: '读盘', href: '/mingbu/', lock: true }
      ]
    },
    kanyu: {
      name: '堪舆', sub: '方位', hint: '玄空看宅，九星看人走的方位', lsLast: 'kanyu.last',
      items: [
        { id: 'kanyu', name: '玄空八宅', short: '玄空', href: '/kanyu/' },
        { id: 'jiuxing', name: '九星气学', short: '九星', href: '/jiuxing/' }
      ]
    },
    tongshu: {
      name: '通书', sub: '选择', hint: '黄历看日子，择日排时辰，流年看一年', lsLast: 'tongshu.last',
      items: [
        { id: 'huangli', name: '黄历', href: '/huangli/' },
        { id: 'zeri', name: '择日', href: '/zeri/' },
        { id: 'liunian', name: '流年', href: '/liunian/' }
      ]
    }
  };
  const MINGBU = FAMILIES.mingbu.items;
  const LS_BIRTH = 'mingbu.birth.v1', LS_PEOPLE = 'mingbu.people.v1';
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* 无痕模式 */ } };
  const famOf = id => { for (const k in FAMILIES) { const it = FAMILIES[k].items.find(t => t.id === id); if (it) return { key: k, fam: FAMILIES[k], item: it }; } return null; };

  // —— 共享生辰：命部几件谁起了盘就记下来，换一件时带过去，同一个人几种看法 ——
  // { when: 出生地钟表时间 'YYYY-MM-DDTHH:MM', male, name, tz, lon, lat, sun（真太阳时）, dst（夏令时）, city }
  function loadBirth() { try { return JSON.parse(lsGet(LS_BIRTH)) || null; } catch (e) { return null; } }
  function saveBirth(b) {
    const old = loadBirth() || {}, nb = Object.assign({}, old);
    Object.keys(b).forEach(k => { if (b[k] !== undefined && b[k] !== null && b[k] !== '') nb[k] = b[k]; });
    if (b.name === '') delete nb.name;
    // 换了地方又没给纬度（八字自定义经度、紫微），旧纬度作废
    if (b.lon != null && old.lon != null && Math.abs(b.lon - old.lon) > 0.005 && b.lat == null) delete nb.lat;
    lsSet(LS_BIRTH, JSON.stringify(nb));
    // 正在看的是存过的某人：同一生辰就顺手更新他的记录（改了城市、名字之类）
    const list = loadPeople(), i = list.findIndex(p => personKey(p) === personKey(nb));
    if (i >= 0) { list[i] = Object.assign({ id: list[i].id, name: list[i].name }, nb, { name: nb.name || list[i].name }); savePeople(list); }
    refreshMingbuLinks();
    renderPeople();
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
    if (!b || !b.when || id === 'mingbu' || id === 'hepan') return '';
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
    } else return '';
    if (b.name) q.set('n', b.name);
    return '?' + q.toString();
  }
  function famHref(famKey, id) {
    const F = FAMILIES[famKey], t = F.items.find(x => x.id === id) || F.items[0];
    return t.href + (famKey === 'mingbu' ? birthQuery(t.id, loadBirth()) : '');
  }
  function mingbuHref(id) { return famHref('mingbu', id); }
  function refreshMingbuLinks() {
    document.querySelectorAll('[data-fam-item]').forEach(a => { a.href = famHref(a.dataset.fam, a.dataset.famItem); });
    Object.keys(FAMILIES).forEach(k => {
      const tab = document.querySelector('.fb-tab[data-tab="' + k + '"]');
      if (tab) tab.href = famHref(k, lsGet(FAMILIES[k].lsLast) || FAMILIES[k].items[0].id);
    });
  }

  // —— 多人命盘：本机存几个人，命部条上一点就换人 ——
  // [{ id, name, when, male, tz, lon, lat, sun, dst, city }]
  function loadPeople() { try { return JSON.parse(lsGet(LS_PEOPLE)) || []; } catch (e) { return []; } }
  function savePeople(list) { lsSet(LS_PEOPLE, JSON.stringify(list)); }
  function personKey(b) { return b && b.when ? b.when + '|' + (b.male === false ? 0 : 1) : ''; }
  function currentPerson() { const k = personKey(loadBirth()); return k ? loadPeople().find(p => personKey(p) === k) || null : null; }
  function addPerson(name, b) {
    b = b || loadBirth();
    if (!b || !b.when) return null;
    const list = loadPeople(), k = personKey(b), i = list.findIndex(p => personKey(p) === k);
    const rec = Object.assign({}, b, { id: i >= 0 ? list[i].id : Date.now().toString(36), name: name || b.name || '未名' });
    if (i >= 0) list[i] = rec; else list.push(rec);
    savePeople(list);
    return rec;
  }
  function removePerson(id) { savePeople(loadPeople().filter(p => p.id !== id)); }
  // 换成某人：整份替换共享生辰（不与上一个人的经纬度混在一起）
  function usePerson(id) {
    const p = loadPeople().find(x => x.id === id);
    if (!p) return null;
    const b = Object.assign({}, p); delete b.id;
    lsSet(LS_BIRTH, JSON.stringify(b));
    return b;
  }
  // 生辰里的年份、属相（立春前出生算上一年，按 2 月 4 日粗分；要准的另调八字）
  function birthYearOf(b) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec((b && b.when) || '');
    if (!m) return null;
    const y = +m[1], early = +m[2] < 2 || (+m[2] === 2 && +m[3] < 4);
    return { y: y, gzYear: early ? y - 1 : y, sx: ((early ? y - 1 : y) - 4) % 12 };
  }

  let famBar = null, curTool = null;
  function renderPeople() {
    if (!famBar) return;
    const box = famBar.querySelector('.ppl');
    if (!box) return;
    const list = loadPeople(), cur = currentPerson(), b = loadBirth();
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    box.innerHTML = list.map(p => `<span class="pc${cur && cur.id === p.id ? ' on' : ''}"><button type="button" data-pid="${p.id}" title="换成${esc(p.name)}的命盘">${esc(p.name)}</button>${cur && cur.id === p.id ? `<button type="button" class="x" data-del="${p.id}" title="删掉这个人" aria-label="删掉${esc(p.name)}">×</button>` : ''}</span>`).join('') +
      (b && b.when && !cur ? `<button type="button" class="add" title="把当前这一盘存成一个人，下次一点就换">＋ 存为…</button>` : list.length ? '' : `<span class="none">起一盘后可存，下次一点就换人</span>`);
    box.querySelectorAll('[data-pid]').forEach(btn => btn.onclick = () => {
      const nb = usePerson(btn.dataset.pid);
      const t = famOf(curTool);
      if (nb && t && t.key === 'mingbu' && !t.item.lock) location.href = t.item.href + birthQuery(t.item.id, nb);
      else { refreshMingbuLinks(); renderPeople(); document.dispatchEvent(new CustomEvent('fabao:person')); }
    });
    box.querySelectorAll('[data-del]').forEach(btn => btn.onclick = () => {
      const p = loadPeople().find(x => x.id === btn.dataset.del);
      if (p && confirm(`把「${p.name}」从本机删掉？（只删存档，不影响当前这一盘）`)) { removePerson(p.id); renderPeople(); }
    });
    const add = box.querySelector('.add');
    if (add) add.onclick = () => {
      add.outerHTML = `<span class="ask"><input type="text" maxlength="12" placeholder="叫什么" value="${esc((b && b.name) || (list.length ? '' : '本人'))}" aria-label="名字"><button type="button">存</button></span>`;
      const inp = box.querySelector('.ask input'), go = () => { if (addPerson(inp.value.trim() || '未名')) { toast('已存，下次在这里一点就换'); renderPeople(); } };
      inp.focus(); inp.select();
      inp.onkeydown = e => { if (e.key === 'Enter') go(); if (e.key === 'Escape') renderPeople(); };
      box.querySelector('.ask button').onclick = go;
    };
  }

  function mountShell() {
    const cur = curTool = document.body.dataset.tool;
    const F = famOf(cur);
    const curTab = F ? F.key : cur;
    // 记下这一家上次用的是哪件；锁屏页（.lock-wrap）不记，免得访客每次点进来都落到锁屏
    if (F && !(F.item.lock && document.querySelector('.lock-wrap'))) lsSet(F.fam.lsLast, F.item.id);
    const top = document.createElement('header');
    top.className = 'fb-top';
    top.innerHTML = `
      <a class="fb-back" href="/tools/" title="回法宝库">
        <span class="mark">ohwowbill</span><span class="ge">潜蛟阁</span><span class="ku">法宝库</span>
      </a>
      <nav class="fb-tabs" aria-label="法宝">
        ${TOOLS.map(t => `
          <a class="fb-tab${t.id === curTab ? ' on' : ''}" href="${t.href}" data-tab="${t.id}"${t.id === curTab ? ' aria-current="page"' : ''}>
            ${ICONS[t.id]}<span class="full">${t.name}</span>
          </a>`).join('')}
      </nav>`;
    document.body.insertBefore(top, document.body.firstChild);
    // 一家的几件：顶栏下加一排切换（命部还带一排「人」）
    if (F) {
      const bar = famBar = document.createElement('nav');
      bar.className = 'fb-mingbu fb-fam fam-' + F.key;
      bar.setAttribute('aria-label', F.fam.name + ' · ' + F.fam.sub);
      bar.innerHTML = `
        <span class="lab">${F.fam.name}<small>${F.fam.sub}</small></span>
        <span class="seg">${F.fam.items.map(t => `
          <a data-fam="${F.key}" data-fam-item="${t.id}" href="${t.href}" class="${t.id === cur ? 'on' : ''}"${t.id === cur ? ' aria-current="page"' : ''}>
            ${ICONS[t.id] || ''}<span>${t.name}</span>${t.lock ? '<i title="此宝被阁主下了禁制">禁</i>' : ''}
          </a>`).join('')}</span>
        ${F.fam.people ? '<span class="ppl" aria-label="存过的人"></span>' : `<span class="hint">${F.fam.hint}</span>`}`;
      top.after(bar);
      renderPeople();
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

  // —— 问 AI：把盘面连同本站口径包成一段提示词，复制后贴给任意 AI ——
  function askAI(kind, body, rules) {
    const text = `你是熟悉${kind}的老师。下面是我用「潜蛟阁 · 法宝库」（ohwowbill.com）排出的盘${rules ? '，后面附了排盘口径' : ''}。
请这样回答：
1. 先用两三句话说整体；
2. 再分条讲要点，每条说清依据（盘上的哪一项）；
3. 最后说可以怎么做。
盘里没有的信息别编；拿不准就直说。

${body}${rules ? '\n\n【口径】\n' + rules : ''}`;
    copy(text, '已复制，贴给任意 AI 即可');
  }

  window.Fabao = {
    GAN, ZHI, dayHour, toLocalInput, fmt, bindWhen, linkedTime, toast, copy, askAI, FAMILIES,
    birth: { save: saveBirth, load: loadBirth, query: birthQuery, minusHour, yearOf: birthYearOf },
    people: { list: loadPeople, add: addPerson, remove: removePerson, use: usePerson, current: currentPerson, key: personKey }
  };
  mountShell();
})();
