const CACHE='trening-hero-shell-v6.0.2';
const SHELL=['./','./index.html','./style.css','./v5.css','./core.js','./foods.js','./energy.js','./profiles.js','./updates.js','./app.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./INSTRUKCJA.html'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('trening-hero-shell-')||k.startsWith('push-up-hero-shell-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==self.location.origin)return;u.hash='';const path=u.href;const known=SHELL.some(p=>new URL(p,self.registration.scope).href===path);if(!known)return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
