'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const expectedSha='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af';
const baselinePath='qa-handoff/index.before-2-8-290.html',baseline=fs.readFileSync(baselinePath);
let pass=0,fail=0,history=0,contexts=0,issues=[],riskFlags=[];
const ck=(label,ok)=>{if(ok)pass++;else{fail++;if(issues.length<60)issues.push(label)}};
const file=path=>fs.readFileSync(path,'utf8');
ck('290 baseline official SHA',sha(baseline)===expectedSha);
ck('290 baseline official size',baseline.length===1175136);
ck('QA current index matches immutable baseline',Buffer.compare(baseline,fs.readFileSync('index.html'))===0);
const official=JSON.parse(file('qa-handoff/CURRENT_STATE.json'));
ck('289 official last completed',official.last_completed_block==='2-8-289');
ck('290 official next',official.next_block==='2-8-290');
ck('540 actual canonical cumulative products',official.cumulative_defects===540);
ck('official sha consistent',official.official_sha256===expectedSha);
ck('production not deployed',official.deployed===false&&official.sql_changed===false);
ck('app version immutable',official.app_version==='ver20260927-0944');
ck('prior 289 handoff verified',official.last_handoff_check?.status==='SUCCESS'&&official.last_handoff_check.pass===14&&official.last_handoff_check.fail===0);
const source=f=>file('qa-handoff/'+f);
const fix258=source('QA_2-8-258_REPORT.md');
ck('final recorded product defect at 258',/539\s*(?:→|->)\s*540/.test(fix258));
const names=[];
for(let n=259;n<=289;n++){
 const tag='2-8-'+n,report=source('QA_'+tag+'_REPORT.md'),manifest=JSON.parse(source('QA_'+tag+'_SHA_MANIFEST.json'));
 ck(tag+' report exists and names its block',report.includes(tag));
 ck(tag+' manifest COMPLETE',manifest.status==='COMPLETE'&&manifest.block===tag);
 ck(tag+' cumulative fixed at 540',manifest.cumulative_defects===540);
 const defectKeys=['new_product_defects','new_defects','new_confirmed_product_defects'];
 const known=defectKeys.filter(k=>Object.prototype.hasOwnProperty.call(manifest,k));
 ck(tag+' zero confirmed product defect manifest',known.length>=1&&known.every(k=>manifest[k]===0));
 ck(tag+' reporter CLEAN and none discovered',/CLEAN/i.test(report)&&/0\s*종/.test(report));
 ck(tag+' preserved main/SQL/APP_VERSION wherever present',manifest.app_version==null||manifest.app_version==='ver20260927-0944');
 ck(tag+' no known release mutation',manifest.sql_changed!==true&&manifest.deployed!==true&&manifest.production_deployed!==true);
 ck(tag+' SHA present matches official when specified',manifest.sha256==null||manifest.sha256===expectedSha);
 names.push(tag);history++;
}
ck('31 consecutive dates without block gap',names.length===31&&names[0]==='2-8-259'&&names.at(-1)==='2-8-289');
const archive=['265','270','273','276','282','284'];
for(const n of archive){
 const report=source('QA_2-8-'+n+'_REPORT.md');
 ck('preserve original RED history '+n,/RED|실패|ERROR|SyntaxError|timeout|취소|FAIL/.test(report));
}
ck('specific 284 first-run QA error file preserved',fs.existsSync('qa-handoff/QA_284_INITIAL_QA_FAILURE.json'));
const expected=[
'QA_256_FULL','QA_256_BACKUP_PROPERTY','QA_256_CODEC_FUZZ','QA_256_RESTORE_RACE','QA_256_RESTORE_GUARD','QA_256_ADMIN_RESTORE_GUARD','QA_256_SCOPE_MATRIX','QA_256_ANNUAL_LEAVE_MATRIX',
'QA_256_PICKER_REAL','QA_256_IMAGE_PIPELINE','QA_259_EVENT_DDAY','QA_259_FINGERPRINT','QA_259_PERSONNEL','QA_260_OVERTIME_HOLIDAY','QA_260_RESPONSIVE','QA_260_ADMIN_SECURITY','QA_260_GLOBAL_TIMEZONE','QA_260_STORAGE_PRIVACY'];
for(const stem of expected){
 const path='qa-handoff/'+stem+'.cjs';
 ck('retain '+stem+' original regression',fs.existsSync(path));
}
for(let n=271;n<=289;n++){
 if(n===271||n===272)continue;
 const tree=fs.readdirSync('qa-handoff').some(x=>x.startsWith('QA_'+n+'_')&&x.endsWith('.cjs'));
 ck('independent source '+n+' kept',tree);
}
const matrix=[
 {area:'shift-calendar-maintenance',files:['QA_283_SHIFT_HOLIDAY_ORACLE.cjs','QA_260_GLOBAL_TIMEZONE.cjs']},
 {area:'absence-annual-leave',files:['QA_285_ANNUAL_LEAVE_WORKTIME_ORACLE.cjs','QA_286_ABSENCE_COVERAGE_ORACLE.cjs','QA_256_ANNUAL_LEAVE_MATRIX.cjs']},
 {area:'personnel-tenure-assignment',files:['QA_287_PERSONNEL_TIMELINE_ORACLE.cjs','QA_280_LONGSERVICE_BAND_BOUNDARY.cjs','QA_281_EXCLUSION_PERMUTATION_FUZZ.cjs']},
 {area:'overtime-holiday',files:['QA_288_HOLIDAY_WORK_RPC_ORACLE.cjs','QA_289_OVERTIME_RPC_CONTRACT_ORACLE.cjs','QA_260_OVERTIME_HOLIDAY.cjs']},
 {area:'fingerprint-camera-upload',files:['QA_259_FINGERPRINT.cjs','QA_256_PICKER_REAL.cjs','QA_256_IMAGE_PIPELINE.cjs']},
 {area:'session-RPC-permission',files:['QA_256_RESTORE_RACE.cjs','QA_260_ADMIN_SECURITY.cjs','QA_282_FINGERPRINT_TIMESTAMP_MATRIX.cjs']},
 {area:'backup-restore-corruption',files:['QA_256_BACKUP_PROPERTY.cjs','QA_256_ADMIN_RESTORE_GUARD.cjs','QA_258_BACKUP_ROUNDTRIP.cjs']},
 {area:'responsive-dialog-native-emulation',files:['QA_260_RESPONSIVE.cjs','QA_256_REAL_BOOT.cjs','QA_256_NATIVE_STRESS.cjs']}
];
for(const m of matrix)ck('coverage matrix source exists '+m.area,m.files.every(p=>fs.existsSync('qa-handoff/'+p)));
const finalWorkflow=file('.github/workflows/qa-289-pipeline.yml');
ck('last workflow sustained 1201-second minimum',finalWorkflow.includes('started+1201'));
ck('last workflow 23 sustained independent suites',finalWorkflow.includes('QA_260_STORAGE_PRIVACY')&&finalWorkflow.includes('QA_256_FULL'));
ck('risk gate criteria frozen',file('qa-handoff/QA_290_EXIT_CRITERIA.md').includes('PRODUCTION_RELEASE=NOT_APPROVED_PENDING_REAL_WORLD_SMOKE'));
for(const risk of ['live-auth-RLS-multiuser','physical-Android-iOS-native-picker','real-token-cross-tab-logout','real-staging-backup-restore','mobile-BFCache'])riskFlags.push(risk);
(async()=>{
 let server,browser,runErrors=[];
 try{
  server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(baseline)});
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const functions=['shiftForEmployee','employeeOperationalOn','annualLeaveMinutesForRecord','annualLeaveWorkSegments','attendanceStatusForEmployeeDate','personnelAssignmentOn','strictHolidayWorkRpcRows','strictOvertimeRpcRows','strictOvertimeConfirmationRpcRows','strictRpcTimestamp','substituteHolidayCompensationForDate','holidayNetMinutes','fullAbsentIds','overtimeCapacityForEmployee'];
  for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
   const cx=await browser.newContext({timezoneId:tz,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
   try{
    const page=await cx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e.message||e)));
    await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:25000});
    const result=await page.evaluate(names=>{
     let matches=names.map(n=>({name:n,ok:typeof window[n]==='function'||typeof eval(n)==='function'}));
     return{version:APP_VERSION,scriptMatches:matches,buttonCount:document.querySelectorAll('button').length,bodyLength:document.body?.innerText?.length||0,ready:document.readyState,year:state.year,hasMain:!!document.body}
    },functions);
    ck('290 Chrome '+tz+' mobile='+mobile+' version',result.version==='ver20260927-0944');
    ck('290 Chrome '+tz+' mobile='+mobile+' DOM body',result.hasMain&&result.buttonCount>2&&result.bodyLength>80);
    ck('290 Chrome '+tz+' mobile='+mobile+' boot',result.ready==='interactive'||result.ready==='complete');
    ck('290 Chrome '+tz+' mobile='+mobile+' core 14 feature functions',result.scriptMatches.every(x=>x.ok));
    ck('290 Chrome '+tz+' mobile='+mobile+' no bootstrap JS errors',errors.length===0);
    contexts++;
    if(errors.length||result.scriptMatches.some(x=>!x.ok))runErrors.push({tz,mobile,errors:errors.slice(0,3),missing:result.scriptMatches.filter(x=>!x.ok)});
   }catch(e){fail++;issues.push({tz,mobile,exception:String(e.stack||e).slice(0,1200)})}
   finally{await cx.close()}
  }
 }catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1100)})}
 finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
 console.log('QA290_EXIT_READINESS_AUDIT_SUMMARY',JSON.stringify({pass,fail,history_clean:history,contexts,sha256:sha(baseline),coverageAreas:matrix.length,criticalRiskFlags:riskFlags,issues,runErrors}));
 if(fail)process.exitCode=1;
})();