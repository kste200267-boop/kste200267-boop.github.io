// sw.js — Service Worker (PWA 오프라인 캐싱)
var CACHE_NAME='gbgigo-portal-v3';

// 캐싱할 핵심 파일 목록
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
  './manifest.json'
];

// 설치: 핵심 파일 캐싱
self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(CORE_FILES);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

// 활성화: 오래된 캐시 제거
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

// fetch: 캐시 우선, 실패 시 네트워크
self.addEventListener('fetch',function(e){
  var url=e.request.url;

  // Google Fonts, Firebase, NEIS API, 구글 시트 → 항상 네트워크 (캐시 안 함)
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

  // 그 외: 캐시 우선, 없으면 네트워크 후 캐시 업데이트
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        // 정상 응답이면 캐시에 저장
        if(response&&response.status===200&&response.type==='basic'){
          var cloned=response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request,cloned);
          });
        }
        return response;
      }).catch(function(){
        // 오프라인 + 캐시 없음: index.html 반환 (SPA 폴백)
        return caches.match('./index.html');
      });
    })
  );
});
