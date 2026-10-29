// =========================================================
// 入阁 · 显形：真 3D 的潜蛟阁（three.js）
// 首页入阁先给线稿全览；assets/js/qj/ge.js 在后台 import() 这一包，调 build() 把山建出来，
// 建好了在角上浮一枚「山已显形」，点「入山」才换上这一幅。往下滚 = 沿石阶一站一站登山。
//
// 楼阁、山、树都由代码现做，不用外部模型：
//   terrain.js 山体高度场、各处台地、石阶走线
//   arch.js    屋顶（庑殿 / 歇山 / 腰檐 / 攒尖，举折与翼角起翘）、斗拱、隔扇、牌坊、亭、楼阁和山脚小物件
//   tex.js     瓦、椽、彩画、隔扇、石、砖、匾上的字，全画在 canvas 上
// 场所 id 与线稿版同（ge.js 的 places），名牌也是 .ge-place 链接，点按、读屏、音律都走 ge.js 那一套。
// 门庭的门 = data/wushu.toml 的门（未开的贴符），法宝库的宫灯 = 法宝件数（有禁制的贴符）。
// =========================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { height, SITES, PATH, pathInfo, fbm, ridged, rnd, sstep } from './terrain.js';
import { makeTex, textTex } from './tex.js';
import * as A from './arch.js';

const V3 = THREE.Vector3, C = h => new THREE.Color(h);
const pause = () => new Promise(r => setTimeout(r, 0));   // 建一段让一下主线程，线稿那边不卡

// 高度雾：低处浓、高处淡
THREE.ShaderChunk.fog_pars_vertex = '#ifdef USE_FOG\nvarying float vFogDepth;\nvarying vec3 vFogW;\n#endif';
THREE.ShaderChunk.fog_vertex = '#ifdef USE_FOG\nvFogDepth = - mvPosition.z;\nvFogW = ( inverse( viewMatrix ) * vec4( mvPosition.xyz, 1.0 ) ).xyz;\n#endif';
THREE.ShaderChunk.fog_pars_fragment = `#ifdef USE_FOG
uniform vec3 fogColor; varying float vFogDepth; varying vec3 vFogW;
#ifdef FOG_EXP2
uniform float fogDensity;
#else
uniform float fogNear; uniform float fogFar;
#endif
#endif`;
THREE.ShaderChunk.fog_fragment = `#ifdef USE_FOG
float qjLow = exp( - max( vFogW.y - 1.0, 0.0 ) / 7.0 );
float fogFactor = 1.0 - exp( - vFogDepth * ( fogDensity + 0.007 * qjLow ) );
gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor * ( 1.0 + 0.35 * qjLow ), clamp( fogFactor, 0.0, 1.0 ) );
#endif`;

// 登山的站：[机位, 看向, 这一站看的场所]。第一站是全景，名牌全亮，当一张地图
const STA = [
  [[0, 10, 104], [0, 38, -36], ['du', 'shanmen', 'ting', 'qian', 'wenlu']],
  [[-3, 4.6, 40], [0, 6, 6], ['shanmen', 'ting', 'qian', 'wenlu']],
  [[22, 15, 16], [42, 11, -4], ['shi', 'men']],
  [[-4, 15, 8], [-26, 22, -12], ['cang']],
  [[6, 31, 4], [25, 34, -21], ['fabao']],
  [[-8, 57, -15], [-30, 53.5, -46], ['qin', 'fox']],
  [[18, 80, -26], [0, 84, -64], ['ge']],
  [[2, 100, -50], [2, 145, -140], ['dou']],
];
const NS = STA.length - 1;
const DIP = new V3(.42, .55, -.8).normalize();   // 北斗那一片天
const DOU_P = [34, 137, -137];                    // 竖屏最后一站看的地方：偏右 20°、仰 22°
const MOON = new V3(-.36, .40, -.84).normalize();

