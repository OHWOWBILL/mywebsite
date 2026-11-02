/* =========================================================
   星盘 · 本命盘核心
   ---------------------------------------------------------
   行星位置用 Paul Schlyter《How to compute planetary positions》的方法：
   日、月、水金火木土天海按轨道根数解开普勒方程，木土天加大不等式等摄动，
   月亮加出差、二均差等十二项；冥王星用其 1885–2099 年适用的级数。
   精度约一至二角分，足供本命盘之用（黄道为当日分点，即回归黄道）。
   上升、中天由格林尼治平恒星时（IAU）推；宫制有 Placidus、整宫、等宫、波菲利。
   法达按昼夜分序，主运之下七分子运（迦勒底序）；小限每年一宫。

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

  var api = {
    SIGNS: SIGNS, SIGN_GLYPH: SIGN_GLYPH, ELEM: ELEM, BODIES: BODIES, RULER: RULER, ASPECTS: ASPECTS, CHALDEAN: CHALDEAN,
    dayNum: dayNum, bodies: bodies, sunPos: sunPos, gmst: gmst, angles: angles, houses: houses, houseOf: houseOf,
    dignity: dignity, aspects: aspects, firdaria: firdaria, profection: profection, chart: chart, fmtDeg: fmtDeg, mod: mod
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.XP = api;
})(this);
