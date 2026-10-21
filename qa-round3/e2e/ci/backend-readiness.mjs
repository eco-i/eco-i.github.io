#!/usr/bin/env node
// Read-only source provenance audit. No network, no credentials, no Supabase calls.
// QA synthetic SQL is NOT treated as source for operational RPC implementations.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const sources=['index.html','maintenance-20261018.js','site-update-history.js'];
const folder=path.join(root,'db','migrations');
const critical=['login_employee_personnel_v1','login_employee','get_personnel_account_status',
  'get_account_status','list_employees_personnel_v2','list_personnel_assignments',
  'list_personnel_account_events','save_attendance_personnel_v2',
  'save_attendance_with_annual_leave_personnel_v2','delete_attendance_personnel_v2',
  'list_attendance_with_annual_leave','initial_pin_status_v1','change_own_pin_v2'];
const used=new Map(),defs=new Map();
function add(map,name,file){
  name=name.toLowerCase();
  if(!map.has(name))map.set(name,new Set());
  map.get(name).add(file);
}
for(const file of sources){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  for(const m of text.matchAll(/\brpc\s*\(\s*(['"\x60])([a-z][a-z0-9_]*)\1/gi))
    add(used,m[2],file);
  for(const m of text.matchAll(/\brpcPreferPersonnel\s*\(\s*(['"\x60])([a-z][a-z0-9_]*)\1\s*,\s*(['"\x60])([a-z][a-z0-9_]*)\3/gi)){
    add(used,m[2],file);
    add(used,m[4],file);
  }
  for(const m of text.matchAll(/\brpcPreferPersonnelChain\s*\(\s*\[([^\]]+)\]/g))
    for(const q of m[1].matchAll(/['"]([a-z][a-z0-9_]*)['"]/gi))add(used,q[1],file);
}
const sqlFiles=fs.readdirSync(folder).filter(x=>x.endsWith('.sql')).sort();
for(const file of sqlFiles){
  const text=fs.readFileSync(path.join(folder,file),'utf8');
  for(const m of text.matchAll(/\bCREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/gi))
    add(defs,m[1],'db/migrations/'+file);
}
const all=[...used.keys()].sort();
const documented=all.filter(x=>defs.has(x));
const missing=all.filter(x=>!defs.has(x));
if(all.length<40||!all.includes('save_attendance_personnel_v2')||!all.includes('login_employee_personnel_v1'))
  throw Error('FAIL CLOSED: incomplete source parsing; no E2E readiness judgment');
const state=JSON.parse(fs.readFileSync(path.join(root,'qa-round3/CURRENT_STATE.json'),'utf8'));
if(state.status==='CLEAN'||state.actions_ci_actual_attendance_form?.full_app_p0_p1_e2e_verified===true)
  throw Error('FAIL CLOSED: all-app clean claimed without genuine production-source evidence');
const result={
  schemaVersion:1,
  audit:'Workmoa versioned backend RPC source-of-truth inventory',
  scope:'Literal frontend RPC and fallback names only; dynamically generated calls may be additional',
  codeFiles:sources,
  sourceFolder:'db/migrations',
  migrationFiles:sqlFiles.length,
  calledDistinct:all.length,
  namesDefinedInRepoMigrations:documented.length,
  missingDefinitionsInRepoMigrations:missing.length,
  documented:documented.map(name=>({name,files:[...defs.get(name)].sort()})),
  missing:missing.map(name=>({name,callSites:[...used.get(name)].sort()})),
  critical:critical.map(name=>({name,repoDefinitionFound:defs.has(name)})),
  genuineProductionBackendInspected:false,
  operationalRlsAuthVerified:false,
  syntheticFixturesCountAsEvidence:false,
  status:'SOURCE_PROVENANCE_BLOCKED__FULL_APP_E2E_UNVERIFIED',
  approvalForRelease:false,
  interpretation:'Missing in repo does not prove missing on real deployed server'
};
const output=path.join(process.env.RUNNER_TEMP||path.dirname(fileURLToPath(import.meta.url)),
  'workmoa-backend-readiness.json');
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
const rows=critical.map(name=>'| '+name+' | '+(defs.has(name)?'Repository SQL found':'REPOSITORY SQL NOT FOUND')+' |').join('\n');
const summary=[
  '## Backend source readiness, NOT full E2E clearance','',
  '**Repository-source audit only. Does not connect to real production Supabase.**','',
  '- Literal frontend API names: '+all.length,
  '- Supported in '+sqlFiles.length+' versioned repo SQL migrations: '+documented.length,
  '- Not documented in repo SQL: '+missing.length,
  '- Full app authenticated E2E: UNVERIFIED','- Deployment: NOT APPROVED','',
  '| Critical RPC | DDL source in repo |','|---|---|',rows,'',
  'QA synthetic SQL fixtures are explicitly excluded. Green audit run means inventory generated successfully, not release readiness.',''
].join('\n');
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
console.log('SOURCE_PROVENANCE_AUDIT_PASS called='+all.length+' documented='+documented.length+' missing='+missing.length);
console.log('FULL_APP_E2E_UNVERIFIED; NO_PROD_DB_ACCESS; SYNTHETIC_FIXTURES_EXCLUDED');
