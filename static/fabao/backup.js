// =========================================================
// 法宝库 · 本机存档：导出、导入、扫码带到另一台设备
// 盘与人都只存在这台设备的浏览器里（localStorage）；这里把它们打成一份，存成文件或装进二维码。
// 二维码里是一个网址 https://ohwowbill.com/tools/#bk=…（# 后面的不发给服务器），
// 另一台设备扫了打开法宝库大堂，问一声再并进去：同一个人、同一条记录不重复，设置以带来的为准。
// fabao.js 的大堂（mountKu）用到时才取本文件。
// =========================================================
(function () {
  'use strict';
  const F = window.Fabao, APP = 'ohwowbill-fabao', PEOPLE = 'mingbu.people.v1';
  // 不带走的：解禁口令（lock_key_*）、阁主模式、本标签页的小记号
  const SKIP = /^(lock_key_|qj-owner$|qj-ge|qj-noscroll|qj-opened)/;
  const KEY_OK = /^[A-Za-z][\w.\-]{0,63}$/;
  const QR_MAX = 1800;   // # 后面超过这么多字，二维码太密，手机屏上扫不出来

  function collect(lite) {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || SKIP.test(k) || !KEY_OK.test(k)) continue;
      const v = localStorage.getItem(k);
      // 精简版只带人和设置，不带一条条的盘例
      if (lite && k !== PEOPLE && isList(v)) continue;
      data[k] = v;
    }
    return { app: APP, v: 1, at: new Date().toISOString(), data };
  }
  function isList(v) { try { return Array.isArray(JSON.parse(v)); } catch (e) { return false; } }
  function sum(data) {
    let people = 0, recs = 0, keys = 0;
    Object.keys(data || {}).forEach(k => {
      keys++;
      let v = null;
      try { v = JSON.parse(data[k]); } catch (e) { return; }
      if (!Array.isArray(v)) return;
      if (k === PEOPLE) people = v.length; else recs += v.length;
    });
    return { people, recs, keys, text: [people ? people + ' 个人' : '', recs ? recs + ' 条盘例与记录' : '', keys + ' 项存档与设置'].filter(Boolean).join('、') };
  }

  // —— 打包：deflate 压一下再 base64url（浏览器自带 CompressionStream；太旧的不压） ——
  function b64u(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64u(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  }
  function pipe(bytes, Stream) {
    const st = new Stream('deflate-raw'), w = st.writable.getWriter();
    w.write(bytes); w.close();
    return new Response(st.readable).arrayBuffer().then(b => new Uint8Array(b));
  }
  function pack(obj) {
    const raw = new TextEncoder().encode(JSON.stringify(obj));
    if (!window.CompressionStream) return Promise.resolve('j' + b64u(raw));
    return pipe(raw, CompressionStream).then(z => 'z' + b64u(z), () => 'j' + b64u(raw));
  }
  function unpack(s) {
    return Promise.resolve().then(() => {
      const bytes = unb64u(s.slice(1));
      if (s[0] === 'j') return bytes;
      if (s[0] !== 'z') throw new Error('看不懂这一码');
      if (!window.DecompressionStream) throw new Error('这台设备的浏览器太旧，解不开；请在电脑上「导出」文件再传过来');
      return pipe(bytes, DecompressionStream);
    }).then(raw => JSON.parse(new TextDecoder().decode(raw)));
  }

  // —— 并进来 ——
  // 人按生辰（时刻 + 男女）认，别的列表按 id、没有 id 的按整条内容认；不是列表的设置以带来的为准
  function mergeList(k, a, b) {
    const key = k === PEOPLE
      ? x => (x && x.when ? x.when + '|' + (x.male === false ? 0 : 1) : JSON.stringify(x))
      : x => (x && typeof x === 'object' && x.id != null ? 'id:' + x.id : JSON.stringify(x));
    const seen = new Set(a.map(key)), out = a.slice();
    let n = 0;
    b.forEach(x => { const kk = key(x); if (!seen.has(kk)) { seen.add(kk); out.push(x); n++; } });
    return { out, n };
  }
  function apply(obj) {
    let added = 0, set = 0;
    Object.keys(obj.data).forEach(k => {
      const v = obj.data[k];
      if (SKIP.test(k) || !KEY_OK.test(k) || typeof v !== 'string' || v.length > 2e6) return;
      const cur = localStorage.getItem(k);
      if (cur === v) return;
      if (cur == null) { localStorage.setItem(k, v); set++; return; }
      let A = null, B = null;
      try { A = JSON.parse(cur); B = JSON.parse(v); } catch (e) { /* 不是 JSON：当设置看 */ }
      if (Array.isArray(A) && Array.isArray(B)) {
        const r = mergeList(k, A, B);
        if (r.n) { localStorage.setItem(k, JSON.stringify(r.out)); added += r.n; }
      } else { localStorage.setItem(k, v); set++; }
    });
    return { added, set };
  }
  function valid(obj) { return obj && obj.app === APP && obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data); }
  function confirmApply(obj, how) {
    if (!valid(obj)) { F.toast('这不是法宝库的存档', 3000); return false; }
    const s = sum(obj.data);
    if (!confirm(`${how}：${s.text}。\n\n并进这台设备？同一个人、同一条记录不会重复；设置以带来的为准。`)) return false;
    let r;
    try { r = apply(obj); } catch (e) { F.toast('没并成：这台设备的浏览器存不下（无痕模式？）', 4000); return false; }
    F.toast(r.added || r.set ? `并好了：新添 ${r.added} 条，更新 ${r.set} 项` : '两边本来就一样，没有要并的', 3200);
    if (F.people && F.people.refresh) F.people.refresh();
    document.dispatchEvent(new CustomEvent('fabao:store'));
    return true;
  }

  const p2 = n => String(n).padStart(2, '0');
  const ymd = () => { const d = new Date(); return `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`; };

  function exportFile() {
    const obj = collect(false);
    const blob = new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `法宝库存档-${ymd()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    F.toast('已存成文件：' + sum(obj.data).text, 3600);
  }
  function importFile(file) {
    if (!file) return;
    if (file.size > 8e6) { F.toast('文件太大，不像法宝库的存档'); return; }
    const rd = file.text ? file.text() : new Promise((ok, bad) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = bad; r.readAsText(file); });
    rd.then(t => {
      let obj = null;
      try { obj = JSON.parse(t); } catch (e) { F.toast('读不懂这个文件'); return; }
      confirmApply(obj, `从文件「${file.name}」带来`);
    }, () => F.toast('读不出这个文件'));
  }
  function fromHash() {
    const s = location.hash.replace(/^#bk=/, '');
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
    return unpack(decodeURIComponent(s)).then(obj => { confirmApply(obj, '扫码带来'); }, e => F.toast((e && e.message) || '这一码没读懂', 4000));
  }

  // —— 扫码带走：一个弹层，二维码 + 复制链接 ——
  let modal = null, back = null;
  function qr() {
    let lite = false;
    return pack(collect(false)).then(p => {
      if (p.length <= QR_MAX) return p;
      lite = true;
      return pack(collect(true));
    }).then(p => {
      if (p.length > QR_MAX) { F.toast('存的人太多，二维码装不下；请用「导出」存成文件再传过去', 4600); return; }
      const link = location.origin + '/tools/#bk=' + p;
      return F.qr(link, 'L').then(q => show(q, link, lite));
    }).catch(() => F.toast('二维码没做成，联网后再试'));
  }
  function show(q, link, lite) {
    const s = sum(collect(lite).data);
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'fb-modal fb-bk';
      modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', '扫码带走');
      modal.innerHTML = '<div class="fb-modal-card"><h2>扫码带走</h2><canvas class="qr" aria-label="二维码"></canvas>' +
        '<p class="fb-note" style="text-align:center"></p>' +
        '<div class="fb-modal-acts"><button type="button" class="fb-btn cp">复制链接</button><button type="button" class="fb-btn ghost x">合上</button></div>' +
        '<p class="fb-fine">用另一台设备的相机扫一下，打开后点「确定」就并过去了；也可以把链接发给自己。码里只有你存的盘与人，不经任何服务器。</p></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('.x')) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }
    // 黑点白底、四格静区；按屏幕像素画清楚
    const cell = Math.max(3, Math.floor(640 / (q.n + 8))), cv = modal.querySelector('canvas'), size = (q.n + 8) * cell;
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000';
    for (let r = 0; r < q.n; r++) for (let c = 0; c < q.n; c++) if (q.dark(r, c)) ctx.fillRect((c + 4) * cell, (r + 4) * cell, cell, cell);
    modal.querySelector('.fb-note').textContent = '码里装着：' + s.text + (lite ? '。盘例太多装不下，这一码只带人和设置；全部请用「导出」' : '');
    modal.querySelector('.cp').onclick = () => F.copy(link, '链接已复制，发到另一台设备上打开即可');
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

  window.FabaoBackup = { collect, sum, pack, unpack, apply, mergeList, exportFile, importFile, fromHash, qr };
})();
