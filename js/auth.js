// js/auth.js
var Auth = (function(){
  var SESSION_KEY = 'gm-session-v3';
  var LEGACY_SESSION_KEY = 'gm-session-v2';
  var ADMIN_NAME = '김스데반';
  var DEFAULT_USER_PASSWORD = '1234';
  var DEFAULT_ADMIN_PASSWORD = '1120';
  var HASH_ITERATIONS = 120000;

  var initPromise = null;
  var loginBusy = false;

  function getSessionStore(){
    try{
      return window.sessionStorage;
    }catch(e){
      return null;
    }
  }

  function sanitize(str){
    return String(str || '').replace(/[<>&"'`]/g, function(c){
      return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#x27;','`':'&#x60;'}[c];
    }).substring(0, 100);
  }

  function normalizeId(id, fallback){
    return String(id || fallback || '').trim().substring(0, 100);
  }

  function defaultPasswordForKey(key){
    return key === ADMIN_NAME ? DEFAULT_ADMIN_PASSWORD : DEFAULT_USER_PASSWORD;
  }

  function defaultRoleForKey(key){
    return key === ADMIN_NAME ? 'admin' : 'user';
  }

  function getStoredAccounts(){
    var raw = Store.get('accounts', {});
    return raw && typeof raw === 'object' ? raw : {};
  }

  function saveSession(name, role){
    var raw = JSON.stringify({
      n: name,
      r: role || 'user',
      t: Date.now()
    });
    var sessionStore = getSessionStore();

    try{
      if(sessionStore) sessionStore.setItem(SESSION_KEY, raw);
      else localStorage.setItem(SESSION_KEY, raw);
    }catch(e){
      console.error('saveSession error:', e);
    }

    try{ localStorage.removeItem(LEGACY_SESSION_KEY); }catch(ignore){}
    try{ localStorage.removeItem(SESSION_KEY); }catch(ignore2){}
  }

  function loadSession(){
    var sessionStore = getSessionStore();
    var raw = null;

    try{
      raw = sessionStore ? sessionStore.getItem(SESSION_KEY) : null;
    }catch(ignore){}

    if(!raw){
      try{
        raw = localStorage.getItem(SESSION_KEY) || localStorage.getItem(LEGACY_SESSION_KEY);
        if(raw && sessionStore){
          sessionStore.setItem(SESSION_KEY, raw);
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(LEGACY_SESSION_KEY);
        }
      }catch(ignore2){}
    }

    if(!raw) return null;

    try{
      var sess = JSON.parse(raw);
      if(!sess || !sess.n) return null;
      return sess;
    }catch(e){
      clearSession();
      return null;
    }
  }

  function clearSession(){
    var sessionStore = getSessionStore();
    try{ if(sessionStore) sessionStore.removeItem(SESSION_KEY); }catch(ignore){}
    try{ localStorage.removeItem(SESSION_KEY); }catch(ignore2){}
    try{ localStorage.removeItem(LEGACY_SESSION_KEY); }catch(ignore3){}
  }

  function clearRuntimeCache(){
    clearSession();
    try{
      if(Store && typeof Store.clearLocalCache === 'function') Store.clearLocalCache();
    }catch(e){
      console.error('clearRuntimeCache error:', e);
    }
    try{
      var sessionStore = getSessionStore();
      if(sessionStore) sessionStore.clear();
    }catch(ignore){}
  }

  function toHex(buffer){
    var bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    var out = '';
    for(var i = 0; i < bytes.length; i += 1){
      out += bytes[i].toString(16).padStart(2, '0');
    }
    return out;
  }

  function hexToBytes(hex){
    var clean = String(hex || '').replace(/[^0-9a-f]/gi, '');
    var bytes = new Uint8Array(Math.ceil(clean.length / 2));
    for(var i = 0; i < bytes.length; i += 1){
      bytes[i] = parseInt(clean.substr(i * 2, 2) || '00', 16);
    }
    return bytes;
  }

  function fallbackHash(password, salt){
    var seed = String(password || '') + '|' + String(salt || '');
    var out = '';

    for(var round = 0; round < 4; round += 1){
      var h1 = 0x811c9dc5;
      var h2 = 0x01000193;
      for(var i = 0; i < seed.length; i += 1){
        var code = seed.charCodeAt(i) + round;
        h1 ^= code;
        h1 = Math.imul(h1, 16777619);
        h2 ^= (code << ((i + round) % 8));
        h2 = Math.imul(h2, 2246822519);
      }
      out += (h1 >>> 0).toString(16).padStart(8, '0');
      out += (h2 >>> 0).toString(16).padStart(8, '0');
      seed = out + seed.length + round;
    }

    return out.substring(0, 64);
  }

  function derivePasswordHash(password, salt){
    password = String(password || '');
    salt = String(salt || '');

    if(window.crypto && window.crypto.subtle && window.TextEncoder){
      var encoder = new TextEncoder();
      return window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      ).then(function(key){
        return window.crypto.subtle.deriveBits({
          name: 'PBKDF2',
          salt: hexToBytes(salt),
          iterations: HASH_ITERATIONS,
          hash: 'SHA-256'
        }, key, 256);
      }).then(function(bits){
        return toHex(bits);
      });
    }

    return Promise.resolve(fallbackHash(password, salt));
  }

  function createSalt(){
    if(window.crypto && window.crypto.getRandomValues){
      var bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      return toHex(bytes);
    }
    return fallbackHash(String(Date.now()), String(Math.random())).substring(0, 32);
  }

  function secureEqual(a, b){
    a = String(a || '');
    b = String(b || '');
    var mismatch = a.length === b.length ? 0 : 1;
    var len = Math.max(a.length, b.length);
    for(var i = 0; i < len; i += 1){
      mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return mismatch === 0;
  }

  function setPasswordOnAccount(account, password){
    account.salt = createSalt();
    return derivePasswordHash(password, account.salt).then(function(hash){
      account.pwHash = hash;
      account.hashAlgo = (window.crypto && window.crypto.subtle && window.TextEncoder) ? 'pbkdf2-sha256' : 'fallback-sync';
      account.pwUpdatedAt = new Date().toISOString();
      delete account.pw;
      return account;
    });
  }

  function setPasswordOnAccountSync(account, password){
    account.salt = createSalt();
    account.pwHash = fallbackHash(password, account.salt);
    account.hashAlgo = 'fallback-sync';
    account.pwUpdatedAt = new Date().toISOString();
    delete account.pw;
    return account;
  }

  function cloneAccountForView(src, key){
    return {
      id: normalizeId(src.id, key),
      role: src.role === 'admin' ? 'admin' : 'user',
      hasPassword: !!(src.pwHash || src.pw),
      pwUpdatedAt: src.pwUpdatedAt || ''
    };
  }

  function buildSeedAccounts(){
    var acc = {};
    for(var name in TD_A){
      acc[name] = {
        id: name,
        role: 'user',
        pw: DEFAULT_USER_PASSWORD
      };
    }
    acc[ADMIN_NAME] = {
      id: ADMIN_NAME,
      role: 'admin',
      pw: DEFAULT_ADMIN_PASSWORD
    };
    return acc;
  }

  function migrateAccounts(raw){
    raw = raw && typeof raw === 'object' ? raw : {};
    if(!Object.keys(raw).length) raw = buildSeedAccounts();

    var normalized = {};
    var tasks = [];

    Object.keys(raw).forEach(function(key){
      var src = raw[key] || {};
      var account = {
        id: normalizeId(src.id, key),
        role: src.role === 'admin' || key === ADMIN_NAME ? 'admin' : defaultRoleForKey(key),
        pwUpdatedAt: src.pwUpdatedAt || ''
      };

      normalized[key] = account;

      if(src.pwHash && src.salt){
        account.pwHash = src.pwHash;
        account.salt = src.salt;
        account.hashAlgo = src.hashAlgo || 'fallback-sync';
        return;
      }

      tasks.push(setPasswordOnAccount(account, src.pw || defaultPasswordForKey(key)));
    });

    return Promise.all(tasks).then(function(){
      Store.set('accounts', normalized);
      return normalized;
    });
  }

  function initAccounts(force){
    if(force) initPromise = null;

    var seeded = getStoredAccounts();
    if(!Object.keys(seeded).length) seeded = buildSeedAccounts();

    var normalized = {};
    var changed = false;

    Object.keys(seeded).forEach(function(key){
      var src = seeded[key] || {};
      var account = {
        id: normalizeId(src.id, key),
        role: src.role === 'admin' || key === ADMIN_NAME ? 'admin' : defaultRoleForKey(key),
        pwUpdatedAt: src.pwUpdatedAt || ''
      };

      if(src.pwHash && src.salt){
        account.pwHash = src.pwHash;
        account.salt = src.salt;
        account.hashAlgo = src.hashAlgo || 'fallback-sync';
      }else{
        changed = true;
        setPasswordOnAccountSync(account, src.pw || defaultPasswordForKey(key));
      }

      normalized[key] = account;
    });

    if(changed || Object.keys(getStoredAccounts()).length !== Object.keys(normalized).length){
      Store.set('accounts', normalized);
    }

    if(!initPromise){
      initPromise = Promise.resolve(normalized);
    }
    return initPromise;
  }

  function getAccounts(){
    var raw = getStoredAccounts();
    var view = {};
    Object.keys(raw).forEach(function(key){
      view[key] = cloneAccountForView(raw[key] || {}, key);
    });
    return view;
  }

  function saveAccounts(next){
    next = next && typeof next === 'object' ? next : {};

    return initAccounts().then(function(){
      var current = getStoredAccounts();
      var merged = {};
      var tasks = [];

      Object.keys(next).forEach(function(key){
        var src = next[key] || {};
        var existing = current[key] || {};
        var account = {
          id: normalizeId(src.id, existing.id || key),
          role: src.role === 'admin' || key === ADMIN_NAME ? 'admin' : 'user',
          pwHash: existing.pwHash || '',
          salt: existing.salt || '',
          hashAlgo: existing.hashAlgo || 'fallback-sync',
          pwUpdatedAt: existing.pwUpdatedAt || ''
        };

        if(src.pw != null && src.pw !== ''){
          tasks.push(setPasswordOnAccount(account, src.pw));
        }else if(src.pwHash && src.salt){
          account.pwHash = src.pwHash;
          account.salt = src.salt;
          account.hashAlgo = src.hashAlgo || existing.hashAlgo || 'fallback-sync';
          account.pwUpdatedAt = src.pwUpdatedAt || existing.pwUpdatedAt || '';
        }else if(!account.pwHash || !account.salt){
          tasks.push(setPasswordOnAccount(account, defaultPasswordForKey(key)));
        }

        merged[key] = account;
      });

      return Promise.all(tasks).then(function(){
        Store.set('accounts', merged);
        return getAccounts();
      });
    });
  }

  function findAccountById(id){
    var accounts = getStoredAccounts();
    for(var key in accounts){
      if(accounts[key] && accounts[key].id === id){
        return { key: key, account: accounts[key] };
      }
    }
    return null;
  }

  function verifyStoredAccount(account, password){
    if(!account) return Promise.resolve(false);

    if(account.pwHash && account.salt){
      if(account.hashAlgo === 'fallback-sync'){
        return Promise.resolve(secureEqual(fallbackHash(password, account.salt), account.pwHash));
      }
      return derivePasswordHash(password, account.salt).then(function(hash){
        return secureEqual(hash, account.pwHash);
      });
    }

    if(account.pw != null){
      return Promise.resolve(secureEqual(account.pw, password));
    }

    return Promise.resolve(false);
  }

  function verifyUserPassword(userKey, password){
    return initAccounts().then(function(){
      var accounts = getStoredAccounts();
      return verifyStoredAccount(accounts[userKey], password);
    });
  }

  function showApp(name, isAdmin){
    try{
      var init = document.getElementById('initScreen');
      if(init) init.style.display = 'none';

      var ls = document.getElementById('loginScreen');
      var sh = document.getElementById('shell');

      if(ls) ls.style.display = 'none';
      if(sh) sh.style.display = 'flex';

      if(typeof App === 'undefined' || !App || typeof App.init !== 'function'){
        throw new Error('App.init is not available');
      }

      App.init(name, isAdmin);
      return true;
    }catch(e){
      console.error('showApp error:', e);

      try{
        var ls2 = document.getElementById('loginScreen');
        var sh2 = document.getElementById('shell');
        if(sh2) sh2.style.display = 'none';
        if(ls2) ls2.style.display = 'flex';
      }catch(ignore){}

      return false;
    }
  }

  function login(){
    if(loginBusy) return false;

    var idEl = document.getElementById('loginId');
    var pwEl = document.getElementById('loginPw');
    var errEl = document.getElementById('loginErr');
    if(!idEl || !pwEl || !errEl) return false;

    var id = sanitize((idEl.value || '').trim());
    var pw = pwEl.value || '';

    if(!id || !pw){
      errEl.textContent = '아이디와 비밀번호를 입력해 주세요.';
      return false;
    }

    loginBusy = true;
    errEl.textContent = '로그인 정보를 확인하는 중입니다.';

    initAccounts().then(function(){
      var found = findAccountById(id);
      if(!found){
        errEl.textContent = '존재하지 않는 아이디입니다.';
        return false;
      }

      return verifyStoredAccount(found.account, pw).then(function(ok){
        if(!ok){
          errEl.textContent = '비밀번호가 일치하지 않습니다.';
          return false;
        }

        var shown = showApp(found.key, found.account.role === 'admin');
        if(!shown){
          clearSession();
          errEl.textContent = '화면을 여는 중 오류가 발생했습니다. 새로고침 후 다시 시도해 주세요.';
          return false;
        }

        errEl.textContent = '';
        if(pwEl) pwEl.value = '';
        saveSession(found.key, found.account.role || 'user');
        return true;
      });
    }).catch(function(error){
      console.error('login error:', error);
      errEl.textContent = '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    }).then(function(){
      loginBusy = false;
    });

    return false;
  }

  function logout(){
    clearRuntimeCache();
    location.reload();
  }

  function tryAutoLogin(){
    try{
      var sess = loadSession();
      if(!sess || !sess.n) return false;

      var acc = getStoredAccounts();
      if(!acc || !acc[sess.n]){
        clearSession();
        return false;
      }

      var role = acc[sess.n].role || sess.r || 'user';
      var ok = showApp(sess.n, role === 'admin');

      if(!ok){
        clearSession();
        return false;
      }

      return true;
    }catch(e){
      console.error('tryAutoLogin error:', e);
      clearSession();
      return false;
    }
  }

  function changePw(){
    if(typeof App === 'undefined' || !App || typeof App.getUser !== 'function') return;

    var user = App.getUser();
    if(!user) return;

    var cur = prompt('현재 비밀번호:');
    if(cur === null) return;

    var np = prompt('새 비밀번호 (4자 이상):');
    if(np === null) return;
    if(!np || np.length < 4){
      toast('비밀번호는 4자 이상으로 입력해 주세요.');
      return;
    }

    var np2 = prompt('새 비밀번호 확인:');
    if(np !== np2){
      toast('새 비밀번호가 서로 다릅니다.');
      return;
    }

    verifyUserPassword(user, cur).then(function(ok){
      if(!ok){
        toast('현재 비밀번호가 일치하지 않습니다.');
        return;
      }

      var accounts = getAccounts();
      if(!accounts[user]) return;
      accounts[user].pw = np;
      return saveAccounts(accounts).then(function(){
        toast('비밀번호를 변경했습니다.');
      });
    }).catch(function(error){
      console.error('changePw error:', error);
      toast('비밀번호를 변경하지 못했습니다.');
    });
  }

  function resetAccounts(){
    initPromise = null;
    Store.remove('accounts');
    return initAccounts(true);
  }

  return {
    initAccounts: initAccounts,
    resetAccounts: resetAccounts,
    getAccounts: getAccounts,
    saveAccounts: saveAccounts,
    verifyUserPassword: verifyUserPassword,
    login: login,
    logout: logout,
    tryAutoLogin: tryAutoLogin,
    sanitize: sanitize,
    clearSession: clearSession,
    clearRuntimeCache: clearRuntimeCache,
    changePw: changePw
  };
})();
