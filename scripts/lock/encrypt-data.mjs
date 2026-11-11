// 把一段私密内容（如占星读盘的经文与解读脚本）加密成 JSON，供公开页面按需解开。
// 盐与迭代次数沿用某个已上锁页面（默认命部 static/mingbu/index.html），口令相同则派生出的钥匙相同：
// 在命部「此设备记住」过的设备，这份内容也直接解开；反之在这里解开，命部也记住了。
// 用法：node scripts/lock/encrypt-data.mjs <原文> <输出.json> <口令> [取盐的锁页，默认 static/mingbu/index.html]
// 原文请放在仓库之外，不要提交。口令不对（派生不出锁页那把钥匙）会直接报错，不写文件。
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [src, out, pw, lockPage] = process.argv.slice(2);
if (!src || !out || !pw) {
  console.error('用法：node scripts/lock/encrypt-data.mjs <原文> <输出.json> <口令> [取盐的锁页]');
  process.exit(1);
}
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const page = readFileSync(lockPage || join(root, 'static', 'mingbu', 'index.html'), 'utf8');
const lock = JSON.parse(page.match(/var BOX = (\{.*?\});/s)[1]);
const b = (s) => Buffer.from(s, 'base64'), b64 = (u) => Buffer.from(u).toString('base64');

const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
const raw = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: b(lock.salt), iterations: lock.iter }, base, 256);
const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
// 先用这把钥匙试开锁页，确认口令与锁页一致
try { await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b(lock.iv) }, key, b(lock.data)); }
catch (e) { console.error('口令与锁页 ' + lock.id + ' 不符，未写入'); process.exit(1); }

const iv = crypto.getRandomValues(new Uint8Array(12));
const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, readFileSync(src));
writeFileSync(out, JSON.stringify({ id: lock.id, iter: lock.iter, salt: lock.salt, iv: b64(iv), data: b64(new Uint8Array(data)) }) + '\n');
console.log('已写入 ' + out + '（钥匙同 ' + lock.id + '）');
