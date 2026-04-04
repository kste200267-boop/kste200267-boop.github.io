// js/store.js — Firebase Firestore + localStorage 캐시 (안전 버전)

// Firebase 설정
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyAIL9zYAkt_VKPck7FaMuHTFc6ALMeIp7k",
  authDomain: "gbgigo-portal.firebaseapp.com",
  projectId: "gbgigo-portal",
  storageBucket: "gbgigo-portal.firebasestorage.app",
  messagingSenderId: "276912850692",
  appId: "1:276912850692:web:7567b8af1cee85e2c9f251"
};

var _fb = null, _db = null, _fbReady = false, _fbQueue = [];

// Firebase 초기화
function initFirebase(){
  if(_fbReady) return;

  try{
    if(typeof firebase === 'undefined') return;
    if(!firebase.apps.length){
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    _db = firebase.firestore();
    _fbReady = true;

    while(_fbQueue.length){
      var fn = _fbQueue.shift();
      try{ fn(); }catch(e){ console.error('queued Firebase job error:', e); }
    }
  }catch(e){
    console.error('Firebase init error:', e);
  }
}

var Store = (function(){
  var P = 'gm-';

  function lg(k, d){
    try{
      var v = localStorage.getItem(P + k);
      return v ? JSON.parse(v) : d;
    }catch(e){
      console.error('local get error [' + k + ']:', e);
      return d;
    }
  }

  function ls(k, v){
    try{
      localStorage.setItem(P + k, JSON.stringify(v));
    }catch(e){
      console.error('local set error [' + k + ']:', e);
    }
  }

  function lr(k){
    try{
      localStorage.removeItem(P + k);
    }catch(e){
      console.error('local remove error [' + k + ']:', e);
    }
  }

  function clearLocalCache(opts){
    opts = safeObject(opts);
    var keep = {};
    safeArray(opts.keep).forEach(function(key){
      if(key) keep[String(key)] = true;
    });

    try{
      var keys = [];
      for(var i = 0; i < localStorage.length; i += 1){
        var key = localStorage.key(i);
        if(!key || key.indexOf(P) !== 0) continue;
        if(keep[key]) continue;
        keys.push(key);
      }

      keys.forEach(function(key){
        try{ localStorage.removeItem(key); }catch(removeError){
          console.error('local clear error [' + key + ']:', removeError);
        }
      });
    }catch(e){
      console.error('clearLocalCache error:', e);
    }
  }

  function fbGet(key, cb){
    if(!_fbReady || !_db){
      if(typeof cb === 'function') cb(null);
      return;
    }

    _db.collection('portal').doc(key).get()
      .then(function(doc){
        try{
          if(typeof cb === 'function'){
            cb(doc.exists ? doc.data().value : null);
          }
        }catch(e){
          console.error('fbGet callback error [' + key + ']:', e);
          if(typeof cb === 'function') cb(null);
        }
      })
      .catch(function(e){
        console.error('fbGet error [' + key + ']:', e);
        if(typeof cb === 'function') cb(null);
      });
  }

  function fbSet(key, val){
    if(!_fbReady || !_db){
      _fbQueue.push(function(){ fbSet(key, val); });
      return;
    }

    _db.collection('portal').doc(key)
      .set({
        value: val,
        updated: new Date().toISOString()
      })
      .catch(function(e){
        console.error('FB write error [' + key + ']:', e);
      });
  }

  function fbDel(key){
    if(!_fbReady || !_db) return;

    _db.collection('portal').doc(key).delete()
      .catch(function(e){
        console.error('FB delete error [' + key + ']:', e);
      });
  }

  function get(k, d){
    return lg(k, d);
  }

  function set(k, v){
    ls(k, v);
    fbSet(k, v);
  }

  function remove(k){
    lr(k);
    fbDel(k);
  }

  // Firebase에서 전체 데이터 동기화
  function syncFromFirebase(cb){
    function done(){
      if(typeof cb === 'function'){
        try{ cb(); }catch(e){ console.error('syncFromFirebase cb error:', e); }
      }
    }

    if(!_fbReady || !_db){
      done();
      return;
    }

    _db.collection('portal').get()
      .then(function(snapshot){
        try{
          snapshot.forEach(function(doc){
            try{
              var key = doc.id;
              var data = doc.data();
              if(!data) return;

              var val = data.value;
              if(val !== undefined && val !== null){
                ls(key, val);
              }
            }catch(e){
              console.error('sync item error [' + doc.id + ']:', e);
            }
          });
        }catch(e){
          console.error('sync iteration error:', e);
        }
        done();
      })
      .catch(function(e){
        console.error('Sync error:', e);
        done();
      });
  }

  function weekKey(dt){
    var d = dt || new Date();
    var j = new Date(d.getFullYear(), 0, 1);
    var dn = Math.floor((d - j) / 864e5);
    var w = Math.ceil((dn + j.getDay() + 1) / 7);
    return d.getFullYear() + '-W' + String(w).padStart(2, '0');
  }

  function getMonday(dt){
    var d = new Date(dt || new Date());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function safeArray(v){
    return Array.isArray(v) ? v : [];
  }

  function safeObject(v){
    return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
  }

  function parseDateInput(value){
    if(!value) return null;
    var date;
    if(value instanceof Date){
      date = new Date(value.getTime());
    }else if(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)){
      date = new Date(value + 'T00:00:00');
    }else{
      date = new Date(value);
    }
    if(isNaN(date.getTime())) return null;
    return date;
  }

  function resolveSwapWeek(sw){
    sw = safeObject(sw);
    if(sw.week) return String(sw.week);
    var date = parseDateInput(sw.classDate || sw.targetDate || sw.date || '');
    return weekKey(date || new Date());
  }

  function hasTeacherSwapConflict(item, sw){
    if(!item || item.status !== 'applied') return false;
    if(resolveSwapWeek(item) !== resolveSwapWeek(sw)) return false;
    return item.teacher === sw.teacher && item.day === sw.day && Number(item.period) === Number(sw.period);
  }

  function hasSubstituteSwapConflict(item, sw){
    if(!item || item.status !== 'applied') return false;
    if(resolveSwapWeek(item) !== resolveSwapWeek(sw)) return false;
    return item.substitute === sw.substitute && item.day === sw.day && Number(item.period) === Number(sw.period);
  }

  function checkSwapConflict(sw){
    sw = safeObject(sw);
    sw.week = resolveSwapWeek(sw);
    var history = safeArray(get('swap-history', []));
    for(var i = 0; i < history.length; i += 1){
      var item = history[i];
      if(hasTeacherSwapConflict(item, sw)){
        return { ok: false, code: 'teacher-slot-conflict', week: sw.week };
      }
      if(hasSubstituteSwapConflict(item, sw)){
        return { ok: false, code: 'substitute-slot-conflict', week: sw.week };
      }
    }
    return { ok: true, week: sw.week };
  }

  return {
    get: get,
    set: set,
    remove: remove,
    clearLocalCache: clearLocalCache,
    weekKey: weekKey,
    getMonday: getMonday,
    syncFromFirebase: syncFromFirebase,

    getSwapHistory: function(){
      return safeArray(get('swap-history', []));
    },

    addSwap: function(sw){
      var h = safeArray(get('swap-history', []));
      sw = safeObject(sw);

      var conflict = checkSwapConflict(sw);
      if(!conflict.ok){
        return conflict;
      }

      sw.id = Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      sw.date = new Date().toISOString();
      sw.week = conflict.week;
      sw.status = 'applied';

      h.unshift(sw);
      set('swap-history', h);

      var all = safeObject(get('week-overrides', {}));
      if(!all[sw.week]) all[sw.week] = {};
      all[sw.week][sw.teacher + '|' + sw.day + '|' + sw.period] = sw.substitute;
      set('week-overrides', all);

      return sw;
    },

    cancelSwap: function(id){
      var h = safeArray(get('swap-history', []));
      for(var i = 0; i < h.length; i++){
        if(h[i] && h[i].id === id && h[i].status === 'applied'){
          h[i].status = 'cancelled';
          h[i].cancelledAt = new Date().toISOString();

          var all = safeObject(get('week-overrides', {}));
          var itemWeek = resolveSwapWeek(h[i]);
          h[i].week = itemWeek;
          if(all[itemWeek]){
            delete all[itemWeek][h[i].teacher + '|' + h[i].day + '|' + h[i].period];
            if(!Object.keys(all[itemWeek]).length){
              delete all[itemWeek];
            }
            set('week-overrides', all);
          }
          break;
        }
      }
      set('swap-history', h);
    },

    getWeekOverrides: function(wk){
      var all = safeObject(get('week-overrides', {}));
      return safeObject(all[wk || weekKey()]);
    },
    checkSwapConflict: checkSwapConflict,

    getTasks: function(){
      return safeObject(get('tasks', {}));
    },

    setTasks: function(t){
      set('tasks', safeObject(t));
    },

    exportAll: function(){
      return {
        tasks: safeObject(get('tasks', {})),
        pt: get('pt', null),
        accounts: get('accounts', null),
        swapHistory: safeArray(get('swap-history', [])),
        weekOverrides: safeObject(get('week-overrides', {}))
      };
    },

    importAll: function(d){
      d = safeObject(d);
      if(d.tasks) set('tasks', safeObject(d.tasks));
      if(d.pt) set('pt', d.pt);
      if(d.accounts) set('accounts', d.accounts);
      if(d.swapHistory) set('swap-history', safeArray(d.swapHistory));
      if(d.weekOverrides) set('week-overrides', safeObject(d.weekOverrides));
    }
  };
})();
