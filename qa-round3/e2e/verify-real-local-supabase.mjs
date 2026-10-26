// Workmoa QA: actual local Supabase Auth/PostgREST/RLS smoke gate.
// Only localhost in an ephemeral, unlinked GitHub Actions runner; not Workmoa E2E.
// This file never accesses production, Supabase cloud, or employee data.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const fail = msg => { console.error('LOCAL_QA_SMOKE_FAIL: ' + msg); process.exit(2); };
if (process.env.GITHUB_ACTIONS !== 'true' || process.env.WORKMOA_EPHEMERAL_QA !== 'YES')
  fail('this probe is restricted to ephemeral GitHub Actions QA');
if (!existsSync('.workmoa-local-ci-only') ||
    readFileSync('.workmoa-local-ci-only','utf8').trim() !== 'FAKE_LOCAL_DB_NO_REMOTE_LINK')
  fail('unlinked isolated workspace marker missing');
if (process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_PROJECT_REF)
  fail('hosted Supabase credentials or project ref unexpectedly present');
const status = spawnSync('supabase', ['status','-o','env'], {encoding:'utf8',timeout:20000});
if (status.error || status.status !== 0) fail('local Supabase status unavailable');
function value(name) {
  const m=status.stdout.match(new RegExp('^\\s*'+name+'\\s*=\\s*(?:"([^"\\r\\n]+)"|\\x27([^\\x27\\r\\n]+)\\x27|([^\\r\\n]+))\\s*$','m'));
  return (m?.[1]||m?.[2]||m?.[3]||'').trim();
}
const api = value('API_URL');
const key = value('ANON_KEY');
if (api !== 'http://127.0.0.1:54321') fail('non-loopback local API URL');
if (!key || key.split('.').length !== 3) fail('local anon JWT unavailable');
let claims;
try { claims=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString('utf8')); }
catch { fail('malformed local anon JWT'); }
if (claims.role !== 'anon' || (claims.ref && claims.ref !== 'local'))
  fail('unexpected local JWT role or remote project ref');
const headers = {apikey:key, Authorization:'Bearer '+key, Accept:'application/json'};
const endpoint = api + '/rest/v1/workmoa_ci_probe';
async function call(url,opts={}) {
  try { return await fetch(url,{...opts,signal:AbortSignal.timeout(10000)}); }
  catch { fail('local HTTP endpoint unavailable'); }
}
const auth = await call(api+'/auth/v1/settings',{headers});
if (!auth.ok) fail('actual local Auth HTTP status '+auth.status);
console.log('REAL_LOCAL_AUTH_HTTP: PASS');
const select = await call(endpoint+'?select=message',{headers});
if (!select.ok) fail('actual local PostgREST query status '+select.status);
let visible;
try { visible=await select.json(); } catch { fail('local REST response is not JSON'); }
if (!Array.isArray(visible) || visible.length !== 0)
  fail('anon can read a seeded local row despite RLS');
console.log('REAL_LOCAL_POSTGREST_AND_RLS_SELECT: PASS');
const write = await call(endpoint,{
  method:'POST',
  headers:{...headers,'Content-Type':'application/json',Prefer:'return=representation'},
  body:JSON.stringify({message:'LOCAL_SYNTHETIC_CI_FORBIDDEN_WRITE'})
});
if (write.ok) fail('anon unexpectedly inserted into RLS-protected table');
if (write.status !== 401 && write.status !== 403)
  fail('anon write was not denied as an authorization error; status '+write.status);
console.log('REAL_LOCAL_RLS_WRITE_DENIAL: PASS');
console.log('RESULT: REAL_LOCAL_STACK_SMOKE_PASS (NOT Workmoa full-app E2E)');
