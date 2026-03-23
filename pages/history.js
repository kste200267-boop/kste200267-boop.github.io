// pages/history.js — 교체 기록
var PageHistory=(function(){
  function render(){
    var hist=Store.getSwapHistory();
    var h='<div class="card"><div class="card-h">📜 교체 기록<span class="right" style="font-size:.78em;color:var(--tx2)">총 '+hist.length+'건</span></div>';
    if(!hist.length)h+='<p style="color:var(--tx2);font-size:.88em">교체 기록이 없습니다.</p>';
    else{
      for(var i=0;i<hist.length;i++){var s=hist[i];
        var dt=new Date(s.date);
        var dateStr=dt.getFullYear()+'.'+(dt.getMonth()+1)+'.'+dt.getDate()+' '+String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0');
        h+='<div class="hist-item"><div class="hist-date">'+dateStr+' · '+s.week+'</div>';
        h+='<div class="hist-body">';
        h+='<span class="hist-badge '+(s.status==='applied'?'apply':'cancel')+'">'+(s.status==='applied'?'적용':'취소')+'</span>';
        h+='<b>'+s.teacher+'</b> '+s.day+' '+(s.period+1)+'교시 ('+s.cls+' '+s.subj+') → <b>'+s.substitute+'</b>';
        if(s.by)h+=' <span style="color:var(--tx3);font-size:.8em">by '+s.by+'</span>';
        h+='</div>';
        if(s.status==='applied')h+='<button class="a-btn danger sm" style="margin-top:6px" onclick="PageHistory.cancel(\''+s.id+'\')">취소</button>';
        if(s.status==='cancelled'&&s.cancelledAt){var cd=new Date(s.cancelledAt);h+='<div style="font-size:.78em;color:var(--tx3);margin-top:4px">취소: '+cd.getFullYear()+'.'+(cd.getMonth()+1)+'.'+cd.getDate()+'</div>'}
        h+='</div>';
      }
    }
    h+='</div>';
    document.getElementById('pg').innerHTML=h;
  }
  return{render:render,cancel:function(id){if(!confirm('이 교체를 취소할까요? 시간표가 원래대로 돌아갑니다.')){return}Store.cancelSwap(id);Engine.rebuild();toast('교체 취소됨');render()}};
})();
