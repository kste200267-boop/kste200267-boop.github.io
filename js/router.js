// js/router.js — roster 메뉴 숨김 (코드는 유지)
var App=(function(){
  var user=null,admin=false;
  return{
    init:function(name,isA){
      user=name;admin=isA;Engine.rebuild();
      var tName=document.getElementById('tName');
      var tSub=document.getElementById('tSub');
      if(tName)tName.textContent=name;
      var td=Engine.TD()[name];
      if(tSub)tSub.textContent=Engine.TS()[name]+(td&&td.h?' · '+td.h+'시수':'');
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
    // roster는 메뉴에서 숨김 — admin만 직접 접근 가능
    {id:'meal',    icon:'🍱',label:'급식'},
    {id:'schedule',icon:'📆',label:'학사일정'},
    {id:'tasks',   icon:'✅',label:'할 일'},
    {id:'admin',   icon:'⚙️',label:'관리',admin:true}
  ];
  var cur='home';

  function buildNav(){
    var h='';
    for(var i=0;i<TABS.length;i++){
      var t=TABS[i];
      if(t.admin&&!App.isAdmin())continue;
      h+='<div class="s-item'+(t.id===cur?' on':'')+'" onclick="Router.go(\''+t.id+'\')">'+t.icon+' '+t.label+'</div>';
    }
    // roster: 관리자에게만 메뉴 표시 (일반 교사에겐 숨김)
    if(App.isAdmin()){
      h+='<div class="s-item'+(cur==='roster'?' on':'')+'" onclick="Router.go(\'roster\')">👥 학생 명부</div>';
    }
    var sidebar=document.getElementById('sidebar');
    if(sidebar)sidebar.innerHTML=h;
  }

  function go(id){
    // roster: 관리자만 접근 가능
    if(id==='roster'&&!App.isAdmin()){
      toast('접근 권한이 없습니다.');
      return;
    }

    cur=id;buildNav();
    location.hash=id;
    var content=document.getElementById('content');
    if(content)content.innerHTML='<div class="page-wrap" id="pg"></div>';

    var pages={
      home:PageHome,
      my:PageMy,
      full:PageFull,
      swap:PageSwap,
      history:PageHistory,
      weekly:PageWeekly,
      meal:PageMeal,
      schedule:PageSchedule,
      tasks:PageTasks,
      admin:PageAdmin,
      profile:PageProfile,
      roster:PageRoster  // 코드 유지, 관리자만 실행
    };
    if(pages[id])pages[id].render();
    var c=document.getElementById('content');
    if(c)c.scrollTop=0;
  }

  return{buildNav:buildNav,go:go};
})();
