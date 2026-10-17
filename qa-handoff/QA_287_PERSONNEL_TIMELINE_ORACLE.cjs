'use strict';
const fs=require('fs'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright-core');
const html=fs.readFileSync('qa-handoff/index.before-2-8-287.html','utf8');
const hash=crypto.createHash('sha256').update(html).digest('hex');
if(hash!=='19ac9dea9a31e976018232fd7731f12c032318db435e110fe520a475248e18af')throw Error('287 immutable baseline SHA mismatch');
(async()=>{
 let browser,server,pass=0,fail=0,contexts=0,cases=0,issues=[];
 try{
  server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html)});
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const tz of ['Asia/Seoul','UTC','America/Los_Angeles'])for(const mobile of [false,true]){
   const cx=await browser.newContext({timezoneId:tz,viewport:{width:mobile?390:1280,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
   try{
    const p=await cx.newPage(),pageErrors=[];
    p.on('pageerror',e=>pageErrors.push(String(e.message||e)));
    await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());
    await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:25000});
    const result=await p.evaluate(()=>{
     let pass=0,fail=0,cases=0,issues=[],rankChoices=0;
     const ck=(name,ok)=>{if(ok)pass++;else{fail++;if(issues.length<40)issues.push(name)}};
     const ms=86400000,base=Date.UTC(2026,0,1),groups=['A','B','C','D'],placements=['A','B','C','D','DAY_FIELD','DAY_OFFICE','LEADER','NONE'];
     const statuses=['working','working','leave','transferred','retired','unassigned'];
     const iso=t=>new Date(t).toISOString().slice(0,10);
     const expected=(rows,key,exclude='')=>rows.filter(r=>r.employee_id===287&&r.batch_status==='active'&&r.effective_date<=key&&(!exclude||r.batch_id!==exclude)).sort((a,b)=>b.effective_date.localeCompare(a.effective_date)||b.batch_created_at.localeCompare(a.batch_created_at)||b.action_id-a.action_id)[0]||null;
     const future=(rows,key)=>rows.filter(r=>r.employee_id===287&&r.batch_status==='active'&&r.effective_date>key).sort((a,b)=>a.effective_date.localeCompare(b.effective_date)||a.action_id-b.action_id)[0]||null;
     const expectedGroup=r=>r?(['A','B','C','D'].includes(r.placement_code)?r.placement_code:['LEADER','DAY_OFFICE','DAY_FIELD'].includes(r.placement_code)?'DAY':'NONE'):null;
     const prev={me:state.me,employees:state.employees,personnelAssignments:state.personnelAssignments,personnelBackendReady:state.personnelBackendReady};
     try{
      state.personnelBackendReady=true;
      const emp={id:287,display_name:'QA-287-personnel',group_code:'B',category:'B조',active_from:'2026-01-01',active_to:null,sort_order:287,personnel_account_status:'active'};
      state.employees=[emp];state.me={employee_id:287,is_admin:false};
      ck('APP_VERSION retained',APP_VERSION==='ver20260927-0944');
      for(let i=0;i<730;i++){
       const t=base+i*ms,date=iso(t),before=iso(t-ms),early=iso(t-7*ms),after=iso(t+ms),far=iso(t+3*ms);
       for(let g=0;g<4;g++)for(let mode=0;mode<6;mode++){
        const selected=placements[(i+g+mode)%placements.length],nextCode=placements[(i+g+mode+3)%placements.length];
        const status=statuses[(i+mode+2*g)%statuses.length];
        const make=(id,who,eff,batch,created,action,code,employment,batchStatus='active',sort=0)=>({id,employee_id:who,effective_date:eff,batch_id:batch,batch_created_at:created,action_id:action,placement_code:code,employment_status:employment,account_status:'active',sort_order:sort,batch_status:batchStatus});
        const dateB=(mode===1||mode===4)?after:date,dateC=(mode===2||mode===4)?after:date,dateD=(mode===3||mode===4)?after:date;
        const rows=[
         make(1,287,early,'old','2026-01-01T00:00:00Z',101,groups[g],'working','active',23),
         make(2,287,dateB,'a','2026-02-01T00:00:00Z',102,selected,status,'active',0),
         make(3,287,dateC,'b','2026-02-02T00:00:00Z',103,nextCode,'working','active',3),
         make(4,287,dateD,'c','2026-02-02T00:00:00Z',104,selected,status,'active',4),
         make(5,287,far,'later','2026-04-01T00:00:00Z',105,nextCode,'working','active',5),
         make(6,287,date,'cancelled','2026-12-01T00:00:00Z',106,'NONE','retired','cancelled',0),
         make(7,288,date,'different-staff','2027-01-01T00:00:00Z',999,'NONE','retired','active',0),
         make(8,287,before,'previous','2026-01-31T00:00:00Z',100,'DAY_FIELD','working','active',7)
        ];
        // Mode 5 tests no effective row for selected employee until tomorrow, even with legacy fields.
        if(mode===5)for(const r of rows)if(r.employee_id===287&&r.batch_status==='active')r.effective_date=after;
        state.personnelAssignments=rows;
        const want=expected(rows,date),got=personnelAssignmentOn(emp,date);
        const label=date+' group='+groups[g]+' mode='+mode;
        ck(label+' authoritative assignment ID',got?.action_id===want?.action_id);
        ck(label+' active effective date',got?.effective_date===want?.effective_date);
        ck(label+' correct placement',got?.placement_code===want?.placement_code);
        ck(label+' future superseding assignment ignored',!got||got.effective_date<=date);
        const operational=!!want&&want.employment_status==='working'&&want.placement_code!=='NONE';
        ck(label+' active placement state',employeeOperationalOn(emp,date)===operational);
        ck(label+' effective group fallback',employeeGroupOn(emp,date)===(want?expectedGroup(want):emp.group_code));
        ck(label+' normalized sort order 0 supported',employeeSortOrderOn(emp,date)===(want?want.sort_order:emp.sort_order));
        ck(label+' chosen account/employment state',!got||got.employment_status===want.employment_status);
        const futureRow=future(rows,date);
        ck(label+' independently ranked earliest future action',personnelFutureAssignment(emp,date)?.action_id===futureRow?.action_id);
        const without=expected(rows,date,'c');
        ck(label+' batch-exclusion selected action',personnelAssignmentOn(emp,date,'c')?.action_id===without?.action_id);
        ck(label+' excluded batch never selected',personnelAssignmentOn(emp,date,'c')?.batch_id!=='c');
        ck(label+' no future chronological leakage',!got||got.action_id!==105);
        if(want?.action_id===104)rankChoices++;
        cases++;
       }
      }
     }finally{Object.assign(state,prev)}
     return{pass,fail,issues,cases,rankChoices};
    });
    pass+=result.pass;fail+=result.fail+pageErrors.length;cases+=result.cases;contexts++;
    if(result.fail||pageErrors.length)issues.push({tz,mobile,issues:result.issues,pageErrors:pageErrors.slice(0,4)});
   }catch(e){fail++;issues.push({tz,mobile,error:String(e.stack||e).slice(0,1600)})}
   finally{await cx.close()}
  }
 }catch(e){fail++;issues.push({harness:String(e.stack||e).slice(0,1500)})}
 finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok))}
 console.log('QA287_PERSONNEL_TIMELINE_ORACLE_SUMMARY',JSON.stringify({pass,fail,contexts,cases,sha256:hash,issues}));
 if(fail)process.exitCode=1;
})();