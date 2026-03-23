// pages/admin.js — 관리자
var PageAdmin=(function(){
  var tab='accounts';
  function render(){
    var h='<div class="card"><div class="card-h">⚙️ 관리자 설정</div>';
    h+='<div class="chips" style="margin-bottom:14px">';
    var ts=[['accounts','👤 계정'],['subjects','📚 과목'],['timetable','📅 시간표'],['periods','🕐 교시'],['data','💾 데이터']];
    for(var i=0;i<ts.length;i++)h+='<span class="chip'+(tab===ts[i][0]?' on':'')+'" onclick="PageAdmin.tab(\''+ts[i][0]+'\')">'+ts[i][1]+'</span>';
    h+='</div><div id="ac"></div></div>';
    document.getElementById('pg').innerHTML=h;
    ({accounts:rAcc,subjects:rSubj,timetable:rTT,periods:rPer,data:rDat})[tab]();
  }

  // ── 계정 ──
  function rAcc(){
    var acc=Auth.getAccounts(),names=Object.keys(acc).sort();
    var h='<h3 style="font-size:.92em;margin-bottom:8px">👤 계정 관리 ('+names.length+'명)</h3>';
    h+='<div style="overflow-x:auto;max-height:400px;overflow-y:auto"><table class="a-table"><thead><tr><th>이름</th><th>아이디</th><th>비밀번호</th><th>권한</th><th></th></tr></thead><tbody>';
    for(var i=0;i<names.length;i++){var n=names[i],a=acc[n];
      h+='<tr><td>'+n+'</td><td><input id="ai'+i+'" value="'+a.id+'" data-k="'+n+'"></td><td><input id="ap'+i+'" value="'+a.pw+'" data-k="'+n+'"></td>';
      h+='<td><select id="ar'+i+'" data-k="'+n+'"><option value="user"'+(a.role==='user'?' selected':'')+'>일반</option><option value="admin"'+(a.role==='admin'?' selected':'')+'>관리자</option></select></td>';
      h+='<td><button class="a-btn danger sm" onclick="PageAdmin.delAcc(\''+n+'\')">삭제</button></td></tr>';
    }
    h+='</tbody></table></div>';
    h+='<div style="margin-top:8px"><button class="a-btn primary" onclick="PageAdmin.saveAcc('+names.length+')">💾 일괄 저장</button> ';
    h+='<button class="a-btn outline" onclick="PageAdmin.resetAcc()">🔄 초기화</button></div>';
    h+='<div style="margin-top:14px;padding:12px;background:var(--bg2);border-radius:var(--radius-sm)">';
    h+='<div style="font-weight:600;font-size:.88em;margin-bottom:6px">➕ 회원 추가</div>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap"><input class="ti-input" id="nn" placeholder="이름" style="max-width:100px"><input class="ti-input" id="ni" placeholder="아이디" style="max-width:100px"><input class="ti-input" id="np" placeholder="비번(1234)" style="max-width:100px"><select class="ti-sel" id="nr"><option value="user">일반</option><option value="admin">관리자</option></select><button class="a-btn success" onclick="PageAdmin.addAcc()">추가</button></div></div>';
    document.getElementById('ac').innerHTML=h;
  }
  function saveAcc(c){var acc=Auth.getAccounts();for(var i=0;i<c;i++){var el=document.getElementById('ai'+i);if(!el)continue;var k=el.dataset.k;acc[k].id=el.value.trim()||k;acc[k].pw=document.getElementById('ap'+i).value||'1234';acc[k].role=document.getElementById('ar'+i).value}Auth.saveAccounts(acc);toast('저장됨')}
  function addAcc(){var n=document.getElementById('nn').value.trim();if(!n){toast('이름 입력');return}var acc=Auth.getAccounts();if(acc[n]){toast('이미 존재');return}acc[n]={id:document.getElementById('ni').value.trim()||n,pw:document.getElementById('np').value||'1234',role:document.getElementById('nr').value};if(!TD_ORIGINAL[n])TD_ORIGINAL[n]={h:0,s:new Array(32).fill(null)};Auth.saveAccounts(acc);Engine.rebuild();toast(n+' 추가');render()}
  function delAcc(n){if(n===App.getUser()){toast('본인 삭제 불가');return}if(!confirm(n+' 삭제?'))return;var acc=Auth.getAccounts();delete acc[n];Auth.saveAccounts(acc);toast('삭제됨');render()}
  function resetAcc(){if(!confirm('전체 계정 초기화?'))return;Store.remove('accounts');Auth.initAccounts();toast('완료');render()}

  // ── 과목 ──
  function rSubj(){
    var TS=Engine.TS(),names=Engine.names(),ov=Store.get('subj-ov',{});
    var h='<h3 style="font-size:.92em;margin-bottom:8px">📚 교사별 과목 수정</h3>';
    h+='<p style="color:var(--tx2);font-size:.82em;margin-bottom:8px">자동감지 과목이 틀리면 직접 수정하세요.</p>';
    h+='<div style="max-height:400px;overflow-y:auto"><table class="a-table"><thead><tr><th>이름</th><th>자동감지</th><th>수정</th></tr></thead><tbody>';
    for(var i=0;i<names.length;i++){var n=names[i];h+='<tr><td>'+n+'</td><td style="color:var(--tx3)">'+TS[n]+'</td><td><input id="so'+i+'" value="'+(ov[n]||'')+'" placeholder="'+TS[n]+'" data-k="'+n+'" style="width:100px"></td></tr>'}
    h+='</tbody></table></div>';
    h+='<button class="a-btn primary" style="margin-top:8px" onclick="PageAdmin.saveSubj('+names.length+')">💾 저장</button> <button class="a-btn outline" onclick="Store.remove(\'subj-ov\');Engine.rebuild();toast(\'초기화\');render()">🔄</button>';
    document.getElementById('ac').innerHTML=h;
  }
  function saveSubj(c){var ov={};for(var i=0;i<c;i++){var el=document.getElementById('so'+i);if(!el)continue;var v=el.value.trim();if(v)ov[el.dataset.k]=v}Store.set('subj-ov',ov);applySubjOv();toast('저장됨')}

  // ── 시간표 ──
  function rTT(){
    var h='<h3 style="font-size:.92em;margin-bottom:8px">📅 시간표 관리</h3>';
    h+='<div style="padding:14px;background:var(--bg2);border-radius:var(--radius-sm);margin-bottom:12px">';
    h+='<div style="font-weight:600;font-size:.88em;margin-bottom:6px">📤 CSV에서 시간표 가져오기</div>';
    h+='<p style="color:var(--tx2);font-size:.82em;margin-bottom:8px">형식: 교사명,시수,월1,월2,...,금6 (34열)<br>먼저 아래 양식을 다운받아 수정 후 업로드하세요.</p>';
    h+='<input type="file" id="csvF" accept=".csv" style="margin-bottom:6px"><br>';
    h+='<button class="a-btn primary" onclick="PageAdmin.upCSV()">📊 업로드</button> ';
    h+='<button class="a-btn outline" onclick="PageAdmin.dlCSV()">📥 양식 다운로드</button></div>';
    h+='<div style="font-weight:600;font-size:.88em;margin-bottom:6px">현재 교사 ('+Engine.names().length+'명)</div>';
    h+='<div style="max-height:300px;overflow-y:auto"><table class="a-table"><thead><tr><th>이름</th><th>과목</th><th>시수</th><th>수업 반</th></tr></thead><tbody>';
    var names=Engine.names(),TD=Engine.TD(),TS=Engine.TS();
    for(var i=0;i<names.length;i++){var n=names[i],cls={},s=TD[n].s;for(var j=0;j<s.length;j++){if(s[j]&&s[j]!=='동아리')cls[s[j]]=1}
      h+='<tr><td>'+n+'</td><td>'+TS[n]+'</td><td>'+TD[n].h+'</td><td style="font-size:.76em">'+Object.keys(cls).join(', ')+'</td></tr>'}
    h+='</tbody></table></div>';
    document.getElementById('ac').innerHTML=h;
  }
  function upCSV(){
    var f=document.getElementById('csvF');if(!f.files.length){toast('파일 선택');return}
    var reader=new FileReader();reader.onload=function(e){
      try{var lines=e.target.result.split('\n'),cnt=0;
        for(var i=1;i<lines.length;i++){var c=lines[i].split(',');if(c.length<34)continue;var name=c[0].trim(),hours=parseInt(c[1])||0,sched=[];
          for(var j=2;j<34;j++){var v=c[j]?c[j].trim():'';sched.push(v&&v!=='-'&&v!=='null'?v:null)}
          if(name){TD_ORIGINAL[name]={h:hours,s:sched};var acc=Auth.getAccounts();if(!acc[name]){acc[name]={id:name,pw:'1234',role:'user'};Auth.saveAccounts(acc)}cnt++}}
        Engine.rebuild();toast(cnt+'명 가져오기 완료');render();
      }catch(err){toast('형식 오류')}
    };reader.readAsText(f.files[0],'UTF-8');
  }
  function dlCSV(){
    var hd='교사명,시수,월1,월2,월3,월4,월5,월6,월7,화1,화2,화3,화4,화5,화6,화7,수1,수2,수3,수4,수5,수6,목1,목2,목3,목4,목5,목6,금1,금2,금3,금4,금5,금6\n';
    var bd='';var names=Object.keys(TD_ORIGINAL).sort();
    for(var i=0;i<names.length;i++){var n=names[i],t=TD_ORIGINAL[n];bd+=n+','+t.h;for(var j=0;j<t.s.length;j++)bd+=','+(t.s[j]||'');bd+='\n'}
    var blob=new Blob(['\uFEFF'+hd+bd],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='시간표_양식.csv';a.click();toast('다운로드');
  }

  // ── 교시 ──
  function rPer(){
    var h='<h3 style="font-size:.92em;margin-bottom:8px">🕐 교시 시간 설정</h3>';
    h+='<table class="a-table"><thead><tr><th>교시</th><th>시작</th><th>종료</th></tr></thead><tbody>';
    for(var i=0;i<PT.length;i++){h+='<tr><td>'+(i+1)+'교시</td><td><input type="time" id="ps'+i+'" value="'+PT[i].s+'"></td><td><input type="time" id="pe'+i+'" value="'+PT[i].e+'"></td></tr>'}
    h+='</tbody></table><button class="a-btn primary" style="margin-top:8px" onclick="PageAdmin.savePT()">💾 저장</button>';
    document.getElementById('ac').innerHTML=h;
  }
  function savePT(){for(var i=0;i<PT.length;i++){PT[i].s=document.getElementById('ps'+i).value;PT[i].e=document.getElementById('pe'+i).value}Store.set('pt',PT);toast('저장됨')}

  // ── 데이터 ──
  function rDat(){
    var total=0;for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('gm-')===0)total+=localStorage.getItem(k).length}
    var h='<h3 style="font-size:.92em;margin-bottom:8px">💾 데이터 관리</h3>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">';
    h+='<button class="a-btn success" onclick="PageAdmin.exp()">📥 전체 백업</button>';
    h+='<button class="a-btn outline" onclick="document.getElementById(\'impF\').click()">📤 복원</button>';
    h+='<input type="file" id="impF" accept=".json" style="display:none" onchange="PageAdmin.imp(event)">';
    h+='<button class="a-btn danger" onclick="PageAdmin.clr()">🗑️ 전체 초기화</button></div>';
    h+='<div style="padding:10px;background:var(--bg2);border-radius:var(--radius-sm);font-size:.85em">💿 저장소: <b>'+(total/1024).toFixed(1)+' KB</b></div>';
    document.getElementById('ac').innerHTML=h;
  }
  function exp(){var d=Store.exportAll();d.subjOv=Store.get('subj-ov',{});var blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='portal-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();toast('다운로드')}
  function imp(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){try{var d=JSON.parse(ev.target.result);Store.importAll(d);if(d.subjOv)Store.set('subj-ov',d.subjOv);Engine.rebuild();toast('복원 완료');render()}catch(err){toast('오류')}};r.readAsText(f)}
  function clr(){if(!confirm('전체 삭제? 되돌릴 수 없습니다.'))return;var ks=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('gm-')===0)ks.push(k)}ks.forEach(function(k){localStorage.removeItem(k)});location.reload()}

  return{render:render,tab:function(t){tab=t;render()},saveAcc:saveAcc,addAcc:addAcc,delAcc:delAcc,resetAcc:resetAcc,saveSubj:saveSubj,upCSV:upCSV,dlCSV:dlCSV,savePT:savePT,exp:exp,imp:imp,clr:clr};
})();

// 과목 오버라이드 반영
function applySubjOv(){var ov=Store.get('subj-ov',{});var TS=Engine.TS();for(var k in ov)if(TS[k])TS[k]=ov[k]}
var _oRb=Engine.rebuild;Engine.rebuild=function(w){_oRb(w);applySubjOv()};
