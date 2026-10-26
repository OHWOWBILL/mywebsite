// =========================================================
// 控制台彩蛋：打开开发者工具的人，会看见一只鼯鼠和一道题。
// 答对了才算出内室的门牌（门牌由答案推出，脚本里不写），
// 内室页面见 content/neishi-*/，不进任何列表、搜索与站点地图。
// =========================================================

(function () {
  'use strict';
  if (!window.console || !console.log) return;

  var art = [
    '         /\\_/\\',
    '   ____ ( o.o ) ____',
    '  /    \\ > ^ < /    \\',
    ' /_/\\__/`-----\'\\__/\\_\\',
    '            ~~'
  ].join('\n');
  var S = {
    art: 'color:#A994E0;font:12px/1.25 ui-monospace,Menlo,monospace',
    h: 'color:#EDEBF2;font:600 15px/2 "Noto Serif SC",serif;letter-spacing:.2em',
    p: 'color:#CFCAD9;font:13px/1.9 "LXGW WenKai TC",serif',
    k: 'color:#D9AE4E;font:13px/1.9 ui-monospace,Menlo,monospace'
  };
  console.log('%c' + art, S.art);
  console.log('%c潜蛟阁 · 内室', S.h);
  console.log('%c阁主本相，乃山中一鼯鼠，夜飞昼伏，俗呼寒号鸟。\n其所遗之物，入药能活血止痛，本草有名。\n问：此药何名？', S.p);
  console.log('%c在此输入  答(\'药名\')  以开内室。打不出中文可写  da(\'拼音\')', S.k);

  var HASH = 'b699bce4a84ca6025bc6398c4dc11d7054854b5a24c6e739d19c7575da356cb2';
  var tries = 0;
  var HINT = ['非也。提示：名中有一数。', '非也。再提示：其数合五行。', '非也。末一字从「月」，义为膏。'];

  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  function sha(s) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(hex); }

  function da(ans) {
    if (!(window.crypto && crypto.subtle)) return '此处不是 https，开不了门；换 https://ohwowbill.com 再试。';
    var s = String(ans == null ? '' : ans).replace(/[\s'"「」『』《》]/g, '').replace(/靈/g, '灵').toLowerCase();
    if (s === 'wulingzhi') s = '五灵脂';
    sha(s).then(function (h) {
      if (h !== HASH) {
        console.log('%c' + HINT[Math.min(tries++, HINT.length - 1)], S.p);
        return;
      }
      console.log('%c是了。门开了。', S.h);
      return sha('qianjiao:' + s).then(function (k) {
        setTimeout(function () { location.href = '/neishi-' + k.slice(0, 10) + '/'; }, 900);
      });
    });
    return '……';
  }
  window['答'] = da;
  window.da = da;

  // 内室的入室签：随机数起一卦
  var slip = document.querySelector('[data-slip]');
  if (slip && window.QJ) {
    var rnd = function (n) { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
    var up = window.QJ.BAGUA[rnd(8) + 1].l, lo = window.QJ.BAGUA[rnd(8) + 1].l, dong = rnd(6) + 1;
    var lines = lo.concat(up);
    window.QJ.gua().then(function (list) {
      var g = window.QJ.findGua(list, lines);
      if (!g) return;
      slip.innerHTML = '<span class="qj-slip-k">入室签</span>' + window.QJ.guaSVG(lines, dong, 64) +
        '<b>' + g.name + '</b><span>' + window.QJ.yaoName(lines, dong - 1) + '动 · ' + g.meaning + '</span>';
    });
  }
})();
