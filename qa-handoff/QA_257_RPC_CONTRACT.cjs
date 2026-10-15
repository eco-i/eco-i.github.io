'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');
const {chromium}=require('playwright-core');
const path='qa-handoff/index.before-2-8-257.html';
const html=fs.readFileSync(path,'utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='fabf9ebc53cfe57d4533a53013b26692179f5c1ad5105c0351fbb881342176a9')throw Error('baseline changed');
(async()=>{let browser,server,pass=0,fail=0;try{
server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mobile of [false,true]){
const ctx=await browser.newContext({viewport:{width:mobile?390:1200,height:mobile?840:900},isMobile:mobile});
const p=await ctx.newPage(),pageErrors=[];p.on('pageerror',e=>pageErrors.push(e.message));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());
await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
const ans=await p.evaluate(()=>{
const errors=[],checks=[];const check=(n,ok)=>{checks.push(n);if(!ok)errors.push(n)};
const uuid='11111111-1111-4111-8111-111111111111',rev='abcdef0123456789abcdef0123456789',sha='a'.repeat(64);
for(const scope of ['personal','admin']){
const sections=[(scope==='personal'?MY_DATA_SECTION_KEYS:ADMIN_DATA_SECTION_KEYS)[0]];
const base={format:'workmoa-data-backup',backup_schema_version:1,backup_type:scope,site_instance_id:uuid,app_version:'ver20260927-0944',exported_at:'2026-10-15T01:02:03.000Z',payload_sha256:sha,section_counts:{[sections[0]]:0},data:{[sections[0]]:[]},included_sections:sections,created_by:{employee_id:50,display_name:'관리자'}};
const ex=x=>{try{strictDataExportRpc(x,scope,sections);return true}catch(_){return false}};
check(scope+':valid-export',ex(base));
const invalid=[
['format',x=>x.format='bad'],['schema-string',x=>x.backup_schema_version='1'],['schema-array',x=>x.backup_schema_version=[1]],['scope',x=>x.backup_type=scope==='admin'?'personal':'admin'],['uuid',x=>x.site_instance_id='invalid'],
['uuid-type',x=>x.site_instance_id=1],['timestamp',x=>x.exported_at='2026-02-30T01:02:03Z'],['timestamp-type',x=>x.exported_at=null],['sha',x=>x.payload_sha256='bad'],
['counts-null',x=>x.section_counts=null],['counts-float',x=>x.section_counts[sections[0]]=1.5],['counts-string',x=>x.section_counts[sections[0]]='0'],
['counts-negative',x=>x.section_counts[sections[0]]=-1],['counts-overflow',x=>x.section_counts[sections[0]]=Number.MAX_SAFE_INTEGER+1],
['counts-extra',x=>x.section_counts.extra=2],['data-extra',x=>x.data.extra=[]],['data-missing',x=>delete x.data[sections[0]]],
['data-array',x=>x.data=[]],['sections-dupe',x=>x.included_sections=[sections[0],sections[0]]],['sections-empty',x=>x.included_sections=[]],
['creator-null',x=>x.created_by=null],['creator-id-string',x=>x.created_by.employee_id='50'],['creator-id-neg',x=>x.created_by.employee_id=-1],
['creator-name-null',x=>x.created_by.display_name=null],['app-version-number',x=>x.app_version=123]
];
for(const [name,mutate] of invalid){const obj=structuredClone(base);mutate(obj);check(scope+':reject-export-'+name,!ex(obj))}
const preview={backup_type:scope,exported_at:'2026-10-15T01:02:03.000Z',app_version:'ver20260927-0944',created_by:{employee_id:50,display_name:'관리자'},sections:{[sections[0]]:{backup_count:0,current_count:10,change_estimate:1}},current_revision:rev};
const pr=x=>{try{strictDataRestorePreviewRpc(x,scope,sections);return true}catch(_){return false}};
check(scope+':valid-preview',pr(preview));
const badPreview=[
['wrong-scope',x=>x.backup_type='other'],['date-type',x=>x.exported_at=123],['date-invalid',x=>x.exported_at='2026-02-30T01:02:03Z'],
['app-version-object',x=>x.app_version={}],['created-id-string',x=>x.created_by.employee_id='50'],['created-id-zero',x=>x.created_by.employee_id=0],
['created-name-object',x=>x.created_by.display_name={}],['sections-null',x=>x.sections=null],['sections-array',x=>x.sections=[]],
['sections-extra',x=>x.sections.extra={}],['sections-missing',x=>delete x.sections[sections[0]]],['row-null',x=>x.sections[sections[0]]=null],
['backup-count-string',x=>x.sections[sections[0]].backup_count='0'],['backup-count-negative',x=>x.sections[sections[0]].backup_count=-1],
['current-count-overflow',x=>x.sections[sections[0]].current_count=Number.MAX_SAFE_INTEGER+1],
['estimate-float',x=>x.sections[sections[0]].change_estimate=1.2],['revision-wrong-type',x=>x.current_revision=4],
['revision-short',x=>x.current_revision='abc'],['revision-long',x=>x.current_revision=rev+'a']
];
for(const [name,mutate] of badPreview){const obj=structuredClone(preview);mutate(obj);check(scope+':reject-preview-'+name,!pr(obj))}
}
return {count:checks.length,errors};
});
pass+=ans.count-ans.errors.length;fail+=ans.errors.length;
console.log('QA257_RPC_DEVICE',mobile?'mobile':'desktop',JSON.stringify({count:ans.count,failures:ans.errors.slice(0,15),pageErrors}));
if(pageErrors.length){fail+=pageErrors.length;console.log('QA257_RPC_PAGE_ERROR',JSON.stringify(pageErrors))}
await ctx.close();
}
}catch(e){fail++;console.log('QA257_RPC_HARNESS_ERROR',String(e.stack||e))}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA257_RPC_CONTRACT_SUMMARY',JSON.stringify({passed:pass,failed:fail,sha}));if(fail)process.exitCode=1;
})();
