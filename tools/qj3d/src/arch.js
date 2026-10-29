// 古建生成器：屋顶（庑殿/歇山/腰檐/攒尖）、斗拱、柱网、隔扇、台基、牌坊、亭、墙、石阶。
// 所有零件按材质名收进 Kit，最后每种材质并成一个网格，整座山几十次绘制就够。
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V3 = THREE.Vector3;
const KEEP = ['position', 'normal', 'uv'];

export class Kit {
  constructor() { this.m = new Map(); }
  add(name, geo, mtx) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (mtx) g.applyMatrix4(mtx);
    for (const k of Object.keys(g.attributes)) if (!KEEP.includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.clearGroups();
    if (!this.m.has(name)) this.m.set(name, []);
    this.m.get(name).push(g);
  }
  build(mats) {
    const grp = new THREE.Group();
    for (const [name, arr] of this.m) {
      const mesh = new THREE.Mesh(mergeGeometries(arr, false), mats[name]);
      mesh.castShadow = mesh.receiveShadow = true; mesh.name = name;
      grp.add(mesh);
    }
    return grp;
  }
}

let winN = 0;
export const at = (T, x = 0, y = 0, z = 0, ry = 0) =>
  T.clone().multiply(new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), ry), new V3(1, 1, 1)));

export function box(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0], uv.getY(k) * dims[f][1]); }
  return g;
}
export function cyl(rt, rb, h, seg = 14) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.PI * 2 * rb, uv.getY(i) * h);
  return g;
}

// 参数曲面：f(s, t) -> V3；s∈[-1,1]，t∈[t1,t2]；hint 指向外侧，用来定面朝向
function surf(f, ns, nt, t1, t2, uvf, hint) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nt; j++) {
    const t = t1 + (t2 - t1) * j / nt;
    for (let i = 0; i <= ns; i++) { const s = -1 + 2 * i / ns, p = f(s, t), q = uvf(p, s, t); pos.push(p.x, p.y, p.z); uv.push(q[0], q[1]); }
  }
  for (let j = 0; j < nt; j++) for (let i = 0; i < ns; i++) {
    const a = j * (ns + 1) + i, b = a + 1, c = a + ns + 1, d = c + 1; idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  // 看中间那格的朝向
  const j = Math.floor(nt / 2), i = Math.floor(ns / 2), a = j * (ns + 1) + i;
  const P = k => new V3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
  const n = new V3().subVectors(P(a + 1), P(a)).cross(new V3().subVectors(P(a + ns + 1), P(a)));
  if (n.dot(hint) < 0) { for (let k = 0; k < idx.length; k += 3) { const t = idx[k]; idx[k] = idx[k + 1]; idx[k + 1] = t; } g.setIndex(idx); }
  g.computeVertexNormals();
  return g;
}
const yP = t => .35 * t + .65 * t * t;           // 举折：檐口缓、近脊陡

function tube(pts, r, seg = 20) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 6, false);
}
function wen(K, T, x, y, sc, dir) {   // 鸱吻
  const p = [[0, 0], [.05, .45], [-.08, .78], [-.3, .86], [-.42, .7], [-.3, .58]].map(([a, b]) => new V3(x + dir * a * sc, y + b * sc, 0));
  K.add('ridge', tube(p, .11 * sc, 18), T);
  K.add('ridge', box(.55 * sc, .62 * sc, .4 * sc), at(T, x + dir * .05 * sc, y + .2 * sc, 0));
}

