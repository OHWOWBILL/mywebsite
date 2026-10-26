// =========================================================
// 日课 · 首页小卡（partials/qj-rike.html）
// 农历、日柱、建除宜忌、节气进度、月相、此时一卦。
// 每分钟看一眼：换了时辰就换卦，过了子夜就换日课。
// =========================================================

(function () {
  'use strict';
  var Q = window.QJ;
  var box = document.getElementById('qj-rike');
  var data = {};
  try { data = JSON.parse((document.getElementById('qj-rike-data') || {}).textContent || '{}'); } catch (e) {}

  // 某一时刻的全部日课，日签也用这一份
  function rikeOf(now, list) {
    var L = Q.lunar(now), gz = Q.dayGZ(now), jc = Q.jianchu(now), jq = Q.jieqi(now), mo = Q.moon(now);
    var yj = (data.jianchu || {})[jc] || {};
    var c = Q.cast(now), ben = null, bian = null;
    if (c && list) { ben = Q.findGua(list, c.lines); bian = Q.findGua(list, c.bian); }
    return {
      now: now,
      solar: now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日',
      lunar: L ? L.text : '',
      day: gz.name + '日', jc: jc, yi: yj.yi || '', ji: yj.ji || '',
      jq: jq, qi: jq.name + '第' + Q.hanNum(jq.day) + '日',
      qiNext: jq.left > 0 ? '距' + jq.next + Q.hanNum(jq.left) + '日' : '今日交' + jq.next,
      moon: mo, cast: c, ben: ben, bian: bian,
      shi: Q.ZHI[Q.hourZhi(now)] + '时'
    };
  }
  Q.rikeOf = rikeOf;

  if (!box) return;
  function set(k, html) { var el = box.querySelector('[data-k="' + k + '"]'); if (el) el.innerHTML = html; }

  var shown = '';
  function render(list) {
    var now = new Date(), key = Q.ymd(now) + Q.hourZhi(now);
    if (key === shown) return;
    shown = key;
    var r = rikeOf(now, list);
    set('date', r.solar + '<span>' + r.lunar + '</span>');
    set('day', '<b>' + r.day + '</b> · 值「' + r.jc + '」');
    set('qi', '<b>' + r.qi + '</b> · ' + r.qiNext);
    set('yi', r.yi);
    set('ji', r.ji);
    set('moon',
      '<svg viewBox="-24 -24 48 48" aria-hidden="true"><circle class="mo-dark" r="20"/><path class="mo-lit" d="' + Q.moonPath(r.moon.f, 20) + '"/></svg>' +
      '<span>' + r.moon.name + '</span>');
    if (r.cast && r.ben) {
      set('gua', Q.guaSVG(r.cast.lines, r.cast.dong, 46) +
        '<span class="g-k">' + r.shi + '一卦</span>' +
        '<span class="g-n">' + r.ben.name + '</span>' +
        '<span class="g-d">' + Q.yaoName(r.cast.lines, r.cast.dong - 1) + '动' + (r.bian ? '，之' + r.bian.short : '') + '</span>' +
        '<span class="g-m">' + r.ben.meaning + '</span>');
    } else {
      set('gua', '<span class="g-k">此时一卦</span><span class="g-n">去排盘</span>');
    }
    box.hidden = false;
  }

  Q.gua().then(function (list) {
    render(list);
    setInterval(function () { render(list); }, 60000);
  }, function () { render(null); });
})();
