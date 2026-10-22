'use strict';
// QA-only source-level tests. No RPC, DB, production, secrets, network or user data.
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('index.html','utf8');
function between(a,b){
  const begin=html.indexOf(a);
  assert.ok(begin>=0,'Missing source anchor: '+a);
  const end=html.indexOf(b,begin+a.length);
  assert.ok(end>begin,'Missing next source anchor: '+b);
  return html.slice(begin,end);
}
const source=[
  between('function strictRpcInteger(', 'function strictLongServiceProfileRpc('),
  between('function strictPersonnelAssignmentRpcRows(', 'function strictPersonnelAccountEventRpcRows('),
  between('function personnelBatchesGrouped(', 'function renderPersonnelBatchList(')
].join('\n');
const ctx={
  validRpcObjectRowList(rows){return Array.isArray(rows)&&rows.every(x=>x&&typeof x==='object'&&!Array.isArray(x));},
  lsParseISO(x){return typeof x==='string'&&new RegExp('^[0-9]{4}-[0-9]{2}-[0-9]{2}$').test(x);},
  strictRpcTimestamp(x){if(typeof x!=='string'||!x.includes('T'))throw Error('bad timestamp');return x;},
  strictRpcDate(x){if(!new RegExp('^[0-9]{4}-[0-9]{2}-[0-9]{2}$').test(x))throw Error('bad date');return x;},
  normalizePersonnelAssignment(x){return x;}
};
vm.runInNewContext(source,ctx,{timeout:2000});
const {strictPersonnelAssignmentRpcRows,personnelBatchesGrouped,personnelBatchSourceSnapshot,personnelBatchSourceStillSame}=ctx;
const row=()=>({
 action_id:1,batch_id:55,employee_id:11,sort_order:1,correction_of:null,
 effective_date:'2027-04-11',batch_kind:'regular',batch_status:'active',
 display_name:'가상직원',placement_code:'A',employment_status:'working',
 account_status:'active',entry_type:'existing',is_new_employee:false,
 batch_note:'합성 발령',created_by_name:'가상관리자',
 batch_created_at:'2026-10-22T00:00:00Z',company_hire_date:'2026-01-01',batch_revision:0
});
function batch(rows){return personnelBatchesGrouped(strictPersonnelAssignmentRpcRows(rows))[0];}

test('1. revision 0 accepted as safe initial version',()=>{
 const r=strictPersonnelAssignmentRpcRows([row()]);assert.equal(r[0].batch_revision,0);
 assert.equal(batch([row()]).batch_revision,0);
});
test('2. missing legacy revision does not fabricate 0',()=>{
 const legacy=row();delete legacy.batch_revision;
 assert.equal(batch([legacy]).batch_revision,null);
});
for(const [name,value] of [
 ['null',null],['string','0'],['negative',-1],['fraction',0.5],
 ['unsafe',Number.MAX_SAFE_INTEGER+1],['boolean',true],['object',{}]
]){
 test('3. malformed revision fail closed: '+name,()=>{
   assert.throws(()=>strictPersonnelAssignmentRpcRows([{...row(),batch_revision:value}]),/revision/);
 });
}
test('4. revision in same batch must be consistent across action rows',()=>{
 const first=row(),second={...row(),action_id:2,employee_id:12,batch_revision:1};
 assert.throws(()=>strictPersonnelAssignmentRpcRows([first,second]),/인사이력/);
});
test('5. same revision across valid actions accepted',()=>{
 const first=row(),second={...row(),action_id:2,employee_id:12};
 assert.equal(batch([first,second]).actions.length,2);
});
test('6. source snapshot explicitly includes revision',()=>{
 assert.equal(personnelBatchSourceSnapshot(batch([row()])).batch_revision,0);
});
test('7. equal content but different revision must detect ABA or hidden edit',()=>{
 const original=batch([row()]),next=batch([{...row(),batch_revision:1}]);
 const saved=personnelBatchSourceSnapshot(original);
 assert.equal(personnelBatchSourceStillSame(next,saved),false);
});
test('8. note changes with same revision must fail snapshot comparison',()=>{
 const saved=personnelBatchSourceSnapshot(batch([row()]));
 assert.equal(personnelBatchSourceStillSame(batch([{...row(),batch_note:'수정'}]),saved),false);
});
test('9. identical state and revision must compare same',()=>{
 const saved=personnelBatchSourceSnapshot(batch([row()]));
 assert.equal(personnelBatchSourceStillSame(batch([row()]),saved),true);
});
test('10. QA cancellation refuses missing revision before confirmation',()=>{
 const fn=between('async function cancelPersonnelBatch(', 'async function openPersonnelSnapshotRestore(');
 const guard=fn.indexOf('if(configured()&&(!Number.isSafeInteger(expected.batch_revision)||expected.batch_revision<0))');
 const ask=fn.indexOf('confirmMutationWithSessionGuard(');
 assert.ok(guard>=0&&ask>guard,'Expected revision guard must precede confirmation');
});
test('11. exactly one cancel RPC call and requires CAS revision',()=>{
 const fn=between('async function cancelPersonnelBatch(', 'async function openPersonnelSnapshotRestore(');
 const payloadAnchor="rpc('admin_cancel_personnel_batch_v2',";
 const calls=fn.split(payloadAnchor).length-1;assert.equal(calls,1);
 const payload=fn.slice(fn.indexOf(payloadAnchor),fn.indexOf(payloadAnchor)+190);
 assert.ok(payload.includes('p_token:token,p_batch_id:batchId,p_expected_revision:expected.batch_revision'));
 assert.ok(!payload.includes('p_expected_revision:null'));
});
test('12. latest assignment snapshot recheck stays before CAS write',()=>{
 const fn=between('async function cancelPersonnelBatch(', 'async function openPersonnelSnapshotRestore(');
 const comparison=fn.indexOf('personnelBatchSourceStillSame(latest,expected)');
 const call=fn.indexOf("rpc('admin_cancel_personnel_batch_v2'");
 assert.ok(comparison>=0&&call>comparison);
});
test('13. stale server conflict has explicit safe UI handling',()=>{
 const fn=between('async function cancelPersonnelBatch(', 'async function openPersonnelSnapshotRestore(');
 assert.match(fn,/STALE_PERSONNEL_BATCH/);
 assert.match(fn,/최신 인사발령/);
});
console.log('PERSONNEL_BATCH_CANCEL_REVISION_CAS_QA_SOURCE_SCOPED_PASS');
