// pages/schedule.js
var PageSchedule=(function(){
  function render(){
    var h='<div class="card"><div class="card-h">📆 학사일정</div>';
    h+='<div class="iframe-wrap"><iframe src="https://school.gyo6.net/gbgigo/schl/sv/schdulView/schdulCalendarView.do?mi=121905" style="min-height:700px"></iframe></div></div>';
    document.getElementById('pg').innerHTML=h;
  }
  return{render:render};
})();
