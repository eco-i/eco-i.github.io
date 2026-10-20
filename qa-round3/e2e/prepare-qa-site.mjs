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
if (process.env.QA_ISOLATED_PROJECT_CONFIRMED !== 'YES') refuse('set QA_ISOLATED_PROJECT_CONFIRMED=YES only after verifying a NEW, separate synthetic-data project');
if (!qaUrl || !qaKey || !qaRef) refuse('QA_SUPABASE_REF, QA_SUPABASE_URL and QA_SUPABASE_ANON_KEY are required');
if (!/^[a-z0-9]{20}$/.test(qaRef)) refuse('invalid QA project ref');
let target;
try { target = new URL(qaUrl); } catch { refuse('QA_SUPABASE_URL must be an HTTPS URL'); }
const host = target.hostname.match(/^([a-z0-9]{20})\.supabase\.co$/);
if (!host || host[1] !== qaRef || target.protocol !== 'https:' || target.port || target.pathname !== '/' || target.search || target.hash || target.username || target.password) refuse('QA URL must exactly match https://<QA_SUPABASE_REF>.supabase.co');
if (new URL(productionUrl).hostname === target.hostname || qaUrl === productionUrl) refuse('QA target is the production backend');
if (qaKey === productionKey) refuse('QA key is identical to the production key');
if (/^sb_secret_/i.test(qaKey)) refuse('secret or service-role key must never be put into browser HTML');
if (qaKey.startsWith('sb_publishable_')) {
  if (!/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(qaKey)) refuse('invalid publishable key format');
  // New publishable keys contain no project ref. Manually verify the key's
  // project in the isolated QA Supabase dashboard before acknowledging.
  if (process.env.QA_PUBLISHABLE_KEY_VERIFIED !== 'YES') refuse('verify publishable key ownership in QA dashboard and set QA_PUBLISHABLE_KEY_VERIFIED=YES');
} else {
  let claims;
  try {
    const parts = qaKey.split('.');
    if (parts.length !== 3) throw Error('not a legacy JWT');
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch { refuse('QA key must be a verified QA publishable key or legacy anon JWT'); }
  if (claims.role !== 'anon' || claims.ref !== qaRef) refuse('legacy QA JWT must match anon role and QA project ref');
}
for (const file of files) {
  const filePath = join(root, file);
  if (!existsSync(filePath)) refuse(`missing required static asset: ${file}`);
  if (/\.(?:js|css|json|webmanifest)$/.test(file)) {
    const assetText = readFileSync(filePath, 'utf8');
    if (assetText.includes(productionUrl) || assetText.includes(productionKey)) refuse(`production config found in static asset: ${file}`);
  }
}
const page = source
  .replace(/^const SUPABASE_URL\s*=\s*(['"])(.*?)\1\s*;/m, `const SUPABASE_URL = ${JSON.stringify(qaUrl)};`)
  .replace(/^const SUPABASE_ANON_KEY\s*=\s*(['"])(.*?)\1\s*;/m, `const SUPABASE_ANON_KEY = ${JSON.stringify(qaKey)};`);
if (page.includes(productionUrl) || page.includes(productionKey)) refuse('production backend configuration remains in generated HTML');
const targetDir = mkdtempSync(join(tmpdir(), 'workmoa-isolated-qa-'));
for (const file of files) cpSync(join(root, file), join(targetDir, file));
writeFileSync(join(targetDir, 'index.html'), page, { mode: 0o600 });
writeFileSync(join(targetDir, 'ISOLATED_QA_ONLY.txt'), 'Synthetic employees and fake fingerprint photos only. Never import live staff records. Do not deploy this directory to production.\n');
console.log('QA isolation checks PASSED. No server connection or database operation was made.');
console.log(`Temporary QA static directory: ${targetDir}`);
console.log('Serve ONLY this temporary directory from a separate local/QA origin, and use fake test accounts.');
