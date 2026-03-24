// js/auth.js — 인증 (localStorage 기반 영구 로그인 유지)
var Auth=(function(){
  var SESSION_KEY='gm-session-v2'; // v2: localStorage 기반

  function initAccounts(){
    if(Store.get('accounts',null)) return;
    var acc={};
    var src=(typeof TD_A!=='undefined'&&Object.keys(TD_A).length)?TD_A:{};
    for(var name in src) acc[name]={id:name,pw:'1234',role:'user'};
    acc['김스데반']={id:'김스데반',pw:'1120',role:'admin'};
    Store.set('accounts',acc);
  }

  function getAccounts(){return Store.get('accounts',{})}
  function saveAccounts(a){Store.set('accounts',a)}

  // 세션 저장 (localStorage → 앱 닫아도 유지)
  function saveSession(name,role){
    try{localStorage.setItem(SESSION_KEY,JSON.stringify({name:name,role:role,ts:Date.now()}))}catch(e){}
  }
  function loadSession(){
    try{
      var raw=localStorage.getItem(SESSION_KEY);
      return raw?JSON.parse(raw):null;
    }catch(e){return null}
  }
  function clearSession(){
    try{localStorage.removeItem(SESSION_KEY)}catch(e){}
    // 구버전 세션도 제거
    try{sessionStorage.removeItem('gm-session')}catch(e){}
  }

  function login(){
    var id=document.getElementById('loginId').value.trim();
    var pw=document.getElementById('loginPw').value;
    var err=document.getElementById('loginErr');
    if(!id||!pw){err.textContent='아이디와 비밀번호를 입력하세요';return}
    var acc=getAccounts(),found=null;
    for(var k in acc){if(acc[k].id===id){found=acc[k];found._key=k;break}}
    if(!found){err.textContent='존재하지 않는 아이디입니다';return}
    if(found.pw!==pw){err.textContent='비밀번호가 틀렸습니다';return}
    err.textContent='';
    saveSession(found._key,found.role);
    showApp(found._key,found.role==='admin');
  }

  function logout(){
    clearSession();
    location.reload();
  }

  function tryAutoLogin(){
    try{
      // v2 localStorage 세션 먼저
      var sess=loadSession();
      // 구버전 sessionStorage 폴백
      if(!sess){
        var raw=sessionStorage.getItem('gm-session');
        if(raw){
          sess=JSON.parse(raw);
          // 구버전이면 localStorage로 마이그레이션
          if(sess&&sess.name) saveSession(sess.name,sess.role);
        }
      }
      if(!sess||!sess.name) return false;

      var acc=getAccounts();
      var tdLoaded=(typeof TD_A!=='undefined')&&Object.keys(TD_A||{}).length>0;

      if(acc[sess.name]||(tdLoaded&&TD_A[sess.name])){
        showApp(sess.name,sess.role==='admin');
        return true;
      }
    }catch(e){
      console.error('auto login error:',e);
      clearSession();
    }
    return false;
  }

  function showApp(name,isAdmin){
    var loginScreen=document.getElementById('loginScreen');
    var shell=document.getElementById('shell');
    if(loginScreen) loginScreen.style.display='none';
    if(shell) shell.style.display='flex';
    try{
      App.init(name,isAdmin);
    }catch(e){
      console.error('App.init error:',e);
      setTimeout(function(){
        try{App.init(name,isAdmin)}catch(e2){console.error('retry failed:',e2)}
      },500);
    }
  }

  return{
    initAccounts:initAccounts,
    getAccounts:getAccounts,
    saveAccounts:saveAccounts,
    login:login,
    logout:logout,
    tryAutoLogin:tryAutoLogin,
    changePw:function(){
      var user=App.getUser();if(!user)return;
      var acc=getAccounts();if(!acc[user])return;
      var cur=prompt('현재 비밀번호:');if(cur===null)return;
      if(cur!==acc[user].pw){toast('현재 비밀번호가 틀립니다');return}
      var np=prompt('새 비밀번호:');if(!np){toast('비밀번호를 입력하세요');return}
      var np2=prompt('새 비밀번호 확인:');if(np!==np2){toast('비밀번호가 일치하지 않습니다');return}
      acc[user].pw=np;saveAccounts(acc);toast('비밀번호 변경됨');
    }
  };
})();
