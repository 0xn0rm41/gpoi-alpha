/* =====================================================================
   servizi.js — service pages: vending machines, class assemblies, bar pre-orders.
   Each page registers with Moduli (moduli.js); the server decides which modules a school has (routes + /api/me).
   ===================================================================== */
"use strict";
(function () {
    const GIORNO = 86400000;
    const pad = (n) => String(n).padStart(2, "0");
    const oggiChiave = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
    const dataFloat = (ts, o) => new Date(ts).toLocaleDateString(LOC(), { timeZone: "UTC", ...o });
    const t = (s) => esc(T(s));
    const testa = (titolo, sottotitolo) => `<div class="page-head"><h1 tabindex="-1">${esc(T(titolo))}</h1><p>${esc(T(sottotitolo))}</p></div>`;
    const dettagli = (titolo, corpo) => `<details class="panel dettagli-admin"><summary>${esc(T(titolo))}</summary><div class="dettagli-corpo">${corpo}</div></details>`;
    async function esegui(fn, ok, dopo) { try { await fn(); if (ok) avviso(T(ok)); if (dopo) await dopo(); } catch (e) { if (e.stato === 401) return vaiAlLogin(); avviso(e.message); } }

    /* ================================================================ VENDING MACHINES */
    const V = { dati: null };
    const STATI_V = { disponibile: "Disponibile", pochi: "Ne restano pochi", esaurito: "Esaurito" };
    const TIPI_V = { snack: "Snack", bevande: "Bevande", caffe: "Caffè", misto: "Snack e bevande" };
    async function caricaV() { try { V.dati = await Api.get("/api/macchinette"); } catch (e) { avviso(e.message); } disegnaV(); }
    function disegnaV() {
        const el = $("vista-macchinette"); if (!el) return;
        if (!V.dati) { el.innerHTML = testa("Macchinette", "Caricamento…"); return; }
        const ds = V.dati.distributori, admin = isAdmin();
        el.innerHTML = testa("Macchinette", "Cosa c'è nei distributori della scuola, quanto costa e se è finito. Se trovi uno scaffale vuoto, segnalalo: aiuti tutti.") +
            (ds.length ? ds.map((d) => `<section class="panel sezione-box macc" aria-labelledby="d-${esc(d.id)}">
                <h2 id="d-${esc(d.id)}">${esc(d.nome)}</h2><p class="count">${esc(d.ubicazione || "")}${d.ubicazione ? " · " : ""}${t(TIPI_V[d.tipo] || d.tipo)}</p>
                ${d.prodotti.length ? `<ul class="macc-lista">${d.prodotti.map((p) => `<li class="macc-voce"><div><b>${esc(p.nome)}</b><span class="count">${esc(p.categoria || "")}</span></div>
                    <span class="macc-prezzo">${esc(euroCent(p.prezzo_cent))}</span><span class="badge st-${esc(p.stato)}">${t(STATI_V[p.stato] || p.stato)}</span>
                    <div class="macc-segna" role="group" aria-label="${t("Segnala la disponibilità di")} ${esc(p.nome)}">${Object.keys(STATI_V).map((s) => `<button type="button" class="chip" data-macc="segna" data-pid="${esc(p.id)}" data-stato="${s}" aria-pressed="${p.mia_segnalazione === s}">${t(STATI_V[s])}</button>`).join("")}</div>
                    <small class="count">${p.fonte === "studenti" ? t("Segnalato dagli studenti") : t("Aggiornato dalla scuola")} · ${esc(tempoFa(p.aggiornato_il))}</small>
                    ${admin ? `<span class="macc-admin"><button class="btn-text" type="button" data-macc="prezzo" data-pid="${esc(p.id)}" data-prezzo="${p.prezzo_cent}">${t("Prezzo")}</button><button class="btn-text" type="button" data-macc="ripristina" data-pid="${esc(p.id)}">${t("Ripristina")}</button><button class="btn-text danger" type="button" data-macc="elimina-p" data-pid="${esc(p.id)}">${t("Elimina")}</button></span>` : ""}</li>`).join("")}</ul>`
                    : `<p class="count">${t("Nessun prodotto inserito.")}</p>`}
                ${admin ? dettagli("Aggiungi un prodotto", `<form class="form-riga" data-macc-form="prodotto" data-did="${esc(d.id)}"><input name="nome" placeholder="${t("Nome")}" maxlength="80" required><input name="categoria" placeholder="${t("Categoria")}" maxlength="30"><input name="prezzo" type="number" step="0.05" min="0" max="100" placeholder="€" required><button class="btn-main" type="submit">${t("Aggiungi")}</button></form>
                    <button class="btn-text danger" type="button" data-macc="elimina-d" data-did="${esc(d.id)}">${t("Elimina questo distributore")}</button>`) : ""}</section>`).join("")
                : `<div class="panel">${vuoto(T("Nessun distributore"), T(admin ? "Aggiungi il primo distributore qui sotto." : "La scuola non ha ancora inserito i distributori."))}</div>`) +
            (admin ? dettagli("Aggiungi un distributore", `<form class="form-riga" data-macc-form="distributore"><input name="nome" placeholder="${t("Nome (es. Macchinetta atrio)")}" maxlength="60" required><input name="ubicazione" placeholder="${t("Dove si trova")}" maxlength="100"><select name="tipo">${Object.keys(TIPI_V).map((k) => `<option value="${k}">${t(TIPI_V[k])}</option>`).join("")}</select><button class="btn-main" type="submit">${t("Aggiungi")}</button></form>`) : "");
    }
    document.addEventListener("click", (e) => {
        const b = e.target.closest("[data-macc]"); if (!b) return;
        const a = b.dataset.macc, pid = b.dataset.pid, rec = () => caricaV();
        if (a === "segna") esegui(() => (b.getAttribute("aria-pressed") === "true" ? Api.del(`/api/macchinette/prodotti/${pid}/segnala`) : Api.put(`/api/macchinette/prodotti/${pid}/segnala`, { stato: b.dataset.stato })), "Grazie per la segnalazione.", rec);
        else if (a === "prezzo") { const v = prompt(T("Nuovo prezzo in euro"), (Number(b.dataset.prezzo) / 100).toFixed(2)); if (v !== null) esegui(() => Api.patch(`/api/macchinette/prodotti/${pid}`, { prezzo_cent: Math.round(parseFloat(String(v).replace(",", ".")) * 100) }), "Prezzo aggiornato.", rec); }
        else if (a === "ripristina") esegui(() => Api.patch(`/api/macchinette/prodotti/${pid}`, { stato: "disponibile" }), "Segnato come disponibile.", rec);
        else if (a === "elimina-p") { if (confirm(T("Eliminare il prodotto?"))) esegui(() => Api.del(`/api/macchinette/prodotti/${pid}`), null, rec); }
        else if (a === "elimina-d") { if (confirm(T("Eliminare il distributore e i suoi prodotti?"))) esegui(() => Api.del(`/api/macchinette/${b.dataset.did}`), null, rec); }
    });
    document.addEventListener("submit", (e) => {
        const f = e.target, k = f.dataset && f.dataset.maccForm; if (!k) return;
        e.preventDefault(); const el = f.elements, cent = Math.round(parseFloat(String(el.prezzo ? el.prezzo.value : 0).replace(",", ".")) * 100);
        if (k === "distributore") inviaForm(f, () => Api.post("/api/macchinette", { nome: el.nome.value, ubicazione: el.ubicazione.value, tipo: el.tipo.value }), T("Distributore aggiunto.")).then((ok) => ok && caricaV());
        else inviaForm(f, () => Api.post(`/api/macchinette/${f.dataset.did}/prodotti`, { nome: el.nome.value, categoria: el.categoria.value, prezzo_cent: cent }), T("Prodotto aggiunto.")).then((ok) => ok && caricaV());
    });
    Moduli.registra("macchinette", { vista: "macchinette", titolo: "Macchinette", gruppo: "servizi", apri: caricaV, rendi() { if (!V.dati) caricaV(); else disegnaV(); } });

    /* ================================================================ CLASS ASSEMBLIES */
    const A = { dati: null, reps: [] };
    const STATI_A = { inviata: "In attesa", approvata: "Approvata", rifiutata: "Rifiutata", annullata: "Annullata", svolta: "Svolta" };
    async function caricaA() {
        try { A.dati = await Api.get("/api/assemblee"); if (isAdmin()) A.reps = await Api.get("/api/assemblee/rappresentanti/elenco" + (A.q ? "?q=" + encodeURIComponent(A.q) : "")); } catch (e) { avviso(e.message); }
        disegnaA();
    }
    function cartaA(a, admin) {
        const quando = dataFloat(a.data_confermata || a.data_proposta, { weekday: "long", day: "numeric", month: "long" });
        return `<article class="panel sezione-box ass"><div class="ass-testa"><h3>${admin ? esc(a.classe) + " · " : ""}${esc(quando)}${a.ora_inizio ? ", " + esc(a.ora_inizio) : ""}</h3><span class="badge st-${esc(a.stato)}">${t(STATI_A[a.stato] || a.stato)}</span></div>
            <p class="count">${a.durata_ore} ${t(a.durata_ore === 1 ? "ora" : "ore")}${a.richiedente ? " · " + t("richiesta da") + " " + esc(a.richiedente) : ""}${a.data_confermata && a.data_confermata !== a.data_proposta ? " · " + t("data proposta:") + " " + esc(dataFloat(a.data_proposta, { day: "numeric", month: "short" })) : ""}</p>
            <p class="ass-odg">${esc(a.ordine_giorno)}</p>${a.note ? `<p class="count">${esc(a.note)}</p>` : ""}
            ${a.motivo_decisione ? `<p class="ass-motivo"><b>${t("Motivo")}:</b> ${esc(a.motivo_decisione)}</p>` : ""}
            <div class="ass-azioni">${["inviata", "approvata"].includes(a.stato) && (a.mia || admin || ME.utente.rappresentante) ? `<button class="btn-text danger" type="button" data-ass="annulla" data-id="${esc(a.id)}">${t("Annulla richiesta")}</button>` : ""}
            ${admin && a.stato === "inviata" ? `<button class="btn-main" type="button" data-ass="approva" data-id="${esc(a.id)}" data-data="${new Date(a.data_proposta).toISOString().slice(0, 10)}">${t("Approva")}</button><button class="btn-line" type="button" data-ass="rifiuta" data-id="${esc(a.id)}">${t("Rifiuta")}</button>` : ""}
            ${admin && a.stato === "approvata" ? `<button class="btn-line" type="button" data-ass="svolta" data-id="${esc(a.id)}">${t("Segna come svolta")}</button>` : ""}</div></article>`;
    }
    function disegnaA() {
        const el = $("vista-assemblee"); if (!el) return;
        if (!A.dati) { el.innerHTML = testa("Assemblee di classe", "Caricamento…"); return; }
        const d = A.dati, r = d.regole, admin = isAdmin();
        const regole = `${t("Regole della tua scuola")}: ${t("richiesta con almeno")} ${r.preavviso_giorni} ${t("giorni di anticipo")}, ${t("massimo")} ${r.max_ore} ${t("ore")}, ${r.max_al_mese} ${t("al mese per classe")}${r.solo_rappresentanti ? ", " + t("la chiede un rappresentante di classe") : ""}. ${t("Controlla sempre anche il regolamento d'istituto.")}`;
        const attive = d.richieste.filter((a) => a.stato === "inviata"), altre = d.richieste.filter((a) => a.stato !== "inviata");
        el.innerHTML = testa("Assemblee di classe", "Chiedi l'assemblea per la tua classe: la scuola riceve la richiesta e risponde qui.") +
            `<p class="panel sezione-box count">${regole}</p>` +
            (d.puoi_richiedere ? dettagli("Richiedi un'assemblea per " + d.classe, `<form class="form-colonna" data-ass-form="nuova">
                <div class="riga-3"><div class="field"><label for="as-data">${t("Data")}</label><input id="as-data" name="data" type="date" required min="${new Date(Date.now() + r.preavviso_giorni * GIORNO).toISOString().slice(0, 10)}"></div>
                <div class="field"><label for="as-ora">${t("Ora o lezione")}</label><input id="as-ora" name="ora" maxlength="20" placeholder="${t("es. 4ª ora")}"></div>
                <div class="field"><label for="as-dur">${t("Durata")}</label><select id="as-dur" name="durata">${Array.from({ length: r.max_ore }, (_, i) => `<option value="${i + 1}" ${i + 1 === r.max_ore ? "selected" : ""}>${i + 1} ${t(i ? "ore" : "ora")}</option>`).join("")}</select></div></div>
                <div class="field"><label for="as-odg">${t("Ordine del giorno")}</label><textarea id="as-odg" name="odg" rows="3" minlength="5" maxlength="1000" required placeholder="${t("Di cosa volete parlare?")}"></textarea></div>
                <div class="field"><label for="as-note">${t("Note")} <span class="count">(${t("facoltative")})</span></label><textarea id="as-note" name="note" rows="2" maxlength="500"></textarea></div>
                <button class="btn-main" type="submit">${t("Invia la richiesta")}</button></form>`)
                : (!d.classe ? `<div class="panel sezione-box">${t("Imposta la tua classe nel profilo per richiedere un'assemblea.")} <a href="#profilo">${t("Vai al profilo")}</a></div>` : r.solo_rappresentanti ? `<div class="panel sezione-box count">${t("Nella tua scuola l'assemblea la chiede un rappresentante di classe.")}</div>` : "")) +
            (attive.length ? `<h2 class="sotto">${t(admin ? "Da decidere" : "In attesa di risposta")}</h2>${attive.map((a) => cartaA(a, admin)).join("")}` : "") +
            (altre.length ? `<h2 class="sotto">${t("Storico")}</h2>${altre.map((a) => cartaA(a, admin)).join("")}` : "") +
            (!d.richieste.length ? `<div class="panel">${vuoto(T("Nessuna richiesta"), T("Qui compariranno le richieste di assemblea."))}</div>` : "") +
            (admin ? dettagli("Rappresentanti di classe", `<p class="count">${t("Segna chi sono i rappresentanti: serve se la tua scuola limita la richiesta a loro.")}</p>
                <input type="search" id="as-cerca" placeholder="${t("Cerca per nome o classe")}" value="${esc(A.q || "")}" aria-label="${t("Cerca per nome o classe")}">
                <ul class="rap-lista">${A.reps.map((u) => `<li><label class="check-riga"><input type="checkbox" data-ass-rep="${esc(u.id)}" ${u.rappresentante ? "checked" : ""}><span>${esc(u.nome)} <span class="count">${esc(u.classe || "—")}</span></span></label></li>`).join("")}</ul>`) : "");
    }
    document.addEventListener("click", (e) => {
        const b = e.target.closest("[data-ass]"); if (!b) return;
        const id = b.dataset.id, rec = () => caricaA(), a = b.dataset.ass;
        if (a === "annulla") { if (confirm(T("Annullare la richiesta?"))) esegui(() => Api.post(`/api/assemblee/${id}/annulla`), "Richiesta annullata.", rec); }
        else if (a === "approva") { const d = prompt(T("Data confermata (AAAA-MM-GG). Lascia così per confermare quella richiesta."), b.dataset.data); if (d) esegui(() => Api.post(`/api/assemblee/${id}/decidi`, { stato: "approvata", data_confermata: d }), "Approvata: la classe è stata avvisata.", rec); }
        else if (a === "rifiuta") { const m = prompt(T("Motivo del rifiuto (la classe lo leggerà)")); if (m) esegui(() => Api.post(`/api/assemblee/${id}/decidi`, { stato: "rifiutata", motivo: m }), "Rifiutata: la classe è stata avvisata.", rec); }
        else if (a === "svolta") esegui(() => Api.post(`/api/assemblee/${id}/svolta`), null, rec);
    });
    document.addEventListener("change", (e) => {
        const c = e.target.closest("[data-ass-rep]"); if (!c) return;
        esegui(() => Api.put(`/api/assemblee/rappresentanti/${c.dataset.assRep}`, { valore: c.checked }), "Salvato.");
    });
    let timerRep = null;
    document.addEventListener("input", (e) => { if (e.target.id === "as-cerca") { A.q = e.target.value; clearTimeout(timerRep); timerRep = setTimeout(async () => { const pos = e.target.selectionStart; await caricaA(); const n = $("as-cerca"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 350); } });
    document.addEventListener("submit", (e) => {
        const f = e.target; if (!f.dataset || f.dataset.assForm !== "nuova") return;
        e.preventDefault(); const el = f.elements;
        inviaForm(f, () => Api.post("/api/assemblee", { data: el.data.value, ora_inizio: el.ora.value, durata_ore: Number(el.durata.value), ordine_giorno: el.odg.value, note: el.note.value }), T("Richiesta inviata: la scuola risponderà qui.")).then((ok) => ok && caricaA());
    });
    Moduli.registra("assemblee", { vista: "assemblee", titolo: "Assemblee", gruppo: "servizi", apri: caricaA, rendi() { if (!A.dati) caricaA(); else disegnaA(); } });

    /* ================================================================ BAR PRE-ORDERS (only schools with the module enabled) */
    const B = { dati: null, coda: null, carrello: {}, giorno: null };
    const STATI_B = { richiesto: "Richiesto", in_preparazione: "In preparazione", pronto: "Pronto: vieni a ritirarlo", ritirato: "Ritirato", annullato: "Annullato" };
    const PROSSIMO = { richiesto: "in_preparazione", in_preparazione: "pronto", pronto: "ritirato" };
    async function caricaB() {
        try { B.dati = await Api.get("/api/bar"); if (!B.giorno) B.giorno = B.dati.oggi; if (isAdmin()) B.coda = await Api.get("/api/bar/coda?giorno=" + B.giorno); } catch (e) { avviso(e.message); }
        disegnaB();
    }
    const totaleCarrello = () => (B.dati ? B.dati.prodotti.reduce((s, p) => s + (B.carrello[p.id] || 0) * p.prezzo_cent, 0) : 0);
    function righeOrdine(o) { return o.righe.map((r) => `${r.qta}× ${esc(r.nome)}`).join(", "); }
    function disegnaB() {
        const el = $("vista-bar"); if (!el) return;
        if (!B.dati) { el.innerHTML = testa("Bar", "Caricamento…"); return; }
        const d = B.dati, admin = isAdmin(), q = B.carrello;
        const cats = [...new Set(d.prodotti.map((p) => p.categoria || ""))];
        el.innerHTML = testa("Prenota al bar", "Scegli cosa vuoi e a che ora ritirarlo: lo troverai pronto. Si paga al bar, al ritiro.") +
            (d.mie.length ? `<section class="panel sezione-box" aria-labelledby="b-mie"><h2 id="b-mie">${t("I tuoi ordini")}</h2><ul class="bar-ordini">${d.mie.map((o) => `<li class="bar-ordine st-${esc(o.stato)}"><div><b class="bar-codice">${esc(o.codice)}</b> <span class="badge">${t(STATI_B[o.stato])}</span></div>
                <div class="count">${esc(dataFloat(Date.parse(o.giorno + "T00:00:00Z"), { weekday: "short", day: "numeric", month: "short" }))} · ${esc(o.fascia)} (${esc(o.ora)}) · ${esc(euroCent(o.totale_cent))}</div><div>${righeOrdine(o)}</div>
                ${o.stato === "richiesto" ? `<button class="btn-text danger" type="button" data-bar="annulla" data-id="${esc(o.id)}">${t("Annulla")}</button>` : ""}</li>`).join("")}</ul></section>` : "") +
            `<section class="panel sezione-box" aria-labelledby="b-menu"><h2 id="b-menu">${t("Menù")}</h2>${d.prodotti.length ? cats.map((c) => `<h3 class="sotto">${esc(c || T("Altro"))}</h3><ul class="bar-menu">${d.prodotti.filter((p) => (p.categoria || "") === c).map((p) => `<li class="bar-voce ${p.disponibile ? "" : "non-disp"}"><div><b>${esc(p.nome)}</b> <span class="count">${esc(p.descrizione || "")}</span>${p.allergeni ? `<small class="count"> · ${t("Allergeni")}: ${esc(p.allergeni)}</small>` : ""}</div><span class="macc-prezzo">${esc(euroCent(p.prezzo_cent))}</span>
                ${p.disponibile ? `<div class="qta"><button class="btn-line" type="button" data-bar="meno" data-pid="${esc(p.id)}" aria-label="${t("Meno")} ${esc(p.nome)}">−</button><output aria-live="polite">${q[p.id] || 0}</output><button class="btn-line" type="button" data-bar="piu" data-pid="${esc(p.id)}" aria-label="${t("Più")} ${esc(p.nome)}">+</button></div>` : `<span class="badge">${t("Non disponibile")}</span>`}
                ${admin ? `<span class="macc-admin"><button class="btn-text" type="button" data-bar="disp" data-pid="${esc(p.id)}" data-v="${p.disponibile ? 0 : 1}">${t(p.disponibile ? "Segna non disponibile" : "Segna disponibile")}</button><button class="btn-text danger" type="button" data-bar="elimina-p" data-pid="${esc(p.id)}">${t("Elimina")}</button></span>` : ""}</li>`).join("")}</ul>`).join("") : vuoto(T("Menù non ancora pronto"), T("Il bar non ha ancora inserito i prodotti."))}</section>` +
            (d.prodotti.length && d.fasce.length ? `<form class="panel sezione-box form-colonna" data-bar-form="ordine"><h2>${t("Ritiro")}</h2><div class="riga-2">
                <div class="field"><label for="bo-giorno">${t("Giorno")}</label><input id="bo-giorno" name="giorno" type="date" required value="${esc(B.giornoOrdine || d.oggi)}" min="${esc(d.oggi)}" max="${new Date(Date.now() + 7 * GIORNO).toISOString().slice(0, 10)}"></div>
                <div class="field"><label for="bo-fascia">${t("Fascia di ritiro")}</label><select id="bo-fascia" name="fascia">${d.fasce.map((f) => `<option value="${esc(f.id)}">${esc(f.etichetta)} (${esc(f.ora)})</option>`).join("")}</select></div></div>
                <div class="field"><label for="bo-nota">${t("Nota")} <span class="count">(${t("facoltativa")} · ${t("non scrivere dati sulla salute")})</span></label><input id="bo-nota" name="nota" maxlength="200"></div>
                <p class="bar-totale"><b>${t("Totale")}: ${esc(euroCent(totaleCarrello()))}</b> <span class="count">${t("da pagare al ritiro")}</span></p>
                <button class="btn-main" type="submit" ${totaleCarrello() ? "" : "disabled"}>${t("Prenota")}</button></form>` : "") +
            (admin ? `<section class="panel sezione-box" aria-labelledby="b-coda"><h2 id="b-coda">${t("Ordini da preparare")}</h2>
                <div class="field"><label for="bc-giorno">${t("Giorno")}</label><input id="bc-giorno" type="date" value="${esc(B.giorno)}"></div>
                ${B.coda && B.coda.ordini.length ? `<ul class="bar-ordini">${B.coda.ordini.map((o) => `<li class="bar-ordine st-${esc(o.stato)}"><div><b class="bar-codice">${esc(o.codice)}</b> · ${esc(o.ora)} · ${esc(o.utente)} ${o.classe ? `<span class="count">${esc(o.classe)}</span>` : ""} <span class="badge">${t(STATI_B[o.stato])}</span></div><div>${righeOrdine(o)} — <b>${esc(euroCent(o.totale_cent))}</b></div>${o.nota ? `<div class="count">${esc(o.nota)}</div>` : ""}
                    <div class="ass-azioni">${PROSSIMO[o.stato] ? `<button class="btn-main" type="button" data-bar="stato" data-id="${esc(o.id)}" data-s="${PROSSIMO[o.stato]}">${t(STATI_B[PROSSIMO[o.stato]].split(":")[0])}</button>` : ""}${["richiesto", "in_preparazione", "pronto"].includes(o.stato) ? `<button class="btn-text danger" type="button" data-bar="stato" data-id="${esc(o.id)}" data-s="annullato">${t("Annulla")}</button>` : ""}</div></li>`).join("")}</ul>` : `<p class="count">${t("Nessun ordine per questo giorno.")}</p>`}</section>` +
                dettagli("Gestisci menù e fasce", `<form class="form-riga" data-bar-form="prodotto"><input name="nome" placeholder="${t("Prodotto")}" maxlength="80" required><input name="categoria" placeholder="${t("Categoria")}" maxlength="30"><input name="prezzo" type="number" step="0.05" min="0" max="100" placeholder="€" required><input name="allergeni" placeholder="${t("Allergeni")}" maxlength="200"><button class="btn-main" type="submit">${t("Aggiungi prodotto")}</button></form>
                    <h3 class="sotto">${t("Fasce di ritiro")}</h3><ul class="bar-fasce">${d.fasce.map((f) => `<li>${esc(f.etichetta)} · ${esc(f.ora)} · ${t("chiude")} ${f.cutoff_min} min ${t("prima")} <button class="btn-text danger" type="button" data-bar="elimina-f" data-id="${esc(f.id)}">${t("Elimina")}</button></li>`).join("")}</ul>
                    <form class="form-riga" data-bar-form="fascia"><input name="etichetta" placeholder="${t("Es. Intervallo")}" maxlength="40" required><input name="ora" type="time" required><input name="cutoff" type="number" min="0" max="600" value="60" aria-label="${t("Minuti di anticipo")}"><button class="btn-main" type="submit">${t("Aggiungi fascia")}</button></form>`) : "");
    }
    document.addEventListener("click", (e) => {
        const b = e.target.closest("[data-bar]"); if (!b) return;
        const a = b.dataset.bar, pid = b.dataset.pid, id = b.dataset.id, rec = () => caricaB();
        if (a === "piu") { B.carrello[pid] = Math.min(10, (B.carrello[pid] || 0) + 1); disegnaB(); }
        else if (a === "meno") { B.carrello[pid] = Math.max(0, (B.carrello[pid] || 0) - 1); disegnaB(); }
        else if (a === "annulla") esegui(() => Api.del("/api/bar/ordini/" + id), "Ordine annullato.", rec);
        else if (a === "stato") esegui(() => Api.patch("/api/bar/ordini/" + id, { stato: b.dataset.s }), null, rec);
        else if (a === "disp") esegui(() => Api.patch("/api/bar/prodotti/" + pid, { disponibile: b.dataset.v === "1" }), null, rec);
        else if (a === "elimina-p") { if (confirm(T("Eliminare il prodotto?"))) esegui(() => Api.del("/api/bar/prodotti/" + pid), null, rec); }
        else if (a === "elimina-f") { if (confirm(T("Eliminare la fascia?"))) esegui(() => Api.del("/api/bar/fasce/" + id), null, rec); }
    });
    document.addEventListener("change", (e) => {
        if (e.target.id === "bc-giorno" && e.target.value) { B.giorno = e.target.value; caricaB(); }
        if (e.target.id === "bo-giorno") B.giornoOrdine = e.target.value;
    });
    document.addEventListener("submit", (e) => {
        const f = e.target, k = f.dataset && f.dataset.barForm; if (!k) return;
        e.preventDefault(); const el = f.elements;
        if (k === "ordine") {
            const righe = Object.entries(B.carrello).filter(([, n]) => n > 0).map(([prodotto_id, qta]) => ({ prodotto_id, qta }));
            inviaForm(f, () => Api.post("/api/bar/ordini", { giorno: el.giorno.value, fascia_id: el.fascia.value, nota: el.nota.value, righe }), T("Prenotato! Mostra il codice al bar.")).then((ok) => { if (ok) { B.carrello = {}; caricaB(); } });
        } else if (k === "prodotto") inviaForm(f, () => Api.post("/api/bar/prodotti", { nome: el.nome.value, categoria: el.categoria.value, allergeni: el.allergeni.value, prezzo_cent: Math.round(parseFloat(String(el.prezzo.value).replace(",", ".")) * 100) }), T("Prodotto aggiunto.")).then((ok) => ok && caricaB());
        else if (k === "fascia") inviaForm(f, () => Api.post("/api/bar/fasce", { etichetta: el.etichetta.value, ora: el.ora.value, cutoff_min: Number(el.cutoff.value) }), T("Fascia aggiunta.")).then((ok) => ok && caricaB());
    });
    Moduli.registra("bar", { vista: "bar", titolo: "Bar", gruppo: "servizi", apri: caricaB, rendi() { if (!B.dati) caricaB(); else disegnaB(); } });
    document.addEventListener("lingua", () => { disegnaV(); disegnaA(); disegnaB(); });
})();
