// pages/profile.js — 마이페이지 (과목+시간표+방과후+비밀번호 통합)
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

    // 수업 반 목록
    var myClasses={};
    if(TD[U]){for(var i=0;i<TD[U].s.length;i++){var c=TD[U].s[i];if(c&&c!=='동아리')myClasses[c]=1}}

    // 방과후
    var after=Store.get('after-'+U,[]);
    var activeAfter=after.filter(function(a){if(!a.from&&!a.to)return true;var now=new Date().toISOString().slice(0,10);return(!a.from||now>=a.from)&&(!a.to||now<=a.to)});
    var afterCount=0;for(var i=0;i<activeAfter.length;i++){if(activeAfter[i].p8)afterCount++;if(activeAfter[i].p9)afterCount++}

    var h='';

    // ── 프로필 요약 ──
    h+='<div class="card"><div class="card-h">👤 '+U+'</div>';
    h+='<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:.9em">';
    h+='<div><span style="color:var(--tx2)">과목:</span> <b>'+(mySubj||autoSubj)+'</b></div>';
    h+='<div><span style="color:var(--tx2)">정규:</span> <b>'+TD[U].h+'h</b></div>';
    if(afterCount)h+='<div><span style="color:var(--purple)">방과후:</span> <b>'+afterCount+'h</b></div>';
    h+='<div><span style="color:var(--tx2)">권한:</span> '+(myAcc.role==='admin'?'🔧 관리자':'👤 일반')+'</div>';
    h+='<div><span style="color:var(--tx2)">수업 반:</span> <span style="font-size:.85em">'+Object.keys(myClasses).join(', ')+'</span></div>';
    h+='</div></div>';

    // ── 과목·아이디 수정 ──
    h+='<div class="card"><div class="card-h">✏️ 기본 정보 수정</div>';
    h+='<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px">';
    h+='<div style="flex:1;min-width:140px"><div style="font-size:.78em;color:var(--tx2);margin-bottom:2px">📚 과목</div>';
    h+='<input class="ti-input" id="prSubj" value="'+mySubj+'" placeholder="'+autoSubj+' (빈칸=자동)"></div>';
    h+='<div style="flex:1;min-width:140px"><div style="font-size:.78em;color:var(--tx2);margin-bottom:2px">🆔 아이디</div>';
    h+='<input class="ti-input" id="prId" value="'+myAcc.id+'"></div>';
    h+='</div>';
    h+='<div style="font-size:.78em;color:var(--tx2);margin-bottom:2px">🔑 비밀번호 변경 (변경 안 하려면 빈칸)</div>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">';
    h+='<input class="ti-input" id="prPwCur" type="password" placeholder="현재 비번" style="max-width:130px">';
    h+='<input class="ti-input" id="prPwNew" type="password" placeholder="새 비번" style="max-width:130px">';
    h+='<input class="ti-input" id="prPwNew2" type="password" placeholder="새 비번 확인" style="max-width:130px">';
    h+='</div>';
    h+='<button class="a-btn primary" onclick="PageProfile.saveInfo()">💾 기본 정보 저장</button>';
    h+='</div>';

    // ── 내 시간표 직접 편집 ──
    h+='<div class="card"><div class="card-h">📅 내 시간표 편집</div>';
    h+='<p style="color:var(--tx2);font-size:.82em;margin-bottom:8px">각 칸의 <b>반</b>(위)과 <b>과목</b>(아래)을 입력하세요.</p>';
    var t=TD_A[U]||TD_B[U];
    if(!t){t={h:0,s:new Array(32).fill(null)};TD_A[U]=t;TD_B[U]={h:0,s:new Array(32).fill(null)}}
    var mySubjs=Store.get('tt-subj-'+U,{});
    if(t){
      h+='<div style="overflow-x:auto"><table class="a-table" style="font-size:.82em"><thead><tr><th></th>';
      for(var di=0;di<5;di++)h+='<th>'+DAYS[di]+'</th>';
      h+='</tr></thead><tbody>';
      for(var p=0;p<7;p++){
        h+='<tr><th style="background:var(--bg2);font-size:.82em">'+(p+1)+'교시<br><span style="font-weight:400;color:var(--tx3)">'+PT[p].s+'</span></th>';
        for(var di=0;di<5;di++){var d=DAYS[di];
          if(p>=DP[d]){h+='<td style="background:var(--bg3)">—</td>';continue}
          var si=Engine.si(d,p);
          var val=t.s[si]||'';
          var autoSubj='';if(val&&CS[val]&&CS[val][d])autoSubj=CS[val][d][p]||'';
          var custSubj=mySubjs[String(si)]||'';
          h+='<td style="padding:2px">';
          h+='<input class="ti-input" style="padding:2px 4px;font-size:.82em;text-align:center;margin-bottom:1px'+(val?';background:#e8f0fe':'')+'" value="'+val+'" data-si="'+si+'" data-type="cls" placeholder="반">';
          h+='<input class="ti-input" style="padding:2px 4px;font-size:.75em;text-align:center;color:var(--blue)" value="'+(custSubj||autoSubj)+'" data-si="'+si+'" data-type="subj" placeholder="과목">';
          h+='</td>';
        }
        h+='</tr>';
      }
      h+='</tbody></table></div>';
      h+='<div style="margin-top:8px;display:flex;gap:6px">';
      h+='<button class="a-btn primary" onclick="PageProfile.saveTT()">💾 시간표 저장</button>';
      h+='<button class="a-btn outline" onclick="PageProfile.resetTT()">↩️ 초기화</button>';
      h+='</div>';
    }
    h+='</div>';

    // ── 방과후 ──
    h+='<div class="card"><div class="card-h">🌙 방과후 수업</div>';
    h+='<p style="color:var(--tx2);font-size:.82em;margin-bottom:8px">기간을 설정하면 해당 기간에만 표시됩니다.</p>';
    // 현재 목록
    if(after.length){
      for(var i=0;i<after.length;i++){var a=after[i];
        var now=new Date().toISOString().slice(0,10);
        var expired=false;if(a.from&&now<a.from)expired=true;if(a.to&&now>a.to)expired=true;
        h+='<div style="display:flex;align-items:center;gap:6px;padding:6px;border:1px solid var(--bd);border-radius:6px;margin-bottom:4px;font-size:.85em;opacity:'+(expired?.4:1)+'">';
        h+='<b>'+a.day+'</b> ';
        if(a.p8)h+='8교시:'+a.p8+' ';
        if(a.p9)h+='9교시:'+a.p9+' ';
        h+='<span style="color:var(--tx3);font-size:.82em;margin-left:auto">'+(a.from||'~')+' ~ '+(a.to||'~')+(expired?' (만료)':'')+'</span>';
        h+='<button class="a-btn danger sm" onclick="PageProfile.delAfter('+i+')">✕</button></div>';
      }
    }else{h+='<div style="color:var(--tx3);font-size:.85em;margin-bottom:8px">등록된 방과후 없음</div>'}
    // 추가 폼
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-end;margin-top:8px">';
    h+='<div><div style="font-size:.72em;color:var(--tx2)">요일</div><select class="ti-sel" id="afDay"><option>월</option><option>화</option><option>수</option><option>목</option><option>금</option></select></div>';
    h+='<div><div style="font-size:.72em;color:var(--tx2)">8교시</div><input class="ti-input" id="afP8" placeholder="반명" style="width:70px"></div>';
    h+='<div><div style="font-size:.72em;color:var(--tx2)">9교시</div><input class="ti-input" id="afP9" placeholder="반명" style="width:70px"></div>';
    h+='<div><div style="font-size:.72em;color:var(--tx2)">시작</div><input class="ti-input" id="afFrom" type="date" style="width:120px"></div>';
    h+='<div><div style="font-size:.72em;color:var(--tx2)">종료</div><input class="ti-input" id="afTo" type="date" style="width:120px"></div>';
    h+='<button class="a-btn success" onclick="PageProfile.addAfter()">추가</button>';
    h+='</div></div>';

    document.getElementById('pg').innerHTML=h;
  }

  // 기본 정보 저장 (과목 + 아이디 + 비번)
  function saveInfo(){
    var U=App.getUser();
    var acc=Auth.getAccounts();if(!acc[U])return;

    // 과목
    var subj=document.getElementById('prSubj').value.trim();
    var subjOv=Store.get('subj-ov',{});
    if(subj){subjOv[U]=subj}else{delete subjOv[U]}
    Store.set('subj-ov',subjOv);

    // 아이디
    var newId=document.getElementById('prId').value.trim();
    if(newId)acc[U].id=newId;

    // 비밀번호
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
    Engine.rebuild();
    // 상단바 업데이트
    document.getElementById('tSub').textContent=Engine.TS()[U]+(Engine.TD()[U].h?' · '+Engine.TD()[U].h+'시수':'');
    toast('저장됨');render();
  }

  // 시간표 저장 (반 + 과목)
  function saveTT(){
    var U=App.getUser();
    if(!TD_A[U])return;
    var clsInputs=document.querySelectorAll('[data-si][data-type="cls"]');
    var subjInputs=document.querySelectorAll('[data-si][data-type="subj"]');
    // 반 저장
    for(var i=0;i<clsInputs.length;i++){
      var si=parseInt(clsInputs[i].dataset.si);
      var val=clsInputs[i].value.trim();
      TD_A[U].s[si]=val||null;
    }
    // 과목 저장
    var mySubjs={};
    for(var i=0;i<subjInputs.length;i++){
      var si=subjInputs[i].dataset.si;
      var val=subjInputs[i].value.trim();
      if(val)mySubjs[si]=val;
    }
    Store.set('tt-subj-'+U,mySubjs);
    // 시수 계산
    var cnt=0;for(var j=0;j<TD_A[U].s.length;j++){if(TD_A[U].s[j])cnt++}
    TD_A[U].h=cnt;
    Store.set('td-custom-'+U,{h:cnt,s:TD_A[U].s});
    Store.set('myedit-'+U,{});
    Engine.rebuild();
    document.getElementById('tSub').textContent=Engine.TS()[U]+' · '+cnt+'시수';
    toast('시간표+과목 저장됨 ('+cnt+'시수)');
    render();
  }

  function resetTT(){
    if(!confirm('시간표를 원본으로 되돌릴까요?'))return;
    Store.remove('td-custom-'+App.getUser());
    Store.remove('myedit-'+App.getUser());
    toast('새로고침하면 원본으로 복원됩니다');
  }

  // 방과후
  function addAfter(){
    var U=App.getUser();
    var data=Store.get('after-'+U,[]);
    var day=document.getElementById('afDay').value;
    var p8=document.getElementById('afP8').value.trim();
    var p9=document.getElementById('afP9').value.trim();
    var from=document.getElementById('afFrom').value;
    var to=document.getElementById('afTo').value;
    if(!p8&&!p9){toast('8교시 또는 9교시 입력');return}
    data.push({day:day,p8:p8,p9:p9,from:from,to:to});
    Store.set('after-'+U,data);
    toast(day+' 방과후 추가됨');render();
  }

  function delAfter(idx){
    var U=App.getUser();
    var data=Store.get('after-'+U,[]);
    data.splice(idx,1);
    Store.set('after-'+U,data);
    toast('삭제됨');render();
  }

  return{render:render,saveInfo:saveInfo,saveTT:saveTT,resetTT:resetTT,addAfter:addAfter,delAfter:delAfter};
})();
