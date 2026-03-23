// js/auth.js — 인증
var Auth=(function(){
  function initAccounts(){
    if(Store.get('accounts',null))return;
    var acc={};
    for(var name in TD_ORIGINAL)acc[name]={id:name,pw:'1234',role:'user'};
    acc['김스데반']={id:'김스데반',pw:'1120',role:'admin'};
    Store.set('accounts',acc);
  }
  function getAccounts(){return Store.get('accounts',{})}
  function saveAccounts(a){Store.set('accounts',a)}

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
    Store.set('session',{name:found._key,role:found.role});
    showApp(found._key,found.role==='admin');
  }
  function logout(){
    Store.remove('session');
    document.getElementById('shell').style.display='none';
    document.getElementById('loginScreen').style.display='flex';
    document.getElementById('loginId').value='';document.getElementById('loginPw').value='';
    document.getElementById('loginErr').textContent='';
  }
  function tryAutoLogin(){
    var sess=Store.get('session',null);
    if(sess&&TD_ORIGINAL[sess.name]){showApp(sess.name,sess.role==='admin');return true}
    return false;
  }
  function showApp(name,isAdmin){
    document.getElementById('loginScreen').style.display='none';
    document.getElementById('shell').style.display='flex';
    App.init(name,isAdmin);
  }
  return{initAccounts:initAccounts,getAccounts:getAccounts,saveAccounts:saveAccounts,login:login,logout:logout,tryAutoLogin:tryAutoLogin,
    changePw:function(){
      var user=App.getUser();if(!user)return;
      var acc=getAccounts();if(!acc[user])return;
      var cur=prompt('현재 비밀번호:');
      if(cur===null)return;
      if(cur!==acc[user].pw){toast('현재 비밀번호가 틀립니다');return}
      var np=prompt('새 비밀번호:');
      if(!np||np.length<1){toast('비밀번호를 입력하세요');return}
      var np2=prompt('새 비밀번호 확인:');
      if(np!==np2){toast('비밀번호가 일치하지 않습니다');return}
      acc[user].pw=np;saveAccounts(acc);toast('비밀번호가 변경되었습니다');
    }
  };})();