// 长方形屋顶：庑殿（默认）、歇山（给 t0）、腰檐（给 tMax<1）
export function roofRect(K, T, o) {
  const { W, D, H, lift = 1, out = .5, th = .32, tMax = 1, sc = 1 } = o;
  const xie = o.t0 != null, t0 = xie ? o.t0 : 1;
  const Xr = xie ? W - D * t0 : (o.R ?? Math.max(.3, W - D));
  const Lc = o.Lc ?? Math.min(W, D) * .95;
  const hw = t => t < t0 ? W + (Xr - W) * (t / t0) : Xr;
  const cf = t => { const k = Math.max(0, 1 - t / t0); return k * k; };
  const ef = e => { const k = Math.max(0, 1 - e / Lc); return k * k; };
  const pt = (side, s, t, yo = 0) => {
    let x, z, e;
    if (side === 0) { x = s * hw(t); z = D * (1 - t); e = (1 - Math.abs(s)) * hw(t); }
    else { x = hw(t); z = s * D * (1 - t); e = (1 - Math.abs(s)) * D * (1 - t); }
    const d = ef(Math.max(0, e)) * cf(t);
    return new V3(x + Math.sign(x) * out * d, H * yP(t) + lift * d + yo, z + Math.sign(z) * out * d);
  };
  const Ls = Math.hypot(D, H), tS = Math.min(tMax, t0);
  const half = new Kit();
  const up = (x, z) => new V3(x, 1, z);
  half.add('tile', surf((s, t) => pt(0, s, t), 30, 14, 0, tMax, p => [p.x, 0], up(0, 1)));
  half.add('tile', surf((s, t) => pt(1, s, t), 18, 10, 0, tS, p => [p.z, 0], up(1, 0)));
  // v 用斜长
  for (const g of half.m.get('tile')) { const uv = g.attributes.uv, ps = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setY(i, (ps.getY(i) / Math.max(H, .01)) * Ls); }
  half.add('rafter', surf((s, t) => pt(0, s, t, -th), 30, 8, 0, tMax, (p, s, t) => [p.x, t], up(0, 1).negate()));
  half.add('rafter', surf((s, t) => pt(1, s, t, -th), 18, 6, 0, tS, (p, s, t) => [p.z, t], up(1, 0).negate()));
  const band = (side, hint) => surf((s, q) => pt(side, s, 0, -th).lerp(pt(side, s, 0), q), side ? 18 : 30, 1, 0, 1, (p, s, q) => [s, q], hint);
  half.add('fascia', band(0, new V3(0, 0, 1)));
  half.add('fascia', band(1, new V3(1, 0, 0)));
  // 戗脊 + 垂脊：从翘角尖一直到顶
  for (const sg of [-1, 1]) {
    const pts = []; for (let k = 0; k <= 16; k++) pts.push(pt(0, sg, -.13 + (Math.min(1, tMax) + .13) * k / 16, .13 * sc));
    half.add('ridge', tube(pts, .12 * sc, 24));
  }
  if (xie && tMax >= 1) {
    // 博风板
    for (const sg of [-1, 1]) half.add('red', surf((s, t) => pt(0, sg, t, -th).lerp(pt(0, sg, t), (s + 1) / 2), 1, 8, t0, 1, (p, s, t) => [s, t], new V3(sg, 0, 0)));
    // 山花
    const sh = new THREE.Shape(), xg = Xr - .4 * sc, n = 10;
    sh.moveTo(D * (1 - t0), H * yP(t0) - .2);
    for (let k = 1; k <= n; k++) { const t = t0 + (1 - t0) * k / n; sh.lineTo(D * (1 - t), H * yP(t)); }
    for (let k = n - 1; k >= 0; k--) { const t = t0 + (1 - t0) * k / n; sh.lineTo(-D * (1 - t), H * yP(t)); }
    const sg = new THREE.ShapeGeometry(sh); sg.rotateY(Math.PI / 2); sg.translate(xg, 0, 0);
    half.add('shanhua', sg);
    half.add('ridge', box(.42 * sc, .3 * sc, 2 * D * (1 - t0) + .2), at(new THREE.Matrix4(), xg + .1, H * yP(t0) - .05, 0));
  }
  if (tMax < 1) {   // 腰檐上沿的博脊
    const z = D * (1 - tMax), y = H * yP(tMax);
    half.add('ridge', box(2 * hw(tMax), .3 * sc, .34 * sc), at(new THREE.Matrix4(), 0, y + .05, z));
  }
  for (const [name, arr] of half.m) for (const g of arr) { K.add(name, g, T); K.add(name, g, at(T, 0, 0, 0, Math.PI)); }
  if (tMax >= 1) {
    K.add('ridge', box(2 * Xr + .3 * sc, .55 * sc, .36 * sc), at(T, 0, H + .18 * sc, 0));
    wen(K, T, Xr, H + .3 * sc, sc * .9, -1); wen(K, T, -Xr, H + .3 * sc, sc * .9, 1);
  }
}

