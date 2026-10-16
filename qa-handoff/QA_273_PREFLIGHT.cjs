'use strict';
const fs=require('fs'),crypto=require('crypto'),vm=require('vm');
const expected='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af';
const paths=['index.html','qa-handoff/index.before-2-8-272.html','qa-handoff/index.working-2-8-272.html','qa-handoff/index.before-2-8-273.html'];
const state=JSON.parse(fs.readFileSync('qa-handoff/CURRENT_STATE.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('qa-handoff/QA_2-8-272_SHA_MANIFEST.json','utf8'));
let pass=0,fail=0,issues=[];
function ck(label,yes){if(yes)pass++;else{fail++;issues.push(label);}}
for(const f of paths){const b=fs.readFileSync(f);ck('immutable '+f,b.length===1175136&&crypto.createHash('sha256').update(b).digest('hex')===expected);}
ck('273 starts after 272',state.last_completed_block==='2-8-272'&&state.next_block==='2-8-273'&&state.cumulative_defects===540);
ck('high depth-eight',state.model_mode==='High'&&state.qa_depth===8);
ck('official starting baseline',state.baseline_path===paths[3]&&state.official_sha256===expected);
ck('270 confirmed >=20min',manifest.block==='2-8-272'&&manifest.status==='COMPLETE'&&manifest.actual_seconds>=1200);
ck('270 promoted unchanged',manifest.files[paths[3]].sha256===expected);
ck('production protected',state.deployed===false&&state.sql_changed===false&&state.app_version==='ver20260927-0944');
const html=fs.readFileSync(paths[3],'utf8');
const code=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).filter(x=>x.trim());
ck('two script blocks',code.length===2);
for(const s of code){try{new vm.Script(s);pass++;}catch(e){fail++;issues.push('syntax '+String(e));}}
ck('fingerprint file picker',html.includes('id="fingerprintPhotoInput"'));
ck('APP_VERSION',html.includes("const APP_VERSION = 'ver20260927-0944';"));
console.log('QA273_PREFLIGHT_SUMMARY',JSON.stringify({pass,fail,issues,sha256:expected,bytes:Buffer.byteLength(html)}));
if(fail)process.exitCode=1;
