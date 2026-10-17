'use strict';
const fs=require('fs'),crypto=require('crypto'),vm=require('vm');
const expected='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af';
const paths=['index.html','qa-handoff/index.before-2-8-285.html','qa-handoff/index.working-2-8-285.html','qa-handoff/index.before-2-8-286.html'];
const state=JSON.parse(fs.readFileSync('qa-handoff/CURRENT_STATE.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('qa-handoff/QA_2-8-285_SHA_MANIFEST.json','utf8'));
const evidence=JSON.parse(fs.readFileSync('qa-handoff/QA_285_EVIDENCE_AUDIT.json','utf8'));
let pass=0,fail=0,issues=[];
const ck=(name,ok)=>{if(ok)pass++;else{fail++;issues.push(name)}};
for(const path of paths){const b=fs.readFileSync(path);ck('immutable '+path,b.length===1175136&&crypto.createHash('sha256').update(b).digest('hex')===expected)}
ck('286 continuity',state.last_completed_block==='2-8-285'&&state.next_block==='2-8-286'&&state.cumulative_defects===540);
ck('high depth-eight',state.model_mode==='High'&&state.qa_depth===8);
ck('official baseline',state.baseline_path===paths[3]&&state.official_sha256===expected);
ck('285 confirmed actual 20 minutes',manifest.block==='2-8-285'&&manifest.status==='COMPLETE'&&manifest.actual_seconds>=1200&&manifest.soak_suite_groups>=184);
ck('285 complete job evidence',evidence.run.passed===21&&evidence.run.jobs===21&&evidence.run.conclusion==='success');
ck('286 promoted unchanged',manifest.files[paths[3]].sha256===expected);
ck('production protected',state.deployed===false&&state.sql_changed===false&&state.app_version==='ver20260927-0944'&&manifest.main_sha==='5c9529069a4728e72b960c61a44e8045eacc0ca0');
const html=fs.readFileSync(paths[3],'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).filter(x=>x.trim());
ck('script blocks present',scripts.length===2);
for(const script of scripts){try{new vm.Script(script);pass++}catch(e){fail++;issues.push('script syntax '+String(e))}}
ck('fingerprint picker exists',html.includes('id="fingerprintPhotoInput"'));
ck('APP_VERSION unchanged',html.includes("const APP_VERSION = 'ver20260927-0944';"));
console.log('QA286_PREFLIGHT_SUMMARY',JSON.stringify({pass,fail,issues,sha256:expected,bytes:Buffer.byteLength(html)}));
if(fail)process.exitCode=1;
