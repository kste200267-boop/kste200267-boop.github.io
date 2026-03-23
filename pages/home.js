// pages/home.js — 홈 대시보드 (오늘 급식/일정 요약 포함)
var PageHome=(function(){
  var ck;
  function render(){
    var U=App.getUser(),today=Engine.today(),np=Engine.nowP(),wk=Store.weekKey();
    var cnt=0;if(today)for(var p=0;p<DP[today];p++){if(Engine.slot(U,today,p))cnt++}
    var tasks=Store.getTasks(),tc=0;for(var d in tasks){var a=tasks[d]||[];for(var i=0;i<a.length;i++)if(!a[i].done)tc++}
    var hist=Store.getSwapHistory().filter(function(h){return h.status==='applied'&&h.week===wk});

    var h='<div class="dash-now"><div><div class="now-time" id="nTime">--:--</div><div class="now-label" id="nPer">--</div><div class="now-detail" id="nCls"></div></div><div id="nNext" style="text-align:right"></div></div>';

    // 바로가기 카드
    h+='<div class="dash-grid">';
    h+='<div class="d-card" onclick="Router.go(\'my\')"><div class="d-icon">📅</div><div class="d-label">내 시간표</div><div class="d-desc">주차별 확인·편집</div><div class="d-badge">오늘 '+cnt+'교시</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'full\')"><div class="d-icon">🏫</div><div class="d-label">전체 시간표</div><div class="d-desc">빈시간·협의 매칭</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'swap\')"><div class="d-icon">🔄</div><div class="d-label">수업 교체</div><div class="d-desc">교체+기록 저장</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'weekly\')"><div class="d-icon">📋</div><div class="d-label">주간 업무</div><div class="d-desc">구글캘린더 연동</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'meal\')"><div class="d-icon">🍱</div><div class="d-label">급식</div><div class="d-desc">조식·중식·석식</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'schedule\')"><div class="d-icon">📆</div><div class="d-label">학사일정</div><div class="d-desc">학교 일정</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'history\')"><div class="d-icon">📜</div><div class="d-label">교체 기록</div><div class="d-desc">이번주 '+hist.length+'건</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'tasks\')"><div class="d-icon">✅</div><div class="d-label">할 일</div><div class="d-desc">미완료 '+tc+'건</div></div>';
    h+='</div>';

    // 오늘 시간표
    h+='<div class="card"><div class="card-h">📅 오늘 시간표</div>';
    if(!today)h+='<p style="color:var(--tx2);font-size:.88em">주말입니다.</p>';
    else{
      h+='<table class="tt"><thead><tr>';
      for(var p=0;p<DP[today];p++)h+='<th>'+(p+1)+'교시<br><span style="font-weight:400;font-size:.78em">'+PT[p].s+'</span></th>';
      h+='</tr></thead><tbody><tr>';
      for(var p=0;p<DP[today];p++){
        var cl=Engine.slot(U,today,p),cls=p===np?'now-c':cl?'my':'emp',sj='';
        var _hSj=Store.get('tt-subj-'+U,{});if(cl&&CS[cl])sj=CS[cl][today][p]||'';else if(cl)sj=cl;var _hk=String(Engine.si(today,p));if(_hSj[_hk])sj=_hSj[_hk];
        h+='<td class="'+cls+'">'+(cl?(cl.replace(/^\d/,'')+'<br><span style="font-size:.78em">'+sj+'</span>'):'—')+'</td>';
      }
      h+='</tr></tbody></table>';
    }
    h+='</div>';

    // 오늘 급식 요약
    h+='<div class="card"><div class="card-h">🍱 오늘 급식<span class="right"><button class="a-btn outline sm" onclick="Router.go(\'meal\')">전체 보기 →</button></span></div>';
    h+='<div id="homeMeal" style="color:var(--tx3);font-size:.85em">불러오는 중...</div></div>';

    // 오늘 학사일정
    h+='<div class="card"><div class="card-h">📆 오늘 학사일정<span class="right"><button class="a-btn outline sm" onclick="Router.go(\'schedule\')">전체 보기 →</button></span></div>';
    h+='<div id="homeSched" style="color:var(--tx3);font-size:.85em">불러오는 중...</div></div>';

    // 공지사항
    var notices=Store.get('notices',[]);
    if(notices.length){
      h+='<div class="card"><div class="card-h">📢 공지사항</div>';
      for(var ni=0;ni<Math.min(notices.length,3);ni++){var nt=notices[ni];
        h+='<div style="padding:6px 0;border-bottom:1px solid var(--bg2);font-size:.88em">';
        h+='<span style="font-weight:600">'+nt.title+'</span> <span style="color:var(--tx3);font-size:.78em">'+nt.date+'</span>';
        if(nt.content)h+='<div style="color:var(--tx2);font-size:.82em;margin-top:2px">'+nt.content.substring(0,80)+(nt.content.length>80?'...':'')+'</div>';
        h+='</div>';
      }
      h+='</div>';
    }

    document.getElementById('pg').innerHTML=h;
    uNow();
    if(ck)clearInterval(ck);ck=setInterval(uNow,15000);

    // 급식 로드
    var todayYmd=Neis.ymd(new Date());
    Neis.getMeals(todayYmd,todayYmd,function(meals){
      var el=document.getElementById('homeMeal');if(!el)return;
      if(!meals.length){el.innerHTML='<span style="color:var(--tx3)">오늘 급식 정보 없음</span>';return}
      var typeIcons={'조식':'🌅','중식':'☀️','석식':'🌙'};
      var mh='<div style="display:flex;gap:12px;flex-wrap:wrap">';
      for(var i=0;i<meals.length;i++){var m=meals[i];
        var items=m.menu.replace(/<br\/>/g,'\n').split('\n').map(function(s){return s.replace(/\d+\.\s*/g,'').replace(/[()]/g,'').trim()}).filter(function(s){return s});
        mh+='<div style="flex:1;min-width:140px;padding:10px;background:var(--bg2);border-radius:var(--radius-sm)">';
        mh+='<div style="font-weight:700;font-size:.85em;margin-bottom:4px">'+(typeIcons[m.type]||'')+' '+m.type+'</div>';
        for(var j=0;j<Math.min(items.length,6);j++)mh+='<div style="font-size:.82em">'+items[j]+'</div>';
        if(items.length>6)mh+='<div style="font-size:.78em;color:var(--tx3)">외 '+(items.length-6)+'개</div>';
        if(m.cal)mh+='<div style="font-size:.75em;color:var(--tx3);margin-top:3px">🔥 '+m.cal+'</div>';
        mh+='</div>';
      }
      mh+='</div>';
      el.innerHTML=mh;
    });

    // 학사일정 로드
    Neis.getSchedule(todayYmd,todayYmd,function(events){
      var el=document.getElementById('homeSched');if(!el)return;
      if(!events.length){el.innerHTML='<span style="color:var(--tx3)">오늘 학사일정 없음</span>';return}
      var sh='';
      var seen={};
      for(var i=0;i<events.length;i++){var ev=events[i];
        if(seen[ev.name])continue;seen[ev.name]=1;
        var color=ev.type==='휴업일'?'var(--red)':'var(--green)';
        sh+='<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:.88em">';
        sh+='<span style="width:8px;height:8px;border-radius:50%;background:'+color+';flex-shrink:0"></span>';
        sh+=(ev.type==='휴업일'?'<span style="color:var(--red);font-weight:600">휴업</span> ':'')+ev.name;
        sh+='</div>';
      }
      el.innerHTML=sh;
    });
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
