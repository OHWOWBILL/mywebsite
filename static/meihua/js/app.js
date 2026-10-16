// =========================================================
// 梅花易数工具 · 主逻辑 (上下卦选择器版)
// =========================================================

(function () {
  'use strict';

  // —— 八卦定义 —— (lines 从下到上, 1=阳 0=阴)
  const TRIGRAMS = [
    { name: '乾', symbol: '☰', lines: [1,1,1], element: '天', wuxing: 'jin' },
    { name: '兑', symbol: '☱', lines: [1,1,0], element: '泽', wuxing: 'jin' },
    { name: '离', symbol: '☲', lines: [1,0,1], element: '火', wuxing: 'huo' },
    { name: '震', symbol: '☳', lines: [1,0,0], element: '雷', wuxing: 'mu' },
    { name: '巽', symbol: '☴', lines: [0,1,1], element: '风', wuxing: 'mu' },
    { name: '坎', symbol: '☵', lines: [0,1,0], element: '水', wuxing: 'shui' },
    { name: '艮', symbol: '☶', lines: [0,0,1], element: '山', wuxing: 'tu' },
    { name: '坤', symbol: '☷', lines: [0,0,0], element: '地', wuxing: 'tu' }
  ];

  // —— 主题 & Tab ——
  const THEME_KEY = 'meihua.theme', TAB_KEY = 'meihua.tab';
  const SUN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
  const MOON_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
    document.querySelectorAll('[data-theme-icon]').forEach(el => el.innerHTML = t === 'dark' ? SUN_ICON : MOON_ICON);
    document.querySelectorAll('[data-theme-label]').forEach(el => el.textContent = t === 'dark' ? '浅色' : '深色');
  }
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(saved || sys);
    document.querySelectorAll('[data-theme-btn]').forEach(b => b.addEventListener('click', () => {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    }));
  }
  function switchTab(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.dataset.page === name));
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    localStorage.setItem(TAB_KEY, name);
  }
  function initTabs() {
    document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
    switchTab(localStorage.getItem(TAB_KEY) || 'paipan');
  }

  // =========================================================
  // 排盘速查
  // =========================================================

  const YAO_LABELS = ['初', '二', '三', '四', '五', '上'];
  const WX_LABEL = { mu: '木', huo: '火', tu: '土', jin: '金', shui: '水' };
  const state = {}; // state[type] = { upper, lower, hexagram, dong }

  // 原资料长篇解读（体积较大，首次需要时再加载）
  let detailData = null, detailPromise = null;
  function loadDetail() {
    if (!detailPromise) {
      detailPromise = fetch('data/yao_detail.json')
        .then(r => r.ok ? r.json() : {})
        .catch(() => ({}))
        .then(d => (detailData = d || {}));
    }
    return detailPromise;
  }

  function findHexagram(upper, lower) {
    if (!upper || !lower) return null;
    // 六爻: 从初爻到上爻 = lower.lines(3) + upper.lines(3)
    const lines = [...lower.lines, ...upper.lines];
    return window.HEXAGRAMS.find(h => h.lines.length === 6 && h.lines.every((v, i) => v === lines[i]));
  }
  function trigramOf(lines) {
    return TRIGRAMS.find(t => t.lines.every((v, i) => v === lines[i]));
  }
  function yaoName(hex, idx) {
    const n = hex.lines[idx] ? '九' : '六';
    return idx === 0 ? '初' + n : idx === 5 ? '上' + n : n + YAO_LABELS[idx];
  }

  function renderTriGlyph(lines) {
    // lines: [初,二,三] 从下到上 — render top-to-bottom
    return [...lines].reverse().map(v => `<span class="line ${v ? '' : 'broken'}"></span>`).join('');
  }

  function renderTriPickers(type) {
    const card = document.querySelector(`[data-card="${type}"]`);
    const wrap = card.querySelector('.tri-pickers');
    wrap.innerHTML = `
      <div class="tri-picker" data-pos="upper">
        <span class="tri-picker-label">上卦</span>
        ${buildPickerButton()}
        ${buildPickerMenu()}
      </div>
      <div class="tri-picker" data-pos="lower">
        <span class="tri-picker-label">下卦</span>
        ${buildPickerButton()}
        ${buildPickerMenu()}
      </div>
    `;

    wrap.querySelectorAll('.tri-picker').forEach(picker => {
      const pos = picker.dataset.pos;
      const btn = picker.querySelector('.tri-button');
      const menu = picker.querySelector('.tri-menu');

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.tri-menu.open').forEach(m => { if (m !== menu) m.classList.remove('open'); });
        menu.classList.toggle('open');
      });

      menu.querySelectorAll('.tri-option').forEach((opt, i) => {
        opt.addEventListener('click', () => {
          // 手动改卦后，原来起卦得到的动爻不再适用
          state[type].dong = null;
          setTrigram(type, pos, TRIGRAMS[i]);
          updateHexagram(type);
          menu.classList.remove('open');
          markManual();
        });
      });
    });

    state[type] = { upper: null, lower: null, hexagram: null, dong: null };
  }

  const EMPTY_BUTTON_INNER = `
        <span class="tri-empty">未选</span>
        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
  `;
  function buildPickerButton() {
    return `<button class="tri-button" type="button">${EMPTY_BUTTON_INNER}</button>`;
  }
  function buildPickerMenu() {
    return `
      <div class="tri-menu">
        ${TRIGRAMS.map(t => `
          <button class="tri-option" type="button">
            <span class="g">${renderTriGlyph(t.lines)}</span>
            <span class="nm">
              <span class="ch">${t.name}</span>
              <span class="sub">${t.element}</span>
            </span>
          </button>
        `).join('')}
      </div>
    `;
  }

  function setTrigram(type, pos, trigram) {
    const card = document.querySelector(`[data-card="${type}"]`);
    const picker = card.querySelector(`.tri-picker[data-pos="${pos}"]`);
    const btn = picker.querySelector('.tri-button');
    if (!trigram) {
      btn.innerHTML = EMPTY_BUTTON_INNER;
      btn.classList.remove('filled');
    } else {
      btn.innerHTML = `
        <span class="tri-name">${trigram.name}<span style="font-size:11px;color:var(--ink-4);margin-left:6px;letter-spacing:1px">${trigram.element}</span></span>
        <span style="font-size:20px;color:var(--c);line-height:1;font-family:var(--font-serif)">${trigram.symbol}</span>
      `;
      btn.classList.add('filled');
    }
    picker.querySelectorAll('.tri-option').forEach((opt, i) => opt.classList.toggle('selected', TRIGRAMS[i] === trigram));
    state[type][pos] = trigram;
  }

  function updateHexagram(type) {
    const card = document.querySelector(`[data-card="${type}"]`);
    const matchLbl = card.querySelector('.matched-name');
    const viz = card.querySelector('.yao-viz');
    const body = card.querySelector('.card-body');
    const s = state[type];

    if (!s.upper || !s.lower) {
      s.hexagram = null;
      matchLbl.textContent = s.upper || s.lower ? '请继续选择…' : '';
      matchLbl.classList.remove('ok', 'err');
      viz.classList.remove('ready');
      viz.innerHTML = '';
      body.innerHTML = `<div class="placeholder"><span class="dot-sep"></span>请选择上卦<br>与下卦<span class="dot-sep"></span></div>`;
      return;
    }

    const hex = findHexagram(s.upper, s.lower);
    if (!hex) {
      matchLbl.textContent = '未找到';
      matchLbl.classList.add('err');
      return;
    }

    s.hexagram = hex;
    matchLbl.textContent = '✓ ' + hex.name;
    matchLbl.classList.remove('err');
    matchLbl.classList.add('ok');

    renderYaoLines(type, hex);
    viz.classList.add('ready');

    if (s.dong) {
      viz.querySelector(`.yao-row[data-idx="${s.dong - 1}"]`).classList.add('active');
      showYao(type, hex, s.dong - 1, body);
    } else {
      body.innerHTML = `
        ${renderGuaIntro(hex)}
        <div class="placeholder">
          <span class="dot-sep"></span>
          点击上方爻线<br>查看爻辞
          <span class="dot-sep"></span>
        </div>
      `;
    }
  }

  function renderGuaIntro(hex) {
    const t = window.YAO_TEXT && window.YAO_TEXT[hex.name];
    let html = '<div class="gua-meaning">';
    if (t && t.gua) html += `<div class="gua-ci"><span class="tag">卦辞</span>${t.gua}</div>`;
    if (hex.meaning) html += `<div>${hex.meaning}</div>`;
    if (t && t.extra) html += `<div class="gua-extra"><span class="tag">${t.extra[0]}</span>${t.extra[1]}<div class="gua-extra-note">${t.extra[2]}</div></div>`;
    return html + '</div>';
  }

  function renderYaoLines(type, hex) {
    const card = document.querySelector(`[data-card="${type}"]`);
    const viz = card.querySelector('.yao-viz');
    const body = card.querySelector('.card-body');
    const dong = state[type].dong;
    viz.innerHTML = hex.lines.map((v, i) => `
      <div class="yao-row${dong === i + 1 ? ' dong' : ''}" data-idx="${i}" style="--i:${5 - i}">
        <span class="yao-label">${YAO_LABELS[i]}</span>
        <span class="yao-line ${v ? 'yang' : 'yin'}"></span>
        <span class="yao-mark" title="${dong === i + 1 ? (type === 'bian' ? '此爻由动爻变来' : '动爻') : ''}">${dong === i + 1 ? (type === 'bian' ? '变' : (v ? '○' : '×')) : ''}</span>
      </div>
    `).join('');
    viz.querySelectorAll('.yao-row').forEach(row => {
      row.addEventListener('click', () => {
        viz.querySelectorAll('.yao-row').forEach(r => r.classList.toggle('active', r === row));
        showYao(type, hex, parseInt(row.dataset.idx), body);
      });
    });
  }

  function showYao(type, hex, idx, bodyEl) {
    const t = window.YAO_TEXT && window.YAO_TEXT[hex.name];
    const row = t ? t.yao[idx] : null;
    const isDong = state[type].dong === idx + 1;
    const title = row ? row[0] : yaoName(hex, idx);
    bodyEl.innerHTML = `
      ${renderGuaIntro(hex)}
      <div class="yao-title">${hex.short}卦 · ${title}${isDong ? `<span class="dong-tag">${type === 'bian' ? '变爻' : '动爻'}</span>` : ''}</div>
      ${row ? `
        <div class="yao-yuanwen">${row[1]}</div>
        <div class="yao-sub">白话解读</div>
        <div class="yao-text">${row[2]}</div>
      ` : '<div class="yao-text">（此爻暂无数据）</div>'}
      <details class="yao-detail">
        <summary>原资料详解</summary>
        <div class="yao-detail-body">加载中…</div>
      </details>
    `;
    const det = bodyEl.querySelector('.yao-detail');
    det.addEventListener('toggle', () => {
      if (!det.open) return;
      loadDetail().then(d => {
        const arr = d[hex.name];
        const txt = arr && arr[idx];
        det.querySelector('.yao-detail-body').textContent = txt || '（原资料缺少此爻的详解）';
      });
    });
  }

  // =========================================================
  // 起卦：时间起卦（年月日时）/ 随机起卦
  // =========================================================

  const GAN = '甲乙丙丁戊己庚辛壬癸';
  const ZHI = '子丑寅卯辰巳午未申酉戌亥';
  const LUNAR_MONTH = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  function lunarDayName(d) {
    if (d === 10) return '初十';
    if (d === 20) return '二十';
    if (d === 30) return '三十';
    const digits = '一二三四五六七八九';
    const tens = ['初', '十', '廿', '三'][Math.floor(d / 10)];
    return tens + digits[(d % 10) - 1];
  }

  // 用浏览器内置的农历（Intl chinese calendar）取农历年月日
  function lunarDate(date) {
    try {
      const parts = new Intl.DateTimeFormat('en-u-ca-chinese', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date);
      const get = type => (parts.find(p => p.type === type) || {}).value;
      const year = parseInt(get('relatedYear') || get('year'), 10);
      const monthRaw = get('month') || '';
      const month = parseInt(monthRaw, 10), day = parseInt(get('day'), 10);
      if (!year || !month || !day || year < 1000) return null;
      return { year, month, day, leap: /bis/i.test(monthRaw) };
    } catch (e) {
      return null;
    }
  }

  function castByTime(now) {
    const h = now.getHours();
    // 23 点起为子时，按传统算作次日
    const lunar = lunarDate(h === 23 ? new Date(now.getTime() + 3600 * 1000) : now);
    if (!lunar) return null;
    const yearZhi = ((lunar.year - 4) % 12 + 12) % 12;
    const yearGan = ((lunar.year - 4) % 10 + 10) % 10;
    const hourZhi = Math.floor((h + 1) / 2) % 12;
    const Y = yearZhi + 1, M = lunar.month, D = lunar.day, H = hourZhi + 1;
    const upperSum = Y + M + D, lowerSum = upperSum + H;
    return {
      method: 'time',
      upper: (upperSum % 8) || 8,
      lower: (lowerSum % 8) || 8,
      dong: (lowerSum % 6) || 6,
      label: `${GAN[yearGan]}${ZHI[yearZhi]}年 ${lunar.leap ? '闰' : ''}${LUNAR_MONTH[M - 1]}月${lunarDayName(D)} ${ZHI[hourZhi]}时`,
      formula: `年${ZHI[yearZhi]}(${Y}) + 月(${M}) + 日(${D}) = ${upperSum}，÷8 余 ${(upperSum % 8) || 8} → 上卦；`
        + `再加时${ZHI[hourZhi]}(${H}) = ${lowerSum}，÷8 余 ${(lowerSum % 8) || 8} → 下卦；÷6 余 ${(lowerSum % 6) || 6} → 动爻`
    };
  }

  function randInt(n) {
    if (window.crypto && crypto.getRandomValues) {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return a[0] % n;
    }
    return Math.floor(Math.random() * n);
  }
  function castRandom() {
    return { method: 'random', upper: randInt(8) + 1, lower: randInt(8) + 1, dong: randInt(6) + 1, label: '随机数起卦', formula: '' };
  }

  // 体用：动爻所在的经卦为「用」，另一经卦为「体」
  const SHENG = { mu: 'huo', huo: 'tu', tu: 'jin', jin: 'shui', shui: 'mu' };
  const KE = { mu: 'tu', tu: 'shui', shui: 'huo', huo: 'jin', jin: 'mu' };
  function tiYong(ti, yong) {
    const a = ti.wuxing, b = yong.wuxing;
    if (a === b) return { text: '体用比和', verdict: '吉，事易成', cls: 'good' };
    if (SHENG[b] === a) return { text: '用生体', verdict: '大吉，有进益之喜', cls: 'good' };
    if (KE[a] === b) return { text: '体克用', verdict: '吉，事可成但需费力', cls: 'good' };
    if (SHENG[a] === b) return { text: '体生用', verdict: '有耗损，付出多回报少', cls: 'warn' };
    return { text: '用克体', verdict: '不利，宜谨慎', cls: 'bad' };
  }

  function applyCast(cast) {
    const upper = TRIGRAMS[cast.upper - 1], lower = TRIGRAMS[cast.lower - 1];
    const benLines = [...lower.lines, ...upper.lines];
    const huLines = [benLines[1], benLines[2], benLines[3], benLines[2], benLines[3], benLines[4]];
    const bianLines = benLines.slice();
    bianLines[cast.dong - 1] = 1 - bianLines[cast.dong - 1];

    const fill = (type, lines, dong) => {
      state[type].dong = dong;
      setTrigram(type, 'upper', trigramOf(lines.slice(3)));
      setTrigram(type, 'lower', trigramOf(lines.slice(0, 3)));
      updateHexagram(type);
    };
    fill('ben', benLines, cast.dong);
    fill('hu', huLines, null);
    fill('bian', bianLines, cast.dong);

    const yong = cast.dong <= 3 ? lower : upper;
    const ti = cast.dong <= 3 ? upper : lower;
    const ty = tiYong(ti, yong);
    const ben = state.ben.hexagram, bian = state.bian.hexagram;

    const info = document.getElementById('qiguaInfo');
    info.classList.remove('manual');
    info.innerHTML = `
      <div class="qg-line1">
        <span class="qg-method">${cast.method === 'time' ? '时间起卦' : '随机起卦'}</span>
        <span class="qg-time">${cast.label}</span>
      </div>
      <div class="qg-result">
        <strong>${ben.name}</strong> 之 <strong>${bian.name}</strong>
        <span class="qg-sep">·</span>${yaoName(ben, cast.dong - 1)}动
        <span class="qg-sep">·</span>互 ${state.hu.hexagram.name}
      </div>
      <div class="qg-tiyong ${ty.cls}">
        体 ${ti.name}${WX_LABEL[ti.wuxing]} · 用 ${yong.name}${WX_LABEL[yong.wuxing]} — ${ty.text}，${ty.verdict}
      </div>
      ${cast.formula ? `<div class="qg-formula">${cast.formula}</div>` : ''}
    `;
  }

  function markManual() {
    const info = document.getElementById('qiguaInfo');
    if (info && !info.classList.contains('manual')) {
      info.classList.add('manual');
      const note = document.createElement('div');
      note.className = 'qg-formula';
      note.textContent = '（已手动调整卦象，上面的起卦结果仅供参考）';
      info.appendChild(note);
    }
  }

  function clearAll() {
    ['ben', 'hu', 'bian'].forEach(type => {
      state[type].dong = null;
      setTrigram(type, 'upper', null);
      setTrigram(type, 'lower', null);
      updateHexagram(type);
    });
    const info = document.getElementById('qiguaInfo');
    info.classList.remove('manual');
    info.innerHTML = '<div class="qg-hint">已清空，可在下方自行选择上下卦，或点击右侧按钮重新起卦。</div>';
  }

  function initPaipan() {
    ['ben', 'hu', 'bian'].forEach(renderTriPickers);
    document.addEventListener('click', () => {
      document.querySelectorAll('.tri-menu.open').forEach(m => m.classList.remove('open'));
    });
    document.querySelectorAll('[data-qigua]').forEach(btn => btn.addEventListener('click', () => {
      const m = btn.dataset.qigua;
      if (m === 'time') applyCast(castByTime(new Date()) || castRandom());
      else if (m === 'random') applyCast(castRandom());
      else clearAll();
    }));
    // 打开页面即按当前时间起一卦（浏览器不支持农历时退回随机）
    applyCast(castByTime(new Date()) || castRandom());
  }

  // =========================================================
  // 十二长生 (with wuxing coloring)
  // =========================================================

  function buildChangsheng() {
    const branches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    const stems    = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    const stages   = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];
    const isYang   = [true, false, true, false, true, false, true, false, true, false];
    const startBranch = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];

    // 天干五行
    const stemWx = ['mu','mu','huo','huo','tu','tu','jin','jin','shui','shui'];
    // 地支五行
    const branchWx = ['shui','tu','mu','mu','tu','huo','huo','tu','jin','jin','tu','shui'];

    const powerMap = {
      '长生':'rising','沐浴':'neutral','冠带':'rising',
      '临官':'strong','帝旺':'peak',
      '衰':'fading','病':'fading','死':'dead',
      '墓':'weak','绝':'dead','胎':'rising','养':'neutral'
    };
    const wuxingLabel = { mu:'木', huo:'火', tu:'土', jin:'金', shui:'水' };

    const data = [];
    for (let s = 0; s < 10; s++) {
      data[s] = [];
      for (let b = 0; b < 12; b++) {
        let offset = isYang[s] ? (b - startBranch[s] + 12) % 12 : (startBranch[s] - b + 12) % 12;
        data[s][b] = stages[offset];
      }
    }

    const table = document.getElementById('csTable');
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');

    thead.innerHTML = '<th class="corner">天干<br>＼<br>地支</th>';
    branches.forEach((br, i) => {
      const th = document.createElement('th');
      th.className = 'branch';
      th.dataset.col = i;
      th.dataset.wx = branchWx[i];
      th.textContent = br;
      thead.appendChild(th);
    });

    tbody.innerHTML = '';
    stems.forEach((st, si) => {
      const tr = document.createElement('tr');
      tr.dataset.row = si;
      const th = document.createElement('th');
      th.className = 'stem ' + (isYang[si] ? 'yang' : 'yin');
      th.dataset.wx = stemWx[si];
      th.textContent = st;
      tr.appendChild(th);
      branches.forEach((br, bi) => {
        const td = document.createElement('td');
        td.className = (isYang[si] ? 'yang' : 'yin');
        td.dataset.row = si;
        td.dataset.col = bi;
        td.dataset.power = powerMap[data[si][bi]];
        td.dataset.wx = stemWx[si]; // 用天干五行
        td.textContent = data[si][bi];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    document.getElementById('csStageLegend').innerHTML = stages.map(s => `<span class="chip" data-power="${powerMap[s]}">${s}</span>`).join('');

    const infoBox = document.getElementById('csInfoBox');
    let lastKey = null;

    function clearHl() {
      table.querySelectorAll('.row-hl,.col-hl,.cell-hl').forEach(el => el.classList.remove('row-hl','col-hl','cell-hl'));
    }
    function highlight(td) {
      if (!td || td.dataset.row === undefined) return;
      const r = +td.dataset.row, c = +td.dataset.col, key = r + '-' + c;
      if (key === lastKey) return;
      lastKey = key;
      clearHl();
      tbody.querySelectorAll('tr')[r].classList.add('row-hl');
      thead.querySelectorAll('th.branch')[c].classList.add('col-hl');
      tbody.querySelectorAll('tr').forEach(tr => { const cells = tr.querySelectorAll('td'); if (cells[c]) cells[c].classList.add('col-hl'); });
      td.classList.add('cell-hl');

      const stage = data[r][c];
      const sWx = stemWx[r], bWx = branchWx[c];
      infoBox.innerHTML = `
        <div class="label">${branches[c]}宫（${wuxingLabel[bWx]}）· ${stems[r]}（${wuxingLabel[sWx]}${isYang[r]?'阳':'阴'}）</div>
        <div class="result">${stage}</div>
        <div class="detail">天干「<span style="color:var(--wx-${sWx})">${stems[r]}</span>」在地支「<span style="color:var(--wx-${bWx})">${branches[c]}</span>」宫 → <strong>${stage}</strong></div>
      `;
    }
    table.addEventListener('mouseover', (e) => { const td = e.target.closest('td'); if (td) highlight(td); });
    table.addEventListener('click', (e) => { lastKey = null; const td = e.target.closest('td'); if (td) highlight(td); });
    table.addEventListener('mouseleave', () => {
      clearHl(); lastKey = null;
      infoBox.innerHTML = '<div class="hint">将鼠标移到（或点击）表格单元格<br>即可查看对应的十二长生</div>';
    });
  }

  function initAll() {
    initTheme();
    initTabs();
    initPaipan();
    buildChangsheng();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
