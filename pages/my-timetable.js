// pages/my-timetable.js — 내 시간표 (편집+방과후 기간설정)
var PageMy=(function(){
  var wkOff=0,editMode=false;
  function getWk(){var d=new Date();d.setDate(d.getDate()+wkOff*7);return{key:Store.weekKey(d),mon:Store.getMonday(d)}}

  // 방과후: {교사: [{day,p8,p9,from:'2026-03-24',to:'2026-07-18'}, ...]}
  function getAfter(n){return Store.get('after-'+n,[])}
  function setAfter(n,d){Store.set('after-'+n,d)}
  // 기간 내인지 확인
  function isInRange(item){
    if(!item.from&&!item.to)return true;
    var now=new Date().toISOString().slice(0,10);
    if(item.from&&now<item.from)return false;
    if(item.to&&now>item.to)return false;
    return true;
  }
  function getActiveAfter(n){return getAfter(n).filter(isInRange)}

  function getMyEdits(n){return Store.get('myedit-'+n,{})}
  function setMyEdits(n,d){Store.set('myedit-'+n,d)}

  function render(){
    var U=App.getUser(),w=getWk(),today=Engine.today(),np=Engine.nowP();
    Engine.rebuild(w.key);
    var edits=getMyEdits(U),TD=Engine.TD();
    if(TD[U]){for(var k in edits){var idx=parseInt(k);if(!isNaN(idx)&&idx>=0&&idx<32)TD[U].s[idx]=edits[k]||null}}

    var mon=w.mon,sun=new Date(mon);sun.setDate(mon.getDate()+4);
    var label=(mon.getMonth()+1)+'/'+mon.getDate()+'~'+(sun.getMonth()+1)+'/'+sun.getDate()+' ('+w.key+')';

    var h='<div class="card"><div class="card-h">📅 '+U+' 시간표 <span style="font-size:.75em;padding:2px 8px;border-radius:10px;background:'+(Engine.currentType()==='A'?'var(--blue)':'var(--purple)')+';color:#fff;font-weight:600">'+Engine.currentType()+'주</span><span class="right"><button class="a-btn '+(editMode?'danger':'outline')+' sm" onclick="PageMy.toggleEdit()">'+(editMode?'✓ 완료':'✏️ 편집')+'</button></span></div>';
    h+='<div class="week-nav"><button onclick="PageMy.prev()">◀</button><span class="wk-label">'+label+'</span><button onclick="PageMy.next()">▶</button><button onclick="PageMy.today()" style="margin-left:4px">이번주</button></div>';
    if(editMode)h+='<div style="padding:6px 10px;background:#fff3e0;border-radius:6px;font-size:.8em;color:#e65100;margin-bottom:8px">✏️ 셀 클릭하여 수업 반 입력. 빈칸=빈시간</div>';

    h+='<div style="overflow-x:auto"><table class="tt"><thead><tr><th></th>';
    for(var di=0;di<5;di++)h+='<th>'+DAYS[di]+'</th>';
    h+='</tr></thead><tbody>';

    // 정규 7교시
    for(var p=0;p<7;p++){
      h+='<tr><th>'+(p+1)+'교시<br><span style="font-weight:400;font-size:.76em">'+PT[p].s+'~'+PT[p].e+'</span></th>';
      for(var di=0;di<5;di++){var d=DAYS[di];
        if(p>=DP[d]){h+='<td class="emp">—</td>';continue}
        var si=Engine.si(d,p),cl=TD[U]?TD[U].s[si]:null;
        var isN=wkOff===0&&d===today&&p===np,isS=Engine.isSwapped(U,d,p,w.key);
        var isE=edits.hasOwnProperty(String(si));
        var cls=isN?'now-c':cl?(isS||isE?'swapped':'my'):'emp';
        var sj='';var _mySj=Store.get('tt-subj-'+U,{});var _siKey=String(Engine.si(d,p));if(_mySj[_siKey])sj=_mySj[_siKey];else if(cl&&CS[cl])sj=CS[cl][d][p]||'';else if(cl)sj=cl;
        if(editMode){
          h+='<td class="'+cls+'" style="cursor:pointer" onclick="PageMy.editCell('+si+',\''+d+'\','+(p+1)+')">'+(cl||'<span style="color:var(--tx3)">—</span>')+'</td>';
        }else{
          if(cl==='동아리')h+='<td class="dong">동아리</td>';
          else h+='<td class="'+cls+'">'+(cl?(cl+'<br><span style="font-size:.78em;opacity:.7">'+sj+'</span>'):'—')+'</td>';
        }
      }h+='</tr>';
    }

    // 방과후 (기간 내만)
    var afterData=getActiveAfter(U);
    var aPT=[{l:'8교시(방과후)',t:'16:30~17:20'},{l:'9교시(방과후)',t:'17:50~18:20'}];
   var afterDays = ['수','목','금'];

for(var ap=0;ap<2;ap++){
  h+='<tr style="background:#f3e5f5"><th style="background:#e1bee7;font-size:.76em">'+aPT[ap].l+'<br><span style="font-weight:400">'+aPT[ap].t+'</span></th>';
  for(var di=0;di<5;di++){
    var d=DAYS[di], val='';

    if(!afterDays.includes(d)){
      h+='<td class="emp">—</td>';
      continue;
    }

    for(var ai=0;ai<afterData.length;ai++){
      if(afterData[ai].day===d){
        val=ap===0 ? (afterData[ai].p8||'') : (afterData[ai].p9||'');
        break;
      }
    }

    if(editMode){
      h+='<td style="cursor:pointer;background:#f3e5f5" onclick="PageMy.editAfter(\''+d+'\','+ap+')">'+(val||'<span style="color:var(--tx3)">+</span>')+'</td>';
    }else{
      h+='<td style="background:'+(val?'#ce93d8;color:#fff':'#f3e5f5;color:var(--tx3)')+';font-size:.82em">'+(val||'—')+'</td>';
    }
  }
  h+='</tr>';
}
    h+='</tbody></table></div></div>';

    // 요약
    var perD={};for(var di=0;di<5;di++){var d=DAYS[di],dc=0;for(var p=0;p<DP[d];p++){if(Engine.slot(U,d,p))dc++}perD[d]=dc}
    var ac=0;for(var i=0;i<afterData.length;i++){if(afterData[i].p8)ac++;if(afterData[i].p9)ac++}
    h+='<div class="card"><div class="card-h">📊 요약</div><div style="display:flex;gap:12px;flex-wrap:wrap;font-size:.88em">';
    h+='<div><span style="color:var(--tx2)">정규:</span> <b>'+TD[U].h+'h</b></div>';
    if(ac)h+='<div><span style="color:var(--purple)">방과후:</span> <b>'+ac+'h</b></div>';
    for(var di=0;di<5;di++)h+='<div><span style="color:var(--tx2)">'+DAYS[di]+':</span> '+perD[DAYS[di]]+'</div>';
    h+='</div><div style="margin-top:6px;font-size:.78em;color:var(--tx3)">🟧 수정/교체 · 🟪 방과후</div></div>';

    // 방과후 관리 (기간 포함)
    h+='<div class="card"><div class="card-h">🌙 방과후 수업 관리</div>';
    h+='<p style="color:var(--tx2);font-size:.82em;margin-bottom:10px">기간을 설정하면 해당 기간에만 시간표에 표시됩니다. 기간이 지나면 자동으로 사라집니다.</p>';
    var allAfter=getAfter(U);
    // 기간별 그룹
    h+='<div id="afterList">';
    if(!allAfter.length)h+='<div style="color:var(--tx3);font-size:.85em;padding:8px">등록된 방과후 없음</div>';
    for(var i=0;i<allAfter.length;i++){var a=allAfter[i];
      var expired=!isInRange(a);
      h+='<div style="display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--bd);border-radius:6px;margin-bottom:6px;opacity:'+(expired?.4:1)+'">';
      h+='<div style="font-weight:600;min-width:30px">'+a.day+'</div>';
      h+='<div style="flex:1;font-size:.85em">';
      if(a.p8)h+='8교시: <b>'+a.p8+'</b> ';
      if(a.p9)h+='9교시: <b>'+a.p9+'</b>';
      if(!a.p8&&!a.p9)h+='<span style="color:var(--tx3)">없음</span>';
      h+='</div>';
      h+='<div style="font-size:.78em;color:'+(expired?'var(--red)':'var(--green)')+'">'+(a.from||'시작없음')+' ~ '+(a.to||'종료없음')+(expired?' (만료)':'')+'</div>';
      h+='<button class="a-btn danger sm" onclick="PageMy.delAfter('+i+')">✕</button>';
      h+='</div>';
    }
    h+='</div>';

    // 추가 폼
    h+='<div style="margin-top:12px;padding:12px;background:var(--bg2);border-radius:var(--radius-sm)">';
    h+='<div style="font-weight:600;font-size:.88em;margin-bottom:8px">➕ 방과후 추가</div>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-end">';
    h+='h+='<div><div style="font-size:.78em;color:var(--tx2);margin-bottom:2px">요일</div><select class="ti-sel" id="afDay"><option>수</option><option>목</option><option>금</option></select></div>';
    h+='<div><div style="font-size:.78em;color:var(--tx2);margin-bottom:2px">8교시</div><input class="ti-input" id="afP8" placeholder="반명" style="width:80px"></div>';
    h+='<div><div style="font-size:.78em;color:var(--tx2);margin-bottom:2px">9교시</div><input class="ti-input" id="afP9" placeholder="반명" style="width:80px"></div>';
    h+='<div><div style="font-size:.78em;color:var(--tx2);margin-bottom:2px">시작일</div><input class="ti-input" id="afFrom" type="date" style="width:130px"></div>';
    h+='<div><div style="font-size:.78em;color:var(--tx2);margin-bottom:2px">종료일</div><input class="ti-input" id="afTo" type="date" style="width:130px"></div>';
    h+='<button class="a-btn primary" onclick="PageMy.addAfter()">추가</button>';
    h+='</div></div></div>';

    document.getElementById('pg').innerHTML=h;
    Engine.rebuild();
  }

  function editCell(si,day,period){
    var U=App.getUser(),edits=getMyEdits(U);
    var cur=edits.hasOwnProperty(String(si))?edits[String(si)]:(TD_A[U]?TD_A[U].s[si]:'');
    var val=prompt(day+' '+period+'교시 수업 반:',cur||'');
    if(val===null)return;
    edits[String(si)]=val.trim()||null;setMyEdits(U,edits);
    if(TD_A[U])TD_A[U].s[si]=val.trim()||null;
    Engine.rebuild();toast('수정됨');render();
  }

  function editAfter(day,pIdx){
    var U=App.getUser(),data=getAfter(U),found=null;
    for(var i=0;i<data.length;i++){if(data[i].day===day&&isInRange(data[i])){found=data[i];break}}
    var cur=found?(pIdx===0?found.p8||'':found.p9||''):'';
    var val=prompt(day+' '+(pIdx===0?'8':'9')+'교시 방과후:',cur);
    if(val===null)return;
    if(!found){found={day:day,p8:'',p9:'',from:'',to:''};data.push(found)}
    if(pIdx===0)found.p8=val.trim();else found.p9=val.trim();
    setAfter(U,data);toast('저장됨');render();
  }

 function addAfter(){
  var U=App.getUser(),data=getAfter(U);
  var day=document.getElementById('afDay').value;
  var p8=document.getElementById('afP8').value.trim();
  var p9=document.getElementById('afP9').value.trim();
  var from=document.getElementById('afFrom').value;
  var to=document.getElementById('afTo').value;

  if(['수','목','금'].indexOf(day)===-1){
    toast('방과후는 수·목·금만 추가할 수 있습니다');
    return;
  }

  if(!p8&&!p9){
    toast('8교시 또는 9교시를 입력하세요');
    return;
  }

  data.push({day:day,p8:p8,p9:p9,from:from,to:to});
  setAfter(U,data);
  toast(day+' 방과후 추가됨');
  render();
}

  function delAfter(idx){
    var U=App.getUser(),data=getAfter(U);
    data.splice(idx,1);setAfter(U,data);toast('삭제됨');render();
  }

  return{render:render,prev:function(){wkOff--;render()},next:function(){wkOff++;render()},today:function(){wkOff=0;render()},
    toggleEdit:function(){editMode=!editMode;render()},editCell:editCell,editAfter:editAfter,addAfter:addAfter,delAfter:delAfter};
})();
