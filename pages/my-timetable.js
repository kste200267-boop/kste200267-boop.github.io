// pages/my-timetable.js — 내 시간표 (방과후 중복 표시 수정)
var PageMy=(function(){
  var wkOff=0, editMode=false;

  function getWk(){
    var d=new Date();d.setDate(d.getDate()+wkOff*7);
    return{key:Store.weekKey(d),mon:Store.getMonday(d)};
  }

  // 방과후 교시 정의 (요일별)
  // 월·화: 정규 7교시 이후 → 8·9·10교시
  // 수·목·금: 정규 6교시 이후 → 7·8·9교시
  var AFTER_DEF={
    '월':[{p:8,l:'8교시',t:'16:30~17:20'},{p:9,l:'9교시',t:'17:50~18:20'},{p:10,l:'10교시',t:'18:30~19:20'}],
    '화':[{p:8,l:'8교시',t:'16:30~17:20'},{p:9,l:'9교시',t:'17:50~18:20'},{p:10,l:'10교시',t:'18:30~19:20'}],
    '수':[{p:7,l:'7교시',t:'16:30~17:20'},{p:8,l:'8교시',t:'17:50~18:20'},{p:9,l:'9교시',t:'18:30~19:20'}],
    '목':[{p:7,l:'7교시',t:'16:30~17:20'},{p:8,l:'8교시',t:'17:50~18:20'},{p:9,l:'9교시',t:'18:30~19:20'}],
    '금':[{p:7,l:'7교시',t:'16:30~17:20'},{p:8,l:'8교시',t:'17:50~18:20'},{p:9,l:'9교시',t:'18:30~19:20'}]
  };

  function getAfter(n){return Store.get('after-'+n,[]);}
  function setAfter(n,d){Store.set('after-'+n,d);}

  function isInRange(item){
    if(!item.from&&!item.to)return true;
    var now=new Date().toISOString().slice(0,10);
    if(item.from&&now<item.from)return false;
    if(item.to&&now>item.to)return false;
    return true;
  }
  function getActiveAfter(n){return getAfter(n).filter(isInRange);}

  function migrateAfterItem(item){
    if(item.slots) return item;
    var slots=[];
    if(item.p8){slots.push({period:8,cls:item.p8});}
    if(item.p9){slots.push({period:9,cls:item.p9});}
    return{day:item.day,slots:slots,from:item.from||'',to:item.to||''};
  }

  function getAfterSlot(afterData,day,period){
    for(var i=0;i<afterData.length;i++){
      var item=migrateAfterItem(afterData[i]);
      if(item.day!==day)continue;
      for(var j=0;j<(item.slots||[]).length;j++){
        if(item.slots[j].period===period)return item.slots[j].cls||'';
      }
    }
    return '';
  }

  function getMyEdits(n){return Store.get('myedit-'+n,{});}
  function setMyEdits(n,d){Store.set('myedit-'+n,d);}

  function render(){
    var U=App.getUser(),w=getWk(),today=Engine.today(),np=Engine.nowP();
    Engine.rebuild(w.key);
    var edits=getMyEdits(U),TD=Engine.TD();
    if(TD[U]){
      for(var k in edits){
        var idx=parseInt(k);
        if(!isNaN(idx)&&idx>=0&&idx<32)TD[U].s[idx]=edits[k]||null;
      }
    }

    var mon=w.mon,sun=new Date(mon);sun.setDate(mon.getDate()+4);
    var label=(mon.getMonth()+1)+'/'+mon.getDate()+'~'+(sun.getMonth()+1)+'/'+sun.getDate()+' ('+w.key+')';
    var activeAfter=getActiveAfter(U).map(migrateAfterItem);

    var h='<div class="card">';
    h+='<div class="card-h">📅 '+U+' 시간표 ';
    h+='<span style="font-size:.75em;padding:2px 8px;border-radius:10px;background:'+(Engine.currentType()==='A'?'var(--blue)':'var(--purple)')+';color:#fff;font-weight:600">'+Engine.currentType()+'주</span>';
    h+='<span class="right"><button class="a-btn '+(editMode?'danger':'outline')+' sm" onclick="PageMy.toggleEdit()">'+(editMode?'✓ 완료':'✏️ 편집')+'</button></span></div>';
    h+='<div class="week-nav">';
    h+='<button onclick="PageMy.prev()">◀</button>';
    h+='<span class="wk-label">'+label+'</span>';
    h+='<button onclick="PageMy.next()">▶</button>';
    h+='<button onclick="PageMy.today()" style="margin-left:4px">이번주</button></div>';
    if(editMode)h+='<div style="padding:6px 10px;background:#fff3e0;border-radius:6px;font-size:.8em;color:#e65100;margin-bottom:8px">✏️ 셀 클릭하여 수업 반 입력. 빈칸=빈시간</div>';

    h+='<div style="overflow-x:auto"><table class="tt"><thead><tr><th></th>';
    for(var di=0;di<5;di++) h+='<th>'+DAYS[di]+'</th>';
    h+='</tr></thead><tbody>';

    // ── 정규 시간표 (maxP=7로 고정, 없는 교시는 회색) ──
    var maxP=7;
    for(var p=0;p<maxP;p++){
      h+='<tr><th>'+(p+1)+'교시<br><span style="font-weight:400;font-size:.76em">'+PT[p].s+'~'+PT[p].e+'</span></th>';
      for(var di=0;di<5;di++){
        var d=DAYS[di];

        // ★ 핵심 수정: 해당 요일에 이 교시가 정규 교시인지 확인
        var isRegular=(p<DP[d]);

        if(!isRegular){
          // 수목금 7교시 등 정규에 없는 교시 → 방과후가 있으면 방과후 표시, 없으면 회색
          var isDef=(AFTER_DEF[d]||[]).some(function(def){return def.p===(p+1);});
          if(isDef){
            // 이 칸은 방과후 행에서 처리하므로 여기선 회색
            h+='<td style="background:var(--bg3);color:var(--tx3);font-size:.76em">방과후↓</td>';
          }else{
            h+='<td class="emp" style="background:var(--bg3)">—</td>';
          }
          continue;
        }

        var si=Engine.si(d,p);
        var cl=TD[U]?TD[U].s[si]:null;
        var isN=wkOff===0&&d===today&&p===np;
        var isS=Engine.isSwapped(U,d,p,w.key);
        var isE=edits.hasOwnProperty(String(si));
        var cls_=isN?'now-c':cl?(isS||isE?'swapped':'my'):'emp';
        var sj='';
        var _mySj=Store.get('tt-subj-'+U,{})||{};
        var _siKey=String(Engine.si(d,p));
        if(_mySj[_siKey])sj=_mySj[_siKey];
        else if(cl&&CS[cl])sj=CS[cl][d][p]||'';
        else if(cl)sj=cl;

        if(editMode){
          h+='<td class="'+cls_+'" style="cursor:pointer" onclick="PageMy.editCell('+si+',\''+d+'\','+(p+1)+')">'+(cl||'<span style="color:var(--tx3)">—</span>')+'</td>';
        }else{
          if(cl==='동아리')h+='<td class="dong">동아리</td>';
          else h+='<td class="'+cls_+'">'+(cl?(cl+'<br><span style="font-size:.78em;opacity:.7">'+sj+'</span>'):'—')+'</td>';
        }
      }
      h+='</tr>';
    }

    // ── 방과후 행 ──
    // 월화: 8,9,10교시 / 수목금: 7,8,9교시
    // 중복 방지: 각 period는 한 번만 행으로 표시
    var allAfterPeriods={};
    DAYS.forEach(function(d){
      (AFTER_DEF[d]||[]).forEach(function(def){
        allAfterPeriods[def.p]=true;
      });
    });
    var sortedPeriods=Object.keys(allAfterPeriods).map(Number).sort(function(a,b){return a-b;});

    sortedPeriods.forEach(function(period){
      h+='<tr style="background:#fdf4ff">';
      // 라벨
      var timeStr='';
      var firstDef=(AFTER_DEF['월']||[]).find(function(d){return d.p===period;})||
                   (AFTER_DEF['수']||[]).find(function(d){return d.p===period;});
      if(firstDef)timeStr=firstDef.t;
      h+='<th style="background:#e1bee7;font-size:.76em;padding:5px 4px;white-space:nowrap">'+period+'교시<br><span style="font-weight:400;font-size:.9em">방과후</span><br><span style="font-weight:400">'+timeStr+'</span></th>';

      for(var di=0;di<5;di++){
        var d=DAYS[di];
        var isDef=(AFTER_DEF[d]||[]).some(function(def){return def.p===period;});
        if(!isDef){
          h+='<td style="background:var(--bg3);color:var(--tx3);font-size:.76em">—</td>';
          continue;
        }
        var val=getAfterSlot(activeAfter,d,period);
        if(editMode){
          h+='<td style="cursor:pointer;background:#f3e5f5" onclick="PageMy.editAfterSlot(\''+d+'\','+period+')">';
          h+=(val||'<span style="color:var(--tx3)">+</span>')+'</td>';
        }else{
          h+='<td style="background:'+(val?'#ce93d8;color:#fff;font-weight:600':'#f3e5f5;color:var(--tx3)')+';font-size:.82em">'+(val||'—')+'</td>';
        }
      }
      h+='</tr>';
    });

    h+='</tbody></table></div></div>';

    // 요약 카드
    var perD={};
    for(var di=0;di<5;di++){
      var d=DAYS[di],dc=0;
      for(var p=0;p<DP[d];p++){if(Engine.slot(U,d,p))dc++;}
      perD[d]=dc;
    }
    var ac=0;
    activeAfter.forEach(function(item){ac+=(item.slots||[]).filter(function(s){return s.cls;}).length;});

    h+='<div class="card"><div class="card-h">📊 요약</div>';
    h+='<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:.88em">';
    h+='<div><span style="color:var(--tx2)">정규:</span> <b>'+TD[U].h+'h</b></div>';
    if(ac)h+='<div><span style="color:var(--purple)">방과후:</span> <b>'+ac+'h</b></div>';
    for(var di=0;di<5;di++)h+='<div><span style="color:var(--tx2)">'+DAYS[di]+':</span> '+perD[DAYS[di]]+'</div>';
    h+='</div><div style="margin-top:6px;font-size:.78em;color:var(--tx3)">🟧 수정/교체 · 🟪 방과후</div></div>';

    // 방과후 관리
    h+='<div class="card"><div class="card-h">🌙 방과후 수업 관리</div>';
    h+='<p style="color:var(--tx2);font-size:.82em;margin-bottom:10px">월·화: 8·9·10교시 / 수·목·금: 7·8·9교시 &nbsp;|&nbsp; 기간 설정 가능</p>';
    var allAfter=getAfter(U).map(migrateAfterItem);
    h+='<div id="afterList">';
    if(!allAfter.length)h+='<div style="color:var(--tx3);font-size:.85em;padding:8px">등록된 방과후 없음</div>';
    allAfter.forEach(function(item,i){
      var expired=!isInRange(item);
      var slotStr=(item.slots||[]).filter(function(s){return s.cls;}).map(function(s){return s.period+'교시:'+s.cls;}).join(' / ');
      h+='<div style="display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--bd);border-radius:6px;margin-bottom:6px;opacity:'+(expired?.4:1)+'">';
      h+='<div style="font-weight:600;min-width:28px">'+item.day+'</div>';
      h+='<div style="flex:1;font-size:.85em">'+(slotStr||'<span style="color:var(--tx3)">없음</span>')+'</div>';
      h+='<div style="font-size:.78em;color:'+(expired?'var(--red)':'var(--green)')+';">';
      h+=(item.from||'시작없음')+' ~ '+(item.to||'종료없음')+(expired?' (만료)':'');
      h+='</div>';
      h+='<button class="a-btn danger sm" onclick="PageMy.delAfter('+i+')">✕</button>';
      h+='</div>';
    });
    h+='</div>';

    // 추가 폼
    h+='<div style="margin-top:12px;padding:12px;background:var(--bg2);border-radius:var(--radius-sm)">';
    h+='<div style="font-weight:600;font-size:.88em;margin-bottom:10px">➕ 방과후 추가</div>';
    h+='<div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;flex-wrap:wrap">';
    h+='<span style="font-size:.82em;font-weight:600;color:var(--tx2)">요일:</span>';
    DAYS.forEach(function(d){
      h+='<span class="chip" id="afDay_'+d+'" onclick="PageMy.selAfterDay(\''+d+'\')">'+d+'</span>';
    });
    h+='</div>';
    h+='<div id="afSlots" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">';
    h+='<span style="color:var(--tx3);font-size:.84em">요일을 먼저 선택하세요</span>';
    h+='</div>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-end">';
    h+='<div><div style="font-size:.78em;color:var(--tx2);margin-bottom:2px">시작일</div><input class="ti-input" id="afFrom" type="date" style="width:130px"></div>';
    h+='<div><div style="font-size:.78em;color:var(--tx2);margin-bottom:2px">종료일</div><input class="ti-input" id="afTo" type="date" style="width:130px"></div>';
    h+='<button class="a-btn primary" onclick="PageMy.addAfter()">추가</button>';
    h+='</div></div></div>';

    document.getElementById('pg').innerHTML=h;
    Engine.rebuild();
    window._afSelDay=null;
  }

  function selAfterDay(day){
    window._afSelDay=day;
    DAYS.forEach(function(d){
      var el=document.getElementById('afDay_'+d);
      if(el)el.className='chip'+(d===day?' on':'');
    });
    var defs=AFTER_DEF[day]||[];
    var h='';
    defs.forEach(function(def){
      h+='<div style="display:flex;flex-direction:column;gap:2px">';
      h+='<div style="font-size:.76em;color:var(--tx2)">'+def.l+' <span style="color:var(--tx3)">'+def.t+'</span></div>';
      h+='<input class="ti-input" id="afSlot_'+def.p+'" placeholder="반명 (예:2용1)" style="width:90px">';
      h+='</div>';
    });
    var el=document.getElementById('afSlots');
    if(el)el.innerHTML=h;
  }

  function addAfter(){
    var U=App.getUser();
    var day=window._afSelDay;
    if(!day){toast('요일을 선택하세요');return;}
    var defs=AFTER_DEF[day]||[];
    var slots=[];
    defs.forEach(function(def){
      var el=document.getElementById('afSlot_'+def.p);
      var val=el?el.value.trim():'';
      if(val)slots.push({period:def.p,cls:val});
    });
    if(!slots.length){toast('최소 1개 교시 반을 입력하세요');return;}
    var from=document.getElementById('afFrom').value;
    var to=document.getElementById('afTo').value;
    var data=getAfter(U).map(migrateAfterItem);
    data.push({day:day,slots:slots,from:from,to:to});
    setAfter(U,data);
    toast(day+' 방과후 추가됨');
    render();
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

  function editAfterSlot(day,period){
    var U=App.getUser();
    var data=getAfter(U).map(migrateAfterItem);
    var found=null;
    for(var i=0;i<data.length;i++){
      if(data[i].day===day&&isInRange(data[i])){found=data[i];break;}
    }
    var cur='';
    if(found){
      var sl=(found.slots||[]).find(function(s){return s.period===period;});
      if(sl)cur=sl.cls||'';
    }
    var val=prompt(day+' '+period+'교시 방과후 반:',cur);
    if(val===null)return;
    val=val.trim();
    if(!found){found={day:day,slots:[],from:'',to:''};data.push(found);}
    var slotIdx=-1;
    for(var j=0;j<found.slots.length;j++){if(found.slots[j].period===period){slotIdx=j;break;}}
    if(val){
      if(slotIdx>=0)found.slots[slotIdx].cls=val;
      else found.slots.push({period:period,cls:val});
    }else{
      if(slotIdx>=0)found.slots.splice(slotIdx,1);
    }
    setAfter(U,data);toast('저장됨');render();
  }

  function delAfter(idx){
    var U=App.getUser();
    var data=getAfter(U).map(migrateAfterItem);
    data.splice(idx,1);setAfter(U,data);toast('삭제됨');render();
  }

  return{
    render:render,
    prev:function(){wkOff--;render();},
    next:function(){wkOff++;render();},
    today:function(){wkOff=0;render();},
    toggleEdit:function(){editMode=!editMode;render();},
    editCell:editCell,
    editAfterSlot:editAfterSlot,
    selAfterDay:selAfterDay,
    addAfter:addAfter,
    delAfter:delAfter
  };
})();
