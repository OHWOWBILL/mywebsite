// =========================================================
// 法宝库 · 共用外框
// 顶栏与法宝切换只在这里写一次；各件法宝都在 <body data-tool="…">
// 里引入本文件，就会得到同一套导航、提示条与干支小工具。
// 几件同类的法宝合成「一家」（通书、三式、命部、堪舆、医部）：顶栏只留一个标签，进来后在家族条里切换。
// 另有几样各件共用的：手机底栏（常用几件＋全部）、术语小词典、印章落笔、摇一摇、
// 分享图（/fabao/share.js）、本机存档备份与扫码带走（/fabao/backup.js）、离线（/sw.js）。
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
    hepan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="5.6"/><circle cx="15" cy="12" r="5.6"/></svg>',
    // 三式：天圆地方的式盘；六壬天盘在地盘上转；太乙一星行九宫
    sanshi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><circle cx="12" cy="12" r="5.6"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>',
    liuren: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M12 6.2l5.8 5.8-5.8 5.8-5.8-5.8z"/></svg>',
    taiyi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17" stroke-opacity=".45"/><circle cx="16.2" cy="7.8" r="1.9" fill="currentColor" stroke="none"/></svg>',
    lingqian: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 10.5h11l-1.3 9.5H7.8z"/><path d="M9.5 10.5V4M12 10.5V2.8M14.5 10.5V5"/></svg>',
    yibu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8v2"/><path d="M10 5.2h4c0 1.6-.7 2.4-1 3 3.4.9 5.2 3.4 5.2 6.4 0 3.5-2.8 5.9-6.2 5.9s-6.2-2.4-6.2-5.9c0-3 1.8-5.5 5.2-6.4-.3-.6-1-1.4-1-3z"/></svg>',
    tizhi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5.6" r="2.4"/><path d="M6.8 20.5v-6a5.2 5.2 0 0 1 10.4 0v6"/><path d="M12 11.5v4"/></svg>',
    xingming: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="3.5" width="13" height="17" rx="1.5"/><path d="M9 8h6M9 12h6M9 16h3.5"/></svg>',
    all: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6.5" height="6.5" rx="1.3"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.3"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.3"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.3"/></svg>'
  };
  // men = 归哪一门（五术门庭 data/wushu.toml）；desc = 法宝库大堂（/tools/）上那一行，短到一眼看完即可
  const TOOLS = [
    { id: 'tongshu', name: '通书', href: '/huangli/', men: '卜', desc: '黄历、择日、流年' },  // 黄历、择日、流年三件在通书里切换
    { id: 'meihua', name: '梅花', href: '/meihua/', men: '卜', desc: '此刻起卦，本互变并排' },
    { id: 'liuyao', name: '六爻纳甲', short: '六爻', href: '/liuyao/', men: '卜', desc: '摇卦装卦，旺衰逐爻标' },
    { id: 'sanshi', name: '三式', href: '/qimen/', men: '卜', desc: '奇门、六壬、太乙' },         // 奇门、六壬、太乙三件在三式里切换
    { id: 'lingqian', name: '灵签', href: '/lingqian/', men: '卜', desc: '掷筊求签，签诗白话' },
    { id: 'mingbu', name: '命部', href: '/bazi/', men: '命', desc: '八字、紫微、占星、合盘、姓名' },  // 星命同参：八字、紫微、占星、合盘、姓名、读盘
    { id: 'changsheng', name: '十二长生', short: '长生', href: '/changsheng/', men: '命', desc: '干支旺衰速查' },
    { id: 'kanyu', name: '堪舆', href: '/kanyu/', men: '山', desc: '玄空飞星、八宅、九星气学' },     // 玄空八宅、九星气学
    { id: 'yibu', name: '医部', href: '/ziwu/', men: '医', desc: '子午流注、五运六气、体质辨识' },   // 流注、运气、体质
    { id: 'xiangbu', name: '相部', href: '/xiangbu/', men: '相', lock: true, desc: '相法读书卡与字相九宫' }  // 口令加密页，未解禁时为锁屏
  ];
  // 旧版记下的顶栏标签（奇门、流注、运气原先各占一格）
  const OLD_TAB = { qimen: 'sanshi', ziwu: 'yibu', yunqi: 'yibu' };

  // —— 一家：顶栏一个标签，进来后在家族条里切换 ——
  // 命部：八字、紫微、占星、合盘、姓名公开；读盘是口令加密页（/mingbu/），未解禁时为锁屏。
  const FAMILIES = {
    tongshu: {
      name: '通书', sub: '选择', hint: '黄历看日子，择日排时辰，流年看一年', lsLast: 'tongshu.last',
      items: [
        { id: 'huangli', name: '黄历', href: '/huangli/' },
        { id: 'zeri', name: '择日', href: '/zeri/' },
        { id: 'liunian', name: '流年', href: '/liunian/' }
      ]
    },
    sanshi: {
      name: '三式', sub: '式占', hint: '奇门看事看时，六壬看人看情，太乙看大势', lsLast: 'sanshi.last',
      items: [
        { id: 'qimen', name: '奇门', href: '/qimen/' },
        { id: 'liuren', name: '六壬', href: '/liuren/' },
        { id: 'taiyi', name: '太乙', href: '/taiyi/' }
      ]
    },
    mingbu: {
      name: '命部', sub: '星命同参', hint: '同一生辰，几种看法；换一件，人跟着走', people: true, lsLast: 'mingbu.last',
      items: [
        { id: 'bazi', name: '八字', href: '/bazi/' },
        { id: 'ziwei', name: '紫微', href: '/ziwei/' },
        { id: 'xingpan', name: '占星', href: '/xingpan/' },
        { id: 'hepan', name: '合盘', href: '/hepan/' },
        { id: 'xingming', name: '姓名', href: '/xingming/' },
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
    yibu: {
      name: '医部', sub: '岐黄', hint: '按时开穴，按年看气，按人看体质', lsLast: 'yibu.last',
      items: [
        { id: 'ziwu', name: '子午流注', short: '流注', href: '/ziwu/' },
        { id: 'yunqi', name: '五运六气', short: '运气', href: '/yunqi/' },
        { id: 'tizhi', name: '体质辨识', short: '体质', href: '/tizhi/' }
      ]
    }
  };
  const LS_BIRTH = 'mingbu.birth.v1', LS_PEOPLE = 'mingbu.people.v1', LS_KU_LAST = 'fabao.last', LS_USE = 'fabao.use';
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* 无痕模式 */ } };
  const famOf = id => { for (const k in FAMILIES) { const it = FAMILIES[k].items.find(t => t.id === id); if (it) return { key: k, fam: FAMILIES[k], item: it }; } return null; };
  const escH = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 用到才取的脚本（分享图、存档、二维码、词典）；同一个只取一回
  const loaded = {};
  function loadScript(src) {
    if (!loaded[src]) loaded[src] = new Promise((ok, bad) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => ok();
      s.onerror = () => { delete loaded[src]; bad(new Error('没取到 ' + src)); };
      document.head.appendChild(s);
    });
    return loaded[src];
  }

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
  // 整份替换共享生辰（不与上一个人的经纬度、城市混在一起）；合盘「对调」之类用
  function replaceBirth(b) {
    const nb = {};
    Object.keys(b || {}).forEach(k => { if (b[k] !== undefined && b[k] !== null && b[k] !== '') nb[k] = b[k]; });
    delete nb.id;
    lsSet(LS_BIRTH, JSON.stringify(nb));
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
    if (!b || !b.when || id === 'mingbu' || id === 'hepan' || id === 'xingming') return '';
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
      const href = famHref(k, lsGet(FAMILIES[k].lsLast) || FAMILIES[k].items[0].id);
      document.querySelectorAll('.fb-tab[data-tab="' + k + '"]').forEach(tab => { tab.href = href; });
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
    box.innerHTML = list.map(p => `<span class="pc${cur && cur.id === p.id ? ' on' : ''}"><button type="button" data-pid="${p.id}" title="换成${escH(p.name)}的命盘">${escH(p.name)}</button>${cur && cur.id === p.id ? `<button type="button" class="x" data-del="${p.id}" title="删掉这个人" aria-label="删掉${escH(p.name)}">×</button>` : ''}</span>`).join('') +
      (b && b.when && !cur ? `<button type="button" class="add" title="把当前这一盘存成一个人，下次一点就换">＋ 存为…</button>` : list.length ? '' : `<span class="none">起一盘后可存，下次一点就换人</span>`);
    box.querySelectorAll('[data-pid]').forEach(btn => btn.onclick = () => {
      const nb = usePerson(btn.dataset.pid);
      const t = famOf(curTool);
      if (nb && t && t.key === 'mingbu' && !t.item.lock && birthQuery(t.item.id, nb)) location.href = t.item.href + birthQuery(t.item.id, nb);
      else { refreshMingbuLinks(); renderPeople(); document.dispatchEvent(new CustomEvent('fabao:person')); }
    });
    box.querySelectorAll('[data-del]').forEach(btn => btn.onclick = () => {
      const p = loadPeople().find(x => x.id === btn.dataset.del);
      if (p && confirm(`把「${p.name}」从本机删掉？（只删存档，不影响当前这一盘）`)) { removePerson(p.id); renderPeople(); }
    });
    const add = box.querySelector('.add');
    if (add) add.onclick = () => {
      add.outerHTML = `<span class="ask"><input type="text" maxlength="12" placeholder="叫什么" value="${escH((b && b.name) || (list.length ? '' : '本人'))}" aria-label="名字"><button type="button">存</button></span>`;
      const inp = box.querySelector('.ask input'), go = () => { if (addPerson(inp.value.trim() || '未名')) { toast('已存，下次在这里一点就换'); renderPeople(); } };
      inp.focus(); inp.select();
      inp.onkeydown = e => { if (e.key === 'Enter') go(); if (e.key === 'Escape') renderPeople(); };
      box.querySelector('.ask button').onclick = go;
    };
  }

  // —— 手机底栏：顶栏的法宝一多，手机上只放常用的四件，末一格「全部」回大堂 ——
  // 常用按本机用过的次数排（fabao.use），没用过的先放通书、梅花、三式、命部；正在用的那件总在栏上。
  // 四件按顶栏次序摆，位置不跟着次数乱跳。
  const DOCK_DEF = ['tongshu', 'meihua', 'sanshi', 'mingbu'];
  function useCounts() { try { return JSON.parse(lsGet(LS_USE)) || {}; } catch (e) { return {}; } }
  function bumpUse(tab) { const u = useCounts(); u[tab] = (u[tab] || 0) + 1; lsSet(LS_USE, JSON.stringify(u)); }
  function dockIds(cur) {
    const u = useCounts();
    // 默认四件先垫 2.5 次，用过三回以上的才挤得掉它们
    const n = t => (u[t.id] || 0) + (DOCK_DEF.indexOf(t.id) >= 0 ? 2.5 - DOCK_DEF.indexOf(t.id) * 0.1 : 0);
    const top = TOOLS.filter(t => !t.lock).sort((a, b) => n(b) - n(a) || TOOLS.indexOf(a) - TOOLS.indexOf(b)).slice(0, 4).map(t => t.id);
    if (cur && TOOLS.some(t => t.id === cur) && top.indexOf(cur) < 0) top[3] = cur;
    return TOOLS.filter(t => top.indexOf(t.id) >= 0).map(t => t.id);
  }
  function mountDock(curTab, isKu) {
    const nav = document.createElement('nav');
    nav.className = 'fb-dock';
    nav.setAttribute('aria-label', '常用法宝');
    nav.innerHTML = dockIds(isKu ? null : curTab).map(id => {
      const t = TOOLS.find(x => x.id === id), on = id === curTab;
      return `<a class="fb-tab${on ? ' on' : ''}" href="${t.href}" data-tab="${id}"${on ? ' aria-current="page"' : ''}>${ICONS[id]}<span>${t.short || t.name}</span></a>`;
    }).join('') + `<a class="fb-tab all${isKu ? ' on' : ''}" href="/tools/"${isKu ? ' aria-current="page"' : ''} title="法宝库大堂：全部法宝">${ICONS.all}<span>全部</span></a>`;
    document.body.appendChild(nav);
  }

  function mountShell() {
    const cur = curTool = document.body.dataset.tool;
    const F = famOf(cur);
    const curTab = F ? F.key : cur;
    const isKu = cur === 'ku';   // 法宝库大堂 /tools/：顶栏照旧，正文由 mountKu 现排
    const locked = !!document.querySelector('.lock-wrap');
    // 记下上回用的是哪一件（一家记家名），大堂上给「接着用」；锁屏页不算
    if (!isKu && TOOLS.some(t => t.id === curTab) && !locked) { lsSet(LS_KU_LAST, curTab); bumpUse(curTab); }
    // 记下这一家上次用的是哪件；锁屏页（.lock-wrap）不记，免得访客每次点进来都落到锁屏
    if (F && !(F.item.lock && locked)) lsSet(F.fam.lsLast, F.item.id);
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
    mountDock(curTab, isKu);
    refreshMingbuLinks();
    // 法宝一多，顶栏都用两字简称；当前这件滚进视野
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
    (window.Fabao && window.Fabao.copy || copy)(text, '已复制，贴给任意 AI 即可');   // 走 Fabao.copy，测试时可替换
  }

  // —— 分享图：把这一盘画成 3:4 竖图，可存可分享，图上二维码扫了回到这一盘 ——
  // Fabao.share({ title, key, lines: ['…' | ['标签', '…']], meta, url }) ；不给的从页面上取（印、标题、白话卡）
  function share(opt) {
    return loadScript('/fabao/share.js?v=1').then(() => window.FabaoShare.open(opt || {}), () => toast('分享图没载入，联网后再试'));
  }
  // 二维码（Kazuhiko Arase 的 qrcode-generator，MIT，/fabao/vendor/）：{ n, dark(r, c) }
  function qr(text, ecc) {
    return loadScript('/fabao/vendor/qrcode.js?v=1.4.4').then(() => {
      const Q = window.qrcode;
      if (Q.stringToBytesFuncs && Q.stringToBytesFuncs['UTF-8']) Q.stringToBytes = Q.stringToBytesFuncs['UTF-8'];
      const q = Q(0, ecc || 'M');
      q.addData(text, 'Byte');
      q.make();
      return { n: q.getModuleCount(), dark: (r, c) => q.isDark(r, c) };
    });
  }

  // —— 摇一摇：手机晃一下回调一次。iOS 13+ 要在点按里先讨权限，所以只在按钮的点击里调用 ——
  // 返回 Promise<{ ok, stop(), heard() }>；ok 为 false 时带 why（一句话说为什么）
  function shake(onShake, opt) {
    opt = opt || {};
    const DM = window.DeviceMotionEvent;
    if (!DM) return Promise.resolve({ ok: false, why: '这台设备没有动作感应' });
    const ask = typeof DM.requestPermission === 'function' ? DM.requestPermission().catch(() => 'denied') : Promise.resolve('granted');
    return ask.then(st => {
      if (st !== 'granted') return { ok: false, why: '没拿到动作感应的权限，可在浏览器设置里打开' };
      let last = 0, prev = null, prevT = 0, heard = false;
      const th = opt.threshold || 18, gap = opt.gap || 800;
      const on = e => {
        const a = e.accelerationIncludingGravity || e.acceleration;
        if (!a || a.x == null) return;
        heard = true;
        const now = Date.now();
        if (now - prevT < 80) return;      // 每 80 毫秒比一次，晃得猛才算
        if (prev) {
          const d = Math.abs(a.x - prev.x) + Math.abs(a.y - prev.y) + Math.abs(a.z - prev.z);
          if (d > th && now - last > gap) {
            last = now;
            try { if (navigator.vibrate) navigator.vibrate(30); } catch (err) { /* iOS 不震 */ }
            onShake();
          }
        }
        prev = { x: a.x, y: a.y, z: a.z }; prevT = now;
      };
      window.addEventListener('devicemotion', on);
      return { ok: true, stop: () => window.removeEventListener('devicemotion', on), heard: () => heard };
    });
  }

  // —— 术语小词典 ——
  // 白话卡（.bh）与标了 data-gloss 的地方：每处头一回出现的术语描一道虚线，点一下看一句解释。
  // 词条在 /fabao/cidian.js（window.QJ_CIDIAN = [[词, 解释, '别名|别名'], …]），页面上有这类地方才去取。
  // 不想标的地方写 data-gloss="off"。
  const GLOSS = '.bh, [data-gloss]';
  const NO_GLOSS = 'fb-t, a, button, input, textarea, select, option, label, script, style, svg, code, [contenteditable], [data-gloss="off"], .fb-key';
  let gloss = null, glossP = null, gloMO = null, gloTimer = 0, gloPop = null, gloCur = null;
  const gloDirty = new Set();
  function glossLoad() {
    return glossP || (glossP = loadScript('/fabao/cidian.js?v=1').then(() => {
      const map = new Map();
      (window.QJ_CIDIAN || []).forEach(e => {
        if (!e || !e[0] || !e[1]) return;
        map.set(e[0], e);
        String(e[2] || '').split('|').forEach(a => { if (a && !map.has(a)) map.set(a, e); });
      });
      const keys = [...map.keys()].sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      gloss = keys.length ? { map, re: new RegExp(keys.join('|'), 'g') } : null;
    }, () => { gloss = null; }));
  }
  function glossOne(root) {
    const MAX = 12, seen = new Set();
    root.querySelectorAll('fb-t').forEach(t => { const e = gloss.map.get(t.dataset.t); if (e) seen.add(e[0]); });
    if (seen.size >= MAX) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: x => { const p = x.parentElement; return !p || p.closest(NO_GLOSS) || !x.nodeValue.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    const nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    for (const node of nodes) {
      if (seen.size >= MAX) break;
      const s = node.nodeValue;
      let m, last = 0, frag = null;
      gloss.re.lastIndex = 0;
      while ((m = gloss.re.exec(s)) && seen.size < MAX) {
        const e = gloss.map.get(m[0]);
        if (!e || seen.has(e[0])) continue;
        seen.add(e[0]);
        frag = frag || document.createDocumentFragment();
        frag.append(s.slice(last, m.index));
        const t = document.createElement('fb-t');
        t.dataset.t = m[0]; t.tabIndex = 0; t.setAttribute('role', 'button');
        t.textContent = m[0];
        frag.append(t);
        last = m.index + m[0].length;
      }
      if (frag) { frag.append(s.slice(last)); node.replaceWith(frag); }
    }
  }
  function glossFlush() {
    const roots = new Set();
    gloDirty.forEach(x => {
      const el = x.nodeType === 1 ? x : x.parentElement;
      if (!el || !el.isConnected) return;
      const up = el.closest(GLOSS);
      if (up) roots.add(up);
      el.querySelectorAll(GLOSS).forEach(r => roots.add(r));
    });
    gloDirty.clear();
    const list = [...roots].filter(r => r.getAttribute('data-gloss') !== 'off' && !(r.parentElement && r.parentElement.closest(GLOSS)));
    if (!list.length) return;
    glossLoad().then(() => {
      if (!gloss) return;
      gloMO.disconnect();
      list.forEach(r => { if (r.isConnected && !r.closest('[data-gloss="off"]')) glossOne(r); });
      gloMO.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
  }
  function glossShow(t) {
    const e = gloss && gloss.map.get(t.dataset.t);
    if (!e) return;
    if (!gloPop) {
      gloPop = document.createElement('div');
      gloPop.className = 'fb-gloss'; gloPop.id = 'fbGloss'; gloPop.setAttribute('role', 'tooltip');
      document.body.appendChild(gloPop);
    }
    gloPop.innerHTML = `<b>${escH(e[0])}</b>${escH(e[1])}`;
    gloPop.classList.add('on');
    const r = t.getBoundingClientRect(), W = document.documentElement.clientWidth, H = window.innerHeight;
    const w = Math.min(300, W - 24);
    gloPop.style.width = w + 'px';
    gloPop.style.left = Math.round(Math.min(Math.max(12, r.left + r.width / 2 - w / 2), W - w - 12)) + 'px';
    const h = gloPop.offsetHeight, room = H - (W <= 860 ? 84 : 16);
    gloPop.style.top = Math.round(r.bottom + 8 + h > room ? Math.max(8, r.top - h - 8) : r.bottom + 8) + 'px';
    if (gloCur && gloCur !== t) gloCur.removeAttribute('aria-describedby');
    gloCur = t;
    t.setAttribute('aria-describedby', 'fbGloss');
  }
  function glossHide() {
    if (gloPop) gloPop.classList.remove('on');
    if (gloCur) { gloCur.removeAttribute('aria-describedby'); gloCur = null; }
  }
  function glossStart() {
    // 点术语只开词条，不再往下传（免得点到整行的跳转）
    document.addEventListener('click', e => {
      const t = e.target.closest && e.target.closest('fb-t');
      if (t) { e.stopPropagation(); e.preventDefault(); if (gloCur === t) glossHide(); else glossShow(t); return; }
      if (gloCur && !(e.target.closest && e.target.closest('.fb-gloss'))) glossHide();
    }, true);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { if (gloCur) { const t = gloCur; glossHide(); t.focus(); } return; }
      const t = e.target && e.target.closest && e.target.closest('fb-t');
      if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); if (gloCur === t) glossHide(); else glossShow(t); }
    }, true);
    window.addEventListener('scroll', () => { if (gloCur) glossHide(); }, { passive: true });
    window.addEventListener('resize', () => { if (gloCur) glossHide(); });
    gloMO = new MutationObserver(ms => {
      ms.forEach(m => gloDirty.add(m.target));
      clearTimeout(gloTimer);
      gloTimer = setTimeout(glossFlush, 150);
    });
    gloMO.observe(document.body, { childList: true, subtree: true, characterData: true });
    gloDirty.add(document.body);
    gloTimer = setTimeout(glossFlush, 60);
  }

  // —— 印章落笔：每件法宝的印，本标签页头一回打开时一笔一笔写出来 ——
  // 笔画取自 Make Me a Hanzi（经 hanzi-writer-data，Arphic Public License，见 /fabao/strokes/）
  function writeSeal() {
    const seal = document.querySelector('.fb-head .fb-seal');
    if (!seal || reduced() || !window.fetch) return;
    const ch = (seal.textContent || '').trim();
    if ([...ch].length !== 1) return;
    try { const k = 'fb.seal.' + ch; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); } catch (e) { return; }
    fetch('/fabao/strokes/' + ch.codePointAt(0).toString(16) + '.json').then(r => r.ok ? r.json() : null).then(d => {
      if (!d || !Array.isArray(d.s) || !Array.isArray(d.m) || d.s.length !== d.m.length || !d.s.length) return;
      const id = 'fbs' + Math.random().toString(36).slice(2, 8);
      const segs = d.m.map(pts => {
        // 起笔往回多拉一截，免得笔头留白
        const a = pts[0], b = pts[1] || pts[0], dx = a[0] - b[0], dy = a[1] - b[1], L = Math.hypot(dx, dy) || 1;
        const p = [[a[0] + dx / L * 60, a[1] + dy / L * 60]].concat(pts);
        let len = 0;
        for (let i = 1; i < p.length; i++) len += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
        return { d: 'M' + p.map(q => Math.round(q[0]) + ' ' + Math.round(q[1])).join('L'), len };
      });
      const total = segs.reduce((s, x) => s + x.len, 0) || 1, gap = 45, T = Math.min(1500, 420 + segs.length * 85);
      let t = 150, body = '';
      segs.forEach((s, i) => {
        const dur = Math.max(110, (T - gap * segs.length) * s.len / total);
        body += `<path class="st" clip-path="url(#${id}-${i})" d="${s.d}" style="--l:${Math.ceil(s.len) + 8};animation-duration:${Math.round(dur)}ms;animation-delay:${Math.round(t)}ms"/>`;
        t += dur + gap;
      });
      seal.insertAdjacentHTML('beforeend', `<svg class="fb-seal-w" viewBox="0 0 1024 1024" aria-hidden="true"><defs>${d.s.map((p, i) => `<clipPath id="${id}-${i}"><path d="${p}"/></clipPath>`).join('')}</defs><g transform="translate(0 900) scale(1 -1)">${body}</g></svg>`);
      seal.classList.add('writing');
      // 写完墨色收进印里：笔画淡去，原字浮回
      setTimeout(() => seal.classList.add('written'), t + 120);
      setTimeout(() => { seal.classList.remove('writing', 'written'); const w = seal.querySelector('.fb-seal-w'); if (w) w.remove(); }, t + 900);
    }).catch(() => {});
  }

  // —— 离线与装到桌面：法宝库各页先存一份（/sw.js），断网也能起盘 ——
  let installEvt = null;
  function pwa() {
    const head = document.head, add = (tag, attrs) => { const el = document.createElement(tag); Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k])); head.appendChild(el); };
    if (!head.querySelector('link[rel="manifest"]')) add('link', { rel: 'manifest', href: '/fabao/app.webmanifest' });
    if (!head.querySelector('link[rel="apple-touch-icon"]')) add('link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' });
    if (!head.querySelector('meta[name="apple-mobile-web-app-title"]')) add('meta', { name: 'apple-mobile-web-app-title', content: '法宝库' });
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; document.dispatchEvent(new CustomEvent('fabao:installable')); });
    if ('serviceWorker' in navigator && window.isSecureContext) {
      const go = () => navigator.serviceWorker.register('/sw.js').catch(() => { /* 不支持或被禁用：照常在线用 */ });
      if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
    }
  }
  const standalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // —— 法宝库大堂（/tools/，body data-tool="ku"）——
  // 不逐件写说明：按五门排成一屏小牌，一件一行字，点了就进；一家的牌子上各件都能直接点；
  // 上回用过的放最前「接着用」；另有一排「我想问」（名单在 data/wenti.yaml，构建时出成 /fabao/wenti.js 的 window.QJ_WENTI）；
  // 末尾「本机存档」：导出、导入、扫码带到另一台设备（/fabao/backup.js，用到才取）。
  const MEN = [['山', '堪舆'], ['医', '方脉针灸'], ['命', '推命'], ['卜', '占断'], ['相', '观形']];
  function storeSummary() {
    let people = 0, recs = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || /^lock_key_/.test(k)) continue;
        let v = null;
        try { v = JSON.parse(localStorage.getItem(k)); } catch (e) { continue; }
        if (!Array.isArray(v)) continue;
        if (k === LS_PEOPLE) people = v.length; else recs += v.length;
      }
    } catch (e) { /* 无痕模式 */ }
    return people || recs ? `存着${people ? ` ${people} 个人` : ''}${people && recs ? '、' : ''}${recs ? ` ${recs} 条盘例与记录` : ''}` : '这台设备上还没存过盘';
  }
  function withBackup(fn) {
    return loadScript('/fabao/backup.js?v=1').then(() => fn(window.FabaoBackup), () => toast('存档工具没载入，联网后再试'));
  }
  function mountKu() {
    const box = document.getElementById('fbKu');
    if (!box) return;
    const href = t => FAMILIES[t.id] ? famHref(t.id, lsGet(FAMILIES[t.id].lsLast) || FAMILIES[t.id].items[0].id) : t.href;
    const tile = t => {
      const F = FAMILIES[t.id];
      if (!F) return `
      <a class="ku-tile${t.lock ? ' is-lock' : ''}" href="${href(t)}">
        <span class="ku-ico">${ICONS[t.id]}</span>
        <span class="ku-t">${t.name}${t.lock ? '<i title="此宝被阁主下了禁制，持诀者可开">禁</i>' : ''}</span>
        <span class="ku-s">${t.desc || ''}</span>
      </a>`;
      // 一家：整块点了进上回用的那件，下面一排各件也能直接点
      return `
      <div class="ku-tile is-fam">
        <span class="ku-ico">${ICONS[t.id]}</span>
        <span class="ku-t">${t.name}</span>
        <span class="ku-s ku-sub">${F.items.filter(i => !i.lock).map(i => `<a href="${famHref(t.id, i.id)}" data-fam="${t.id}" data-fam-item="${i.id}">${i.short || i.name}</a>`).join('')}</span>
        <a class="ku-hit" href="${href(t)}" aria-label="${t.name}：${t.desc || ''}"></a>
      </div>`;
    };
    const lastId = lsGet(LS_KU_LAST), last = TOOLS.find(t => t.id === (OLD_TAB[lastId] || lastId));
    const dh = dayHour(new Date());
    const ask = Array.isArray(window.QJ_WENTI) ? window.QJ_WENTI : [];
    box.innerHTML = `
      <p class="ku-now"><span>此刻</span><b>${dh.day.name}</b>日<b>${dh.hour.name}</b>时${last ? `
        <a class="ku-again" href="${href(last)}">接着用 · ${last.name} →</a>` : ''}</p>
      ${ask.length ? `<nav class="ku-ask" aria-label="我想问"><span class="ku-ask-h">我想问</span>${ask.map(a => `<a href="${a.href}" title="${a.a || ''}"${a.home ? '' : ' class="more" hidden'}>${a.q}</a>`).join('')}${ask.some(a => !a.home) ? '<button type="button" class="ku-ask-more">更多 ▾</button>' : ''}</nav>` : ''}
      <div class="ku-men">${MEN.map(([seal, name]) => {
        const ts = TOOLS.filter(t => t.men === seal);
        return ts.length ? `
        <section class="ku-row" aria-label="${seal}门 · ${name}">
          <a class="ku-seal" href="/wushu/#men-${encodeURIComponent(seal)}" title="${seal}门 · ${name}：此门文章">${seal}</a>
          <div class="ku-tiles">${ts.map(tile).join('')}</div>
        </section>` : '';
      }).join('')}</div>
      <section class="ku-bk" aria-label="本机存档">
        <span class="ku-bk-h">本机存档</span><span class="ku-bk-s">${storeSummary()}</span>
        <span class="ku-bk-a">
          <button type="button" class="fb-btn" data-bk="qr" title="在另一台设备上扫这个码，就把这里存的人和盘带过去">扫码带走</button>
          <button type="button" class="fb-btn ghost" data-bk="out" title="存成一个文件，换机、备份都行">导出</button>
          <button type="button" class="fb-btn ghost" data-bk="in" title="把导出的文件并回来">导入</button>
          <button type="button" class="fb-btn ghost ku-inst" hidden>装到桌面</button>
        </span>
        <small class="fb-fine">盘与人只存在这台设备的浏览器里，不经任何服务器；换设备、清浏览器之前，先在这里带走或导出。</small>
      </section>`;
    const more = box.querySelector('.ku-ask-more');
    if (more) more.onclick = () => { box.querySelectorAll('.ku-ask a.more').forEach(a => { a.hidden = false; }); more.remove(); };
    const bk = box.querySelector('.ku-bk');
    bk.addEventListener('click', e => {
      const b = e.target.closest('[data-bk]');
      if (!b) return;
      if (b.dataset.bk === 'in') {
        // 选文件得在点按当下开（Safari 不认隔了一拍的 click）
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'application/json,.json';
        inp.onchange = () => { if (inp.files && inp.files[0]) withBackup(B => B.importFile(inp.files[0])); };
        inp.click();
        return;
      }
      withBackup(B => B[b.dataset.bk === 'qr' ? 'qr' : 'exportFile']());
    });
    document.addEventListener('fabao:store', () => { const s = bk.querySelector('.ku-bk-s'); if (s) s.textContent = storeSummary(); });
    // 装到桌面：安卓、电脑 Chrome 给原生提示；iPhone 只能自己点「分享 → 添加到主屏幕」
    const inst = bk.querySelector('.ku-inst');
    const showInst = () => { if (!standalone()) inst.hidden = false; };
    if (installEvt) showInst();
    document.addEventListener('fabao:installable', showInst);
    if (isIOS() && !standalone()) showInst();
    inst.onclick = () => {
      if (installEvt) { installEvt.prompt(); installEvt.userChoice.then(c => { if (c && c.outcome === 'accepted') inst.hidden = true; }).catch(() => {}); installEvt = null; }
      else if (isIOS()) toast('点 Safari 下方的「分享」，再点「添加到主屏幕」', 4200);
      else toast('浏览器菜单里选「安装」或「添加到主屏幕」', 3600);
    };
    // 另一台设备扫码打开的：#bk=…，问一声再并进来
    if (/^#bk=/.test(location.hash)) withBackup(B => B.fromHash());
  }

  window.Fabao = {
    GAN, ZHI, dayHour, toLocalInput, fmt, bindWhen, linkedTime, toast, copy, askAI, FAMILIES, TOOLS,
    loadScript, share, qr, shake, gloss: () => { gloDirty.add(document.body); glossFlush(); },
    birth: { save: saveBirth, replace: replaceBirth, load: loadBirth, query: birthQuery, minusHour, yearOf: birthYearOf },
    people: { list: loadPeople, add: addPerson, remove: removePerson, use: usePerson, current: currentPerson, key: personKey, refresh: () => { refreshMingbuLinks(); renderPeople(); } }
  };
  mountShell();
  pwa();
  if (document.body.dataset.tool === 'ku') mountKu();
  glossStart();
  writeSeal();
})();
