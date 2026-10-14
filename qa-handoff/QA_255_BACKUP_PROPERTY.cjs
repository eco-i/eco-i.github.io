'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.working-2-8-255.html','utf8');const sha=crypto.createHash('sha256').update(html).digest('hex');if(sha!=='b29f97d10cd2231ce45ef1aed0c6915f3466ecae30217d6835a42e27b24d65a2')throw Error('255 candidate SHA mismatch');
(async()=>{let srv,browser,pass=0,fail=0;try{srv=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)});await new Promise(r=>srv.listen(0,'127.0.0.1',r));browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mobile of [false,true]){
 const ctx=await browser.newContext({viewport:{width:mobile?400:1180,height:mobile?850:900},isMobile:mobile,...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125 Mobile Safari/537.36'}:{})}),p=await ctx.newPage();await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'});
 const ret=await p.evaluate(()=>{
  const failures=[],check=(cond,what)=>{if(!cond&&failures.length<25)failures.push(what)};let n=0;
  for(const scope of ['personal','admin']){const allowed=scope==='personal'?MY_DATA_SECTION_KEYS:ADMIN_DATA_SECTION_KEYS;for(let i=1;i<=256;i++){
   const selected=allowed.filter((_,j)=>(((i+13*j+Math.floor(j/3))%(j+2))===0)||(i>>j&1));if(!selected.length)selected.push(allowed[i%allowed.length]);
   const data=Object.fromEntries(selected.map((key,j)=>[key,[{id:j+1,note:'테스트 🗓️ '+i}]]));
   const obj={format:'workmoa-data-backup',backup_schema_version:1,backup_type:scope,included_sections:selected,data};
   const parsed=()=>parseDataBackupText(JSON.stringify(obj),scope),bad=q=>{try{parseDataBackupText(JSON.stringify(q),scope);return false}catch(_){return true}};
   try{let ans=parsed();check(ans.included_sections.length===selected.length&&Object.keys(ans.data).length===selected.length,'valid '+scope+' '+i)}catch(e){check(false,'valid failed '+scope+' '+i+' '+e.message)}n++;
   const duplicate={...obj,included_sections:[...selected,selected[0]]};check(bad(duplicate),'duplicate '+scope+' '+i);n++;
   const extraData={...obj,data:{...data,unexpected_key:[]}};check(bad(extraData),'extradata '+scope+' '+i);n++;
   const noData={...obj,data:{...data}};delete noData.data[selected[0]];check(bad(noData),'noData '+scope+' '+i);n++;
   const incorrectType={...obj,data:[]};check(bad(incorrectType),'arrayData '+scope+' '+i);n++;
   const foreign={...obj,backup_type:scope==='admin'?'personal':'admin'};check(bad(foreign),'foreign '+scope+' '+i);n++;
  }}
  return {checks:n,failures};
 });
 const ok=ret.failures.length===0;console.log('QA255_BACKUP_MATRIX_'+(ok?'PASS':'FAIL'),mobile?'mobile':'desktop',JSON.stringify({checks:ret.checks,failures:ret.failures.slice(0,10)}));pass+=ok?ret.checks:ret.checks-ret.failures.length;fail+=ret.failures.length;await ctx.close();
 }
}catch(e){fail++;console.log('QA255_BACKUP_MATRIX_HARNESS_ERROR',String(e.stack||e))}
finally{if(browser)await browser.close();if(srv)await new Promise(r=>srv.close(r))}console.log('QA255_BACKUP_MATRIX_SUMMARY',JSON.stringify({pass,fail,sha}));if(fail)process.exitCode=1;
})();