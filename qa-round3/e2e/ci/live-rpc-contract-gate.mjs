#!/usr/bin/env node
// Workmoa QA: compare public frontend RPC names with a TIME-BOUNDED, NAMES-ONLY,
// user-approved read-only production catalog snapshot. NEVER calls Supabase.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const sources = ['index.html', 'maintenance-20261018.js', 'site-update-history.js'];
const snapshotRelative = 'qa-round3/e2e/ci/live-rpc-contract-snapshot.json';

export function scanCode(code) {
  const used = new Set();
  const direct = [];
  for (const m of code.matchAll(/\brpc\s*\(\s*(['"\x60])([a-z][a-z0-9_]*)\1/gi)) {
    const name = m[2].toLowerCase();
    used.add(name);
    direct.push({name, line: code.slice(0, m.index).split('\n').length});
  }
  for (const m of code.matchAll(/\brpcPreferPersonnel\s*\(\s*(['"\x60])([a-z][a-z0-9_]*)\1\s*,\s*(['"\x60])([a-z][a-z0-9_]*)\3/gi)) {
    used.add(m[2].toLowerCase());
    used.add(m[4].toLowerCase());
  }
  for (const m of code.matchAll(/\brpcPreferPersonnelChain\s*\(\s*\[([^\]]+)\]/g))
    for (const q of m[1].matchAll(/['"]([a-z][a-z0-9_]*)['"]/gi))
      used.add(q[1].toLowerCase());
  return {used, direct};
}

function scanRoot(root) {
  const used = new Set();
  const direct = [];
  for (const file of sources) {
    const code = fs.readFileSync(path.join(root,file),'utf8');
    const scan = scanCode(code);
    for (const n of scan.used) used.add(n);
    for (const c of scan.direct) direct.push({...c,file});
  }
  return {used,direct};
}

function gitHead(root) {
  return execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
}

function setEquals(a,b) {
  return a.size===b.size && [...a].every(x=>b.has(x));
}

function selfTest() {
  const toy = [
    "rpc('save_thing',{p:1});",
    "rpcPreferPersonnel('current_name','old_name');",
    "rpcPreferPersonnelChain(['chain_first','chain_last']);",
    "notRpc('false_match');",
    "rpc(name);"
  ].join('\n');
  const r = scanCode(toy);
  assert.deepEqual([...r.used].sort(),[
    'chain_first','chain_last','current_name','old_name','save_thing'
  ]);
  assert.equal(r.direct.length,1);
  assert.equal(r.direct[0].line,1);
  assert.equal(r.direct[0].name,'save_thing');
  assert.ok(!r.used.has('false_match'));
  assert.ok(!r.used.has('name'));
  console.log('STATIC_PARSER_SELF_TEST_PASS (source parser only, not application E2E)');
}

if (process.argv[2]==='--self-test') {
  selfTest();
  process.exit(0);
}

const mode = process.argv[2];
if (!['audit','enforce'].includes(mode))
  throw Error('USAGE: live-rpc-contract-gate.mjs audit|enforce <qa-checkout> <production-main-checkout>');
const qaRoot = path.resolve(process.argv[3]||'qa');
const prodRoot = path.resolve(process.argv[4]||'live-main');

const lock=JSON.parse(fs.readFileSync(path.join(qaRoot,snapshotRelative),'utf8'));
const missingNames=new Set(lock.missingNames);
const unexpectedSnapshot = lock.schemaVersion!==1 ||
  lock.sourceScope.join('|')!==sources.join('|') ||
  lock.missingNames.length!==26 ||
  missingNames.size!==26 ||
  lock.frontendCalledNames!==80 ||
  lock.installedOnServer!==54 ||
  lock.notInstalledOnServer!==26 ||
  lock.directProductionCallSites!==31 ||
  lock.fullAppE2eApproved!==false;
if (unexpectedSnapshot) throw Error('SNAPSHOT_INVALID: fail closed; evidence must be re-authorized.');

const now=new Date();
const recorded=new Date(lock.recordedDateKST+'T00:00:00+09:00');
const ageDays=(now-recorded)/86400000;
if (!Number.isFinite(ageDays)||ageDays<-.5||ageDays>7)
  throw Error('SNAPSHOT_STALE: only authorized read-only catalog refresh can renew the 7-day source observation.');
const prodHead=gitHead(prodRoot);
if (prodHead!==lock.productionHeadSha)
  throw Error('PRODUCTION_MAIN_CHANGED: existing snapshot must not be used as current evidence.');
const qa=scanRoot(qaRoot);
const prod=scanRoot(prodRoot);
const qaMissing=[...qa.used].filter(x=>missingNames.has(x)).sort();
const prodMissing=[...prod.used].filter(x=>missingNames.has(x)).sort();
const prodDirectMissing=prod.direct.filter(x=>missingNames.has(x.name));
const qaDirectMissing=qa.direct.filter(x=>missingNames.has(x.name));
if(qa.used.size!==lock.frontendCalledNames ||
   prod.used.size!==lock.frontendCalledNames ||
   !setEquals(prod.used,qa.used) ||
   !setEquals(new Set(qaMissing),missingNames) ||
   !setEquals(new Set(prodMissing),missingNames) ||
   prodDirectMissing.length!==lock.directProductionCallSites ||
   qaDirectMissing.length!==lock.directProductionCallSites)
  throw Error('RPC_INVENTORY_DRIFT: re-audit latest production catalog and public frontend before judging any release.');

const report={
  schemaVersion:1,
  status:'BLOCKED__RELEASE_CONTRACT_MISMATCH',
  source:'Approved names-only snapshot from production pg_catalog, NOT a live database query by CI',
  snapshotDateKST:lock.recordedDateKST,
  productionMainSha:prodHead,
  productionCalledDistinct:prod.used.size,
  qaCalledDistinct:qa.used.size,
  productionInstalledNameSnapshot:lock.installedOnServer,
  productionMissingNameSnapshot:missingNames.size,
  directMissingCallsitesProduction:prodDirectMissing.length,
  directMissingCallsitesQA:qaDirectMissing.length,
  calls:prodDirectMissing.map(x=>({name:x.name,file:x.file,line:x.line})),
  actualUiExecutionVerified:false,
  actualAuthenticatedE2EVerified:false,
  userDataAccessed:false,
  externalProductionDbAccess:false,
  syntheticSqlSubstitute:false,
  releaseApproval:false,
  disclaimer:'GREEN inventory collection only means the mismatch was accurately detected. Enforce gate MUST fail.'
};
const artifactPath=path.join(process.env.RUNNER_TEMP||qaRoot,'workmoa-live-rpc-contract.json');
if(mode==='audit') {
  fs.writeFileSync(artifactPath,JSON.stringify(report,null,2)+'\n');
  console.log('INVENTORY_RECORDED main='+prodHead.slice(0,12)+' calls='+report.productionCalledDistinct+
    ' installed_snapshot='+report.productionInstalledNameSnapshot+
    ' absent_snapshot='+report.productionMissingNameSnapshot+
    ' direct_missing_calls='+report.directMissingCallsitesProduction);
  if(process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      '## Read-only RPC name contract gate — BLOCKED\n\n'+
      '- Production main RPC names: **80**; installed in approved server snapshot: **54**; missing: **26**.\n'+
      '- **31 direct calls** to missing function names in both main and QA.\n'+
      '- Explicit snapshot date (KST): **'+lock.recordedDateKST+'**; this run does **NOT** access production Supabase.\n'+
      '- Deployment / real authenticated E2E: **NOT APPROVED / NOT VERIFIED**.\n'+
      '- Enforce phase deliberately fails closed. No synthetic SQL treated as real server code.\n\n');
  }
} else {
  console.error('EXPECTED_RELEASE_BLOCK: 26 unresolved live-server RPC name gaps / 31 callsites; no deployment approval');
  process.exitCode=2;
}
