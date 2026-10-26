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
    mingbu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 6.5l1.4 4.1 4.1 1.4-4.1 1.4-1.4 4.1-1.4-4.1-4.1-1.4 4.1-1.4z"/></svg>'
  };
  const TOOLS = [
    { id: 'meihua', name: '梅花', href: '/meihua/' },
    { id: 'changsheng', name: '十二长生', short: '长生', href: '/changsheng/' },
    { id: 'qimen', name: '奇门手记', short: '奇门', href: '/qimen/' },
    { id: 'mingbu', name: '命部', href: '/mingbu/' }   // 口令加密页，未解禁时为锁屏
  ];

  function mountShell() {
    const cur = document.body.dataset.tool;
    const top = document.createElement('header');
    top.className = 'fb-top';
    top.innerHTML = `
      <a class="fb-back" href="/tools/" title="回法宝库">
        <span class="mark">ohwowbill</span><span class="ge">潜蛟阁</span><span class="ku">法宝库</span>
      </a>
      <nav class="fb-tabs" aria-label="法宝">
        ${TOOLS.map(t => `
          <a class="fb-tab${t.id === cur ? ' on' : ''}" href="${t.href}"${t.id === cur ? ' aria-current="page"' : ''}>
            ${ICONS[t.id]}<span class="full">${t.name}</span>
          </a>`).join('')}
      </nav>`;
    document.body.insertBefore(top, document.body.firstChild);
    // 手机底栏字少一点
    if (window.matchMedia('(max-width: 860px)').matches) {
      top.querySelectorAll('.fb-tab .full').forEach((el, i) => { if (TOOLS[i].short) el.textContent = TOOLS[i].short; });
    }
  }

  let toastEl = null, toastTimer = 0;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'fb-toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
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

  // 「此刻」时间控件：datetime 输入 + 「此刻」按钮，改动时回调 onChange(date, isNow)
  function bindWhen(input, nowBtn, onChange) {
    const now = () => { const d = new Date(); d.setSeconds(0, 0); return d; };
    input.value = toLocalInput(now());
    input.addEventListener('change', () => {
      const d = new Date(input.value);
      if (!isNaN(d)) onChange(d, false);
    });
    nowBtn.addEventListener('click', () => {
      const d = now();
      input.value = toLocalInput(d);
      onChange(d, true);
    });
    return now();
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

  window.Fabao = { GAN, ZHI, dayHour, toLocalInput, fmt, bindWhen, toast, copy };
  mountShell();
})();
