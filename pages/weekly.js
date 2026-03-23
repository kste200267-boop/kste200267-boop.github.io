// pages/weekly.js — 주간 업무 (구글 캘린더 포털 내 직접)
var PageWeekly=(function(){
  var CLIENT_ID='243121397435-jlu52hqe8or79msoqj5qkrpuop9o1f0d.apps.googleusercontent.com';
  var SCOPES='https://www.googleapis.com/auth/calendar.readonly';
  var token=sessionStorage.getItem('gcal-token');
  var events=[];
  var weekOff=0;
  var activeDept='전체';
  var gisReady=false;
  var tokenClient=null;

  var DEPTS=[
    {name:'전체',kw:[],color:'#607D8B'},
    {name:'교무부',kw:['교무','시간표','수업','교과','성적'],color:'#0F9D58'},
    {name:'학생부',kw:['생활지도','학생부','선도','출결','학교폭력'],color:'#4285F4'},
    {name:'진로상담부',kw:['진로','상담','진학','대학','입시'],color:'#F4B400'},
    {name:'도제교육부',kw:['도제','현장실습','산학','NCS'],color:'#DB4437'},
    {name:'학년부',kw:['학년','용접','밀링','담임','조회'],color:'#AB47BC'},
    {name:'산업취업부',kw:['취업','산업체','채용','면접'],color:'#00ACC1'},
    {name:'인재개발부',kw:['인재','역량','워크숍'],color:'#FF7043'},
    {name:'개인',kw:['개인','연수','출장','휴가'],color:'#78909C'}
  ];

  function classify(title){
    var tag=title.match(/\[([^\]]+)\]/);
    if(tag){for(var i=1;i<DEPTS.length;i++){if(DEPTS[i].name===tag[1])return DEPTS[i];for(var j=0;j<DEPTS[i].kw.length;j++){if(tag[1].indexOf(DEPTS[i].kw[j])>=0)return DEPTS[i]}}}
    var tl=title.toLowerCase();for(var i=1;i<DEPTS.length;i++){for(var j=0;j<DEPTS[i].kw.length;j++){if(tl.indexOf(DEPTS[i].kw[j])>=0)return DEPTS[i]}}
    return DEPTS[DEPTS.length-1];
  }

  function pad(n){return String(n).padStart(2,'0')}
  function fmtTime(s){var d=new Date(s);return pad(d.getHours())+':'+pad(d.getMinutes())}
  function cleanTitle(t){return t.replace(/\[[^\]]+\]\s*/,'')}

  function getRange(){
    var d=new Date();d.setDate(d.getDate()+weekOff*7);
    var mon=Store.getMonday(d);var sun=new Date(mon);sun.setDate(mon.getDate()+6);sun.setHours(23,59,59);
    return{start:mon,end:sun};
  }

  function render(){
    var range=getRange();
    var label=(range.start.getMonth()+1)+'/'+range.start.getDate()+' ~ '+(range.end.getMonth()+1)+'/'+range.end.getDate();

    var h='<div class="card"><div class="card-h">📋 주간 업무</div>';
    h+='<div class="week-nav"><button onclick="PageWeekly.prev()">◀</button><span class="wk-label">'+label+'</span><button onclick="PageWeekly.next()">▶</button><button onclick="PageWeekly.now()" style="margin-left:4px">이번주</button></div>';

    if(!token){
      h+='<div style="text-align:center;padding:30px 0">';
      h+='<p style="color:var(--tx2);margin-bottom:14px">Google 캘린더에 로그인하여 주간 업무를 확인하세요</p>';
      h+='<button class="a-btn primary" style="padding:12px 28px;font-size:.95em" onclick="PageWeekly.gLogin()">📅 Google 계정으로 로그인</button>';
      h+='<div style="margin-top:12px"><button class="a-btn outline" onclick="PageWeekly.loadDemo()">🎭 데모 데이터로 보기</button></div>';
      h+='</div>';
    } else {
      h+='<div class="chips" style="margin-bottom:8px">';
      for(var i=0;i<DEPTS.length;i++){var dp=DEPTS[i];var on=activeDept===dp.name;
        h+='<span class="chip'+(on?' on':'')+'" style="'+(on?'background:'+dp.color+';border-color:'+dp.color:'border-color:'+dp.color+';color:'+dp.color)+'" onclick="PageWeekly.setDept(\''+dp.name+'\')">'+dp.name+'</span>';
      }
      h+='</div>';
      h+='<div id="weekGrid">🔄 불러오는 중...</div>';
    }
    h+='</div>';
    document.getElementById('pg').innerHTML=h;
    if(token) loadEvents();
  }

  function loadEvents(){
    if(token==='demo'){renderGrid();return}
    var range=getRange();
    var url='https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin='+range.start.toISOString()+'&timeMax='+range.end.toISOString()+'&singleEvents=true&orderBy=startTime&maxResults=200';
    fetch(url,{headers:{'Authorization':'Bearer '+token}})
    .then(function(r){if(r.status===401){token=null;sessionStorage.removeItem('gcal-token');render();return null}return r.json()})
    .then(function(data){
      if(!data||data.error)return;
      events=(data.items||[]).map(function(ev){
        var isAll=!!(ev.start&&ev.start.date);var dept=classify(ev.summary||'');
        return{title:ev.summary||'',start:isAll?ev.start.date+'T00:00:00':ev.start.dateTime,end:isAll?(ev.end?ev.end.date+'T23:59:59':ev.start.date+'T23:59:59'):(ev.end?ev.end.dateTime:ev.start.dateTime),isAll:isAll,dept:dept.name,color:dept.color,location:ev.location||''};
      });
      renderGrid();
    }).catch(function(){
      var el=document.getElementById('weekGrid');
      if(el)el.innerHTML='<div style="color:var(--red);padding:12px">캘린더 로드 실패. 네트워크를 확인하세요.</div>';
    });
  }

  function renderGrid(){
    var range=getRange();var dn=['월','화','수','목','금','토','일'];
    var filtered=activeDept==='전체'?events:events.filter(function(e){return e.dept===activeDept});
    var dayEvs={};for(var i=0;i<7;i++)dayEvs[i]=[];
    for(var i=0;i<filtered.length;i++){var ev=filtered[i];var sd=new Date(ev.start);var idx=Math.floor((sd-range.start)/864e5);if(idx<0)idx=0;if(idx>6)idx=6;dayEvs[idx].push(ev)}
    var today=new Date().toDateString();
    var h='<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border:1px solid var(--bd);border-radius:var(--radius-sm);overflow:hidden">';
    for(var i=0;i<7;i++){
      var dd=new Date(range.start);dd.setDate(range.start.getDate()+i);var isT=dd.toDateString()===today;
      h+='<div style="border-right:'+(i<6?'1px solid var(--bd)':'none')+';min-height:160px">';
      h+='<div style="text-align:center;padding:6px;background:'+(isT?'var(--blue)':'var(--bg2)')+';border-bottom:1px solid var(--bd);color:'+(isT?'#fff':'var(--tx)')+'">';
      h+='<div style="font-size:.75em;font-weight:500">'+dn[i]+'</div><div style="font-size:.95em;font-weight:700">'+(dd.getMonth()+1)+'/'+dd.getDate()+'</div></div>';
      h+='<div style="padding:3px">';
      var evs=dayEvs[i];
      if(!evs.length)h+='<div style="color:var(--tx3);font-size:.72em;text-align:center;padding:12px 0">일정 없음</div>';
      for(var j=0;j<evs.length;j++){var ev=evs[j];
        h+='<div style="padding:4px 5px;margin-bottom:3px;border-left:3px solid '+ev.color+';border-radius:0 3px 3px 0;background:var(--bg);font-size:.75em" title="'+ev.title+'">';
        if(!ev.isAll)h+='<div style="color:var(--tx3);font-size:.9em">'+fmtTime(ev.start)+'</div>';
        h+='<div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+cleanTitle(ev.title)+'</div>';
        if(ev.location)h+='<div style="color:var(--tx3);font-size:.85em">📍'+ev.location+'</div>';
        h+='</div>';
      }
      h+='</div></div>';
    }
    h+='</div><div style="margin-top:6px;font-size:.78em;color:var(--tx3)">총 '+filtered.length+'건'+(token==='demo'?' · 🎭 데모 모드':'')+'</div>';
    var el=document.getElementById('weekGrid');
    if(el)el.innerHTML=h;
  }

  function gLogin(){
    if(typeof google!=='undefined'&&google.accounts){doAuth();return}
    var sc=document.createElement('script');sc.src='https://accounts.google.com/gsi/client';
    sc.onload=function(){doAuth()};document.head.appendChild(sc);
  }

  function doAuth(){
    tokenClient=google.accounts.oauth2.initTokenClient({
      client_id:CLIENT_ID,scope:SCOPES,
      callback:function(resp){if(resp.error)return;token=resp.access_token;sessionStorage.setItem('gcal-token',token);render()}
    });
    tokenClient.requestAccessToken();
  }

  function loadDemo(){
    var mon=Store.getMonday(new Date());
    var items=[
      ['[교무부] 중간고사 출제 범위 협의','교무부','#0F9D58','본동 세미나실',0,14,16],
      ['[학생부] 학교폭력 예방교육 전체','학생부','#4285F4','강당',0,9,11],
      ['[진로상담부] 3학년 진학 상담','진로상담부','#F4B400','',1,9,12],
      ['[도제교육부] 산학 기업 방문','도제교육부','#DB4437','',1,13,17],
      ['[학년부] 1학년 담임 협의회','학년부','#AB47BC','세미나실',2,10,11],
      ['[산업취업부] 채용 박람회 준비','산업취업부','#00ACC1','계정아트홀',2,14,16],
      ['[인재개발부] 교원 역량 연수','인재개발부','#FF7043','본동 세미나실',3,9,12],
      ['[개인] 통합사회 수업 준비','개인','#78909C','',3,16,17],
      ['[학생부] 기숙사 점검','학생부','#4285F4','기숙사',4,9,10],
      ['[교무부] 수업 공개의 날','교무부','#0F9D58','',4,10,12]
    ];
    events=items.map(function(t,i){var d=new Date(mon);d.setDate(mon.getDate()+t[4]);var s=new Date(d);s.setHours(t[5],0);var e=new Date(d);e.setHours(t[6],0);return{title:t[0],start:s.toISOString(),end:e.toISOString(),isAll:false,dept:t[1],color:t[2],location:t[3]}});
    token='demo';render();
  }

  return{render:render,prev:function(){weekOff--;if(token)loadEvents();else render()},next:function(){weekOff++;if(token)loadEvents();else render()},now:function(){weekOff=0;if(token)loadEvents();else render()},setDept:function(d){activeDept=d;renderGrid()},gLogin:gLogin,loadDemo:loadDemo};
})();
