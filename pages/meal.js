// pages/meal.js
var PageMeal=(function(){
  function render(){
    var h='<div class="card"><div class="card-h">🍱 급식 식단표</div>';
    h+='<div class="iframe-wrap"><iframe src="https://school.gyo6.net/gbgigo/ad/fm/foodmenu/selectFoodMenuView.do?mi=121975" style="min-height:700px"></iframe></div></div>';
    document.getElementById('pg').innerHTML=h;
  }
  return{render:render};
})();
