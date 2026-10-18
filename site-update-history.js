/* Shared update history. All writes are authorized in Supabase RPCs, not by these buttons. */
(function(){
  'use strict';
  var records=null, editingVersion='', busy=false, requestSeq=0;
  function el(id){ return document.getElementById(id); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>'"]/g,function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]; }); }
  function canEdit(){ return typeof activeAdminMode==='function' && activeAdminMode(); }
  function sessionReady(){ return typeof configured==='function' && configured() && !!(state && state.sessionToken && state.me); }
  function message(msg,retry){
    var body=el('updateHistoryBody'); if(!body)return;
    body.innerHTML='<div class="update-history-empty" role="status">'+esc(msg)+'</div>'+(retry?'<button type="button" class="history-action history-retry" data-history-action="retry">다시 불러오기</button>':'');
  }
  function normalize(raw){
    if(!Array.isArray(raw) || raw.length>300)throw new Error('UPDATE_HISTORY_RESPONSE_INVALID');
    var seen=Object.create(null);
    return raw.map(function(r){
      if(!r || typeof r.version!=='string' || !r.version || typeof r.date!=='string' || !/^\d{4}\.\d{2}\.\d{2}$/.test(r.date) ||
         !Array.isArray(r.items) || r.items.length<1 || r.items.length>20 || r.items.some(function(x){ return typeof x!=='string' || !x.trim() || x.length>300; }) ||
         !Number.isSafeInteger(r.revision) || r.revision<1 || seen[r.version])throw new Error('UPDATE_HISTORY_RESPONSE_INVALID');
      seen[r.version]=true;
      return {version:r.version,date:r.date,items:r.items.slice(),revision:r.revision};
    });
  }
  function render(){
    var body=el('updateHistoryBody');if(!body)return;
    if(!records){message('업데이트 내역을 불러오는 중입니다.');return;}
    if(!records.length){message('등록된 업데이트 내역이 없습니다.');return;}
    var admin=canEdit();
    body.innerHTML=records.map(function(r){
      var editing=admin&&editingVersion===r.version;
      var list='<ul class="update-history-items">'+r.items.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>';
      var actions=admin?'<div class="history-admin-actions"><button type="button" class="history-action" data-history-action="edit" data-history-version="'+esc(r.version)+'">수정</button><button type="button" class="history-action history-danger" data-history-action="delete" data-history-version="'+esc(r.version)+'">삭제</button></div>':'';
      if(editing){
        actions='<div class="history-editor"><div class="history-editor-notice">버전 번호는 변경할 수 없습니다. 날짜와 변경 내용을 수정할 수 있습니다.</div>'+
        '<label for="historyEditDate">업데이트 날짜</label><input id="historyEditDate" type="date" value="'+esc(r.date.replace(/\./g,'-'))+'">'+
        '<label for="historyEditItems">수정 내역 (한 줄에 한 항목)</label><textarea id="historyEditItems" rows="5" maxlength="7000">'+esc(r.items.join('\n'))+'</textarea>'+
        '<div class="history-editor-buttons"><button type="button" class="history-action history-save" data-history-action="save" data-history-version="'+esc(r.version)+'">저장</button>'+
        '<button type="button" class="history-action" data-history-action="cancel">취소</button></div></div>';
      }
      return '<section class="update-history-item"><div class="update-history-head"><span class="update-history-version">'+esc(r.version)+'</span><span class="update-history-date">'+esc(r.date)+'</span></div>'+list+actions+'</section>';
    }).join('');
  }
  async function load(){
    var seq=++requestSeq, body=el('updateHistoryBody');
    if(!body || !el('updateHistoryBackdrop') || !el('updateHistoryBackdrop').classList.contains('open'))return;
    if(!sessionReady()){
      records=null;editingVersion='';message('로그인 상태를 확인할 수 없습니다. 다시 로그인해 주세요.');return;
    }
    var token=state.sessionToken;
    message('업데이트 내역을 불러오는 중입니다.');
    try{
      var result=normalize(await rpc('list_site_update_history_v1',{p_token:token}));
      if(seq!==requestSeq || token!==state.sessionToken || !sessionReady())return;
      records=result;
      if(!records.some(function(x){return x.version===editingVersion;}))editingVersion='';
      render();
    }catch(e){
      if(seq!==requestSeq || token!==state.sessionToken)return;
      records=null;editingVersion='';
      message('공용 업데이트 내역을 불러오지 못했습니다. 기록이 정확히 표시되도록 이전 목록은 사용하지 않습니다.',true);
    }
  }
  async function open(){
    records=null; editingVersion='';
    await load();
  }
  function currentRecord(version){return records && records.find(function(x){return x.version===version;});}
  async function mutate(action,version){
    if(busy || !canEdit() || !sessionReady())return;
    var r=currentRecord(version);if(!r)return;
    var body=el('updateHistoryBody');if(!body)return;
    var payload={p_token:state.sessionToken,p_version:r.version,p_expected_revision:r.revision};
    if(action==='delete'){
      if(!window.confirm('['+r.version+'] 업데이트 내역을 모든 직원의 목록에서 삭제할까요?'))return;
    }else{
      var d=el('historyEditDate'), t=el('historyEditItems');
      if(!d||!t)return;
      var items=t.value.split(/\r?\n/).map(function(x){return x.trim();}).filter(Boolean);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(d.value) || items.length<1 || items.length>20 || items.some(function(x){return x.length>300;})){
        if(typeof showToast==='function')showToast('날짜와 변경 내용을 확인해 주세요. 변경 내용은 1~20줄, 각 줄 300자 이내입니다.','error');
        return;
      }
      payload.p_release_date=d.value;payload.p_items=items;
    }
    if(!canEdit() || payload.p_token!==state.sessionToken)return;
    busy=true;
    try{
      var fn=action==='delete'?'admin_delete_site_update_history_v1':'admin_edit_site_update_history_v1';
      await rpc(fn,payload);
      if(payload.p_token!==state.sessionToken)return;
      editingVersion='';
      if(typeof showToast==='function')showToast(action==='delete'?'업데이트 내역을 삭제했습니다.':'업데이트 내역을 수정했습니다.','success');
    }catch(e){
      if(payload.p_token!==state.sessionToken)return;
      if(typeof showToast==='function')showToast(String(e&&e.message||'').includes('UPDATE_HISTORY_CONFLICT')?'다른 관리자가 먼저 변경했습니다. 최신 내역을 다시 확인해 주세요.':'변경 요청을 완료하지 못했습니다. 목록을 다시 확인해 주세요.','error');
    }finally{
      busy=false;
      if(payload.p_token===state.sessionToken && el('updateHistoryBackdrop').classList.contains('open'))await load();
    }
  }
  function click(e){
    var btn=e.target.closest('[data-history-action]');if(!btn || !el('updateHistoryBody').contains(btn))return;
    if(btn.disabled || busy)return;
    var action=btn.dataset.historyAction,version=btn.dataset.historyVersion||'';
    if(action==='retry'){void load();return;}
    if(action==='cancel'){editingVersion='';render();return;}
    if(!canEdit())return;
    if(action==='edit'){editingVersion=version;render();el('historyEditDate')?.focus();return;}
    if(action==='save'||action==='delete')void mutate(action,version);
  }
  document.addEventListener('click',click);
  window.siteUpdateHistory={open:open,load:load,render:render};
})();
