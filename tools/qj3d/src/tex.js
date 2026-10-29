// 程序贴图：瓦、椽、彩画、隔扇、石、砖、匾上的字。全部画在 canvas 上，不用外部图片。
import * as THREE from 'three';
import { n2, fbm } from './terrain.js';

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function done(c, { srgb = true, rep = [1, 1] } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8; t.repeat.set(rep[0], rep[1]);
  return t;
}
// 逐像素：f(u, v) -> [r, g, b] (0..1)
function pix(w, h, f) {
  const c = canvas(w, h), g = c.getContext('2d'), im = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, gg, b] = f(x / w, y / h), i = (y * w + x) * 4;
    im.data[i] = r * 255; im.data[i + 1] = gg * 255; im.data[i + 2] = b * 255; im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0); return c;
}
// 高度 -> 法线
function normals(w, h, H, k) {
  return pix(w, h, (u, v) => {
    const x = Math.round(u * w), y = Math.round(v * h);
    const at = (a, b) => H[((b + h) % h) * w + ((a + w) % w)];
    const dx = (at(x + 1, y) - at(x - 1, y)) * k, dy = (at(x, y + 1) - at(x, y - 1)) * k;
    const l = Math.hypot(dx, dy, 1);
    return [(-dx / l + 1) / 2, (dy / l + 1) / 2, (1 / l + 1) / 2];
  });
}
const hsh = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

