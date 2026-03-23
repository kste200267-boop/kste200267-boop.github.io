// pages/weekly.js
var PageWeekly=(function(){
  function render(){
    var h='<div class="card"><div class="card-h">📋 주간 업무 (Google Calendar)</div>';
    h+='<p style="color:var(--tx2);font-size:.85em;margin-bottom:12px">구글 캘린더와 연동된 부서별 주간 업무 관리 도구입니다.</p>';
    h+='<button class="a-btn primary" onclick="window.open(\'weekly-plan.html\',\'_blank\')">📋 주간 업무 열기 (새 탭)</button>';
    h+='<div style="margin-top:14px;padding:12px;background:var(--bg2);border-radius:var(--radius-sm);font-size:.83em;color:var(--tx2)">';
    h+='<b>💡 사용법:</b> 일정 제목에 [부서명]을 붙이면 자동 분류됩니다. (예: [교무부] 중간고사 범위 협의)<br>';
    h+='부서: 교무부, 학생부, 진로상담부, 도제교육부, 학년부, 산업취업부, 인재개발부</div></div>';
    document.getElementById('pg').innerHTML=h;
  }
  return{render:render};
})();
