/* SR Atlas: app assets only; Firebase, photos, GPS, search and map requests are never cached here. */
'use strict';
const CACHE = 'sr-atlas-shell-v1';
const ROOT = new URL('./', self.registration.scope);
const ASSETS = ['manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png'].map(path => new URL(path, ROOT).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('sr-atlas-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== ROOT.origin) return;
  if (event.request.mode === 'navigate') {
    // Never reuse an old HTML login screen or any private database content.
    event.respondWith(fetch(event.request).catch(() => new Response('<!doctype html><html lang="bn"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SR Atlas</title><body style="font-family:system-ui;background:#f3f7f6;color:#15333e;text-align:center;padding:50px 20px"><h1>SR Atlas</h1><p>ইন্টারনেট সংযোগ চালু করে আবার চেষ্টা করুন।</p><button onclick="location.reload()" style="padding:12px 20px;border:0;border-radius:12px;background:#087f72;color:white">আবার চেষ্টা করুন</button></body></html>', {status:503,headers:{'Content-Type':'text/html; charset=utf-8'}})));
    return;
  }
  if (!ASSETS.includes(url.href)) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const saved = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, saved)));
    }
    return response;
  }).catch(() => caches.match(event.request).then(saved => saved || Response.error())));
});
