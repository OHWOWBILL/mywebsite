// 把一段私密内容（如八字、占星读盘的经文与解读脚本）加密成 JSON，供公开页面按需解开。
// 盐与迭代次数沿用一份已有的密文（默认占星读盘 static/xingpan/dupan.json），口令相同则派生出的钥匙相同：
// 在任一处读盘「此设备记住」过的设备，另一处也直接解开。
// 用法：node scripts/lock/encrypt-data.mjs <原文> <输出.json> <口令> [取盐的密文，默认 static/xingpan/dupan.json]
// 取盐的密文可以是这种 JSON，也可以是 encrypt.mjs 写出的锁页（内含 var BOX = {...}）。
// 原文请放在仓库之外，不要提交。口令不对（打不开取盐的那份密文）会直接报错，不写文件。
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [src, out, pw, lockFile] = process.argv.slice(2);
if (!src || !out || !pw) {
  console.error('用法：node scripts/lock/encrypt-data.mjs <原文> <输出.json> <口令> [取盐的密文]');
  process.exit(1);
}
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ref = lockFile || join(root, 'static', 'xingpan', 'dupan.json');
const text = readFileSync(ref, 'utf8');
const lock = JSON.parse(text.trimStart().startsWith('{') ? text : text.match(/var BOX = (\{.*?\});/s)[1]);
const b = (s) => Buffer.from(s, 'base64'), b64 = (u) => Buffer.from(u).toString('base64');

const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
const raw = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: b(lock.salt), iterations: lock.iter }, base, 256);
const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
// 先用这把钥匙试开取盐的那份密文，确认口令一致
try { await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b(lock.iv) }, key, b(lock.data)); }
catch (e) { console.error('口令打不开 ' + ref + '，未写入'); process.exit(1); }

const iv = crypto.getRandomValues(new Uint8Array(12));
const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, readFileSync(src));
writeFileSync(out, JSON.stringify({ id: lock.id, iter: lock.iter, salt: lock.salt, iv: b64(iv), data: b64(new Uint8Array(data)) }) + '\n');
console.log('已写入 ' + out + '（钥匙同 ' + ref + '）');
