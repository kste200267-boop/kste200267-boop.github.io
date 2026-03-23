// pages/profile.js — 내 프로필 (본인 과목, 아이디, 비밀번호 수정)
var PageProfile=(function(){
  function render(){
    var U=App.getUser();
    var acc=Auth.getAccounts();
    var myAcc=acc[U]||{id:U,pw:'',role:'user'};
    var TS=Engine.TS();
    var TD=Engine.TD();
    var subjOv=Store.get('subj-ov',{});
    var mySubj=subjOv[U]||'';
    var autoSubj=TS[U]||'';

    // 내가 가르치는 반 목록
    var myClasses={};
    if(TD[U]){for(var i=0;i<TD[U].s.length;i++){var c=TD[U].s[i];if(c&&c!=='동아리')myClasses[c]=1}}

    // 방과후 데이터
    var after=Store.get('after-'+U,[]);
    var afterCount=0;for(var i=0;i<after.length;i++){if(after[i].p8)afterCount++;if(after[i].p9)afterCount++}

    var h='<div class="card"><div class="card-h">👤 내 프로필</div>';
    h+='<div style="display:grid;grid-template-columns:120px 1fr;gap:8px 16px;font-size:.9em;align-items:center">';

    h+='<div style="color:var(--tx2);font-weight:600">이름</div><div>'+U+'</div>';
    h+='<div style="color:var(--tx2);font-weight:600">권한</div><div>'+(myAcc.role==='admin'?'🔧 관리자':'👤 일반')+'</div>';
    h+='<div style="color:var(--tx2);font-weight:600">정규 시수</div><div>'+TD[U].h+'시간</div>';
    h+='<div style="color:var(--tx2);font-weight:600">방과후</div><div>'+afterCount+'시간</div>';
    h+='<div style="color:var(--tx2);font-weight:600">수업 반</div><div style="font-size:.85em">'+Object.keys(myClasses).join(', ')+'</div>';

    h+='</div></div>';

    // 수정 영역
    h+='<div class="card"><div class="card-h">✏️ 내 정보 수정</div>';

    // 과목
    h+='<div style="margin-bottom:14px">';
    h+='<div style="font-weight:600;font-size:.88em;margin-bottom:4px">📚 과목</div>';
    h+='<div style="color:var(--tx3);font-size:.78em;margin-bottom:6px">자동감지: '+autoSubj+'</div>';
    h+='<input class="ti-input" id="prSubj" value="'+mySubj+'" placeholder="'+autoSubj+' (빈칸이면 자동감지 사용)" style="max-width:200px">';
    h+='</div>';

    // 아이디
    h+='<div style="margin-bottom:14px">';
    h+='<div style="font-weight:600;font-size:.88em;margin-bottom:4px">🆔 아이디</div>';
    h+='<input class="ti-input" id="prId" value="'+myAcc.id+'" style="max-width:200px">';
    h+='</div>';

    // 비밀번호
    h+='<div style="margin-bottom:14px">';
    h+='<div style="font-weight:600;font-size:.88em;margin-bottom:4px">🔑 비밀번호 변경</div>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap">';
    h+='<input class="ti-input" id="prPwCur" type="password" placeholder="현재 비밀번호" style="max-width:150px">';
    h+='<input class="ti-input" id="prPwNew" type="password" placeholder="새 비밀번호" style="max-width:150px">';
    h+='<input class="ti-input" id="prPwNew2" type="password" placeholder="새 비밀번호 확인" style="max-width:150px">';
    h+='</div></div>';

    h+='<button class="a-btn primary" onclick="PageProfile.save()">💾 저장</button>';
    h+='</div>';

    // 내 시간표 수정 현황
    var myEdits=Store.get('myedit-'+U,{});
    var editCount=Object.keys(myEdits).length;
    if(editCount){
      h+='<div class="card"><div class="card-h">📝 내 시간표 수정 사항 ('+editCount+'건)</div>';
      h+='<p style="color:var(--tx2);font-size:.82em;margin-bottom:8px">시간표 편집에서 수정한 내용입니다.</p>';
      h+='<button class="a-btn danger sm" onclick="if(confirm(\'시간표 수정사항을 모두 초기화할까요?\')){Store.remove(\'myedit-'+U+'\');Engine.rebuild();toast(\'초기화됨\');PageProfile.render()}">🗑️ 수정사항 전체 초기화</button>';
      h+='</div>';
    }

    document.getElementById('pg').innerHTML=h;
  }

  function save(){
    var U=App.getUser();
    var acc=Auth.getAccounts();
    if(!acc[U])return;

    // 과목 저장
    var subj=document.getElementById('prSubj').value.trim();
    var subjOv=Store.get('subj-ov',{});
    if(subj){subjOv[U]=subj}else{delete subjOv[U]}
    Store.set('subj-ov',subjOv);
    Engine.rebuild();

    // 아이디 저장
    var newId=document.getElementById('prId').value.trim();
    if(newId)acc[U].id=newId;

    // 비밀번호 변경
    var curPw=document.getElementById('prPwCur').value;
    var newPw=document.getElementById('prPwNew').value;
    var newPw2=document.getElementById('prPwNew2').value;
    if(curPw||newPw||newPw2){
      if(!curPw){toast('현재 비밀번호를 입력하세요');return}
      if(curPw!==acc[U].pw){toast('현재 비밀번호가 틀립니다');return}
      if(!newPw){toast('새 비밀번호를 입력하세요');return}
      if(newPw!==newPw2){toast('새 비밀번호가 일치하지 않습니다');return}
      acc[U].pw=newPw;
    }

    Auth.saveAccounts(acc);

    // 상단바 업데이트
    var TS=Engine.TS();
    document.getElementById('tSub').textContent=TS[U]+(Engine.TD()[U].h?' · '+Engine.TD()[U].h+'시수':'');

    toast('프로필 저장됨');
    render();
  }

  return{render:render,save:save};
})();
