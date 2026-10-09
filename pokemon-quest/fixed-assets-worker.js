import {FIXED_ASSET_VERSION,FIXED_ASSETS} from './client-fixed-assets.js';
const prefix='quest-fixed:'+new URL('./',import.meta.url).pathname+':';
const cacheName=prefix+FIXED_ASSET_VERSION;
const urls=new Set(FIXED_ASSETS.map(p=>new URL(p,import.meta.url).href));
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith(prefix)&&k!==cacheName)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!urls.has(e.request.url))return;e.respondWith((async()=>{const cache=await caches.open(cacheName),hit=await cache.match(e.request);if(hit)return hit;const r=await fetch(e.request);if(r.ok)await cache.put(e.request,r.clone());return r})())});
