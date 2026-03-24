// pages/swap.js — 수업 교체 (전학년 가능, 같은 반 교체 조건 유지)
var PageSwap=(function(){
  var sT=null, sD=null, sCk={};

  function render(){
    sT=sT||App.getUser();
    var h='<div class="card"><div class="card-h">🔄 수업 교체</div>';
    h+='<p style="color:var(--tx2);font-size:.83em;margin-bottom:12px">교체를 확정하면 이번 주 시간표에 자동 반영되고 기록이 남습니다.</p>';

    // 1. 교사 선택
    h+='<div style="font-weight:600;font-size:.85em;margin-bottom:6px">1. 교사</div>';
    h+='<div class="chips">';
    Engine.names().forEach(function(t){
      var sub=Engine.TS()[t]||'';
      h+='<span class="chip'+(t===sT?' on':'')+'" onclick="PageSwap.pickT(\''+t+'\')">'+
        t+'<span class="csub">'+sub+'</span></span>';
    });
    h+='</div>';

    // 2. 요일 선택 (수업이 있는 요일만)
    if(sT){
      h+='<div style="font-weight:600;font-size:.85em;margin:10px 0 6px">2. 요일</div>';
      h+='<div class="chips">';
      for(var di=0;di<5;di++){
        var d=DAYS[di], has=false;
        for(var p=0;p<DP[d];p++){
          var cl=Engine.slot(sT,d,p);
          // 어떤 학년이든 수업이 있으면 표시
          if(cl && cl!=='동아리' && cl!=='자율'){has=true;break}
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
        // 학급 시간표가 있는 수업만 (동아리/자율/빈칸 제외)
        var isG = cl && cl!=='동아리' && cl!=='자율' && CS[cl];
        var sj = isG?(CS[cl][sD][p]||cl):'';
        var isAutoSj = isG&&(sj==='자율'||sj==='동아리');
        var dis = !isG || isAutoSj;
        var key=sD+'|'+p, ck=sCk[key];

        h+='<div class="pc'+(dis?' dis':'')+(ck?' ck':'')+'" onclick="'+(dis?'':'PageSwap.tg(\''+key+'\')')+'">';
        h+='<div class="pc-box">'+(ck?'✓':'')+'</div>';
        h+='<div>';
        h+='<div class="pc-l">'+(p+1)+'교시</div>';
        h+='<div class="pc-d">';
        if(!cl)      h+='빈 시간';
        else if(dis) h+=cl+(sj?' ('+sj+')':'');
        else         h+=cl+' — '+sj;
        h+='</div></div></div>';
      }
      h+='<button class="a-btn primary" style="margin-top:8px" onclick="PageSwap.find()">🔍 교체 조합 찾기</button>';
    }

    h+='<div id="swR"></div></div>';
    document.getElementById('pg').innerHTML=h;
  }

  function find(){
    var keys=Object.keys(sCk);
    if(!keys.length){toast('교시를 선택하세요');return}

    var results=[];
    keys.forEach(function(k){
      var ps=k.split('|'), day=ps[0], period=+ps[1];
      var cl=Engine.slot(sT,day,period);
      var sj=CS[cl]?(CS[cl][day][period]||'?'):'?';

      // 같은 요일+교시에 같은 반(cl) 수업을 가진 다른 교사 찾기
      var cands=[];
      for(var t in Engine.TD()){
        if(t===sT) continue;
        var otherCl=Engine.slot(t,day,period);
        if(otherCl===cl){
          // 같은 반 수업을 가진 교사 → 교체 가능
          cands.push(t);
        }
      }

      // 빈 시간인 교사도 대타 후보로 추가 (다른 방식: 빈 시간 교사가 해당 수업 가능한 경우)
      // → 요청 조건: 같은 반이어야 함. 빈 시간 교사는 해당 반 수업 없으므로 제외.
      // → 순수하게 같은 cl을 가진 교사만 표시.

      results.push({day:day,period:period,cls:cl,subj:sj,cands:cands});
    });

    var h='<div style="background:var(--bg2);border-radius:var(--radius);padding:14px;margin-top:12px">';
    h+='<div style="font-weight:700;margin-bottom:10px">교체 가능한 교사 (같은 반 담당)</div>';
    results.forEach(function(r){
      h+='<div style="margin-bottom:12px">';
      h+='<div style="font-weight:600;font-size:.88em;margin-bottom:6px">';
      h+=r.day+' '+(r.period+1)+'교시 — <span style="color:var(--blue)">'+r.cls+'</span> ('+r.subj+')';
      h+='</div>';
      if(!r.cands.length){
        h+='<div style="color:var(--red);font-size:.83em">같은 반 담당 교사가 없습니다.</div>';
      }else{
        r.cands.forEach(function(c){
          h+='<span class="ftag" style="cursor:pointer" onclick="PageSwap.apply(\''+
            sT+'\',\''+r.day+'\','+r.period+',\''+r.cls+'\',\''+r.subj+'\',\''+c+'\')">'+
            c+' ('+Engine.TS()[c]+') ← 클릭하여 확정</span>';
        });
      }
      h+='</div>';
    });
    h+='</div>';
    document.getElementById('swR').innerHTML=h;
  }

  function apply(teacher,day,period,cls,subj,sub){
    if(!confirm(teacher+'의 '+day+' '+(+period+1)+'교시 수업을 '+sub+'에게 교체할까요?')) return;
    Store.addSwap({teacher:teacher,day:day,period:+period,cls:cls,subj:subj,substitute:sub,by:App.getUser()});
    Engine.rebuild();
    toast('교체 완료! 기록에 저장됨');
    render();
  }

  return{
    render:render,
    pickT:function(t){sT=t;sD=null;sCk={};render()},
    pickD:function(d){sD=d;sCk={};render()},
    tg:function(k){sCk[k]=!sCk[k];if(!sCk[k])delete sCk[k];render()},
    find:find,
    apply:apply
  };
})();
