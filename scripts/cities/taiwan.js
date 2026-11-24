#!/usr/bin/env node
// 由内政部乡镇市区界（npm 包 taiwan-atlas 的 towns-10t.json，TopoJSON）算出台湾 368 个乡镇市区的几何中心，
// 写进 static/fabao/cities.js 的 TW-BEGIN … TW-END 一段。几何中心取各乡镇最大一块陆地（离岛不把中心拉进海里），
// 精到百分之一度。县市一级另列一项，取县市政府所在乡镇的中心；台北、台中、台南、高雄沿用旧表的点，旧存档不变。
// 用法：npm pack taiwan-atlas && tar xzf taiwan-atlas-*.tgz
//       node scripts/cities/taiwan.js package/towns-10t.json
'use strict';
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'static', 'fabao', 'cities.js');
const { t2s } = require(FILE);
const topo = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
const arcs = topo.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
const arc = i => i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
const ring = ids => ids.reduce((pts, i, k) => pts.concat(k ? arc(i).slice(1) : arc(i)), []);
function centroid(r) {                       // 平面近似：经度按 cos(纬度) 缩，面积加权
  const k = Math.cos(23.7 * Math.PI / 180);
  let A = 0, cx = 0, cy = 0;
  for (let i = 0; i < r.length - 1; i++) {
    const [x0, y0] = r[i], [x1, y1] = r[i + 1], f = (x0 * y1 - x1 * y0) * k;
    A += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  return { A: Math.abs(A / 2), x: cx / (3 * A), y: cy / (3 * A) };
}
// 县市：[官名, 简称（条目名前缀）, 县市政府所在乡镇（官名，繁体）, 固定点]
const COUNTY = [
  ['台北市', '台北', null, [121.56, 25.03]], ['新北市', '新北', '板橋區'], ['基隆市', '基隆', '中正區'], ['桃园市', '桃园', '桃園區'],
  ['新竹市', '新竹市', '北區'], ['新竹县', '新竹县', '竹北市'], ['苗栗县', '苗栗', '苗栗市'], ['台中市', '台中', null, [120.68, 24.15]],
  ['彰化县', '彰化', '彰化市'], ['南投县', '南投', '南投市'], ['云林县', '云林', '斗六市'], ['嘉义市', '嘉义市', '東區'], ['嘉义县', '嘉义县', '太保市'],
  ['台南市', '台南', null, [120.21, 22.99]], ['高雄市', '高雄', null, [120.31, 22.63]], ['屏东县', '屏东', '屏東市'], ['宜兰县', '宜兰', '宜蘭市'],
  ['花莲县', '花莲', '花蓮市'], ['台东县', '台东', '台東市'], ['澎湖县', '澎湖', '馬公市'], ['金门县', '金门', '金城鎮'], ['连江县', '马祖', '南竿鄉']
];
const towns = {};
for (const g of topo.objects.towns.geometries) {
  const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs;
  let best = null;
  for (const p of polys) { const c = centroid(ring(p[0])); if (!best || c.A > best.A) best = c; }
  const P = g.properties, cn = t2s(P.COUNTYNAME);
  (towns[cn] = towns[cn] || []).push({ code: P.TOWNCODE, tw: P.TOWNNAME, cname: P.COUNTYNAME, en: P.TOWNENG.replace(/'/g, '').replace(/ (District|Township|City)$/, ''), cen: P.COUNTYENG, lon: +best.x.toFixed(2), lat: +best.y.toFixed(2) });
}
const groups = [], alias = {};
for (const [full, short, seat, fixed] of COUNTY) {
  const list = (towns[full] || []).sort((a, b) => a.code < b.code ? -1 : 1);
  if (!list.length) throw new Error('缺县市 ' + full);
  const s = seat ? list.find(t => t2s(t.tw) === t2s(seat)) : null;
  if (seat && !s) throw new Error('找不到县市政府所在 ' + full + ' ' + seat);
  const pt = fixed || [s.lon, s.lat];
  const rows = [[short, pt[0], pt[1], 8]];
  alias[short] = `${list[0].cname} ${full} ${list[0].cen.replace(/ (County|City)$/, '')}${short === '马祖' ? ' 連江 连江 Matsu' : ''}`;
  for (const t of list) {
    const name = short + '·' + t2s(t.tw);
    rows.push([name, t.lon, t.lat, 8]);
    alias[name] = `${t.tw} ${list[0].cname}${t.tw} ${t.en}`;
  }
  groups.push(['台湾 · ' + full, rows, 'TW']);
}
const js = v => JSON.stringify(v).replace(/"/g, "'");
const body = '  /* TW-BEGIN */\n  var TW_GROUPS = [\n' + groups.map(([g, rows]) =>
  `    [${js(g)}, [${rows.map(js).join(', ')}], TW]`).join(',\n') + '\n  ];\n  var TW_ALIAS = {\n' +
  Object.keys(alias).map(k => `    ${js(k)}: ${js(alias[k])}`).join(',\n') + '\n  };\n  /* TW-END */';
const src = fs.readFileSync(FILE, 'utf8');
const out = src.replace(/  \/\* TW-BEGIN \*\/[\s\S]*?\/\* TW-END \*\//, body);
fs.writeFileSync(FILE, out);
console.log('台湾', groups.length, '县市', groups.reduce((n, g) => n + g[1].length, 0), '条');
