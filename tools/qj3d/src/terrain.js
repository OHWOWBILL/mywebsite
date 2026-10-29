// 山体：高度场、台地、石阶。纯函数，浏览器和 node 都能用。

let seed = 7;
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const reseed = s => { seed = s; };

const P = new Uint8Array(512);
{
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
}
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;
const grad = (h, x, y) => { const g = h & 7, u = g < 4 ? x : y, v = g < 4 ? y : x; return ((g & 1) ? -u : u) + ((g & 2) ? -v : v); };
export function n2(x, y) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
  x -= Math.floor(x); y -= Math.floor(y);
  const u = fade(x), v = fade(y), a = P[X] + Y, b = P[X + 1] + Y;
  return lerp(lerp(grad(P[a], x, y), grad(P[b], x - 1, y), u),
              lerp(grad(P[a + 1], x, y - 1), grad(P[b + 1], x - 1, y - 1), u), v);
}
export function fbm(x, y, o = 5) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * n2(x * f, y * f); f *= 2.03; a *= .5; } return s; }
export function ridged(x, y, o = 5) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { const r = 1 - Math.abs(n2(x * f + i * 17, y * f)); s += a * r * r; f *= 2.1; a *= .5; } return s; }
export const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const pk = (x, z, x0, z0, h, sx, sz, p) => h * Math.exp(-Math.pow(((x - x0) / sx) ** 2 + ((z - z0) / sz) ** 2, p));

// 主峰在后，台地一层层往后往上
export function natural(x, z) {
  let m = pk(x, z, 0, -80, 96, 40, 44, .62)
        + pk(x, z, 0, -86, 34, 14, 14, .8)
        + pk(x, z, -58, -104, 78, 20, 26, .75)
        + pk(x, z, -36, -96, 40, 10, 12, .8)
        + pk(x, z, 62, -96, 70, 20, 24, .75)
        + pk(x, z, 40, -104, 46, 10, 12, .8)
        + pk(x, z, -26, -40, 26, 30, 22, .9)
        + pk(x, z, 30, -36, 24, 28, 22, .9);
  const mass = Math.min(1, m / 40);
  m += mass * 20 * (ridged(x / 9, z / 30) - .55);   // 竖向沟壑：皴
  { const s = 5.5, f = m / s, fl = Math.floor(f); m = lerp(m, (fl + Math.pow(f - fl, 3)) * s, .5 * mass); }   // 层岩：一层层台和崖
  m += 3.5 * fbm(x / 22, z / 22);
  m += mass * 2.2 * fbm(x / 4, z / 4, 3);
  // 山脚平台，前面是水
  const shelf = sstep(-6, 8, z);
  m = lerp(m, 1.6 + .4 * fbm(x / 9, z / 9, 2), shelf);
  m -= sstep(22, 30, z) * 5.5;
  return m;
}

// 台地：x, z, 半径, 平台高。键名同 assets/js/qj/ge.js 的场所 id
export const SITES = {
  shanmen: { x: 0, z: 12, r: 0, y: 1.6 },     // 云从关
  cang:    { x: -26, z: -12, r: 9, y: 18 },   // 汲玄楼
  fabao:   { x: 25, z: -21, r: 10, y: 30 },   // 法宝库
  shi:     { x: 37, z: -2, r: 6, y: 10 },     // 听雷亭
  qin:     { x: -30, z: -46, r: 7, y: 52 },   // 叩云台
  ge:      { x: 0, z: -64, r: 12, y: 76 },    // 集云斋
  men:     { x: 50, z: -9, r: 3, y: 12 },     // 蛰庐：崖下一扇小门
};

// 石阶：折线 [x, z, y?]；带 y 的是锚点，中间按路程插值
const RAW = [[0, 7, 1.6], [0, 2], [-12, -3], [-18, -8, 18], [-6, -12], [10, -13], [17, -17, 30],
             [10, -26], [-8, -30], [-20, -42, 52], [-6, -44], [10, -49], [0, -55, 76]];
export const PATH = (() => {
  const out = RAW.map(r => [r[0], r[2], r[1]]);
  let i0 = 0;
  for (let i = 1; i < RAW.length; i++) {
    if (RAW[i][2] == null) continue;
    let L = 0; const acc = [0];
    for (let k = i0 + 1; k <= i; k++) { L += Math.hypot(RAW[k][0] - RAW[k - 1][0], RAW[k][1] - RAW[k - 1][1]); acc.push(L); }
    for (let k = i0 + 1; k < i; k++) out[k][1] = lerp(RAW[i0][2], RAW[i][2], acc[k - i0] / L);
    i0 = i;
  }
  return out;
})();

function segDist(px, pz, a, b) {
  const dx = b[0] - a[0], dz = b[2] - a[2], L2 = dx * dx + dz * dz;
  let t = L2 ? ((px - a[0]) * dx + (pz - a[2]) * dz) / L2 : 0; t = Math.max(0, Math.min(1, t));
  const qx = a[0] + dx * t, qz = a[2] + dz * t;
  return [Math.hypot(px - qx, pz - qz), lerp(a[1], b[1], t)];
}
export function pathInfo(x, z) {
  let best = 1e9, y = 0;
  for (let i = 0; i < PATH.length - 1; i++) { const [d, yy] = segDist(x, z, PATH[i], PATH[i + 1]); if (d < best) { best = d; y = yy; } }
  return [best, y];
}

export function height(x, z) {
  let h = natural(x, z);
  for (const k in SITES) {
    const s = SITES[k]; if (!s.r) continue;
    const d = Math.hypot(x - s.x, z - s.z);
    h = lerp(h, s.y - .05, sstep(s.r + 7, s.r, d));
  }
  const [d, y] = pathInfo(x, z);
  h = lerp(h, y - .35, sstep(6, 2.4, d));
  return h;
}
