// =========================================================
// 法宝库 · 分享图
// 把当前这一盘画成 3:4 竖图（1080×1440，适合小红书），可存可分享；图上的二维码扫了回到这一盘。
// 样子跟首页日签（assets/js/qj/qian.js）一路：紫夜底、月白字、金只落在要紧的那一句。
// fabao.js 的 Fabao.share(opt) 用到时才取本文件。opt 里不给的，从页面上取：
//   印（.fb-head .fb-seal）、法宝名（.fb-title）、要紧一句（.fb-key，或白话卡第一行）、几行（白话卡 .bh .r）。
// opt = { seal, tool, title, key, lines: ['…' | ['标签', '…']], meta, url, qrLabel }
//   url 默认是当前网址（去掉名字参数 n，免得人名跟着图到处走）；命部各盘传不带生辰的网址，qrLabel 改说「扫码也排一盘」。
// =========================================================
(function () {
  'use strict';
  const F = window.Fabao || {};
  const C = { bg: '#17131F', rule: '#3E3452', fg: '#EDEBF2', fg2: '#CFCAD9', mute: '#A39DB0', faint: '#857E96', zi: '#7A5BC0', zi2: '#A994E0', jin: '#D9AE4E' };
  const TITLE = '"Noto Serif SC", "Songti SC", serif', BODY = '"LXGW WenKai TC", "Kaiti SC", serif', MARK = 'Archivo, "Helvetica Neue", Arial, sans-serif';
  const W = 1080, H = 1440, X = 84, CW = W - X * 2, FOOT = 1180;
  const NO_HEAD = '，。、；：？！）」』》〉…·%,.;:!?)';     // 这些不放在行首
  const txt = el => el ? (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim() : '';
  const visible = el => !!(el && el.getClientRects().length && !el.closest('[hidden]'));

  // —— 从页面上取 ——
  function scrape() {
    const o = {};
    o.seal = [...txt(document.querySelector('.fb-head .fb-seal'))][0] || '';
    const t = document.querySelector('.fb-head .fb-title');
    if (t) o.tool = [...t.childNodes].filter(n => n.nodeType === 3).map(n => n.nodeValue).join('').trim() || txt(t);
    const key = [...document.querySelectorAll('.fb-key')].find(visible);
    if (key && txt(key)) o.key = txt(key);
    const rows = [...document.querySelectorAll('.bh .r')].filter(visible);
    o.lines = rows.slice(0, 9).map(r => {
      const i = r.querySelector(':scope > i'), s = r.querySelector(':scope > span');
      if (!i) return txt(r);
      return [txt(i), s ? txt(s) : txt(r).slice(txt(i).length).trim()];
    });
    if (!o.key && o.lines.length) { const f = o.lines.shift(); o.key = Array.isArray(f) ? f[1] : f; }
    // 没有白话卡的（流注、运气、长生……）：拿「此刻」面板里的几行
    if (!o.lines.length) o.lines = [...document.querySelectorAll('.fb-now-info .fb-note, .fb-now-info .fb-when')].filter(visible).map(txt).filter(Boolean).slice(0, 5);
    return o;
  }
  function shareURL(u) {
    try {
      const url = new URL(u || location.href, location.href);
      url.searchParams.delete('n');
      url.hash = '';
      return url.toString();
    } catch (e) { return location.origin + '/tools/'; }
  }
  const p2 = n => String(n).padStart(2, '0');
  function defaultMeta() {
    const d = new Date(), dh = F.dayHour ? F.dayHour(d) : null;
    return `${d.getFullYear()}.${p2(d.getMonth() + 1)}.${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}${dh ? ` · ${dh.day.name}日${dh.hour.name}时` : ''}`;
  }

  // —— 画 ——
  function setFont(ctx, font, spacing) {
    ctx.font = font;
    if ('letterSpacing' in ctx) ctx.letterSpacing = (spacing || 0) + 'px';
  }
  function text(ctx, s, x, y, font, color, align, spacing) {
    setFont(ctx, font, spacing);
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.fillText(s, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  // 中文逐字折行；逗号句号之类不落到行首；最多 max 行，超出以省略号收尾
  function wrap(ctx, s, font, width, max, spacing) {
    setFont(ctx, font, spacing);
    const out = [];
    let cur = '';
    for (const c of String(s == null ? '' : s)) {
      if (c === '\n') { out.push(cur); cur = ''; continue; }
      if (cur && ctx.measureText(cur + c).width > width && NO_HEAD.indexOf(c) < 0) { out.push(cur); cur = c === ' ' ? '' : c; continue; }
      cur += c;
    }
    if (cur) out.push(cur);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    if (max && out.length > max) { out.length = max; out[max - 1] = [...out[max - 1]].slice(0, -1).join('') + '…'; }
    return out;
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function draw(o, q) {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    // 夜空：两团紫光，几点星
    let g = ctx.createRadialGradient(W * .86, -80, 30, W * .86, -80, 820);
    g.addColorStop(0, 'rgba(122,91,192,.32)'); g.addColorStop(1, 'rgba(122,91,192,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(-80, H + 80, 30, -80, H + 80, 760);
    g.addColorStop(0, 'rgba(122,91,192,.18)'); g.addColorStop(1, 'rgba(122,91,192,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(237,235,242,${(.05 + rnd() * .15).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, rnd() * 1.7 + .4, 0, 6.3); ctx.fill();
    }

    // 水印：法宝的印字，大而淡，压在右下（字少的页面不显空）
    ctx.save();
    ctx.globalAlpha = .07; ctx.fillStyle = C.zi2; ctx.font = '900 560px ' + TITLE; ctx.textAlign = 'right';
    ctx.fillText(o.seal || '术', W - 36, FOOT - 46);
    ctx.restore();

    // 页眉：法宝的印、名字；右上字标
    const S = 116, sy = 84;
    ctx.save();
    ctx.translate(X + S / 2, sy + S / 2); ctx.rotate(-.05);
    ctx.fillStyle = C.zi; rrect(ctx, -S / 2, -S / 2, S, S, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; rrect(ctx, -S / 2 + 7, -S / 2 + 7, S - 14, S - 14, 7); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '900 66px ' + TITLE; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(o.seal || '术', 0, 4);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
    text(ctx, o.tool || '法宝库', X + S + 34, sy + 60, '600 50px ' + TITLE, C.fg, 'left', 8);
    text(ctx, '潜蛟阁 · 法宝库', X + S + 34, sy + 106, '30px ' + BODY, C.mute, 'left', 4);
    text(ctx, 'ohwowbill', W - X, sy + 44, '800 32px ' + MARK, C.fg2, 'right');

    let y = sy + S + 120;
    if (o.title) {
      wrap(ctx, o.title, '600 60px ' + TITLE, CW, 2, 6).forEach(l => { text(ctx, l, X, y, '600 60px ' + TITLE, C.fg, 'left', 6); y += 82; });
      y += 8;
    }
    // 要紧的一句：一道金线引出，全图唯一的金
    if (o.key) {
      ctx.fillStyle = C.jin; ctx.fillRect(X, y - 22, 72, 4);
      y += 50;
      wrap(ctx, o.key, '600 46px ' + TITLE, CW, 4, 3).forEach(l => { text(ctx, l, X, y, '600 46px ' + TITLE, C.jin, 'left', 3); y += 66; });
      y += 22;
    }
    // 几行：带标签的左边一栏标签
    const LAB = 156, BF = '34px ' + BODY;
    for (const ln of (o.lines || [])) {
      if (y > FOOT - 30) break;
      const pair = Array.isArray(ln), s = pair ? ln[1] : ln;
      if (!s) continue;
      const ls = wrap(ctx, s, BF, pair ? CW - LAB : CW, 3, 1);
      if (pair) text(ctx, ln[0], X, y - 2, '600 28px ' + TITLE, C.faint, 'left', 4);
      for (const l of ls) {
        if (y > FOOT - 10) break;
        text(ctx, l, pair ? X + LAB : X, y, BF, C.fg2, 'left', 1);
        y += 52;
      }
      y += 14;
    }

    // 页脚：细线；二维码（扫了回到这一盘）、时间、网址；右下落款印
    ctx.fillStyle = C.rule; ctx.fillRect(X, FOOT + 6, CW, 2);
    const qs = 196, qy = FOOT + 46;
    let tx = X;
    if (q) {
      const cell = qs / (q.n + 8);
      ctx.fillStyle = C.fg; ctx.fillRect(X, qy, qs, qs);
      ctx.fillStyle = C.bg;
      for (let r = 0; r < q.n; r++) for (let c = 0; c < q.n; c++) {
        if (q.dark(r, c)) ctx.fillRect(X + (c + 4) * cell, qy + (r + 4) * cell, cell + .5, cell + .5);
      }
      tx = X + qs + 34;
    }
    wrap(ctx, o.meta || '', '28px ' + BODY, W - tx - X - 150, 2, 2).forEach((l, i) => text(ctx, l, tx, qy + 44 + i * 40, '28px ' + BODY, C.fg2, 'left', 2));
    if (q) text(ctx, o.qrLabel || '扫码看这一盘', tx, qy + 132, '28px ' + BODY, C.mute, 'left', 3);
    text(ctx, 'ohwowbill.com', tx, qy + 182, '500 30px ' + MARK, C.mute, 'left');
    // 落款印：紫府底，阴文「潜蛟子印」，右起竖读
    const ss = 104, sx = W - X - ss, sy2 = qy + 40;
    ctx.save();
    ctx.translate(sx + ss / 2, sy2 + ss / 2); ctx.rotate(-.06); ctx.translate(-ss / 2, -ss / 2);
    ctx.fillStyle = C.zi; ctx.fillRect(0, 0, ss, ss);
    ctx.font = '900 40px ' + TITLE; ctx.fillStyle = C.bg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    [['潜', 76, 29], ['蛟', 76, 75], ['子', 28, 29], ['印', 28, 75]].forEach(a => ctx.fillText(a[0], a[1], a[2]));
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
    text(ctx, '术数之言 · 聊备参考', W - X, H - 34, '24px ' + BODY, C.faint, 'right', 4);
    return cv;
  }

  // 网页字体按需分片下载：canvas 画之前先把要用的字取回来（最多等三秒半，断网就用本机字体）
  function fontsFor(all) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const p = Promise.all([
      document.fonts.load('900 66px "Noto Serif SC"', all), document.fonts.load('600 50px "Noto Serif SC"', all),
      document.fonts.load('34px "LXGW WenKai TC"', all),
      document.fonts.load('800 32px Archivo', 'ohwowbill'), document.fonts.load('500 30px Archivo', 'ohwowbill.com')
    ]).catch(() => {});
    return Promise.race([p, new Promise(ok => setTimeout(ok, 3500))]);
  }

  // —— 弹层：图、存图、分享、合上 ——
  let modal = null, url = null, back = null;
  function show(blob, name) {
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(blob);
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'fb-modal fb-share';
      modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', '分享图');
      modal.innerHTML = '<div class="fb-modal-card"><img class="pic" alt="这一盘的分享图">' +
        '<div class="fb-modal-acts"><a class="fb-btn primary dl">存图</a><button type="button" class="fb-btn sh">分享</button><button type="button" class="fb-btn ghost x">合上</button></div>' +
        '<p class="fb-fine">手机上也可长按图片存进相册；图上的二维码扫了回到这一盘</p></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('.x')) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }
    modal.querySelector('img').src = url;
    const dl = modal.querySelector('.dl');
    dl.href = url; dl.download = name;
    const sh = modal.querySelector('.sh');
    let file = null;
    try { file = new File([blob], name, { type: 'image/png' }); } catch (e) { /* 旧浏览器 */ }
    sh.hidden = !(file && navigator.canShare && navigator.canShare({ files: [file] }));
    sh.onclick = () => navigator.share({ files: [file], title: name.replace(/\.png$/, '') }).catch(() => {});
    back = document.activeElement;
    modal.classList.add('on');
    document.documentElement.classList.add('fb-noscroll');
    modal.querySelector('.x').focus();
  }
  function close() {
    if (!modal || !modal.classList.contains('on')) return;
    modal.classList.remove('on');
    document.documentElement.classList.remove('fb-noscroll');
    if (back && back.focus) back.focus();
  }

  let busy = false;
  function open(opt) {
    if (busy) return Promise.resolve();
    busy = true;
    const o = scrape();
    Object.keys(opt || {}).forEach(k => { if (opt[k] != null && opt[k] !== '') o[k] = opt[k]; });
    if (!o.meta) o.meta = defaultMeta();
    const link = shareURL(o.url);
    const all = [o.seal, o.tool, o.title, o.key, o.meta, o.qrLabel].concat([].concat.apply([], (o.lines || []).map(l => [].concat(l)))).join('') +
      '潜蛟阁法宝库扫码看这一盘术数之言聊备参考潜蛟子印…·';
    if (F.toast) F.toast('研墨中……', 2500);
    const qp = F.qr ? F.qr(link, 'L').catch(() => null) : Promise.resolve(null);
    return Promise.all([fontsFor(all), qp]).then(r => {
      const cv = draw(o, r[1]);
      return new Promise(ok => cv.toBlob(ok, 'image/png'));
    }).then(blob => {
      if (!blob) throw new Error('blob');
      const d = new Date();
      show(blob, `潜蛟阁-${(o.tool || '法宝库').replace(/[\\/:*?"<>|\s]/g, '')}-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}.png`);
    }).catch(() => { if (F.toast) F.toast('这回没画成，再点一次'); }).then(() => { busy = false; });
  }

  window.FabaoShare = { open, draw, scrape };
})();
