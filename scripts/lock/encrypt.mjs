// 用口令把一个 HTML 页面加密成 static/<目录>/index.html，只有知道口令的人能打开。
// 用法：node scripts/lock/encrypt.mjs <原文.html> <输出目录名> <口令>
// 原文请放在仓库之外，不要提交。
// 锁屏上的导航高亮与副题取自原文的 <body data-tool="…"> 和 <meta name="lock-sub" content="…">，没写就按命部。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [src, dir, pw] = process.argv.slice(2);
if (!src || !dir || !pw) {
  console.error('用法：node scripts/lock/encrypt.mjs <原文.html> <输出目录名> <口令>');
  process.exit(1);
}
const here = dirname(fileURLToPath(import.meta.url));
const iter = 600000;
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const b64 = (u) => Buffer.from(u).toString('base64');

const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
const raw = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, base, 256);
const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']);
const plain = readFileSync(src);
const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
const text = plain.toString('utf8');
const tool = text.match(/<body[^>]*\sdata-tool="([^"]+)"/)?.[1] ?? 'mingbu';
const sub = text.match(/<meta name="lock-sub" content="([^"]+)"/)?.[1] ?? '命部 · 占星八字读盘 · 非持诀者不得开启';

const box = { id: dir, iter, salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(data)) };
const page = readFileSync(join(here, 'template.html'), 'utf8')
  .replace('/*BOX*/null/*BOX*/', () => JSON.stringify(box))
  .replace('{{TOOL}}', () => tool)
  .replace('{{SUB}}', () => sub);
const out = join(here, '..', '..', 'static', dir);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), page);
console.log(`已写入 static/${dir}/index.html`);
