'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto');
const {chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-259.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(sha!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('QA259 source identity mismatch');
(async()=>{let server,browser,pass=0,fail=0,issues=[];
try{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const cx=await browser.newContext({viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
  const p=await cx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const result=await p.evaluate(()=>{
    let ok=0,bad=0,samples=[];
    const check=(label,yes,value)=>{if(yes)ok++;else{bad++;if(samples.length<8)samples.push({label,value})}};
    const base={id:3,start_date:'2026-10-15',end_date:'2027-01-04',memo_text:'정기점검',created_by:1,updated_at:'2026-10-15T09:00:00+09:00'};
    const testEvent=(r,opt={})=>{try{return strictCompanyEventRpcRows([r],opt).length===1}catch(_){return false}};
    check('valid event',testEvent(base));
    // PostgreSQL bigint fields can legally arrive as decimal strings: strictRpcInteger preserves compatibility.
    check('numeric-string ID accepted',testEvent({...base,id:'3'}));
    check('numeric-string creator accepted',testEvent({...base,created_by:'1'}));
    const cases=[
      ['id-zero',r=>r.id=0],['id-float',r=>r.id=3.2],
      ['invalid-start',r=>r.start_date='2026-02-30'],['invalid-end',r=>r.end_date='2027-02-30'],
      ['reversed',r=>r.end_date='2026-10-01'],['non-string-start',r=>r.start_date=20261015],
      ['non-string-end',r=>r.end_date=20270104],['note-empty',r=>r.memo_text=''],
      ['note-whitespace',r=>r.memo_text='  '],['note-not-string',r=>r.memo_text=4],
      ['note-too-long',r=>r.memo_text='x'.repeat(1001)],
      ['no-creator',r=>delete r.created_by],
      ['creator-zero',r=>r.created_by=0],['timestamp-null',r=>r.updated_at=null],
      ['timestamp-invalid',r=>r.updated_at='2026-02-30T00:00:00Z'],
      ['timestamp-offset',r=>r.updated_at='2026-10-15T00:00:00+15:00'],
    ];
    for(let rep=0;rep<48;rep++)for(const [name,mutator] of cases){
      const v=structuredClone(base);mutator(v);v.id=rep+1;if(name==='id-string')v.id=String(rep+1);if(name==='id-zero')v.id=0;if(name==='id-float')v.id=3.2;
      check(name+':'+rep,!testEvent(v));
    }
    check('invalid range from',!testEvent(base,{from:'2027-01-05'}));
    check('invalid range to',!testEvent(base,{to:'2026-10-14'}));
    check('valid range intersect',testEvent(base,{from:'2027-01-03',to:'2027-01-05'}));
    check('duplicate id',(()=>{try{strictCompanyEventRpcRows([base,base]);return false}catch(_){return true}})());
    const dday={memo_date:'2026-10-15',memo_text:'QA DDAY',selected_at:'2026-10-14T09:00:00Z',updated_at:'2026-10-15T09:00:00Z'};
    const testDday=r=>{try{return strictMemoDdayRpcRows([r]).length===1}catch(_){return false}};
    check('valid dday',testDday(dday));
    const invalid=[
     ['invalid-date',r=>r.memo_date='2026-02-30'],['date-number',r=>r.memo_date=20261015],
     ['note-empty',r=>r.memo_text=''],['note-space',r=>r.memo_text='   '],
     ['note-large',r=>r.memo_text='x'.repeat(1001)],['note-array',r=>r.memo_text=[]],
     ['selected-null',r=>r.selected_at=null],['selected-time',r=>r.selected_at='tomorrow'],
     ['updated-null',r=>r.updated_at=null],['updated-bad',r=>r.updated_at='2026-13-01T10:00:00Z'],
    ];
    for(let rep=0;rep<80;rep++)for(const [name,mutator] of invalid){
      const item=structuredClone(dday);item.memo_date='2026-10-'+String(1+rep%28).padStart(2,'0');mutator(item);
      check('dday:'+name+':'+rep,!testDday(item));
    }
    check('duplicate dday',(()=>{try{strictMemoDdayRpcRows([dday,dday]);return false}catch(_){return true}})());
    // Markup integrity at unusual mobile viewport and untrusted content.
    const raw='<img src=x onerror=alert(1)> 기념일 👀 漢字 & "quote"';
    state.companyEvents=[{...base,memo_text:raw}];state.companyEventBackendReady=true;
    renderCompanyEventsList();
    check('render escapes full XSS payload',!$('companyEventsBody').querySelector('img,script,iframe,svg')&&$('companyEventsBody').textContent.includes(raw));
    return {ok,bad,samples};
  });
  pass+=result.ok;fail+=result.bad+errors.length;issues.push({device:mobile?'mobile':'desktop',ok:result.ok,bad:result.bad,samples:result.samples,errors:errors.slice(0,3)});
  await cx.close();
 }
}catch(e){fail++;issues.push({harnessError:String(e.stack||e)})}
finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r))}
console.log('QA259_EVENT_DDAY_SUMMARY',JSON.stringify({passed:pass,failed:fail,devices:issues,sha}));
if(fail)process.exitCode=1;
})();