// 攒尖：N 边形
export function roofPoly(K, T, o) {
  const { N = 6, Rc, H, lift = .9, out = .45, th = .28, rot = Math.PI / 2, sc = 1 } = o;
  const C = i => { const a = rot + 2 * Math.PI * i / N; return new V3(Math.cos(a) * Rc, 0, Math.sin(a) * Rc); };
  for (let i = 0; i < N; i++) {
    const c0 = C(i), c1 = C(i + 1), mid = c0.clone().add(c1).multiplyScalar(.5);
    const ed = c1.clone().sub(c0), L = ed.length(); ed.normalize();
    const Lc = L / 2 * .95, ap = mid.length(), Ls = Math.hypot(ap, H);
    const u0 = c0.clone().normalize(), u1 = c1.clone().normalize();
    const f = yo => (s, t) => {
      const e = (1 - Math.abs(s)) * L / 2 * (1 - t), k = Math.max(0, 1 - e / Lc), d = k * k * (1 - t) * (1 - t);
      const p = mid.clone().addScaledVector(ed, s * L / 2).multiplyScalar(1 - t).addScaledVector(s > 0 ? u1 : u0, out * d);
      p.y = H * yP(t) + lift * d + yo; return p;
    };
    const outw = mid.clone().normalize().setY(1);
    K.add('tile', surf(f(0), 16, 12, 0, 1, (p, s, t) => [p.x * ed.x + p.z * ed.z, t * Ls], outw), T);
    K.add('rafter', surf(f(-th), 16, 6, 0, .9, (p, s, t) => [p.x * ed.x + p.z * ed.z, t], outw.clone().negate()), T);
    K.add('fascia', surf((s, q) => f(-th)(s, 0).lerp(f(0)(s, 0), q), 16, 1, 0, 1, (p, s, q) => [s, q], mid.clone().normalize()), T);
    const pts = []; for (let k = 0; k <= 14; k++) pts.push(f(.12 * sc)(-1, -.13 + 1.08 * k / 14));
    K.add('ridge', tube(pts, .11 * sc, 20), T);
  }
  K.add('gold', cyl(.32 * sc, .42 * sc, .35 * sc), at(T, 0, H + .1, 0));
  K.add('gold', new THREE.SphereGeometry(.42 * sc, 14, 10), at(T, 0, H + .55 * sc, 0));
  K.add('gold', cyl(.06 * sc, .16 * sc, .7 * sc, 8), at(T, 0, H + 1.15 * sc, 0));
}

// 斗拱：一攒，朝 +z
function gong(K, T, sc) {
  K.add('red', box(.34 * sc, .2 * sc, .34 * sc), at(T, 0, .1 * sc, 0));
  for (let k = 0; k < 3; k++) {
    const y = (.28 + k * .2) * sc, z = k * .16 * sc, nm = k % 2 ? 'gong2' : 'gong';
    K.add(nm, box((.75 + .3 * k) * sc, .15 * sc, .17 * sc), at(T, 0, y, z));
    K.add(nm, box(.17 * sc, .15 * sc, (.45 + .32 * k) * sc), at(T, 0, y, z + .1 * sc));
    K.add('red', box(.24 * sc, .1 * sc, .24 * sc), at(T, 0, y + .12 * sc, z + (.25 + .16 * k) * sc));
  }
}

