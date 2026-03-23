// pages/weekly.js — 주간 업무 (기존 완전체 도구를 포털 내 임베드)
var PageWeekly=(function(){
  function render(){
    // 기존 weekly-plan.html을 iframe으로 포털 안에 직접 표시
    // 새 탭이 아니라 포털 content 영역 안에서 렌더
    var h='<div class="card" style="padding:8px">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 8px 0">';
    h+='<div class="card-h" style="margin-bottom:0">📋 주간 업무 (Google Calendar)</div>';
    h+='<div style="display:flex;gap:6px">';
    h+='<button class="a-btn outline sm" onclick="PageWeekly.pop()">↗ 새 창에서 열기</button>';
    h+='<button class="a-btn outline sm" onclick="PageWeekly.reload()">🔄 새로고침</button>';
    h+='</div></div>';
    h+='<iframe id="weeklyFrame" src="weekly-plan.html" style="width:100%;border:none;border-radius:var(--radius-sm);min-height:calc(100vh - 160px);margin-top:8px"></iframe>';
    h+='</div>';
    document.getElementById('pg').innerHTML=h;

    // iframe 높이 자동 조절
    var frame=document.getElementById('weeklyFrame');
    frame.onload=function(){
      try{
        var doc=frame.contentDocument||frame.contentWindow.document;
        // 포털 안이므로 배경 맞추기
        doc.body.style.background='#fff';
        // 높이 맞추기
        function resize(){
          var h=doc.body.scrollHeight;
          if(h>400)frame.style.height=h+'px';
        }
        resize();
        // MutationObserver로 컨텐츠 변경 시 리사이즈
        if(window.MutationObserver){
          new MutationObserver(resize).observe(doc.body,{childList:true,subtree:true});
        }
        setInterval(resize,2000);
      }catch(e){
        // cross-origin이면 고정 높이
        frame.style.height='800px';
      }
    };
  }

  return{
    render:render,
    pop:function(){window.open('weekly-plan.html','_blank')},
    reload:function(){var f=document.getElementById('weeklyFrame');if(f)f.src=f.src}
  };
})();
