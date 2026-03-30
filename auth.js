// js/auth.js — 인증 (localStorage 영구 로그인 + 비밀번호 해시)
var Auth=(function(){
  var SESSION_KEY='gm-session-v2';

  // ── 비밀번호 해시 (djb2 변형, 동기 처리) ──
  // SubtleCrypto는 async라 로그인 흐름 복잡해지므로 djb2+FNV 혼합 사용
  function hashPw(str){
    var h1=5381, h2=0x811c9dc5;
    for(var i=0;i<str.length;i++){
      var c=str.charCodeAt(i);
      h1=Math.imul(h1^c, 0x9e3779b9)>>>0;
      h2=Math.imul(h2^c, 0x01000193)>>>0;
    }
    // 두 해시 조합 → 16진수 문자열
    return 'h'+h1.toString(16).padStart(8,'0')+h2.toString(16).padStart(8,'0');
  }

  // ── XSS 방어: 입력값 정리 ──
  function sanitize(str){
    return String(str||'')
      .replace(/[<>&"'`]/g,function(c){
        return{'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#x27;','`':'&#x60;'}[c];
      })
      .substring(0,100);
  }

  // ── 세션 저장/로드 (localStorage, 만료 없음) ──
  function saveSession(name,role){
    try{
      localStorage.setItem(SESSION_KEY,JSON.stringify({n:name,r:role||'user'}));
    }catch(e){}
  }

  function loadSession(){
    try{
      var raw=localStorage.getItem(SESSION_KEY);
      if(!raw)return null;
      var sess=JSON.parse(raw);
      if(!sess||!sess.n)return null;
      return sess;
    }catch(e){
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function clearSession(){
    try{localStorage.removeItem(SESSION_KEY);}catch(e){}
  }

  function initAccounts(){
    if(Store.get('accounts',null))return;
    var acc={};
    for(var name in TD_A){
      acc[name]={id:name,pw:hashPw('1234'),role:'user'};
    }
    acc['김스데반']={id:'김스데반',pw:hashPw('1120'),role:'admin'};
    Store.set('accounts',acc);
  }

  // 기존 평문 비밀번호 → 해시로 자동 마이그레이션
  function migratePlainPasswords(){
    var acc=Store.get('accounts',null);
    if(!acc)return;
    var changed=false;
    for(var k in acc){
      var a=acc[k];
      // 해시 형식('h'로 시작하는 16자 이상)이 아니면 평문으로 간주 → 해시 변환
      if(a.pw&&!(/^h[0-9a-f]{16}/.test(a.pw))){
        a.pw=hashPw(a.pw);
        changed=true;
      }
    }
    if(changed)Store.set('accounts',acc);
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
    if(id.length>50||pw.length>100){errEl.textContent='입력값이 올바르지 않습니다';return;}

    var acc=getAccounts(),found=null,fk=null;
    for(var k in acc){
      if(acc[k].id===id){found=acc[k];fk=k;break;}
    }
    if(!found){errEl.textContent='존재하지 않는 아이디입니다';return;}
if(found.pw!==hashPw(pw)&&found.pw!==pw){errEl.textContent='비밀번호가 틀렸습니다';return;}
// 평문이면 자동으로 해시 변환
if(found.pw===pw){
  found.pw=hashPw(pw);
  var accTemp=getAccounts();
  accTemp[fk].pw=hashPw(pw);
  saveAccounts(accTemp);
}

    errEl.textContent='';
    saveSession(fk,found.role);
    showApp(fk,found.role==='admin');
  }

  function logout(){
    clearSession();
    location.reload();
  }

  function tryAutoLogin(){
    try{
      migratePlainPasswords();
      var sess=loadSession();
      if(!sess||!sess.n)return false;
      initAccounts();
      var acc=getAccounts();
      var role=sess.r;
      if(acc[sess.n])role=acc[sess.n].role||role;
      showApp(sess.n,role==='admin');
      return true;
    }catch(e){
      console.error('auto login error:',e);
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
    hashPw:hashPw,
    sanitize:sanitize,
    changePw:function(){
      var user=App.getUser();if(!user)return;
      var acc=getAccounts();if(!acc[user])return;
      var cur=prompt('현재 비밀번호:');if(cur===null)return;
      if(hashPw(cur)!==acc[user].pw){toast('현재 비밀번호가 틀립니다');return;}
      var np=prompt('새 비밀번호 (4자 이상):');
      if(!np||np.length<4){toast('비밀번호는 4자 이상이어야 합니다');return;}
      var np2=prompt('새 비밀번호 확인:');
      if(np!==np2){toast('비밀번호 불일치');return;}
      acc[user].pw=hashPw(np);
      saveAccounts(acc);
      toast('비밀번호 변경됨');
    }
  };
})();
