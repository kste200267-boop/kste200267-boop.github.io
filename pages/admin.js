// pages/admin.js — 관리자 페이지
var PageAdmin=(function(){
  function render(){
    var acc=Auth.getAccounts();
    var names=Object.keys(acc).sort();

    var h='<div class="card"><div class="card-h">👤 계정 관리 ('+names.length+'명)</div>';
    h+='<p style="color:var(--tx2);font-size:.83em;margin-bottom:10px">아이디·비밀번호를 수정한 뒤 "저장"을 누르세요. 모든 변경은 즉시 로컬에 저장됩니다.</p>';
    h+='<div style="overflow-x:auto"><table class="a-table"><thead><tr><th>이름</th><th>아이디</th><th>비밀번호</th><th>권한</th></tr></thead><tbody>';
    for(var i=0;i<names.length;i++){var n=names[i],a=acc[n];
      h+='<tr><td>'+n+'</td>';
      h+='<td><input id="aid-'+i+'" value="'+a.id+'" data-key="'+n+'"></td>';
      h+='<td><input id="apw-'+i+'" value="'+a.pw+'" data-key="'+n+'"></td>';
      h+='<td><select id="arl-'+i+'" data-key="'+n+'"><option value="user"'+(a.role==='user'?' selected':'')+'>일반</option><option value="admin"'+(a.role==='admin'?' selected':'')+'>관리자</option></select></td></tr>';
    }
    h+='</tbody></table></div>';
    h+='<button class="a-btn primary" style="margin-top:10px" onclick="PageAdmin.saveAccounts('+names.length+')">💾 계정 일괄 저장</button>';
    h+='<button class="a-btn outline" style="margin-top:10px" onclick="PageAdmin.resetAccounts()">🔄 전체 초기화 (기본값)</button>';
    h+='</div>';

    // 교시 시간
    h+='<div class="card"><div class="card-h">📋 교시 시간 설정</div>';
    h+='<table class="a-table"><thead><tr><th>교시</th><th>시작</th><th>종료</th></tr></thead><tbody>';
    for(var i=0;i<PT.length;i++){
      h+='<tr><td>'+(i+1)+'교시</td>';
      h+='<td><input type="time" id="pts-'+i+'" value="'+PT[i].s+'"></td>';
      h+='<td><input type="time" id="pte-'+i+'" value="'+PT[i].e+'"></td></tr>';
    }
    h+='</tbody></table>';
    h+='<button class="a-btn primary" style="margin-top:10px" onclick="PageAdmin.savePT()">💾 교시 시간 저장</button></div>';

    // 교사 목록
    h+='<div class="card"><div class="card-h">👥 교사 목록 ('+Object.keys(TD_ORIGINAL).length+'명)</div>';
    h+='<div style="max-height:300px;overflow-y:auto"><table class="a-table"><thead><tr><th>이름</th><th>과목</th><th>시수</th></tr></thead><tbody>';
    var tnames=Engine.names();for(var i=0;i<tnames.length;i++){var n=tnames[i];
      h+='<tr><td>'+n+'</td><td>'+Engine.TS()[n]+'</td><td>'+Engine.TD()[n].h+'</td></tr>';}
    h+='</tbody></table></div></div>';

    // 데이터 관리
    h+='<div class="card"><div class="card-h">💾 데이터 관리</div>';
    h+='<button class="a-btn success" onclick="PageAdmin.exportData()">📥 전체 백업 (JSON)</button>';
    h+='<button class="a-btn outline" onclick="document.getElementById(\'impF\').click()">📤 백업 복원</button>';
    h+='<input type="file" id="impF" accept=".json" style="display:none" onchange="PageAdmin.importData(event)">';
    h+='<button class="a-btn danger" onclick="PageAdmin.clearAll()">🗑️ 전체 데이터 초기화</button>';
    h+='<div style="margin-top:10px;font-size:.8em;color:var(--tx3)">백업에는 계정정보, 교체기록, 할일, 교시설정이 모두 포함됩니다.</div>';
    h+='</div>';

    document.getElementById('pg').innerHTML=h;
  }

  function saveAccounts(count){
    var acc=Auth.getAccounts();
    for(var i=0;i<count;i++){
      var idEl=document.getElementById('aid-'+i);
      var pwEl=document.getElementById('apw-'+i);
      var rlEl=document.getElementById('arl-'+i);
      if(!idEl)continue;
      var key=idEl.dataset.key;
      acc[key].id=idEl.value.trim()||key;
      acc[key].pw=pwEl.value||'1234';
      acc[key].role=rlEl.value;
    }
    Auth.saveAccounts(acc);
    toast('계정 정보가 저장되었습니다');
  }

  function resetAccounts(){
    if(!confirm('모든 계정을 기본값(아이디=이름, 비번=1234)으로 초기화할까요?\n김스데반 비번은 1120으로 설정됩니다.'))return;
    Store.remove('accounts');
    Auth.initAccounts();
    toast('계정 초기화 완료');
    render();
  }

  function savePT(){
    for(var i=0;i<PT.length;i++){
      PT[i].s=document.getElementById('pts-'+i).value;
      PT[i].e=document.getElementById('pte-'+i).value;
    }
    Store.set('pt',PT);
    toast('교시 시간 저장됨');
  }

  function exportData(){
    var d=Store.exportAll();
    var blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='portal-backup-'+new Date().toISOString().slice(0,10)+'.json';
    a.click();toast('백업 다운로드');
  }

  function importData(e){
    var f=e.target.files[0];if(!f)return;
    var r=new FileReader();
    r.onload=function(ev){
      try{var d=JSON.parse(ev.target.result);Store.importAll(d);Engine.rebuild();toast('복원 완료');render()}
      catch(err){toast('파일 오류')}
    };r.readAsText(f);
  }

  function clearAll(){
    if(!confirm('모든 데이터(계정, 교체기록, 할일 등)를 삭제할까요?\n이 작업은 되돌릴 수 없습니다.'))return;
    var keys=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('gm-')===0)keys.push(k)}
    keys.forEach(function(k){localStorage.removeItem(k)});
    toast('전체 초기화 완료');
    location.reload();
  }

  return{render:render,saveAccounts:saveAccounts,resetAccounts:resetAccounts,savePT:savePT,exportData:exportData,importData:importData,clearAll:clearAll};
})();
