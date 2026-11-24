#!/usr/bin/env node
// 出生地表自检：名字不重、经纬度与时区在台湾/各地合理范围、当年时区核对（zoneCheck）与搜地名。
// 用法：node scripts/cities/check.js
'use strict';
const C = require('../../static/fabao/cities.js');
let bad = 0;
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) bad++; };
const names = C.LIST.map(c => c[0]);
ok(new Set(names).size === names.length, `地名不重（共 ${names.length} 处）`);
ok(C.LIST.every(c => Math.abs(c[1]) <= 180 && Math.abs(c[2]) < 90 && C.TZS.includes(c[3]) && c[4]), '经纬度、时区、IANA 都齐');
const tw = C.GROUPS.filter(g => g[0].startsWith('台湾'));
ok(tw.length === 22 && tw.reduce((n, g) => n + g[1].length - 1, 0) === 368, '台湾 22 县市、368 乡镇市区');
ok(tw.every(g => g[1].every(c => c[1] > 118 && c[1] < 122.1 && c[2] > 21.8 && c[2] < 26.5 && c[3] === 8 && c[4] === 'Asia/Taipei')), '台湾各点都在台澎金马范围、UTC+8、Asia/Taipei');
ok(!C.GROUPS.some(g => g[0] === '中国大陆' && g[1].some(c => c[4] === 'Asia/Taipei')), '台湾不列在中国大陆组里');
ok(['台北', '台中', '台南', '高雄', '香港', '澳门', '北京', '东京', '纽约'].every(n => C.byName(n)), '旧表地名都还在（旧存档、旧网址不坏）');
const z = (city, y, mo, d, h, dst, tz) => C.zoneCheck({ city, tz: tz != null ? tz : C.byName(city)[3], dst: !!dst, y, mo, d, h, mi: 0 });
const k = r => r ? r.kind + ':' + r.fix.tz + (r.fix.dst ? '+dst' : '') : '—';
const cases = [
  [['台北', 1940, 6, 1, 12], 'tz:9'], [['台北', 1946, 7, 1, 12], 'dst:8+dst'], [['台北', 1955, 7, 1, 12], 'dst:8+dst'],
  [['台北', 1955, 7, 1, 12, true], '—'], [['台北', 1965, 7, 1, 12, true], 'nodst:8'], [['台北', 1974, 7, 1, 12], 'dst:8+dst'],
  [['台北', 1979, 7, 15, 12], 'dst:8+dst'], [['台北', 1988, 7, 1, 12], '—'], [['高雄·凤山区', 1988, 7, 1, 12], '—'],
  [['北京', 1988, 7, 1, 12], 'dst:8+dst'], [['北京', 1995, 7, 1, 12], '—'], [['香港', 1970, 7, 1, 12], 'dst:8+dst'],
  [['纽约', 2000, 7, 1, 12], 'dst:-5+dst'], [['纽约', 2000, 1, 1, 12], '—'], [['台北', 1890, 1, 1, 12], '—']
];
for (const [a, want] of cases) { const got = k(z(...a)); ok(got === want, `${a[0]} ${a[1]}-${a[2]}-${a[3]}${a[5] ? ' 勾夏令时' : ''}：${got}`); }
const s = q => C.search(q, 3).map(h => h.name)[0];
const want = { 板桥: '新北·板桥区', 板橋: '新北·板桥区', banqiao: '新北·板桥区', 竹北: '新竹县·竹北市', 臺東: '台东', 南竿: '马祖·南竿乡', 九龍: '香港·九龙', sapporo: '札幌', 凤山: '高雄·凤山区', 鳳山: '高雄·凤山区' };
for (const q in want) ok(s(q) === want[q], `搜「${q}」→ ${s(q)}`);
console.log(bad ? `\n${bad} 项不符` : '\n全部相合');
process.exit(bad ? 1 : 0);
