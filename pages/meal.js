// pages/meal.js — 급식 (조식/중식/석식 칸 분리)
var PageMeal=(function(){
  var weekOff=0;
  function getDates(off){var d=new Date();d.setDate(d.getDate()+off*7);var mon=Store.getMonday(d),arr=[];for(var i=0;i<5;i++){var dd=new Date(mon);dd.setDate(mon.getDate()+i);arr.push(dd)}return arr}

  function cleanMenu(raw){
    if(!raw)return[];
    return raw.replace(/<br\/>/g,'\n').split('\n').map(function(s){
      return s.replace(/\d+\.\s*/g,'').replace(/[()]/g,'').trim();
    }).filter(function(s){return s.length>0});
  }

  function render(){
    var dates=getDates(weekOff);
    var from=Neis.ymd(dates[0]),to=Neis.ymd(dates[4]);
    var label=(dates[0].getMonth()+1)+'/'+dates[0].getDate()+' ~ '+(dates[4].getMonth()+1)+'/'+dates[4].getDate();

    var h='<div class="card"><div class="card-h">🍱 급식 식단표</div>';
    h+='<div class="week-nav"><button onclick="PageMeal.prev()">◀</button><span class="wk-label">'+label+'</span><button onclick="PageMeal.next()">▶</button><button onclick="PageMeal.now()" style="margin-left:4px">이번주</button></div>';
    h+='<div id="mealG" style="text-align:center;padding:20px;color:var(--tx2)">🔄 불러오는 중...</div></div>';
    document.getElementById('pg').innerHTML=h;

    Neis.getMeals(from,to,function(meals){
      var dn=['월','화','수','목','금'];
      var todayStr=Neis.ymd(new Date());
      var types=['조식','중식','석식'];
      var typeColors={'조식':'#ff9800','중식':'#4caf50','석식':'#5c6bc0'};
      var typeIcons={'조식':'🌅','중식':'☀️','석식':'🌙'};

      // 요일+식사유형별 정리
      var grid={};
      for(var i=0;i<5;i++){
        var ds=Neis.ymd(dates[i]);
        grid[ds]={조식:null,중식:null,석식:null};
      }
      for(var i=0;i<meals.length;i++){
        var m=meals[i];
        if(grid[m.date])grid[m.date][m.type]={menu:cleanMenu(m.menu),cal:m.cal};
      }

      // 테이블 렌더
      var h='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.82em">';
      h+='<thead><tr><th style="padding:6px;border:1px solid var(--bd);background:var(--bg2);width:60px"></th>';
      for(var i=0;i<5;i++){
        var ds=Neis.ymd(dates[i]),isT=ds===todayStr;
        h+='<th style="padding:8px;border:1px solid var(--bd);background:'+(isT?'var(--blue)':'var(--bg2)')+';color:'+(isT?'#fff':'var(--tx)')+';font-weight:700">';
        h+=dn[i]+' '+(dates[i].getMonth()+1)+'/'+dates[i].getDate();
        if(isT)h+=' <span style="font-size:.7em;background:rgba(255,255,255,.3);padding:0 4px;border-radius:4px">오늘</span>';
        h+='</th>';
      }
      h+='</tr></thead><tbody>';

      for(var ti=0;ti<3;ti++){
        var type=types[ti],color=typeColors[type],icon=typeIcons[type];
        h+='<tr>';
        h+='<td style="padding:8px;border:1px solid var(--bd);background:'+color+';color:#fff;font-weight:700;text-align:center;writing-mode:vertical-rl;letter-spacing:2px">'+icon+' '+type+'</td>';
        for(var i=0;i<5;i++){
          var ds=Neis.ymd(dates[i]),isT=ds===todayStr;
          var meal=grid[ds]?grid[ds][type]:null;
          h+='<td style="padding:8px;border:1px solid var(--bd);vertical-align:top;background:'+(isT?'#e3f2fd':'var(--bg)')+';min-width:120px">';
          if(!meal){
            h+='<div style="color:var(--tx3);font-size:.85em;text-align:center;padding:8px 0">없음</div>';
          }else{
            for(var k=0;k<meal.menu.length;k++){
              h+='<div style="padding:1px 0;font-size:.88em">'+meal.menu[k]+'</div>';
            }
            if(meal.cal)h+='<div style="margin-top:4px;font-size:.75em;color:var(--tx3)">🔥 '+meal.cal+'</div>';
          }
          h+='</td>';
        }
        h+='</tr>';
      }
      h+='</tbody></table></div>';
      document.getElementById('mealG').innerHTML=h;
    });
  }

  return{render:render,prev:function(){weekOff--;render()},next:function(){weekOff++;render()},now:function(){weekOff=0;render()}};
})();
