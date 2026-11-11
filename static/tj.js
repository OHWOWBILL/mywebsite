// 访问统计：Cloudflare Web Analytics。
// 不设 cookie、不记个人身份、不跨站跟踪，只看哪一页有人来、从哪儿来、页面快不快。
// 数据在 Cloudflare 后台「Analytics & Logs → Web Analytics → ohwowbill.com」里看。
//
// 只在正式域名上报，本机预览不报；阁主自己的设备（开过 ?owner=1）不计；浏览器开了「请勿跟踪」的不计。
// 全站都只引这一个文件：Hugo 页在 layouts/partials/extend-footer.html，法宝页由 static/fabao/fabao.js 代引，
// 谚文页自己引。要停用或换别家，改这里即可。
(function () {
  try {
    if (!/(^|\.)ohwowbill\.com$/.test(location.hostname)) return;
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    if (localStorage.getItem('qj-owner') === '1') return;
  } catch (e) {}
  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', '{"token": "7cd89fcff556494d80d38068b0958935"}');
  document.head.appendChild(s);
})();
