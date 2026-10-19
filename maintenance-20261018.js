/* 근무모아 정비기간 편성: 별도 파일로 격리, 기존 8일 주기/데이터 불변 */
'use strict';
let maintenanceSchedule={revision:0,data:{periods:[],overrides:[],holidays:[],excludedHolidays:[]}};
let maintenanceReady=null,maintenanceLoadSeq=0,maintenanceDraft=null,maintenanceDraftBaseline=null,maintenanceEditorPeriodId='',maintenanceSavePending=false,maintenancePeriodSequence=0,maintenanceSaveSeq=0;
const maintenanceGroups=['A','B','C','D'];
const maintenanceShifts=['주2','주','야','휴','비'];
const maintenanceEmpty=()=>({periods:[],overrides:[],holidays:[],excludedHolidays:[]});
const maintenanceClone=x=>JSON.parse(JSON.stringify(x));
function maintenanceISODate(key){
 if(typeof key!=='string'||!/^20(2[6-9]|3[0-5])-\d{2}-\d{2}$/.test(key))return false;
 const d=new Date(key+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===key;
}
function maintenanceDayDiff(from,to){return Math.round((new Date(to+'T00:00:00Z')-new Date(from+'T00:00:00Z'))/86400000);}
function maintenanceBase(group,key){
 const p=parseDateKey(key),arr=SHIFT_PATTERNS[group];if(!p||!arr)return '';
 const diff=Math.round((Date.UTC(p.y,p.m,p.d)-SHIFT_ANCHOR_UTC)/86400000);
 return arr[((diff%8)+8)%8];
}
function maintenanceHolidayName(key,data=maintenanceSchedule.data){
 return (data?.holidays||[]).find(h=>h.date===key)?.title||'';
}
function maintenanceOriginalHolidayName(key){return HOLIDAYS[key]||FUTURE_HOLIDAYS[key]||'';}
function maintenanceExcludedHoliday(key,data=maintenanceSchedule.data){
 return (data?.excludedHolidays||[]).includes(key);
}
function maintenanceDayHoliday(key,data=maintenanceSchedule.data){
 const weekday=new Date(key+'T00:00:00Z').getUTCDay();
 return weekday===0||weekday===6||/^\d{4}-02-12$/.test(key)
  ||!!maintenanceHolidayName(key,data)
  ||(!!maintenanceOriginalHolidayName(key)&&!maintenanceExcludedHoliday(key,data));
}
function maintenancePeriodOn(key,data=maintenanceSchedule.data){
 return (data?.periods||[]).find(p=>key>=p.start&&key<=p.end)||null;
}
function maintenanceStartRestDays(group,start){
 const p1=addDaysKey(start,-1),p2=addDaysKey(start,-2),p3=addDaysKey(start,-3);
 const v1=maintenanceBase(group,p1),v2=maintenanceBase(group,p2),v3=maintenanceBase(group,p3);
 if((v1==='주'||v1==='야')&&v2===v1)return 2;
 if(v1==='야')return 1;
 if((v2==='주'||v2==='야')&&v3===v2)return 1;
 return 0;
}
function maintenanceComputedShift(group,key,data=maintenanceSchedule.data){
 if(!maintenanceGroups.includes(group)||!maintenanceISODate(key))return null;
 const period=maintenancePeriodOn(key,data);if(!period)return null;
 const manual=(data.overrides||[]).find(o=>o.date===key&&o.group===group);
 if(manual)return manual.shift;
 if(key===period.end&&maintenanceBase(group,key)==='야')return '야';
 if(maintenanceDayDiff(period.start,key)<maintenanceStartRestDays(group,period.start))return '휴';
 if(maintenanceDayHoliday(key,data))return '휴';
 return '주2';
}
function maintenanceShiftForGroup(group,key){return maintenanceComputedShift(group,key);}
function maintenanceValidate(data){
 if(!data||!['periods','overrides','holidays','excludedHolidays'].every(k=>Array.isArray(data[k])))return '편성 데이터가 올바르지 않습니다.';
 if(data.periods.length>32||data.overrides.length>5000||data.holidays.length>100||data.excludedHolidays.length>250)return '등록 가능한 최대 건수를 초과했습니다.';
 const ids=new Set(),slots=new Set(),holidays=new Set();
 for(const p of data.periods){
  if(!/^[a-zA-Z0-9_-]{1,40}$/.test(p.id||'')||ids.has(p.id)||!String(p.label||'').trim()||String(p.label||'').trim().length>60||!maintenanceISODate(p.start)||!maintenanceISODate(p.end)||maintenanceDayDiff(p.start,p.end)<0||maintenanceDayDiff(p.start,p.end)>60)return '기간명·시작일·종료일(최대 61일)을 확인해 주세요.';
  if(p.start<='2026-10-15'&&p.end>='2026-10-01')return '2026년 10월 1~15일의 기존 특별 편성은 보호 중입니다.';
  if(data.periods.some(v=>v!==p&&v.start<=p.end&&v.end>=p.start))return '정비기간이 서로 겹칠 수 없습니다.';
  ids.add(p.id);
 }
 for(const o of data.overrides){
  if(!maintenanceISODate(o.date)||!maintenanceGroups.includes(o.group)||!maintenanceShifts.includes(o.shift)||slots.has(o.group+':'+o.date)||!maintenancePeriodOn(o.date,data))return '조별 수동 수정에 중복되거나 기간 밖인 날짜가 있습니다.';
  slots.add(o.group+':'+o.date);
 }
 for(const h of data.holidays){
  if(!maintenanceISODate(h.date)||!String(h.title||'').trim()||String(h.title||'').trim().length>40||holidays.has(h.date))return '추가 공휴일의 날짜·이름 또는 중복을 확인해 주세요.';
  holidays.add(h.date);
 }
 const excluded=new Set();
 for(const key of data.excludedHolidays){
  if(!maintenanceISODate(key)||!maintenanceOriginalHolidayName(key)||/^\d{4}-02-12$/.test(key)
    ||(key>='2026-10-01'&&key<='2026-10-15')||holidays.has(key)||excluded.has(key))
   return '기존 공휴일 변경 날짜가 올바르지 않거나 중복되었습니다. 2월 12일·2026년 10월 특별 편성은 보호됩니다.';
  excluded.add(key);
 }
 return '';
}
function maintenanceStrictResponse(res){
 if(!res||typeof res!=='object'||!Number.isSafeInteger(Number(res.revision))||Number(res.revision)<0)throw Error('INVALID_MAINTENANCE_RESPONSE');
 const data=res.data&&typeof res.data==='object'&&!Array.isArray(res.data)
  ?{...res.data,excludedHolidays:res.data.excludedHolidays===undefined?[]:res.data.excludedHolidays}:res.data;
 const error=maintenanceValidate(data);if(error)throw Error('INVALID_MAINTENANCE_RESPONSE: '+error);
 return {revision:Number(res.revision),data:maintenanceClone(data)};
}
async function loadMaintenanceSchedule(){
 const seq=++maintenanceLoadSeq;
 if(!state.me){maintenanceSchedule={revision:0,data:maintenanceEmpty()};maintenanceReady=null;return false;}
 const actor=Number(state.me.employee_id),token=state.sessionToken,epoch=sessionContextEpoch;
 const current=()=>seq===maintenanceLoadSeq&&sharedSessionContextCurrent(actor,token,{epoch});
 if(!configured()){if(!current())return false;maintenanceReady=true;return true;}
 maintenanceReady=null;
 try{
  const fresh=maintenanceStrictResponse(await rpc('get_maintenance_schedule',{p_token:token},{timeoutMs:READONLY_RPC_TIMEOUT_MS}));
  if(!current())return false;
  maintenanceSchedule=fresh;maintenanceReady=true;
  if($('maintenanceBackdrop')?.classList.contains('open')&&maintenanceDraft)maintenanceRender();
  return true;
 }catch(e){
  if(!current())return false;
  if(isConfirmedSessionExpired(e))throw e;
  maintenanceReady=false;
  if($('maintenanceBackdrop')?.classList.contains('open')&&maintenanceDraft)maintenanceRender();
  return false;
 }
}
function maintenanceReset(){
 ++maintenanceLoadSeq;++maintenanceSaveSeq;maintenanceSchedule={revision:0,data:maintenanceEmpty()};maintenanceReady=null;
 maintenanceDraft=null;maintenanceDraftBaseline=null;maintenanceEditorPeriodId='';maintenanceSavePending=false;
}
function maintenanceDirty(){if(!maintenanceDraft||!maintenanceDraftBaseline)return false;const {revision,...original}=maintenanceDraftBaseline;return JSON.stringify(maintenanceDraft)!==JSON.stringify(original);}
function maintenanceCanDiscard(){
 if(maintenanceSavePending){showToast('정비 근무표를 저장하고 있습니다. 저장이 끝난 후 닫아 주세요.','info');return false;}
 return !maintenanceDirty()||confirmMutationWithSessionGuard('저장하지 않은 정비 근무표 변경이 있습니다. 닫을까요?',{allowDeferred:true});
}
function maintenanceRender(){
 const root=$('maintenanceBackdrop');if(!root||!maintenanceDraft)return;
 const good=maintenanceValidate(maintenanceDraft),stale=maintenanceDraftBaseline?.revision!==maintenanceSchedule.revision;
 const periods=maintenanceDraft.periods.slice().sort((a,b)=>a.start.localeCompare(b.start));
 if(!periods.some(p=>p.id===maintenanceEditorPeriodId))maintenanceEditorPeriodId=periods[0]?.id||'';
 const current=periods.find(p=>p.id===maintenanceEditorPeriodId)||null;
 $('maintenanceStatus').textContent=maintenanceSavePending?'서버에 저장 중입니다. 완료될 때까지 내용을 변경할 수 없습니다.':maintenanceReady===false?'서버 조회 실패 · 저장 불가':stale?'다른 관리자/탭에서 변경됨 · 최신 내용을 다시 열어 주세요':good||'변경 전 미리보기를 확인한 후 저장해 주세요.';
 $('maintenancePeriodList').innerHTML=periods.length?periods.map(p=>
  '<div class="maintenance-line"><button type="button" data-mt-select="'+escapeHtml(p.id)+'" class="'+(p.id===maintenanceEditorPeriodId?'maintenance-selected':'')+'">'+escapeHtml(p.label)+' · '+p.start+' ~ '+p.end+'</button><button type="button" data-mt-remove="'+escapeHtml(p.id)+'" class="maintenance-remove">삭제</button></div>'
 ).join(''):'<div class="employee-empty">등록된 정비기간이 없습니다. 기존 2026년 10월 특별 편성은 그대로 유지됩니다.</div>';
 $('maintenancePeriodSelect').innerHTML=periods.map(p=>'<option value="'+escapeHtml(p.id)+'">'+escapeHtml(p.label)+' ('+p.start+'~'+p.end+')</option>').join('');
 $('maintenancePeriodSelect').value=maintenanceEditorPeriodId;
 $('maintenancePreviewTitle').textContent=current?current.label+' · '+current.start+' ~ '+current.end:'정비기간을 추가하면 조별 미리보기가 표시됩니다.';
 $('maintenanceEditForm').classList.toggle('hidden',!current);
 if(current){$('maintenanceEditLabel').value=current.label;$('maintenanceEditStart').value=current.start;$('maintenanceEditEnd').value=current.end;}
 if(current){
  let rows='';
  for(let i=0,n=maintenanceDayDiff(current.start,current.end);i<=n;i++){
   const day=addDaysKey(current.start,i),wd=new Date(day+'T00:00:00Z').getUTCDay(),holiday=maintenanceDayHoliday(day,maintenanceDraft);
   rows+='<tr><td>'+day.slice(5)+'<small>'+(holiday?' · 휴일':'')+'</small></td>';
   for(const group of maintenanceGroups){
    const calc=maintenanceComputedShift(group,day,{...maintenanceDraft,overrides:maintenanceDraft.overrides.filter(x=>!(x.date===day&&x.group===group))});
    const override=maintenanceDraft.overrides.find(x=>x.date===day&&x.group===group);
    rows+='<td><select aria-label="'+day+' '+group+'조 근무" data-mt-day="'+day+'" data-mt-group="'+group+'" class="'+(override?'maintenance-overridden':'')+'">'+
      '<option value="">자동 '+escapeHtml(calc||'')+'</option>'+maintenanceShifts.map(s=>'<option value="'+s+'"'+(override?.shift===s?' selected':'')+'>'+s+'</option>').join('')+'</select></td>';
   }
   rows+='</tr>';
  }
  $('maintenancePreview').innerHTML='<table class="maintenance-table"><thead><tr><th>날짜</th>'+maintenanceGroups.map(g=>'<th>'+g+'조</th>').join('')+'</tr></thead><tbody>'+rows+'</tbody></table>';
 }else $('maintenancePreview').innerHTML='';
 $('maintenanceHolidayList').innerHTML=maintenanceDraft.holidays.length?maintenanceDraft.holidays.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(h=>'<div class="maintenance-line"><span>'+escapeHtml(h.date)+' · '+escapeHtml(h.title)+'</span><button type="button" data-mt-remove-holiday="'+escapeHtml(h.date)+'" class="maintenance-remove">삭제</button></div>').join(''):'<span class="employee-help">추가로 지정된 임시공휴일이 없습니다.</span>';
 const chosen=$('maintenanceExistingHolidayDate').value,original=maintenanceOriginalHolidayName(chosen),isExcluded=maintenanceExcludedHoliday(chosen,maintenanceDraft);
 const protectedDay=/^\d{4}-02-12$/.test(chosen)||(chosen>='2026-10-01'&&chosen<='2026-10-15');
 const notice=$('maintenanceExistingHolidayNotice');
 notice.textContent=!chosen?'변경할 기존 공휴일 날짜를 선택해 주세요.'
  :!maintenanceISODate(chosen)?'2026~2035년 안에서 올바른 날짜를 선택해 주세요.'
  :protectedDay?'이 날짜는 창립기념일 또는 보호 중인 2026년 10월 특별 편성과 겹쳐 변경할 수 없습니다.'
  :!original?'이 날짜는 기존 공휴일 목록에 없습니다. 새 휴일 등록은 ④에서 할 수 있어요.'
  :isExcluded?'현재 '+original+'을(를) 근무일로 변경하도록 설정했습니다. 아래 목록에서 복원할 수 있어요.'
  :original+' · 기존 공휴일입니다. 근무일로 변경할 수 있습니다.';
 const weekday=maintenanceISODate(chosen)?new Date(chosen+'T00:00:00Z').getUTCDay():null;
 if(original&&(weekday===0||weekday===6))notice.textContent+=' 단, 토·일요일 자체는 계속 휴무입니다.';
 $('maintenanceExcludeHolidayBtn').disabled=maintenanceSavePending||!maintenanceISODate(chosen)||!original||protectedDay||isExcluded||maintenanceDraft.holidays.some(h=>h.date===chosen);
 $('maintenanceExcludedHolidayList').innerHTML=maintenanceDraft.excludedHolidays.length?
  maintenanceDraft.excludedHolidays.slice().sort().map(date=>'<div class="maintenance-line"><span>'+escapeHtml(date)+' · '+escapeHtml(maintenanceOriginalHolidayName(date))+' → 근무일 전환</span><button type="button" data-mt-restore-holiday="'+escapeHtml(date)+'" class="maintenance-remove">공휴일로 복원</button></div>').join(''):
  '<span class="employee-help">근무일로 변경한 기존 공휴일이 없습니다.</span>';
 const btn=$('maintenanceSaveBtn');btn.disabled=maintenanceSavePending||!activeAdminMode()||!configured()||maintenanceReady!==true||stale||!!good||!maintenanceDirty();
 $('maintenanceReloadBtn').disabled=maintenanceSavePending;
 for(const id of ['maintenanceLabel','maintenanceStart','maintenanceEnd','maintenanceAddBtn','maintenanceEditLabel','maintenanceEditStart','maintenanceEditEnd','maintenanceEditBtn','maintenanceHolidayDate','maintenanceHolidayName','maintenanceHolidayAddBtn','maintenanceExistingHolidayDate','maintenancePeriodSelect']){
  const input=$(id);if(input)input.disabled=maintenanceSavePending;
 }
 root.querySelectorAll('[data-mt-select],[data-mt-remove],[data-mt-day],[data-mt-group],[data-mt-remove-holiday],[data-mt-restore-holiday]').forEach(el=>{el.disabled=maintenanceSavePending;});
}
function maintenanceOpen(){
 if(!activeAdminMode()||!configured()){showToast('관리자 권한과 서버 연결을 확인해 주세요.','info');return;}
 if(maintenanceReady!==true){showToast('근무편성 최신 정보를 불러온 뒤 다시 시도해 주세요.','info');return;}
 maintenanceDraft=maintenanceClone(maintenanceSchedule.data);maintenanceDraftBaseline={...maintenanceClone(maintenanceSchedule.data),revision:maintenanceSchedule.revision};
 maintenanceEditorPeriodId=maintenanceDraft.periods[0]?.id||'';
 maintenanceRender();openBackdrop('maintenanceBackdrop');
}
function maintenanceAddPeriod(){
 if(maintenanceSavePending||!maintenanceDraft)return;
 const label=$('maintenanceLabel').value.trim(),start=$('maintenanceStart').value,end=$('maintenanceEnd').value;
 if(!label||!maintenanceISODate(start)||!maintenanceISODate(end)){showToast('정비명과 시작·종료 날짜를 입력해 주세요.','info');return;}
 const id='p'+Date.now().toString(36)+(++maintenancePeriodSequence).toString(36);
 const next=maintenanceClone(maintenanceDraft);next.periods.push({id,label,start,end});
 const error=maintenanceValidate(next);if(error){$('maintenanceStatus').textContent=error;return;}
 maintenanceDraft=next;maintenanceEditorPeriodId=id;maintenanceRender();
 $('maintenanceLabel').value='';$('maintenanceStart').value='';$('maintenanceEnd').value='';
}
function maintenanceEditPeriod(){
 if(maintenanceSavePending||!maintenanceDraft||!maintenanceEditorPeriodId)return;
 const old=maintenanceDraft.periods.find(p=>p.id===maintenanceEditorPeriodId);if(!old)return;
 const next=maintenanceClone(maintenanceDraft),p=next.periods.find(p=>p.id===maintenanceEditorPeriodId);
 p.label=$('maintenanceEditLabel').value.trim();p.start=$('maintenanceEditStart').value;p.end=$('maintenanceEditEnd').value;
 // 변경된 범위 밖의 기존 수동편성은 자동 제거하지 않고 사용자에게 점검을 요구한다.
 const error=maintenanceValidate(next);if(error){$('maintenanceStatus').textContent=error;return;}
 maintenanceDraft=next;maintenanceRender();
}
function maintenanceAddHoliday(){
 if(maintenanceSavePending||!maintenanceDraft)return;
 const date=$('maintenanceHolidayDate').value,title=$('maintenanceHolidayName').value.trim();
 const next=maintenanceClone(maintenanceDraft);next.holidays.push({date,title});
 const error=maintenanceValidate(next);if(error){$('maintenanceStatus').textContent=error;return;}
 maintenanceDraft=next;maintenanceRender();$('maintenanceHolidayDate').value='';$('maintenanceHolidayName').value='';
}
function maintenanceExcludeHoliday(){
 if(maintenanceSavePending||!maintenanceDraft)return;
 const key=$('maintenanceExistingHolidayDate').value;
 const next=maintenanceClone(maintenanceDraft);next.excludedHolidays.push(key);
 const error=maintenanceValidate(next);if(error){$('maintenanceStatus').textContent=error;return;}
 maintenanceDraft=next;maintenanceRender();
}
function maintenanceSetOverride(day,group,shift){
 if(maintenanceSavePending||!maintenanceDraft||!maintenanceGroups.includes(group)||!maintenanceISODate(day)|| (shift&&!maintenanceShifts.includes(shift)))return;
 maintenanceDraft.overrides=maintenanceDraft.overrides.filter(o=>!(o.date===day&&o.group===group));
 if(shift)maintenanceDraft.overrides.push({date:day,group,shift});
 maintenanceRender();
}
async function maintenanceReloadEditor(){
 if(maintenanceSavePending||!maintenanceDraft)return;
 // 서버 조회 중에도 편집/닫기/로그아웃이 가능하다. 나중에 도착한 응답이 새 편집을 덮어쓰면 안 된다.
 const originalDraft=maintenanceDraft,originalJson=JSON.stringify(maintenanceDraft),originalToken=state.sessionToken;
 const ok=await loadMaintenanceSchedule();
 if(!maintenanceDraft||state.sessionToken!==originalToken||!$('maintenanceBackdrop')?.classList.contains('open'))return;
 if(ok!==true){showToast('서버에서 최신 정비 설정을 불러오지 못했습니다.','error');return;}
 if(maintenanceDraft!==originalDraft||JSON.stringify(maintenanceDraft)!==originalJson){
  maintenanceRender();
  showToast('최신 설정을 조회하는 동안 새로 작성한 변경 사항이 있어 유지했습니다. 필요하면 변경 내용을 확인한 후 다시 불러와 주세요.','info');
  return;
 }
 maintenanceDraft=maintenanceClone(maintenanceSchedule.data);
 maintenanceDraftBaseline={...maintenanceClone(maintenanceSchedule.data),revision:maintenanceSchedule.revision};
 maintenanceEditorPeriodId=maintenanceDraft.periods[0]?.id||'';maintenanceRender();
}
async function maintenanceSave(){
 if(maintenanceSavePending||!maintenanceDraft||!activeAdminMode()||maintenanceReady!==true)return;
 const msg=maintenanceValidate(maintenanceDraft);if(msg){$('maintenanceStatus').textContent=msg;return;}
 if(maintenanceDraftBaseline?.revision!==maintenanceSchedule.revision){$('maintenanceStatus').textContent='최신 편성 정보를 다시 불러와 주세요.';return;}
 if(!maintenanceDirty())return;
 const pastHolidayChange=[...new Set([...maintenanceDraft.excludedHolidays,...(maintenanceDraftBaseline?.excludedHolidays||[])])]
  .some(key=>key<=todayKey()&&maintenanceExcludedHoliday(key,maintenanceDraft)!==maintenanceExcludedHoliday(key,maintenanceDraftBaseline));
 if(maintenanceDraft.periods.some(p=>p.start<=todayKey())||maintenanceDraft.holidays.some(h=>h.date<=todayKey())||pastHolidayChange){
   if(!confirmMutationWithSessionGuard('과거 날짜의 편성이 달라지면 연차·초과근무 계산 결과가 변할 수 있습니다. 기존 근태 기록은 삭제되지 않습니다. 계속 저장할까요?'))return;
 }
 const token=state.sessionToken,actor=Number(state.me.employee_id),epoch=sessionContextEpoch;
 const saved=maintenanceClone(maintenanceDraft),expected=maintenanceDraftBaseline.revision;
 const saveSeq=++maintenanceSaveSeq;
 maintenanceSavePending=true;maintenanceRender();
 let saveErrorMessage='';
 try{
  const result=maintenanceStrictResponse(await rpc('admin_save_maintenance_schedule',{p_token:token,p_expected_revision:expected,p_data:saved}));
  if(!sharedSessionContextCurrent(actor,token,{epoch}))return;
  maintenanceSchedule=result;maintenanceReady=true;
  maintenanceDraft=maintenanceClone(result.data);maintenanceDraftBaseline={...maintenanceClone(result.data),revision:result.revision};
  maintenanceRender();closeBackdrop('maintenanceBackdrop',true);
  renderCalendar();rerenderOpenDetailUnlessDirty();
  showToast('✓ 정비기간·조별 근무표·공휴일 변경을 전체 직원에게 저장했습니다.','success');
  realtimeNeedsCatchup=true;scheduleRealtimeRefresh(400);
 }catch(e){
  if(sharedSessionContextCurrent(actor,token,{epoch})){
   const str=String(e?.message||'');
   saveErrorMessage=str.includes('HOLIDAY_WORK_HISTORY_CONFLICT')
    ?'이 날짜에 등록된 휴일근무 기록이 있어 근무일로 변경하거나 추가 휴일을 삭제할 수 없습니다. 기존 휴일근무 기록을 먼저 확인해 주세요.'
    :str.includes('STALE_MAINTENANCE_SCHEDULE')
     ?'다른 관리자 또는 탭에서 먼저 수정했습니다. 최신 정보를 다시 불러와 주세요.'
     :userSafeServiceError(e,'정비 근무표 저장에 실패했습니다. 다시 시도해 주세요.');
  }
 }finally{
  // A prior session's late RPC must never unlock a newer session's save or overwrite its status.
  if(saveSeq===maintenanceSaveSeq){
   maintenanceSavePending=false;
   if(maintenanceDraft&&$('maintenanceBackdrop')?.classList.contains('open')){
    maintenanceRender();
    if(saveErrorMessage)$('maintenanceStatus').textContent=saveErrorMessage;
   }
  }
 }
}
function maintenanceWire(){
 $('maintenanceManageBtn').addEventListener('click',maintenanceOpen);
 $('maintenanceAddBtn').addEventListener('click',maintenanceAddPeriod);
 $('maintenanceHolidayAddBtn').addEventListener('click',maintenanceAddHoliday);
 $('maintenanceExcludeHolidayBtn').addEventListener('click',maintenanceExcludeHoliday);
 $('maintenanceExistingHolidayDate').addEventListener('change',maintenanceRender);
 $('maintenanceEditBtn').addEventListener('click',maintenanceEditPeriod);
 $('maintenanceSaveBtn').addEventListener('click',maintenanceSave);
 $('maintenanceReloadBtn').addEventListener('click',()=>{
  if(maintenanceDirty()&&!confirmMutationWithSessionGuard('작성 중인 정비 설정을 버리고 서버의 최신값을 불러올까요?'))return;
  void maintenanceReloadEditor();
 });
 $('maintenancePeriodSelect').addEventListener('change',e=>{if(maintenanceSavePending)return;maintenanceEditorPeriodId=e.target.value;maintenanceRender();});
 $('maintenancePeriodList').addEventListener('click',e=>{
  if(maintenanceSavePending)return;
  const select=e.target.closest('[data-mt-select]'),remove=e.target.closest('[data-mt-remove]');
  if(select){maintenanceEditorPeriodId=select.dataset.mtSelect;maintenanceRender();}
  if(remove&&maintenanceDraft){
    const id=remove.dataset.mtRemove,period=maintenanceDraft.periods.find(x=>x.id===id);if(!period)return;
    if(!confirmMutationWithSessionGuard(period.label+' 정비기간과 해당 날짜의 수동 편성을 삭제할까요?'))return;
    maintenanceDraft.periods=maintenanceDraft.periods.filter(x=>x.id!==id);
    maintenanceDraft.overrides=maintenanceDraft.overrides.filter(o=>o.date<period.start||o.date>period.end);
    maintenanceRender();
  }
 });
 $('maintenancePreview').addEventListener('change',e=>{
  const select=e.target.closest('[data-mt-day][data-mt-group]');if(select)maintenanceSetOverride(select.dataset.mtDay,select.dataset.mtGroup,select.value);
 });
 $('maintenanceHolidayList').addEventListener('click',e=>{
  if(maintenanceSavePending)return;
  const b=e.target.closest('[data-mt-remove-holiday]');
  if(b&&maintenanceDraft){maintenanceDraft.holidays=maintenanceDraft.holidays.filter(h=>h.date!==b.dataset.mtRemoveHoliday);maintenanceRender();}
 });
 $('maintenanceExcludedHolidayList').addEventListener('click',e=>{
  if(maintenanceSavePending)return;
  const b=e.target.closest('[data-mt-restore-holiday]');
  if(b&&maintenanceDraft){maintenanceDraft.excludedHolidays=maintenanceDraft.excludedHolidays.filter(k=>k!==b.dataset.mtRestoreHoliday);maintenanceRender();}
 });
}
