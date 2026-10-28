// =========================================================
// 文章页四件：阅读金线、发文日卦印、竖排阅读、文末落款印
// 只在文章页（head 里有 <meta name="qj-post">，见 extend-head-uncached.html）动手。
// =========================================================

(function () {
  'use strict';
  var Q = window.QJ;
  var meta = document.querySelector('meta[name="qj-post"]');
  var body = document.querySelector('.article-content');
  if (!meta || !body || !Q) return;
  var head = document.getElementById('single_header');
  var still = Q.still;

  // ---------- 阅读金线：页顶一丝金线随读随长，线头一只鼯鼠在滑翔 ----------
  var WU = '<svg class="qj-read-wu" viewBox="0 0 32 20" aria-hidden="true">' +
    '<ellipse cx="5.5" cy="10" rx="5.5" ry="2.1"/>' +
    '<path d="M22 2.2Q16 6.6 10.2 3.4Q12.2 10 10.2 16.6Q16 13.4 22 17.8Q20.4 10 22 2.2Z"/>' +
    '<ellipse cx="16.5" cy="10" rx="6.2" ry="3.1"/><circle cx="24.2" cy="10" r="2.7"/>' +
    '<path d="M23.4 7.6l.9-2.1 1 2zM23.4 12.4l.9 2.1 1-2z"/></svg>';
  var bar = document.createElement('div');
  bar.className = 'qj-read';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<i class="qj-read-line"></i>' + WU;
  document.body.appendChild(bar);

  var vert = false, ticking = false;
  function progress() {
    if (vert) {
      var max = body.scrollWidth - body.clientWidth;
      return max > 0 ? Math.abs(body.scrollLeft) / max : 1;
    }
    var r = body.getBoundingClientRect(), vh = window.innerHeight;
    var span = r.height - vh * 0.6;
    return span > 0 ? (vh * 0.4 - r.top) / span : (r.top < vh * 0.4 ? 1 : 0);
  }
  function paint() {
    ticking = false;
    var p = Math.max(0, Math.min(1, progress()));
    bar.style.setProperty('--p', p.toFixed(4));
    bar.classList.toggle('on', p > 0.002);
    bar.classList.toggle('landed', p > 0.995);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  body.addEventListener('scroll', onScroll, { passive: true });
  paint();

  // ---------- 发文日卦印 + 竖排按钮，放在标题下的日期行之后 ----------
  var tools = document.createElement('div');
  tools.className = 'qj-post-tools';
  var metaRow = head && head.querySelector('h1') && head.querySelector('h1').nextElementSibling;
  if (metaRow) metaRow.after(tools); else if (head) head.appendChild(tools);

  var d = meta.content.split('-').map(Number);
  var when = new Date(d[0], d[1] - 1, d[2], 12, 0);   // 只记了日子的文章，按午时起卦
  var c = Q.cast(when);
  if (c) {
    Q.gua().then(function (list) {
      var ben = Q.findGua(list, c.lines), bian = Q.findGua(list, c.bian);
      if (!ben) return;
      var a = document.createElement('a');
      a.className = 'qj-gua-mark';
      a.href = '/meihua/?t=' + meta.content + 'T12:00';
      a.title = '以发文日（' + c.lunar.text + '）午时梅花起卦：本卦' + ben.name + '，' +
        Q.yaoName(c.lines, c.dong - 1) + '动' + (bian ? '，之' + bian.name : '') + '。点开看全盘';
      a.innerHTML = Q.guaSVG(c.lines, c.dong, 18) + '<span>发文日卦</span><b>' + ben.name + '</b>';
      tools.insertBefore(a, tools.firstChild);
    });
  }

  var vbtn = document.createElement('button');
  vbtn.type = 'button';
  vbtn.className = 'qj-vert-btn';
  vbtn.title = '竖排阅读：右起直行，横向翻阅';
  tools.appendChild(vbtn);

  function setVert(on, jump) {
    vert = on;
    body.classList.toggle('qj-vert', on);
    if (body.parentElement) body.parentElement.classList.toggle('qj-vert-wrap', on);
    document.documentElement.classList.toggle('qj-vert-on', on);
    vbtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    vbtn.innerHTML = on ? '<span class="v">横</span>改横排' : '<span class="v">竖</span>改竖排';
    if (on) {
      body.tabIndex = 0;
      body.setAttribute('aria-label', '竖排正文，可左右滚动');
      body.scrollLeft = 0;
      if (jump) {
        var top = body.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top: Math.max(0, top), behavior: still ? 'auto' : 'smooth' });
      }
    } else {
      body.removeAttribute('tabindex');
      body.removeAttribute('aria-label');
    }
    onScroll();
  }
  vbtn.addEventListener('click', function () { setVert(!vert, true); });
  setVert(meta.dataset.vertical === 'true', false);

  // 竖排时滚轮往下 = 往左翻；翻到头再交还给页面
  body.addEventListener('wheel', function (e) {
    if (!vert || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var max = body.scrollWidth - body.clientWidth, pos = Math.abs(body.scrollLeft);
    var dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
    if ((dy > 0 && pos < max - 1) || (dy < 0 && pos > 1)) {
      e.preventDefault();
      body.scrollLeft -= dy;
    }
  }, { passive: false });

  // ---------- 文末落款：读到底，蛟标记落下（模板见 extend-footer.html） ----------
  var fin = document.createElement('div');
  fin.className = 'qj-fin';
  fin.setAttribute('aria-hidden', 'true');
  var tpl = document.getElementById('qj-mark-tpl');
  fin.innerHTML = '<span class="qj-fin-rule"></span><span class="qj-fin-seal"></span><span class="qj-fin-rule qj-fin-rule-r"></span>';
  var seal = fin.querySelector('.qj-fin-seal');
  if (tpl && tpl.content) seal.appendChild(tpl.content.cloneNode(true));
  else seal.innerHTML = '<span class="qj-fin-txt">全文完</span>';
  body.after(fin);
  function stamp() {
    if (fin.classList.contains('on')) return;
    fin.classList.add('on');
    if (window.qjYin && !still) setTimeout(window.qjYin.seal, 260);
  }
  if (still || !('IntersectionObserver' in window)) fin.classList.add('on');
  else {
    new IntersectionObserver(function (es, ob) {
      es.forEach(function (e) { if (e.isIntersecting) { stamp(); ob.disconnect(); } });
    }, { threshold: .6 }).observe(fin.querySelector('.qj-fin-seal'));
  }
})();