// 殿身：柱、隔扇、额枋、斗拱。原点在台面中心。返回斗拱顶高
export function hall(K, T, o) {
  const { w, d, nx, nz, ch, lit = 0, sc = 1, back = false } = o;
  const cr = (o.cr ?? .26) * sc;
  const xs = [...Array(nx + 1)].map((_, i) => -w / 2 + w * i / nx), zs = [...Array(nz + 1)].map((_, i) => -d / 2 + d * i / nz);
  const cols = [];
  for (const x of xs) for (const z of zs) if (x === xs[0] || x === xs[nx] || z === zs[0] || z === zs[nz]) cols.push([x, z]);
  for (const [x, z] of cols) {
    K.add('red', cyl(cr, cr * 1.05, ch), at(T, x, ch / 2, z));
    K.add('stone', cyl(cr * 1.5, cr * 1.65, .22), at(T, x, .11, z));
  }
  K.add('wall', box(w - .5, ch, d - .5), at(T, 0, ch / 2, 0));
  const wm = lit ? 'winLit' : 'win', ph = ch - .55;
  const pane = (len, n) => { const g = new THREE.PlaneGeometry(len, ph); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * n); return g; };
  const bay = (a, b, z, ry, front) => {
    const len = Math.abs(b - a) - cr * 1.6, n = Math.max(2, Math.round(len / .78));
    const on = front && lit || lit > 1;
    K.add(on ? ((winN++ * 7) % 5 === 3 ? 'winDim' : 'winLit') : 'win', pane(len, n), at(T, ...(Math.abs(Math.sin(ry)) > .5 ? [z, ph / 2 + .05, (a + b) / 2] : [(a + b) / 2, ph / 2 + .05, z]), ry));
  };
  for (let i = 0; i < nx; i++) { bay(xs[i], xs[i + 1], d / 2 - .02, 0, true); if (back) bay(xs[i], xs[i + 1], -d / 2 + .02, Math.PI); }
  for (let i = 0; i < nz; i++) { bay(zs[i], zs[i + 1], w / 2 - .02, Math.PI / 2); bay(zs[i], zs[i + 1], -w / 2 + .02, -Math.PI / 2); }
  // 额枋 + 平板枋
  const bh = .44 * sc;
  for (const z of [d / 2, -d / 2]) K.add('beam', box(w + cr * 2, bh, .3 * sc), at(T, 0, ch - bh / 2, z));
  for (const x of [w / 2, -w / 2]) K.add('beam', box(.3 * sc, bh, d + cr * 2), at(T, x, ch - bh / 2, 0));
  K.add('red', box(w + cr * 2 + .2, .14 * sc, d + cr * 2 + .2), at(T, 0, ch + .07 * sc, 0));
  // 斗拱
  const y0 = ch + .14 * sc;
  const edge = (pts, z, ry) => { for (const x of pts) gong(K, at(T, ...(ry % Math.PI ? [z, y0, x] : [x, y0, z]), ry), sc); };
  const mids = a => { const r = []; for (let i = 0; i < a.length; i++) { r.push(a[i]); if (i < a.length - 1) r.push((a[i] + a[i + 1]) / 2); } return r; };
  edge(mids(xs), d / 2, 0); edge(mids(xs), -d / 2, Math.PI);
  edge(mids(zs).slice(1, -1), w / 2, Math.PI / 2); edge(mids(zs).slice(1, -1), -w / 2, -Math.PI / 2);
  // 挑檐枋
  K.add('gong2', box(w + 1.1 * sc, .16 * sc, .9 * sc + d), at(T, 0, y0 + .82 * sc, 0));
  return y0 + .9 * sc;
}

// 栏杆：a、b 两点（局部坐标，y 为地面）
export function rail(K, T, a, b, h = .95, mat = 'marble', sp = 1.15) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ry = Math.atan2(dx, dz) - Math.PI / 2, n = Math.max(1, Math.round(L / sp));
  for (let i = 0; i <= n; i++) {
    const x = a[0] + dx * i / n, z = a[1] + dz * i / n;
    K.add(mat, box(.16, h, .16), at(T, x, h / 2, z));
    K.add(mat, box(.22, .14, .22), at(T, x, h + .05, z));
  }
  const m = at(T, (a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2, ry);
  K.add(mat, box(L, .1, .12), at(m, 0, h - .1, 0));
  K.add(mat, box(L, h * .42, .06), at(m, 0, h * .32, 0));
}

// 台基 + 前阶 + 汉白玉栏杆
export function platform(K, T, o) {
  const { w, d, h, stair = 3.2, railH = 0 } = o;
  K.add('stone', box(w, h, d), at(T, 0, -h / 2, 0));
  K.add('marble', box(w + .2, .18, d + .2), at(T, 0, -.09, 0));
  const n = Math.ceil(h / .17), rs = h / n;
  for (let i = 0; i < n; i++) K.add('marble', box(stair, rs * (i + 1), .34), at(T, 0, -h + rs * (i + 1) / 2, d / 2 + .34 * (n - i - .5)));
  if (railH) {
    const x = w / 2 - .15, z = d / 2 - .15, g = stair / 2 + .1;
    rail(K, T, [-x, z], [-g, z], railH); rail(K, T, [g, z], [x, z], railH);
    rail(K, T, [x, z], [x, -z], railH); rail(K, T, [-x, z], [-x, -z], railH); rail(K, T, [-x, -z], [x, -z], railH);
  }
}

