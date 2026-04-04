// pages/home.js — 홈 대시보드 (주간업무 오늘 요약 + 앞뒤 이동 + 할일 통합)
var PageHome=(function(){
  var ck;
  var calDayOff=0; // 0=오늘, -1=어제, +1=내일 (주간업무 날짜 이동)

  function getTargetDate(off){
    var d=new Date();
    d.setDate(d.getDate()+off);
    return d;
  }

  function resolveSwapWeek(item){
    if(item && item.week) return String(item.week);
    if(item && item.classDate){
      var classDate=new Date(item.classDate+'T00:00:00');
      if(!isNaN(classDate.getTime())) return Store.weekKey(classDate);
    }
    if(item && item.date){
      var savedAt=new Date(item.date);
      if(!isNaN(savedAt.getTime())) return Store.weekKey(savedAt);
    }
    return '';
  }

  function render(){
    var U=App.getUser(), today=Engine.today(), np=Engine.nowP(), wk=Store.weekKey();
    var cnt=0;
    if(today) for(var p=0;p<DP[today];p++){if(Engine.slot(U,today,p))cnt++}
    var tasks=Store.getTasks(), tc=0;
    for(var d in tasks){var a=tasks[d]||[];for(var i=0;i<a.length;i++)if(!a[i].done)tc++}
    var hist=Store.getSwapHistory().filter(function(h){
      return h && h.status==='applied' && resolveSwapWeek(h)===wk;
    });

    var h='';

    // ── 현재 시간 배너 ──
    h+='<div class="dash-now"><div>';
    h+='<div class="now-time" id="nTime">--:--</div>';
    h+='<div class="now-label" id="nPer">--</div>';
    h+='<div class="now-detail" id="nCls"></div>';
    h+='</div><div id="nNext" style="text-align:right"></div></div>';

    // ── 바로가기 그리드 ──
    h+='<div class="dash-grid">';
    h+='<div class="d-card" onclick="Router.go(\'my\')"><div class="d-icon">📅</div><div class="d-label">내 시간표</div><div class="d-desc">주차별 확인·편집</div><div class="d-badge">오늘 '+cnt+'교시</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'full\')"><div class="d-icon">🏫</div><div class="d-label">전체 시간표</div><div class="d-desc">학년별·빈시간·협의</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'swap\')"><div class="d-icon">🔄</div><div class="d-label">수업 교체</div><div class="d-desc">교체+기록 저장</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'weekly\')"><div class="d-icon">📋</div><div class="d-label">주간 업무</div><div class="d-desc">구글캘린더 연동</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'meal\')"><div class="d-icon">🍱</div><div class="d-label">급식</div><div class="d-desc">조식·중식·석식</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'schedule\')"><div class="d-icon">📆</div><div class="d-label">학사일정</div><div class="d-desc">학교 일정</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'history\')"><div class="d-icon">📜</div><div class="d-label">교체 기록</div><div class="d-desc">이번주 '+hist.length+'건</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'tasks\')"><div class="d-icon">✅</div><div class="d-label">할 일</div><div class="d-desc">미완료 '+tc+'건</div></div>';
    h+='</div>';

    // ── 하단 3열 레이아웃 ──
    h+='<div class="home-3col" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:2px">';

    // 열1: 오늘 내 시간표
    h+='<div class="card" style="margin-bottom:0">';
    h+='<div class="card-h">📅 오늘 시간표</div>';
    if(!today){
      h+='<p style="color:var(--tx2);font-size:.88em">주말입니다.</p>';
    }else{
      h+='<table class="tt" style="font-size:.78em"><thead><tr>';
      for(var p=0;p<DP[today];p++) h+='<th>'+(p+1)+'교시<br><span style="font-weight:400;font-size:.85em">'+PT[p].s+'</span></th>';
      h+='</tr></thead><tbody><tr>';
      for(var p=0;p<DP[today];p++){
        var cl=Engine.slot(U,today,p), cls_=p===np?'now-c':cl?'my':'emp', sj='';
        var _hSj=Store.get('tt-subj-'+U,{});
        if(cl&&CS[cl]) sj=CS[cl][today][p]||'';
        else if(cl) sj=cl;
        var _hk=String(Engine.si(today,p));
        if(_hSj[_hk]) sj=_hSj[_hk];
        h+='<td class="'+cls_+'">'+(cl?(cl.replace(/^\d/,'')+'<br><span style="font-size:.76em">'+sj+'</span>'):'—')+'</td>';
      }
      h+='</tr></tbody></table>';
    }
    h+='</div>';

    // 열2: 주간업무 (날짜 이동 가능)
    var targetDate=getTargetDate(calDayOff);
    var targetYmd=Neis.ymd(targetDate);
    var isTargetToday=(calDayOff===0);
    var dow=['일','월','화','수','목','금','토'][targetDate.getDay()];
    var dateLabel=(targetDate.getMonth()+1)+'/'+targetDate.getDate()+' ('+dow+')';

    h+='<div class="card" style="margin-bottom:0">';
    h+='<div class="card-h" style="justify-content:space-between">';
    h+='<span>📋 주간업무</span>';
    h+='<div style="display:flex;align-items:center;gap:4px">';
    h+='<button class="a-btn outline sm" onclick="PageHome.calPrev()" style="padding:2px 7px">◀</button>';
    h+='<span style="font-size:.78em;min-width:80px;text-align:center;color:'+(isTargetToday?'var(--blue)':'var(--tx2)')+';font-weight:'+(isTargetToday?700:500)+'">'+dateLabel+'</span>';
    h+='<button class="a-btn outline sm" onclick="PageHome.calNext()" style="padding:2px 7px">▶</button>';
    if(!isTargetToday) h+='<button class="a-btn outline sm" onclick="PageHome.calToday()" style="padding:2px 7px;font-size:.72em">오늘</button>';
    h+='</div></div>';
    h+='<div id="homeWeekly" style="color:var(--tx3);font-size:.83em;min-height:60px">불러오는 중...</div>';
    h+='<div style="margin-top:6px"><button class="a-btn outline sm" onclick="Router.go(\'weekly\')" style="width:100%;font-size:.78em">전체 주간업무 →</button></div>';
    h+='</div>';

    // 열3: 할일 요약
    h+='<div class="card" style="margin-bottom:0">';
    h+='<div class="card-h">✅ 오늘 할 일<span class="right"><button class="a-btn outline sm" onclick="Router.go(\'tasks\')">전체 →</button></span></div>';
    var dayMap={'월':'mon','화':'tue','수':'wed','목':'thu','금':'fri'};
    var todayKey=today;
    var todayTasks=tasks[todayKey]||[];
    var otherUndone=[];
    for(var dd in tasks){
      if(dd===todayKey) continue;
      (tasks[dd]||[]).forEach(function(t){if(!t.done)otherUndone.push({day:dd,task:t})});
    }

    if(!todayTasks.length&&!otherUndone.length){
      h+='<div style="color:var(--tx3);font-size:.84em;padding:8px 0">등록된 할 일 없음</div>';
    }else{
      // 오늘 할일
      if(todayTasks.length){
        h+='<div style="font-size:.78em;font-weight:600;color:var(--blue);margin-bottom:4px">'+today+'요일</div>';
        todayTasks.slice(0,4).forEach(function(t){
          h+='<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--bg2)">';
          h+='<div style="width:14px;height:14px;border-radius:50%;border:2px solid '+(t.done?'var(--green)':'var(--bd)')+
            ';background:'+(t.done?'var(--green)':'')+';flex-shrink:0"></div>';
          h+='<div style="flex:1;font-size:.84em;'+(t.done?'text-decoration:line-through;opacity:.4':'')+'">'+t.text+'</div>';
          if(t.time) h+='<div style="font-size:.74em;color:var(--tx3)">'+t.time+'</div>';
          h+='</div>';
        });
        if(todayTasks.length>4) h+='<div style="font-size:.76em;color:var(--tx3);padding:2px 0">외 '+(todayTasks.length-4)+'건...</div>';
      }
      // 미완료 요약
      if(otherUndone.length){
        h+='<div style="margin-top:6px;padding:5px 8px;background:var(--bg2);border-radius:6px;font-size:.79em;color:var(--tx2)">';
        h+='다른 요일 미완료 <b style="color:var(--red)">'+otherUndone.length+'건</b></div>';
      }

      // 빠른 추가
      h+='<div style="display:flex;gap:4px;margin-top:8px">';
      h+='<input class="ti-input" id="homeTaskInput" placeholder="할 일 빠른 추가..." style="flex:1;padding:6px 8px;font-size:.82em" onkeydown="if(event.key===\'Enter\')PageHome.quickAddTask()">';
      h+='<button class="a-btn primary" onclick="PageHome.quickAddTask()" style="padding:6px 10px;font-size:.82em">+</button>';
      h+='</div>';
    }
    h+='</div>';

    h+='</div>'; // 3열 그리드 끝

    // ── 하단: 급식 + 학사일정 가로 ──
    h+='<div class="home-2col" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">';

    // 급식
    h+='<div class="card" style="margin-bottom:0">';
    h+='<div class="card-h">🍱 오늘 급식<span class="right"><button class="a-btn outline sm" onclick="Router.go(\'meal\')">전체 →</button></span></div>';
    h+='<div id="homeMeal" style="color:var(--tx3);font-size:.83em">불러오는 중...</div>';
    h+='</div>';

    // 학사일정
    h+='<div class="card" style="margin-bottom:0">';
    h+='<div class="card-h">📆 오늘 학사일정<span class="right"><button class="a-btn outline sm" onclick="Router.go(\'schedule\')">전체 →</button></span></div>';
    h+='<div id="homeSched" style="color:var(--tx3);font-size:.83em">불러오는 중...</div>';
    h+='</div>';

    h+='</div>';

    // 공지사항
    var notices=Store.get('notices',[]);
    if(notices.length){
      h+='<div class="card" style="margin-top:10px">';
      h+='<div class="card-h">📢 공지사항</div>';
      for(var ni=0;ni<Math.min(notices.length,3);ni++){
        var nt=notices[ni];
        h+='<div style="padding:6px 0;border-bottom:1px solid var(--bg2);font-size:.88em">';
        h+='<span style="font-weight:600">'+nt.title+'</span> <span style="color:var(--tx3);font-size:.78em">'+nt.date+'</span>';
        if(nt.content) h+='<div style="color:var(--tx2);font-size:.82em;margin-top:2px">'+nt.content.substring(0,80)+(nt.content.length>80?'...':'')+'</div>';
        h+='</div>';
      }
      h+='</div>';
    }

    document.getElementById('pg').innerHTML=h;
    uNow();
    if(ck) clearInterval(ck);
    ck=setInterval(uNow,15000);

    // 주간업무 로드 (Google Calendar 공개 캐시)
    loadCalendarEvents(targetYmd);

    // 급식 로드
    var todayYmd=Neis.ymd(new Date());
    Neis.getMeals(todayYmd,todayYmd,function(meals){
      var el=document.getElementById('homeMeal');if(!el)return;
      if(!meals.length){el.innerHTML='<span style="color:var(--tx3)">오늘 급식 정보 없음</span>';return}
      var typeIcons={'조식':'🌅','중식':'☀️','석식':'🌙'};
      var mh='<div style="display:flex;gap:8px;flex-wrap:wrap">';
      meals.forEach(function(m){
        var items=m.menu.replace(/<br\/>/g,'\n').split('\n')
          .map(function(s){return s.replace(/\d+\.\s*/g,'').replace(/[()]/g,'').trim()})
          .filter(function(s){return s});
        mh+='<div style="flex:1;min-width:110px;padding:8px;background:var(--bg2);border-radius:var(--radius-sm)">';
        mh+='<div style="font-weight:700;font-size:.82em;margin-bottom:3px">'+(typeIcons[m.type]||'')+' '+m.type+'</div>';
        items.slice(0,5).forEach(function(item){mh+='<div style="font-size:.79em">'+item+'</div>'});
        if(items.length>5) mh+='<div style="font-size:.75em;color:var(--tx3)">+더보기</div>';
        if(m.cal) mh+='<div style="font-size:.72em;color:var(--tx3);margin-top:2px">🔥 '+m.cal+'</div>';
        mh+='</div>';
      });
      mh+='</div>';
      el.innerHTML=mh;
    });

    // 학사일정 로드
    Neis.getSchedule(todayYmd,todayYmd,function(events){
      var el=document.getElementById('homeSched');if(!el)return;
      if(!events.length){el.innerHTML='<span style="color:var(--tx3)">오늘 학사일정 없음</span>';return}
      var sh='';
      var seen={};
      events.forEach(function(ev){
        if(seen[ev.name])return;seen[ev.name]=1;
        var color=ev.type==='휴업일'?'var(--red)':'var(--green)';
        sh+='<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:.85em">';
        sh+='<span style="width:7px;height:7px;border-radius:50%;background:'+color+';flex-shrink:0"></span>';
        sh+=(ev.type==='휴업일'?'<span style="color:var(--red);font-weight:600">휴업</span> ':'')+ev.name;
        sh+='</div>';
      });
      el.innerHTML=sh;
    });
  }

  // 구글캘린더 공개 캐시에서 주간업무 로드
  function loadCalendarEvents(targetYmd){
    var el=document.getElementById('homeWeekly');
    if(!el) return;

    // 1. localStorage 캐시에서 먼저 (빠른 표시)
    var events=null;
    try{
      var raw=localStorage.getItem('weekly-public-events-v2');
      if(raw){
        var parsed=JSON.parse(raw);
        if(parsed&&parsed.events&&parsed.events.length){
          events=parsed.events;
          renderWeeklyOnHome(events,targetYmd);
        }
      }
    }catch(e){}

    // 2. Firebase에서 최신 로드 (비동기)
    try{
      if(typeof firebase!=='undefined'&&firebase.apps&&firebase.apps.length){
        var fb=firebase.firestore();
        fb.collection('portal').doc('weekly-events').get().then(function(doc){
          if(doc.exists&&doc.data()&&doc.data().events&&doc.data().events.length){
            var freshEvents=doc.data().events;
            // localStorage 갱신
            try{localStorage.setItem('weekly-public-events-v2',JSON.stringify({savedAt:Date.now(),events:freshEvents}))}catch(e2){}
            var el2=document.getElementById('homeWeekly');
            if(el2) renderWeeklyOnHome(freshEvents,targetYmd);
          }else if(!events){
            // 캐시도 없고 Firebase도 없음
            var el2=document.getElementById('homeWeekly');
            if(el2) el2.innerHTML=
              '<div style="color:var(--tx3);font-size:.82em;padding:4px 0">' +
              '📋 주간업무 탭에서 관리자 로그인 후<br>새로고침하면 여기에 표시됩니다.' +
              '</div>';
          }
        }).catch(function(){
          if(!events){
            var el2=document.getElementById('homeWeekly');
            if(el2) el2.innerHTML='<span style="color:var(--tx3);font-size:.82em">데이터 없음 — 주간업무 탭 확인</span>';
          }
        });
      }else if(!events){
        el.innerHTML='<span style="color:var(--tx3);font-size:.82em">Firebase 초기화 대기 중...</span>';
        // 1초 후 재시도
        setTimeout(function(){loadCalendarEvents(targetYmd)},1000);
      }
    }catch(e){
      if(!events){
        el.innerHTML='<span style="color:var(--tx3);font-size:.82em">주간업무 탭에서 확인하세요</span>';
      }
    }
  }

  function renderWeeklyOnHome(events,targetYmd){
    var el=document.getElementById('homeWeekly');
    if(!el) return;

    // targetYmd 형식: "20260324" → 비교용
    var filtered=events.filter(function(ev){
      var startDate=ev.start?ev.start.slice(0,10).replace(/-/g,''):'';
      var endDate=ev.end?ev.end.slice(0,10).replace(/-/g,''):'';
      return startDate<=targetYmd&&endDate>=targetYmd;
    });

    if(!filtered.length){
      el.innerHTML='<span style="color:var(--tx3);font-size:.83em">이 날 일정 없음</span>';
      return;
    }

    var h='<div style="display:flex;flex-direction:column;gap:4px">';
    filtered.forEach(function(ev){
      var title=ev.title?(ev.title.replace(/\[[^\]]+\]\s*/,'')):'';
      var dept=ev.department||'';
      var color=ev.departmentColor||'var(--blue)';
      var time='';
      if(!ev.isAllDay&&ev.start){
        var st=new Date(ev.start);
        var et=new Date(ev.end);
        var pad=function(n){return String(n).padStart(2,'0')};
        time=pad(st.getHours())+':'+pad(st.getMinutes())+'~'+pad(et.getHours())+':'+pad(et.getMinutes());
      }else{
        time='종일';
      }
      h+='<div style="display:flex;align-items:flex-start;gap:6px;padding:5px 6px;background:var(--bg2);border-radius:6px;border-left:3px solid '+color+'">';
      h+='<div style="flex:1;min-width:0">';
      h+='<div style="font-size:.8em;font-weight:600;color:'+color+'">'+dept+'</div>';
      h+='<div style="font-size:.84em;font-weight:500;word-break:keep-all">'+title+'</div>';
      if(ev.location) h+='<div style="font-size:.75em;color:var(--tx3)">📍'+ev.location+'</div>';
      h+='</div>';
      h+='<div style="font-size:.75em;color:var(--tx2);white-space:nowrap;padding-top:2px">'+time+'</div>';
      h+='</div>';
    });
    h+='</div>';
    el.innerHTML=h;
  }

  function uNow(){
    var now=new Date(),hh=now.getHours(),mm=now.getMinutes();
    var el=document.getElementById('nTime');
    if(el) el.textContent=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
    var U=App.getUser(),today=Engine.today(),np=Engine.nowP();
    var ep=document.getElementById('nPer'),ec=document.getElementById('nCls'),en=document.getElementById('nNext');
    if(!ep) return;
    if(!today){ep.textContent='주말';ec.textContent='';if(en)en.innerHTML='';return}
    if(np>=0){
      var cl=Engine.slot(U,today,np),sj='';
      if(cl&&CS[cl])sj=CS[cl][today][np]||cl;else if(cl)sj=cl;
      ep.textContent=(np+1)+'교시 수업 중';
      ec.textContent=cl?(cl+' — '+sj):'빈 시간';
    }else{
      var t=hh*60+mm;
      ep.textContent=t<530?'출근 전':t<550?'등교 시간':'수업 종료';
      ec.textContent='';
    }
    if(en&&today){
      var found=false;
      for(var p=(np>=0?np+1:0);p<DP[today];p++){
        var cl=Engine.slot(U,today,p);
        if(cl){
          var sj='';if(CS[cl])sj=CS[cl][today][p]||cl;else sj=cl;
          en.innerHTML='<div style="color:var(--tx3);font-size:.78em">다음</div>'+
            '<div style="font-weight:600;font-size:.9em">'+(p+1)+'교시 '+cl+'</div>'+
            '<div style="color:var(--tx2);font-size:.8em">'+sj+'</div>';
          found=true;break;
        }
      }
      if(!found) en.innerHTML='<div style="color:var(--tx3);font-size:.82em">남은 수업 없음</div>';
    }
  }

  return{
    render:render,
    calPrev:function(){calDayOff--;render()},
    calNext:function(){calDayOff++;render()},
    calToday:function(){calDayOff=0;render()},
    quickAddTask:function(){
      var input=document.getElementById('homeTaskInput');
      if(!input||!input.value.trim())return;
      var today=Engine.today()||'월';
      var tasks=Store.getTasks();
      if(!tasks[today]) tasks[today]=[];
      tasks[today].push({text:input.value.trim(),time:'',done:false});
      Store.setTasks(tasks);
      toast('할 일 추가됨');
      render();
    }
  };
})();
