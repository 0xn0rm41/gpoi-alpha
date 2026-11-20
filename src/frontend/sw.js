/* sw.js — minimal service worker. Static files: network first, cached copy when offline.
   /api/* is NEVER cached (personal data, GDPR): offline, the API simply fails and the app shows its normal error. */
"use strict";
const CACHE = "hub-shell-v2";
const SHELL = ["/", "/index.html", "/bacheca.html", "/offline.html", "/css/fonts.css", "/css/moduli.css", "/js/api.js", "/js/auth.js", "/js/bacheca.js", "/js/moduli.js",
    "/js/calendario.js", "/js/servizi.js", "/js/i18n.js", "/js/i18n-en.js", "/icons/icon.svg"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((n) => n !== CACHE).map((n) => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
    const u = new URL(e.request.url);
    if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
    e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); } return r; })
        .catch(() => caches.match(e.request).then((m) => m || (e.request.mode === "navigate" ? caches.match("/offline.html") : Response.error()))));
});
