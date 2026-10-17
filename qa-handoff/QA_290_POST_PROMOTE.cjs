'use strict';
const fs=require('fs'),crypto=require('crypto'),vm=require('vm'),http=require('http'),{chromium}=require('playwright-core');
const h='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af';
const paths=['index.html','qa-handoff/index.before-2-8-290.html','qa-handoff/index.working-2-8-290.html','qa-handoff/index.final-round-2.html'];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let pass=0,fail=0,issues=[];const ck=(n,b)=>{if(b)pass++;else{fail++;issues.push(n)}};
for(const p of paths)ck('same SHA '+p,sha(p)===h&&fs.statSync(p).size===1175136);
const j=JSON.parse(fs.readFileSync('qa-handoff/CURRENT_STATE.json','utf8'));
const m=JSON.parse(fs.readFileSync('qa-handoff/QA_2-8-290_SHA_MANIFEST.json','utf8'));
ck('complete290',j.last_completed_block==='2-8-290'&&j.next_block===null&&j.qa_round_2_status==='TESTED_SCOPE_COMPLETE'&&j.production_release_status==='NOT_APPROVED_PENDING_REAL_WORLD_SMOKE'&&j.cumulative_defects===540);
ck('source290',j.baseline_path===paths[3]&&j.official_sha256===h);
ck('manifest',m.status==='COMPLETE'&&m.actual_seconds>=1200&&m.exit_readiness_pass===343&&m.exit_readiness_fail===0&&m.closure_status==='TESTED_SCOPE_COMPLETE'&&m.production_release_status==='NOT_APPROVED_PENDING_REAL_WORLD_SMOKE'&&m.overtime_rpc_pass>100000&&m.holiday_work_rpc_pass===96384&&m.personnel_timeline_pass>100000&&m.absence_coverage_pass>100000&&m.annual_worktime_pass===111042&&m.substitute_roster_pass>50000&&m.shift_holiday_oracle_pass===57222&&m.timestamp_matrix_pass>100000&&m.exclusion_permutation_pass===658206&&m.longservice_band_pass===1734246&&m.longservice_exclusion_pass===636354&&m.files[paths[3]].sha256===h);
ck('operational constraint',!j.deployed&&!j.sql_changed&&j.app_version==='ver20260927-0944');
const html=fs.readFileSync(paths[3],'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).filter(x=>x.trim());
ck('scripts exactly 2',scripts.length===2);
for(const s of scripts){try{new vm.Script(s);pass++}catch(e){fail++;issues.push(String(e))}}
(async()=>{let browser,server;
try{
server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const width of [360,390,1280]){
const mobile=width<500,cx=await browser.newContext({viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
const p=await cx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());
await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
const x=await p.evaluate(()=>({version:APP_VERSION,login:!document.getElementById('loginView').classList.contains('hidden'),width:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
ck('Chrome boot '+width,x.version==='ver20260927-0944'&&x.login&&x.width<=5&&errors.length===0);await cx.close();
}
}catch(e){fail++;issues.push(String(e.stack||e))}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA290_POST_PROMOTE_SUMMARY',JSON.stringify({pass,fail,issues,sha256:h,version:j.app_version}));if(fail)process.exitCode=1;
})();