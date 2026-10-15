'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-258.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9')throw Error('QA258 baseline mismatch');
(async()=>{let server,browser,pass=0,fail=0;
const ck=(name,test,details)=>{(test?pass++:fail++);if(!test)console.log('QA258_ROUNDTRIP_FAIL',name,JSON.stringify(details).slice(0,1000));};
try{
 server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
 await new Promise(res=>server.listen(0,'127.0.0.1',res));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const ctx=await browser.newContext({viewport:{width:mobile?390:1200,height:mobile?844:850},isMobile:mobile,acceptDownloads:true,hasTouch:mobile});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  for(const scope of ['personal','admin']){
   const expected=await page.evaluate(scope=>{
    const keys=scope==='personal'?['attendance','personal_memos']:['company_events','personnel'];
    const note='한글 한자 漢字 이모지 ✅ 📷 <script>alert("bad")</script>\n 여러 줄';
    const payload={format:'workmoa-data-backup',backup_schema_version:1,backup_type:scope,
      site_instance_id:'11111111-2222-4333-8444-555555555555',app_version:APP_VERSION,
      exported_at:'2026-10-15T02:00:00.000Z',payload_sha256:'a'.repeat(64),
      included_sections:keys,section_counts:Object.fromEntries(keys.map(k=>[k,1])),
      data:Object.fromEntries(keys.map((k,i)=>[k,[{id:i+1,note,subtype:k}]])),
      created_by:{employee_id:77,display_name:'QA 홍길동'}};
    strictDataExportRpc(payload,scope,keys);
    return payload;
   },scope);
   const wait=page.waitForEvent('download',{timeout:15000});
   const fn=await page.evaluate(({payload,scope})=>downloadDataBackup(payload,scope),{payload:expected,scope});
   const dl=await wait;
   const downloaded=fs.readFileSync(await dl.path(),'utf8');
   let parsed;try{parsed=JSON.parse(downloaded)}catch(e){fail++;console.log('QA258_ROUNDTRIP_JSON_FAIL',String(e));continue;}
   ck('download-name-correct-'+scope,fn===dl.suggestedFilename()&&fn.endsWith('.json'),{fn,actual:dl.suggestedFilename()});
   ck('download-shape-preserved-'+scope,JSON.stringify(parsed)===JSON.stringify(expected),{scope,size:downloaded.length});
   const readback=await page.evaluate(({raw,scope})=>{
     try{const p=parseDataBackupText(raw,scope);return {ok:true,sections:p.included_sections,payload:p}}catch(e){return {ok:false,error:String(e.message)}}
   },{raw:downloaded,scope});
   ck('parsing-export-roundtrip-'+scope,readback.ok&&JSON.stringify(readback.payload)===JSON.stringify(expected),readback.error);
   ck('unicode-not-corrupted-'+scope,downloaded.includes('漢字')&&downloaded.includes('✅')&&downloaded.includes('홍길동'));
   ck('backend-fingerprint-stable-'+scope,downloaded.includes('"payload_sha256": "'));
  }
  ck('runtime-clean-'+(mobile?'mobile':'desktop'),errors.length===0,errors);
  await ctx.close();
 }
}catch(e){fail++;console.log('QA258_ROUNDTRIP_HARNESS_ERROR',String(e.stack||e))}
finally{if(browser)await browser.close();if(server)await new Promise(done=>server.close(done))}
console.log('QA258_ROUNDTRIP_SUMMARY',JSON.stringify({passed:pass,failed:fail,sha}));if(fail)process.exitCode=1;
})();
