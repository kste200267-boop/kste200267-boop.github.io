// pages/my-timetable.js
var PageMy=(function(){
  var wkOff=0; // 0=이번주, -1=지난주, +1=다음주
  function getWk(){var d=new Date();d.setDate(d.getDate()+wkOff*7);return{key:Store.weekKey(d),mon:Store.getMonday(d)}}
  function render(){
    var U=App.getUser(),w=getWk(),today=Engine.today(),np=Engine.nowP();
    Engine.rebuild(w.key);
    var mon=w.mon,sun=new Date(mon);sun.setDate(mon.getDate()+4);
    var label=(mon.getMonth()+1)+'/'+mon.getDate()+'~'+(sun.getMonth()+1)+'/'+sun.getDate()+' ('+w.key+')';

    var h='<div class="card"><div class="card-h">📅 '+U+' 시간표<span class="right" style="font-size:.78em;color:var(--tx2)">교체 반영됨</span></div>';
    h+='<div class="week-nav"><button onclick="PageMy.prev()">◀</button><span class="wk-label">'+label+'</span><button onclick="PageMy.next()">▶</button><button onclick="PageMy.today()" style="margin-left:4px">이번주</button></div>';
    h+='<div style="overflow-x:auto"><table class="tt"><thead><tr><th></th>';
    for(var di=0;di<5;di++)h+='<th>'+DAYS[di]+'</th>';
    h+='</tr></thead><tbody>';
    for(var p=0;p<7;p++){
      h+='<tr><th>'+(p+1)+'교시<br><span style="font-weight:400;font-size:.76em">'+PT[p].s+'~'+PT[p].e+'</span></th>';
      for(var di=0;di<5;di++){var d=DAYS[di];
        if(p>=DP[d]){h+='<td class="emp">—</td>';continue}
        var cl=Engine.slot(U,d,p),isN=wkOff===0&&d===today&&p===np;
        var isS=Engine.isSwapped(U,d,p,w.key);
        var cls=isN?'now-c':cl?(isS?'swapped':'my'):'emp';
        var sj='';if(cl&&CS[cl])sj=CS[cl][d][p]||'';else if(cl)sj=cl;
        if(cl==='동아리')h+='<td class="dong">동아리</td>';
        else h+='<td class="'+cls+'">'+(cl?(cl+'<br><span style="font-size:.78em;opacity:.7">'+sj+'</span>'):'—')+'</td>';
      }h+='</tr>';
    }
    h+='</tbody></table></div></div>';
    h+='<div class="card"><div class="card-h">📊 요약</div><div style="display:flex;gap:14px;flex-wrap:wrap;font-size:.88em">';
    var perD={};for(var di=0;di<5;di++){var d=DAYS[di],dc=0;for(var p=0;p<DP[d];p++){if(Engine.slot(U,d,p))dc++}perD[d]=dc}
    h+='<div><span style="color:var(--tx2)">주당:</span> <b>'+Engine.TD()[U].h+'h</b></div>';
    for(var di=0;di<5;di++)h+='<div><span style="color:var(--tx2)">'+DAYS[di]+':</span> '+perD[DAYS[di]]+'</div>';
    h+='</div><div style="margin-top:8px;font-size:.8em;color:var(--tx3)">🟧 주황색 = 이번 주 교체된 수업</div></div>';
    document.getElementById('pg').innerHTML=h;
    Engine.rebuild(); // 현재 주로 복원
  }
  return{render:render,prev:function(){wkOff--;render()},next:function(){wkOff++;render()},today:function(){wkOff=0;render()}};
})();
