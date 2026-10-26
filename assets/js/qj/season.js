// =========================================================
// 节气换肤 · 时令粒子
// 「一处金」随四季微变色（head 里先按太阳黄经写好 html[data-season]，
// 见 extend-head.html；色值在 custom.css「十一 节气」）。
// 这里只管星空画布上的时令粒子：
//   立春至惊蛰 细雨 · 春分至谷雨 落花 · 夏 萤火 · 秋 落叶 · 冬 飘雪
// 由 extend-footer.html 的星空循环每帧调用 qjSeason.draw。
// 网址带 ?jieqi=冬至 可预览。
// =========================================================

(function () {
  'use strict';
  var Q = window.QJ;
  if (!Q) return;
  var f = Q.forcedJieqi(), i = f === null ? Math.floor(Q.sunLon(new Date()) / 15) : f;
  var kind = { spring: (i >= 21 ? 'rain' : 'petal'), summer: 'firefly', autumn: 'leaf', winter: 'snow' }[Q.season(i)];

  var BASE = { rain: 70, petal: 34, firefly: 26, leaf: 26, snow: 70 };
  var parts = [], W = 0, H = 0;
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function make(top) {
    var p = { x: rnd(0, W), y: top ? rnd(-40, -10) : rnd(0, H), ph: rnd(0, 6.283) };
    if (kind === 'rain') { p.len = rnd(14, 26); p.v = rnd(7, 10); p.a = rnd(.14, .26); }
    else if (kind === 'petal') { p.r = rnd(4, 7); p.v = rnd(.45, 1.0); p.rot = rnd(0, 6.283); p.vr = rnd(-.03, .03); p.a = rnd(.4, .65); }
    else if (kind === 'firefly') { p.y = rnd(H * .35, H); p.vx = rnd(-.25, .25); p.vy = rnd(-.2, .1); p.a = rnd(.5, .85); }
    else if (kind === 'leaf') { p.s = rnd(6, 10); p.v = rnd(.55, 1.15); p.rot = rnd(0, 6.283); p.vr = rnd(-.035, .035); p.a = rnd(.3, .5); p.amber = Math.random() < .4; }
    else { p.r = rnd(1.2, 3.2); p.v = rnd(.3, .95); p.a = rnd(.45, .8); }
    return p;
  }
  function fit(w, h) {
    if (w === W && h === H) return;
    W = w; H = h;
    var n = Math.round(BASE[kind] * Math.min(1, Math.max(.45, W / 1400)));
    parts = [];
    for (var k = 0; k < n; k++) parts.push(make(false));
  }

  function draw(ctx, w, h) {
    fit(w, h);
    var t = performance.now() / 1000;
    for (var k = 0; k < parts.length; k++) {
      var p = parts[k];
      if (kind === 'firefly') {
        p.x += p.vx + Math.sin(t * .7 + p.ph) * .25; p.y += p.vy + Math.cos(t * .5 + p.ph) * .2;
        if (p.x < -10 || p.x > W + 10 || p.y < H * .2 || p.y > H + 10) { parts[k] = make(false); continue; }
        var glow = p.a * (.3 + .7 * (.5 + .5 * Math.sin(t * 1.3 + p.ph)));
        ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, 6.283); ctx.fillStyle = 'rgba(214,206,122,' + (glow * .22) + ')'; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 6.283); ctx.fillStyle = 'rgba(232,222,140,' + glow + ')'; ctx.fill();
        continue;
      }
      if (kind === 'rain') {
        p.x -= p.v * .22; p.y += p.v;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.len * .22, p.y - p.len);
        ctx.strokeStyle = 'rgba(207,202,217,' + p.a + ')'; ctx.lineWidth = 1; ctx.stroke();
      } else {
        p.y += p.v; p.x += Math.sin(t * .8 + p.ph) * (kind === 'snow' ? .35 : .6);
        if (p.rot !== undefined) p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y);
        if (kind === 'petal') {
          ctx.rotate(p.rot); ctx.scale(1, .55 + .35 * Math.sin(t * 2 + p.ph));
          ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .62, 0, 0, 6.283);
          ctx.fillStyle = 'rgba(222,200,245,' + p.a + ')'; ctx.fill();
        } else if (kind === 'leaf') {
          ctx.rotate(p.rot); ctx.scale(1, .6 + .4 * Math.sin(t * 1.6 + p.ph));
          ctx.beginPath(); ctx.moveTo(-p.s, 0);
          ctx.quadraticCurveTo(0, -p.s * .6, p.s, 0); ctx.quadraticCurveTo(0, p.s * .6, -p.s, 0);
          ctx.fillStyle = p.amber ? 'rgba(201,128,74,' + p.a + ')' : 'rgba(217,174,78,' + p.a + ')'; ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283);
          ctx.fillStyle = 'rgba(237,235,242,' + p.a + ')'; ctx.fill();
        }
        ctx.restore();
      }
      if (p.y > H + 30 || p.x < -40 || p.x > W + 40) parts[k] = make(true);
    }
  }

  window.qjSeason = { kind: kind, jieqi: Q.JIEQI[i], draw: draw };
})();
