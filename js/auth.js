// js/auth.js — 인증 (평문 비밀번호, localStorage 영구 로그인)
var Auth=(function(){
  var SESSION_KEY='gm-session-v2';

  function saveSession(name,role){
    try{localStorage.setItem(SESSION_KEY,JSON.stringify({n:name,r:role||'user'}));}catch(e){}
  }
  function loadSession(){
    try{
      var raw=localStorage.getItem(SESSION_KEY);
      if(!raw)return null;
      var sess=JSON.parse(raw);
      if(!sess||!sess.n)return null;
      return sess;
    }catch(e){localStorage.removeItem(SESSION_KEY);return null;}
  }
  function clearSession(){
    try{localStorage.removeItem(SESSION_KEY);}catch(e){}
  }

  function sanitize(str){
    return String(str||'').replace(/[<>&"'`]/g,function(c){
      return{'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#x27;','`':'&#x60;'}[c];
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

  // 해시 잔재 → 평문으로 마이그레이션 (h로 시작하는 16자 이상 → 기본값 1234로 초기화)
  function migrateHashedPasswords(){
    var acc=Store.get('accounts',null);
    if(!acc)return;
    var changed=false;
    for(var k in acc){
      var a=acc[k];
      if(a.pw&&/^h[0-9a-f]{16}/.test(a.pw)){
        // 관리자는 원래 비번으로, 일반 교사는 1234로
        a.pw=(k==='김스데반')?'1120':'1234';
        changed=true;
      }
    }
    if(changed){
      Store.set('accounts',acc);
      console.log('해시 비번 → 평문 마이그레이션 완료');
    }
  }

  function getAccounts(){return Store.get('accounts',{});}
  function saveAccounts(a){Store.set('accounts',a);}

  function login(){
    var idEl=document.getElementById('loginId');
    var pwEl=document.getElementById('loginPw');
    var errEl=document.getElementById('loginErr');
    if(!idEl||!pwEl||!errEl)return;

    var id=sanitize((idEl.value||'').trim());
    var pw=pwEl.value||'';
    if(!id||!pw){errEl.textContent='아이디와 비밀번호를 입력하세요';return;}

    var acc=getAccounts(),found=null,fk=null;
    for(var k in acc){
      if(acc[k].id===id){found=acc[k];fk=k;break;}
    }
    if(!found){errEl.textContent='존재하지 않는 아이디입니다';return;}
    if(found.pw!==pw){errEl.textContent='비밀번호가 틀렸습니다';return;}

    errEl.textContent='';
    saveSession(fk,found.role||'user');
    showApp(fk,found.role==='admin');
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
      var role=sess.r;
      if(acc[sess.n])role=acc[sess.n].role||role;
      showApp(sess.n,role==='admin');
      return true;
    }catch(e){
      clearSession();
      return false;
    }
  }

  function showApp(name,isAdmin){
    var init=document.getElementById('initScreen');
    if(init)init.style.display='none';
    var ls=document.getElementById('loginScreen'),sh=document.getElementById('shell');
    if(ls)ls.style.display='none';
    if(sh)sh.style.display='flex';
    try{App.init(name,isAdmin);}
    catch(e){setTimeout(function(){try{App.init(name,isAdmin);}catch(e2){console.error(e2);}},600);}
  }

  return{
    initAccounts:initAccounts,
    getAccounts:getAccounts,
    saveAccounts:saveAccounts,
    login:login,
    logout:logout,
    tryAutoLogin:tryAutoLogin,
    sanitize:sanitize,
    changePw:function(){
      var user=App.getUser();if(!user)return;
      var acc=getAccounts();if(!acc[user])return;
      var cur=prompt('현재 비밀번호:');if(cur===null)return;
      if(cur!==acc[user].pw){toast('현재 비밀번호가 틀립니다');return;}
      var np=prompt('새 비밀번호 (4자 이상):');
      if(!np||np.length<4){toast('비밀번호는 4자 이상이어야 합니다');return;}
      var np2=prompt('새 비밀번호 확인:');
      if(np!==np2){toast('비밀번호 불일치');return;}
      acc[user].pw=np;
      saveAccounts(acc);
      toast('비밀번호 변경됨');
    }
  };
})();
