// pages/home.js — 홈 대시보드 (안전 버전)
var PageHome=(function(){
  var ck=null;
  var calDayOff=0;
  var calendarRetryTimer=null;

  function getTargetDate(off){
    var d=new Date();
    d.setDate(d.getDate()+off);
    return d;
  }

  function safeTasks(){
    try{
      var tasks=Store.getTasks();
      if(tasks && typeof tasks==='object') return tasks;
    }catch(e){
      console.error('safeTasks error:',e);
    }
    return {};
  }

  function safeSwapHistory(){
    try{
      var hist=Store.getSwapHistory();
      return Array.isArray(hist)?hist:[];
    }catch(e){
      console.error('safeSwapHistory error:',e);
      return [];
    }
  }

  function safeSetHtml(id,html){
    var el=document.getElementById(id);
    if(el) el.innerHTML=html;
  }

  function renderError(msg){
    var pg=document.getElementById('pg');
    if(!pg)return;
    pg.innerHTML=
      '<div class="card">' +
        '<div class="card-h">⚠️ 홈 화면 오류</div>' +
        '<div style="font-size:.9em;color:var(--tx2);line-height:1.7">' +
          (msg||'홈 화면을 불러오는 중 오류가 발생했습니다.') +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<button class="a-btn primary" onclick="location.reload()">새로고침</button>' +
        '</div>' +
      '</div>';
  }

  function render(){
    try{
      var U=App.getUser();
      var today=Engine.today();
      var np=Engine.nowP();
      var wk=Store.weekKey();

      var cnt=0;
      try{
        if(today){
          for(var p=0;p<DP[today];p++){
            if(Engine.slot(U,today,p)) cnt++;
          }
        }
      }catch(e){
        console.error('today timetable count error:',e);
      }

      var tasks=safeTasks();
      var tc=0;
      for(var d in tasks){
        var a=Array.isArray(tasks[d])?tasks[d]:[];
        for(var i=0;i<a.length;i++){
          if(a[i] && !a[i].done) tc++;
        }
      }

      var hist=safeSwapHistory().filter(function(h){
        return h && h.status==='applied' && h.week===wk;
      });

      var targetDate=getTargetDate(calDayOff);
      var targetYmd=Neis.ymd(targetDate);
      var isToday_=(calDayOff===0);
      var dow=['일','월','화','수','목','금','토'][targetDate.getDay()];
      var dateLabel=(targetDate.getMonth()+1)+'/'+targetDate.getDate()+' ('+dow+')';

      var h='';

      h+='<div class="dash-now"><div>';
      h+='<div class="now-time" id="nTime">--:--</div>';
      h+='<div class="now-label" id="nPer">--</div>';
      h+='<div class="now-detail" id="nCls"></div>';
      h+='</div><div id="nNext" style="text-align:right"></div></div>';

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

      h+='<div class="home-main-layout" style="display:grid;grid-template-columns:1fr 320px;gap:12px;align-items:start">';
      h+='<div style="display:flex;flex-direction:column;gap:10px">';

      h+='<div class="card" style="margin-bottom:0">';
      h+='<div class="card-h">📅 오늘 시간표</div>';

      if(!today){
        h+='<p style="color:var(--tx2);font-size:.88em">주말입니다.</p>';
      }else{
        h+='<div style="overflow-x:auto"><table class="tt" style="font-size:.8em"><thead><tr>';
        for(var p1=0;p1<DP[today];p1++){
          h+='<th style="min-width:52px">'+(p1+1)+'교시<br><span style="font-weight:400;font-size:.85em">'+PT[p1].s+'</span></th>';
        }
        h+='</tr></thead><tbody><tr>';

        for(var p2=0;p2<DP[today];p2++){
          var cl=Engine.slot(U,today,p2);
          var cls_=(p2===np)?'now-c':(cl?'my':'emp');
          var sj='';
          var _hSj=Store.get('tt-subj-'+U,{}) || {};
          try{
            if(cl && CS[cl] && CS[cl][today]) sj=CS[cl][today][p2]||'';
            else if(cl) sj=cl;
          }catch(e){
            console.error('today subject read error:',e);
          }
          var _hk=String(Engine.si(today,p2));
          if(_hSj[_hk]) sj=_hSj[_hk];

          h+='<td class="'+cls_+'">'+(cl?(cl.replace(/^\d/,'')+'<br><span style="font-size:.76em">'+sj+'</span>'):'—')+'</td>';
        }
        h+='</tr></tbody></table></div>';
      }
      h+='</div>';

      h+='<div class="card" style="margin-bottom:0">';
      h+='<div class="card-h">✅ 오늘 할 일<span class="right"><button class="a-btn outline sm" onclick="Router.go(\'tasks\')">전체 →</button></span></div>';

      var todayTasks=Array.isArray(tasks[today])?tasks[today]:[];
      var otherUndone=[];

      for(var dd in tasks){
        if(dd===today) continue;
        var arr=Array.isArray(tasks[dd])?tasks[dd]:[];
        arr.forEach(function(t){
          if(t && !t.done) otherUndone.push({day:dd,task:t});
        });
      }

      if(!todayTasks.length && !otherUndone.length){
        h+='<div style="color:var(--tx3);font-size:.84em;padding:4px 0">등록된 할 일 없음</div>';
      }else{
        if(todayTasks.length){
          h+='<div style="display:flex;flex-direction:column;gap:2px">';
          todayTasks.forEach(function(t,ti){
            if(!t)return;
            h+='<div style="display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:6px;cursor:pointer;background:var(--bg2)" onclick="PageHome.toggleTask(\''+today+'\','+ti+')">';
            h+='<div style="width:16px;height:16px;border-radius:50%;border:2px solid '+(t.done?'var(--green)':'var(--bd)')+';background:'+(t.done?'var(--green)':'')+';flex-shrink:0;display:flex;align-items:center;justify-content:center">';
            if(t.done)h+='<svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4l2 2 3-3" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
            h+='</div>';
            h+='<div style="flex:1;font-size:.85em;'+(t.done?'text-decoration:line-through;opacity:.45':'')+'">'+(t.text||'')+'</div>';
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

      var notices=Store.get('notices',[]);
      if(Array.isArray(notices) && notices.length){
        h+='<div class="card" style="margin-bottom:0">';
        h+='<div class="card-h">📢 공지사항</div>';
        for(var ni=0;ni<Math.min(notices.length,3);ni++){
          var nt=notices[ni]||{};
          h+='<div style="padding:6px 0;border-bottom:1px solid var(--bg2);font-size:.88em">';
          h+='<span style="font-weight:600">'+(nt.title||'')+'</span> <span style="color:var(--tx3);font-size:.78em">'+(nt.date||'')+'</span>';
          if(nt.content)h+='<div style="color:var(--tx2);font-size:.82em;margin-top:2px">'+nt.content.substring(0,80)+(nt.content.length>80?'...':'')+'</div>';
          h+='</div>';
        }
        h+='</div>';
      }

      h+='</div>';

      h+='<div style="position:sticky;top:8px">';
      h+='<div class="card" style="margin-bottom:0;overflow:hidden">';
      h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
      h+='<div style="font-weight:700;font-size:.95em;display:flex;align-items:center;gap:5px">📋 주간업무</div>';
      h+='<button class="a-btn outline sm" onclick="Router.go(\'weekly\')" style="font-size:.74em">전체 →</button>';
      h+='</div>';

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

      h+='<div id="homeWeekly" style="color:var(--tx3);font-size:.83em;max-height:calc(100vh - 380px);overflow-y:auto">불러오는 중...</div>';
      h+='</div>';
      h+='</div>';
      h+='</div>';

      var pg=document.getElementById('pg');
      if(!pg) throw new Error('pg container not found');
      pg.innerHTML=h;

      uNow();

      if(ck) clearInterval(ck);
      ck=setInterval(uNow,15000);

      loadCalendarEvents(targetYmd);

      var todayYmd=Neis.ymd(new Date());

      try{
        Neis.getMeals(todayYmd,todayYmd,function(meals){
          var el=document.getElementById('homeMeal');
          if(!el)return;

          if(!Array.isArray(meals) || !meals.length){
            el.innerHTML='<span style="color:var(--tx3)">오늘 급식 정보 없음</span>';
            return;
          }

          var typeIcons={'조식':'🌅','중식':'☀️','석식':'🌙'};
          var mh='';

          meals.forEach(function(m){
            if(!m)return;
            var items=String(m.menu||'').replace(/<br\/>/g,'\n').split('\n')
              .map(function(s){return s.replace(/\d+\.\s*/g,'').replace(/[()]/g,'').trim();})
              .filter(function(s){return s;});

            mh+='<div style="margin-bottom:8px;padding:7px;background:var(--bg2);border-radius:6px">';
            mh+='<div style="font-weight:600;font-size:.8em;margin-bottom:3px">'+(typeIcons[m.type]||'')+' '+(m.type||'')+'</div>';
            items.slice(0,6).forEach(function(item){
              mh+='<div style="font-size:.79em">'+item+'</div>';
            });
            if(items.length>6)mh+='<div style="font-size:.74em;color:var(--tx3)">외 '+(items.length-6)+'가지</div>';
            if(m.cal)mh+='<div style="font-size:.72em;color:var(--tx3);margin-top:2px">🔥 '+m.cal+'</div>';
            mh+='</div>';
          });

          el.innerHTML=mh;
        });
      }catch(e){
        console.error('Neis.getMeals error:',e);
        safeSetHtml('homeMeal','<span style="color:var(--tx3)">급식 정보를 불러오지 못했습니다</span>');
      }

      try{
        Neis.getSchedule(todayYmd,todayYmd,function(events){
          var el=document.getElementById('homeSched');
          if(!el)return;

          if(!Array.isArray(events) || !events.length){
            el.innerHTML='<span style="color:var(--tx3)">오늘 학사일정 없음</span>';
            return;
          }

          var sh='',seen={};
          events.forEach(function(ev){
            if(!ev || !ev.name) return;
            if(seen[ev.name]) return;
            seen[ev.name]=1;

            var color=ev.type==='휴업일'?'var(--red)':'var(--green)';
            sh+='<div style="display:flex;align-items:center;gap:7px;padding:4px 0;font-size:.85em">';
            sh+='<span style="width:7px;height:7px;border-radius:50%;background:'+color+';flex-shrink:0"></span>';
            sh+=(ev.type==='휴업일'?'<span style="color:var(--red);font-weight:600">휴업</span> ':'')+ev.name;
            sh+='</div>';
          });

          el.innerHTML=sh || '<span style="color:var(--tx3)">오늘 학사일정 없음</span>';
        });
      }catch(e){
        console.error('Neis.getSchedule error:',e);
        safeSetHtml('homeSched','<span style="color:var(--tx3)">학사일정을 불러오지 못했습니다</span>');
      }

    }catch(e){
      console.error('PageHome.render error:',e);
      renderError('홈 화면을 불러오는 중 오류가 발생했습니다.');
    }
  }

  function loadCalendarEvents(targetYmd){
    var el=document.getElementById('homeWeekly');
    if(!el)return;

    if(calendarRetryTimer){
      clearTimeout(calendarRetryTimer);
      calendarRetryTimer=null;
    }

    var events=null;

    try{
      var raw=localStorage.getItem('weekly-public-events-v2');
      if(raw){
        var parsed=JSON.parse(raw);
        if(parsed && Array.isArray(parsed.events) && parsed.events.length){
          events=parsed.events;
          renderWeeklyOnHome(events,targetYmd);
        }
      }
    }catch(e){
      console.error('weekly cache read error:',e);
    }

    try{
      if(typeof firebase!=='undefined' && firebase.apps && firebase.apps.length){
        firebase.firestore().collection('portal').doc('weekly-events').get().then(function(doc){
          if(doc.exists && doc.data() && Array.isArray(doc.data().events) && doc.data().events.length){
            var fresh=doc.data().events;
            try{
              localStorage.setItem('weekly-public-events-v2',JSON.stringify({
                savedAt:Date.now(),
                events:fresh
              }));
            }catch(e2){}
            renderWeeklyOnHome(fresh,targetYmd);
          }else if(!events){
            safeSetHtml('homeWeekly',
              '<div style="padding:16px;text-align:center;color:var(--tx3)">' +
              '<div style="font-size:1.6em;margin-bottom:8px">📋</div>' +
              '<div style="font-size:.81em;line-height:1.7">주간업무 탭에서<br>관리자 로그인 후<br>새로고침하면<br>여기에 표시됩니다.</div>' +
              '</div>'
            );
          }
        }).catch(function(err){
          console.error('weekly firestore error:',err);
          if(!events){
            safeSetHtml('homeWeekly','<div style="color:var(--tx3);font-size:.82em;padding:8px">불러오기 실패</div>');
          }
        });
      }else if(!events){
        safeSetHtml('homeWeekly','<div style="color:var(--tx3);font-size:.82em;padding:8px;text-align:center">초기화 중...</div>');
        calendarRetryTimer=setTimeout(function(){
          loadCalendarEvents(targetYmd);
        },1200);
      }
    }catch(e){
      console.error('loadCalendarEvents error:',e);
      if(!events){
        safeSetHtml('homeWeekly','<div style="color:var(--tx3);font-size:.82em;padding:8px">주간업무 탭에서 확인하세요</div>');
      }
    }
  }

  function renderWeeklyOnHome(events,targetYmd){
    var el=document.getElementById('homeWeekly');
    if(!el)return;

    try{
      var filtered=(Array.isArray(events)?events:[]).filter(function(ev){
        if(!ev)return false;
        var s=ev.start?String(ev.start).slice(0,10).replace(/-/g,''):'';
        var e=ev.end?String(ev.end).slice(0,10).replace(/-/g,''):'';
        return s<=targetYmd && e>=targetYmd;
      });

      filtered.sort(function(a,b){
        if(a.isAllDay && !b.isAllDay)return -1;
        if(!a.isAllDay && b.isAllDay)return 1;
        return new Date(a.start)-new Date(b.start);
      });

      if(!filtered.length){
        el.innerHTML='<div style="padding:20px;text-align:center;color:var(--tx3);font-size:.84em">이 날 일정 없음</div>';
        return;
      }

      var pad=function(n){return String(n).padStart(2,'0');};
      var h='<div style="display:flex;flex-direction:column;gap:5px">';

      filtered.forEach(function(ev){
        if(!ev)return;

        var title=ev.title?String(ev.title).replace(/\[[^\]]+\]\s*/,''):'';
        var dept=ev.department||'';
        var color=ev.departmentColor||'var(--blue)';
        var time='';

        if(!ev.isAllDay && ev.start){
          var st=new Date(ev.start);
          var et=new Date(ev.end);
          time=pad(st.getHours())+':'+pad(st.getMinutes())+'~'+pad(et.getHours())+':'+pad(et.getMinutes());
        }else{
          time='종일';
        }

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
    }catch(e){
      console.error('renderWeeklyOnHome error:',e);
      el.innerHTML='<div style="color:var(--tx3);font-size:.82em;padding:8px">일정을 표시하지 못했습니다</div>';
    }
  }

  function uNow(){
    try{
      var now=new Date();
      var hh=now.getHours();
      var mm=now.getMinutes();

      var el=document.getElementById('nTime');
      if(el) el.textContent=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');

      var U=App.getUser();
      var today=Engine.today();
      var np=Engine.nowP();

      var ep=document.getElementById('nPer');
      var ec=document.getElementById('nCls');
      var en=document.getElementById('nNext');
      if(!ep)return;

      if(!today){
        ep.textContent='주말';
        if(ec) ec.textContent='';
        if(en) en.innerHTML='';
        return;
      }

      if(np>=0){
        var cl=Engine.slot(U,today,np);
        var sj='';

        try{
          if(cl && CS[cl] && CS[cl][today]) sj=CS[cl][today][np]||cl;
          else if(cl) sj=cl;
        }catch(e){
          console.error('uNow subject error:',e);
        }

        ep.textContent=(np+1)+'교시 수업 중';
        if(ec) ec.textContent=cl?(cl+' — '+sj):'빈 시간';
      }else{
        var t=hh*60+mm;
        ep.textContent=t<530?'출근 전':(t<550?'등교 시간':'수업 종료');
        if(ec) ec.textContent='';
      }

      if(en && today){
        var found=false;
        for(var p= (np>=0?np+1:0); p<DP[today]; p++){
          var cl2=Engine.slot(U,today,p);
          if(cl2){
            var sj2='';
            try{
              if(CS[cl2] && CS[cl2][today]) sj2=CS[cl2][today][p]||cl2;
              else sj2=cl2;
            }catch(e){
              sj2=cl2;
            }

            en.innerHTML=
              '<div style="color:var(--tx3);font-size:.78em">다음</div>' +
              '<div style="font-weight:600;font-size:.9em">'+(p+1)+'교시 '+cl2+'</div>' +
              '<div style="color:var(--tx2);font-size:.8em">'+sj2+'</div>';
            found=true;
            break;
          }
        }

        if(!found){
          en.innerHTML='<div style="color:var(--tx3);font-size:.82em">남은 수업 없음</div>';
        }
      }
    }catch(e){
      console.error('uNow error:',e);
    }
  }

  return{
    render:render,
    calPrev:function(){
      calDayOff--;
      render();
    },
    calNext:function(){
      calDayOff++;
      render();
    },
    calToday:function(){
      calDayOff=0;
      render();
    },
    toggleTask:function(day,idx){
      try{
        var tasks=safeTasks();
        if(tasks[day] && tasks[day][idx]){
          tasks[day][idx].done=!tasks[day][idx].done;
        }
        Store.setTasks(tasks);
        render();
      }catch(e){
        console.error('toggleTask error:',e);
      }
    },
    quickAddTask:function(){
      try{
        var input=document.getElementById('homeTaskInput');
        if(!input || !input.value.trim()) return;

        var today=Engine.today()||'월';
        var tasks=safeTasks();
        if(!tasks[today]) tasks[today]=[];
        tasks[today].push({
          text:input.value.trim(),
          time:'',
          done:false
        });

        Store.setTasks(tasks);
        toast('할 일 추가됨');
        render();
      }catch(e){
        console.error('quickAddTask error:',e);
      }
    }
  };
})();
