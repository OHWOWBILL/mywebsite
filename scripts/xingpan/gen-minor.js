// 生成 static/xingpan/minor.js：凯龙与谷神、智神、婚神、灶神四小行星的日心黄道直角坐标表（当日平分点，1899–2101）。
// 这几颗受木土摄动大，一套固定根数管不了两百年，所以直接从瑞士星历（Swiss Ephemeris）取样，页面里八点插值。
// 只在要重做表时跑：
//   npm i sweph（任意目录），并把 seas_18.se1、sepl_18.se1、semo_18.se1 放进一个目录
//   （github.com/aloistr/swisseph 的 ephe/），然后
//   NODE_PATH=<装 sweph 的 node_modules> node scripts/xingpan/gen-minor.js <星历目录>
const fs = require('fs'), path = require('path');
const s = require('sweph'), K = s.constants;
s.set_ephe_path(process.argv[2] || 'ephe');
const FL = K.SEFLG_SWIEPH | K.SEFLG_HELCTR | K.SEFLG_XYZ | K.SEFLG_NONUT | K.SEFLG_TRUEPOS;
const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const UNIT = 1e-5, JD0 = s.julday(1899, 1, 1, 0, 1), JD1 = s.julday(2101, 1, 1, 0, 1);
const LIST = [['chiron', K.SE_CHIRON, 150], ['ceres', K.SE_CERES, 80], ['pallas', K.SE_PALLAS, 80], ['juno', K.SE_JUNO, 80], ['vesta', K.SE_VESTA, 80]];
const out = { unit: UNIT, jd0: JD0, b: {} };
LIST.forEach(([id, se, step]) => {
  const n = Math.ceil((JD1 - JD0) / step) + 8, first = [], str = ['', '', ''], prev = [0, 0, 0];
  for (let k = 0; k < n; k++) {
    const r = s.calc_ut(JD0 + (k - 4) * step, se, FL);
    if (r.error || !(r.flag & K.SEFLG_SWIEPH)) throw new Error(id + ' ' + r.error);
    for (let c = 0; c < 3; c++) {
      const v = Math.round(r.data[c] / UNIT);
      if (k === 0) first.push(v);
      else {
        const d = v - prev[c] + 131072;
        if (d < 0 || d > 262143) throw new Error(id + ' 步长太大 ' + k + ' ' + d + ' ' + JSON.stringify(r));
        str[c] += A64[d >> 12] + A64[(d >> 6) & 63] + A64[d & 63];
      }
      prev[c] = v;
    }
  }
  out.b[id] = { step, k0: -4, first, d: str };
});
const js = '/* 星盘 · 凯龙与四小行星坐标表（scripts/xingpan/gen-minor.js 由瑞士星历取样生成，勿手改） */\n' +
  '(function (root) { var M = ' + JSON.stringify(out) + ';\n' +
  "  if (typeof module !== 'undefined' && module.exports) module.exports = M; else root.XP_MINOR = M;\n})(this);\n";
fs.writeFileSync(path.join(__dirname, '../../static/xingpan/minor.js'), js);
console.log('minor.js', js.length, '字节');