export async function build(o) {
  const { host, places = [], data = {} } = o;
  const font = o.font || 'serif';
  const LO = o.lo ?? (innerWidth < 760 || matchMedia('(pointer: coarse)').matches);
  const W = () => Math.max(1, host.clientWidth), H = () => Math.max(1, Math.min(host.clientHeight, innerHeight));
  try { await Promise.race([document.fonts.load('600 40px ' + font, '云从关集云斋'), new Promise(r => setTimeout(r, 1500))]); } catch (e) {}

  // ---------- 渲染器 ----------
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  const DPR = Math.min(devicePixelRatio || 1, LO ? 1.5 : 2);
  renderer.setPixelRatio(DPR);
  renderer.setSize(W(), H(), false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;   // 景是静的，影子只算一次
  const canvas = renderer.domElement;
  canvas.className = 'ge3-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const FOG = C('#2a2747');
  scene.fog = new THREE.FogExp2(FOG, .0034);
  const camera = new THREE.PerspectiveCamera(40, W() / H(), .5, 4000);
  const T = makeTex();

  // ---------- 天：渐变、月、星、北斗 ----------
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { moon: { value: MOON } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec3 vD; uniform vec3 moon;
      void main(){
        float h = vD.y;
        vec3 zen = vec3(.010,.010,.035), mid = vec3(.040,.032,.085), hor = vec3(.105,.085,.170);
        vec3 c = mix(hor, mid, smoothstep(-.02,.18,h)); c = mix(c, zen, smoothstep(.18,.7,h));
        float m = max(dot(vD, moon), 0.);
        c += vec3(.55,.52,.62) * (pow(m, 14.) * .22 + pow(m, 160.) * .8);
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 48, 24), skyMat);
  scene.add(sky);
  {
    const p = [], c = [];
    for (let i = 0; i < 2200; i++) {
      const u = rnd(), v = rnd(), th = u * Math.PI * 2, y = .04 + Math.pow(v, .8) * .96, r = Math.sqrt(1 - y * y);
      p.push(Math.cos(th) * r * 1700, y * 1700, Math.sin(th) * r * 1700);
      const b = .25 + Math.pow(rnd(), 6) * 1.6; c.push(b, b, b * 1.1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    sky.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false })));
    const dip = [[0, 0], [1, .15], [1.9, .1], [2.7, .35], [3.0, 1.2], [4.1, 1.35], [4.2, .45]];
    const bp = [];
    for (const [a, b] of dip) { const d = new V3(.28 + a * .055, .5 + b * .055, -.82).normalize().multiplyScalar(1690); bp.push(d.x, d.y, d.z); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
    sky.add(new THREE.Points(bg, new THREE.PointsMaterial({ size: 3.4, sizeAttenuation: false, color: C('#fff4dc').multiplyScalar(2.2), fog: false, depthWrite: false })));
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: new THREE.Color(5.0, 4.7, 4.2), fog: false, depthWrite: false, transparent: true }));
    moon.position.copy(MOON).multiplyScalar(1650); moon.scale.setScalar(150);
    sky.add(moon);
  }
  {
    const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), skyMat));
    scene.environment = pm.fromScene(es, .02).texture;
    scene.environmentIntensity = 1.6;
    pm.dispose();
  }

  // ---------- 灯：月光从左侧斜打，月亮本身照旧挂在画里 ----------
  scene.add(new THREE.HemisphereLight(C('#4a4f86'), C('#1c1512'), .9));
  const moonL = new THREE.DirectionalLight(C('#b9c4ff'), 2.2);
  moonL.position.set(-170, 150, -10);
  moonL.target.position.set(0, 30, -30);
  moonL.castShadow = true;
  Object.assign(moonL.shadow.camera, { left: -110, right: 110, top: 100, bottom: -80, near: 10, far: 520 });
  moonL.shadow.mapSize.setScalar(LO ? 1024 : 2048); moonL.shadow.bias = -.0004; moonL.shadow.normalBias = .04;
  scene.add(moonL, moonL.target);
  const fill = new THREE.DirectionalLight(C('#6f7fc8'), .4);
  fill.position.set(60, 40, 120); scene.add(fill);

  // ---------- 材质 ----------
  const S = q => new THREE.MeshStandardMaterial(q);
  const M = {
    tile: S({ map: T.tile, normalMap: T.tileN, normalScale: new THREE.Vector2(1.5, 1.5), roughness: .38, metalness: .3 }),
    rafter: S({ map: T.rafter, roughness: .8, side: THREE.DoubleSide }),
    fascia: S({ color: C('#3b1a14'), roughness: .7, side: THREE.DoubleSide }),
    ridge: S({ color: C('#2b363f'), roughness: .35, metalness: .3 }),
    red: S({ color: C('#8c2a1f'), roughness: .55 }),
    shanhua: S({ color: C('#7a2419'), roughness: .6, side: THREE.DoubleSide }),
    gong: S({ color: C('#2f6d68'), roughness: .6 }),
    gong2: S({ color: C('#2c4f80'), roughness: .6 }),
    beam: S({ map: T.beam, roughness: .55 }),
    wall: S({ color: C('#4a1c16'), roughness: .8 }),
    win: S({ map: T.win, roughness: .8, side: THREE.DoubleSide }),
    winLit: S({ map: T.win, emissive: C('#ffad5a'), emissiveMap: T.winE, emissiveIntensity: 2.4, roughness: .8, side: THREE.DoubleSide }),
    winDim: S({ map: T.win, emissive: C('#ff9440'), emissiveMap: T.winE, emissiveIntensity: .9, roughness: .8, side: THREE.DoubleSide }),
    stone: S({ map: T.stone, color: C('#a7adb3'), roughness: .92 }),
    marble: S({ map: T.marble, color: C('#e4e0d8'), roughness: .6 }),
    gold: S({ color: C('#d1a64c'), metalness: .9, roughness: .3 }),
    plaque: S({ color: C('#1a2a55'), roughness: .45, metalness: .2 }),
    brick: S({ map: T.brick, roughness: .9 }),
    lamp: S({ color: C('#b0241a'), emissive: C('#ff5a24'), emissiveIntensity: 4.5, roughness: .6 }),
    lampTassel: S({ color: C('#c9a24a'), roughness: .5 }),
    lampStone: S({ color: C('#333'), emissive: C('#ffb45e'), emissiveIntensity: 5, roughness: .6 }),
    doorDark: S({ color: C('#0d0a10'), roughness: 1 }),
    glowIn: S({ color: C('#222'), emissive: C('#ffad5a'), emissiveIntensity: 2.2 }),
    fu: S({ color: C('#d8c072'), roughness: .8, emissive: C('#3a2a08'), emissiveIntensity: .4 }),
    wood: S({ color: C('#5a4030'), roughness: .85 }),
    woodDark: S({ color: C('#2a1d16'), roughness: .8 }),
    peng: S({ color: C('#16141a'), roughness: .9, side: THREE.DoubleSide }),
    bamboo: S({ color: C('#6f7a3a'), roughness: .6 }),
    bamboo2: S({ color: C('#c9b07a'), roughness: .7 }),
    fox: S({ color: C('#eeeaf6'), emissive: C('#8c88b8'), emissiveIntensity: .35, roughness: .9 }),
    foxEye: S({ color: C('#111'), emissive: C('#d9ae4e'), emissiveIntensity: 1.5 }),
  };
  await pause();

  // ---------- 山 ----------
  function tri(mat) {
    mat.onBeforeCompile = sh => {
      sh.uniforms.rockMap = { value: T.rock };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTW; varying vec3 vTN;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvTW = (modelMatrix * vec4(transformed, 1.0)).xyz; vTN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D rockMap; varying vec3 vTW; varying vec3 vTN;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          vec3 bw = pow(abs(vTN), vec3(4.)); bw /= (bw.x + bw.y + bw.z);
          float r1 = texture2D(rockMap, vTW.zy / 14.).r * bw.x + texture2D(rockMap, vTW.xz / 14.).r * bw.y + texture2D(rockMap, vTW.xy / 14.).r * bw.z;
          float r2 = texture2D(rockMap, vTW.zy / 3.3).r * bw.x + texture2D(rockMap, vTW.xz / 3.3).r * bw.y + texture2D(rockMap, vTW.xy / 3.3).r * bw.z;
          diffuseColor.rgb *= .35 + 1.05 * r1 * (.65 + .55 * r2);`);
    };
    return mat;
  }
  const terrMat = tri(S({ vertexColors: true, roughness: .93 }));
  function heightMesh(x0, x1, z0, z1, nx, nz, hf, colf) {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz); g.rotateX(-Math.PI / 2);
    g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, hf(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    const n = g.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { colf(c, p.getX(i), p.getY(i), p.getZ(i), n.getY(i)); col.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }
  const cRock = C('#6f7a84'), cOchre = C('#7d6a52'), cMoss = C('#365f4f'), cMoss2 = C('#4f8774'), cBlue = C('#3f6d96'), cTmp = new THREE.Color();
  function rockColor(c, x, y, z, ny) {
    const k = .5 + .5 * fbm(x / 18, z / 18, 3);
    c.copy(cRock).lerp(cOchre, sstep(26, 0, y) * .55 * k);
    const flat = sstep(.55, .86, ny) * (.55 + .45 * k);
    cTmp.copy(cMoss).lerp(cMoss2, k); c.lerp(cTmp, flat);
    c.lerp(cBlue, sstep(.7, .95, ny) * sstep(45, 95, y) * .55);
  }
  const terr = new THREE.Mesh(heightMesh(-150, 150, -200, 60, LO ? 160 : 300, LO ? 140 : 260, height, rockColor), terrMat);
  terr.receiveShadow = terr.castShadow = true;
  scene.add(terr);
  await pause();
  {
    const far = (x, z) => {
      const d = sstep(-190, -260, z), r = ridged(x / 140, z / 140, 5);
      return d * (25 + 210 * Math.pow(r, 2.2) * (.6 + .4 * Math.cos(x / 300))) - 4;
    };
    const g = heightMesh(-900, 900, -1100, -170, LO ? 150 : 240, LO ? 80 : 130, far, c => { c.copy(C('#3b4560')); });
    scene.add(new THREE.Mesh(g, terrMat));
  }
  function bigRock(x, y, z, sx, sy, sz, sd) {
    const g = new THREE.IcosahedronGeometry(1, LO ? 4 : 5), p = g.attributes.position, v = new V3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const k = 1 + .28 * fbm(v.x * 1.6 + sd, v.y * 2.4 + v.z * 1.6, 5) + .12 * ridged(v.x * 3 + sd, v.y * 6, 3);
      v.multiplyScalar(k); v.y = Math.max(v.y, -.6);
      p.setXYZ(i, v.x * sx + x, v.y * sy + y, v.z * sz + z);
    }
    g.computeVertexNormals();
    const n = g.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { rockColor(c, p.getX(i), p.getY(i) + 40, p.getZ(i), n.getY(i)); col.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, terrMat); m.castShadow = m.receiveShadow = true; scene.add(m);
  }
  bigRock(-56, -1, 64, 13, 28, 10, 3);
  bigRock(-40, -1, 74, 6, 9, 6, 9);
  bigRock(56, -1, 62, 11, 19, 9, 5);

  // 水：真倒影 + 波纹
  const water = new Reflector(new THREE.PlaneGeometry(2400, 900), {
    textureWidth: W() * DPR * (LO ? .3 : .5), textureHeight: H() * DPR * (LO ? .3 : .5), clipBias: .003,
    shader: {
      uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, time: { value: 0 }, fogC: { value: FOG } },
      vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW; varying float vD;
        void main(){ vUv = textureMatrix * vec4(position, 1.); vW = (modelMatrix * vec4(position, 1.)).xyz;
          vec4 mv = modelViewMatrix * vec4(position, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D tDiffuse; uniform float time; uniform vec3 fogC; varying vec4 vUv; varying vec3 vW; varying float vD;
        void main(){
          vec2 p = vW.xz;
          float n = sin(p.x * .31 + time * .5) + sin(p.y * .83 - time * .7 + p.x * .17) * .7 + sin((p.x - p.y) * 1.9 + time * 1.3) * .3;
          vec4 uv = vUv; uv.x += n * .35; uv.y += n * .12;
          vec3 r = texture2DProj(tDiffuse, uv).rgb;
          vec3 c = vec3(.004, .006, .016) + r * .62;
          float f = 1. - exp(-vD * .006);
          gl_FragColor = vec4(mix(c, fogC * 1.2, f), 1.);
        }`,
    },
  });
  water.rotateX(-Math.PI / 2); water.position.set(0, .02, 380); scene.add(water);
  await pause();

  // ---------- 建筑 ----------
  const K = new A.Kit(), I = new THREE.Matrix4();
  const site = (k, ry = 0) => A.at(I, SITES[k].x, SITES[k].y, SITES[k].z, ry);
  const signs = [];   // 匾、门印、刻字：[字, 矩阵, 宽, 高, 样式]
  const DOORS = data.doors && data.doors.length ? data.doors : [{ seal: '门' }];
  const TOOLS = data.tools || [];

  // 云从关：牌坊；两翼院墙就是门庭，门数随 wushu.toml，左边多一扇
  const T0 = site('shanmen');
  A.paifang(K, T0, { sc: 1.15 });
  signs.push(['云从关', A.at(T0, 0, 4.9 * 1.15, .26 * 1.15 + .04), 2.0 * 1.15, .8 * 1.15, {}]);
  A.wall(K, T0, -48, -7.6); A.wall(K, T0, 7.6, 48);
  for (const x of [-7.4, 7.4]) K.add('stone', A.box(1.6, 5.2, 1.6), A.at(T0, x, 2.6, 0));
  for (const x of [-3.2, 3.2]) A.lantern(K, A.at(T0, x, 5.1, .55), 1);
  for (const x of [-10, 10]) A.stoneLamp(K, A.at(T0, x, 0, 4));
  K.add('stone', A.box(30, .3, 16), A.at(T0, 0, -.12, 8));
  K.add('marble', A.box(4.2, .32, 16), A.at(T0, 0, -.1, 8));
  const nL = Math.ceil(DOORS.length / 2), nR = DOORS.length - nL, doorX = [];
  for (let i = 0; i < nL; i++) doorX.push(-48 + (48 - 7.6) * (i + .5) / nL);
  for (let i = 0; i < nR; i++) doorX.push(7.6 + (48 - 7.6) * (i + .5) / nR);
  DOORS.forEach((d, i) => {
    const Td = A.at(T0, doorX[i], 0, 0);
    A.wallDoor(K, Td, { shut: d.shut });
    signs.push([d.seal, A.at(Td, 0, 3.32, .78), .62, .62, { bg: '#241d31', fg: '#9a7fd6', rim: '#6a5a8a' }]);
    if (!d.shut) A.lantern(K, A.at(Td, 1.75, 2.6, .85), .7);
  });
  // 签筒在山门右前，问路石在右边墙尽头，渡口在左边水上
  A.qiantong(K, A.at(T0, 12, 0, 5));
  A.wenlu(K, A.at(T0, 40, 0, 6, -.15));
  signs.push(['问路', A.at(T0, 40, 1.95, 6, -.15).multiply(new THREE.Matrix4().makeTranslation(0, 0, .57)), .62, 1.2, { bg: null, rim: null, fg: '#2a2630', vertical: true, carve: true, size: .7 }]);
  A.dukou(K, A.at(I, -30, 0, 22));
  await pause();

  // 汲玄楼：两层藏书楼
  const Tc = site('cang', .25);
  A.louge(K, Tc, {
    plat: { w: 16, d: 12, h: 1.4, railH: .9 },
    floors: [{ w: 12, d: 8, nx: 5, nz: 3, ch: 4.2, oh: 1.8 }, { w: 10.4, d: 6.6, nx: 5, nz: 3, ch: 3.5, oh: 1.9, rise: .6 }],
    lit: [1, 2],
  });
  signs.push(['汲玄楼', A.at(Tc, 0, 3.3, 4.25), 2.6, .9, {}]);
  // 法宝库：五间，檐下一件法宝一盏宫灯，有禁制的贴符
  const Tf = site('fabao', -.2);
  A.platform(K, Tf, { w: 20, d: 13, h: 1.6, railH: .9 });
  const yr = A.hall(K, Tf, { w: 16, d: 9, nx: 5, nz: 3, ch: 4.8, lit: 1 });
  A.roofRect(K, A.at(Tf, 0, yr - .05, 0), { W: 8 + 2.1, D: 4.5 + 2.1, H: 6.6 * .58, t0: .42, lift: 1.3, out: .7 });
  const nT = Math.max(1, Math.min(TOOLS.length || 6, 12));
  for (let i = 0; i < nT; i++) {
    const x = nT === 1 ? 0 : -7.5 + 15 * i / (nT - 1), Tl = A.at(Tf, x, 4.3, 5.3);
    A.lantern(K, Tl, .9);
    if (TOOLS[i] && TOOLS[i].seal === '禁') K.add('fu', A.box(.12, .7, .02), A.at(Tl, 0, -.15, .27));
  }
  signs.push(['法宝库', A.at(Tf, 0, 3.75, 4.75), 2.6, .9, {}]);
  // 听雷亭
  const Ts = site('shi', -.4);
  A.ting(K, Ts, {});
  K.add('stone', A.box(.9, 2.6, .35), A.at(Ts, 4.8, 1.3, 1.2));
  signs.push(['听雷', A.at(Ts, 0, 2.6, 2.42), 1.1, .5, {}]);
  // 叩云台：石台、琴几、古琴，松下卧一只白狐
  const Tq = site('qin', .3);
  A.platform(K, Tq, { w: 9, d: 7, h: 1.0, stair: 2.4, railH: .8 });
  K.add('woodDark', A.box(2.6, .1, .7), A.at(Tq, 0, .78, 0));
  for (const x of [-1.1, 1.1]) K.add('woodDark', A.box(.12, .72, .55), A.at(Tq, x, .38, 0));
  A.guqin(K, A.at(Tq, 0, .87, 0, 0));
  A.fox(K, A.at(Tq, 3.2, 0, 1.6, -.6));
  // 蛰庐
  const Tm = site('men', -.35);
  A.zhelu(K, A.at(Tm, 0, 0, -1.2));
  // 集云斋：三层主阁
  const Tg = site('ge');
  A.louge(K, Tg, {
    plat: { w: 22, d: 17, h: 2.4, railH: 1.0 },
    floors: [
      { w: 15, d: 11, nx: 5, nz: 3, ch: 4.8, oh: 2.1, lift: 1.2 },
      { w: 12.4, d: 9, nx: 5, nz: 3, ch: 4.0, oh: 2.0, lift: 1.2 },
      { w: 10, d: 7.4, nx: 3, nz: 3, ch: 3.8, oh: 2.3, lift: 1.5, out: .8, rise: .64 },
    ],
    lit: [1, 1, 2],
  });
  signs.push(['集云斋', A.at(Tg, 0, 16.0, 3.95), .9, 2.2, { vertical: true }]);
  // 石阶 + 路灯
  A.stairs(K, PATH, 3.2);
  for (let i = 1; i < PATH.length; i += 2) { const p = PATH[i]; A.stoneLamp(K, A.at(I, p[0] + 2.6, p[1], p[2])); }
  scene.add(K.build(M));
  // 匾上的字：一块一张贴图
  for (const [txt, mtx, w, h, st] of signs) {
    const tw = st.vertical ? 128 : 384, th = st.vertical ? 320 : 128;
    const mat = S({ map: textTex(txt, { w: tw, h: th, font, ...st }), roughness: .5, metalness: .25, transparent: st.bg === null, alphaTest: st.bg === null ? .3 : 0 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.applyMatrix4(mtx); scene.add(m);
  }
  await pause();

  // 暖光：只放几盏真光，其余靠自发光 + 泛光
  for (const [k, dy, dz, int] of [['shanmen', 4.5, 3, 40], ['cang', 4, 7, 60], ['fabao', 4, 8, 90], ['ge', 5, 9, 90], ['ge', 14, 7, 60], ['shi', 3, 0, 25]]) {
    const s = SITES[k], L = new THREE.PointLight(C('#ffae62'), int, 26, 1.6);
    L.position.set(s.x, s.y + dy, s.z + dz); scene.add(L);
  }

  // ---------- 松 ----------
  {
    const parts = [];
    for (const [y, s, ox] of [[2.6, 1.7, 0], [3.3, 1.35, .4], [3.9, 1.0, -.3], [4.4, .6, .1]]) {
      const g = new THREE.IcosahedronGeometry(1, 1); g.scale(s * 1.3, s * .32, s * 1.1); g.translate(ox, y, 0); g.deleteAttribute('uv'); parts.push(g.index ? g.toNonIndexed() : g);
    }
    const fol = mergeGeometries(parts); fol.computeVertexNormals();
    const trunk = new THREE.CylinderGeometry(.1, .22, 4.4, 6); trunk.translate(0, 2.2, 0);
    const N = LO ? 260 : 520;
    const im1 = new THREE.InstancedMesh(fol, S({ color: C('#ffffff'), roughness: 1, flatShading: true }), N);
    const im2 = new THREE.InstancedMesh(trunk, S({ color: C('#3a2a22'), roughness: 1 }), N);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new V3(), pos = new V3(), c = new THREE.Color();
    let n = 0, guard = 0;
    const put = (x, y, z, s) => {
      q.setFromAxisAngle(new V3(0, 1, 0), rnd() * 6.28); sc.set(s, s * (.85 + rnd() * .4), s); pos.set(x, y - .2, z);
      m.compose(pos, q, sc); im1.setMatrixAt(n, m); im2.setMatrixAt(n, m);
      c.set('#1f3d36').lerp(C('#2f5446'), rnd()); im1.setColorAt(n, c); n++;
    };
    // 各站镜头到所看之处的那条视线上不种树，免得一棵松正好挡在楼前（全景那一站离得远，不管）
    const blocks = (x, z) => STA.slice(1, -1).some(([c, l]) => {
      const dx = l[0] - c[0], dz = l[2] - c[2], u = Math.max(0, Math.min(1, ((x - c[0]) * dx + (z - c[2]) * dz) / (dx * dx + dz * dz)));
      return Math.hypot(x - c[0] - u * dx, z - c[2] - u * dz) < 6;
    });
    put(SITES.qin.x + 4.5, SITES.qin.y, SITES.qin.z - 1, 1.9);   // 叩云台的大松，白狐卧在底下
    while (n < N && guard++ < 40000) {
      const x = -100 + rnd() * 200, z = -125 + rnd() * 150, y = height(x, z);
      if (y < 3) continue;
      const ny = 2 / Math.hypot(height(x + 1, z) - height(x - 1, z), 2, height(x, z + 1) - height(x, z - 1));
      if (ny < .62) continue;
      let near = false;
      for (const k in SITES) { const s = SITES[k]; if (Math.hypot(x - s.x, z - s.z) < (s.r || 14) + 3) near = true; }
      if (near || pathInfo(x, z)[0] < 4.2) continue;
      if (z > 4 && Math.abs(x) < 52) continue;
      if (blocks(x, z)) continue;
      put(x, y, z, .7 + rnd() * 1.1);
    }
    im1.count = im2.count = n;
    im1.castShadow = im2.castShadow = true; im1.receiveShadow = true;
    scene.add(im1, im2);
  }
  await pause();

  // ---------- 云 ----------
  const clouds = [];
  function cloud(x, y, z, w, h, op, col = '#8e97c4') {
    const m = new THREE.SpriteMaterial({ alphaMap: T.cloud, color: C(col), transparent: true, opacity: op, depthWrite: false });
    const s = new THREE.Sprite(m); s.position.set(x, y, z); s.scale.set(w, h, 1); s.userData.x0 = x; s.userData.v = .3 + rnd() * .5;
    scene.add(s); clouds.push(s);
  }
  for (let i = 0; i < 26; i++) { const sg = i % 2 ? 1 : -1; cloud(sg * (34 + rnd() * 130), 2.5 + rnd() * 6, 4 + rnd() * 60, 50 + rnd() * 50, 10 + rnd() * 10, .42 + rnd() * .2); }
  for (let i = 0; i < 5; i++) cloud(-30 + rnd() * 60, 9 + rnd() * 4, -14 - rnd() * 10, 40 + rnd() * 30, 8 + rnd() * 5, .3);
  for (let i = 0; i < 10; i++) { const sg = rnd() < .5 ? -1 : 1; cloud(sg * (34 + rnd() * 60), 22 + rnd() * 30, -20 - rnd() * 50, 50 + rnd() * 40, 12 + rnd() * 8, .32); }
  for (let i = 0; i < 14; i++) cloud(-400 + rnd() * 800, 40 + rnd() * 70, -200 - rnd() * 250, 160 + rnd() * 120, 30 + rnd() * 30, .28, '#6e72a8');
  // 听雷：听雷亭后面的云里藏一团电光
  const lei = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: new THREE.Color(2.4, 2.3, 3.2), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  lei.position.set(SITES.shi.x + 14, SITES.shi.y + 22, SITES.shi.z - 30); lei.scale.set(70, 46, 1); scene.add(lei);
  let leiAt = 6 + Math.random() * 6;

  // 灵光：楼阁周围飘的萤火
  const motes = (() => {
    const N = LO ? 160 : 260, p = new Float32Array(N * 3), seed = [];
    const keys = ['shanmen', 'cang', 'fabao', 'shi', 'qin', 'ge'];
    for (let i = 0; i < N; i++) {
      const s = SITES[keys[i % keys.length]], a = rnd() * 6.28, r = 3 + rnd() * 16;
      seed.push([s.x + Math.cos(a) * r, s.y + 1 + rnd() * 14, s.z + Math.sin(a) * r, rnd() * 6.28, .3 + rnd()]);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const m = new THREE.Points(g, new THREE.PointsMaterial({ map: T.glow, size: .42, color: new THREE.Color(3.2, 2.1, 1.0), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.userData.tick = t => { for (let i = 0; i < N; i++) { const [x, y, z, ph, sp] = seed[i]; p[i * 3] = x + Math.sin(t * .23 * sp + ph) * 2.2; p[i * 3 + 1] = y + Math.sin(t * .31 * sp + ph * 2) * 1.4; p[i * 3 + 2] = z + Math.cos(t * .19 * sp + ph) * 2.2; } g.attributes.position.needsUpdate = true; };
    m.userData.tick(0); scene.add(m);
    return m;
  })();

  // ---------- 场所：名牌锚点、点按范围 ----------
  // [锚点, 点按盒的中心偏移与大小]（相对台地）。北斗没有盒，名牌挂在天上
  const box3 = (c, s) => new THREE.Box3().setFromCenterAndSize(c, new V3(...s));
  const sp = k => new V3(SITES[k].x, SITES[k].y, SITES[k].z);
  const PL = {
    shanmen: [sp('shanmen').add(new V3(0, 10.4, 0)), [box3(sp('shanmen').add(new V3(0, 4, 0)), [14, 8.5, 3])]],
    ting: [new V3(doorX[Math.floor(nL / 2)], 6.6, 12.6), [box3(new V3(-27.8, 3.6, 12), [40.4, 6, 2.4]), box3(new V3(27.8, 3.6, 12), [40.4, 6, 2.4])]],
    qian: [new V3(12, 4.2, 17), [box3(new V3(12, 1.6 + 1, 17), [2.4, 2.4, 1.8])]],
    wenlu: [new V3(40, 6.8, 18), [box3(new V3(40, 1.6 + 2, 18), [2.4, 4.2, 2])]],
    du: [new V3(-27, 5, 38), [box3(new V3(-28.5, 1.5, 32), [7, 4, 18])]],
    shi: [sp('shi').add(new V3(0, 8.4, 0)), [box3(sp('shi').add(new V3(0, 3.4, 0)), [9, 7.5, 9])]],
    men: [sp('men').add(new V3(0, 5.2, -1)), [box3(sp('men').add(new V3(0, 1.7, -1)), [3, 3.6, 2])]],
    cang: [sp('cang').add(new V3(0, 17, 0)), [box3(sp('cang').add(new V3(0, 6.5, 0)), [16, 14, 12])]],
    fabao: [sp('fabao').add(new V3(0, 13.4, 0)), [box3(sp('fabao').add(new V3(0, 5, 0)), [20, 11, 13])]],
    qin: [sp('qin').add(new V3(-1, 4.4, 0)), [box3(sp('qin').add(new V3(0, .8, 0)), [9, 2.4, 7])]],
    fox: [sp('qin').add(new V3(3.3, 2.4, 2.4)), [box3(sp('qin').add(new V3(3.2, .5, 1.7)), [2.4, 1.4, 1.8])]],
    ge: [sp('ge').add(new V3(0, 25, 0)), [box3(sp('ge').add(new V3(0, 10, 0)), [22, 22, 17])]],
    dou: [null, []],
  };
  const layer = document.createElement('nav');
  layer.className = 'ge3-tags';
  layer.setAttribute('aria-label', '潜蛟阁各处');
  const TAGS = places.filter(p => PL[p.id]).map(p => {
    const a = document.createElement('a');
    a.className = 'ge-place ge3-tag';
    a.href = p.href; a.dataset.i = p.i; a.id = 'ge3-' + p.id;
    if (p.act) { a.dataset.act = p.act; a.setAttribute('role', 'button'); }
    a.setAttribute('aria-label', p.aria);
    // 名牌底边对着楼的锚点：注在名之上，展开时名不动
    const notes = [].concat(p.note || []).map(n => '<span class="ge3-note">' + esc(n) + '</span>').join('');
    a.innerHTML = '<span class="ge3-box">' + (notes ? '<span class="ge3-notes">' + notes + '</span>' : '') + (p.name ? '<span class="ge3-name">' + esc(p.name) + '</span>' : '') + '</span>';
    if (!p.name) { a.classList.add('ge3-bare'); a.title = p.aria; }
    const st = []; STA.forEach((s, i) => { if (s[2].includes(p.id)) st.push(i); });
    return { id: p.id, el: a, at: PL[p.id][0], boxes: PL[p.id][1], st, x: -1e4, y: -1e4, o: -1 };
  });
  // 按登山的先后排，Tab 一路从渡口走到北斗
  TAGS.slice().sort((a, b) => a.st[a.st.length - 1] - b.st[b.st.length - 1]).forEach(g => layer.appendChild(g.el));
  host.appendChild(canvas);
  host.appendChild(layer);

  // ---------- 后期 ----------
  const rt = new THREE.WebGLRenderTarget(W() * DPR, H() * DPR, { type: THREE.HalfFloatType, samples: LO ? 0 : 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W(), H()), .6, .55, .92));
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - .5; c.rgb *= 1. - dot(d, d) * 1.1;
        float l = dot(c.rgb, vec3(.2126,.7152,.0722)); c.rgb = mix(c.rgb, c.rgb * vec3(.88,.95,1.12), smoothstep(.35, 0., l) * .6);
        gl_FragColor = c; }`,
  }));
  composer.addPass(new OutputPass());

  // ---------- 镜头 ----------
  const camC = new THREE.CatmullRomCurve3(STA.map(s => new V3(...s[0])), false, 'centripetal');
  const lookC = new THREE.CatmullRomCurve3(STA.map(s => new V3(...s[1])), false, 'centripetal');
  // 竖屏视角窄，北斗在镜头右上方二十多度，照横屏的朝向会出画：最后一站往右上转，把北斗收进来
  const lookP = new THREE.CatmullRomCurve3(STA.map((s, i) => new V3(...(i === NS ? DOU_P : s[1]))), false, 'centripetal');
  // 到站多停一会：每段前后各留 18% 不动
  const ease = p => { const f = Math.min(1, Math.max(0, p)) * NS, i = Math.min(NS - 1, Math.floor(f)), r = f - i, k = Math.min(1, Math.max(0, (r - .18) / .64)); return (i + k * k * (3 - 2 * k)) / NS; };
  const look = new V3(), right = new V3(), upv = new V3(), tmp = new V3();
  let cur = 0, goal = 0, mx = 0, my = 0, gx = 0, gy = 0, diveTo = null, diveT = 0;
  function place(t) {
    camC.getPoint(t, camera.position); (W() < H() ? lookP : lookC).getPoint(t, look);
    camera.fov = 40 * (W() < H() ? 1.55 : 1); camera.aspect = W() / H(); camera.updateProjectionMatrix();
    camera.lookAt(look);
    right.setFromMatrixColumn(camera.matrix, 0); upv.setFromMatrixColumn(camera.matrix, 1);
    const k = camera.position.distanceTo(look) * .05;
    camera.position.addScaledVector(right, mx * k).addScaledVector(upv, -my * k * .5);
    if (diveTo) camera.position.lerp(diveTo, Math.min(1, diveT) ** 2 * .5);
    camera.lookAt(look);
    camera.updateMatrixWorld();
    sky.position.copy(camera.position);
  }
  function tags(t) {
    const f = t * NS, w = W(), h = H();
    for (const g of TAGS) {
      let near = 0;
      for (const i of g.st) near = Math.max(near, 1 - Math.abs(f - i) / .55);
      if (f < .55) near = Math.max(near, 1 - f / .55);   // 全景：都亮
      const at = g.at || tmp.copy(DIP).multiplyScalar(160).add(camera.position);
      tmp.copy(at).project(camera);
      const vis = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
      const o = vis ? Math.round(Math.max(0, Math.min(1, near)) * 20) / 20 : 0;
      // 近看时楼顶常出了画面：名牌压在画框里，不跑到导航栏底下
      const x = Math.min(w - 64, Math.max(64, (tmp.x + 1) / 2 * w)), y = Math.min(h - 24, Math.max(Math.min(170, h * .3), (1 - tmp.y) / 2 * h));
      if (Math.abs(x - g.x) > .5 || Math.abs(y - g.y) > .5) { g.x = x; g.y = y; g.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; }
      if (o !== g.o) { g.o = o; g.el.style.opacity = o; g.el.classList.toggle('off', !o); g.el.classList.toggle('here', o > .9 && f > .5); }
    }
  }
  // 指到楼阁：射线碰点按盒，那一处的名牌描金；点下去等于点名牌
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let hot = null;
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    let best = null, bd = 1e9;
    for (const g of TAGS) { if (g.o < .3) continue; for (const b of g.boxes) { const p = ray.ray.intersectBox(b, tmp); if (p) { const d = p.distanceTo(camera.position); if (d < bd) { bd = d; best = g; } } } }
    return best;
  }
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse') { const r = canvas.getBoundingClientRect(); gx = (e.clientX - r.left) / r.width * 2 - 1; gy = (e.clientY - r.top) / r.height * 2 - 1; }
    const g = pick(e);
    if (g !== hot) { if (hot) hot.el.classList.remove('hot'); hot = g; if (g) g.el.classList.add('hot'); canvas.style.cursor = g ? 'pointer' : ''; }
  });
  canvas.addEventListener('pointerleave', () => { gx = gy = 0; if (hot) hot.el.classList.remove('hot'); hot = null; canvas.style.cursor = ''; });
  canvas.addEventListener('click', e => { const g = pick(e); if (g) g.el.click(); });

  // ---------- 动起来 ----------
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const clock = new THREE.Clock();
  let on = false, last = -1;
  function frame() {
    const dt = Math.min(clock.getDelta(), .1), t = still.matches ? 0 : clock.elapsedTime;
    cur += (goal - cur) * (still.matches ? 1 : 1 - Math.pow(.0009, dt));
    mx += (gx - mx) * Math.min(1, dt * 3); my += (gy - my) * Math.min(1, dt * 3);
    if (diveTo) diveT += dt / .5;
    const e = ease(cur);
    place(e); tags(e);
    for (const s of clouds) s.position.x = s.userData.x0 + Math.sin(t * .05 * s.userData.v) * 8;
    motes.userData.tick(t); water.material.uniforms.time.value = t;
    if (!still.matches && t > leiAt) { const u = t - leiAt; lei.material.opacity = u < 1.1 ? Math.max(0, Math.sin(u * 9) * (1 - u / 1.1)) : 0; if (u > 1.1) leiAt = t + 8 + Math.random() * 7; }
    composer.render();
    last = e;
  }
  function resize() {
    renderer.setSize(W(), H(), false); composer.setSize(W(), H());
    camera.aspect = W() / H(); camera.updateProjectionMatrix();
    if (!on) { place(ease(cur)); composer.render(); }
  }
  new ResizeObserver(resize).observe(host);
  // 先在屏外渲一帧，着色器编好，入山时不顿
  place(0); composer.render();

  return {
    stations: NS,
    // 进度 0..1（ge.js 按滚动算好传进来）
    go(p) { goal = p; },
    jump(p) { goal = cur = p; },
    stationOf(id) { for (let i = 0; i < STA.length; i++) if (STA[i][2].includes(id)) return i / NS; return 0; },
    show(v) {
      on = v;
      if (v) { clock.getDelta(); renderer.setAnimationLoop(frame); }
      else renderer.setAnimationLoop(null);
    },
    // 点下一处：镜头朝它推近
    dive(id) { const g = TAGS.find(x => x.id === id); if (g && g.at) { diveTo = g.at.clone(); diveT = 0; } },
    undive() { diveTo = null; diveT = 0; },
  };
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
