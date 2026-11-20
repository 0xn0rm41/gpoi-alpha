/* =====================================================================
   moduli.js — navigation shell for the modules, notification bell, follow preferences.
   Loaded after bacheca.js. Modules switched off for the school (see docs/product/MODULES.md)
   simply do not appear: no link, no page.
   Each module file (calendario.js, servizi.js) registers itself with Moduli.registra(...).
   ===================================================================== */
"use strict";
const Moduli = (function () {
    const registro = {};          // name -> { vista, titolo, icona, gruppo, render(), apri() }
    const registra = (nome, def) => { registro[nome] = def; };
    const attivi = () => Object.keys(registro).filter((n) => ME.utente.moduli && ME.utente.moduli[n]);

    const CATEGORIE_ETICHETTE = {
        eventi: "Nuovi eventi", comunicazioni: "Comunicazioni dei rappresentanti", idee: "Nuove idee", sondaggi: "Nuovi sondaggi e risultati",
        appunti: "Nuovi appunti", libri: "Nuovi libri", agenda: "Nuove voci nel calendario di classe", distributori: "Macchinette: prodotto esaurito o di nuovo disponibile"
    };

    function costruisciNav() {
        const nav = document.querySelector(".nav");
        const mod = attivi().map((n) => ({ nome: n, ...registro[n] }));
        mod.forEach((m) => { VISTE[m.vista] = m.titolo; });
        // sections
        const main = document.querySelector("main.wrap");
        mod.forEach((m) => {
            if (document.getElementById("vista-" + m.vista)) return;
            const s = document.createElement("section");
            s.id = "vista-" + m.vista; s.className = "vista " + (m.larga ? "" : "stretta"); s.hidden = true;
            main.appendChild(s);
        });
        // desktop nav: calendar as a first-class link, the rest under "Servizi"
        const principali = mod.filter((m) => m.gruppo === "principale"), servizi = mod.filter((m) => m.gruppo !== "principale");
        const bacheca = nav.querySelector('[data-vista="bacheca"]');
        principali.slice().reverse().forEach((m) => bacheca.insertAdjacentHTML("afterend", `<a href="#${m.vista}" data-vista="${m.vista}">${esc(m.titolo)}</a>`));
        if (servizi.length) nav.insertAdjacentHTML("beforeend", `<details class="menu-servizi"><summary>Servizi</summary><div class="menu-pop">${
            servizi.map((m) => `<a href="#${m.vista}" data-vista="${m.vista}">${esc(m.titolo)}</a>`).join("")}</div></details>`);
        document.addEventListener("click", (e) => { const d = document.querySelector(".menu-servizi[open]"); if (d && !d.contains(e.target)) d.open = false; else if (d && e.target.closest(".menu-pop a")) d.open = false; });

        // mobile tab bar: Home, Calendar, Ideas, Polls, More (sheet with everything else)
        const tab = document.querySelector(".tabbar");
        const voce = (v, nome, ico) => `<a href="#${v}" data-vista="${v}">${svg(ico)}${esc(nome)}</a>`.replace('<svg ', '<svg ');
        const cal = mod.find((m) => m.vista === "calendario");
        const primi = [["bacheca", "Bacheca", "bacheca"], cal ? ["calendario", "Calendario", "calendario"] : ["appunti", "Appunti", "appunti"], ["idee", "Idee", "idea"], ["sondaggi", "Sondaggi", "sondaggio"]];
        tab.innerHTML = primi.map(([v, n, i]) => `<a href="#${v}" data-vista="${v}">${iconaTab(i)}${esc(n)}</a>`).join("") +
            `<button type="button" class="tab-piu" id="tab-piu" aria-haspopup="dialog">${iconaTab("piu")}Altro</button>`;
        const gia = new Set(primi.map((p) => p[0]));
        const altri = [["appunti", "Appunti"], ["libri", "Libri"], ...mod.filter((m) => m.vista !== "calendario").map((m) => [m.vista, m.titolo]), ["profilo", "Profilo"]].filter(([v]) => !gia.has(v));
        const foglio = document.createElement("div");
        foglio.id = "foglio-piu"; foglio.className = "foglio"; foglio.hidden = true; foglio.setAttribute("role", "dialog"); foglio.setAttribute("aria-label", "Altre sezioni");
        foglio.innerHTML = `<div class="foglio-corpo">${altri.map(([v, n]) => `<a href="#${v}" data-vista="${v}">${esc(n)}</a>`).join("")}${isAdmin() ? '<a href="#admin" data-vista="admin">Admin</a>' : ""}</div>`;
        document.body.appendChild(foglio);
        $("tab-piu").addEventListener("click", () => { foglio.hidden = !foglio.hidden; });
        foglio.addEventListener("click", () => { foglio.hidden = true; });
        window.addEventListener("hashchange", () => { foglio.hidden = true; });
    }
    function iconaTab(i) {
        const P = { bacheca: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>' };
        const d = P[i] || ICONE[i];
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    }

    /* ---------------------------------------------------------------- bell */
    let notifiche = { elenco: [], non_lette: 0 };
    function montaCampana() {
        const user = document.querySelector(".user");
        user.insertAdjacentHTML("afterbegin", `<button class="campana" id="campana" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="Notifiche">${svg("campana")}<span class="campana-n" id="campana-n" hidden></span></button>`);
        const p = document.createElement("div");
        p.id = "pannello-notifiche"; p.className = "pannello-notifiche panel"; p.hidden = true; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Notifiche");
        document.body.appendChild(p);
        $("campana").addEventListener("click", async () => {
            const apri = p.hidden;
            p.hidden = !apri; $("campana").setAttribute("aria-expanded", String(apri));
            if (apri) { await leggiNotifiche(); disegnaNotifiche(); }
        });
        document.addEventListener("click", (e) => { if (!p.hidden && !p.contains(e.target) && !$("campana").contains(e.target)) { p.hidden = true; $("campana").setAttribute("aria-expanded", "false"); } });
        document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !p.hidden) { p.hidden = true; $("campana").focus(); } });
        p.addEventListener("click", async (e) => {
            const b = e.target.closest("[data-notifica]");
            if (b) {
                p.hidden = true;
                const l = b.dataset.link || "", h = l.includes("#") ? l.slice(l.indexOf("#")) : "";
                try { await Api.post("/api/notifiche/lette", { id: b.dataset.notifica }); } catch (x) { /* ignore */ }
                if (h) location.hash = h;
                leggiNotifiche();
            } else if (e.target.closest("[data-tutte]")) {
                await Api.post("/api/notifiche/lette", {}); await leggiNotifiche(); disegnaNotifiche();
            } else if (e.target.closest("[data-prefs]")) { p.hidden = true; location.hash = "#profilo"; setTimeout(() => { const el = $("h-notifiche"); if (el) el.scrollIntoView({ behavior: "smooth" }); }, 50); }
        });
        leggiNotifiche(); setInterval(() => { if (!document.hidden) leggiNotifiche(); }, 60000);
        document.addEventListener("visibilitychange", () => { if (!document.hidden) leggiNotifiche(); });
    }
    async function leggiNotifiche() {
        try { notifiche = await Api.get("/api/notifiche"); } catch (e) { return; }
        const n = $("campana-n"); n.hidden = !notifiche.non_lette; n.textContent = notifiche.non_lette > 9 ? "9+" : notifiche.non_lette;
        $("campana").setAttribute("aria-label", notifiche.non_lette ? `Notifiche (${notifiche.non_lette} da leggere)`.replace("(", "(") : "Notifiche");
        if (!$("pannello-notifiche").hidden) disegnaNotifiche();
    }
    function disegnaNotifiche() {
        $("pannello-notifiche").innerHTML = `<div class="pn-testa"><strong>Notifiche</strong><span>${notifiche.non_lette ? '<button class="btn-text" type="button" data-tutte>Segna tutte come lette</button>' : ""}</span></div>` +
            (notifiche.elenco.length ? `<ul class="pn-lista">${notifiche.elenco.map((n) => `<li><button type="button" class="pn-voce ${n.letta ? "" : "nuova"}" data-notifica="${esc(n.id)}" data-link="${esc(n.link || "")}">
                <b>${esc(n.titolo)}</b>${n.dettaglio ? `<span>${esc(n.dettaglio)}</span>` : ""}<small>${esc(tempoFa(n.creato_il))}</small></button></li>`).join("")}</ul>`
            : '<p class="pn-vuoto">Nessuna notifica. Usa il pulsante “Segui” su idee, sondaggi e sezioni per ricevere gli aggiornamenti qui.</p>') +
            '<div class="pn-piede"><button class="btn-text" type="button" data-prefs>Preferenze e-mail e cosa segui</button></div>';
    }

    /* ---------------------------------------------------------------- follow preferences (profile page) */
    let prefs = null;
    async function montaPreferenze() {
        const profilo = $("vista-profilo");
        if (!profilo || $("h-notifiche")) return;
        const box = document.createElement("section");
        box.className = "panel sezione-box"; box.setAttribute("aria-labelledby", "h-notifiche");
        box.innerHTML = `<h2 id="h-notifiche">Notifiche e cosa segui</h2>
            <p>La campanella in alto raccoglie le novità di ciò che segui. Se vuoi, le riceverai anche per e-mail: è una scelta tua, spenta di default, e ogni e-mail ha il link per disattivarla con un clic.</p>
            <form data-form="notifiche-pref" id="form-notifiche"><div class="opzioni" id="pref-freq"></div>
            <h3 class="sotto">Cosa seguire</h3><div class="opzioni" id="pref-cat"></div></form>`;
        const pericolo = profilo.querySelector(".zona-pericolo");
        pericolo ? pericolo.before(box) : profilo.appendChild(box);
        box.addEventListener("change", async (e) => {
            try {
                if (e.target.name === "freq") { await Api.put("/api/notifiche/preferenze", { frequenza: e.target.value }); avviso("Preferenza salvata."); }
                else if (e.target.dataset.cat) {
                    if (e.target.checked) await Api.put("/api/notifiche/segui", { tipo: e.target.dataset.cat }); else await Api.del("/api/notifiche/segui", { tipo: e.target.dataset.cat });
                    D.seguiti = (await Api.get("/api/dati")).seguiti; avviso("Preferenza salvata.");
                }
            } catch (err) { avviso(err.message); }
        });
        await aggiornaPreferenze();
    }
    async function aggiornaPreferenze() {
        try { prefs = await Api.get("/api/notifiche/preferenze"); } catch (e) { return; }
        const F = [["off", "Solo nella campanella, nessuna e-mail"], ["subito", "E-mail raggruppata poco dopo le novità (consigliato)"], ["giornaliera", "Una sola e-mail al giorno, alle 7:00"]];
        $("pref-freq").innerHTML = F.map(([v, t]) => `<label class="check-riga"><input type="radio" name="freq" value="${v}" ${prefs.frequenza === v ? "checked" : ""}><span>${esc(t)}</span></label>`).join("");
        const mod = ME.utente.moduli || {};
        const cats = Object.keys(CATEGORIE_ETICHETTE).filter((c) => (c !== "agenda" || mod.calendario) && (c !== "distributori" || mod.macchinette));
        const seg = new Set(prefs.seguiti.filter((s) => !s.ref).map((s) => s.tipo));
        $("pref-cat").innerHTML = cats.map((c) => `<label class="check-riga"><input type="checkbox" data-cat="${c}" ${seg.has(c) ? "checked" : ""}><span>${esc(CATEGORIE_ETICHETTE[c])}</span></label>`).join("");
    }

    /* ---------------------------------------------------------------- category follow button in page headers */
    const PAGINE_CATEGORIA = { idee: "idee", sondaggi: "sondaggi", appunti: "appunti", libri: "libri", calendario: "agenda", macchinette: "distributori" };
    function segnaPagine() {
        for (const [vista, cat] of Object.entries(PAGINE_CATEGORIA)) {
            const testa = document.querySelector(`#vista-${vista} .page-head`);
            if (!testa) continue;
            let b = testa.querySelector("[data-segui-cat]");
            if (!b) { testa.insertAdjacentHTML("beforeend", `<button class="btn-line segui-cat" type="button" data-segui-cat="${cat}" data-azione="segui-cat" data-tipo="${cat}"></button>`); b = testa.querySelector("[data-segui-cat]"); }
            const on = seguito(cat, "");
            b.setAttribute("aria-pressed", String(on));
            b.innerHTML = `${svg("campana")}<span>${on ? "Segui già: avvisami dei nuovi contenuti" : "Segui: avvisami dei nuovi contenuti"}</span>`;
        }
    }
    Object.assign(AZIONI, {
        async "segui-cat"({ tipo }) {
            if (seguito(tipo, "")) { await Api.del("/api/notifiche/segui", { tipo }); avviso("Non segui più questa sezione."); }
            else { await Api.put("/api/notifiche/segui", { tipo }); avviso("Ti avviseremo dei nuovi contenuti."); }
        }
    });

    /* ---------------------------------------------------------------- admin box: modules and how to request the bar */
    function montaModuliAdmin() {
        if (!isAdmin() || $("box-moduli")) return;
        const admin = $("vista-admin"), box = document.createElement("section");
        box.id = "box-moduli"; box.className = "panel sezione-box"; box.setAttribute("aria-labelledby", "h-moduli");
        const mod = ME.utente.moduli || {};
        const rigaStato = (n, titolo, desc) => `<li><b>${esc(titolo)}</b> <span class="badge ${mod[n] ? "esposta" : ""}">${mod[n] ? "Attivo" : "Non attivo"}</span><br><span class="count">${esc(desc)}</span></li>`;
        box.innerHTML = `<h2 id="h-moduli">Servizi della tua scuola</h2>
            <ul class="lista-moduli">${rigaStato("calendario", "Calendario", "Verifiche, compiti ed eventi, anche da importare/esportare.")}${rigaStato("macchinette", "Macchinette", "Prodotti, prezzi e disponibilità dei distributori.")}
            ${rigaStato("assemblee", "Assemblee di classe", "Richieste con le regole della scuola e decisione dei rappresentanti.")}${rigaStato("bar", "Prenotazione bar", "Solo per istituti con sala e bar (alberghieri e simili): si attiva su richiesta.")}</ul>
            <div id="richiesta-bar"></div>`;
        admin.appendChild(box);
        if (!mod.bar) {
            fetch("/api/config").then((r) => r.json()).then((c) => {
                const to = c.contatto_progetto || "";
                const sub = encodeURIComponent("Richiesta attivazione modulo bar – " + (SCUOLA ? SCUOLA.nome : ""));
                const body = encodeURIComponent("Buongiorno,\nla nostra scuola (" + (SCUOLA ? SCUOLA.nome : "") + ") dispone di una sala/bar e desidera attivare la prenotazione dei prodotti del bar.\n\nReferente scolastico (nome, ruolo, telefono):\nFasce di ritiro previste (es. intervallo 10:10):\nNumero indicativo di studenti:\n\nGrazie.");
                $("richiesta-bar").innerHTML = to
                    ? `<p>Il modulo bar si attiva dopo una richiesta della scuola per e-mail (serve una persona di riferimento nell'istituto).</p><a class="btn-line" href="mailto:${esc(to)}?subject=${sub}&body=${body}">Scrivi per richiedere il modulo bar</a>`
                    : "<p class='count'>Per richiedere il modulo bar scrivi all'indirizzo del progetto (l'operatore non ha ancora configurato il contatto).</p>";
            }).catch(() => {});
        }
    }

    /* ---------------------------------------------------------------- start */
    let avviato = false;
    function avvia() {
        avviato = true;
        // language: an explicit choice in this browser wins, otherwise the one saved on the account
        let locale = null; try { locale = localStorage.getItem("hub-lang"); } catch (e) { /* ignore */ }
        if (locale && locale !== ME.utente.lingua) Api.put("/api/me/lingua", { lingua: locale }).catch(() => {}); else I18N.daServer(ME.utente.lingua);
        costruisciNav(); montaCampana(); montaPreferenze(); montaModuliAdmin();
        document.addEventListener("lingua", () => { if (D) { renderTutto(); leggiNotifiche(); } });
        window.addEventListener("hashchange", apriVista);
        attivi().forEach((n) => registro[n].avvia && registro[n].avvia());
    }
    function apriVista() {
        const v = location.hash.slice(1);
        const m = attivi().map((n) => registro[n]).find((x) => x.vista === v);
        if (m && m.apri) m.apri();
    }
    function rendi() {
        segnaPagine();
        attivi().forEach((n) => registro[n].rendi && registro[n].rendi());
    }
    return { registra, attivi, avvia, rendi, apriVista, get avviato() { return avviato; }, aggiornaPreferenze };
})();

/* hook into bacheca.js: first render starts the shell, every render refreshes the module pages */
(function () {
    const originale = renderTutto;
    renderTutto = function () {
        if (!Moduli.avviato) { Moduli.avvia(); setTimeout(Moduli.apriVista, 0); }
        originale();
        Moduli.rendi();
    };
})();
