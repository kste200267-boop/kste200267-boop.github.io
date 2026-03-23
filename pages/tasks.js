// pages/tasks.js
var PageTasks=(function(){
  function render(){
    var tasks=Store.getTasks();
    var dayC={월:'mon',화:'tue',수:'wed',목:'thu',금:'fri'};
    var h='<div class="card"><div class="card-h">✅ 할 일 관리</div>';
    for(var di=0;di<5;di++){var d=DAYS[di],arr=tasks[d]||[];
      h+='<div style="margin-bottom:12px"><div class="task-day-h '+dayC[d]+'">'+d+'요일'+(arr.length?' ('+arr.length+'건)':'')+'</div><div class="task-body">';
      if(!arr.length)h+='<div style="color:var(--tx3);font-size:.83em;padding:6px">등록된 업무 없음</div>';
      for(var i=0;i<arr.length;i++){var t=arr[i];
        h+='<div class="ti'+(t.done?' done':'')+'"><div class="ti-ck" onclick="PageTasks.tg(\''+d+'\','+i+')"><svg width="10" height="10" viewBox="0 0 10 10" style="opacity:'+(t.done?1:0)+'"><path d="M2 5l2 2 4-4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg></div>';
        h+='<div class="ti-tx">'+t.text+'</div>';
        if(t.time)h+='<div class="ti-tm">'+t.time+'</div>';
        h+='<div class="ti-del" onclick="PageTasks.del(\''+d+'\','+i+')">✕</div></div>';
      }
      h+='</div></div>';
    }
    h+='<div class="ti-row"><select class="ti-sel" id="tkD"><option>월</option><option>화</option><option>수</option><option>목</option><option>금</option></select>';
    h+='<input class="ti-input" id="tkI" placeholder="업무 입력..." onkeydown="if(event.key===\'Enter\')PageTasks.add()">';
    h+='<input type="time" class="ti-sel" id="tkT">';
    h+='<button class="ti-add" onclick="PageTasks.add()">추가</button></div></div>';
    document.getElementById('pg').innerHTML=h;
  }
  function add(){
    var d=document.getElementById('tkD').value,tx=document.getElementById('tkI').value.trim(),tm=document.getElementById('tkT').value;
    if(!tx){toast('내용을 입력하세요');return}
    var tasks=Store.getTasks();if(!tasks[d])tasks[d]=[];
    tasks[d].push({text:tx,time:tm,done:false});
    Store.setTasks(tasks);document.getElementById('tkI').value='';render();toast('추가됨');
  }
  return{
    render:render,add:add,
    tg:function(d,i){var t=Store.getTasks();t[d][i].done=!t[d][i].done;Store.setTasks(t);render()},
    del:function(d,i){var t=Store.getTasks();t[d].splice(i,1);Store.setTasks(t);render();toast('삭제됨')}
  };
})();
