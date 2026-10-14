'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.working-2-8-255.html','utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='056afefb42ca1876b417e22f7bdfe184eb41f467768030016ab3c101f42b2b5b')throw Error('255 immutable candidate changed');
(async()=>{let server,browser,pass=0,fail=0;const check=(name,ok,info)=>{(ok?pass++:fail++);console.log('QA255_SCHEMA_'+(ok?'PASS':'FAIL'),name,JSON.stringify(info||{}))};
try{server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
for(const mobile of [false,true]){const ctx=await browser.newContext({viewport:{width:mobile?390:1200,height:mobile?850:900},isMobile:mobile,...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125 Mobile Safari/537.36'}:{})});const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
const result=await p.evaluate(()=>{
const sections=['attendance','holiday_work'],key='1234567890abcdef1234567890abcdef',ts='2026-10-14T10:25:30+09:00';const base=()=>({format:'workmoa-data-backup',backup_schema_version:1,backup_type:'personal',included_sections:sections, data:{attendance:[],holiday_work:[]}});
const test=(fn)=>{try{return {ok:true,value:fn()}}catch(e){return {ok:false,error:String(e.message||e)}}};
const candidates=[
 ['good_personal',base(),true],['bad_format',{...base(),format:'not-backup'},false],['wrong_scope',{...base(),backup_type:'admin'},false],['future_version',{...base(),backup_schema_version:999},false],['old_version',{...base(),backup_schema_version:0},false],['missing_section',{...base(),included_sections:null},false],['missing_data',{...base(),data:null},false],['array_data',{...base(),data:[]},false],['duplicate_sections',{...base(),included_sections:['attendance','attendance']},false],['unexpected_section',{...base(),included_sections:['attendance','hidden']},false]];
const parse=candidates.map(([name,payload,expected])=>({name,expected,result:test(()=>parseDataBackupText(JSON.stringify(payload),'personal'))}));
const validExport={...base(),site_instance_id:'12345678-1234-1234-1234-123456789012',app_version:'ver20260927-0944',exported_at:ts,payload_sha256:'a'.repeat(64),section_counts:{attendance:0,holiday_work:0},created_by:{employee_id:1,display_name:'Inspector'}};
const change=(f)=>{const x=structuredClone(validExport);f(x);return x};
const exportCases=[
 ['good_export',validExport,true],['wrong_uuid',change(x=>x.site_instance_id='bad'),false],['invalid_export_time',change(x=>x.exported_at='2026-02-30T00:00:00Z'),false],['wrong_sha256',change(x=>x.payload_sha256='x'.repeat(64)),false],['bad_section_count',change(x=>x.section_counts.attendance=-1),false],['float_count',change(x=>x.section_counts.attendance=1.25),false],['missing_data',change(x=>delete x.data.attendance),false],['extra_data',change(x=>x.data.hidden=[]),false],['invalid_created_by',change(x=>x.created_by.employee_id=0),false],['duplicate_sections',change(x=>x.included_sections=['attendance','attendance']),false],['different_sections_order',change(x=>x.included_sections.reverse()),false],['wrong_scope',change(x=>x.backup_type='admin'),false]
 ];
const exported=exportCases.map(([name,v,expected])=>({name,expected,result:test(()=>strictDataExportRpc(v,'personal',sections))}));
const basePreview=()=>({backup_type:'personal',exported_at:ts,sections:{attendance:{backup_count:0,current_count:1,change_estimate:1},holiday_work:{backup_count:2,current_count:4,change_estimate:2}},current_revision:key});
const previews=[
 ['good_preview',basePreview(),true],['bad_revision',{...basePreview(),current_revision:'x'},false],['malformed_time',{...basePreview(),exported_at:'2026-13-01T00:00:00Z'},false],['negative_change',{...basePreview(),sections:{...basePreview().sections,attendance:{backup_count:0,current_count:1,change_estimate:-1}}},false],['missing_section',{...basePreview(),sections:{attendance:{backup_count:0,current_count:1,change_estimate:0}}},false],['wrong_backup_type',{...basePreview(),backup_type:'admin'},false]
];const preview=previews.map(([name,v,expected])=>({name,expected,result:test(()=>strictDataRestorePreviewRpc(v,'personal',sections))}));
const mutation0={restored:true,section_counts:{attendance:0,holiday_work:1}};const mutation=[
 ['restore_correct',mutation0,true],['restore_false',{...mutation0,restored:false},false],['bad_counts',{...mutation0,section_counts:{attendance:-1,holiday_work:1}},false],['wrong_safety_backup_id',{...mutation0,safety_backup_id:0},false]
].map(([name,v,expected])=>({name,expected,result:test(()=>strictDataMutationResultRpc(v,'restore',sections,{safetyBackup:name==='wrong_safety_backup_id'}))}));
return {parse,exported,preview,mutation,sections,limit:DATA_BACKUP_MAX_BYTES};
});
for(const group of ['parse','exported','preview','mutation'])for(const c of result[group])check((mobile?'mobile':'desktop')+':'+group+':'+c.name,c.expected===c.result.ok,{expected:c.expected,got:c.result.ok,error:c.result.error});
check((mobile?'mobile':'desktop')+':backup-size-limit-15MB',result.limit===15*1024*1024);
check((mobile?'mobile':'desktop')+':no-page-errors',errors.length===0,{errors});await ctx.close();
}
}catch(e){fail++;console.log('QA255_SCHEMA_HARNESS_ERROR',String(e.stack||e))}finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}console.log('QA255_SCHEMA_SUMMARY',JSON.stringify({passed:pass,failed:fail,sha}));if(fail)process.exitCode=1;
})();
