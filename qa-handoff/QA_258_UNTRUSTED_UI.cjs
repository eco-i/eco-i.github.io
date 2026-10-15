'use strict';
const fs=require('fs'),crypto=require('crypto'),http=require('http');
const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-258.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9')throw Error('QA258 starting SHA changed');
(async()=>{
let browser,server,passed=0,failed=0;
try{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const ctx=await browser.newContext({viewport:{width:mobile?390:1280,height:mobile?844:860},isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage(),pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(()=>{
   const values=[
    '<img src=x onerror=window.__qa258Probe=99>',
    '<svg onload=window.__qa258Probe=99></svg>',
    '</b><iframe src=javascript:alert(1)></iframe>',
    '<script>window.__qa258Probe=99</script>',
    '" onmouseover="window.__qa258Probe=99',
    "'><img src=x onerror=window.__qa258Probe=99>",
    '<style>body{visibility:hidden}</style>',
    '<input autofocus onfocus=window.__qa258Probe=99>',
    '\u003ciframe srcdoc="hello"\u003e'
   ];
   window.__qa258Probe=0;
   let pass=0,fail=0,failed=[],details=[];
   const check=(tag,yes,data)=>{(yes?pass++:fail++);if(!yes)failed.push({tag,data});};
   const attackSelector='img,svg,iframe,script,style,input[autofocus]';
   for(const val of values){
    const base={backup_type:'personal',exported_at:'2026-10-15T01:02:03.000Z',app_version:val,created_by:{employee_id:1,display_name:val},current_revision:'123456789abcdef0123456789abcdef0',sections:{attendance:{backup_count:0,current_count:0,change_estimate:0}}};
    state.me={employee_id:1,display_name:val,is_admin:false,is_read_only:false};
    const backup=$('myDataRestorePreview');
    renderRestorePreview('myDataRestorePreview',base,['attendance'],val);
    check('restore-display-and-filename-escaped',!backup.querySelector(attackSelector)&&backup.textContent.includes(val),{input:val.slice(0,60),html:backup.innerHTML.slice(0,240)});
    state.companyEvents=[{id:1,start_date:'2027-08-15',end_date:'2027-08-16',memo_text:val,created_by:1,updated_at:'2026-10-15T01:02:03Z'}];
    state.companyEventBackendReady=true;
    renderCompanyEventsBanner();renderCompanyEventsList();
    const section=$('companyEventsBody'),banner=$('companyEventsBannerPreview');
    check('company-event-content-sanitized',!section.querySelector(attackSelector)&&section.textContent.includes(val),{input:val.slice(0,60),html:section.innerHTML.slice(0,200)});
    check('company-event-banner-text',banner.textContent.includes(val.replace(/\s+/g,' ').trim().slice(0,40)),{text:banner.textContent});
    const emp={id:99,display_name:val,category:'B조',group_code:'B'};
    const roster=document.createElement('div');roster.innerHTML=renderAbsentEmployeeRows([{emp,status:{rows:[]}}],'2026-10-15');
    check('roster-employee-markup-escaped',!roster.querySelector(attackSelector)&&roster.textContent.includes(val),{html:roster.innerHTML.slice(0,200)});
    const normalized=strictCompanyEventRpcRows([{id:1,start_date:'2027-08-15',end_date:'2027-08-16',memo_text:val,created_by:1,updated_at:'2026-10-15T01:02:03Z'}]);
    check('valid-text-pass-contract',normalized.length===1&&normalized[0].memo_text===val);
   }
   check('no-injected-JS',window.__qa258Probe===0,window.__qa258Probe);
   return {pass,fail,failed:failed.slice(0,10)};
  });
  passed+=out.pass;failed+=out.fail;
  if(pageErrors.length){failed+=pageErrors.length;console.log('QA258_SECURITY_PAGE_ERRORS',JSON.stringify(pageErrors.slice(0,3)))}
  console.log('QA258_SECURITY_DEVICE',mobile?'mobile':'desktop',JSON.stringify({passed:out.pass,failed:out.fail,failures:out.failed}));
  await ctx.close();
 }
}catch(e){failed++;console.log('QA258_SECURITY_HARNESS_ERROR',String(e.stack||e));}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}
console.log('QA258_SECURITY_SUMMARY',JSON.stringify({passed,failed,sha}));if(failed)process.exitCode=1;
})();
