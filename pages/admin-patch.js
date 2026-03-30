(function(){
  function hashPw(str){
    var h1=5381,h2=0x811c9dc5;
    for(var i=0;i<str.length;i++){
      var c=str.charCodeAt(i);
      h1=Math.imul(h1^c,0x9e3779b9)>>>0;
      h2=Math.imul(h2^c,0x01000193)>>>0;
    }
    return 'h'+h1.toString(16).padStart(8,'0')+h2.toString(16).padStart(8,'0');
  }

  PageAdmin.saveAcc=function(c){
    var acc=Auth.getAccounts();
    for(var i=0;i<c;i++){
      var el=document.getElementById('ai'+i);
      if(!el)continue;
      var k=el.dataset.k;
      acc[k].id=el.value.trim()||k;
      var pwEl=document.getElementById('ap'+i);
      var newPw=pwEl?pwEl.value:'';
      if(newPw&&newPw.length>=1){
        acc[k].pw=hashPw(newPw);
      }
      var roleEl=document.getElementById('ar'+i);
      if(roleEl)acc[k].role=roleEl.value;
    }
    Auth.saveAccounts(acc);
    toast('저장됨');
  };

  PageAdmin.addAcc=function(){
    var n=document.getElementById('nn').value.trim();
    if(!n){toast('이름 입력');return;}
    var acc=Auth.getAccounts();
    if(acc[n]){toast('이미 존재');return;}
    var rawPw=document.getElementById('np').value||'1234';
    acc[n]={
      id:document.getElementById('ni').value.trim()||n,
      pw:hashPw(rawPw),
      role:document.getElementById('nr').value
    };
    if(!TD_A[n])TD_A[n]={h:0,s:new Array(32).fill(null)};
    if(!TD_B[n])TD_B[n]={h:0,s:new Array(32).fill(null)};
    Auth.saveAccounts(acc);
    Engine.rebuild();
    toast(n+' 추가됨');
    PageAdmin.render();
  };
})();
