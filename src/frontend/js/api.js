/* api.js — piccolo client per parlare con il server. Le richieste che modificano dati
   portano l'intestazione X-Requested-With (il server la richiede: protezione CSRF). */
"use strict";
const Api = (function () {
    async function chiama(metodo, url, corpo) {
        const opz = { method: metodo, credentials: "same-origin", headers: { "X-Requested-With": "hub" } };
        if (corpo !== undefined) { opz.headers["Content-Type"] = "application/json"; opz.body = JSON.stringify(corpo); }
        let r;
        try { r = await fetch(url, opz); }
        catch (e) { const err = new Error("Il server non risponde. Controlla la connessione e riprova."); err.rete = true; throw err; }
        let dati = null;
        try { dati = await r.json(); } catch (e) { /* risposta senza corpo */ }
        if (!r.ok) {
            const err = new Error((dati && dati.error) || "Qualcosa è andato storto. Riprova.");
            err.stato = r.status; err.codice = dati && dati.codice;
            throw err;
        }
        return dati;
    }
    return {
        get: (u) => chiama("GET", u), post: (u, c) => chiama("POST", u, c || {}), put: (u, c) => chiama("PUT", u, c || {}),
        patch: (u, c) => chiama("PATCH", u, c || {}), del: (u, c) => chiama("DELETE", u, c || {})
    };
})();
