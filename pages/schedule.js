// pages/schedule.js — 학사일정+주간업무 통합 캘린더
var PageSchedule=(function(){
  var monthOff=0;
  var viewMode='month'; // month or week
  var weekOff=0;

  function render(){
    var h='<div class="card"><div class="card-h">📆 학사일정 · 주간업무 통합</div>';
    h+='<div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;flex-wrap:wrap">';
    h+='<span class="chip'+(viewMode==='month'?' on':'')+'" onclick="PageSchedule.setView(\'month\')">월간</span>';
    h+='<span class="chip'+(viewMode==='week'?' on':'')+'" onclick="PageSchedule.setView(\'week\')">주간</span>';
    if(viewMode==='month'){
      var d=new Date();d.setMonth(d.getMonth()+monthOff);
      var label=d.getFullYear()+'년 '+(d.getMonth()+1)+'월';
      h+='<button class="a-btn outline sm" onclick="PageSchedule.pm()">◀</button>';
      h+='<span style="font-weight:700;min-width:120px;text-align:center;font-size:.9em">'+label+'</span>';
      h+='<button class="a-btn outline sm" onclick="PageSchedule.nm()">▶</button>';
      h+='<button class="a-btn outline sm" onclick="PageSchedule.tm()">이번달</button>';
    }else{
      var wd=new Date();wd.setDate(wd.getDate()+weekOff*7);var wm=Store.getMonday(wd);
      var ws=new Date(wm);ws.setDate(wm.getDate()+6);
      var label=(wm.getMonth()+1)+'/'+wm.getDate()+'~'+(ws.getMonth()+1)+'/'+ws.getDate();
      h+='<button class="a-btn outline sm" onclick="PageSchedule.pw()">◀</button>';
      h+='<span style="font-weight:700;min-width:160px;text-align:center;font-size:.9em">'+label+'</span>';
      h+='<button class="a-btn outline sm" onclick="PageSchedule.nw()">▶</button>';
      h+='<button class="a-btn outline sm" onclick="PageSchedule.tw()">이번주</button>';
    }
    h+='</div><div id="calBody" style="color:var(--tx3);padding:20px;text-align:center">🔄 불러오는 중...</div></div>';
    document.getElementById('pg').innerHTML=h;
    loadData();
  }

  function loadData(){
    var from,to;
    if(viewMode==='month'){
      var d=new Date();d.setMonth(d.getMonth()+monthOff);
      from=d.getFullYear()+Neis.pad(d.getMonth()+1)+'01';
      var last=new Date(d.getFullYear(),d.getMonth()+1,0);
      to=d.getFullYear()+Neis.pad(d.getMonth()+1)+Neis.pad(last.getDate());
    }else{
      var wd=new Date();wd.setDate(wd.getDate()+weekOff*7);var wm=Store.getMonday(wd);
      var ws=new Date(wm);ws.setDate(wm.getDate()+6);
      from=Neis.ymd(wm);to=Neis.ymd(ws);
    }
    Neis.getSchedule(from,to,function(events){
      if(viewMode==='month')renderMonth(events);
      else renderWeek(events);
    });
  }

  function renderMonth(events){
    var d=new Date();d.setMonth(d.getMonth()+monthOff);
    var y=d.getFullYear(),m=d.getMonth();
    var dn=['일','월','화','수','목','금','토'];
    var firstDay=new Date(y,m,1).getDay();
    var lastDate=new Date(y,m+1,0).getDate();
    var todayStr=Neis.ymd(new Date());

    // 이벤트 맵
    var evMap={};
    for(var i=0;i<events.length;i++){var e=events[i];if(!evMap[e.date])evMap[e.date]=[];evMap[e.date].push(e)}

    var h='<div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:.8em;font-weight:600;color:var(--tx2);margin-bottom:4px">';
    for(var i=0;i<7;i++)h+='<div style="padding:4px;'+(i===0?'color:var(--red)':'')+(i===6?'color:var(--blue)':'')+'">'+dn[i]+'</div>';
    h+='</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">';
    for(var i=0;i<firstDay;i++)h+='<div style="min-height:70px"></div>';
    for(var day=1;day<=lastDate;day++){
      var ds=y+Neis.pad(m+1)+Neis.pad(day);
      var dow=new Date(y,m,day).getDay();
      var isT=ds===todayStr;
      var dayEv=evMap[ds]||[];
      h+='<div style="min-height:70px;padding:3px;border-radius:4px;background:'+(isT?'var(--blue-bg)':'var(--bg)')+';border:1px solid '+(isT?'var(--blue)':'var(--bd)')+'">';
      h+='<div style="font-size:.78em;font-weight:'+(isT?700:500)+';color:'+(dow===0?'var(--red)':dow===6?'var(--blue)':isT?'var(--blue)':'var(--tx)')+';margin-bottom:2px">'+day+'</div>';
      var seen={};
      for(var j=0;j<dayEv.length;j++){var ev=dayEv[j];if(seen[ev.name])continue;seen[ev.name]=1;
        var color=ev.type==='휴업일'?'var(--red)':ev.name.indexOf('시험')>=0?'var(--orange)':'var(--green)';
        h+='<div style="font-size:.65em;padding:1px 3px;margin-bottom:1px;border-radius:2px;background:'+color+';color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+ev.name+'">'+ev.name+'</div>';
      }
      h+='</div>';
    }
    h+='</div>';

    // 이벤트 리스트
    if(events.length){
      h+='<div style="margin-top:14px"><div style="font-weight:600;font-size:.9em;margin-bottom:8px">📋 이번 달 일정 ('+events.length+'건)</div>';
      var seen2={};
      // 연속 일정 그룹핑
      var grouped=[];
      for(var i=0;i<events.length;i++){var ev=events[i];var key=ev.name;
        if(seen2[key]){seen2[key].to=ev.date;seen2[key].count++}
        else{seen2[key]={name:ev.name,from:ev.date,to:ev.date,type:ev.type,count:1};grouped.push(seen2[key])}
      }
      for(var i=0;i<grouped.length;i++){var g=grouped[i];
        var fd=g.from,td=g.to;
        var dateLabel=fd.substr(4,2)+'/'+fd.substr(6,2);
        if(fd!==td)dateLabel+='~'+td.substr(4,2)+'/'+td.substr(6,2);
        var badge=g.type==='휴업일'?'<span style="background:var(--red);color:#fff;padding:1px 6px;border-radius:8px;font-size:.72em;margin-right:4px">휴업</span>':'';
        var span=g.count>1?' <span style="color:var(--tx3);font-size:.78em">('+g.count+'일)</span>':'';
        h+='<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--bg2);font-size:.85em">';
        h+='<span style="color:var(--tx3);min-width:70px;font-weight:500">'+dateLabel+'</span>';
        h+='<span>'+badge+g.name+span+'</span></div>';
      }
      h+='</div>';
    }
    document.getElementById('calBody').innerHTML=h;
  }

  function renderWeek(events){
    var wd=new Date();wd.setDate(wd.getDate()+weekOff*7);var wm=Store.getMonday(wd);
    var dn=['월','화','수','목','금','토','일'];
    var todayStr=Neis.ymd(new Date());
    var evMap={};
    for(var i=0;i<events.length;i++){var e=events[i];if(!evMap[e.date])evMap[e.date]=[];evMap[e.date].push(e)}

    // 연속 일정 계산
    var spans={};// name -> {startIdx, endIdx}
    for(var i=0;i<7;i++){
      var dd=new Date(wm);dd.setDate(wm.getDate()+i);
      var ds=Neis.ymd(dd);
      var dayEv=evMap[ds]||[];
      for(var j=0;j<dayEv.length;j++){var n=dayEv[j].name;
        if(!spans[n])spans[n]={name:n,type:dayEv[j].type,si:i,ei:i};
        else spans[n].ei=i;
      }
    }

    var h='<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border:1px solid var(--bd);border-radius:var(--radius-sm);overflow:hidden">';
    // 헤더
    for(var i=0;i<7;i++){
      var dd=new Date(wm);dd.setDate(wm.getDate()+i);var ds=Neis.ymd(dd);var isT=ds===todayStr;
      h+='<div style="text-align:center;padding:8px 4px;background:'+(isT?'var(--blue)':'var(--bg2)')+';border-bottom:1px solid var(--bd);border-right:'+(i<6?'1px solid var(--bd)':'none')+';color:'+(isT?'#fff':'var(--tx)')+'">';
      h+='<div style="font-size:.75em">'+dn[i]+'</div><div style="font-size:.95em;font-weight:700">'+(dd.getMonth()+1)+'/'+dd.getDate()+'</div></div>';
    }
    h+='</div>';

    // 연속 일정 바
    var spanList=[];for(var k in spans)spanList.push(spans[k]);
    if(spanList.length){
      h+='<div style="position:relative;margin-top:4px">';
      for(var i=0;i<spanList.length;i++){var sp=spanList[i];
        var color=sp.type==='휴업일'?'var(--red)':sp.name.indexOf('시험')>=0?'var(--orange)':'var(--green)';
        var left=(sp.si/7*100)+'%';var width=((sp.ei-sp.si+1)/7*100)+'%';
        h+='<div style="background:'+color+';color:#fff;padding:3px 6px;margin-bottom:2px;border-radius:3px;font-size:.78em;font-weight:500;margin-left:'+left+';width:'+width+';overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+sp.name+'">'+sp.name+(sp.ei>sp.si?' ('+(sp.ei-sp.si+1)+'일)':'')+'</div>';
      }
      h+='</div>';
    }

    // 일별 상세
    h+='<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px;margin-top:4px">';
    for(var i=0;i<7;i++){
      var dd=new Date(wm);dd.setDate(wm.getDate()+i);var ds=Neis.ymd(dd);var isT=ds===todayStr;
      var dayEv=evMap[ds]||[];
      h+='<div style="min-height:80px;padding:4px;background:'+(isT?'var(--blue-bg)':'var(--bg)')+';border:1px solid var(--bd);border-radius:4px">';
      if(!dayEv.length)h+='<div style="color:var(--tx3);font-size:.72em;text-align:center;padding:8px 0">일정 없음</div>';
      var seen={};
      for(var j=0;j<dayEv.length;j++){var ev=dayEv[j];if(seen[ev.name])continue;seen[ev.name]=1;
        h+='<div style="font-size:.75em;padding:2px 0">'+ev.name+'</div>';
      }
      h+='</div>';
    }
    h+='</div>';

    document.getElementById('calBody').innerHTML=h;
  }

  return{render:render,
    setView:function(v){viewMode=v;render()},
    pm:function(){monthOff--;render()},nm:function(){monthOff++;render()},tm:function(){monthOff=0;render()},
    pw:function(){weekOff--;render()},nw:function(){weekOff++;render()},tw:function(){weekOff=0;render()}
  };
})();
