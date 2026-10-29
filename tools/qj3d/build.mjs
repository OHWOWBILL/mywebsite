// 把 src/ 连同用到的 three.js 部件打成一个 ES 模块，放进 assets/js/qj3d.js。
// 首页入阁时 assets/js/qj/ge.js 在后台 import() 它；Hugo 只负责加指纹。
// 改了 src/ 之后：cd tools/qj3d && npm install && npm run build，把 assets/js/qj3d.js 一起提交。
import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'esm',
  minify: true,
  target: 'es2020',
  legalComments: 'none',
  outfile: '../../assets/js/qj3d.js',
  logLevel: 'info',
});
