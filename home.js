// pages/home.js — 홈 대시보드 (좌측 메인 + 우측 주간업무 고정 패널)
var PageHome=(function(){
  var ck;
  var calDayOff=0;

  function getTargetDate(off){
    var d=new Date();d.setDate(d.getDate()+off);return d;
  }

  function render(){
    var U=App.getUser(),today=Engine.today(),np=Engine.nowP(),wk=Store.weekKey();
    var cnt=0;
    if(today) for(var p=0;p<DP[today];p++){if(Engine.slot(U,today,p))cnt++}
    var tasks=Store.getTasks(),tc=0;
    for(var d in tasks){var a=tasks[d]||[];for(var i=0;i<a.length;i++)if(!a[i].done)tc++}
    var hist=Store.getSwapHistory().filter(function(h){return h.status==='applied'&&h.week===wk});

    var targetDate=getTargetDate(calDayOff);
    var targetYmd=Neis.ymd(targetDate);
    var isToday_=(calDayOff===0);
    var dow=['일','월','화','수','목','금','토'][targetDate.getDay()];
    var dateLabel=(targetDate.getMonth()+1)+'/'+targetDate.getDate()+' ('+dow+')';

    var h='';

    // ── 현재 시간 배너 ──
    h+='<div class="dash-now"><div>';
    h+='<div class="now-time" id="nTime">--:--</div>';
    h+='<div class="now-label" id="nPer">--</div>';
    h+='<div class="now-detail" id="nCls"></div>';
    h+='</div><div id="nNext" style="text-align:right"></div></div>';

    // ── 바로가기 그리드 ──
    h+='<div class="dash-grid" style="margin-bottom:12px">';
    h+='<div class="d-card" onclick="Router.go(\'my\')"><div class="d-icon">📅</div><div class="d-label">내 시간표</div><div class="d-desc">주차별 확인·편집</div><div class="d-badge">오늘 '+cnt+'교시</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'full\')"><div class="d-icon">🏫</div><div class="d-label">전체 시간표</div><div class="d-desc">학년별·빈시간·협의</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'swap\')"><div class="d-icon">🔄</div><div class="d-label">수업 교체</div><div class="d-desc">교체+기록 저장</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'meal\')"><div class="d-icon">🍱</div><div class="d-label">급식</div><div class="d-desc">조식·중식·석식</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'schedule\')"><div class="d-icon">📆</div><div class="d-label">학사일정</div><div class="d-desc">학교 일정</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'history\')"><div class="d-icon">📜</div><div class="d-label">교체 기록</div><div class="d-desc">이번주 '+hist.length+'건</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'tasks\')"><div class="d-icon">✅</div><div class="d-label">할 일</div><div class="d-desc">미완료 '+tc+'건</div></div>';
    h+='<div class="d-card" onclick="Router.go(\'weekly\')"><div class="d-icon">📋</div><div class="d-label">주간 업무</div><div class="d-desc">구글캘린더 연동</div></div>';
    h+='</div>';

    // ── 2단 레이아웃 ──
    h+='<div class="home-main-layout" style="display:grid;grid-template-columns:1fr 320px;gap:12px;align-items:start">';

    // ── 좌측 ──
    h+='<div style="display:flex;flex-direction:column;gap:10px">';

    // 오늘 시간표
    h+='<div class="card" style="margin-bottom:0">';
    h+='<div class="card-h">📅 오늘 시간표</div>';
    if(!today){
      h+='<p style="color:var(--tx2);font-size:.88em">주말입니다.</p>';
    }else{
      h+='<div style="overflow-x:auto"><table class="tt" style="font-size:.8em"><thead><tr>';
      for(var p=0;p<DP[today];p++) h+='<th style="min-width:52px">'+(p+1)+'교시<br><span style="font-weight:400;font-size:.85em">'+PT[p].s+'</span></th>';
      h+='</tr></thead><tbody><tr>';
      for(var p=0;p<DP[today];p++){
        var cl=Engine.slot(U,today,p),cls_=p===np?'now-c':cl?'my':'emp',sj='';
        var _hSj=Store.get('tt-subj-'+U,{});
        if(cl&&CS[cl])sj=CS[cl][today][p]||'';
        else if(cl)sj=cl;
        var _hk=String(Engine.si(today,p));
        if(_hSj[_hk])sj=_hSj[_hk];
        h+='<td class="'+cls_+'">'+(cl?(cl.replace(/^\d/,'')+'<br><span style="font-size:.76em">'+sj+'</span>'):'—')+'</td>';
      }
      h+='</tr></tbody></table></div>';
    }
    h+='</div>';

    // 오늘 할일
    h+='<div class="card" style="margin-bottom:0">';
    h+='<div class="card-h">✅ 오늘 할 일<span class="right"><button class="a-btn outline sm" onclick="Router.go(\'tasks\')">전체 →</button></span></div>';
    var todayTasks=tasks[today]||[];
    var otherUndone=[];
    for(var dd in tasks){
      if(dd===today)continue;
      (tasks[dd]||[]).forEach(function(t){if(!t.done)otherUndone.push({day:dd,task:t})});
    }
    if(!todayTasks.length&&!otherUndone.length){
      h+='<div style="color:var(--tx3);font-size:.84em;padding:4px 0">등록된 할 일 없음</div>';
    }else{
      if(todayTasks.length){
        h+='<div style="display:flex;flex-direction:column;gap:2px">';
        todayTasks.forEach(function(t,ti){
          h+='<div style="display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:6px;cursor:pointer;background:var(--bg2)" onclick="PageHome.toggleTask(\''+today+'\','+ti+')">';
          h+='<div style="width:16px;height:16px;border-radius:50%;border:2px solid '+(t.done?'var(--green)':'var(--bd)')+';background:'+(t.done?'var(--green)':'')+';flex-shrink:0;display:flex;align-items:center;justify-content:center">';
          if(t.done)h+='<svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4l2 2 3-3" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
          h+='</div>';
          h+='<div style="flex:1;font-size:.85em;'+(t.done?'text-decoration:line-through;opacity:.45':'')+'">'+t.text+'</div>';
          if(t.time)h+='<div style="font-size:.74em;color:var(--tx3)">'+t.time+'</div>';
          h+='</div>';
        });
        h+='</div>';
      }
      if(otherUndone.length){
        h+='<div style="margin-top:6px;padding:5px 8px;background:var(--bg2);border-radius:6px;font-size:.79em;color:var(--tx2)">';
        h+='다른 요일 미완료 <b style="color:var(--orange)">'+otherUndone.length+'건</b></div>';
      }
    }
    h+='<div style="display:flex;gap:4px;margin-top:8px">';
    h+='<input class="ti-input" id="homeTaskInput" placeholder="할 일 빠른 추가 ('+(today||'오늘')+'요일)..." style="flex:1;padding:6px 8px;font-size:.83em" onkeydown="if(event.key===\'Enter\')PageHome.quickAddTask()">';
    h+='<button class="a-btn primary" onclick="PageHome.quickAddTask()" style="padding:6px 12px;font-size:.83em">+</button>';
    h+='</div>';
    h+='</div>';

    // 급식 + 학사일정
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
    h+='<div class="card" style="margin-bottom:0">';
    h+='<div class="card-h">🍱 오늘 급식<span class="right"><button class="a-btn outline sm" onclick="Router.go(\'meal\')">전체 →</button></span></div>';
    h+='<div id="homeMeal" style="color:var(--tx3);font-size:.83em">불러오는 중...</div>';
    h+='</div>';
    h+='<div class="card" style="margin-bottom:0">';
    h+='<div class="card-h">📆 오늘 학사일정<span class="right"><button class="a-btn outline sm" onclick="Router.go(\'schedule\')">전체 →</button></span></div>';
    h+='<div id="homeSched" style="color:var(--tx3);font-size:.83em">불러오는 중...</div>';
    h+='</div>';
    h+='</div>';

    // 공지사항
    var notices=Store.get('notices',[]);
    if(notices.length){
      h+='<div class="card" style="margin-bottom:0">';
      h+='<div class="card-h">📢 공지사항</div>';
      for(var ni=0;ni<Math.min(notices.length,3);ni++){
        var nt=notices[ni];
        h+='<div style="padding:6px 0;border-bottom:1px solid var(--bg2);font-size:.88em">';
        h+='<span style="font-weight:600">'+nt.title+'</span> <span style="color:var(--tx3);font-size:.78em">'+nt.date+'</span>';
        if(nt.content)h+='<div style="color:var(--tx2);font-size:.82em;margin-top:2px">'+nt.content.substring(0,80)+(nt.content.length>80?'...':'')+'</div>';
        h+='</div>';
      }
      h+='</div>';
    }
    h+='</div>'; // 좌측 끝

    // ── 우측: 주간업무 독립 패널 ──
    h+='<div style="position:sticky;top:8px">';
    h+='<div class="card" style="margin-bottom:0;overflow:hidden">';

    // 패널 헤더
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
    h+='<div style="font-weight:700;font-size:.95em;display:flex;align-items:center;gap:5px">📋 주간업무</div>';
    h+='<button class="a-btn outline sm" onclick="Router.go(\'weekly\')" style="font-size:.74em">전체 →</button>';
    h+='</div>';

    // 날짜 네비
    h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg2);border-radius:8px;margin-bottom:8px">';
    h+='<button onclick="PageHome.calPrev()" style="background:none;border:none;font-size:1.2em;cursor:pointer;color:var(--tx2);line-height:1;padding:0">◀</button>';
    h+='<div style="text-align:center">';
    h+='<div style="font-weight:700;font-size:.92em;color:'+(isToday_?'var(--blue)':'var(--tx)')+'">'+dateLabel+'</div>';
    if(isToday_)h+='<div style="font-size:.7em;color:var(--blue);margin-top:1px">오늘</div>';
    h+='</div>';
    h+='<button onclick="PageHome.calNext()" style="background:none;border:none;font-size:1.2em;cursor:pointer;color:var(--tx2);line-height:1;padding:0">▶</button>';
    h+='</div>';
    if(!isToday_){
      h+='<div style="text-align:center;margin-bottom:8px">';
      h+='<button onclick="PageHome.calToday()" class="a-btn outline sm" style="font-size:.74em">오늘로 이동</button>';
      h+='</div>';
    }

    // 일정 목록
    h+='<div id="homeWeekly" style="color:var(--tx3);font-size:.83em;max-height:calc(100vh - 380px);overflow-y:auto">불러오는 중...</div>';
    h+='</div>'; // card
    h+='</div>'; // sticky

    h+='</div>'; // 2단 끝

    document.getElementById('pg').innerHTML=h;
    uNow();
    if(ck)clearInterval(ck);
    ck=setInterval(uNow,15000);

    loadCalendarEvents(targetYmd);

    var todayYmd=Neis.ymd(new Date());
    Neis.getMeals(todayYmd,todayYmd,function(meals){
      var el=document.getElementById('homeMeal');if(!el)return;
      if(!meals.length){el.innerHTML='<span style="color:var(--tx3)">오늘 급식 정보 없음</span>';return}
      var typeIcons={'조식':'🌅','중식':'☀️','석식':'🌙'};
      var mh='';
      meals.forEach(function(m){
        var items=m.menu.replace(/<br\/>/g,'\n').split('\n')
          .map(function(s){return s.replace(/\d+\.\s*/g,'').replace(/[()]/g,'').trim()})
          .filter(function(s){return s});
        mh+='<div style="margin-bottom:8px;padding:7px;background:var(--bg2);border-radius:6px">';
        mh+='<div style="font-weight:600;font-size:.8em;margin-bottom:3px">'+(typeIcons[m.type]||'')+' '+m.type+'</div>';
        items.slice(0,6).forEach(function(item){mh+='<div style="font-size:.79em">'+item+'</div>'});
        if(items.length>6)mh+='<div style="font-size:.74em;color:var(--tx3)">외 '+(items.length-6)+'가지</div>';
        if(m.cal)mh+='<div style="font-size:.72em;color:var(--tx3);margin-top:2px">🔥 '+m.cal+'</div>';
        mh+='</div>';
      });
      el.innerHTML=mh;
    });

    Neis.getSchedule(todayYmd,todayYmd,function(events){
      var el=document.getElementById('homeSched');if(!el)return;
      if(!events.length){el.innerHTML='<span style="color:var(--tx3)">오늘 학사일정 없음</span>';return}
      var sh='',seen={};
      events.forEach(function(ev){
        if(seen[ev.name])return;seen[ev.name]=1;
        var color=ev.type==='휴업일'?'var(--red)':'var(--green)';
        sh+='<div style="display:flex;align-items:center;gap:7px;padding:4px 0;font-size:.85em">';
        sh+='<span style="width:7px;height:7px;border-radius:50%;background:'+color+';flex-shrink:0"></span>';
        sh+=(ev.type==='휴업일'?'<span style="color:var(--red);font-weight:600">휴업</span> ':'')+ev.name;
        sh+='</div>';
      });
      el.innerHTML=sh;
    });
  }

  function loadCalendarEvents(targetYmd){
    var el=document.getElementById('homeWeekly');if(!el)return;
    var events=null;
    try{
      var raw=localStorage.getItem('weekly-public-events-v2');
      if(raw){var parsed=JSON.parse(raw);if(parsed&&parsed.events&&parsed.events.length){events=parsed.events;renderWeeklyOnHome(events,targetYmd)}}
    }catch(e){}
    try{
      if(typeof firebase!=='undefined'&&firebase.apps&&firebase.apps.length){
        firebase.firestore().collection('portal').doc('weekly-events').get().then(function(doc){
          if(doc.exists&&doc.data()&&doc.data().events&&doc.data().events.length){
            var fresh=doc.data().events;
            try{localStorage.setItem('weekly-public-events-v2',JSON.stringify({savedAt:Date.now(),events:fresh}))}catch(e2){}
            var el2=document.getElementById('homeWeekly');if(el2)renderWeeklyOnHome(fresh,targetYmd);
          }else if(!events){
            var el2=document.getElementById('homeWeekly');
            if(el2)el2.innerHTML='<div style="padding:16px;text-align:center;color:var(--tx3)"><div style="font-size:1.6em;margin-bottom:8px">📋</div><div style="font-size:.81em;line-height:1.7">주간업무 탭에서<br>관리자 로그인 후<br>새로고침하면<br>여기에 표시됩니다.</div></div>';
          }
        }).catch(function(){if(!events){var el2=document.getElementById('homeWeekly');if(el2)el2.innerHTML='<div style="color:var(--tx3);font-size:.82em;padding:8px">불러오기 실패</div>'}});
      }else if(!events){
        el.innerHTML='<div style="color:var(--tx3);font-size:.82em;padding:8px;text-align:center">초기화 중...</div>';
        setTimeout(function(){loadCalendarEvents(targetYmd)},1200);
      }
    }catch(e){if(!events&&el)el.innerHTML='<div style="color:var(--tx3);font-size:.82em;padding:8px">주간업무 탭에서 확인하세요</div>'}
  }

  function renderWeeklyOnHome(events,targetYmd){
    var el=document.getElementById('homeWeekly');if(!el)return;
    var filtered=events.filter(function(ev){
      var s=ev.start?ev.start.slice(0,10).replace(/-/g,''):'';
      var e=ev.end?ev.end.slice(0,10).replace(/-/g,''):'';
      return s<=targetYmd&&e>=targetYmd;
    });
    filtered.sort(function(a,b){
      if(a.isAllDay&&!b.isAllDay)return -1;
      if(!a.isAllDay&&b.isAllDay)return 1;
      return new Date(a.start)-new Date(b.start);
    });
    if(!filtered.length){el.innerHTML='<div style="padding:20px;text-align:center;color:var(--tx3);font-size:.84em">이 날 일정 없음</div>';return}
    var pad=function(n){return String(n).padStart(2,'0')};
    var h='<div style="display:flex;flex-direction:column;gap:5px">';
    filtered.forEach(function(ev){
      var title=ev.title?(ev.title.replace(/\[[^\]]+\]\s*/,'')):'';
      var dept=ev.department||'',color=ev.departmentColor||'var(--blue)';
      var time='';
      if(!ev.isAllDay&&ev.start){
        var st=new Date(ev.start),et=new Date(ev.end);
        time=pad(st.getHours())+':'+pad(st.getMinutes())+'~'+pad(et.getHours())+':'+pad(et.getMinutes());
      }else{time='종일'}
      h+='<div style="padding:8px 10px;border-radius:8px;border-left:3px solid '+color+';background:var(--bg2)">';
      h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:4px;margin-bottom:2px">';
      h+='<span style="font-size:.74em;font-weight:600;color:'+color+'">'+dept+'</span>';
      h+='<span style="font-size:.72em;color:var(--tx3);white-space:nowrap">'+time+'</span>';
      h+='</div>';
      h+='<div style="font-size:.84em;font-weight:500;word-break:keep-all;line-height:1.35">'+title+'</div>';
      if(ev.location)h+='<div style="font-size:.73em;color:var(--tx3);margin-top:2px">📍'+ev.location+'</div>';
      h+='</div>';
    });
    h+='</div>';
    el.innerHTML=h;
  }

  function uNow(){
    var now=new Date(),hh=now.getHours(),mm=now.getMinutes();
    var el=document.getElementById('nTime');if(el)el.textContent=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
    var U=App.getUser(),today=Engine.today(),np=Engine.nowP();
    var ep=document.getElementById('nPer'),ec=document.getElementById('nCls'),en=document.getElementById('nNext');
    if(!ep)return;
    if(!today){ep.textContent='주말';ec.textContent='';if(en)en.innerHTML='';return}
    if(np>=0){
      var cl=Engine.slot(U,today,np),sj='';
      if(cl&&CS[cl])sj=CS[cl][today][np]||cl;else if(cl)sj=cl;
      ep.textContent=(np+1)+'교시 수업 중';ec.textContent=cl?(cl+' — '+sj):'빈 시간';
    }else{
      var t=hh*60+mm;
      ep.textContent=t<530?'출근 전':t<550?'등교 시간':'수업 종료';ec.textContent='';
    }
    if(en&&today){
      var found=false;
      for(var p=(np>=0?np+1:0);p<DP[today];p++){
        var cl=Engine.slot(U,today,p);
        if(cl){
          var sj='';if(CS[cl])sj=CS[cl][today][p]||cl;else sj=cl;
          en.innerHTML='<div style="color:var(--tx3);font-size:.78em">다음</div><div style="font-weight:600;font-size:.9em">'+(p+1)+'교시 '+cl+'</div><div style="color:var(--tx2);font-size:.8em">'+sj+'</div>';
          found=true;break;
        }
      }
      if(!found)en.innerHTML='<div style="color:var(--tx3);font-size:.82em">남은 수업 없음</div>';
    }
  }

  return{
    render:render,
    calPrev:function(){calDayOff--;render()},
    calNext:function(){calDayOff++;render()},
    calToday:function(){calDayOff=0;render()},
    toggleTask:function(day,idx){
      var tasks=Store.getTasks();
      if(tasks[day]&&tasks[day][idx])tasks[day][idx].done=!tasks[day][idx].done;
      Store.setTasks(tasks);render();
    },
    quickAddTask:function(){
      var input=document.getElementById('homeTaskInput');
      if(!input||!input.value.trim())return;
      var today=Engine.today()||'월';
      var tasks=Store.getTasks();
      if(!tasks[today])tasks[today]=[];
      tasks[today].push({text:input.value.trim(),time:'',done:false});
      Store.setTasks(tasks);toast('할 일 추가됨');render();
    }
  };
})();
