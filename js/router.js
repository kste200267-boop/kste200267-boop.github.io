// js/router.js — 안전 버전
var App=(function(){
  var user=null,admin=false;

  return{
    init:function(name,isA){
      try{
        user=name;
        admin=!!isA;

        Engine.rebuild();

        var tName=document.getElementById('tName');
        var tSub=document.getElementById('tSub');

        if(tName)tName.textContent=name;

        var td=Engine.TD()[name];
        if(tSub)tSub.textContent=Engine.TS()[name]+(td&&td.h?' · '+td.h+'시수':'');

        Router.buildNav();
        Router.go('home');
        return true;
      }catch(e){
        console.error('App.init error:',e);

        try{
          var sh=document.getElementById('shell');
          var ls=document.getElementById('loginScreen');
          if(sh)sh.style.display='none';
          if(ls)ls.style.display='flex';
        }catch(e2){}

        if(typeof toast==='function'){
          try{toast('앱 초기화 중 오류가 발생했습니다.');}catch(e3){}
        }

        return false;
      }
    },

    getUser:function(){return user;},
    isAdmin:function(){return admin;},
    setUser:function(n,a){
      user=n;
      admin=!!a;
    }
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
    {id:'meal',    icon:'🍱',label:'급식'},
    {id:'schedule',icon:'📆',label:'학사일정'},
    {id:'tasks',   icon:'✅',label:'할 일'},
    {id:'admin',   icon:'⚙️',label:'관리',admin:true}
  ];

  var cur='home';

  function buildNav(){
    try{
      var h='';

      for(var i=0;i<TABS.length;i++){
        var t=TABS[i];
        if(t.admin && !App.isAdmin())continue;

        h+='<div class="s-item'+(t.id===cur?' on':'')+'" onclick="Router.go(\''+t.id+'\')">'+t.icon+' '+t.label+'</div>';
      }

      if(App.isAdmin()){
        h+='<div class="s-item'+(cur==='roster'?' on':'')+'" onclick="Router.go(\'roster\')">👥 학생 명부</div>';
      }

      var sidebar=document.getElementById('sidebar');
      if(sidebar)sidebar.innerHTML=h;
    }catch(e){
      console.error('Router.buildNav error:',e);
    }
  }

  function renderError(msg){
    var content=document.getElementById('content');
    if(!content)return;

    content.innerHTML=
      '<div class="page-wrap">' +
        '<div style="padding:20px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">' +
          '<div style="font-size:1.1rem;font-weight:700;margin-bottom:8px;">⚠️ 화면 오류</div>' +
          '<div style="color:#555;line-height:1.6;">'+(msg||'페이지를 불러오는 중 오류가 발생했습니다.')+'</div>' +
          '<div style="margin-top:14px;">' +
            '<button class="btn-login" onclick="location.reload()">새로고침</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function go(id){
    try{
      if(id==='roster' && !App.isAdmin()){
        if(typeof toast==='function')toast('접근 권한이 없습니다.');
        return false;
      }

      cur=id;
      buildNav();

      try{
        location.hash=id;
      }catch(e){}

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
        roster:PageRoster
      };

      if(!pages[id]){
        renderError('존재하지 않는 페이지입니다.');
        return false;
      }

      if(typeof pages[id].render!=='function'){
        renderError('페이지 렌더 함수가 없습니다.');
        return false;
      }

      try{
        pages[id].render();
      }catch(e){
        console.error('Page render error ['+id+']:',e);
        renderError('해당 화면을 불러오는 중 오류가 발생했습니다.');
        return false;
      }

      var c=document.getElementById('content');
      if(c)c.scrollTop=0;

      return true;
    }catch(e){
      console.error('Router.go error:',e);
      renderError('화면 전환 중 오류가 발생했습니다.');
      return false;
    }
  }

  return{
    buildNav:buildNav,
    go:go
  };
})();
