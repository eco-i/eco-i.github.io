import {spawnSync} from 'node:child_process';
import {copyFileSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {after,test} from 'node:test';
import assert from 'node:assert/strict';
// All projects, names, URLs and credentials are synthetic. No network.
const root=mkdtempSync(join(tmpdir(),'workmoa-local-test-'));
const builder=join(root,'qa-round3/e2e/prepare-local-qa-site.mjs');
mkdirSync(dirname(builder),{recursive:true});
copyFileSync(join(dirname(fileURLToPath(import.meta.url)),'prepare-local-qa-site.mjs'),builder);
const prod='p'.repeat(20),prodKey='sb_publishable_FAKE_PROD_12345678',qaKey='sb_publishable_FAKE_LOCAL_12345678';
const index=join(root,'index.html');
const original='<!DOCTYPE html><html><head><title>근무모아</title></head><body><script>\nconst SUPABASE_URL = "https://'+prod+'.supabase.co";\nconst SUPABASE_ANON_KEY = "'+prodKey+'";\n</script></body></html>';
writeFileSync(index,original);
const assets=['maintenance-20261018.js','maintenance-mobile-20261018.css','site-update-history.js','site-update-history.css','future-holidays-2028-2035.js','version.json','manifest.webmanifest','icon-192.png','icon-512.png'];
for(const p of assets)writeFileSync(join(root,p),'fake');
const env={PATH:process.env.PATH,LOCAL_QA_ONLY:'YES',LOCAL_QA_KEYS_CONFIRMED:'YES',LOCAL_SUPABASE_URL:'http://127.0.0.1:54321',LOCAL_SUPABASE_ANON_KEY:qaKey};
const run=x=>spawnSync(process.execPath,[builder],{encoding:'utf8',env:{...env,...x}});
const jwt=role=>Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.fake';
after(()=>rmSync(root,{recursive:true,force:true}));
const no=(label,changes)=>test(label,()=>assert.equal(run(changes).status,2));
no('no local-only confirmation',{LOCAL_QA_ONLY:'NO'});
no('no key confirmation',{LOCAL_QA_KEYS_CONFIRMED:'NO'});
no('remote target',{LOCAL_SUPABASE_URL:'https://'+prod+'.supabase.co'});
no('localhost alias',{LOCAL_SUPABASE_URL:'http://localhost:54321'});
no('wrong API port',{LOCAL_SUPABASE_URL:'http://127.0.0.1:54322'});
no('reused production key',{LOCAL_SUPABASE_ANON_KEY:prodKey});
no('service secret',{LOCAL_SUPABASE_ANON_KEY:'sb_secret_FAKE_KEY'});
no('service-role JWT',{LOCAL_SUPABASE_ANON_KEY:jwt('service_role')});
no('blank key',{LOCAL_SUPABASE_ANON_KEY:''});
no('garbage key',{LOCAL_SUPABASE_ANON_KEY:'bad'});
for(const key of [qaKey,jwt('anon')])test('local HTML generated with CSP',()=>{
 const p=run({LOCAL_SUPABASE_ANON_KEY:key});assert.equal(p.status,0,p.stderr);
 const matched=p.stdout.match(/LOCAL QA READY: (.+)/);assert.ok(matched);
 const text=readFileSync(join(matched[1],'index.html'),'utf8');
 assert.ok(text.includes(key) && !text.includes(prodKey));
 assert.ok(text.includes("connect-src 'self' http://127.0.0.1:54321 ws://127.0.0.1:54321"));
 assert.ok(!text.includes(prod+'.supabase.co') && text.includes('[로컬 QA 전용]'));
 assert.ok(!p.stdout.includes(key));
 rmSync(matched[1],{recursive:true,force:true});
});
test('reject remote reference in asset',()=>{
 const p=join(root,'site-update-history.js');
 try{writeFileSync(p,'https://'+prod+'.supabase.co');assert.equal(run().status,2)}finally{writeFileSync(p,'fake')}
});
test('reject inherited CSP',()=>{
 try{writeFileSync(index,original.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="default-src *">'));assert.equal(run().status,2)}finally{writeFileSync(index,original)}
});
test('reject missing icon',()=>{
 const p=join(root,'icon-192.png');
 try{rmSync(p);assert.equal(run().status,2)}finally{writeFileSync(p,'fake')}
});
