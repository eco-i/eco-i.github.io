import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// QA only. Does not contact any Supabase server and never writes into the repo.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const refuse = (reason) => { console.error(`QA isolation gate FAILED: ${reason}`); process.exit(2); };
const requireOne = (source, pattern, label) => {
  const found = [...source.matchAll(pattern)];
  if (found.length !== 1) refuse(`expected exactly one ${label} constant, found ${found.length}`);
  return found[0][2];
};
const files = [
  'maintenance-20261018.js', 'maintenance-mobile-20261018.css',
  'site-update-history.js', 'site-update-history.css',
  'future-holidays-2028-2035.js', 'version.json',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png'
];
const source = readFileSync(join(root, 'index.html'), 'utf8');
const urlPattern = /^const SUPABASE_URL\s*=\s*(['"])(.*?)\1\s*;/gm;
const keyPattern = /^const SUPABASE_ANON_KEY\s*=\s*(['"])(.*?)\1\s*;/gm;
const productionUrl = requireOne(source, urlPattern, 'SUPABASE_URL');
const productionKey = requireOne(source, keyPattern, 'SUPABASE_ANON_KEY');
const qaUrl = String(process.env.QA_SUPABASE_URL || '').trim().replace(/\/$/, '');
const qaKey = String(process.env.QA_SUPABASE_ANON_KEY || '').trim();
const qaRef = String(process.env.QA_SUPABASE_REF || '').trim();
const mode = String(process.env.QA_TARGET_KIND || 'HOSTED').trim();
const local = mode === 'LOCAL';
if (!['LOCAL','HOSTED'].includes(mode)) refuse('QA_TARGET_KIND must be LOCAL or HOSTED');
if (process.env.QA_ISOLATED_PROJECT_CONFIRMED !== 'YES') refuse('confirm independent synthetic-only QA project first');
if (!qaUrl || !qaKey) refuse('QA_SUPABASE_URL and QA_SUPABASE_ANON_KEY are required');
let target;
try { target = new URL(qaUrl); } catch { refuse('QA_SUPABASE_URL is invalid'); }
if (local) {
  if (process.env.QA_LOCAL_SUPABASE_CONFIRMED !== 'YES') refuse('local Supabase must be started independently, with fake data only');
  if (qaRef) refuse('local QA must not have a remote project ref');
  // Fail closed to the local CLI's default loopback API only.
  // Do not accept localhost aliases, LAN IPs, tunneling hosts or remote databases.
  if (qaUrl !== 'http://127.0.0.1:54321') refuse('local QA API must be http://127.0.0.1:54321');
} else {
  if (!/^[a-z0-9]{20}$/.test(qaRef)) refuse('invalid hosted QA project ref');
  const host = target.hostname.match(/^([a-z0-9]{20})\.supabase\.co$/);
  if (!host || host[1] !== qaRef || target.protocol !== 'https:' || target.port ||
      target.pathname !== '/' || target.search || target.hash || target.username || target.password)
    refuse('hosted QA URL must exactly match https://<QA_SUPABASE_REF>.supabase.co');
}
if (new URL(productionUrl).hostname === target.hostname || qaUrl === productionUrl) refuse('QA target is the production backend');
if (qaKey === productionKey) refuse('QA key is identical to the production key');
if (/^sb_secret_/i.test(qaKey)) refuse('secret or service-role key must never be put into browser HTML');
if (qaKey.startsWith('sb_publishable_')) {
  if (!/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(qaKey)) refuse('invalid publishable key format');
  // Publishable keys carry no project ref. A manual dashboard/CLI verification
  // is required; this flag does NOT cryptographically verify key ownership.
  if (local && process.env.QA_LOCAL_ANON_KEY_VERIFIED !== 'YES') refuse('confirm this key came from local supabase status');
  if (!local && process.env.QA_PUBLISHABLE_KEY_VERIFIED !== 'YES') refuse('verify the hosted QA key in its own dashboard');
} else {
  let claims;
  try {
    const parts = qaKey.split('.');
    if (parts.length !== 3) throw Error('not a legacy JWT');
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch { refuse('QA key must be a verified QA publishable key or legacy anon JWT'); }
  if (claims.role !== 'anon') refuse('only an anon JWT may be embedded');
  if (local) {
    if (process.env.QA_LOCAL_ANON_KEY_VERIFIED !== 'YES') refuse('confirm local anon JWT from local supabase status');
    if (claims.ref && claims.ref !== 'local') refuse('remote-project JWT is forbidden in local QA');
  } else if (claims.ref !== qaRef) refuse('hosted QA JWT must match its QA project ref');
}
for (const file of files) {
  const filePath = join(root, file);
  if (!existsSync(filePath)) refuse(`missing required static asset: ${file}`);
  if (/\.(?:js|css|json|webmanifest)$/.test(file)) {
    const assetText = readFileSync(filePath, 'utf8');
    if (assetText.includes(productionUrl) || assetText.includes(productionKey)) refuse(`production config found in static asset: ${file}`);
  }
}
// Restrict browser network access to this QA project even if future code gains another URL.
const realtimeOrigin = local ? 'ws://127.0.0.1:54321' : `wss://${target.hostname}`;
const csp = [
  "default-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${qaUrl} ${realtimeOrigin}`,
  "manifest-src 'self'",
  "media-src 'self' blob:",
  "worker-src 'none'",
  "frame-src 'none'",
  "object-src 'none'"
].join('; ');
if (!/^<!doctype html>/i.test(source.trimStart())) refuse('expected full HTML document');
if (!/<head(?:\s[^>]*)?>/i.test(source) || !/<\/head>/i.test(source)) refuse('expected document head');
if (/<meta\b[^>]*http-equiv\s*=\s*['"]?content-security-policy\b/i.test(source)) refuse('unexpected existing CSP; manual review required');
const page = source
  .replace(/^const SUPABASE_URL\s*=\s*(['"])(.*?)\1\s*;/m, `const SUPABASE_URL = ${JSON.stringify(qaUrl)};`)
  .replace(/^const SUPABASE_ANON_KEY\s*=\s*(['"])(.*?)\1\s*;/m, `const SUPABASE_ANON_KEY = ${JSON.stringify(qaKey)};`)
  .replace(/<head(?:\s[^>]*)?>/i, match => `${match}\n<meta http-equiv="Content-Security-Policy" content="${csp}">\n<meta name="workmoa-environment" content="isolated-synthetic-qa">`)
  .replace(/<title>근무모아<\/title>/, '<title>[격리 QA] 근무모아</title>');
if (page.includes(productionUrl) || page.includes(productionKey)) refuse('production backend configuration remains in generated HTML');
if (!page.includes('http-equiv="Content-Security-Policy"') || !page.includes(`connect-src 'self' ${qaUrl} ${realtimeOrigin}`)) refuse('QA network isolation policy missing');
const targetDir = mkdtempSync(join(tmpdir(), 'workmoa-isolated-qa-'));
for (const file of files) cpSync(join(root, file), join(targetDir, file));
writeFileSync(join(targetDir, 'index.html'), page, { mode: 0o600 });
writeFileSync(join(targetDir, 'ISOLATED_QA_ONLY.txt'), 'Synthetic employees and fake fingerprint photos only. Never import live staff records. Do not deploy this directory to production.\n');
console.log('QA isolation checks PASSED. No server connection or database operation was made.');
console.log(`Temporary QA static directory: ${targetDir}`);
console.log('Serve ONLY this temporary directory from a separate local/QA origin, and use fake test accounts.');
