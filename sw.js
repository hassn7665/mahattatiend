const C='mahattati-v8',A=['./','index.html','manifest.json','css/style.css','js/config.js','js/core.js','js/i18n.js','js/db.js','js/views.js','js/auth.js','js/app.js','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
/* لا نخزّن أبداً طلبات قاعدة البيانات (بيانات الحسابات والأكواد)؛ فقط ملفات التطبيق والمكتبة والخطوط */
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin&&!/(^|\.)(jsdelivr\.net|googleapis\.com|gstatic\.com)$/.test(u.hostname))return;
e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))))});
