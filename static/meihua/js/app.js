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

  let yiData = {};
  const state = {}; // state[type] = { upper: trigram, lower: trigram, hexagram: ... }

  fetch('yi_ching.json').then(r => r.ok ? r.json() : {}).then(d => { yiData = d || {}; }).catch(() => { yiData = {}; });

  // 根据上下卦查找六十四卦
  function findHexagram(upper, lower) {
    if (!upper || !lower) return null;
    // 六爻: 从初爻到上爻 = lower.lines(3) + upper.lines(3)
    const lines = [...lower.lines, ...upper.lines];
    return window.HEXAGRAMS.find(h => {
      return h.lines.length === 6 && h.lines.every((v, i) => v === lines[i]);
    });
  }

  function lookupYiKey(hex) {
    if (!yiData || !Object.keys(yiData).length) return null;
    const candidates = [hex.name, hex.short, hex.name + '卦'];
    for (const c of candidates) if (yiData[c]) return c;
    const key = Object.keys(yiData).find(k => k.includes(hex.short) || (hex.name && k.includes(hex.name)));
    return key || null;
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
      if (!btn || !menu) { console.warn('picker child missing', pos, picker.innerHTML); return; }

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // close any other open menu
        document.querySelectorAll('.tri-menu.open').forEach(m => { if (m !== menu) m.classList.remove('open'); });
        menu.classList.toggle('open');
      });

      menu.querySelectorAll('.tri-option').forEach((opt, i) => {
        opt.addEventListener('click', () => {
          pickTrigram(type, pos, TRIGRAMS[i]);
          menu.classList.remove('open');
        });
      });
    });

    state[type] = state[type] || { upper: null, lower: null };
  }

  function buildPickerButton() {
    return `
      <button class="tri-button" type="button">
        <span class="tri-empty">未选</span>
        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>
    `;
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

  function pickTrigram(type, pos, trigram) {
    const card = document.querySelector(`[data-card="${type}"]`);
    const picker = card.querySelector(`.tri-picker[data-pos="${pos}"]`);
    const btn = picker.querySelector('.tri-button');

    btn.innerHTML = `
      <span class="tri-name">${trigram.name}<span style="font-size:11px;color:var(--ink-4);margin-left:6px;letter-spacing:1px">${trigram.element}</span></span>
      <span style="font-size:20px;color:var(--c);line-height:1;font-family:var(--font-serif)">${trigram.symbol}</span>
    `;
    btn.classList.add('filled');

    state[type][pos] = trigram;
    updateHexagram(type);
  }

  function updateHexagram(type) {
    const card = document.querySelector(`[data-card="${type}"]`);
    const matchLbl = card.querySelector('.matched-name');
    const viz = card.querySelector('.yao-viz');
    const body = card.querySelector('.card-body');
    const s = state[type];

    if (!s.upper || !s.lower) {
      matchLbl.textContent = s.upper || s.lower ? '请继续选择…' : '';
      matchLbl.classList.remove('ok', 'err');
      viz.classList.remove('ready');
      viz.innerHTML = '';
      return;
    }

    const hex = findHexagram(s.upper, s.lower);
    if (!hex) {
      matchLbl.textContent = '未找到';
      matchLbl.classList.add('err');
      return;
    }

    state[type].hexagram = hex;
    matchLbl.textContent = '✓ ' + hex.name;
    matchLbl.classList.remove('err');
    matchLbl.classList.add('ok');

    renderYaoLines(type, hex);
    viz.classList.add('ready');

    body.innerHTML = `
      ${hex.meaning ? `<div class="gua-meaning">${hex.meaning}</div>` : ''}
      <div class="placeholder">
        <span class="dot-sep"></span>
        点击左侧爻线<br>查看爻辞
        <span class="dot-sep"></span>
      </div>
    `;
  }

  function renderYaoLines(type, hex) {
    const card = document.querySelector(`[data-card="${type}"]`);
    const viz = card.querySelector('.yao-viz');
    const body = card.querySelector('.card-body');
    const labels = ['初', '二', '三', '四', '五', '上'];
    viz.innerHTML = hex.lines.map((v, i) => `
      <div class="yao-row" data-idx="${i}" style="--i:${5 - i}">
        <span class="yao-label">${labels[i]}</span>
        <span class="yao-line ${v ? 'yang' : 'yin'}"></span>
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
    const labels = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
    const key = lookupYiKey(hex);
    let title = labels[idx], text = '';
    if (key && yiData[key]) {
      const keys = Object.keys(yiData[key]);
      if (idx < keys.length) { title = keys[idx]; text = yiData[key][keys[idx]]; }
      else text = '（此爻暂无数据）';
    } else {
      const yy = hex.lines[idx] ? '阳爻 ⎯⎯⎯' : '阴爻 ⎯  ⎯';
      text = `${labels[idx]} · ${yy}\n\n${hex.meaning || '暂无数据'}\n\n（请确保 yi_ching.json 与此文件置于同一目录以加载完整爻辞）`;
    }
    bodyEl.innerHTML = `<div class="yao-title">${title}</div><div class="yao-text">${text}</div>`;
  }

  function initPaipan() {
    ['ben', 'hu', 'bian'].forEach(renderTriPickers);
    document.addEventListener('click', () => {
      document.querySelectorAll('.tri-menu.open').forEach(m => m.classList.remove('open'));
    });
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
