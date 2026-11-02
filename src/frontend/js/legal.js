/* legal.js — inserisce nelle pagine legali i dati del titolare presi dalla configurazione del server (.env). */
"use strict";
(async function () {
    try {
        const c = await Api.get("/api/config");
        const val = { titolare: c.titolare, contatto: c.contatto_privacy, versione: c.versione_informativa };
        document.querySelectorAll("[data-cfg]").forEach(function (el) { el.textContent = val[el.dataset.cfg] || ""; });
        document.querySelectorAll("[data-source-link]").forEach(function (a) { a.href = c.source_url; });
        const dpo = document.getElementById("dpo");
        if (dpo) { if (c.dpo) dpo.querySelector("span").textContent = c.dpo; else dpo.hidden = true; }
        if (/^\[/.test(c.titolare) || /^\[/.test(c.contatto_privacy)) document.getElementById("modello").hidden = false;
    } catch (e) { /* senza server le parti dinamiche restano vuote */ }
})();
