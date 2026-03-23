// pages/all-timetable.js — 전체 시간표 + 협의 시간 매칭
var PageFull=(function(){
  var mode='class',val='1용1',fD='월',fP=0;
  var matchSel={}; // 협의 매칭 선택된 교사들

  function render(){
    var h='';
    // ── 1. 전체 시간표 ──
    h+='<div class="card"><div class="card-h">🏫 전체 시간표</div>';
    h+='<div class="filter-row"><span class="filter-label">보기:</span>';
    h+='<select class="ti-sel" onchange="PageFull.setMode(this.value)"><option value="class"'+(mode==='class'?' selected':'')+'>학급별</option><option value="teacher"'+(mode==='teacher'?' selected':'')+'>교사별</option></select>';
    h+='<select class="ti-sel" id="ffSel" onchange="PageFull.setVal(this.value)"></select></div>';
    h+='<div style="overflow-x:auto" id="ffTable"></div></div>';

    // ── 2. 빈 시간 교사 (기존) ──
    h+='<div class="card"><div class="card-h">🔍 빈 시간 교사 확인</div>';
    h+='<div class="filter-row"><span class="filter-label">요일:</span>';
    for(var di=0;di<5;di++){var d=DAYS[di];h+='<span class="chip'+(d===fD?' on':'')+'" onclick="PageFull.setFD(\''+d+'\')">'+d+'</span>'}
    h+='<span class="filter-label" style="margin-left:8px">교시:</span><select class="ti-sel" id="fpSel" onchange="PageFull.setFP(+this.value)">';
    for(var p=0;p<DP[fD];p++)h+='<option value="'+p+'"'+(p===fP?' selected':'')+'>'+(p+1)+'교시</option>';
    h+='</select></div><div id="freeR"></div></div>';

    // ── 3. 협의 시간 매칭 ──
    h+='<div class="card"><div class="card-h">🤝 협의 시간 찾기</div>';
    h+='<p style="color:var(--tx2);font-size:.83em;margin-bottom:10px">협의할 교사를 선택하면 공통 빈 시간을 찾아줍니다.</p>';
    h+='<div class="chips" id="matchChips">';
    var names=Engine.names();
    for(var i=0;i<names.length;i++){var n=names[i];
      if(Engine.TD()[n].h===0)continue; // 관리직 제외
      var on=matchSel[n];
      h+='<span class="chip'+(on?' on':'')+'" onclick="PageFull.toggleMatch(\''+n+'\')">'+n+'<span class="csub">'+Engine.TS()[n]+'</span></span>';
    }
    h+='</div>';
    var selCount=Object.keys(matchSel).length;
    if(selCount>=2){
      h+='<button class="a-btn primary" onclick="PageFull.findMatch()">🔍 '+selCount+'명 공통 빈 시간 찾기</button>';
    } else if(selCount===1){
      h+='<div style="color:var(--tx3);font-size:.85em">교사를 1명 더 선택하세요</div>';
    }
    h+='<div id="matchResult"></div></div>';

    document.getElementById('pg').innerHTML=h;
    buildSel();rTable();rFree();
  }

  function buildSel(){
    var sel=document.getElementById('ffSel');sel.innerHTML='';
    if(mode==='class'){var cls=Engine.allCls();for(var i=0;i<cls.length;i++)sel.innerHTML+='<option value="'+cls[i]+'">'+cls[i]+'</option>';if(cls.indexOf(val)<0)val=cls[0]||'';sel.value=val}
    else{var ns=Engine.names();for(var i=0;i<ns.length;i++)sel.innerHTML+='<option value="'+ns[i]+'">'+ns[i]+' ('+Engine.TS()[ns[i]]+')</option>';sel.value=App.getUser();val=App.getUser()}
  }

  function rTable(){
    var today=Engine.today(),np=Engine.nowP(),CTM=Engine.CTM();
    var h='<table class="tt"><thead><tr><th></th>';
    for(var di=0;di<5;di++)for(var p=0;p<DP[DAYS[di]];p++)h+='<th>'+DAYS[di]+(p+1)+'</th>';
    h+='</tr></thead><tbody><tr><th>'+val+'</th>';
    if(mode==='teacher'){var idx=0;for(var di=0;di<5;di++){var d=DAYS[di];for(var p=0;p<DP[d];p++){var cl=Engine.TD()[val].s[idx],isN=d===today&&p===np;
      if(!cl)h+='<td class="'+(isN?'now-c':'emp')+'">—</td>';else if(cl==='동아리')h+='<td class="dong">동아리</td>';
      else{var sj='';if(CS[cl])sj=CS[cl][d][p]||'';else sj=cl;h+='<td class="'+(isN?'now-c':'my')+'">'+cl+'<br><span style="font-size:.76em;opacity:.7">'+sj+'</span></td>'}idx++}}}
    else{for(var di=0;di<5;di++){var d=DAYS[di];for(var p=0;p<DP[d];p++){var key=val+'|'+d+'|'+p,t=CTM[key],sj='',isN=d===today&&p===np;if(CS[val])sj=CS[val][d][p]||'';
      if(t)h+='<td class="'+(isN?'now-c':'my')+'"><b>'+t+'</b><br><span style="font-size:.76em;opacity:.7">'+sj+'</span></td>';else h+='<td class="'+(isN?'now-c':'emp')+'">'+(sj||'—')+'</td>'}}}
    h+='</tr></tbody></table>';document.getElementById('ffTable').innerHTML=h;
  }

  function rFree(){
    var free=[];for(var t in Engine.TD()){if(Engine.free(t,fD,fP))free.push(t)}free.sort();
    var h='<div style="margin-bottom:6px;font-size:.88em"><b>'+fD+' '+(fP+1)+'교시</b> — 빈 교사 <b style="color:var(--green)">'+free.length+'명</b></div>';
    for(var i=0;i<free.length;i++)h+='<span class="ftag">'+free[i]+' ('+Engine.TS()[free[i]]+')</span>';
    document.getElementById('freeR').innerHTML=h;
  }

  // ── 협의 매칭 ──
  function toggleMatch(name){
    if(matchSel[name])delete matchSel[name];else matchSel[name]=true;
    render();
  }

  function findMatch(){
    var teachers=Object.keys(matchSel);
    if(teachers.length<2)return;

    var results=[];
    for(var di=0;di<5;di++){
      var d=DAYS[di];
      for(var p=0;p<DP[d];p++){
        var allFree=true;
        for(var ti=0;ti<teachers.length;ti++){
          if(!Engine.free(teachers[ti],d,p)){allFree=false;break}
        }
        if(allFree)results.push({day:d,period:p});
      }
    }

    var h='<div style="background:var(--bg2);border-radius:var(--radius);padding:14px;margin-top:12px">';
    h+='<div style="font-weight:700;margin-bottom:8px">📋 '+teachers.join(', ')+' 공통 빈 시간</div>';

    if(!results.length){
      h+='<div style="color:var(--red);font-size:.88em">공통 빈 시간이 없습니다.</div>';
    }else{
      h+='<div style="font-size:.88em;color:var(--green);margin-bottom:10px">총 <b>'+results.length+'개</b> 시간 가능</div>';
      // 요일별 그룹
      var byDay={};
      for(var i=0;i<results.length;i++){
        var r=results[i];
        if(!byDay[r.day])byDay[r.day]=[];
        byDay[r.day].push(r.period);
      }
      for(var di=0;di<5;di++){
        var d=DAYS[di];
        if(!byDay[d])continue;
        h+='<div style="margin-bottom:6px"><span style="font-weight:600;font-size:.9em">'+d+'요일:</span> ';
        for(var j=0;j<byDay[d].length;j++){
          var p=byDay[d][j];
          h+='<span class="ftag">'+(p+1)+'교시 ('+PT[p].s+'~'+PT[p].e+')</span>';
        }
        h+='</div>';
      }

      // 시각화 테이블
      h+='<div style="overflow-x:auto;margin-top:10px"><table class="tt"><thead><tr><th></th>';
      for(var di=0;di<5;di++)h+='<th>'+DAYS[di]+'</th>';
      h+='</tr></thead><tbody>';
      for(var p=0;p<7;p++){
        h+='<tr><th>'+(p+1)+'교시</th>';
        for(var di=0;di<5;di++){
          var d=DAYS[di];
          if(p>=DP[d]){h+='<td class="emp">—</td>';continue}
          var allF=true;
          var who=[];
          for(var ti=0;ti<teachers.length;ti++){
            var cl=Engine.slot(teachers[ti],d,p);
            if(cl){allF=false;who.push(teachers[ti].charAt(0)+':'+cl)}
          }
          if(allF){
            h+='<td style="background:#c8e6c9;color:var(--green);font-weight:700">✓ 가능</td>';
          }else{
            h+='<td class="emp" style="font-size:.7em">'+who.join('<br>')+'</td>';
          }
        }
        h+='</tr>';
      }
      h+='</tbody></table></div>';
    }
    h+='</div>';
    document.getElementById('matchResult').innerHTML=h;
  }

  return{
    render:render,
    setMode:function(m){mode=m;render()},
    setVal:function(v){val=v;rTable()},
    setFD:function(d){fD=d;fP=0;render()},
    setFP:function(p){fP=p;rFree()},
    toggleMatch:toggleMatch,
    findMatch:findMatch
  };
})();
