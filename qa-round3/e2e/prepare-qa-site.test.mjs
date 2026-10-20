import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, test } from 'node:test';
import assert from 'node:assert/strict';

// Offline synthetic data only. No network, SQL, real accounts or secrets.
const root = mkdtempSync(join(tmpdir(), 'workmoa-qa-fixture-'));
const source = join(dirname(fileURLToPath(import.meta.url)), 'prepare-qa-site.mjs');
const runner = join(root, 'qa-round3/e2e/prepare-qa-site.mjs');
mkdirSync(dirname(runner), { recursive: true });
copyFileSync(source, runner);
const prodRef = 'p'.repeat(20), qaRef = 'q'.repeat(20);
const prodKey = 'sb_publishable_PRODUCTION_FAKE_123456789';
const qaKey = 'sb_publishable_ISOLATED_QA_FAKE_123456789';
writeFileSync(join(root, 'index.html'), '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><script>window.fake=true;</script><script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0"></script><title>근무모아</title></head><body><script>\n' + "const SUPABASE_URL = 'https://" + prodRef + ".supabase.co';\nconst SUPABASE_ANON_KEY = '" + prodKey + "';\n" + '</script></body></html>');
for (const asset of ['maintenance-20261018.js', 'maintenance-mobile-20261018.css', 'site-update-history.js', 'site-update-history.css', 'future-holidays-2028-2035.js', 'version.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']) writeFileSync(join(root, asset), 'synthetic');
const defaultEnv = { QA_ISOLATED_PROJECT_CONFIRMED:'YES', QA_SUPABASE_REF:qaRef, QA_SUPABASE_URL:'https://' + qaRef + '.supabase.co', QA_SUPABASE_ANON_KEY:qaKey, QA_PUBLISHABLE_KEY_VERIFIED:'YES' };
const exec = (override = {}) => spawnSync(process.execPath, [runner], { encoding:'utf8', env: { PATH:process.env.PATH, ...defaultEnv, ...override } });
const jwt = (role,ref) => Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({role,ref})).toString('base64url')+'.synthetic';
const rejects = (name,env) => test(name, () => assert.equal(exec(env).status, 2));
after(() => rmSync(root, { recursive: true, force: true }));
rejects('missing QA confirmation', { QA_ISOLATED_PROJECT_CONFIRMED:'NO' });
rejects('missing QA ref', { QA_SUPABASE_REF:'' });
rejects('operating project host', { QA_SUPABASE_REF:prodRef, QA_SUPABASE_URL:'https://' + prodRef + '.supabase.co' });
rejects('operating publishable key', { QA_SUPABASE_ANON_KEY:prodKey });
rejects('wrong target hostname', { QA_SUPABASE_URL:'https://example.com' });
rejects('service-role key', { QA_SUPABASE_ANON_KEY:'sb_secret_SYNTHETIC_ONLY_KEY_123456789' });
rejects('publishable key without verified project ownership', { QA_PUBLISHABLE_KEY_VERIFIED:'NO' });
rejects('legacy anon JWT ref mismatch', { QA_SUPABASE_ANON_KEY:jwt('anon',prodRef) });
rejects('legacy JWT service role', { QA_SUPABASE_ANON_KEY:jwt('service_role',qaRef) });
for (const [name,key,extra] of [
  ['isolated modern publishable QA key',qaKey,{}],
  ['isolated legacy anon QA JWT',jwt('anon',qaRef),{QA_PUBLISHABLE_KEY_VERIFIED:'NO'}]
]) test(name, () => {
 const result = exec({QA_SUPABASE_ANON_KEY:key,...extra});
 assert.equal(result.status,0,result.stderr);
 assert.ok(!result.stdout.includes(key),'key should never appear in stdout');
 const dest = result.stdout.match(/Temporary QA (?:site|static directory): (.+)/)?.[1];
 assert.ok(dest,'temporary directory must be declared');
 const page = readFileSync(join(dest, 'index.html'),'utf8');
 assert.ok(page.includes(key) && page.includes(defaultEnv.QA_SUPABASE_URL));
 assert.ok(!page.includes(prodKey) && !page.includes(prodRef));
 assert.ok(page.includes('[격리 QA] 근무모아'));
 assert.ok(page.includes('name="workmoa-environment" content="isolated-synthetic-qa"'));
 assert.match(page, /<head>\s*<meta http-equiv="Content-Security-Policy"/);
 assert.ok(page.includes(`connect-src 'self' ${defaultEnv.QA_SUPABASE_URL} wss://${qaRef}.supabase.co`));
 assert.ok(page.includes("script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net"));
 assert.ok(page.includes("img-src 'self' data: blob:"));
 assert.ok(page.includes("frame-src 'none'") && page.includes("object-src 'none'"));
 rmSync(dest,{recursive:true,force:true});
});
test('refuse production hostname hidden in static asset', () => {
 const path = join(root, 'site-update-history.js');
 try { writeFileSync(path,'https://' + prodRef + '.supabase.co'); assert.equal(exec().status,2); }
 finally { writeFileSync(path,'synthetic'); }
});
test('refuse missing required asset', () => {
 const path = join(root, 'icon-192.png');
 try { rmSync(path); assert.equal(exec().status,2); }
 finally { writeFileSync(path,'synthetic'); }
});

test('incomplete HTML head blocked', () => {
 const path=join(root,'index.html'),original=readFileSync(path,'utf8');
 try{writeFileSync(path,original.replace('<head>','<header>').replace('</head>','</header>'));assert.equal(exec().status,2);}
 finally{writeFileSync(path,original);}
});
test('preexisting CSP rejected for manual review', () => {
 const path=join(root,'index.html'),original=readFileSync(path,'utf8');
 try{writeFileSync(path,original.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="default-src *">'));assert.equal(exec().status,2);}
 finally{writeFileSync(path,original);}
});
