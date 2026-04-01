// js/auth.js — 인증 (평문 비밀번호, localStorage 영구 로그인)
var Auth=(function(){
  var SESSION_KEY='gm-session-v2';

  function saveSession(name,role){
    try{
      localStorage.setItem(SESSION_KEY,JSON.stringify({
        n:name,
        r:role||'user',
        t:Date.now()
      }));
    }catch(e){
      console.error('saveSession error:',e);
    }
  }

  function loadSession(){
    try{
      var raw=localStorage.getItem(SESSION_KEY);
      if(!raw)return null;
      var sess=JSON.parse(raw);
      if(!sess||!sess.n)return null;
      return sess;
    }catch(e){
      try{localStorage.removeItem(SESSION_KEY);}catch(e2){}
      return null;
    }
  }

  function clearSession(){
    try{localStorage.removeItem(SESSION_KEY);}catch(e){}
  }

  function sanitize(str){
    return String(str||'').replace(/[<>&"'`]/g,function(c){
      return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#x27;','`':'&#x60;'}[c];
    }).substring(0,100);
  }

  function initAccounts(){
    if(Store.get('accounts',null))return;

    var acc={};
    for(var name in TD_A){
      acc[name]={id:name,pw:'1234',role:'user'};
    }
    acc['김스데반']={id:'김스데반',pw:'1120',role:'admin'};
    Store.set('accounts',acc);
  }

  // 해시 잔재 → 평문으로 마이그레이션
  function migrateHashedPasswords(){
    var acc=Store.get('accounts',null);
    if(!acc)return;

    var changed=false;
    for(var k in acc){
      var a=acc[k];
      if(a && a.pw && /^h[0-9a-f]{16}/.test(a.pw)){
        a.pw=(k==='김스데반')?'1120':'1234';
        changed=true;
      }
    }

    if(changed){
      Store.set('accounts',acc);
      console.log('해시 비번 → 평문 마이그레이션 완료');
    }
  }

  function getAccounts(){
    return Store.get('accounts',{});
  }

  function saveAccounts(a){
    Store.set('accounts',a);
  }

  function showApp(name,isAdmin){
    try{
      var init=document.getElementById('initScreen');
      if(init)init.style.display='none';

      var ls=document.getElementById('loginScreen');
      var sh=document.getElementById('shell');

      if(ls)ls.style.display='none';
      if(sh)sh.style.display='flex';

      if(typeof App==='undefined' || !App || typeof App.init!=='function'){
        throw new Error('App.init is not available');
      }

      App.init(name,isAdmin);
      return true;
    }catch(e){
      console.error('showApp error:',e);

      try{
        var ls2=document.getElementById('loginScreen');
        var sh2=document.getElementById('shell');
        if(sh2)sh2.style.display='none';
        if(ls2)ls2.style.display='flex';
      }catch(e2){}

      return false;
    }
  }

  function login(){
    var idEl=document.getElementById('loginId');
    var pwEl=document.getElementById('loginPw');
    var errEl=document.getElementById('loginErr');
    if(!idEl||!pwEl||!errEl)return false;

    var id=sanitize((idEl.value||'').trim());
    var pw=pwEl.value||'';

    if(!id||!pw){
      errEl.textContent='아이디와 비밀번호를 입력하세요';
      return false;
    }

    var acc=getAccounts();
    var found=null;
    var fk=null;

    for(var k in acc){
      if(acc[k] && acc[k].id===id){
        found=acc[k];
        fk=k;
        break;
      }
    }

    if(!found){
      errEl.textContent='존재하지 않는 아이디입니다';
      return false;
    }

    if(found.pw!==pw){
      errEl.textContent='비밀번호가 틀렸습니다';
      return false;
    }

    errEl.textContent='';

    // 중요: 앱이 정상 진입한 뒤에만 세션 저장
    var ok=showApp(fk,found.role==='admin');
    if(!ok){
      clearSession();
      errEl.textContent='앱을 불러오는 중 오류가 발생했습니다. 새로고침 후 다시 시도하세요.';
      return false;
    }

    saveSession(fk,found.role||'user');
    return true;
  }

  function logout(){
    clearSession();
    location.reload();
  }

  function tryAutoLogin(){
    try{
      migrateHashedPasswords();

      var sess=loadSession();
      if(!sess||!sess.n)return false;

      var acc=getAccounts();
      if(!acc || !acc[sess.n]){
        clearSession();
        return false;
      }

      var role=acc[sess.n].role || sess.r || 'user';
      var ok=showApp(sess.n,role==='admin');

      if(!ok){
        clearSession();
        return false;
      }

      return true;
    }catch(e){
      console.error('tryAutoLogin error:',e);
      clearSession();
      return false;
    }
  }

  function changePw(){
    if(typeof App==='undefined' || !App || typeof App.getUser!=='function')return;

    var user=App.getUser();
    if(!user)return;

    var acc=getAccounts();
    if(!acc[user])return;

    var cur=prompt('현재 비밀번호:');
    if(cur===null)return;

    if(cur!==acc[user].pw){
      toast('현재 비밀번호가 틀립니다');
      return;
    }

    var np=prompt('새 비밀번호 (4자 이상):');
    if(!np||np.length<4){
      toast('비밀번호는 4자 이상이어야 합니다');
      return;
    }

    var np2=prompt('새 비밀번호 확인:');
    if(np!==np2){
      toast('비밀번호 불일치');
      return;
    }

    acc[user].pw=np;
    saveAccounts(acc);
    toast('비밀번호 변경됨');
  }

  return{
    initAccounts:initAccounts,
    getAccounts:getAccounts,
    saveAccounts:saveAccounts,
    login:login,
    logout:logout,
    tryAutoLogin:tryAutoLogin,
    sanitize:sanitize,
    clearSession:clearSession,
    changePw:changePw
  };
})();