export function makeTex() {
  const T = {};

  // 瓦：一张 = 两垄筒瓦 × 两层，覆盖 0.6m × 0.8m
  {
    const w = 256, h = 256, H = new Float32Array(w * h), A = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = x / w * 2, v = y / h * 2, cu = u % 1, cv = v % 1, col = Math.floor(u), row = Math.floor(v);
      const d = Math.abs(cu - .5), tw = .19;
      let ht, tube = d < tw;
      if (tube) ht = .55 + .45 * Math.sqrt(1 - (d / tw) ** 2);
      else ht = .12 * Math.min(1, (d - tw) / (.5 - tw)) ** .5;
      ht += .28 * (1 - cv) * (tube ? 1 : .6);
      if (tube && cv < .06) ht -= .2;
      H[y * w + x] = ht;
      const r = hsh(col + (tube ? 0 : 9), row) * .14 - .07 + .05 * n2(x / 9, y / 9);
      const base = tube ? .26 + .09 * Math.sqrt(Math.max(0, 1 - (d / tw) ** 2)) : .15;
      A.push(base + r);
    }
    let i = 0;
    T.tile = done(pix(w, h, () => { const b = A[i++]; return [b * .78, b * .9, b * 1.02]; }), { rep: [1 / .6, 1 / .8] });
    T.tileN = done(normals(w, h, H, 5), { srgb: false, rep: [1 / .6, 1 / .8] });
  }

  // 檐下椽子：青绿相间，望板朱红，一张 = 两根椽 0.7m
  T.rafter = done(pix(128, 32, (u) => {
    const cu = (u * 2) % 1, k = Math.floor(u * 2), d = Math.abs(cu - .5);
    if (d < .2) { const s = .6 + .4 * Math.sqrt(1 - (d / .2) ** 2); return k ? [.11 * s, .19 * s, .24 * s] : [.12 * s, .21 * s, .18 * s]; }
    return [.17, .08, .07];
  }), { rep: [1 / .5, 1] });

  // 额枋彩画：青绿旋子，金线；一张 = 2.4m × 0.45m
  {
    const c = canvas(512, 96), g = c.getContext('2d');
    g.fillStyle = '#1f4f6b'; g.fillRect(0, 0, 512, 96);
    g.fillStyle = '#245f4d'; g.fillRect(150, 0, 212, 96);
    g.strokeStyle = '#c9a24a'; g.lineWidth = 5;
    g.strokeRect(2, 6, 508, 84);
    for (const x of [150, 362]) { g.beginPath(); g.moveTo(x, 6); g.lineTo(x + (x < 256 ? -26 : 26), 48); g.lineTo(x, 90); g.stroke(); }
    g.strokeRect(176, 22, 160, 52);
    for (const cx of [70, 442]) {
      for (const [r, col] of [[34, '#c9a24a'], [26, '#e9e1cc'], [17, '#2c6e8a'], [8, '#c9a24a']]) { g.fillStyle = col; g.beginPath(); g.arc(cx, 48, r, 0, 7); g.fill(); }
    }
    T.beam = done(c, { rep: [1 / 2.4, 1 / .45] });
  }

  // 隔扇：上格心、下裙板；一张 = 一扇（贴图 uv 0..1）
  {
    const W = 128, Hh = 256;
    const draw = (lit) => {
      const c = canvas(W, Hh), g = c.getContext('2d');
      g.fillStyle = lit ? '#000' : '#5a1d17'; g.fillRect(0, 0, W, Hh);
      g.fillStyle = lit ? '#fff2d0' : '#c9b48c'; g.fillRect(12, 12, W - 24, 150);
      g.fillStyle = lit ? '#000' : '#6e241c';
      for (let x = 12; x < W - 12; x += 13) g.fillRect(x, 12, 3, 150);
      for (let y = 12; y < 162; y += 13) g.fillRect(12, y, W - 24, 3);
      if (!lit) { g.strokeStyle = '#b08a3e'; g.lineWidth = 3; g.strokeRect(20, 196, W - 40, 46); g.strokeRect(20, 170, W - 40, 16); }
      return c;
    };
    T.win = done(draw(false));
    T.winE = done(draw(true));
  }

  // 石：灰白麻面；一张 = 2m
  T.stone = done(pix(256, 256, (u, v) => {
    const n = .5 + .35 * fbm(u * 8, v * 8, 5) + .15 * n2(u * 60, v * 60);
    const b = .50 + .22 * n; return [b * .95, b * .97, b];
  }), { rep: [.5, .5] });
  // 汉白玉
  T.marble = done(pix(128, 128, (u, v) => { const b = .78 + .1 * fbm(u * 6, v * 6, 4); return [b, b * .98, b * .95]; }), { rep: [.5, .5] });

  // 青砖：一张 = 1.2m × 0.48m（4 × 4 块）
  T.brick = done(pix(256, 128, (u, v) => {
    const row = Math.floor(v * 4), cu = (u * 4 + (row % 2) * .5) % 1, cv = (v * 4) % 1, col = Math.floor(u * 4 + (row % 2) * .5);
    if (cu < .04 || cv < .08) return [.42, .42, .40];
    const b = .30 + .07 * hsh(col, row) + .04 * n2(u * 40, v * 40); return [b * .9, b * .97, b * 1.04];
  }), { rep: [1 / 1.2, 1 / .48] });

  // 岩：三向投影用，一张 = 12m
  T.rock = done(pix(256, 256, (u, v) => {
    const n = .55 + .45 * fbm(u * 6, v * 14, 6);
    const s = .8 + .2 * n2(u * 40, v * 90);
    const b = n * s; return [b, b, b];
  }), { srgb: false });

  // 云团、月晕
  T.cloud = (() => {
    const c = pix(256, 128, (u, v) => {
      const dx = (u - .5) * 2, dy = (v - .58) * 2.2;
      const r = Math.hypot(dx, dy * 1.4);
      const n = fbm(u * 5 + 3, v * 5, 5);
      const a = Math.max(0, Math.min(1, (1 - r) * 1.5 + n * .9 - .25));
      return [a, a, a];
    });
    const t = new THREE.CanvasTexture(c); return t;
  })();
  T.glow = (() => {
    const c = canvas(128, 128), g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,250,235,.9)');
    gr.addColorStop(.24, 'rgba(255,240,210,.35)'); gr.addColorStop(1, 'rgba(255,230,200,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  return T;
}

// 匾、门印、刻石上的字：竖排或横排，金字蓝底 / 刻字石面等
export function textTex(text, o = {}) {
  const { w = 256, h = 256, bg = '#1a2a55', fg = '#d9ae4e', font = 'serif', vertical = false, rim = '#c9a24a', size = .62, carve = false } = o;
  const c = canvas(w, h), g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  if (rim) { g.strokeStyle = rim; g.lineWidth = Math.min(w, h) * .05; g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth); }
  const chars = Array.from(text), n = chars.length;
  const fs = vertical ? Math.min(w * size, h * .86 / n) : Math.min(h * size, w * .86 / n);
  g.font = '600 ' + fs + 'px ' + font; g.textAlign = 'center'; g.textBaseline = 'middle';
  chars.forEach((ch, i) => {
    const x = vertical ? w / 2 : w / 2 + (i - (n - 1) / 2) * fs * 1.05;
    const y = vertical ? h / 2 + (i - (n - 1) / 2) * fs * 1.05 : h / 2 + fs * .04;
    if (carve) { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillText(ch, x + fs * .03, y + fs * .03); }
    g.fillStyle = fg; g.fillText(ch, x, y);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
