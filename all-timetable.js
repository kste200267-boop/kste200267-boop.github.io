// pages/all-timetable.js — 전체 시간표 (그룹 보기 + 단일 조회 + 빈 시간 + 협의)
var PageFull=(function(){
  var viewTab='group';
  var gradeFilter='1';
  var groupDay='월';
  var singleMode='class';
  var singleVal='';
  var fD='월', fP=0;
  var matchSel={};

  function getGradeClasses(grade){
    var all=Engine.allCls();
    if(grade==='all') return all;
    return all.filter(function(c){return c.charAt(0)===grade});
  }

  function render(){
    // 오늘 요일을 기본 그룹 요일로
    var today=Engine.today();
    if(!groupDay||groupDay==='') groupDay=today||'월';

    var h='<div class="card" style="padding:0;overflow:hidden">';
    // 탭 헤더
    h+='<div style="display:flex;border-bottom:1px solid var(--bd);background:var(--bg2);overflow-x:auto">';
    [{id:'group',icon:'📊',label:'학년 전체'},{id:'single',icon:'🔍',label:'단일 조회'},
     {id:'free',icon:'⏰',label:'빈 시간'},{id:'match',icon:'🤝',label:'협의 찾기'}
    ].forEach(function(t){
      h+='<div style="padding:10px 16px;cursor:pointer;flex-shrink:0;font-size:.84em;font-weight:'+
        (viewTab===t.id?700:500)+';color:'+(viewTab===t.id?'var(--blue)':'var(--tx2)')+
        ';border-bottom:'+(viewTab===t.id?'2px solid var(--blue)':'2px solid transparent')+
        '" onclick="PageFull.tab(\''+t.id+'\')">'+t.icon+' '+t.label+'</div>';
    });
    h+='</div><div style="padding:14px">';

    if(viewTab==='group')       h+=renderGroup();
    else if(viewTab==='single') h+=renderSinglePanel();
    else if(viewTab==='free')   h+=renderFreePanel();
    else if(viewTab==='match')  h+=renderMatchPanel();

    h+='</div></div>';
    document.getElementById('pg').innerHTML=h;

    // 단일 조회 select 채우기
    if(viewTab==='single'){
      setTimeout(function(){
        var sel=document.getElementById('ffSel');
        if(!sel) return;
        sel.innerHTML='';
        if(singleMode==='class'){
          var cls=Engine.allCls();
          if(!singleVal||cls.indexOf(singleVal)<0) singleVal=cls[0]||'';
          cls.forEach(function(c){sel.innerHTML+='<option value="'+c+'"'+(c===singleVal?' selected':'')+'>'+c+'</option>'});
        }else{
          var ns=Engine.names();
          if(!singleVal||ns.indexOf(singleVal)<0) singleVal=App.getUser();
          ns.forEach(function(n){sel.innerHTML+='<option value="'+n+'"'+(n===singleVal?' selected':'')+'>'+n+' ('+Engine.TS()[n]+')</option>'});
        }
        rSingleTable();
      },0);
    }

    // 빈 시간 탭 select 이벤트
    if(viewTab==='free'){
      setTimeout(function(){
        var fpSel=document.getElementById('fpSel');
        if(fpSel) fpSel.onchange=function(){fP=+this.value;rFreeResult()};
        rFreeResult();
      },0);
    }
  }

  // ── 학년 전체 그룹 보기 ──
  function renderGroup(){
    var h='';
    // 학년 필터
    h+='<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">';
    h+='<span style="font-size:.82em;font-weight:600;color:var(--tx2)">학년:</span>';
    [{v:'1',l:'1학년'},{v:'2',l:'2학년'},{v:'3',l:'3학년'},{v:'all',l:'전학년'}].forEach(function(g){
      h+='<span class="chip'+(gradeFilter===g.v?' on':'')+'" onclick="PageFull.setGrade(\''+g.v+'\')">'+g.l+'</span>';
    });
    h+='<span style="font-size:.82em;font-weight:600;color:var(--tx2);margin-left:8px">요일:</span>';
    DAYS.forEach(function(d){
      h+='<span class="chip'+(groupDay===d?' on':'')+'" onclick="PageFull.setGroupDay(\''+d+'\')">'+d+'</span>';
    });
    h+='</div>';

    var classes=getGradeClasses(gradeFilter);
    if(!classes.length){
      return h+'<div style="color:var(--tx3);padding:20px;text-align:center">해당 학년 학급 정보 없음</div>';
    }

    var today=Engine.today(), np=Engine.nowP(), CTM=Engine.CTM();
    var day=groupDay;
    var maxP=DP[day]||6;

    h+='<div style="overflow-x:auto"><table class="tt" style="min-width:'+Math.max(500,(classes.length+1)*82)+'px">';
    // 헤더: 교시 + 각 학급
    h+='<thead><tr>';
    h+='<th style="min-width:64px;background:var(--bg3)">교시</th>';
    classes.forEach(function(cls){
      h+='<th style="min-width:80px;background:var(--bg3)">'+cls+'</th>';
    });
    h+='</tr></thead><tbody>';

    for(var p=0;p<maxP;p++){
      var isNowRow=(p===np&&day===today);
      h+='<tr>';
      h+='<th style="background:'+(isNowRow?'var(--blue)':'var(--bg2)')+
        ';color:'+(isNowRow?'#fff':'var(--tx)')+
        ';font-size:.77em;padding:5px 4px;white-space:nowrap">';
      h+=(p+1)+'교시<br><span style="font-weight:400;opacity:.8">'+PT[p].s+'</span></th>';

      classes.forEach(function(cls){
        var key=cls+'|'+day+'|'+p;
        var teacher=CTM[key]||'';
        var subj='';
        if(CS[cls]&&CS[cls][day]) subj=CS[cls][day][p]||'';
        var isNow=isNowRow;
        h+='<td style="text-align:center;padding:5px 4px;background:'+(isNow?'#deeeff':'')+
          ';outline:'+(isNow?'2px solid var(--blue)':'none')+';outline-offset:-2px">';
        if(!teacher&&!subj){
          h+='<span style="color:var(--tx3);font-size:.76em">—</span>';
        }else{
          if(teacher) h+='<div style="font-weight:700;font-size:.82em;color:var(--blue)">'+teacher+'</div>';
          if(subj)    h+='<div style="font-size:.76em;color:var(--tx2)">'+subj+'</div>';
        }
        h+='</td>';
      });
      h+='</tr>';
    }
    h+='</tbody></table></div>';
    return h;
  }

  // ── 단일 조회 ──
  function renderSinglePanel(){
    var h='<div class="filter-row" style="margin-bottom:10px">';
    h+='<select class="ti-sel" onchange="PageFull.setSingleMode(this.value)">';
    h+='<option value="class"'+(singleMode==='class'?' selected':'')+'>학급별</option>';
    h+='<option value="teacher"'+(singleMode==='teacher'?' selected':'')+'>교사별</option>';
    h+='</select>';
    h+='<select class="ti-sel" id="ffSel" onchange="PageFull.setSingleVal(this.value)"></select>';
    h+='</div><div style="overflow-x:auto" id="ffTable"></div>';
    return h;
  }

  function rSingleTable(){
    var el=document.getElementById('ffTable');
    if(!el) return;
    var today=Engine.today(),np=Engine.nowP(),CTM=Engine.CTM();
    var h='<table class="tt"><thead><tr><th></th>';
    for(var di=0;di<5;di++) for(var p=0;p<DP[DAYS[di]];p++) h+='<th>'+DAYS[di]+(p+1)+'</th>';
    h+='</tr></thead><tbody><tr><th>'+singleVal+'</th>';
    if(singleMode==='teacher'){
      var td=Engine.TD()[singleVal];
      var idx=0;
      for(var di=0;di<5;di++){
        var d=DAYS[di];
        for(var p=0;p<DP[d];p++){
          var cl=td?td.s[idx]:null;
          var isN=d===today&&p===np;
          if(!cl)          h+='<td class="'+(isN?'now-c':'emp')+'">—</td>';
          else if(cl==='동아리') h+='<td class="dong">동아리</td>';
          else{
            var sj=CS[cl]?(CS[cl][d][p]||''):cl;
            h+='<td class="'+(isN?'now-c':'my')+'">'+cl+'<br><span style="font-size:.74em;opacity:.7">'+sj+'</span></td>';
          }
          idx++;
        }
      }
    }else{
      for(var di=0;di<5;di++){
        var d=DAYS[di];
        for(var p=0;p<DP[d];p++){
          var key=singleVal+'|'+d+'|'+p,t=CTM[key]||'',sj='',isN=d===today&&p===np;
          if(CS[singleVal]) sj=CS[singleVal][d][p]||'';
          if(t) h+='<td class="'+(isN?'now-c':'my')+'"><b>'+t+'</b><br><span style="font-size:.74em;opacity:.7">'+sj+'</span></td>';
          else  h+='<td class="'+(isN?'now-c':'emp')+'">'+(sj||'—')+'</td>';
        }
      }
    }
    h+='</tr></tbody></table>';
    el.innerHTML=h;
  }

  // ── 빈 시간 ──
  function renderFreePanel(){
    var h='<div class="filter-row">';
    h+='<span class="filter-label">요일:</span>';
    DAYS.forEach(function(d){h+='<span class="chip'+(d===fD?' on':'')+'" onclick="PageFull.setFD(\''+d+'\')">'+d+'</span>'});
    h+='<span class="filter-label" style="margin-left:8px">교시:</span>';
    h+='<select class="ti-sel" id="fpSel">';
    for(var p=0;p<DP[fD];p++) h+='<option value="'+p+'"'+(p===fP?' selected':'')+'>'+(p+1)+'교시</option>';
    h+='</select></div><div id="freeResult"></div>';
    return h;
  }

  function rFreeResult(){
    var el=document.getElementById('freeResult');
    if(!el) return;
    var free=[];
    for(var t in Engine.TD()){if(Engine.TD()[t].h>0&&Engine.free(t,fD,fP))free.push(t)}
    free.sort();
    var h='<div style="margin-bottom:8px;font-size:.88em"><b>'+fD+' '+(fP+1)+'교시</b> — 빈 교사 <b style="color:var(--green)">'+free.length+'명</b></div>';
    free.forEach(function(t){h+='<span class="ftag">'+t+' ('+Engine.TS()[t]+')</span>'});
    el.innerHTML=h;
  }

  // ── 협의 찾기 ──
  function renderMatchPanel(){
    var h='<p style="color:var(--tx2);font-size:.83em;margin-bottom:10px">협의할 교사를 선택하면 공통 빈 시간을 찾아줍니다.</p>';
    h+='<div class="chips" style="max-height:180px;overflow-y:auto;padding:4px 0 8px">';
    Engine.names().forEach(function(n){
      if(Engine.TD()[n].h===0) return;
      var on=matchSel[n];
      h+='<span class="chip'+(on?' on':'')+'" onclick="PageFull.toggleMatch(\''+n+'\')">'+
        n+'<span class="csub">'+Engine.TS()[n]+'</span></span>';
    });
    h+='</div>';
    var cnt=Object.keys(matchSel).length;
    if(cnt>=2) h+='<button class="a-btn primary" onclick="PageFull.findMatch()">🔍 '+cnt+'명 공통 빈 시간 찾기</button>';
    else h+='<div style="color:var(--tx3);font-size:.85em">교사를 2명 이상 선택하세요</div>';
    h+='<div id="matchResult"></div>';
    return h;
  }

  function findMatch(){
    var teachers=Object.keys(matchSel);
    if(teachers.length<2) return;
    var results=[];
    for(var di=0;di<5;di++){
      var d=DAYS[di];
      for(var p=0;p<DP[d];p++){
        var allFree=teachers.every(function(t){return Engine.free(t,d,p)});
        if(allFree) results.push({day:d,period:p});
      }
    }
    var h='<div style="background:var(--bg2);border-radius:var(--radius);padding:14px;margin-top:12px">';
    h+='<div style="font-weight:700;margin-bottom:8px">📋 '+teachers.join(', ')+' 공통 빈 시간</div>';
    if(!results.length){
      h+='<div style="color:var(--red);font-size:.88em">공통 빈 시간이 없습니다.</div>';
    }else{
      h+='<div style="font-size:.88em;color:var(--green);margin-bottom:10px">총 <b>'+results.length+'개</b> 가능</div>';
      var byDay={};
      results.forEach(function(r){if(!byDay[r.day])byDay[r.day]=[];byDay[r.day].push(r.period)});
      for(var di=0;di<5;di++){
        var d=DAYS[di];
        if(!byDay[d]) continue;
        h+='<div style="margin-bottom:6px"><b>'+d+'요일:</b> ';
        byDay[d].forEach(function(p){h+='<span class="ftag">'+(p+1)+'교시 ('+PT[p].s+'~'+PT[p].e+')</span>'});
        h+='</div>';
      }
    }
    h+='</div>';
    document.getElementById('matchResult').innerHTML=h;
  }

  return{
    render:render,
    tab:function(t){viewTab=t;render()},
    setGrade:function(g){gradeFilter=g;render()},
    setGroupDay:function(d){groupDay=d;render()},
    setSingleMode:function(m){singleMode=m;singleVal='';render()},
    setSingleVal:function(v){singleVal=v;rSingleTable()},
    setFD:function(d){fD=d;fP=0;render()},
    toggleMatch:function(name){if(matchSel[name])delete matchSel[name];else matchSel[name]=true;render()},
    findMatch:findMatch
  };
})();
