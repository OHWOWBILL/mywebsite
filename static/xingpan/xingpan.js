/* =========================================================
   星盘 · 本命盘核心
   ---------------------------------------------------------
   行星位置用 Paul Schlyter《How to compute planetary positions》的方法：
   日、月、水金火木土天海按轨道根数解开普勒方程，木土天加大不等式等摄动，
   月亮加出差、二均差等十二项；冥王星用其 1885–2099 年适用的级数。
   精度约一至二角分，足供本命盘之用（黄道为当日分点，即回归黄道）。
   上升、中天由格林尼治平恒星时（IAU）推；宫制有 Placidus、整宫、等宫、波菲利。
   法达按昼夜分序，主运之下七分子运（迦勒底序）；小限每年一宫。
   推运（文件后半）：行运相位与精确成相之日、太阳回归、留与逆行（含影子期）、月亮空亡、次限，
   都用同一套星历求根，不另带星历表。
   定位星链（文件末）：现代守护十星或古典守护七政，找最终定位星、相互定位与循环定位。

   浏览器里挂 window.XP；node 里 require 即得同一对象。
   ========================================================= */
(function (root) {
  'use strict';
  var RAD = Math.PI / 180, DEG = 180 / Math.PI;
  function mod(a, n) { return ((a % n) + n) % n; }
  var sin = function (x) { return Math.sin(x * RAD); }, cos = function (x) { return Math.cos(x * RAD); };
  var atan2 = function (y, x) { return Math.atan2(y, x) * DEG; };
  function n360(x) { return mod(x, 360); }

  var SIGNS = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'];
  var SIGN_GLYPH = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  var ELEM = ['火', '土', '风', '水'];               // 白羊起，火土风水循环
  var BODIES = [
    { id: 'sun', n: '太阳', g: '☉' }, { id: 'moon', n: '月亮', g: '☽' }, { id: 'mercury', n: '水星', g: '☿' },
    { id: 'venus', n: '金星', g: '♀' }, { id: 'mars', n: '火星', g: '♂' }, { id: 'jupiter', n: '木星', g: '♃' },
    { id: 'saturn', n: '土星', g: '♄' }, { id: 'uranus', n: '天王星', g: '♅' }, { id: 'neptune', n: '海王星', g: '♆' },
    { id: 'pluto', n: '冥王星', g: '♇' }, { id: 'node', n: '北交点', g: '☊' }
  ];

  // Schlyter 日数：2000 年 1 月 0.0 日（UT）起
  function dayNum(utcMs) { return utcMs / 86400000 + 2440587.5 - 2451543.5; }
  function obliquity(d) { return 23.4393 - 3.563e-7 * d; }

  // 轨道根数（N 升交点黄经、i 倾角、w 近点角距、a 半长轴、e 偏心率、M 平近点角），均为当日分点
  function elements(id, d) {
    switch (id) {
      case 'sun': return { N: 0, i: 0, w: 282.9404 + 4.70935e-5 * d, a: 1, e: 0.016709 - 1.151e-9 * d, M: 356.0470 + 0.9856002585 * d };
      case 'moon': return { N: 125.1228 - 0.0529538083 * d, i: 5.1454, w: 318.0634 + 0.1643573223 * d, a: 60.2666, e: 0.054900, M: 115.3654 + 13.0649929509 * d };
      case 'mercury': return { N: 48.3313 + 3.24587e-5 * d, i: 7.0047 + 5.00e-8 * d, w: 29.1241 + 1.01444e-5 * d, a: 0.387098, e: 0.205635 + 5.59e-10 * d, M: 168.6562 + 4.0923344368 * d };
      case 'venus': return { N: 76.6799 + 2.46590e-5 * d, i: 3.3946 + 2.75e-8 * d, w: 54.8910 + 1.38374e-5 * d, a: 0.723330, e: 0.006773 - 1.302e-9 * d, M: 48.0052 + 1.6021302244 * d };
      case 'mars': return { N: 49.5574 + 2.11081e-5 * d, i: 1.8497 - 1.78e-8 * d, w: 286.5016 + 2.92961e-5 * d, a: 1.523688, e: 0.093405 + 2.516e-9 * d, M: 18.6021 + 0.5240207766 * d };
      case 'jupiter': return { N: 100.4542 + 2.76854e-5 * d, i: 1.3030 - 1.557e-7 * d, w: 273.8777 + 1.64505e-5 * d, a: 5.20256, e: 0.048498 + 4.469e-9 * d, M: 19.8950 + 0.0830853001 * d };
      case 'saturn': return { N: 113.6634 + 2.38980e-5 * d, i: 2.4886 - 1.081e-7 * d, w: 339.3939 + 2.97661e-5 * d, a: 9.55475, e: 0.055546 - 9.499e-9 * d, M: 316.9670 + 0.0334442282 * d };
      case 'uranus': return { N: 74.0005 + 1.3978e-5 * d, i: 0.7733 + 1.9e-8 * d, w: 96.6612 + 3.0565e-5 * d, a: 19.18171 - 1.55e-8 * d, e: 0.047318 + 7.45e-9 * d, M: 142.5905 + 0.011725806 * d };
      case 'neptune': return { N: 131.7806 + 3.0173e-5 * d, i: 1.7700 - 2.55e-7 * d, w: 272.8461 - 6.027e-6 * d, a: 30.05826 + 3.313e-8 * d, e: 0.008606 + 2.15e-9 * d, M: 260.2471 + 0.005995147 * d };
    }
  }
  // 解开普勒方程，返回轨道面内的 xv, yv 与 r、v
  function kepler(el) {
    var M = n360(el.M), e = el.e;
    var E = M + e * DEG * sin(M) * (1 + e * cos(M));
    for (var k = 0; k < 8; k++) {
      var dE = (E - e * DEG * sin(E) - M) / (1 - e * cos(E));
      E -= dE; if (Math.abs(dE) < 1e-7) break;
    }
    var xv = el.a * (cos(E) - e), yv = el.a * Math.sqrt(1 - e * e) * sin(E);
    return { r: Math.sqrt(xv * xv + yv * yv), v: atan2(yv, xv) };
  }
  // 轨道 → 黄道直角坐标（日心或地心，视根数而定）
  function toEcl(el, k) {
    var vw = k.v + el.w;
    return {
      x: k.r * (cos(el.N) * cos(vw) - sin(el.N) * sin(vw) * cos(el.i)),
      y: k.r * (sin(el.N) * cos(vw) + cos(el.N) * sin(vw) * cos(el.i)),
      z: k.r * sin(vw) * sin(el.i)
    };
  }
  function sph(p) { return { lon: n360(atan2(p.y, p.x)), lat: atan2(p.z, Math.sqrt(p.x * p.x + p.y * p.y)), r: Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) }; }
  function rect(lon, lat, r) { return { x: r * cos(lon) * cos(lat), y: r * sin(lon) * cos(lat), z: r * sin(lat) }; }

  function sunPos(d) {
    var el = elements('sun', d), k = kepler(el), lon = n360(k.v + el.w);
    return { lon: lon, lat: 0, r: k.r, x: k.r * cos(lon), y: k.r * sin(lon), Ms: n360(el.M), Ls: n360(el.M + el.w) };
  }

  function moonPos(d, S) {
    var el = elements('moon', d), k = kepler(el), p = sph(toEcl(el, k));
    var Mm = n360(el.M), Ms = S.Ms, Lm = n360(el.N + el.w + el.M), D = Lm - S.Ls, F = Lm - el.N;
    var dl = -1.274 * sin(Mm - 2 * D) + 0.658 * sin(2 * D) - 0.186 * sin(Ms) - 0.059 * sin(2 * Mm - 2 * D)
      - 0.057 * sin(Mm - 2 * D + Ms) + 0.053 * sin(Mm + 2 * D) + 0.046 * sin(2 * D - Ms) + 0.041 * sin(Mm - Ms)
      - 0.035 * sin(D) - 0.031 * sin(Mm + Ms) - 0.015 * sin(2 * F - 2 * D) + 0.011 * sin(Mm - 4 * D);
    var db = -0.173 * sin(F - 2 * D) - 0.055 * sin(Mm - F - 2 * D) - 0.046 * sin(Mm + F - 2 * D) + 0.033 * sin(F + 2 * D) + 0.017 * sin(2 * Mm + F);
    return { lon: n360(p.lon + dl), lat: p.lat + db, node: n360(el.N) };
  }

  function planetHelio(id, d) {
    var el = elements(id, d), k = kepler(el), p = sph(toEcl(el, k));
    var Mj = n360(elements('jupiter', d).M), Ms = n360(elements('saturn', d).M), Mu = n360(elements('uranus', d).M);
    if (id === 'jupiter') p.lon += -0.332 * sin(2 * Mj - 5 * Ms - 67.6) - 0.056 * sin(2 * Mj - 2 * Ms + 21) + 0.042 * sin(3 * Mj - 5 * Ms + 21)
      - 0.036 * sin(Mj - 2 * Ms) + 0.022 * cos(Mj - Ms) + 0.023 * sin(2 * Mj - 3 * Ms + 52) - 0.016 * sin(Mj - 5 * Ms - 69);
    if (id === 'saturn') {
      p.lon += 0.812 * sin(2 * Mj - 5 * Ms - 67.6) - 0.229 * cos(2 * Mj - 4 * Ms - 2) + 0.119 * sin(Mj - 2 * Ms - 3)
        + 0.046 * sin(2 * Mj - 6 * Ms - 69) + 0.014 * sin(Mj - 3 * Ms + 32);
      p.lat += -0.020 * cos(2 * Mj - 4 * Ms - 2) + 0.018 * sin(2 * Mj - 6 * Ms - 49);
    }
    if (id === 'uranus') p.lon += 0.040 * sin(Ms - 2 * Mu + 6) + 0.035 * sin(Ms - 3 * Mu + 33) - 0.015 * sin(Mj - Mu + 20);
    return p;
  }
  // 冥王星：Schlyter 级数（1885–2099）。实测其黄经已是当日分点（对照 2023、2024 年入水瓶的时刻，
  // 再加岁差反而差出 0.3°），故不另加岁差
  function plutoHelio(d) {
    var S = 50.03 + 0.033459652 * d, P = 238.95 + 0.003968789 * d;
    var lon = 238.9508 + 0.00400703 * d
      - 19.799 * sin(P) + 19.848 * cos(P) + 0.897 * sin(2 * P) - 4.956 * cos(2 * P)
      + 0.610 * sin(3 * P) + 1.211 * cos(3 * P) - 0.341 * sin(4 * P) - 0.190 * cos(4 * P)
      + 0.128 * sin(5 * P) - 0.034 * cos(5 * P) - 0.038 * sin(6 * P) + 0.031 * cos(6 * P)
      + 0.020 * sin(S - P) - 0.010 * cos(S - P);
    var lat = -3.9082 - 5.453 * sin(P) - 14.975 * cos(P) + 3.527 * sin(2 * P) + 1.673 * cos(2 * P)
      - 1.051 * sin(3 * P) + 0.328 * cos(3 * P) + 0.179 * sin(4 * P) - 0.292 * cos(4 * P)
      + 0.019 * sin(5 * P) + 0.100 * cos(5 * P) - 0.031 * sin(6 * P) - 0.026 * cos(6 * P) + 0.011 * cos(S - P);
    var r = 40.72 + 6.68 * sin(P) + 6.90 * cos(P) - 1.18 * sin(2 * P) - 0.03 * cos(2 * P) + 0.15 * sin(3 * P) - 0.14 * cos(3 * P);
    return { lon: n360(lon), lat: lat, r: r };
  }

  // 某一刻全部天体的地心黄经（度）、黄纬
  function bodies(utcMs) {
    var d = dayNum(utcMs), S = sunPos(d), out = {};
    out.sun = { lon: S.lon, lat: 0 };
    var m = moonPos(d, S);
    out.moon = { lon: m.lon, lat: m.lat };
    out.node = { lon: m.node, lat: 0 };
    ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].forEach(function (id) {
      var h = id === 'pluto' ? plutoHelio(d) : planetHelio(id, d);
      var p = rect(h.lon, h.lat, h.r);
      var g = sph({ x: p.x + S.x, y: p.y + S.y, z: p.z });
      out[id] = { lon: g.lon, lat: g.lat };
    });
    return out;
  }

  // 格林尼治平恒星时（度）
  function gmst(utcMs) {
    var JD = utcMs / 86400000 + 2440587.5, T = (JD - 2451545.0) / 36525;
    return n360(280.46061837 + 360.98564736629 * (JD - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000);
  }
  function angles(utcMs, lat, lon) {
    var eps = obliquity(dayNum(utcMs)), ramc = n360(gmst(utcMs) + lon);
    var mc = n360(atan2(sin(ramc), cos(ramc) * cos(eps)));
    var asc = n360(atan2(cos(ramc), -(sin(ramc) * cos(eps) + Math.tan(lat * RAD) * sin(eps))));
    return { ramc: ramc, eps: eps, mc: mc, asc: asc };
  }
  // 赤经 → 黄道上的点（黄纬为零）
  function raToEcl(ra, eps) { return n360(atan2(sin(ra), cos(ra) * cos(eps))); }

  function houses(sys, A, lat) {
    var c = new Array(13), asc = A.asc, mc = A.mc, i;
    if (sys === 'whole') { var s0 = Math.floor(asc / 30) * 30; for (i = 1; i <= 12; i++) c[i] = n360(s0 + (i - 1) * 30); return c; }
    if (sys === 'equal') { for (i = 1; i <= 12; i++) c[i] = n360(asc + (i - 1) * 30); return c; }
    c[1] = asc; c[10] = mc; c[7] = n360(asc + 180); c[4] = n360(mc + 180);
    if (sys === 'porphyry' || Math.abs(lat) > 66) {
      var q1 = n360(asc - mc), q2 = n360(c[4] - asc);
      c[11] = n360(mc + q1 / 3); c[12] = n360(mc + 2 * q1 / 3);
      c[2] = n360(asc + q2 / 3); c[3] = n360(asc + 2 * q2 / 3);
    } else {
      // Placidus：黄道上某点的赤经恰为中天赤经加其昼（夜）半弧的若干分之一
      var eps = A.eps, phi = lat;
      var cusp = function (f, below) {
        var lam = n360(mc + (below ? 180 : 0) + (below ? -f : f) * 90), ra;
        for (var it = 0; it < 30; it++) {
          var dec = Math.asin(sin(eps) * sin(lam)) * DEG;
          var x = -Math.tan(phi * RAD) * Math.tan(dec * RAD);
          x = Math.max(-1, Math.min(1, x));
          var dsa = Math.acos(x) * DEG;                              // 昼半弧
          ra = below ? A.ramc + 180 - f * (180 - dsa) : A.ramc + f * dsa;
          var nl = raToEcl(n360(ra), eps);
          if (Math.abs(mod(nl - lam + 180, 360) - 180) < 1e-6) { lam = nl; break; }
          lam = nl;
        }
        return lam;
      };
      c[11] = cusp(1 / 3, false); c[12] = cusp(2 / 3, false);
      c[3] = cusp(1 / 3, true); c[2] = cusp(2 / 3, true);
    }
    c[5] = n360(c[11] + 180); c[6] = n360(c[12] + 180); c[8] = n360(c[2] + 180); c[9] = n360(c[3] + 180);
    return c;
  }
  function houseOf(lon, c) {
    for (var i = 1; i <= 12; i++) {
      var a = c[i], b = c[i % 12 + 1], span = n360(b - a);
      if (n360(lon - a) < span) return i;
    }
    return 1;
  }

  // 庙旺陷弱（七政）
  var RULER = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'];
  var EXALT = { sun: 0, moon: 1, mercury: 5, venus: 11, mars: 9, jupiter: 3, saturn: 6 };
  function dignity(id, sign) {
    if (RULER[sign] === id) return '庙';
    if (EXALT[id] === sign) return '旺';
    if (RULER[(sign + 6) % 12] === id) return '陷';
    if (EXALT[id] !== undefined && (EXALT[id] + 6) % 12 === sign) return '弱';
    return '';
  }

  var ASPECTS = [
    { n: '合', g: '☌', a: 0, orb: 8 }, { n: '六合', g: '⚹', a: 60, orb: 5 }, { n: '刑', g: '□', a: 90, orb: 7 },
    { n: '拱', g: '△', a: 120, orb: 7 }, { n: '冲', g: '☍', a: 180, orb: 8 }
  ];
  function aspects(P, ids) {
    var out = [];
    for (var i = 0; i < ids.length; i++) for (var j = i + 1; j < ids.length; j++) {
      var a = P[ids[i]], b = P[ids[j]], sep = Math.abs(mod(a.lon - b.lon + 180, 360) - 180);
      var lum = ['sun', 'moon'].indexOf(ids[i]) >= 0 || ['sun', 'moon'].indexOf(ids[j]) >= 0 ? 2 : 0;
      ASPECTS.forEach(function (as) {
        var orb = Math.abs(sep - as.a);
        if (orb <= as.orb + lum) {
          // 入相（越来越准）还是出相：看一小时后容许度变小还是变大
          var a2 = a.lon + (a.speed || 0) / 24, b2 = b.lon + (b.speed || 0) / 24;
          var sep2 = Math.abs(mod(a2 - b2 + 180, 360) - 180), orb2 = Math.abs(sep2 - as.a);
          out.push({ a: ids[i], b: ids[j], type: as, orb: orb, applying: orb2 < orb });
        }
      });
    }
    return out.sort(function (x, y) { return x.orb - y.orb; });
  }

  // 法达：昼生 ☉♀☿☽♄♃♂☊☋；夜生 ☽♄♃♂☊☋☉♀☿（交点在火星后）或 ☽♄♃♂☉♀☿☊☋（波那提）
  var FIRDAR_YEARS = { sun: 10, venus: 8, mercury: 13, moon: 9, saturn: 11, jupiter: 12, mars: 7, node: 3, snode: 2 };
  var CHALDEAN = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];
  function firdaria(day, birthMs, bonatti) {
    var seq = day ? ['sun', 'venus', 'mercury', 'moon', 'saturn', 'jupiter', 'mars', 'node', 'snode']
      : bonatti ? ['moon', 'saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'node', 'snode']
        : ['moon', 'saturn', 'jupiter', 'mars', 'node', 'snode', 'sun', 'venus', 'mercury'];
    var Y = 365.2422 * 86400000, t = birthMs, out = [];
    seq.forEach(function (p) {
      var len = FIRDAR_YEARS[p] * Y, subs = [];
      if (p !== 'node' && p !== 'snode') {
        var k0 = CHALDEAN.indexOf(p);
        for (var s = 0; s < 7; s++) subs.push({ lord: CHALDEAN[(k0 + s) % 7], from: t + len * s / 7, to: t + len * (s + 1) / 7 });
      }
      out.push({ lord: p, years: FIRDAR_YEARS[p], from: t, to: t + len, subs: subs });
      t += len;
    });
    return out;
  }

  /* =========================================================
     排盘
     inp: { y, mo, d, h, mi, tz, dst, lat, lon, house: 'placidus'|'whole'|'equal'|'porphyry' }
     ========================================================= */
  function chart(inp) {
    var wall = Date.UTC(inp.y, inp.mo - 1, inp.d, inp.h, inp.mi || 0);
    var utc = wall - (inp.dst ? 3600e3 : 0) - (+inp.tz) * 3600e3;
    return chartAt(utc, inp);
  }
  // 按 UTC 时刻排盘（回归盘、推运盘用）：inp 只用 lat、lon、house、bonatti，其余原样放进 input 供显示
  function chartAt(utc, inp) {
    var P = bodies(utc), P2 = bodies(utc + 3600e3), P0 = bodies(utc - 3600e3);
    Object.keys(P).forEach(function (k) {
      P[k].speed = mod(P2[k].lon - P0[k].lon + 180, 360) - 180;      // 每两小时 → 下面换成每日
      P[k].speed *= 12;
      P[k].retro = P[k].speed < 0 && k !== 'node';
      P[k].sign = Math.floor(P[k].lon / 30);
    });
    var A = angles(utc, inp.lat, inp.lon), sys = inp.house || 'placidus';
    var cusps = houses(sys, A, inp.lat);
    Object.keys(P).forEach(function (k) { P[k].house = houseOf(P[k].lon, cusps); P[k].dig = dignity(k, P[k].sign); });
    // 昼夜：太阳在地平线上为昼
    var sRA = atan2(sin(P.sun.lon) * cos(A.eps), cos(P.sun.lon)), sDec = Math.asin(sin(A.eps) * sin(P.sun.lon)) * DEG;
    var ha = A.ramc - sRA, alt = Math.asin(sin(inp.lat) * sin(sDec) + cos(inp.lat) * cos(sDec) * cos(ha)) * DEG;
    var day = alt > 0;
    // 福点：昼 ASC + 月 − 日，夜 ASC + 日 − 月
    var fortune = n360(day ? A.asc + P.moon.lon - P.sun.lon : A.asc + P.sun.lon - P.moon.lon);
    var ids = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    var asp = aspects(P, ids);
    return {
      input: inp, utc: utc, bodies: P, angles: A, cusps: cusps, house: sys, day: day, sunAlt: alt, fortune: fortune,
      aspects: asp, firdaria: firdaria(day, utc, inp.bonatti),
      placidusFallback: sys === 'placidus' && Math.abs(inp.lat) > 66
    };
  }

  // 小限：每满一岁上升推进一宫（整宫）
  function profection(C, ageFull) {
    var sign = (Math.floor(C.angles.asc / 30) + ageFull) % 12;
    return { sign: sign, lord: RULER[sign], house: ageFull % 12 + 1 };
  }

  function fmtDeg(lon) {
    var s = Math.floor(lon / 30), x = lon - s * 30, dd = Math.floor(x), mm = Math.floor((x - dd) * 60 + 1e-9);
    return { sign: s, d: dd, m: mm, text: SIGNS[s] + ' ' + dd + '°' + (mm < 10 ? '0' : '') + mm + '′' };
  }

  /* =========================================================
     推运：行运、太阳回归、留与逆行、月亮空亡、次限
     ---------------------------------------------------------
     全用上面同一套星历，只是换个问法：某量何时过零。先按步长扫出变号，再夹逼求根；
     夹逼照 astronomy-engine 的 Search（Don Cross，MIT 许可，github.com/cosinekitty/astronomy）
     改写为毫秒计时：三点抛物线插值猜根，猜得准就收窄，不准就二分。
     ========================================================= */
  var DAY = 864e5, HOUR = 3600e3;
  var PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  function wrap180(x) { return mod(x + 180, 360) - 180; }

  // 单个天体的地心黄经：与 bodies() 同一算法、同一结果，只算要的那一颗（求根时省力）
  function lonOf(id, utcMs) {
    var d = dayNum(utcMs), S = sunPos(d);
    if (id === 'sun') return S.lon;
    if (id === 'moon') return moonPos(d, S).lon;
    if (id === 'node') return n360(elements('moon', d).N);
    var h = id === 'pluto' ? plutoHelio(d) : planetHelio(id, d), p = rect(h.lon, h.lat, h.r);
    return sph({ x: p.x + S.x, y: p.y + S.y, z: p.z }).lon;
  }
  // 日行（度/日）：前后各一小时之差，与 chart() 同法
  function speedOf(id, utcMs) { return wrap180(lonOf(id, utcMs + HOUR) - lonOf(id, utcMs - HOUR)) * 12; }

  function quadInterp(tm, dt, fa, fm, fb) {
    var Q = (fb + fa) / 2 - fm, R = (fb - fa) / 2, S = fm, x;
    if (Q === 0) {
      if (R === 0) return null;
      x = -S / R;
      if (x < -1 || x > 1) return null;
    } else {
      var u = R * R - 4 * Q * S;
      if (u <= 0) return null;
      var ru = Math.sqrt(u), x1 = (-R + ru) / (2 * Q), x2 = (-R - ru) / (2 * Q);
      if (x1 >= -1 && x1 <= 1) { if (x2 >= -1 && x2 <= 1) return null; x = x1; }
      else if (x2 >= -1 && x2 <= 1) x = x2;
      else return null;
    }
    return { t: tm + x * dt, df: (2 * Q * x + R) / dt };
  }
  // f 在 t1、t2 之间由负转正（只许一次）的那一刻，夹到 tol 毫秒（默认一秒）以内；找不到给 null
  function search(f, t1, t2, tol) {
    tol = tol || 1000;
    var f1 = f(t1), f2 = f(t2), fm = NaN, calc = true;
    for (var it = 0; it < 60; it++) {
      var tm = (t1 + t2) / 2, dt = tm - t1;
      if (Math.abs(dt) < tol) return tm;
      if (calc) fm = f(tm); else calc = true;
      var q = quadInterp(tm, t2 - tm, f1, fm, f2);
      if (q) {
        var fq = f(q.t);
        if (q.df !== 0) {
          if (Math.abs(fq / q.df) < tol) return q.t;
          var g = 1.2 * Math.abs(fq / q.df);
          if (g < Math.abs(dt) / 10) {
            var tl = q.t - g, tr = q.t + g;
            if ((tl - t1) * (tl - t2) < 0 && (tr - t1) * (tr - t2) < 0) {
              var fl = f(tl), fr = f(tr);
              if (fl < 0 && fr >= 0) { f1 = fl; f2 = fr; t1 = tl; t2 = tr; fm = fq; calc = false; continue; }
            }
          }
        }
      }
      if (f1 < 0 && fm >= 0) { t2 = tm; f2 = fm; continue; }
      if (fm < 0 && f2 >= 0) { t1 = tm; f1 = fm; continue; }
      return null;
    }
    return (t1 + t2) / 2;
  }
  // [t0, t1] 内 f 的全部过零点 { t, up }（up：由负转正）。角度差先折到 ±180，跨 ±180 的跳变不算
  function crossings(f, t0, t1, step, tol) {
    var out = [], a = t0, fa = f(a);
    function push(t, up) { if (t != null) out.push({ t: t, up: up }); }
    while (a < t1) {
      var b = Math.min(a + step, t1), fb = f(b);
      if (Math.abs(fb - fa) < 180) {
        if (fa < 0 && fb >= 0) push(search(f, a, b, tol), true);
        else if (fa >= 0 && fb < 0) push(search(function (x) { return -f(x); }, a, b, tol), false);
      }
      a = b; fa = fb;
    }
    return out;
  }

  // —— 留与逆行 ——
  // 留：视速度过零。kind 'R' 留逆（由顺转逆），'D' 留顺；lon 为留时黄经
  function stations(id, t0, t1) {
    return crossings(function (t) { return speedOf(id, t); }, t0, t1, DAY, 1000).map(function (c) {
      return { id: id, t: c.t, kind: c.up ? 'D' : 'R', lon: lonOf(id, c.t) };
    });
  }
  // 与 [t0, t1] 相交的逆行段：R 留逆、D 留顺；影子期以度数定——
  // pre 前影之始：留逆前行星（顺行）最后一次到达留顺度数之时；post 后影之终：留顺后行星回到留逆度数之时
  function retrogrades(id, t0, t1) {
    var st = stations(id, t0 - 200 * DAY, t1 + 200 * DAY), out = [];
    var lastUp = function (cs) { var r = null; cs.forEach(function (c) { if (c.up) r = c.t; }); return r; };
    var firstUp = function (cs) { for (var i = 0; i < cs.length; i++) if (cs[i].up) return cs[i].t; return null; };
    for (var i = 0; i + 1 < st.length; i++) {
      var R = st[i], D = st[i + 1];
      if (R.kind !== 'R' || D.kind !== 'D' || D.t < t0 || R.t > t1) continue;
      var span = D.t - R.t, w = 2 * span + 60 * DAY;
      var pre = lastUp(crossings(function (t) { return wrap180(lonOf(id, t) - D.lon); }, R.t - w, R.t - HOUR, DAY, 60e3));
      var post = firstUp(crossings(function (t) { return wrap180(lonOf(id, t) - R.lon); }, D.t + HOUR, D.t + w, DAY, 60e3));
      out.push({ id: id, R: R, D: D, pre: pre, post: post });
    }
    return out;
  }

  // —— 太阳回归：太阳回到本命黄经那一刻；approx 取当年生日，前后三日内求根到一秒 ——
  function solarReturn(sunLon, approx) {
    return search(function (t) { return wrap180(lonOf('sun', t) - sunLon); }, approx - 3 * DAY, approx + 3 * DAY, 1000);
  }

  // —— 月亮：换座、与行星成相、空亡 ——
  var ASP_OF = { 0: 0, 60: 1, 300: 1, 90: 2, 270: 2, 120: 3, 240: 3, 180: 4 };   // 相差角 → ASPECTS 下标
  var PTOLEMY = [0, 60, 90, 120, 180, 240, 270, 300];
  var VOC_IDS = ['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  // 月亮换座（t0 到 t1 之间）：sign 为新入之座
  function moonIngresses(t0, t1) {
    var out = [], step = 2 * HOUR, a = t0, sa = Math.floor(lonOf('moon', a) / 30);
    while (a < t1) {
      var b = a + step, sb = Math.floor(lonOf('moon', b) / 30);
      if (sb !== sa) {
        var B = sb * 30, t = search(function (x) { return wrap180(lonOf('moon', x) - B); }, a, b, 1000);
        if (t != null && t >= t0 && t < t1) out.push({ t: t, sign: sb });
      }
      a = b; sa = sb;
    }
    return out;
  }
  // 月亮与各星精确成托勒密相位（合、六合、刑、拱、冲）的时刻。月亮总比行星快，月 − 星之差只增不减
  function moonAspects(t0, t1, ids) {
    var out = [];
    (ids || VOC_IDS).forEach(function (id) {
      var rel = function (t) { return n360(lonOf('moon', t) - lonOf(id, t)); };
      var a = t0, ra = rel(a);
      while (a < t1) {
        var b = Math.min(a + 3 * HOUR, t1), rb = rel(b), dr = n360(rb - ra);
        PTOLEMY.forEach(function (A) {
          var k = n360(A - ra);
          if (k > 0 && k <= dr) {
            var t = search(function (x) { return wrap180(rel(x) - A); }, a, b, 1000);
            if (t != null) out.push({ id: id, t: t, A: A, type: ASPECTS[ASP_OF[A]] });
          }
        });
        a = b; ra = rb;
      }
    });
    return out.sort(function (x, y) { return x.t - y.t; });
  }
  // 月亮空亡（Void of Course）：月亮在本座内与日水金火木土天海冥的最后一个托勒密相位精确成相之后，
  // 到入下一座为止；整座不成相位则自入座起即空。返回与 [t0, t1] 相交的各段 { start, end, sign（将入）, last }
  function voidMoon(t0, t1, ids) {
    var ing = moonIngresses(t0 - 4 * DAY, t1 + 4 * DAY), out = [];
    for (var i = 0; i + 1 < ing.length; i++) {
      var a = ing[i].t, b = ing[i + 1].t;
      if (b <= t0 || a >= t1) continue;
      var asp = moonAspects(a, b, ids), last = asp.length ? asp[asp.length - 1] : null;
      var start = last ? last.t : a;
      if (start >= t1) continue;
      out.push({ start: start, end: b, from: ing[i].sign, sign: ing[i + 1].sign, last: last });
    }
    return out;
  }

  // —— 行运：某一刻的天体对本命各点的相位 ——
  // 容许度按行运天体定（月亮走得快只取 1°，三王星取 1.5°），日月不再加宽
  var TRANSIT_ORB = { sun: 2, moon: 1, mercury: 2, venus: 2, mars: 2, jupiter: 2, saturn: 2, uranus: 1.5, neptune: 1.5, pluto: 1.5 };
  function natalPoints(C) {
    var pts = PLANETS.map(function (id) { return { id: id, lon: C.bodies[id].lon }; });
    pts.push({ id: 'asc', lon: C.angles.asc }, { id: 'mc', lon: C.angles.mc });
    return pts;
  }
  // 返回按容许度由紧到松排好的 { tr 行运星, na 本命点, type, orb, applying 入相, lon, speed }
  function transits(C, utcMs, orbs) {
    orbs = orbs || TRANSIT_ORB;
    var T = bodies(utcMs), T2 = bodies(utcMs + 60e3), pts = natalPoints(C), out = [];
    PLANETS.forEach(function (id) {
      var sp = speedOf(id, utcMs);
      pts.forEach(function (p) {
        var sep = Math.abs(wrap180(T[id].lon - p.lon)), sep2 = Math.abs(wrap180(T2[id].lon - p.lon));
        ASPECTS.forEach(function (as) {
          var orb = Math.abs(sep - as.a);
          if (orb <= orbs[id]) out.push({ tr: id, na: p.id, type: as, orb: orb, applying: Math.abs(sep2 - as.a) < orb, lon: T[id].lon, speed: sp });
        });
      });
    });
    return out.sort(function (x, y) { return x.orb - y.orb; });
  }
  // 某星到达某一黄经的全部时刻（顺行、逆行经过都算）；step 为扫描步长
  function exactTimes(id, target, t0, t1, step) {
    return crossings(function (t) { return wrap180(lonOf(id, t) - target); }, t0, t1, step || DAY, 60e3)
      .map(function (c) { return { t: c.t, retro: !c.up }; });
  }
  // 行运精确成相：ids 中各星在 [t0, t1] 内与本命各点精确成相的时刻（逆行往返则有数次），按时间排
  function transitHits(C, t0, t1, ids) {
    var pts = natalPoints(C), out = [];
    (ids || ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto']).forEach(function (id) {
      var ts = [], ls = [];
      for (var t = t0; ; t += DAY) { var u = Math.min(t, t1); ts.push(u); ls.push(lonOf(id, u)); if (u >= t1) break; }
      pts.forEach(function (p) {
        PTOLEMY.forEach(function (A) {
          var target = n360(p.lon + A), f = function (x) { return wrap180(lonOf(id, x) - target); };
          for (var k = 0; k + 1 < ts.length; k++) {
            var fa = wrap180(ls[k] - target), fb = wrap180(ls[k + 1] - target), t = null;
            if (Math.abs(fb - fa) > 90) continue;
            if (fa < 0 && fb >= 0) t = search(f, ts[k], ts[k + 1], 60e3);
            else if (fa >= 0 && fb < 0) t = search(function (x) { return -f(x); }, ts[k], ts[k + 1], 60e3);
            if (t != null) out.push({ tr: id, na: p.id, A: A, type: ASPECTS[ASP_OF[A]], t: t, retro: fb < fa });
          }
        });
      });
    });
    return out.sort(function (x, y) { return x.t - y.t; });
  }

  // —— 次限（一日一年）：出生后第 n 日的天象对应第 n 岁；年按回归年 365.2422 日 ——
  // 推运中天用太阳弧（中天加上推运太阳走过的度数），推运上升由推运中天按出生地纬度反推
  var TROP_YEAR = 365.2422;
  function progressed(C, utcMs) {
    var age = (utcMs - C.utc) / (TROP_YEAR * DAY), t = C.utc + age * DAY, P = {};
    PLANETS.forEach(function (id) { P[id] = { lon: lonOf(id, t), speed: speedOf(id, t) }; P[id].sign = Math.floor(P[id].lon / 30); P[id].house = houseOf(P[id].lon, C.cusps); });
    var arc = wrap180(P.sun.lon - C.bodies.sun.lon), mc = n360(C.angles.mc + arc), eps = C.angles.eps;
    // 由中天黄经反求中天赤经，再按出生地纬度求上升
    var ramc = n360(atan2(sin(mc) * cos(eps), cos(mc)));
    var asc = n360(atan2(cos(ramc), -(sin(ramc) * cos(eps) + Math.tan(C.input.lat * RAD) * sin(eps))));
    return { t: t, age: age, bodies: P, arc: arc, mc: mc, asc: asc };
  }

  /* =========================================================
     定位星链
     ---------------------------------------------------------
     行星落在哪个星座，那个星座的主星就是它的定位星（dispositor）；主星自己又落在别的座，
     一颗接一颗追下去，就是定位星链。每颗星只有一颗定位星，所以追到头只有三种收法：
       · 落在自己守护的座（入庙），自己定位自己——这条链的最终定位星；
       · 两颗星各落对方的座——相互定位（按守护算的互容）；
       · 三颗以上兜成一圈——循环定位，圈上各星并列，没有哪一颗独大。
     mode 'modern'：十星，蝎归冥王、瓶归天王、鱼归海王；'classic'：只用七政，蝎火、瓶土、鱼木。
     src 可以是排好的盘（取 bodies[id].sign），也可以是 { sun: 3, moon: 0, … } 这样的星座下标表。
     ========================================================= */
  var RULER_MODERN = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'pluto', 'jupiter', 'saturn', 'uranus', 'neptune'];
  var SEVEN = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
  function dispositors(src, mode) {
    mode = mode === 'classic' ? 'classic' : 'modern';
    var ids = mode === 'classic' ? SEVEN : PLANETS, rul = mode === 'classic' ? RULER : RULER_MODERN;
    var B = src.bodies || src, N = {};
    ids.forEach(function (id) {
      var b = B[id], sign = typeof b === 'number' ? b : b.sign != null ? b.sign : Math.floor(b.lon / 30);
      N[id] = { id: id, sign: sign, disp: rul[sign], self: rul[sign] === id, kids: [], cyc: null, depth: 0, under: 0 };
    });
    // 顺着定位星走，走到重复为止：重复的那颗起就是圈
    var roots = [];
    ids.forEach(function (id) {
      var path = [], seen = {}, x = id;
      while (!seen[x]) { seen[x] = true; path.push(x); x = N[x].disp; }
      var cyc = path.slice(path.indexOf(x));
      if (N[x].cyc == null) {
        // 圈从星序最前的那颗写起，写法才唯一
        var k0 = 0; cyc.forEach(function (c, i) { if (ids.indexOf(c) < ids.indexOf(cyc[k0])) k0 = i; });
        cyc = cyc.slice(k0).concat(cyc.slice(0, k0));
        var r = { kind: cyc.length === 1 ? 'final' : cyc.length === 2 ? 'mutual' : 'loop', members: cyc, all: cyc.slice() };
        cyc.forEach(function (c) { N[c].cyc = r; });
        roots.push(r);
      }
      var n = N[id];
      n.root = N[x].cyc;
      n.depth = path.indexOf(x) < 0 ? 0 : path.indexOf(x);
      // 链：自己起，到最终定位星止；归到圈上的，把圈走完、写回头一颗重复的星
      n.chain = path.slice();
      if (n.root.members.length > 1) n.chain.push(x);
      // under：挂在这颗星名下的星数（直接、间接都算）；圈上的星只数从它这里入圈的
      if (!n.cyc) { n.root.all.push(id); N[n.disp].kids.push(id); path.slice(1, n.depth + 1).forEach(function (p) { N[p].under++; }); }
    });
    roots.forEach(function (r) { r.size = r.all.length; r.under = r.all.length - r.members.length; });
    roots.sort(function (a, b) { return b.size - a.size || ids.indexOf(a.members[0]) - ids.indexOf(b.members[0]); });
    var finals = roots.filter(function (r) { return r.kind === 'final'; }).map(function (r) { return r.members[0]; });
    var mutuals = roots.filter(function (r) { return r.kind === 'mutual'; }).map(function (r) { return r.members; });
    var loops = roots.filter(function (r) { return r.kind === 'loop'; }).map(function (r) { return r.members; });
    finals.sort(function (a, b) { return N[b].under - N[a].under || ids.indexOf(a) - ids.indexOf(b); });
    // 格局：两组以上互容 mm；一组互容带定位星 mf；只有一组互容 m；
    // 独一颗最终定位星 one；几颗定位星分主次 many；一颗定位星之外另有循环 fl；全在循环里 loop
    var F = finals.length, M = mutuals.length, L = loops.length;
    var type = M >= 2 ? 'mm' : M === 1 ? (F ? 'mf' : 'm') : F === 0 ? 'loop' : F >= 2 ? 'many' : L ? 'fl' : 'one';
    return {
      mode: mode, ids: ids, ruler: rul, nodes: N, roots: roots, finals: finals, mutuals: mutuals, loops: loops, type: type,
      final: type === 'one' ? finals[0] : null       // 全盘归一的那颗；没有就是 null
    };
  }

  var api = {
    SIGNS: SIGNS, SIGN_GLYPH: SIGN_GLYPH, ELEM: ELEM, BODIES: BODIES, RULER: RULER, ASPECTS: ASPECTS, CHALDEAN: CHALDEAN,
    dayNum: dayNum, bodies: bodies, sunPos: sunPos, gmst: gmst, angles: angles, houses: houses, houseOf: houseOf,
    dignity: dignity, aspects: aspects, firdaria: firdaria, profection: profection, chart: chart, fmtDeg: fmtDeg, mod: mod,
    // 推运
    PLANETS: PLANETS, TRANSIT_ORB: TRANSIT_ORB, VOC_IDS: VOC_IDS, TROP_YEAR: TROP_YEAR,
    chartAt: chartAt, lonOf: lonOf, speedOf: speedOf, search: search, crossings: crossings,
    stations: stations, retrogrades: retrogrades, solarReturn: solarReturn,
    moonIngresses: moonIngresses, moonAspects: moonAspects, voidMoon: voidMoon,
    natalPoints: natalPoints, transits: transits, exactTimes: exactTimes, transitHits: transitHits, progressed: progressed,
    // 定位星链
    RULER_MODERN: RULER_MODERN, SEVEN: SEVEN, dispositors: dispositors
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.XP = api;
})(this);
