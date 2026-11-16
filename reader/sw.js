const CACHE = 'mindful-heart-reader-50b79187dca1';
const FILES = ['./','./index.html','./reader.css','./reader.mjs','./model.mjs','./catalog.mjs','./icon.svg','./icon-180.png','./icon-192.png','./icon-512.png','./manifest.webmanifest'];
const allowed = new Set(FILES.map(file=>new URL(file,self.registration.scope).href));
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('mindful-heart-reader-')&&key!==CACHE).map(key=>caches.delete(key)))));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||!allowed.has(event.request.url))return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(event.request);
    if(cached)return cached;
    return fetch(event.request);
  }));
});
