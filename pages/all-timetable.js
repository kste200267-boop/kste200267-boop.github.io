// pages/all-timetable.js
var PageFull=(function(){
  var mode='class',val='1용1',fD='월',fP=0;
  function render(){
    var h='<div class="card"><div class="card-h">🏫 전체 시간표</div>';
    h+='<div class="filter-row"><span class="filter-label">보기:</span>';
    h+='<select class="ti-sel" onchange="PageFull.setMode(this.value)"><option value="class"'+(mode==='class'?' selected':'')+'>학급별</option><option value="teacher"'+(mode==='teacher'?' selected':'')+'>교사별</option></select>';
    h+='<select class="ti-sel" id="ffSel" onchange="PageFull.setVal(this.value)"></select></div>';
    h+='<div style="overflow-x:auto" id="ffTable"></div></div>';
    h+='<div class="card"><div class="card-h">🔍 빈 시간 교사</div>';
    h+='<div class="filter-row"><span class="filter-label">요일:</span>';
    for(var di=0;di<5;di++){var d=DAYS[di];h+='<span class="chip'+(d===fD?' on':'')+'" onclick="PageFull.setFD(\''+d+'\')">'+d+'</span>'}
    h+='<span class="filter-label" style="margin-left:8px">교시:</span><select class="ti-sel" id="fpSel" onchange="PageFull.setFP(+this.value)">';
    for(var p=0;p<DP[fD];p++)h+='<option value="'+p+'"'+(p===fP?' selected':'')+'>'+(p+1)+'교시</option>';
    h+='</select></div><div id="freeR"></div></div>';
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
  return{render:render,setMode:function(m){mode=m;render()},setVal:function(v){val=v;rTable()},setFD:function(d){fD=d;fP=0;render()},setFP:function(p){fP=p;rFree()}};
})();
