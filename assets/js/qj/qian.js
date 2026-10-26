// =========================================================
// 日签 · 把今日日课画成一张 3:4 竖图（1080×1440），适合发小红书
// 首页日课卡的「生成日签」按钮触发；全在浏览器里用 canvas 画，
// 字体沿用站上的思源宋体 / 霞鹜文楷 / Archivo，二维码指向首页。
// =========================================================

(function () {
  'use strict';
  var Q = window.QJ;
  var btn = document.querySelector('.qj-rike-qian');
  if (!btn || !Q) return;

  var C = { bg: '#17131F', bg2: '#241D31', fg: '#EDEBF2', fg2: '#CFCAD9', mute: '#A39DB0', zi: '#7A5BC0', zi2: '#A994E0' };
  var TITLE = '"Noto Serif SC", "Songti SC", serif', BODY = '"LXGW WenKai TC", "Kaiti SC", serif', MARK = 'Archivo, "Helvetica Neue", Arial, sans-serif';

  // https://ohwowbill.com/ 的二维码（25×25，纠错 M），离线算好写死
  var QR = ['1111111000100100001111111', '1000001001001111001000001', '1011101010111001101011101', '1011101010100110001011101',
    '1011101010011000101011101', '1000001010000101001000001', '1111111010101010101111111', '0000000011110011100000000',
    '1011111001011110001111100', '1001110010100100100100010', '1110011101000111100111011', '1100010010100011001110001',
    '0100001010110110011010111', '1111110001001100110101010', '1001101010000011011111011', '1011000000101010010110001',
    '1000011101101101111110100', '0000000011100101100011000', '1111111000111110101010111', '1000001010010010100011000',
    '1011101011110001111110111', '1011101011001100111011111', '1011101010100110000001101', '1000001001001100110111001',
    '1111111010001010010111111'];

  // 卦辞在梅花的爻辞数据里，生成日签时才去取
  var yaoP = null;
  function yao() {
    if (!yaoP) {
      yaoP = new Promise(function (ok) {
        if (window.YAO_TEXT) return ok(window.YAO_TEXT);
        var s = document.createElement('script');
        s.src = '/meihua/data/yao.js';
        s.onload = function () { ok(window.YAO_TEXT || {}); };
        s.onerror = function () { ok({}); };
        document.head.appendChild(s);
      });
    }
    return yaoP;
  }
  function img(src) {
    return new Promise(function (ok) {
      var i = new Image();
      i.onload = function () { ok(i); };
      i.onerror = function () { ok(null); };
      i.src = src;
    });
  }

  function text(ctx, s, x, y, font, color, align, spacing) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    if ('letterSpacing' in ctx) ctx.letterSpacing = (spacing || 0) + 'px';
    ctx.fillText(s, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  // 中文逐字折行，最多 max 行，超出以省略号收尾
  function wrap(ctx, s, font, width, max) {
    ctx.font = font;
    var lines = [], cur = '';
    for (var i = 0; i < s.length; i++) {
      if (ctx.measureText(cur + s[i]).width > width && cur) { lines.push(cur); cur = ''; }
      cur += s[i];
    }
    if (cur) lines.push(cur);
    if (lines.length > max) { lines = lines.slice(0, max); lines[max - 1] = lines[max - 1].slice(0, -1) + '…'; }
    return lines;
  }

  function draw(r, gua, hero) {
    var W = 1080, H = 1440, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

    // 上半幅：阁图，往下渐隐进紫夜
    if (hero) {
      var ih = 640, s = Math.max(W / hero.width, ih / hero.height), dw = hero.width * s, dh = hero.height * s;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, ih); ctx.clip();
      ctx.globalAlpha = .78;
      ctx.drawImage(hero, (W - dw) / 2, (ih - dh) * .3, dw, dh);
      ctx.restore();
      var g = ctx.createLinearGradient(0, 0, 0, ih);
      g.addColorStop(0, 'rgba(23,19,31,.55)'); g.addColorStop(.4, 'rgba(23,19,31,.3)'); g.addColorStop(.85, C.bg); g.addColorStop(1, C.bg);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, ih + 2);
    }
    var glow = ctx.createRadialGradient(W / 2, 700, 40, W / 2, 700, 520);
    glow.addColorStop(0, 'rgba(122,91,192,.22)'); glow.addColorStop(1, 'rgba(122,91,192,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 200, W, 1000);

    // 页眉：字标与日期；右上竖排农历
    text(ctx, 'ohwowbill', 72, 104, '800 40px ' + MARK, C.fg, 'left');
    text(ctx, '潜蛟阁 · 日签', 72, 152, '600 30px ' + TITLE, C.fg2, 'left', 4);
    text(ctx, r.solar, 72, 196, '28px ' + BODY, C.mute, 'left', 2);
    ctx.font = '600 40px ' + TITLE; ctx.fillStyle = C.fg; ctx.textAlign = 'center';
    for (var k = 0; k < r.lunar.length; k++) ctx.fillText(r.lunar[k], W - 96, 110 + k * 50);

    // 卦象
    var c = r.cast, gw = 260, gh = 234, gx = (W - gw) / 2, gy = 500, gap = gh / 6, bar = gap * .56;
    text(ctx, r.shi + '一卦', W / 2, 470, '30px ' + BODY, C.fg2, 'center', 8);
    for (var j = 0; j < 6; j++) {
      var i = 5 - j, y = gy + j * gap + (gap - bar) / 2;
      ctx.fillStyle = i === c.dong - 1 ? C.zi2 : C.fg;
      if (c.lines[i]) ctx.fillRect(gx, y, gw, bar);
      else { ctx.fillRect(gx, y, gw * .42, bar); ctx.fillRect(gx + gw * .58, y, gw * .42, bar); }
    }

    text(ctx, r.ben.name, W / 2, 860, '900 88px ' + TITLE, C.fg, 'center', 14);
    text(ctx, Q.yaoName(c.lines, c.dong - 1) + '动' + (r.bian ? ' · 之' + r.bian.name : ''), W / 2, 916, '32px ' + BODY, C.zi2, 'center', 4);
    var y2 = 988;
    if (gua) {
      wrap(ctx, '「' + gua + '」', '40px ' + BODY, 860, 2).forEach(function (l) {
        text(ctx, l, W / 2, y2, '40px ' + BODY, C.fg2, 'center', 2); y2 += 54;
      });
    }
    wrap(ctx, r.ben.meaning, '30px ' + BODY, 820, 2).forEach(function (l) {
      text(ctx, l, W / 2, y2 + 4, '30px ' + BODY, C.mute, 'center', 1); y2 += 44;
    });

    // 一道金线
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--jin').trim() || '#D9AE4E';
    ctx.fillRect(W / 2 - 160, 1150, 320, 2);

    text(ctx, r.day + ' · 值' + r.jc + ' · ' + r.qi + ' · ' + r.moon.name, W / 2, 1204, '30px ' + BODY, C.fg2, 'center', 2);
    if (r.yi) text(ctx, '宜 ' + r.yi + '　　忌 ' + r.ji, W / 2, 1250, '28px ' + BODY, C.mute, 'center', 1);

    // 二维码：月白底，紫夜点
    var qs = 132, cell = qs / 29, qx = 72, qy = 1272;
    ctx.fillStyle = C.fg; ctx.fillRect(qx, qy, qs, qs);
    ctx.fillStyle = C.bg;
    QR.forEach(function (row, ry) {
      for (var cx = 0; cx < row.length; cx++) if (row[cx] === '1') ctx.fillRect(qx + (cx + 2) * cell, qy + (ry + 2) * cell, cell + .4, cell + .4);
    });
    text(ctx, '扫码入阁 · 起一卦', 232, 1322, '28px ' + BODY, C.fg2, 'left', 2);
    text(ctx, 'ohwowbill.com', 232, 1368, '500 30px ' + MARK, C.mute, 'left');

    // 落款印：紫府底，阴文「潜蛟子印」，右起竖读
    var sx = W - 72 - 112, sy = 1280;
    ctx.save();
    ctx.translate(sx + 56, sy + 56); ctx.rotate(-.06); ctx.translate(-56, -56);
    ctx.fillStyle = C.zi; ctx.fillRect(0, 0, 112, 112);
    ctx.font = '900 44px ' + TITLE; ctx.fillStyle = C.bg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    [['潜', 82, 31], ['蛟', 82, 81], ['子', 30, 31], ['印', 30, 81]].forEach(function (a) { ctx.fillText(a[0], a[1], a[2]); });
    ctx.restore();
    return cv;
  }

  var modal = null, url = null;
  function open(blob, name) {
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(blob);
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'qj-qian-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', '日签');
      modal.innerHTML = '<div class="qj-qian-card"><img alt="今日日签"/>' +
        '<div class="qj-qian-acts"><a class="qj-qian-dl">存图</a><button type="button" class="qj-qian-share">分享</button><button type="button" class="qj-qian-x">合上</button></div>' +
        '<p class="qj-qian-tip">手机上也可长按图片存入相册</p></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('.qj-qian-x')) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }
    modal.querySelector('img').src = url;
    var dl = modal.querySelector('.qj-qian-dl');
    dl.href = url; dl.download = name;
    var sh = modal.querySelector('.qj-qian-share'), file = null;
    try { file = new File([blob], name, { type: 'image/png' }); } catch (e) {}
    sh.hidden = !(file && navigator.canShare && navigator.canShare({ files: [file] }));
    sh.onclick = function () { navigator.share({ files: [file], title: '潜蛟阁 · 日签' }).catch(function () {}); };
    modal.classList.add('on');
    document.documentElement.classList.add('qj-noscroll');
    modal.querySelector('.qj-qian-x').focus();
  }
  function close() {
    if (!modal || !modal.classList.contains('on')) return;
    modal.classList.remove('on');
    document.documentElement.classList.remove('qj-noscroll');
    btn.focus();
  }

  btn.addEventListener('click', function () {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '研墨中……';
    var box = document.getElementById('qj-rike');
    Promise.all([Q.gua(), yao(), img(box.dataset.hero)]).then(function (res) {
      var r = Q.rikeOf(new Date(), res[0]);
      if (!r.ben) throw new Error('no gua');
      var gua = (res[1][r.ben.name] || {}).gua || '';
      var all = r.solar + r.lunar + r.ben.name + r.ben.meaning + gua + r.day + r.qi + r.yi + r.ji + r.jc + r.moon.name +
        r.shi + '一卦动之宜忌值扫码入阁起潜蛟阁日签子印·「」' + (r.bian ? r.bian.name : '') + '初九六二三四五上';
      // 网页字体按需分片下载，canvas 画之前要先把这些字取回来
      return Promise.all([
        document.fonts.load('900 88px "Noto Serif SC"', all), document.fonts.load('600 40px "Noto Serif SC"', all),
        document.fonts.load('40px "LXGW WenKai TC"', all), document.fonts.load('800 40px Archivo', 'ohwowbill.com')
      ]).catch(function () {}).then(function () { return draw(r, gua, res[2]); }).then(function (cv) {
        return new Promise(function (ok) { cv.toBlob(function (b) { ok([b, '潜蛟阁日签-' + Q.ymd(r.now) + '.png']); }, 'image/png'); });
      });
    }).then(function (a) {
      btn.textContent = '生成日签';
      open(a[0], a[1]);
    }, function () {
      btn.textContent = '这回没画成，再点一次';
    }).then(function () { btn.disabled = false; });
  });
})();
