// sw.js — Service Worker (PWA 오프라인 캐싱)
var CACHE_NAME='gbgigo-portal-v4';

var CORE_FILES=[
  './',
  './index.html',
  './css/style.css',
  './js/store.js',
  './js/toast.js',
  './js/auth.js',
  './js/engine.js',
  './js/neis.js',
  './js/router.js',
  './data/constants.js',
  './data/sheet-loader.js',
  './data/classes.js',
  './pages/home.js',
  './pages/my-timetable.js',
  './pages/all-timetable.js',
  './pages/swap.js',
  './pages/history.js',
  './pages/weekly.js',
  './pages/meal.js',
  './pages/schedule.js',
  './pages/tasks.js',
  './pages/admin.js',
  './pages/profile.js',
  './pages/roster.js',
  './manifest.json'
];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(CORE_FILES);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){return k!==CACHE_NAME})
            .map(function(k){return caches.delete(k)})
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch',function(e){
  var url=e.request.url;
  if(url.indexOf('fonts.googleapis.com')>=0||
     url.indexOf('googleapis.com')>=0||
     url.indexOf('firestore')>=0||
     url.indexOf('firebase')>=0||
     url.indexOf('gstatic.com')>=0||
     url.indexOf('open.neis.go.kr')>=0||
     url.indexOf('accounts.google.com')>=0){
    e.respondWith(
      fetch(e.request).catch(function(){
        return new Response('',{status:503});
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        if(response&&response.status===200&&response.type==='basic'){
          var cloned=response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request,cloned);
          });
        }
        return response;
      }).catch(function(){
        return caches.match('./index.html');
      });
    })
  );
});
