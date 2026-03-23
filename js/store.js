// js/store.js — localStorage 래퍼
var Store=(function(){
  var P='gm-';
  function g(k,d){try{var v=localStorage.getItem(P+k);return v?JSON.parse(v):d}catch(e){return d}}
  function s(k,v){try{localStorage.setItem(P+k,JSON.stringify(v))}catch(e){}}
  function r(k){localStorage.removeItem(P+k)}
  function weekKey(dt){var d=dt||new Date(),j=new Date(d.getFullYear(),0,1),dn=Math.floor((d-j)/864e5),w=Math.ceil((dn+j.getDay()+1)/7);return d.getFullYear()+'-W'+String(w).padStart(2,'0')}
  function getMonday(dt){var d=new Date(dt||new Date());d.setDate(d.getDate()-((d.getDay()+6)%7));d.setHours(0,0,0,0);return d}
  return{
    get:g,set:s,remove:r,weekKey:weekKey,getMonday:getMonday,
    getSwapHistory:function(){return g('swap-history',[])},
    addSwap:function(sw){
      var h=g('swap-history',[]);
      sw.id=Date.now()+'-'+Math.random().toString(36).substr(2,5);
      sw.date=new Date().toISOString();sw.week=weekKey();sw.status='applied';
      h.unshift(sw);s('swap-history',h);
      var all=g('week-overrides',{});if(!all[sw.week])all[sw.week]={};
      all[sw.week][sw.teacher+'|'+sw.day+'|'+sw.period]=sw.substitute;
      s('week-overrides',all);return sw;
    },
    cancelSwap:function(id){
      var h=g('swap-history',[]);
      for(var i=0;i<h.length;i++){if(h[i].id===id&&h[i].status==='applied'){
        h[i].status='cancelled';h[i].cancelledAt=new Date().toISOString();
        var all=g('week-overrides',{});if(all[h[i].week]){
          delete all[h[i].week][h[i].teacher+'|'+h[i].day+'|'+h[i].period];
          if(!Object.keys(all[h[i].week]).length)delete all[h[i].week];s('week-overrides',all)}
        break;}}
      s('swap-history',h);
    },
    getWeekOverrides:function(wk){return(g('week-overrides',{}))[wk||weekKey()]||{}},
    getTasks:function(){return g('tasks',{})},setTasks:function(t){s('tasks',t)},
    exportAll:function(){return{tasks:g('tasks',{}),pt:g('pt',null),accounts:g('accounts',null),swapHistory:g('swap-history',[]),weekOverrides:g('week-overrides',{})}},
    importAll:function(d){if(d.tasks)s('tasks',d.tasks);if(d.pt)s('pt',d.pt);if(d.accounts)s('accounts',d.accounts);if(d.swapHistory)s('swap-history',d.swapHistory);if(d.weekOverrides)s('week-overrides',d.weekOverrides)}
  };
})();
