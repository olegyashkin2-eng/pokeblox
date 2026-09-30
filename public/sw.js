const CACHE='pokeblox-0.7.0';
const FILES=['/','/index.html','/style.css','/responsive.css','/game.mjs','/world.mjs','/quest-models.mjs','/quest-faces.mjs','/evolution-scene.mjs','/data.mjs','/stats.mjs','/battle.mjs','/save-format.mjs','/saving.mjs','/accounts.mjs','/install.mjs','/manifest.webmanifest','/icon-192.png','/icon-512.png','/vendor/three.module.min.js','/vendor/utils/BufferGeometryUtils.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
// Do not activate a new game version over an in-progress battle.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pokeblox-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname==='/healthz')return;if(!FILES.includes(url.pathname))return;
 event.respondWith((async()=>{try{const response=await fetch(event.request);if(response.ok){const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());}return response;}catch{const cached=await caches.match(event.request);return cached||new Response('Для загрузки игры нужен интернет',{status:503});}})());});
