import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// LOCAL QA ONLY. No network operations, remote keys, or employee data.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
function reject(why) { console.error('LOCAL QA REJECTED: ' + why); process.exit(2); }
const input = readFileSync(join(root, 'index.html'), 'utf8');
function one(name) {
  const re = new RegExp('^const ' + name + '\\s*=\\s*([\\x27\\x22])(.*?)\\1\\s*;', 'gm');
  const all = [...input.matchAll(re)];
  if (all.length !== 1) reject('expected exactly one ' + name);
  return all[0][2];
}
const prodUrl = one('SUPABASE_URL');
const prodKey = one('SUPABASE_ANON_KEY');
if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co\/?$/i.test(prodUrl)) reject('unexpected production source URL');
if (process.env.LOCAL_QA_ONLY !== 'YES' || process.env.LOCAL_QA_KEYS_CONFIRMED !== 'YES') reject('explicit local-only confirmation missing');
if (process.env.LOCAL_SUPABASE_URL !== 'http://127.0.0.1:54321') reject('only local loopback API allowed');
const key = String(process.env.LOCAL_SUPABASE_ANON_KEY || '');
if (!key || key === prodKey || /^(sb_secret_|sbp_)/i.test(key)) reject('missing/production/secret key');
if (key.startsWith('sb_publishable_')) {
  if (!/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key)) reject('bad publishable key');
} else {
  try {
    const parts = key.split('.');
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (parts.length !== 3 || claims.role !== 'anon') throw Error('not anon');
  } catch { reject('invalid anonymous local key'); }
}
const assets = ['maintenance-20261018.js','maintenance-mobile-20261018.css','site-update-history.js','site-update-history.css','future-holidays-2028-2035.js','version.json','manifest.webmanifest','icon-192.png','icon-512.png'];
for (const item of assets) {
  const p = join(root,item);
  if (!existsSync(p)) reject('missing asset ' + item);
  if (/\.(js|css|json|webmanifest)$/.test(item)) {
    const data=readFileSync(p,'utf8');
    if (data.includes(prodUrl) || data.includes(prodKey) || /https?:\/\/[a-z0-9]{20}\.supabase\.co/i.test(data)) reject('remote backend found in asset ' + item);
  }
}
if (!/<head(?:\s[^>]*)?>/i.test(input) || !/<\/head>/i.test(input)) reject('missing HTML head');
if (/<meta\b[^>]*http-equiv\s*=\s*['"]?content-security-policy\b/i.test(input)) reject('existing CSP needs review');
const csp = ["default-src 'none'","base-uri 'self'","form-action 'self'","script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net","style-src 'self' 'unsafe-inline'","img-src 'self' data: blob:","font-src 'self' data:","connect-src 'self' http://127.0.0.1:54321 ws://127.0.0.1:54321","manifest-src 'self'","media-src 'self' blob:","worker-src 'none'","frame-src 'none'","object-src 'none'"].join('; ');
const page = input
 .replace(/^const SUPABASE_URL\s*=\s*(['"])(.*?)\1\s*;/m, "const SUPABASE_URL = 'http://127.0.0.1:54321';")
 .replace(/^const SUPABASE_ANON_KEY\s*=\s*(['"])(.*?)\1\s*;/m, 'const SUPABASE_ANON_KEY = ' + JSON.stringify(key) + ';')
 .replace(/<head(?:\s[^>]*)?>/i, m => m + '\n<meta http-equiv="Content-Security-Policy" content="' + csp + '">\n<meta name="workmoa-environment" content="local-synthetic-qa">')
 .replace(/<title>근무모아<\/title>/, '<title>[로컬 QA 전용] 근무모아</title>');
if (page.includes(prodUrl) || page.includes(prodKey) || /https?:\/\/[a-z0-9]{20}\.supabase\.co/i.test(page)) reject('remote backend remains');
const dir=mkdtempSync(join(tmpdir(),'workmoa-local-qa-'));
for(const item of assets) cpSync(join(root,item),join(dir,item));
writeFileSync(join(dir,'index.html'),page,{mode:0o600});
writeFileSync(join(dir,'LOCAL_QA_ONLY.txt'),'LOCAL SYNTHETIC QA ONLY. NEVER DEPLOY OR IMPORT REAL DATA.\n');
console.log('LOCAL QA READY: ' + dir);
console.log('No backend operation performed. All API requests must stay on 127.0.0.1.');
