// pages/home.js — 홈 대시보드
var PageHome=(function(){
  var ck;
  function render(){
    var U=App.getUser(),today=Engine.today(),np=Engine.nowP(),wk=Store.weekKey();
    var cnt=0;if(today)for(var p=0;p<DP[today];p++){if(Engine.slot(U,today,p))cnt++}
    var tasks=Store.getTasks(),tc=0;for(var d in tasks){var a=tasks[d]||[];for(var i=0;i<a.length;i++)if(!a[i].done)tc++}
    var hist=Store.getSwapHistory().filter(function(h){return h.status==='applied'&&h.week===wk});

    var h='<div class="dash-now"><div><div class="now-time" id="nTime">--:--</div><div class="now-label" id="nPer">--</div><div class="now-detail" id="nCls"></div></div><div id="nNext" style="text-align:right"></div></div>';
    h+='<div class="dash-grid">';
    h+='<div class="d-card" onclick="Router.go(\'my\')"><div class="d-icon">📅</div><div class="d-label">내 시간표</div><div class="d-desc">주차별 시간표 확인</div><div class="d-badge">오늘 '+cnt+'교시</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'full\')"><div class="d-icon">🏫</div><div class="d-label">전체 시간표</div><div class="d-desc">빈 시간 교사 확인</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'swap\')"><div class="d-icon">🔄</div><div class="d-label">수업 교체</div><div class="d-desc">교체+자동 기록</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'history\')"><div class="d-icon">📜</div><div class="d-label">교체 기록</div><div class="d-desc">이번주 '+hist.length+'건 교체</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'weekly\')"><div class="d-icon">📋</div><div class="d-label">주간 업무</div><div class="d-desc">구글 캘린더 연동</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'meal\')"><div class="d-icon">🍱</div><div class="d-label">급식</div><div class="d-desc">오늘 식단 확인</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'schedule\')"><div class="d-icon">📆</div><div class="d-label">학사일정</div><div class="d-desc">학교 일정</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'tasks\')"><div class="d-icon">✅</div><div class="d-label">할 일</div><div class="d-desc">미완료 '+tc+'건</div></div>';
    h+='</div>';
    // Today mini timetable
    h+='<div class="card"><div class="card-h">📅 오늘 시간표</div>';
    if(!today)h+='<p style="color:var(--tx2);font-size:.88em">오늘은 수업이 없습니다.</p>';
    else{
      h+='<table class="tt"><thead><tr>';
      for(var p=0;p<DP[today];p++)h+='<th>'+(p+1)+'교시<br><span style="font-weight:400;font-size:.78em">'+PT[p].s+'</span></th>';
      h+='</tr></thead><tbody><tr>';
      for(var p=0;p<DP[today];p++){
        var cl=Engine.slot(U,today,p),cls='',sj='';
        var isS=Engine.isSwapped(U,today,p,wk);
        if(p===np)cls='now-c';else if(cl)cls=isS?'swapped':'my';else cls='emp';
        if(cl&&CS[cl])sj=CS[cl][today][p]||'';else if(cl)sj=cl;
        h+='<td class="'+cls+'">'+(cl?(cl.replace(/^\d/,'')+'<br><span style="font-size:.78em">'+sj+'</span>'):'—')+'</td>';
      }
      h+='</tr></tbody></table>';
    }
    h+='</div>';
    document.getElementById('pg').innerHTML=h;
    uNow();
    if(ck)clearInterval(ck);ck=setInterval(uNow,15000);
  }
  function uNow(){
    var now=new Date(),hh=now.getHours(),mm=now.getMinutes();
    var el=document.getElementById('nTime');if(el)el.textContent=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
    var U=App.getUser(),today=Engine.today(),np=Engine.nowP();
    var ep=document.getElementById('nPer'),ec=document.getElementById('nCls'),en=document.getElementById('nNext');
    if(!ep)return;
    if(!today){ep.textContent='주말';ec.textContent='';if(en)en.innerHTML='';return}
    if(np>=0){var cl=Engine.slot(U,today,np),sj='';if(cl&&CS[cl])sj=CS[cl][today][np]||cl;else if(cl)sj=cl;
      ep.textContent=(np+1)+'교시 수업 중';ec.textContent=cl?(cl+' — '+sj):'빈 시간';
    }else{var t=hh*60+mm;ep.textContent=t<530?'출근 전':t<550?'등교 시간':'수업 종료';ec.textContent=''}
    if(en&&today){var found=false;for(var p=(np>=0?np+1:0);p<DP[today];p++){var cl=Engine.slot(U,today,p);if(cl){var sj='';if(CS[cl])sj=CS[cl][today][p]||cl;else sj=cl;en.innerHTML='<div style="color:var(--tx3);font-size:.78em">다음</div><div style="font-weight:600;font-size:.9em">'+(p+1)+'교시 '+cl+'</div><div style="color:var(--tx2);font-size:.8em">'+sj+'</div>';found=true;break}}
      if(!found)en.innerHTML='<div style="color:var(--tx3);font-size:.82em">남은 수업 없음</div>'}
  }
  return{render:render};
})();
