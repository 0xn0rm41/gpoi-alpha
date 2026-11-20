/* pwa.js — registers the service worker (app-like start from the home screen, offline shell). No tracking, no push. */
"use strict";
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => { /* optional feature */ }); });
}