// 楼阁：多层，下层腰檐、上层歇山
export function louge(K, T, o) {
  const { floors, plat, lit = [] } = o;
  platform(K, T, plat);
  let y = 0;
  for (let i = 0; i < floors.length; i++) {
    const f = floors[i], top = i === floors.length - 1, sc = f.sc ?? 1;
    const T1 = at(T, 0, y, 0);
    const yr = hall(K, T1, { ...f, lit: lit[i] ?? 0 });
    const oh = f.oh ?? 1.8, W = f.w / 2 + oh, D = f.d / 2 + oh;
    if (top) {
      roofRect(K, at(T1, 0, yr - .05, 0), { W, D, H: D * (f.rise ?? .62), t0: .42, lift: f.lift ?? 1.3, out: f.out ?? .7, sc });
    } else {
      const nf = floors[i + 1], bal = .95, tMax = 1 - (nf.d / 2 + bal + .1) / D, H = D * (f.yaoRise ?? 1.0);
      roofRect(K, at(T1, 0, yr - .05, 0), { W, D, H, tMax, lift: f.lift ?? 1.05, out: f.out ?? .55, sc });
      const yb = yr - .05 + H * yP(tMax) + .15;
      K.add('red', box(nf.w + 2 * bal, .3, nf.d + 2 * bal), at(T1, 0, yb + .15, 0));
      const x = nf.w / 2 + bal - .1, z = nf.d / 2 + bal - .1, T2 = at(T1, 0, yb + .3, 0);
      rail(K, T2, [-x, z], [x, z], .85, 'red', .9); rail(K, T2, [x, z], [x, -z], .85, 'red', .9);
      rail(K, T2, [-x, z], [-x, -z], .85, 'red', .9); rail(K, T2, [-x, -z], [x, -z], .85, 'red', .9);
      y += yb + .3;
    }
  }
}

// 牌坊：三间四柱三楼，匾额留空
export function paifang(K, T, o = {}) {
  const sc = o.sc ?? 1, ci = 2.0 * sc, co = 5.1 * sc, hi = 6.2 * sc, ho = 4.9 * sc, cr = .34 * sc;
  for (const [x, h] of [[-co, ho], [-ci, hi], [ci, hi], [co, ho]]) {
    K.add('red', cyl(cr, cr, h), at(T, x, h / 2, 0));
    K.add('stone', box(.95 * sc, 1.5 * sc, 1.25 * sc), at(T, x, .75 * sc, 0));
  }
  const bay = (x, len, y1, y2, ry, rW, rD, rH, gy) => {
    K.add('beam', box(len + cr * 2, .5 * sc, .34 * sc), at(T, x, y1, 0));
    K.add('beam', box(len + cr * 2, .4 * sc, .3 * sc), at(T, x, y2, 0));
    K.add('red', box(len, (y1 - y2) - .45 * sc, .14 * sc), at(T, x, (y1 + y2) / 2, 0));
    K.add('red', box(len + .3, .14 * sc, .7 * sc), at(T, x, y1 + .32 * sc, 0));
    const n = Math.max(2, Math.round(len / (.75 * sc)));
    for (let i = 0; i <= n; i++) {
      const xx = x - len / 2 + len * i / n;
      gong(K, at(T, xx, y1 + .39 * sc, 0), sc * .85); gong(K, at(T, xx, y1 + .39 * sc, 0, Math.PI), sc * .85);
    }
    K.add('gong2', box(len + .9, .14 * sc, 1.4 * sc), at(T, x, gy - .07, 0));
    roofRect(K, at(T, x, gy, 0), { W: rW, D: rD, H: rH, lift: .75 * sc, out: .45 * sc, sc: sc * .8, R: rW - rD * .8, th: .26 });
  };
  bay(0, ci * 2 - cr, 5.7 * sc, 4.1 * sc, 0, ci + .9 * sc, 1.35 * sc, 1.05 * sc, 6.82 * sc);
  for (const sg of [-1, 1]) bay(sg * (ci + co) / 2, co - ci - cr, 4.5 * sc, 3.25 * sc, 0, (co - ci) / 2 + .75 * sc, 1.15 * sc, .85 * sc, 5.62 * sc);
  // 匾：金边蓝底，不题字
  K.add('gold', box(2.3 * sc, 1.05 * sc, .1 * sc), at(T, 0, 4.9 * sc, .2 * sc));
  K.add('plaque', box(2.0 * sc, .8 * sc, .06 * sc), at(T, 0, 4.9 * sc, .26 * sc));
  K.add('plaque', box(2.0 * sc, .8 * sc, .06 * sc), at(T, 0, 4.9 * sc, -.26 * sc));
}

