'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-276.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('276 immutable official baseline SHA mismatch');
(async()=>{
 let server,browser,pass=0,fail=0,contexts=0,issues=[];
 try{
  server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});r.end(html)});
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const zone of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
   const cx=await browser.newContext({timezoneId:zone,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
   try{
    const page=await cx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
    await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:20000});
    const result=await page.evaluate(async()=>{
      let pass=0,fail=0,issues=[];const ck=(name,yes)=>{if(yes)pass++;else{fail++;if(issues.length<28)issues.push(name)}};
      const ids=BACKDROP_SENSITIVE_INPUT_IDS,backdrops=Object.keys(ids),all=Object.values(ids).flat(),tick=()=>new Promise(resolve=>setTimeout(resolve,30));
      ck('five pinned sensitive modal groups',backdrops.length===5);
      ck('nine sensitive input ids in all groups',all.length===9);
      ck('no duplicate sensitive input map ids',new Set(all).size===all.length);
      ck('all mapped PIN DOM inputs exist',all.every(id=>!!document.getElementById(id)));
      ck('all mapped inputs passwords',all.every(id=>document.getElementById(id)?.type==='password'));
      const set=(value)=>all.forEach(id=>{const el=document.getElementById(id);if(el)el.value=value+'-'+id});
      const clear=()=>all.forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
      const fullClean=()=>all.every(id=>!document.getElementById(id)?.value);
      const png='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
      try{
       for(const b of backdrops){
        for(const mode of ['normal','reopen']){
         closeAll();clear();set('qa276-secure');
         const inputs=ids[b];
         const inputBefore=inputs.map(id=>document.getElementById(id)?.value);
         const returnValue=closeBackdrop(b,true);
         ck(b+' '+mode+' close returns success',returnValue===true);
         ck(b+' '+mode+' PIN values scrubbed immediately',inputs.every(id=>document.getElementById(id)?.value===''));
         ck(b+' '+mode+' PINs had populated before scrub',inputBefore.every(v=>v?.startsWith('qa276-secure')));
         ck(b+' '+mode+' unrelated secret inputs preserved until their own closure',all.filter(id=>!inputs.includes(id)).every(id=>!!document.getElementById(id)?.value));
         ck(b+' '+mode+' aria hidden',document.getElementById(b)?.getAttribute('aria-hidden')==='true');
         clear();
         openBackdrop(b);
         ck(b+' '+mode+' open marker',document.getElementById(b)?.classList.contains('open'));
         ck(b+' '+mode+' open aria visible',document.getElementById(b)?.getAttribute('aria-hidden')==='false');
         set('qa276-close');
         closeBackdrop(b,true);
         ck(b+' '+mode+' close mark removed',!document.getElementById(b)?.classList.contains('open'));
         ck(b+' '+mode+' close sensitive scrubbing',inputs.every(id=>document.getElementById(id)?.value===''));
         await tick();
        }
       }
       for(const preserve of [false,true]){
        closeAll();clear();set('bfcache');
        clearSensitiveInputValues({preserveDataRestorePin:preserve});
        ck('BFCache cleanup preserve='+preserve+' only optional admin PIN',all.filter(id=>!preserve||id!=='adminDataPin').every(id=>!document.getElementById(id)?.value));
        ck('BFCache cleanup preserve='+preserve+' expected admin PIN',preserve?document.getElementById('adminDataPin')?.value.startsWith('bfcache'):document.getElementById('adminDataPin')?.value==='');
       }
       const otherPassword=[...document.querySelectorAll('input[type="password"]')].filter(x=>!all.includes(x.id));
       for(const v of otherPassword)v.value='qa276-bfcache-other';
       clearSensitiveInputValues();
       ck('BFCache all password fields removed',Array.from(document.querySelectorAll('input[type="password"]')).every(x=>x.value===''));
       ck('BFCache covers unmapped password fields',otherPassword.every(x=>x.value===''));
       for(let round=1;round<=12;round++){
        closeAll();clear();
        for(const b of backdrops)openBackdrop(b);
        ck('stack top should be last opened '+round,topOpenBackdrop()?.id===backdrops.at(-1));
        ck('stack only top aria visible '+round,[...document.querySelectorAll('.backdrop.open')].every(b=>b.getAttribute('aria-hidden')===(b.id===backdrops.at(-1)?'false':'true')));
        set('stack-round'+round);
        const viewer=document.getElementById('fingerprintPhotoBackdrop'),img=document.getElementById('fingerprintViewerImg');
        openBackdrop('fingerprintPhotoBackdrop');
        fingerprintViewerContext={employeeId:276,key:'2026-10-16',kind:'clock_in',uploadedAt:'2026-10-16T12:00:00Z'};
        img.src=png;document.getElementById('fingerprintPhotoTitle').textContent='PRIVATE FILE NAME';
        document.getElementById('fingerprintViewerMeta').textContent='PRIVATE META';
        ck('stack viewer opened '+round,viewer.classList.contains('open')&&!!img.getAttribute('src'));
        ck('viewer now top '+round,topOpenBackdrop()?.id==='fingerprintPhotoBackdrop');
        closeAll();
        ck('stack closeAll removes all backdrops '+round,document.querySelectorAll('.backdrop.open').length===0);
        ck('stack closeAll scrubs all PINs '+round,fullClean());
        ck('stack closeAll clears image source '+round,!img.hasAttribute('src'));
        ck('stack closeAll clears photo viewer owner '+round,fingerprintViewerContext===null);
        ck('stack closeAll clears photo title/meta '+round,document.getElementById('fingerprintPhotoTitle').textContent==='지문 기록 사진'&&document.getElementById('fingerprintViewerMeta').textContent==='');
        ck('stack closeAll drops modal body lock '+round,!document.body.classList.contains('modal-open'));
        await tick();
       }
      }finally{closeAll();clearSensitiveInputValues();}
      return {pass,fail,issues,passwordFields:document.querySelectorAll('input[type="password"]').length};
    });
    pass+=result.pass;fail+=result.fail+errors.length;contexts++;
    if(result.fail||errors.length)issues.push({zone,mobile,details:result.issues,errors:errors.slice(0,3)});
   }catch(e){fail++;issues.push({zone,mobile,error:String(e.stack||e).slice(0,1700)})}finally{await cx.close()}
  }
 }catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1700)})}
 finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
 console.log('QA276_MODAL_PRIVACY_FOCUS_SUMMARY',JSON.stringify({pass,fail,contexts,sha256:sha,issues}));
 if(fail)process.exitCode=1;
})();
