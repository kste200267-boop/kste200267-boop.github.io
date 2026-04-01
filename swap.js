// pages/swap.js — 수업 교체 (전학년, 날짜표시, 사유입력, 공유이력, 표복사)
var PageSwap=(function(){
  var sT=null, sD=null, sCk={};
  var sReason='';

  // 날짜 포맷: YYYY-MM-DD → X월 X일 (요일)
  function fmtDate(dateStr){
    if(!dateStr) return '';
    var d=new Date(dateStr);
    if(isNaN(d)) return dateStr;
    var days=['일','월','화','수','목','금','토'];
    return (d.getMonth()+1)+'월 '+d.getDate()+'일 ('+days[d.getDay()]+')';
  }

  // 오늘 날짜 YYYY-MM-DD
  function today(){
    var d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }

  // 수업 날짜 계산 (이번주 해당 요일)
  function getClassDate(dayStr){
    var dayMap={월:1,화:2,수:3,목:4,금:5};
    var target=dayMap[dayStr];
    if(!target) return '';
    var d=new Date();
    var cur=d.getDay(); // 0=일
    var diff=target-cur;
    d.setDate(d.getDate()+diff);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }

  function render(){
    sT=sT||App.getUser();
    var h='<div class="card"><div class="card-h">🔄 수업 교체</div>';
    h+='<p style="color:var(--tx2);font-size:.83em;margin-bottom:12px">교체를 확정하면 이번 주 시간표에 자동 반영되고 기록이 남습니다.</p>';

    // 1. 교사 선택
    h+='<div style="font-weight:600;font-size:.85em;margin-bottom:6px">1. 교사</div>';
    h+='<div class="chips">';
    Engine.names().forEach(function(t){
      var sub=Engine.TS()[t]||'';
      h+='<span class="chip'+(t===sT?' on':'')+'" onclick="PageSwap.pickT(\''+t+'\')">'+t+'<span class="csub">'+sub+'</span></span>';
    });
    h+='</div>';

    // 2. 요일 선택 — 수업 있는 요일 전부 표시 (전학년)
    if(sT){
      h+='<div style="font-weight:600;font-size:.85em;margin:10px 0 6px">2. 요일</div>';
      h+='<div class="chips">';
      for(var di=0;di<5;di++){
        var d=DAYS[di];
        var has=false;
        for(var p=0;p<DP[d];p++){
          var cl=Engine.slot(sT,d,p);
          if(cl&&cl!=='동아리'&&cl!=='자율'){has=true;break;}
        }
        if(has) h+='<span class="chip'+(d===sD?' on':'')+'" onclick="PageSwap.pickD(\''+d+'\')">'+d+'</span>';
      }
      h+='</div>';
    }

    // 3. 교시 선택
    if(sD){
      h+='<div style="font-weight:600;font-size:.85em;margin:10px 0 6px">3. 교시</div>';
      for(var p=0;p<DP[sD];p++){
        var cl=Engine.slot(sT,sD,p);
        var isG=cl&&cl!=='동아리'&&cl!=='자율'&&CS[cl];
        var sj=isG?(CS[cl][sD][p]||cl):'';
        var isAutoSj=isG&&(sj==='자율'||sj==='동아리');
        var dis=!isG||isAutoSj;
        var key=sD+'|'+p,ck=sCk[key];
        h+='<div class="pc'+(dis?' dis':'')+(ck?' ck':'')+'" onclick="'+(dis?'':'PageSwap.tg(\''+key+'\')')+'">';
        h+='<div class="pc-box">'+(ck?'✓':'')+'</div><div>';
        h+='<div class="pc-l">'+(p+1)+'교시</div>';
        h+='<div class="pc-d">';
        if(!cl) h+='빈 시간';
        else if(dis) h+=cl+(sj?' ('+sj+')':'');
        else h+=cl+' — '+sj;
        h+='</div></div></div>';
      }

      // 4. 사유 입력
      h+='<div style="font-weight:600;font-size:.85em;margin:10px 0 6px">4. 교체 사유</div>';
      h+='<input class="ti-input" id="swReason" value="'+sReason+'" placeholder="예: 출장, 연수, 병가 등" style="margin-bottom:8px" oninput="PageSwap.setReason(this.value)">';

      h+='<button class="a-btn primary" style="margin-top:4px" onclick="PageSwap.find()">🔍 교체 가능 교사 찾기</button>';
    }

    h+='<div id="swR"></div></div>';

    // 전체 교체 이력
    h+=renderHistory();

    document.getElementById('pg').innerHTML=h;
  }

  function renderHistory(){
    var hist=Store.getSwapHistory();
    if(!hist.length) return '';

    var h='<div class="card"><div class="card-h">📋 교체 이력 <span style="font-size:.75em;color:var(--tx2);font-weight:400">전체 공유</span>';
    h+='<span class="right"><button class="a-btn outline sm" onclick="PageSwap.copyTable()">📋 표 복사</button></span></div>';

    // 인쇄/복사용 표
    h+='<div id="swapTableWrap" style="overflow-x:auto">';
    h+='<table class="st" id="swapTable">';
    h+='<thead><tr>';
    h+='<th>신청일</th><th>교체 교사</th><th>날짜</th><th>교시</th><th>학반</th><th>과목</th><th>대신 교사</th><th>사유</th><th>상태</th>';
    h+='</tr></thead><tbody>';

    hist.forEach(function(s){
      var dt=new Date(s.date);
      var dateStr=(dt.getMonth()+1)+'월 '+dt.getDate()+'일';
      var classDate=s.classDate?fmtDate(s.classDate):(s.day+'요일');
      var status=s.status==='applied'?'✅ 적용':'❌ 취소';
      var reason=s.reason||'—';
      h+='<tr'+(s.status==='cancelled'?' style="opacity:.5"':'')+' id="sh-'+s.id+'">';
      h+='<td>'+dateStr+'</td>';
      h+='<td style="font-weight:600">'+s.teacher+'</td>';
      h+='<td>'+classDate+'</td>';
      h+='<td>'+(s.period+1)+'교시</td>';
      h+='<td>'+s.cls+'</td>';
      h+='<td>'+(s.subj||'—')+'</td>';
      h+='<td style="color:var(--blue);font-weight:600">'+s.substitute+'</td>';
      h+='<td>'+reason+'</td>';
      h+='<td>'+status+'</td>';
      h+='</tr>';
    });

    h+='</tbody></table></div>';

    // 취소 버튼은 별도로
    var applied=hist.filter(function(s){return s.status==='applied'});
    if(applied.length){
      h+='<div style="margin-top:10px">';
      applied.forEach(function(s){
        var classDate=s.classDate?fmtDate(s.classDate):(s.day+'요일');
        h+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--bg2);font-size:.85em">';
        h+='<span>'+s.teacher+' → '+s.substitute+' ('+classDate+' '+(s.period+1)+'교시)</span>';
        h+='<button class="a-btn danger sm" style="margin-left:auto" onclick="PageSwap.cancel(\''+s.id+'\')">취소</button>';
        h+='</div>';
      });
      h+='</div>';
    }

    h+='</div>';
    return h;
  }

  function find(){
    var keys=Object.keys(sCk);
    if(!keys.length){toast('교시를 선택하세요');return;}

    var results=[];
    keys.forEach(function(k){
      var ps=k.split('|'),day=ps[0],myPeriod=+ps[1];
      var myCl=Engine.slot(sT,day,myPeriod);
      var mySj=CS[myCl]?(CS[myCl][day][myPeriod]||'?'):'?';

      // 맞교환 조건:
      // 1) 상대방이 같은 반(myCl) 수업을 갖고 있는 다른 시간을 가짐
      // 2) 내가 바꾸려는 시간(day, myPeriod)에 상대방이 비어있음
      // 3) 상대방의 그 수업 시간에 내가 비어있음
      var cands=[];

      Engine.names().forEach(function(t){
        if(t===sT) return;
        var td=Engine.TD()[t];
        if(!td) return;

        // 조건 2: 내가 바꾸려는 시간에 상대방이 비어있어야 함
        if(!Engine.free(t,day,myPeriod)) return;

        // 상대방 시간표에서 같은 반 수업이 있는 시간 찾기
        var swapOptions=[];
        for(var di=0;di<5;di++){
          var d=DAYS[di];
          for(var p=0;p<DP[d];p++){
            var otherCl=Engine.slot(t,d,p);
            if(!otherCl) continue;
            if(otherCl!==myCl) continue; // 같은 반이어야 함

            // 조건 3: 상대방의 그 시간에 내가 비어있어야 함
            if(!Engine.free(sT,d,p)) continue;

            swapOptions.push({day:d,period:p});
          }
        }

        if(swapOptions.length>0){
          cands.push({teacher:t,options:swapOptions});
        }
      });

      results.push({day:day,period:myPeriod,cls:myCl,subj:mySj,cands:cands});
    });

    var h='<div style="background:var(--bg2);border-radius:var(--radius);padding:14px;margin-top:12px">';
    h+='<div style="font-weight:700;margin-bottom:10px">맞교환 가능한 교사</div>';
    h+='<div style="font-size:.8em;color:var(--tx2);margin-bottom:10px">✔ 같은 반 수업 보유 ✔ 내 시간에 상대 비어있음 ✔ 상대 시간에 내가 비어있음</div>';

    results.forEach(function(r){
      var classDate=getClassDate(r.day);
      h+='<div style="margin-bottom:14px">';
      h+='<div style="font-weight:600;font-size:.88em;margin-bottom:6px">';
      h+=fmtDate(classDate)+' '+(r.period+1)+'교시 — <span style="color:var(--blue)">'+r.cls+'</span> ('+r.subj+')';
      h+='</div>';

      if(!r.cands.length){
        h+='<div style="color:var(--red);font-size:.83em">맞교환 가능한 교사가 없습니다.</div>';
      }else{
        r.cands.forEach(function(c){
          c.options.forEach(function(opt){
            var optDate=getClassDate(opt.day);
            var optLabel=fmtDate(optDate)+' '+(opt.period+1)+'교시';
            h+='<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;margin-bottom:4px;background:var(--bg);border-radius:6px;border:1px solid var(--bd)">';
            h+='<div style="flex:1;font-size:.85em"><b>'+c.teacher+'</b> ('+Engine.TS()[c.teacher]+')';
            h+='<br><span style="color:var(--tx2);font-size:.85em">↔ '+c.teacher+'의 '+optLabel+' 수업과 교환</span></div>';
            h+='<button class="a-btn primary sm" onclick="PageSwap.applySwap(\''+
              sT+'\',\''+r.day+'\','+r.period+',\''+r.cls+'\',\''+r.subj+'\',\''+
              c.teacher+'\',\''+opt.day+'\','+opt.period+',\''+classDate+'\',\''+optDate+'\')">확정</button>';
            h+='</div>';
          });
        });
      }
      h+='</div>';
    });
    h+='</div>';
    document.getElementById('swR').innerHTML=h;
  }

  function apply(teacher,day,period,cls,subj,sub,classDate){
    var reason=document.getElementById('swReason')?document.getElementById('swReason').value.trim():'';
    if(!confirm(teacher+'의 '+(classDate?fmtDate(classDate):day)+' '+(+period+1)+'교시를 '+sub+'에게 교체할까요?')) return;
    Store.addSwap({
      teacher:teacher,day:day,period:+period,cls:cls,subj:subj,
      substitute:sub,by:App.getUser(),
      classDate:classDate,
      reason:reason
    });
    Engine.rebuild();
    toast('교체 완료!');
    sReason='';
    render();
  }

  // 맞교환 확정: A의 day1/p1 ↔ B의 day2/p2
  function applySwap(tA,dayA,pA,cls,subj,tB,dayB,pB,dateA,dateB){
    var reason=document.getElementById('swReason')?document.getElementById('swReason').value.trim():'';
    var msg=tA+'의 '+fmtDate(dateA)+' '+(+pA+1)+'교시\n↔\n'+tB+'의 '+fmtDate(dateB)+' '+(+pB+1)+'교시\n\n교체 확정할까요?';
    if(!confirm(msg)) return;

    var by=App.getUser();
    var now=new Date().toISOString().slice(0,10);

    // A→B 기록
    Store.addSwap({
      teacher:tA,day:dayA,period:+pA,cls:cls,subj:subj,
      substitute:tB,by:by,classDate:dateA,reason:reason,
      swapPair:tB+'의 '+fmtDate(dateB)+' '+(+pB+1)+'교시와 맞교환'
    });
    // B→A 기록
    var clsB=Engine.slot(tB,dayB,+pB)||cls;
    var subjB=CS[clsB]?(CS[clsB][dayB][+pB]||clsB):clsB;
    Store.addSwap({
      teacher:tB,day:dayB,period:+pB,cls:clsB,subj:subjB,
      substitute:tA,by:by,classDate:dateB,reason:reason,
      swapPair:tA+'의 '+fmtDate(dateA)+' '+(+pA+1)+'교시와 맞교환'
    });

    Engine.rebuild();
    toast('맞교환 완료!');
    sReason='';
    render();
  }

  function copyTable(){
    var table=document.getElementById('swapTable');
    if(!table){toast('복사할 표가 없습니다');return;}
    // 텍스트로 변환
    var rows=table.querySelectorAll('tr');
    var text='';
    rows.forEach(function(row){
      var cells=row.querySelectorAll('th,td');
      var line=[];
      cells.forEach(function(c){line.push(c.innerText.trim())});
      text+=line.join('\t')+'\n';
    });
    if(navigator.clipboard){
      navigator.clipboard.writeText(text).then(function(){toast('표가 클립보드에 복사됐습니다 (엑셀에 붙여넣기 가능)');});
    }else{
      var ta=document.createElement('textarea');
      ta.value=text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast('표 복사 완료');
    }
  }

  return{
    render:render,
    pickT:function(t){sT=t;sD=null;sCk={};render();},
    pickD:function(d){sD=d;sCk={};render();},
    tg:function(k){sCk[k]=!sCk[k];if(!sCk[k])delete sCk[k];render();},
    setReason:function(v){sReason=v;},
    find:find,
    apply:apply,
    applySwap:applySwap,
    copyTable:copyTable,
    cancel:function(id){
      if(!confirm('이 교체를 취소할까요?'))return;
      Store.cancelSwap(id);Engine.rebuild();toast('취소됨');render();
    }
  };
})();
