'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {test}=require('node:test');
const html=fs.readFileSync(path.resolve(__dirname,'../../index.html'),'utf8');
const start=html.indexOf('async function saveSelectedDateMemo(){');
const end=html.indexOf('\nasync function deleteSelectedDateMemo(){',start);
assert.ok(start>0&&end>start,'memo-save-function-present');
const source=html.slice(start,end);
new vm.Script('let memoSavePending=false;\n'+source,'qa-memo-save-parse');

async function drive(outcome){
 const day='2026-10-22',calls=[],toasts=[],success=[],elements={
   memoText:{value:'메모 작성 후 저장 테스트'},
   memoDetailError:{textContent:''},
   saveMemoBtn:{disabled:false},deleteMemoBtn:{disabled:false},
   detailBackdrop:{classList:{contains:()=>true}},
   memoListBackdrop:{classList:{contains:()=>false}}
 };
 const state={view:'mine',selectedDate:day,me:{employee_id:22},
   sessionToken:'synthetic-token',memoBackendReady:true,year:2026,month:10,memos:[]};
 const ctx=vm.createContext({
   state,console,document:{hidden:false},memoDeletePendingDates:new Set(),
   sessionContextEpoch:1,fingerprintPageLifecycleEpoch:1,
   detailRecordBaseline:{key:day,memo:null},
   detailDraftBaseline:{key:day,memo:''},
   $:(name)=>{if(!elements[name])throw Error('UNEXPECTED_DOM:'+name);return elements[name];},
   personnelMutationReady:()=>true,accountReadOnly:()=>false,memoDateWritable:()=>true,
   configured:()=>true,pageLifecycleWriteFreshnessReady:()=>true,
   sharedSessionContextCurrent:()=>true,deferredSharedSessionContextCurrent:()=>true,
   sessionContextCurrent:()=>true,fetchCurrentMemoRow:async()=>null,
   memoForDate:()=>null,memoSourceSnapshot:(row)=>row?{id:row.id}:null,
   syncOpenDetailPermissionsPreservingDraft:()=>{},showLoading:()=>{},
   showToast:(...args)=>toasts.push(args),
   rpc:async(name,payload)=>{
     calls.push({name,payload});
     if(outcome==='missing')throw Object.assign(new Error('Could not find the function public.save_my_memo_v2 in schema cache'),{rpcCode:'PGRST202',httpStatus:404});
     if(outcome==='failed')throw Object.assign(new Error('RPC_UNAVAILABLE'),{rpcCode:'FAILED',httpStatus:500});
     return true;
   },
   isMissingRpcEndpointError:(e)=>e.rpcCode==='PGRST202',
   errorText:(e)=>String(e.message||''),
   strictTrueMutationResultRpc:(result)=>{if(result!==true)throw Error('INVALID_MEMO_PAYLOAD');return true;},
   finishDeferredSharedSave:()=>false,
   deferredSharedSessionHandoffActive:()=>false,
   userSafeServiceError:(_e,fallback)=>fallback,
   monthBounds:()=>({from:'2026-10-01',to:'2026-10-31'}),
   runPostMutationResync:async(fn)=>{await fn();return true;},
   loadMonthMemos:async()=>{state.memos=[{memo_date:day,memo_text:elements.memoText.value}];return true;},
   loadMemoDdays:async()=>true,loadMemoList:async()=>true,
   renderCalendar:()=>{},
   renderMemoDetail:()=>{elements.memoText.value=state.memos[0]?.memo_text||'';},
   captureDetailDraftBaseline:()=>{ctx.detailDraftBaseline.memo=elements.memoText.value;},
   mutationResultUncertainAfterResyncText:()=>'',showPostMutationResult:(...args)=>success.push(args)
 });
 vm.runInContext('let memoSavePending=false;\n'+source,ctx);
 await vm.runInContext('saveSelectedDateMemo()',ctx);
 return {ctx,elements,calls,toasts,success};
}
test('PGRST202 missing memo RPC: no false success, keep text and dirty baseline',async()=>{
 const x=await drive('missing');
 assert.equal(x.calls.length,1);
 assert.equal(x.calls[0].name,'save_my_memo_v2');
 assert.equal(x.elements.memoText.value,'메모 작성 후 저장 테스트');
 assert.match(x.elements.memoDetailError.textContent,/저장되지 않았습니다/);
 assert.match(x.elements.memoDetailError.textContent,/서버에서 찾을 수 없어/);
 assert.equal(x.ctx.detailDraftBaseline.memo,'');
 assert.equal(x.success.length,0);
 assert.equal(x.toasts.length,1);
 assert.equal(vm.runInContext('memoSavePending',x.ctx),false);
});
test('other failed save: preserve text and do not clear unsaved protection',async()=>{
 const x=await drive('failed');
 assert.equal(x.elements.memoText.value,'메모 작성 후 저장 테스트');
 assert.equal(x.ctx.detailDraftBaseline.memo,'');
 assert.equal(x.success.length,0);
 assert.equal(vm.runInContext('memoSavePending',x.ctx),false);
});
test('confirmed save and authoritative reread: baseline equals saved text',async()=>{
 const x=await drive('success');
 assert.equal(x.elements.memoText.value,'메모 작성 후 저장 테스트');
 assert.equal(x.ctx.detailDraftBaseline.memo,x.elements.memoText.value);
 assert.equal(x.elements.memoDetailError.textContent,'');
 assert.equal(x.success.length,1);
 assert.equal(x.toasts.length,0);
 assert.equal(vm.runInContext('memoSavePending',x.ctx),false);
});
