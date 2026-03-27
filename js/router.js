// js/router.js
var App=(function(){
  var user=null,admin=false;
  return{
    init:function(name,isA){
      user=name;admin=isA;Engine.rebuild();
      document.getElementById('tName').textContent=name;
      var td=Engine.TD()[name];
      document.getElementById('tSub').textContent=Engine.TS()[name]+(td&&td.h?' · '+td.h+'시수':'');
      Router.buildNav();Router.go('home');
    },
    getUser:function(){return user;},
    isAdmin:function(){return admin;},
    setUser:function(n,a){user=n;admin=a;}
  };
})();

var Router=(function(){
  var TABS=[
    {id:'home',    icon:'🏠',label:'홈'},
    {id:'my',      icon:'📅',label:'내 시간표'},
    {id:'full',    icon:'🏫',label:'전체 시간표'},
    {id:'swap',    icon:'🔄',label:'수업 교체'},
    {id:'history', icon:'📜',label:'교체 기록'},
    {id:'weekly',  icon:'📋',label:'주간 업무'},
    {id:'roster',  icon:'👥',label:'학생 명부'},
    {id:'meal',    icon:'🍱',label:'급식'},
    {id:'schedule',icon:'📆',label:'학사일정'},
    {id:'tasks',   icon:'✅',label:'할 일'},
    {id:'admin',   icon:'⚙️',label:'관리',admin:true}
  ];
  var cur='home';
  function buildNav(){
    var h='';
    for(var i=0;i<TABS.length;i++){
      var t=TABS[i];if(t.admin&&!App.isAdmin())continue;
      h+='<div class="s-item'+(t.id===cur?' on':'')+'" onclick="Router.go(\''+t.id+'\')">'+t.icon+' '+t.label+'</div>';
    }
    document.getElementById('sidebar').innerHTML=h;
  }
  function go(id){
    cur=id;buildNav();
    document.getElementById('content').innerHTML='<div class="page-wrap" id="pg"></div>';
    var pages={home:PageHome,my:PageMy,full:PageFull,swap:PageSwap,history:PageHistory,
      weekly:PageWeekly,meal:PageMeal,schedule:PageSchedule,tasks:PageTasks,
      admin:PageAdmin,profile:PageProfile,roster:PageRoster};
    if(pages[id])pages[id].render();
    document.getElementById('content').scrollTop=0;
  }
  return{buildNav:buildNav,go:go};
})();
