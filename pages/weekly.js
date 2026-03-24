// pages/weekly.js — 주간 업무 (전체 폭)
var PageWeekly=(function(){
  function render(){
    // page-wrap 제거하고 content 직접 사용 (풀 폭)
    var content=document.getElementById('content');
    content.innerHTML='<div style="padding:8px">';
    var h='<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px">';
    h+='<div style="font-weight:700;font-size:.95em">📋 주간 업무 (Google Calendar)</div>';
    h+='<div style="display:flex;gap:6px">';
    h+='<button class="a-btn outline sm" onclick="PageWeekly.pop()">↗ 새 창</button>';
    h+='<button class="a-btn outline sm" onclick="PageWeekly.reload()">🔄</button>';
    h+='</div></div>';
    h+='<iframe id="weeklyFrame" src="weekly-plan.html" style="width:100%;border:none;border-radius:var(--radius-sm);min-height:calc(100vh - 120px);margin-top:4px"></iframe>';
    h+='</div>';
    content.innerHTML=h;

    var frame=document.getElementById('weeklyFrame');
    frame.onload=function(){
      try{
        var doc=frame.contentDocument||frame.contentWindow.document;
        doc.body.style.background='#fff';
        function resize(){var h=doc.body.scrollHeight;if(h>400)frame.style.height=h+'px'}
        resize();
        if(window.MutationObserver)new MutationObserver(resize).observe(doc.body,{childList:true,subtree:true});
        setInterval(resize,2000);
      }catch(e){frame.style.height='800px'}
    };
  }

  return{
    render:render,
    pop:function(){window.open('weekly-plan.html','_blank')},
    reload:function(){var f=document.getElementById('weeklyFrame');if(f)f.src=f.src}
  };
})();
