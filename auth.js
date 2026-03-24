// js/auth.js — 인증 (localStorage 영구 세션)
var Auth=(function(){
  var SESSION_KEY='gm-session-v2';

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

  function saveSession(name,role){
    try{
      localStorage.setItem(SESSION_KEY,JSON.stringify({name:name,role:role,ts:Date.now()}));
    }catch(e){}
  }

  function loadSession(){
    // v2 (localStorage) 먼저
    try{
      var raw=localStorage.getItem(SESSION_KEY);
      if(raw){
        var s=JSON.parse(raw);
        if(s&&s.name) return s;
      }
    }catch(e){}
    // 구버전 (sessionStorage) 폴백 → 마이그레이션
    try{
      var raw2=sessionStorage.getItem('gm-session');
      if(raw2){
        var s2=JSON.parse(raw2);
        if(s2&&s2.name){
          saveSession(s2.name,s2.role||'user'); // localStorage로 이전
          sessionStorage.removeItem('gm-session');
          return s2;
        }
      }
    }catch(e){}
    return null;
  }

  function clearSession(){
    try{localStorage.removeItem(SESSION_KEY)}catch(e){}
    try{sessionStorage.removeItem('gm-session')}catch(e){}
  }

  function login(){
    var id=(document.getElementById('loginId').value||'').trim();
    var pw=document.getElementById('loginPw').value||'';
    var err=document.getElementById('loginErr');
    if(!id||!pw){err.textContent='아이디와 비밀번호를 입력하세요';return}

    var acc=getAccounts(),found=null,foundKey=null;
    for(var k in acc){
      if(acc[k].id===id){found=acc[k];foundKey=k;break}
    }
    if(!found){err.textContent='존재하지 않는 아이디입니다';return}
    if(found.pw!==pw){err.textContent='비밀번호가 틀렸습니다';return}

    err.textContent='';
    saveSession(foundKey,found.role);
    showApp(foundKey,found.role==='admin');
  }

  function logout(){
    clearSession();
    location.reload();
  }

  function tryAutoLogin(){
    var sess=loadSession();
    if(!sess||!sess.name) return false;

    // 핵심: 세션이 있으면 일단 로그인 시도
    // accounts 동기화 전이어도 이름만 있으면 앱 시작
    // (accounts가 나중에 Firebase에서 로드되면 자동 반영됨)
    try{
      var acc=getAccounts();
      var role=sess.role||'user';

      // accounts에 있으면 그 역할 사용
      if(acc[sess.name]){
        role=acc[sess.name].role||role;
      }

      showApp(sess.name, role==='admin');
      return true;
    }catch(e){
      console.error('tryAutoLogin error:',e);
      clearSession();
      return false;
    }
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
      },600);
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
