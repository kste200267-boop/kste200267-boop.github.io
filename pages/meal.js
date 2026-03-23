// pages/meal.js — 급식 (나이스 API)
var PageMeal = (function() {
  var weekOff = 0;
  function getDates(off) {
    var d = new Date(); d.setDate(d.getDate() + off * 7);
    var mon = Store.getMonday(d), arr = [];
    for (var i = 0; i < 5; i++) { var dd = new Date(mon); dd.setDate(mon.getDate() + i); arr.push(dd); }
    return arr;
  }
  function render() {
    var dates = getDates(weekOff);
    var from = Neis.ymd(dates[0]), to = Neis.ymd(dates[4]);
    var label = (dates[0].getMonth()+1)+'/'+dates[0].getDate()+' ~ '+(dates[4].getMonth()+1)+'/'+dates[4].getDate();
    var h = '<div class="card"><div class="card-h">🍱 급식 식단</div>';
    h += '<div class="week-nav"><button onclick="PageMeal.prev()">◀</button><span class="wk-label">' + label + '</span><button onclick="PageMeal.next()">▶</button><button onclick="PageMeal.now()" style="margin-left:4px">이번주</button></div>';
    h += '<div id="mealG" style="color:var(--tx2);font-size:.88em;padding:20px 0;text-align:center">🔄 불러오는 중...</div></div>';
    document.getElementById('pg').innerHTML = h;

    Neis.getMeals(from, to, function(meals) {
      var dn = ['월','화','수','목','금'];
      var today = Neis.ymd(new Date());
      var g = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">';
      for (var i = 0; i < 5; i++) {
        var ds = Neis.ymd(dates[i]), isT = ds === today;
        var dm = meals.filter(function(m) { return m.date === ds; });
        g += '<div style="background:' + (isT ? 'var(--blue-bg)' : 'var(--bg2)') + ';border-radius:var(--radius-sm);padding:12px;border:1px solid ' + (isT ? 'var(--blue)' : 'var(--bd)') + '">';
        g += '<div style="font-weight:700;font-size:.9em;margin-bottom:8px;color:' + (isT ? 'var(--blue)' : 'var(--tx)') + '">' + dn[i] + ' ' + (dates[i].getMonth()+1) + '/' + dates[i].getDate();
        if (isT) g += ' <span style="font-size:.72em;background:var(--blue);color:#fff;padding:1px 6px;border-radius:8px">오늘</span>';
        g += '</div>';
        if (!dm.length) { g += '<div style="color:var(--tx3);font-size:.82em">급식 정보 없음</div>'; }
        else { for (var j = 0; j < dm.length; j++) { var m = dm[j];
          g += '<div style="margin-bottom:6px"><div style="font-weight:600;font-size:.78em;color:var(--tx2);margin-bottom:2px">' + m.type + ' ' + (m.cal||'') + '</div>';
          var items = m.menu.split('\n').filter(function(s){return s.trim()});
          for (var k = 0; k < items.length; k++) { var it = items[k].replace(/[0-9.]/g,'').trim(); if(it) g += '<div style="font-size:.83em;padding:1px 0">'+it+'</div>'; }
          g += '</div>'; } }
        g += '</div>';
      }
      g += '</div>';
      document.getElementById('mealG').innerHTML = g;
    });
  }
  return { render:render, prev:function(){weekOff--;render()}, next:function(){weekOff++;render()}, now:function(){weekOff=0;render()} };
})();