// 院墙：青砖、瓦顶
export function wall(K, T, x0, x1, h = 4.4, t = 1.1) {
  const L = x1 - x0, cx = (x0 + x1) / 2;
  K.add('brick', box(L, h, t), at(T, cx, h / 2, 0));
  K.add('stone', box(L + .1, .5, t + .2), at(T, cx, .25, 0));
  roofRect(K, at(T, cx, h, 0), { W: L / 2 + .25, D: t / 2 + .45, H: .5, R: L / 2 + .25 - .3, lift: .25, out: .1, sc: .55, th: .18 });
}

// 六角亭
export function ting(K, T, o = {}) {
  const r = o.r ?? 2.6, ch = o.ch ?? 3.1, N = 6;
  K.add('stone', cyl(r + .9, r + 1.05, .8, N), at(T, 0, -.4, 0));
  K.add('marble', cyl(r + .95, r + .95, .12, N), at(T, 0, -.06, 0));
  const P = i => { const a = 2 * Math.PI / 3 + 2 * Math.PI * i / N; return [Math.cos(a) * r, Math.sin(a) * r]; };
  for (let i = 0; i < N; i++) {
    const [x, z] = P(i), [x2, z2] = P(i + 1);
    K.add('red', cyl(.2, .21, ch), at(T, x, ch / 2, z));
    const mx = (x + x2) / 2, mz = (z + z2) / 2, L = Math.hypot(x2 - x, z2 - z), ry = Math.atan2(x2 - x, z2 - z) - Math.PI / 2;
    K.add('beam', box(L, .36, .24), at(T, mx, ch - .18, mz, ry));
    K.add('red', box(L, .12, .5), at(T, mx, ch + .06, mz, ry));
    if (i !== 5) rail(K, at(T, 0, 0, 0), [x, z], [x2, z2], .7, 'red', .7);    // 正面 i=1 留口
    for (let k = 0; k < 2; k++) gong(K, at(T, mx + (x2 - x) * (k - .5) * .5, ch + .12, mz + (z2 - z) * (k - .5) * .5, Math.atan2(mx, mz)), .8);
  }
  roofPoly(K, at(T, 0, ch + .85, 0), { N, Rc: r + 1.5, H: 2.6, lift: 1.0, out: .5, rot: 2 * Math.PI / 3, sc: .8 });
}

// 宫灯
export function lantern(K, T, s = 1) {
  K.add('lamp', cyl(.26 * s, .26 * s, .5 * s, 10), at(T, 0, 0, 0));
  K.add('gold', cyl(.18 * s, .2 * s, .1 * s, 10), at(T, 0, .3 * s, 0));
  K.add('gold', cyl(.2 * s, .18 * s, .1 * s, 10), at(T, 0, -.3 * s, 0));
  K.add('lampTassel', cyl(.03 * s, .07 * s, .35 * s, 6), at(T, 0, -.52 * s, 0));
}
// 石灯笼
export function stoneLamp(K, T) {
  K.add('stone', box(.45, .25, .45), at(T, 0, .12, 0));
  K.add('stone', cyl(.1, .12, .8, 8), at(T, 0, .65, 0));
  K.add('lampStone', box(.36, .34, .36), at(T, 0, 1.2, 0));
  K.add('stone', new THREE.ConeGeometry(.42, .35, 4).rotateY(Math.PI / 4), at(T, 0, 1.55, 0));
}

