// pages/admin-patch.js
// admin.js 로드 후 이 파일을 로드하면 계정 저장 함수를 해시 적용 버전으로 교체
// index.html에서 <script src="pages/admin.js"></script> 바로 다음 줄에 추가

(function(){
  // PageAdmin이 로드된 후 saveAcc, addAcc를 해시 버전으로 교체
  var _origRender = PageAdmin.render;

  // saveAcc 교체: 비밀번호 저장 시 해시 처리
  PageAdmin.saveAcc = function(c){
    var acc = Auth.getAccounts();
    for(var i=0;i<c;i++){
      var el = document.getElementById('ai'+i);
      if(!el)continue;
      var k = el.dataset.k;
      acc[k].id = el.value.trim()||k;
      var pwEl = document.getElementById('ap'+i);
      var newPw = pwEl ? pwEl.value : '';
      // 입력된 경우에만 해시 저장 (빈칸 → 기존 유지)
      if(newPw && newPw.length >= 1){
        acc[k].pw = Auth.hashPw(newPw);
      }
      var roleEl = document.getElementById('ar'+i);
      if(roleEl) acc[k].role = roleEl.value;
    }
    Auth.saveAccounts(acc);
    toast('저장됨');
  };

  // addAcc 교체: 신규 계정 비밀번호 해시 저장
  PageAdmin.addAcc = function(){
    var n = document.getElementById('nn').value.trim();
    if(!n){toast('이름 입력');return;}
    var acc = Auth.getAccounts();
    if(acc[n]){toast('이미 존재');return;}
    var rawPw = document.getElementById('np').value||'1234';
    acc[n] = {
      id: document.getElementById('ni').value.trim()||n,
      pw: Auth.hashPw(rawPw),
      role: document.getElementById('nr').value
    };
    if(!TD_A[n]) TD_A[n]={h:0,s:new Array(32).fill(null)};
    if(!TD_B[n]) TD_B[n]={h:0,s:new Array(32).fill(null)};
    Auth.saveAccounts(acc);
    Engine.rebuild();
    toast(n+' 추가됨');
    PageAdmin.render();
  };
})();
