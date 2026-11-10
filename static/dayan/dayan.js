/* =========================================================
   大衍筮法 · 揲蓍引擎
   《系辞上》：大衍之数五十，其用四十有九。分而为二以象两，挂一以象三，揲之以四以象四时，归奇于扐以象闰。
   · 五十策置一不用，以四十九策起。
   · 一变：随手分为左右两份（分二）；右取一策挂于指间（挂一）；左右各四四数之（揲四），
     各余一至四策（余零者算四）；两份余策连同挂一归于一处（归奇）。去掉的策数，第一变必是 5 或 9，第二、三变必是 4 或 8。
   · 三变成一爻：所剩 36、32、28、24 策，以四除之得 9 老阳、8 少阴、7 少阳、6 老阴；九六为变爻。
   · 十八变成卦，自下而上。
   · 占法依朱熹《易学启蒙·考变占》。
   分二用正态近似（人手分两份多在一半上下），只影响画面，不影响 6/7/8/9 的出现机率（1/16、5/16、7/16、3/16）。
   浏览器里挂 window.DY；node 里 require 即得同一对象。
   ========================================================= */
(function (root) {
  'use strict';
  var NODE = typeof module !== 'undefined' && module.exports;

  function rand() {
    var c = root.crypto || (NODE ? require('crypto').webcrypto : null);
    if (c && c.getRandomValues) { var a = new Uint32Array(1); c.getRandomValues(a); return a[0] / 4294967296; }
    return Math.random();
  }
  function gauss() { var u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  // 一变：n 策 → { n, left, right, gua: 1, rl, rr, out, rest }
  function bian(n, rnd) {
    var left;
    if (rnd != null) left = rnd;
    else left = Math.round(n / 2 + gauss() * n / 9);
    left = Math.max(1, Math.min(n - 2, left));                    // 右边至少两策，挂一后仍有可揲
    var right = n - left, r2 = right - 1;
    var rl = left % 4 || 4, rr = r2 % 4 || 4;
    var out = 1 + rl + rr;
    return { n: n, left: left, right: right, rl: rl, rr: rr, out: out, rest: n - out };
  }
  function yao() {
    var n = 49, bs = [];
    for (var i = 0; i < 3; i++) { var b = bian(n); bs.push(b); n = b.rest; }
    return { bians: bs, rest: n, v: n / 4 };
  }
  function cast() { var ys = []; for (var i = 0; i < 6; i++) ys.push(yao()); return ys; }

  var V_NAME = { 6: '老阴', 7: '少阳', 8: '少阴', 9: '老阳' };
  var POS = ['初', '二', '三', '四', '五', '上'];

  // vals：六个数（初→上），6/7/8/9；hex：HEXAGRAMS 数组；txt：YAO_TEXT
  function read(vals, hex, txt) {
    var ben = vals.map(function (v) { return v % 2; });             // 7、9 为阳
    var zhi = vals.map(function (v) { return v === 6 ? 1 : v === 9 ? 0 : v % 2; });
    var find = function (ls) { return hex.find(function (h) { return h.lines.join('') === ls.join(''); }) || null; };
    var B = find(ben), Zh = find(zhi);
    var bian = []; vals.forEach(function (v, i) { if (v === 6 || v === 9) bian.push(i); });
    var still = [0, 1, 2, 3, 4, 5].filter(function (i) { return bian.indexOf(i) < 0; });
    var tx = function (g) { return g && txt ? txt[g.name] : null; };
    var yaoOf = function (g, i) { var t = tx(g); return t ? { gua: g.name, title: t.yao[i][0], text: t.yao[i][1], plain: t.yao[i][2] } : null; };
    var guaOf = function (g, role) { var t = tx(g); return g ? { gua: g.name, title: role + '卦辞', text: t ? t.gua : '', plain: g.meaning } : null; };
    var n = bian.length, rule, items = [], main = null;
    if (n === 0) { rule = '六爻皆不变：占本卦卦辞。'; items = [guaOf(B, '本卦')]; }
    else if (n === 1) { rule = '一爻变：以本卦变爻之辞占。'; items = [yaoOf(B, bian[0])]; }
    else if (n === 2) { rule = '二爻变：以本卦两个变爻之辞占，以上面一爻为主。'; items = [yaoOf(B, bian[1]), yaoOf(B, bian[0])]; main = 0; }
    else if (n === 3) { rule = '三爻变：占本卦与之卦的卦辞，本卦为贞（体、现在），之卦为悔（用、将来）。'; items = [guaOf(B, '本卦'), guaOf(Zh, '之卦')]; }
    else if (n === 4) { rule = '四爻变：以之卦两个不变爻之辞占，以下面一爻为主。'; items = [yaoOf(Zh, still[0]), yaoOf(Zh, still[1])]; main = 0; }
    else if (n === 5) { rule = '五爻变：以之卦唯一不变之爻的爻辞占。'; items = [yaoOf(Zh, still[0])]; }
    else {
      var t = tx(B);
      if (t && t.extra) { rule = '六爻皆变，乾坤占二用：' + B.name + '占' + t.extra[0] + '。'; items = [{ gua: B.name, title: t.extra[0], text: t.extra[1], plain: t.extra[2] }]; }
      else { rule = '六爻皆变：占之卦卦辞。'; items = [guaOf(Zh, '之卦')]; }
    }
    return { vals: vals, ben: B, zhi: n ? Zh : null, bian: bian, rule: rule, items: items.filter(Boolean), main: main };
  }

  function text(r, extra) {
    extra = extra || {};
    var lines = ['大衍筮法（揲蓍）'];
    if (extra.when) lines.push('起卦：' + extra.when);
    if (extra.ask) lines.push('所问：' + extra.ask);
    lines.push('六爻（初→上）：' + r.vals.map(function (v, i) { return POS[i] + ' ' + v + V_NAME[v]; }).join('，'));
    lines.push('本卦：' + (r.ben ? r.ben.name : '—') + (r.zhi ? '　之卦：' + r.zhi.name : '') + (r.bian.length ? '　变爻：' + r.bian.map(function (i) { return POS[i]; }).join('、') : '　无变爻'));
    lines.push('占法（朱熹《易学启蒙》）：' + r.rule);
    r.items.forEach(function (it, i) { lines.push((r.main === i ? '【主】' : '') + it.gua + ' · ' + it.title + '：' + it.text + (it.plain ? '（' + it.plain + '）' : '')); });
    return lines.join('\n');
  }

  var RULES = [
    ['策数', '大衍之数五十，置一不用，以四十九策起卦。'],
    ['一变', '分二（随手分作两份）、挂一（右份取一策夹于指间）、揲四（左右各四四数之）、归奇（两份余策各一至四，连挂一归于一处）。第一变去 5 或 9 策，第二、三变去 4 或 8 策。'],
    ['成爻', '三变之后余 36、32、28、24 策，四除得 9、8、7、6：九为老阳、七为少阳、八为少阴、六为老阴。老变少不变，九六为变爻，阳变阴、阴变阳得之卦。'],
    ['机率', '揲蓍得 6、7、8、9 的机率是 1/16、5/16、7/16、3/16：老阳是老阴的三倍，阴爻多变成阳。铜钱法四者为 1/8、3/8、3/8、1/8，阴阳变爻一样多，这是两法最大的不同。'],
    ['占法', '依朱熹《易学启蒙·考变占》：不变占本卦卦辞；一爻变占本卦变爻；二爻变占本卦二变爻，以上爻为主；三爻变占本卦、之卦卦辞，本卦为贞、之卦为悔；四爻变占之卦二不变爻，以下爻为主；五爻变占之卦不变爻；六爻变，乾坤占用九用六，余卦占之卦卦辞。'],
    ['随机', '分二用浏览器的安全随机数（crypto），按正态近似人手分两份多在一半上下；只影响画面，不改变上面的机率。'],
    ['参照', '卦辞、爻辞与白话与本站梅花起卦共用一份（/meihua/data/）。白话只作参考，断卦仍要合所问。']
  ];

  var api = { bian: bian, yao: yao, cast: cast, read: read, text: text, RULES: RULES, V_NAME: V_NAME, POS: POS };
  if (NODE) module.exports = api; else root.DY = api;
})(this);