// 石阶：沿折线一级级排
export function stairs(K, path, wd = 3.2) {
  const I = new THREE.Matrix4();
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    const dx = b[0] - a[0], dz = b[2] - a[2], dy = b[1] - a[1], L = Math.hypot(dx, dz);
    const n = Math.max(1, Math.round(Math.abs(dy) / .17)), rise = dy / n, run = L / n, ry = Math.atan2(dx, dz);
    for (let k = 0; k < n; k++) {
      const f = (k + .5) / n, top = a[1] + rise * (k + 1), hh = Math.abs(rise) + 1.2;
      K.add('stone', box(wd, hh, run + .04), at(I, a[0] + dx * f, top - hh / 2, a[2] + dz * f, ry));
    }
    // 两侧栏板
    const dir = new V3(dx, dy, dz).normalize(), q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 0, 1), dir);
    const side = new V3(dz, 0, -dx).normalize();
    for (const sg of [-1, 1]) {
      const c = new V3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + .45, (a[2] + b[2]) / 2).addScaledVector(side, sg * (wd / 2 + .12));
      K.add('marble', box(.22, .55, Math.hypot(L, dy)), new THREE.Matrix4().compose(c, q, new V3(1, 1, 1)));
    }
    K.add('stone', box(wd + .6, 1.2, wd + .6), at(I, b[0], b[1] - .6, b[2], ry));
  }
}

// ---------------- 山脚的小物件 ----------------

// 门庭的一扇随墙门：门罩小顶、门印匾（匾面另由调用方贴字）、门扇；没开的门交叉贴符，开着的半掩透光
export function wallDoor(K, T, o = {}) {
  const shut = !!o.shut, dw = 2.3, dh = 3.0, t = 1.1;
  K.add('stone', box(dw + .7, .35, t + .3), at(T, 0, .17, 0));
  for (const sg of [-1, 1]) K.add('stone', box(.32, dh + .2, t + .25), at(T, sg * (dw / 2 + .16), (dh + .2) / 2, 0));
  K.add('stone', box(dw + .64, .32, t + .25), at(T, 0, dh + .36, 0));
  K.add('doorDark', box(dw, dh, t + .06), at(T, 0, dh / 2, 0));
  if (shut) {
    for (const sg of [-1, 1]) K.add('red', box(dw / 2 - .03, dh - .05, .1), at(T, sg * dw / 4, dh / 2, t / 2 + .06));
    for (const sg of [-1, 1]) {
      const m = at(T, 0, dh * .55, t / 2 + .13).multiply(new THREE.Matrix4().makeRotationZ(sg * .62));
      K.add('fu', box(dw * 1.15, .2, .02), m);
    }
  } else {
    K.add('red', box(dw / 2 - .03, dh - .05, .1), at(T, -dw / 4, dh / 2, t / 2 + .06));
    K.add('red', box(.1, dh - .05, dw / 2 - .1), at(T, dw / 2 - .05, dh / 2, t / 2 + dw / 4 + .02));
    K.add('glowIn', box(dw / 2 - .1, dh - .2, .04), at(T, dw / 4, dh / 2 - .05, t / 2 - .02));
  }
  for (const sg of [-1, 1]) for (let r = 0; r < 3; r++) K.add('gold', new THREE.SphereGeometry(.05, 6, 4), at(T, sg * (dw / 4 + .02), dh * (.35 + r * .2), t / 2 + .13));
  roofRect(K, at(T, 0, dh + .6, 0), { W: dw / 2 + 1.0, D: t / 2 + .75, H: .75, R: dw / 2 + .2, lift: .35, out: .2, sc: .55, th: .16 });
}

