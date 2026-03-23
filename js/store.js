// js/store.js — Firebase Firestore + localStorage 캐시
// Firebase 설정
var FIREBASE_CONFIG={
  apiKey:"AIzaSyAIL9zYAkt_VKPck7FaMuHTFc6ALMeIp7k",
  authDomain:"gbgigo-portal.firebaseapp.com",
  projectId:"gbgigo-portal",
  storageBucket:"gbgigo-portal.firebasestorage.app",
  messagingSenderId:"276912850692",
  appId:"1:276912850692:web:7567b8af1cee85e2c9f251"
};

var _fb=null,_db=null,_fbReady=false,_fbQueue=[];

// Firebase 초기화 (SDK 로드 후)
function initFirebase(){
  if(_fbReady)return;
  try{
    if(typeof firebase==='undefined')return;
    if(!firebase.apps.length)firebase.initializeApp(FIREBASE_CONFIG);
    _db=firebase.firestore();
    _fbReady=true;
    // 큐에 쌓인 작업 실행
    while(_fbQueue.length){var fn=_fbQueue.shift();fn()}
  }catch(e){console.error('Firebase init error:',e)}
}

var Store=(function(){
  var P='gm-';
  // localStorage (캐시 겸 오프라인 폴백)
  function lg(k,d){try{var v=localStorage.getItem(P+k);return v?JSON.parse(v):d}catch(e){return d}}
  function ls(k,v){try{localStorage.setItem(P+k,JSON.stringify(v))}catch(e){}}
  function lr(k){localStorage.removeItem(P+k)}

  // Firestore 읽기
  function fbGet(key,cb){
    if(!_fbReady){cb(null);return}
    _db.collection('portal').doc(key).get().then(function(doc){
      cb(doc.exists?doc.data().value:null);
    }).catch(function(){cb(null)});
  }
  // Firestore 쓰기
  function fbSet(key,val){
    if(!_fbReady){_fbQueue.push(function(){fbSet(key,val)});return}
    _db.collection('portal').doc(key).set({value:val,updated:new Date().toISOString()}).catch(function(e){console.error('FB write error:',e)});
  }
  function fbDel(key){
    if(!_fbReady)return;
    _db.collection('portal').doc(key).delete().catch(function(){});
  }

  // 통합 get: localStorage 즉시 반환 + Firebase에서 비동기 갱신
  function get(k,d){return lg(k,d)}

  // 통합 set: localStorage + Firebase 동시
  function set(k,v){ls(k,v);fbSet(k,v)}

  function remove(k){lr(k);fbDel(k)}

  // Firebase에서 전체 데이터 동기화 (로그인 시 1회)
  function syncFromFirebase(cb){
    if(!_fbReady){if(cb)cb();return}
    _db.collection('portal').get().then(function(snapshot){
      snapshot.forEach(function(doc){
        var key=doc.id;
        var val=doc.data().value;
        if(val!==undefined&&val!==null){
          ls(key,val);
        }
      });
      if(cb)cb();
    }).catch(function(e){
      console.error('Sync error:',e);
      if(cb)cb();
    });
  }

  function weekKey(dt){var d=dt||new Date(),j=new Date(d.getFullYear(),0,1),dn=Math.floor((d-j)/864e5),w=Math.ceil((dn+j.getDay()+1)/7);return d.getFullYear()+'-W'+String(w).padStart(2,'0')}
  function getMonday(dt){var d=new Date(dt||new Date());d.setDate(d.getDate()-((d.getDay()+6)%7));d.setHours(0,0,0,0);return d}

  return{
    get:get,set:set,remove:remove,weekKey:weekKey,getMonday:getMonday,
    syncFromFirebase:syncFromFirebase,

    getSwapHistory:function(){return get('swap-history',[])},
    addSwap:function(sw){
      var h=get('swap-history',[]);
      sw.id=Date.now()+'-'+Math.random().toString(36).substr(2,5);
      sw.date=new Date().toISOString();sw.week=weekKey();sw.status='applied';
      h.unshift(sw);set('swap-history',h);
      var all=get('week-overrides',{});if(!all[sw.week])all[sw.week]={};
      all[sw.week][sw.teacher+'|'+sw.day+'|'+sw.period]=sw.substitute;
      set('week-overrides',all);return sw;
    },
    cancelSwap:function(id){
      var h=get('swap-history',[]);
      for(var i=0;i<h.length;i++){if(h[i].id===id&&h[i].status==='applied'){
        h[i].status='cancelled';h[i].cancelledAt=new Date().toISOString();
        var all=get('week-overrides',{});if(all[h[i].week]){
          delete all[h[i].week][h[i].teacher+'|'+h[i].day+'|'+h[i].period];
          if(!Object.keys(all[h[i].week]).length)delete all[h[i].week];set('week-overrides',all)}
        break;}}
      set('swap-history',h);
    },
    getWeekOverrides:function(wk){return(get('week-overrides',{}))[wk||weekKey()]||{}},
    getTasks:function(){return get('tasks',{})},setTasks:function(t){set('tasks',t)},
    exportAll:function(){return{tasks:get('tasks',{}),pt:get('pt',null),accounts:get('accounts',null),swapHistory:get('swap-history',[]),weekOverrides:get('week-overrides',{})}},
    importAll:function(d){if(d.tasks)set('tasks',d.tasks);if(d.pt)set('pt',d.pt);if(d.accounts)set('accounts',d.accounts);if(d.swapHistory)set('swap-history',d.swapHistory);if(d.weekOverrides)set('week-overrides',d.weekOverrides)}
  };
})();
