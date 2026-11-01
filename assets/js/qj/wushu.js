// =========================================================
// 五术门庭 · 门里那盏灯（layouts/_default/wushu.html）
// 每扇有内容的门里点一盏灯，按此刻现算一行字：
//   山 今年几运、何星入中（玄空紫白）· 医 此时气血流注哪一经 · 命 日干临时支的十二长生 · 卜 此时梅花一卦
//   （月相与节气那盏 moon 仍可用）
// 门上写短句，院里写长句；换了时辰再算一遍。
// =========================================================

(function () {
  'use strict';
  var Q = window.QJ;
  var gate = document.getElementById('ws-gate');
  if (!gate || !Q) return;

  // 纳子法：寅时起肺，一时辰一经
  var JING = ['胆', '肝', '肺', '大肠', '胃', '脾', '心', '小肠', '膀胱', '肾', '心包', '三焦'];
  var JING_FULL = ['足少阳胆经', '足厥阴肝经', '手太阴肺经', '手阳明大肠经', '足阳明胃经', '足太阴脾经',
    '手少阴心经', '手太阳小肠经', '足太阳膀胱经', '足少阴肾经', '手厥阴心包经', '手少阳三焦经'];
  // 十二长生：各干长生之支，阳干顺行、阴干逆行
  var STAGES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
  var START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];
  function stage(g, z) { return STAGES[g % 2 ? Q.mod(START[g] - z, 12) : Q.mod(z - START[g], 12)]; }

  var LAMPS = {
    moon: function (now) {
      var mo = Q.moon(now), jq = Q.jieqi(now);
      return {
        s: '月' + mo.name,
        l: '今夜月' + mo.name + '，' + jq.name + '第' + Q.hanNum(jq.day) + '日。修持看朔望，也看节令。'
      };
    },
    feixing: function (now) {
      // 年以立春换：一二月里节气还在冬至、小寒、大寒的，仍属上一年
      var Y = now.getFullYear(), jq = Q.jieqi(now);
      if (now.getMonth() < 2 && ['冬至', '小寒', '大寒'].indexOf(jq.name) >= 0) Y--;
      var STAR = ['', '一白', '二黑', '三碧', '四绿', '五黄', '六白', '七赤', '八白', '九紫'];
      var NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
      var star = Q.mod(-(Y - 2026), 9) + 1;                      // 2026 丙午一白入中
      var k = Math.floor(Q.mod(Y - 1864, 180) / 20), yun = k + 1;
      var from = Y - Q.mod(Y - 1864, 180) + k * 20;
      var gz = Q.GAN[Q.mod(Y - 4, 10)] + Q.ZHI[Q.mod(Y - 4, 12)];
      return {
        s: NUM[yun] + '运 · ' + STAR[star] + '入中',
        l: '今在' + ['上', '中', '下'][Math.floor(k / 3)] + '元' + NUM[yun] + '运（' + from + '–' + (from + 19) + '），' + gz + '年' + STAR[star] + '入中。飞星排盘见<a href="/kanyu/">堪舆</a>。'
      };
    },
    liuzhu: function (now) {
      var z = Q.hourZhi(now);
      return {
        s: Q.ZHI[z] + '时 · ' + JING[z],
        l: '此刻' + Q.ZHI[z] + '时，气血流注' + JING_FULL[z] + '。四法开穴见<a href="/ziwu/">子午流注</a>。'
      };
    },
    changsheng: function (now) {
      // 23 点起算次日（与十二长生、子午流注两件法宝同一口径）
      var d = now.getHours() >= 23 ? new Date(now.getTime() + 3600e3) : now;
      var g = Q.dayGZ(d).gan, z = Q.hourZhi(now), st = stage(g, z);
      return {
        s: Q.GAN[g] + '临' + Q.ZHI[z] + ' · ' + st,
        l: '此刻日干' + Q.GAN[g] + '临' + Q.ZHI[z] + '时，十二长生在「' + st + '」。全表见<a href="/changsheng/">十二长生</a>。'
      };
    },
    gua: function (now, list) {
      var c = Q.cast(now), z = Q.ZHI[Q.hourZhi(now)];
      var ben = c && list ? Q.findGua(list, c.lines) : null;
      if (!ben) return { s: z + '时一卦', l: '此时一卦，去<a href="/meihua/">梅花</a>排盘看。' };
      var bian = Q.findGua(list, c.bian);
      return {
        s: z + '时 · ' + ben.name,
        l: '此时梅花一卦：' + ben.name + '，' + Q.yaoName(c.lines, c.dong - 1) + '动' +
          (bian ? '，之' + bian.name : '') + '。全盘见<a href="/meihua/">梅花</a>。'
      };
    }
  };

  var shown = '', guaList = null;
  function light() {
    var now = new Date(), key = Q.ymd(now) + Q.hourZhi(now);
    if (key === shown) return;
    shown = key;
    document.querySelectorAll('[data-lamp]').forEach(function (el) {
      var f = LAMPS[el.dataset.lamp];
      if (!f) return;
      var r = f(now, guaList);
      if (el.hasAttribute('data-long')) el.innerHTML = r.l; else el.textContent = r.s;
      el.hidden = false;
    });
  }
  light();
  if (document.querySelector('[data-lamp="gua"]')) {
    Q.gua().then(function (list) { guaList = list; shown = ''; light(); }, function () {});
  }
  setInterval(light, 60000);

  // 从门上点进院子：那扇门推开一下再走
  gate.addEventListener('click', function (e) {
    var a = e.target.closest('.ws-door');
    if (!a || a.classList.contains('is-shut')) return;
    a.classList.add('is-open');
    setTimeout(function () { a.classList.remove('is-open'); }, 1400);
  });
})();