// 渡口：栈桥伸进水里，桥尾泊一只乌篷船
export function dukou(K, T) {
  const L = 16, w = 2.4;
  K.add('wood', box(w, .22, L), at(T, 0, 1.15, L / 2));
  for (let i = 0; i <= 8; i++) for (const sg of [-1, 1]) K.add('wood', cyl(.13, .15, 4.2, 6), at(T, sg * (w / 2 - .1), -.9, i * L / 8));
  for (let i = 0; i < 16; i++) K.add('woodDark', box(w + .02, .03, .05), at(T, 0, 1.27, .5 + i * L / 16));
  // 船：船身用压扁的半球拉长，乌篷是半个筒
  const hull = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  hull.scale(1.25, .75, 4.6);
  const B = at(T, 2.9, .45, L - 1.5, .08);
  K.add('woodDark', hull, B);
  K.add('wood', box(2.3, .08, 8.6), at(B, 0, .02, 0));
  const peng = new THREE.CylinderGeometry(1.05, 1.05, 3.6, 16, 1, true, -Math.PI / 2, Math.PI);
  peng.rotateX(Math.PI / 2);
  K.add('peng', peng, at(B, 0, .1, -.3));
  K.add('wood', cyl(.05, .06, 3.4, 5), at(B, .3, 1.6, 3.2));
  K.add('lamp', cyl(.16, .16, .3, 8), at(B, 0, 1.25, -2.3));
}

// 签筒：石几上一只竹筒，插一把签
export function qiantong(K, T) {
  K.add('stone', box(1.6, .75, 1.0), at(T, 0, .375, 0));
  K.add('marble', box(1.8, .12, 1.15), at(T, 0, .8, 0));
  K.add('bamboo', cyl(.2, .2, .62, 12), at(T, 0, 1.17, 0));
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, r = .1 * Math.sqrt(i / 9);
    const m = at(T, Math.cos(a) * r, 1.62, Math.sin(a) * r).multiply(new THREE.Matrix4().makeRotationZ((Math.cos(a) * .12)));
    K.add('bamboo2', box(.04, .6, .015), m);
  }
}

// 问路石：一块立石，正面刻字（字由调用方贴）
export function wenlu(K, T) {
  const g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + .08 * Math.sin(v.x * 7 + v.y * 5) + .06 * Math.cos(v.z * 9); p.setXYZ(i, v.x * .9 * k, v.y * 1.9 * k + 1.75, v.z * .45 * k); }
  g.computeVertexNormals();
  K.add('stone', g, T);
  K.add('stone', box(2.2, .3, 1.4), at(T, 0, .15, 0));
}

// 蛰庐：崖下一扇小门，石框、门环
export function zhelu(K, T) {
  K.add('stone', box(2.4, 3.2, .6), at(T, 0, 1.6, -.2));
  K.add('doorDark', box(1.5, 2.3, .2), at(T, 0, 1.15, .12));
  K.add('woodDark', box(1.4, 2.2, .08), at(T, 0, 1.12, .24));
  K.add('gold', new THREE.TorusGeometry(.09, .02, 6, 12), at(T, .3, 1.15, .3));
  K.add('stone', box(2.8, .3, .9), at(T, 0, 3.3, 0));
}

// 白狐：卧在松下，尾巴绕到身前
export function fox(K, T) {
  const body = new THREE.SphereGeometry(1, 14, 10); body.scale(.55, .34, .3);
  K.add('fox', body, at(T, 0, .34, 0));
  const head = new THREE.SphereGeometry(.2, 12, 8);
  K.add('fox', head, at(T, .55, .58, .05));
  const snout = new THREE.ConeGeometry(.09, .26, 8); snout.rotateZ(-Math.PI / 2);
  K.add('fox', snout, at(T, .78, .54, .05));
  for (const sz of [-.08, .14]) K.add('fox', new THREE.ConeGeometry(.07, .2, 6), at(T, .5, .82, sz));
  const tail = [[-.45, .3, 0], [-.85, .35, .25], [-.75, .25, .55], [-.2, .18, .5], [.25, .15, .42]].map(q => new THREE.Vector3(...q));
  K.add('fox', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tail), 20, .16, 8, false), T);
  K.add('foxEye', new THREE.SphereGeometry(.03, 6, 4), at(T, .7, .63, .16));
  K.add('foxEye', new THREE.SphereGeometry(.03, 6, 4), at(T, .7, .63, -.06));
}

// 古琴：琴几上一张
export function guqin(K, T) {
  K.add('woodDark', box(2.4, .08, .5), at(T, 0, 0, 0));
  for (let i = 0; i < 13; i++) K.add('gold', new THREE.SphereGeometry(.025, 6, 4), at(T, -.9 + i * .14, .05, .2));
  for (let i = 0; i < 7; i++) K.add('gold', box(2.2, .008, .008), at(T, 0, .045, -.15 + i * .045));
}
