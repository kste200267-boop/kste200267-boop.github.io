// js/auth.js — 인증 (localStorage 영구 로그인)
var Auth=(function(){
  var SK='gm-auto-v1';

  function initAccounts(){
    if(Store.get('accounts',null))return;
    var acc={};
    var src=(typeof TD_A!=='undefined'&&Object.keys(TD_A).length)?TD_A:{};
    for(var name in src)acc[name]={id:name,pw:'1234',role:'user'};
    acc['김스데반']={id:'김스데반',pw:'1120',role:'admin'};
    Store.set('accounts',acc);
  }
  function getAccounts(){return Store.get('accounts',{});}
  function saveAccounts(a){Store.set('accounts',a);}

  function _save(name,role){
    try{localStorage.setItem(SK,JSON.stringify({n:name,r:role||'user'}));}catch(e){}
  }
  function _load(){
    try{
      var v=localStorage.getItem(SK);
      if(v){var o=JSON.parse(v);if(o&&o.n)return{name:o.n,role:o.r||'user'};}
      var v2=sessionStorage.getItem('gm-session');
      if(v2){var o2=JSON.parse(v2);if(o2&&o2.name){_save(o2.name,o2.role);sessionStorage.removeItem('gm-session');return{name:o2.name,role:o2.role||'user'};}}
    }catch(e){}
    return null;
  }
  function _clear(){
    try{localStorage.removeItem(SK);}catch(e){}
    try{sessionStorage.removeItem('gm-session');}catch(e){}
  }

  function login(){
    var id=(document.getElementById('loginId').value||'').trim();
    var pw=document.getElementById('loginPw').value||'';
    var err=document.getElementById('loginErr');
    if(!id||!pw){err.textContent='아이디와 비밀번호를 입력하세요';return;}
    var acc=getAccounts(),found=null,fk=null;
    for(var k in acc){if(acc[k].id===id){found=acc[k];fk=k;break;}}
    if(!found){err.textContent='존재하지 않는 아이디입니다';return;}
    if(found.pw!==pw){err.textContent='비밀번호가 틀렸습니다';return;}
    err.textContent='';
    _save(fk,found.role);
    showApp(fk,found.role==='admin');
  }
  function logout(){_clear();location.reload();}
  function tryAutoLogin(){
    var sess=_load();if(!sess||!sess.name)return false;
    try{
      var acc=getAccounts(),role=sess.role;
      if(acc[sess.name])role=acc[sess.name].role||role;
      showApp(sess.name,role==='admin');return true;
    }catch(e){_clear();return false;}
  }
  function showApp(name,isAdmin){
    var ls=document.getElementById('loginScreen'),sh=document.getElementById('shell');
    if(ls)ls.style.display='none';if(sh)sh.style.display='flex';
    try{App.init(name,isAdmin);}
    catch(e){setTimeout(function(){try{App.init(name,isAdmin);}catch(e2){}},600);}
  }

  return{
    initAccounts:initAccounts,getAccounts:getAccounts,saveAccounts:saveAccounts,
    login:login,logout:logout,tryAutoLogin:tryAutoLogin,
    changePw:function(){
      var user=App.getUser();if(!user)return;
      var acc=getAccounts();if(!acc[user])return;
      var cur=prompt('현재 비밀번호:');if(cur===null)return;
      if(cur!==acc[user].pw){toast('현재 비밀번호가 틀립니다');return;}
      var np=prompt('새 비밀번호:');if(!np)return;
      var np2=prompt('새 비밀번호 확인:');if(np!==np2){toast('비밀번호 불일치');return;}
      acc[user].pw=np;saveAccounts(acc);toast('비밀번호 변경됨');
    }
  };
})();
