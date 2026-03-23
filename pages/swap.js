// pages/swap.js — 수업 교체 + 기록 저장
var PageSwap=(function(){
  var sT=null,sD=null,sCk={};
  function render(){
    sT=sT||App.getUser();
    var h='<div class="card"><div class="card-h">🔄 수업 교체</div><p style="color:var(--tx2);font-size:.83em;margin-bottom:12px">교체를 확정하면 이번 주 시간표에 자동 반영되고 기록이 남습니다.</p>';
    h+='<div style="font-weight:600;font-size:.85em;margin-bottom:6px">1. 교사</div><div class="chips">';
    var ts=Engine.go1();for(var i=0;i<ts.length;i++){var t=ts[i];h+='<span class="chip'+(t===sT?' on':'')+'" onclick="PageSwap.pickT(\''+t+'\')">'+t+'<span class="csub">'+Engine.TS()[t]+'</span></span>'}
    h+='</div>';
    if(sT){h+='<div style="font-weight:600;font-size:.85em;margin:10px 0 6px">2. 요일</div><div class="chips">';
      for(var di=0;di<5;di++){var d=DAYS[di],has=false;for(var p=0;p<DP[d];p++){var cl=Engine.slot(sT,d,p);if(cl&&cl.charAt(0)==='1'){has=true;break}}
      if(has)h+='<span class="chip'+(d===sD?' on':'')+'" onclick="PageSwap.pickD(\''+d+'\')">'+d+'</span>'}h+='</div>'}
    if(sD){h+='<div style="font-weight:600;font-size:.85em;margin:10px 0 6px">3. 교시</div>';
      for(var p=0;p<DP[sD];p++){var cl=Engine.slot(sT,sD,p),isG=cl&&cl.charAt(0)==='1'&&CS[cl],sj='';
        if(isG)sj=CS[cl][sD][p]||cl;var isJ=isG&&sj==='자율',dis=!isG||isJ,key=sD+'|'+p,ck=sCk[key];
        h+='<div class="pc'+(dis?' dis':'')+(ck?' ck':'')+'" onclick="'+(dis?'':'PageSwap.tg(\''+key+'\')')+'">';
        h+='<div class="pc-box">'+(ck?'✓':'')+'</div><div><div class="pc-l">'+(p+1)+'교시</div>';
        h+='<div class="pc-d">'+(dis?(cl||'빈 시간'):(cl+' — '+sj))+'</div></div></div>'}
      h+='<button class="a-btn primary" style="margin-top:8px" onclick="PageSwap.find()">🔍 교체 조합 찾기</button>'}
    h+='<div id="swR"></div></div>';
    document.getElementById('pg').innerHTML=h;
  }
  function find(){
    var keys=Object.keys(sCk);if(!keys.length){toast('교시를 선택하세요');return}
    var results=[];
    for(var k=0;k<keys.length;k++){var ps=keys[k].split('|'),day=ps[0],period=+ps[1];
      var cl=Engine.slot(sT,day,period),sj=CS[cl]?CS[cl][day][period]:'?';
      var cands=[];for(var t in Engine.TD()){if(t!==sT&&Engine.free(t,day,period))cands.push(t)}
      results.push({day:day,period:period,cls:cl,subj:sj,cands:cands})}

    var h='<div style="background:var(--bg2);border-radius:var(--radius);padding:14px;margin-top:12px"><div style="font-weight:700;margin-bottom:10px">교체 가능한 교사</div>';
    for(var i=0;i<results.length;i++){var r=results[i];
      h+='<div style="margin-bottom:10px"><div style="font-weight:600;font-size:.88em">'+r.day+' '+(r.period+1)+'교시 — '+r.cls+' ('+r.subj+')</div>';
      if(!r.cands.length)h+='<div style="color:var(--red);font-size:.83em">교체 가능 교사 없음</div>';
      else{for(var j=0;j<r.cands.length;j++){
        var c=r.cands[j];
        h+='<span class="ftag" style="cursor:pointer" onclick="PageSwap.apply(\''+sT+'\',\''+r.day+'\','+r.period+',\''+r.cls+'\',\''+r.subj+'\',\''+c+'\')">'+c+' ('+Engine.TS()[c]+') ← 클릭하여 확정</span>';
      }}h+='</div>'}
    h+='</div>';
    document.getElementById('swR').innerHTML=h;
  }
  function apply(teacher,day,period,cls,subj,sub){
    if(!confirm(teacher+'의 '+day+' '+(period+1)+'교시 수업을 '+sub+'에게 교체할까요?'))return;
    Store.addSwap({teacher:teacher,day:day,period:period,cls:cls,subj:subj,substitute:sub,by:App.getUser()});
    Engine.rebuild();
    toast('교체 완료! 기록에 저장됨');render();
  }
  return{render:render,pickT:function(t){sT=t;sD=null;sCk={};render()},pickD:function(d){sD=d;sCk={};render()},tg:function(k){sCk[k]=!sCk[k];if(!sCk[k])delete sCk[k];render()},find:find,apply:apply};
})();
