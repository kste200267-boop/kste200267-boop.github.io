// sw.js — 캐시 완전 비활성화 (기존 캐시 전부 삭제)
// 새로고침 시 항상 최신 파일을 서버에서 직접 로드

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){return caches.delete(k);}));
    }).then(function(){return self.skipWaiting();})
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){return caches.delete(k);}));
    }).then(function(){return self.clients.claim();})
  );
});

// 캐시 없이 네트워크 직접 요청
self.addEventListener('fetch',function(e){
  e.respondWith(
    fetch(e.request).catch(function(){
      return new Response('네트워크 오류',{status:503});
    })
  );
});
