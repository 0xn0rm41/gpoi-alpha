/* =====================================================================
   bacheca.js — logica del portale (bacheca.html).
   I dati vivono sul server (database SQLite): qui si leggono con Api.get("/api/dati")
   e si modificano con le chiamate in AZIONI e FORM. Dopo ogni modifica si
   ricaricano i dati e si ridisegna la pagina.
   ===================================================================== */
"use strict";

/* ---------------------------------------------------------------------
   1. IMPOSTAZIONI DELL'INTERFACCIA (le regole di business — soglia idee,
      commissione, max opzioni — arrivano dal server: vedi `npm run admin -- set`)
   --------------------------------------------------------------------- */
// Materie con il loro colore (usato per i libri e gli appunti)
const MATERIE = { Matematica: "#2F6FD0", Italiano: "#B4453C", Inglese: "#8A4FA8", Scienze: "#257A4B",
                  Storia: "#9A5F0B", Informatica: "#0B3B45", Altro: "#5B6B70" };
const CATEGORIE_EVENTI = ["Tutti", "Scuola", "Sport", "Studio", "Cultura"];
const CLASSI = ["1ª", "2ª", "3ª", "4ª", "5ª"];
const CONDIZIONI = ["Come nuovo", "Buono", "Usato"];
const VISTE = { bacheca: "Bacheca", idee: "Idee", appunti: "Appunti", sondaggi: "Sondaggi", libri: "Libri", profilo: "Profilo", admin: "Admin" };
const GIORNO = 86400000;

/* ---------------------------------------------------------------------
   2. FUNZIONI DI UTILITÀ
   --------------------------------------------------------------------- */
const $ = (id) => document.getElementById(id);

// Rende sicuro un testo da inserire nell'HTML (impedisce che un utente scriva codice nei suoi post).
// VA USATO SEMPRE con i testi scritti dagli utenti.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const cssEsc = (s) => (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/["\\]/g, "\\$&");
const euro = (n) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
const euroCent = (c) => euro(c / 100);

// "3 ore fa", "2 giorni fa"…
function tempoFa(ts) {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return "adesso";
    if (m < 60) return m + " min fa";
    const h = Math.round(m / 60);
    if (h < 24) return h + (h === 1 ? " ora fa" : " ore fa");
    const g = Math.round(h / 24);
    return g + (g === 1 ? " giorno fa" : " giorni fa");
}

// Piccolo messaggio che compare in basso per un paio di secondi
let toastTimer;
function avviso(testo) {
    const t = $("toast");
    t.textContent = testo;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}

// Icone (path SVG) e funzione che le trasforma in tag <svg>
const ICONE = {
    su: '<path d="m6 15 6-6 6 6"/>', giu: '<path d="m6 9 6 6 6-6"/>',
    commento: '<path d="M4 5h16v11H9l-5 4z"/>', cestino: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    bandiera: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    idea: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/>',
    sondaggio: '<path d="M5 20V10M12 20V4M19 20v-7"/>', appunti: '<path d="M5 4h10l4 4v12H5z"/><path d="M9 12h6M9 16h6"/>',
    libro: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>'
};
const svg = (nome) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONE[nome]}</svg>`;
const vuoto = (titolo, testo) => `<div class="empty"><strong>${esc(titolo)}</strong>${esc(testo)}</div>`;

/* ---------------------------------------------------------------------
   3. STATO: utente collegato e dati scaricati dal server
   --------------------------------------------------------------------- */
let ME = null;                       // { utente: {...}, statistiche: {...} }
let D = null;                        // tutto ciò che arriva da /api/dati
let SEGNALAZIONI = [];               // solo per gli admin
let SCUOLA = null;                   // info della community (codice solo per gli admin)

const isAdmin = () => !!(ME && ME.utente.admin);
const CFG = () => (D && D.config) || { soglia_idee: 30, commissione_percentuale: 0, max_opzioni_sondaggio: 5 };

function vaiAlLogin() { location.replace("index.html"); }

async function carica() {
    const [dati, me] = await Promise.all([Api.get("/api/dati"), Api.get("/api/me")]);
    D = dati; ME = me;
    SEGNALAZIONI = isAdmin() ? await Api.get("/api/segnalazioni") : [];
    SCUOLA = await Api.get("/api/scuola");
    Api.get("/api/config").then((c) => document.querySelectorAll("[data-source-link]").forEach((a) => { a.href = c.source_url; })).catch(() => {});
}

// Stato temporaneo dell'interfaccia (non viene salvato)
const FILTRI = { eventi: "Tutti", appunti: "Tutte", libri: "Tutti" };
const RICERCHE = { eventi: "", libri: "" };
let ordineAppunti = "recenti";
const sondaggiInModifica = new Set();
const commentiAperti = new Set();

const puoiEliminare = (item) => isAdmin() || item.mio;
const btnElimina = (coll, item) => puoiEliminare(item)
    ? `<button class="btn-text danger" type="button" data-azione="elimina" data-coll="${coll}" data-id="${esc(item.id)}">${svg("cestino")}Elimina</button>` : "";
const btnSegnala = (tipo, item) => item.mio ? ""
    : `<button class="btn-text" type="button" data-azione="segnala" data-tipo="${tipo}" data-id="${esc(item.id)}" aria-label="Segnala questo contenuto">${svg("bandiera")}Segnala</button>`;

/* ---------------------------------------------------------------------
   4. COMMISSIONE SUI LIBRI (solo un calcolo mostrato: nessun denaro passa dalla piattaforma)
   --------------------------------------------------------------------- */
const commissioneCent = (cent) => Math.round(cent * CFG().commissione_percentuale / 100);
const nettoCent = (cent) => cent - commissioneCent(cent);

/* ---------------------------------------------------------------------
   5. DISEGNO DELLE SEZIONI
   Ogni render...() costruisce l'HTML di una lista partendo da D.
   I pulsanti hanno data-azione="nome": vedi la sezione 7.
   --------------------------------------------------------------------- */
const inizioOggi = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

function quando(ts) {
    const g = Math.round((new Date(ts).setHours(0, 0, 0, 0) - inizioOggi()) / GIORNO);
    if (g <= 0) return "Oggi";
    if (g === 1) return "Domani";
    if (g < 7) return "Tra " + g + " giorni";
    return new Date(ts).toLocaleDateString("it-IT", { weekday: "long" });
}
const oraDi = (ts) => new Date(ts).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

// Pulsanti-filtro (chips): elenco = voci, gruppo = chiave in FILTRI
function disegnaChips(idContenitore, gruppo, elenco) {
    $(idContenitore).innerHTML = elenco.map((v) =>
        `<button class="chip" type="button" data-azione="filtro" data-gruppo="${gruppo}" data-valore="${esc(v)}" aria-pressed="${FILTRI[gruppo] === v}">${esc(v)}</button>`).join("");
}

/* ---- Bacheca ---- */
function renderBacheca() {
    const e = D.eventi[0];
    if (e) {
        $("prossimo").innerHTML = `<div class="label">Il prossimo evento</div><h2>${esc(e.titolo)}</h2>
            <p class="meta">${esc(quando(e.inizio))}, ore ${esc(oraDi(e.inizio))}${e.luogo ? " – " + esc(e.luogo) : ""}</p>
            <button class="btn-amber" type="button" data-azione="partecipa" data-id="${esc(e.id)}" aria-pressed="${e.partecipo}">${e.partecipo ? "Partecipi" : "Partecipo"}</button>`;
    } else { $("prossimo").innerHTML = "<p>Nessun evento in programma.</p>"; }

    const tiles = [
        { href: "#idee", n: D.idee.filter((i) => i.stato !== "esposta").length, t: "idee in votazione", ico: "idea" },
        { href: "#sondaggi", n: D.sondaggi.length, t: "sondaggi", ico: "sondaggio" },
        { href: "#appunti", n: D.appunti.length, t: "appunti condivisi", ico: "appunti" },
        { href: "#libri", n: D.libri.filter((l) => l.stato === "disponibile").length, t: "libri disponibili", ico: "libro" }
    ];
    $("tiles").innerHTML = tiles.map((t) => `<a class="tile" href="${t.href}"><span class="tile-ico">${svg(t.ico)}</span><div><b>${t.n}</b><span>${t.t}</span></div></a>`).join("");

    disegnaChips("chips-eventi", "eventi", CATEGORIE_EVENTI);
    const q = RICERCHE.eventi.trim().toLowerCase();
    const lista = D.eventi.filter((ev) =>
        (FILTRI.eventi === "Tutti" || ev.categoria === FILTRI.eventi) &&
        (!q || (ev.titolo + " " + ev.luogo + " " + ev.descrizione).toLowerCase().includes(q)));
    $("lista-eventi").innerHTML = lista.length ? lista.map(htmlEvento).join("")
        : vuoto("Nessun evento trovato", "Prova un'altra categoria o cambia le parole di ricerca.");

    // Comunicazioni dei rappresentanti
    $("lista-comunicazioni").innerHTML = D.comunicazioni.length ? D.comunicazioni.map((c) =>
        `<div class="notice"><strong>${esc(c.titolo)}</strong>${c.testo ? `<p>${esc(c.testo)}</p>` : ""}<small>Pubblicato ${tempoFa(c.creato_il)}</small>
         ${isAdmin() ? `<div class="azioni">${btnElimina("comunicazioni", { id: c.id, mio: true })}</div>` : ""}</div>`).join("")
        : "<p class='count'>Nessuna comunicazione.</p>";

    const top = D.idee.filter((i) => i.stato !== "esposta").slice(0, 3);
    const soglia = CFG().soglia_idee;
    $("side-idee").innerHTML = top.length ? top.map((i) =>
        `<div class="mini"><strong>${esc(i.titolo)}</strong><div class="progress ${i.voti >= soglia ? "done" : ""}"><i style="width:${Math.min(100, Math.round(i.voti / soglia * 100))}%"></i></div>
         <span class="count">${i.voti} di ${soglia} sostegni</span></div>`).join("") + `<a class="btn-line" href="#idee" style="margin-top:.75rem">Vedi tutte le idee</a>`
        : "<p class='count'>Nessuna idea in votazione.</p>";
    const s = D.sondaggi[0];
    $("side-sondaggio").innerHTML = s
        ? `<p style="margin:0 0 .25rem;font-weight:500">${esc(s.domanda)}</p><p class="count" style="margin:0 0 .75rem">${s.opzioni.reduce((t, o) => t + o.voti, 0)} voti</p><a class="btn-line" href="#sondaggi">Vai ai sondaggi</a>`
        : "<p class='count'>Nessun sondaggio.</p>";
}

function htmlEvento(e) {
    const d = new Date(e.inizio);
    const mese = d.toLocaleDateString("it-IT", { month: "short" }).replace(".", "");
    return `<article class="event">
        <div class="date" aria-hidden="true"><b>${d.getDate()}</b><span>${esc(mese)}</span></div>
        <div>
            <h3>${esc(e.titolo)}</h3>
            <p class="meta"><span class="when">${esc(quando(e.inizio))}, ore ${esc(oraDi(e.inizio))}</span>${e.luogo ? `<span>${esc(e.luogo)}</span>` : ""}<span class="tag" data-cat="${esc(e.categoria)}">${esc(e.categoria)}</span></p>
            ${e.descrizione ? `<p class="desc">${esc(e.descrizione)}</p>` : ""}
        </div>
        <div class="action">
            <button class="btn-line" type="button" data-azione="partecipa" data-id="${esc(e.id)}" aria-pressed="${e.partecipo}">${e.partecipo ? "Partecipi" : "Partecipo"}</button>
            <span class="count">${e.partecipanti} partecipanti</span>
            ${isAdmin() ? btnElimina("eventi", { id: e.id, mio: true }) : ""}
        </div>
    </article>`;
}

/* ---- Idee ---- */
function renderIdee() {
    const soglia = CFG().soglia_idee;
    $("lista-idee").innerHTML = D.idee.length ? D.idee.map((i) => {
        const pronta = i.voti >= soglia;
        const perc = Math.min(100, Math.round(i.voti / soglia * 100));
        const badge = i.stato === "esposta" ? '<span class="badge esposta">Portata in assemblea</span>'
                    : pronta ? '<span class="badge pronta">Pronta per l\'assemblea</span>' : '<span class="badge">In votazione</span>';
        const esponi = isAdmin() && pronta && i.stato !== "esposta"
            ? `<button class="btn-line" type="button" data-azione="segna-esposta" data-id="${esc(i.id)}">Segna come portata in assemblea</button>` : "";
        return `<article class="idea">
            <button class="sostieni" type="button" data-azione="sostieni-idea" data-id="${esc(i.id)}" aria-pressed="${i.io_voto}" aria-label="${i.io_voto ? "Togli il sostegno a" : "Sostieni"} ${esc(i.titolo)}">${svg("su")}<b>${i.voti}</b></button>
            <div>
                <h3>${esc(i.titolo)}</h3>
                <p class="meta"><span>Di ${esc(i.autore)}, ${tempoFa(i.creato_il)}</span>${badge}</p>
                ${i.descrizione ? `<p class="desc">${esc(i.descrizione)}</p>` : ""}
                <div class="progress ${pronta ? "done" : ""}" role="img" aria-label="${perc}% della soglia"><i style="width:${perc}%"></i></div>
                <span class="count">${i.voti} di ${soglia} sostegni</span>
                <div class="azioni">${esponi}${btnSegnala("idea", i)}${btnElimina("idee", i)}</div>
            </div>
        </article>`;
    }).join("") : vuoto("Nessuna idea, per ora", "Sii il primo a proporne una!");
}

/* ---- Sondaggi ---- */
function renderSondaggi() {
    $("lista-sondaggi").innerHTML = D.sondaggi.length ? D.sondaggi.map((p) => {
        const totale = p.opzioni.reduce((t, o) => t + o.voti, 0);
        let corpo;
        if (!p.mio_voto || sondaggiInModifica.has(p.id)) {
            corpo = `<div role="radiogroup" aria-label="Opzioni">${p.opzioni.map((o) =>
                `<label class="opt"><input type="radio" name="voto-${esc(p.id)}" value="${esc(o.id)}" ${p.mio_voto === o.id ? "checked" : ""}><span>${esc(o.testo)}</span></label>`).join("")}</div>
                <button class="btn-main" type="button" data-azione="vota-sondaggio" data-id="${esc(p.id)}">Vota</button>`;
        } else {
            corpo = p.opzioni.map((o) => {
                const perc = totale ? Math.round(o.voti / totale * 100) : 0;
                const mio = o.id === p.mio_voto;
                return `<div class="result"><div class="result-top"><span class="${mio ? "mine" : ""}">${esc(o.testo)}${mio ? " (il tuo voto)" : ""}</span><span>${perc}%</span></div>
                        <div class="bar" role="img" aria-label="${perc}%"><i class="${mio ? "mine" : ""}" style="width:${perc}%"></i></div></div>`;
            }).join("") + `<button class="btn-text" type="button" data-azione="cambia-voto" data-id="${esc(p.id)}">Cambia voto</button>`;
        }
        return `<article class="panel poll"><h3>${esc(p.domanda)}</h3>
            <p class="meta"><span>Di ${esc(p.autore)}, ${tempoFa(p.creato_il)}</span><span>${totale} voti</span></p>${corpo}
            <div class="azioni">${btnSegnala("sondaggio", p)}${btnElimina("sondaggi", p)}</div></article>`;
    }).join("") : vuoto("Nessun sondaggio", "Creane uno con il pulsante qui sopra.");
}

/* ---- Appunti ---- */
function renderAppunti() {
    disegnaChips("chips-appunti", "appunti", ["Tutte", ...Object.keys(MATERIE)]);
    const lista = D.appunti.filter((p) => FILTRI.appunti === "Tutte" || p.materia === FILTRI.appunti);
    lista.sort((a, b) => ordineAppunti === "voti" ? b.punteggio - a.punteggio : b.creato_il - a.creato_il);
    $("lista-appunti").innerHTML = lista.length ? lista.map((p) => {
        const aperti = commentiAperti.has(p.id);
        const commenti = aperti ? `<div class="commenti">
            ${p.commenti.map((c) => `<div class="commento"><b>${esc(c.autore)}</b> <small>${tempoFa(c.creato_il)}</small><p>${esc(c.testo)}</p>
                <div class="azioni">${btnSegnala("commento", c)}${btnElimina("commenti", c)}</div></div>`).join("") || '<p class="vuoto-piccolo">Ancora nessun commento.</p>'}
            <form class="commento-form" data-form="commento" data-id="${esc(p.id)}">
                <label class="sr-only" for="c-${esc(p.id)}">Scrivi un commento</label>
                <input type="text" id="c-${esc(p.id)}" name="testo" maxlength="300" required placeholder="Scrivi un commento" autocomplete="off">
                <button class="btn-main" type="submit">Invia</button>
            </form></div>` : "";
        return `<article class="panel post">
            <div class="votes">
                <button class="su" type="button" data-azione="vota-appunto" data-id="${esc(p.id)}" data-dir="su" aria-pressed="${p.mio_voto === 1}" aria-label="Voto positivo">${svg("su")}</button>
                <b>${p.punteggio}</b>
                <button class="giu" type="button" data-azione="vota-appunto" data-id="${esc(p.id)}" data-dir="giu" aria-pressed="${p.mio_voto === -1}" aria-label="Voto negativo">${svg("giu")}</button>
            </div>
            <div>
                <p class="meta" style="margin:0"><span class="materia" style="--c:${MATERIE[p.materia] || MATERIE.Altro}">${esc(p.materia)}</span><span>Di ${esc(p.autore)}, ${tempoFa(p.creato_il)}</span></p>
                <h3>${esc(p.titolo)}</h3>
                <img class="foto" src="${esc(p.foto)}" alt="Foto degli appunti: ${esc(p.titolo)}" loading="lazy">
                <p class="desc" style="margin:0">${esc(p.testo)}</p>
                <div class="azioni">
                    <button class="btn-text" type="button" data-azione="toggle-commenti" data-id="${esc(p.id)}" aria-expanded="${aperti}">${svg("commento")}${p.commenti.length} commenti</button>
                    ${btnSegnala("appunto", p)}${btnElimina("appunti", p)}
                </div>
                ${commenti}
            </div>
        </article>`;
    }).join("") : vuoto("Nessun appunto qui", "Prova un'altra materia o condividi tu i primi appunti.");
}

/* ---- Libri ---- */
const ETICHETTE_RICHIESTA = { in_attesa: "In attesa", accettata: "Accettata", rifiutata: "Rifiutata" };

function htmlRichiesteVenditore(l) {
    if (!l.richieste || !l.richieste.length) return "";
    return `<div class="richieste"><strong>Richieste (${l.richieste.length})</strong>` + l.richieste.map((r) =>
        `<div class="richiesta"><span>${esc(r.nome)} · ${esc(r.classe || "")} <span class="badge">${ETICHETTE_RICHIESTA[r.stato]}</span></span>
         <span class="azioni">${r.stato !== "accettata" ? `<button class="btn-text" type="button" data-azione="rispondi-richiesta" data-id="${esc(l.id)}" data-utente="${esc(r.utente_id)}" data-stato="accettata">Accetta</button>` : ""}
         ${r.stato !== "rifiutata" ? `<button class="btn-text" type="button" data-azione="rispondi-richiesta" data-id="${esc(l.id)}" data-utente="${esc(r.utente_id)}" data-stato="rifiutata">Rifiuta</button>` : ""}</span></div>`).join("")
        + `<p class="count" style="margin:.25rem 0 0">Accordatevi per lo scambio di persona, a scuola.</p></div>`;
}

function renderLibri() {
    disegnaChips("chips-libri", "libri", ["Tutti", "Gratis", "A pagamento"]);
    const q = RICERCHE.libri.trim().toLowerCase();
    const lista = D.libri.filter((l) =>
        (FILTRI.libri === "Tutti" || (FILTRI.libri === "Gratis" ? l.prezzo_cent === 0 : l.prezzo_cent > 0)) &&
        (!q || (l.titolo + " " + l.materia).toLowerCase().includes(q)));
    $("lista-libri").innerHTML = lista.length ? lista.map((l) => {
        const prezzo = l.prezzo_cent > 0 ? euroCent(l.prezzo_cent) : "Gratis";
        const statoBadge = l.stato === "riservato" ? '<span class="badge pronta">Riservato</span>' : l.stato === "ceduto" ? '<span class="badge esposta">Ceduto</span>' : "";
        let azioni;
        if (l.mio) {
            azioni = `<span class="count">${l.n_richieste} richieste</span>
                <button class="btn-text" type="button" data-azione="stato-libro" data-id="${esc(l.id)}" data-stato="${l.stato === "ceduto" ? "disponibile" : "ceduto"}">${l.stato === "ceduto" ? "Rendi di nuovo disponibile" : "Segna come ceduto"}</button>${btnElimina("libri", l)}`;
        } else if (l.mia_richiesta) {
            azioni = `<button class="btn-line" type="button" data-azione="lo-voglio" data-id="${esc(l.id)}" aria-pressed="true">Richiesto – annulla</button>
                <span class="badge">${ETICHETTE_RICHIESTA[l.mia_richiesta]}</span>${btnSegnala("libro", l)}${btnElimina("libri", l)}`;
        } else if (l.stato === "disponibile") {
            azioni = `<button class="btn-line" type="button" data-azione="lo-voglio" data-id="${esc(l.id)}" aria-pressed="false">Lo voglio</button>${btnSegnala("libro", l)}${btnElimina("libri", l)}`;
        } else { azioni = `${btnSegnala("libro", l)}${btnElimina("libri", l)}`; }
        const incasso = l.mio && l.prezzo_cent > 0 && CFG().commissione_percentuale > 0 ? `<p class="count" style="margin:0">Riceverai ${euroCent(nettoCent(l.prezzo_cent))} (commissione ${euroCent(commissioneCent(l.prezzo_cent))}).</p>` : "";
        const accettata = !l.mio && l.mia_richiesta === "accettata" ? `<p class="count" style="margin:0"><b>${esc(l.venditore)}</b> ha accettato: accordatevi per lo scambio a scuola.</p>` : "";
        return `<article class="panel libro">
            <div class="cover" style="--c:${MATERIE[l.materia] || MATERIE.Altro}"><span class="price ${l.prezzo_cent > 0 ? "" : "free"}">${prezzo}</span>
                <small>${esc(l.materia)}, classe ${esc(l.classe)}</small><h3>${esc(l.titolo)}</h3></div>
            <div class="libro-body">
                <p class="meta" style="margin:0"><span>Condizione: ${esc(l.condizione)}</span>${statoBadge}</p>
                ${l.nota ? `<p class="desc">${esc(l.nota)}</p>` : ""}
                <p class="count" style="margin:0">Di ${esc(l.venditore)}, ${tempoFa(l.creato_il)}</p>${incasso}${accettata}
                ${htmlRichiesteVenditore(l)}
                <div class="azioni">${azioni}</div>
            </div>
        </article>`;
    }).join("") : `<div class="panel" style="grid-column:1/-1">${vuoto("Nessun libro trovato", "Cambia i filtri oppure metti a disposizione un libro tuo.")}</div>`;
}

/* ---- Profilo ---- */
function renderProfilo() {
    const u = ME.utente, s = ME.statistiche;
    const iniziali = (u.nome[0] + (u.cognome[0] || "")).toUpperCase();
    $("avatar").textContent = iniziali; $("profilo-avatar").textContent = iniziali;
    $("saluto").textContent = "Ciao, " + u.nome + "!";
    $("userName").textContent = u.nome + " " + u.cognome;
    $("profilo-nome").textContent = u.nome + " " + u.cognome;
    $("profilo-email").textContent = u.email + (u.scuola ? " · " + u.scuola : "") + (u.admin ? " – amministratore" : "");
    $("stat-idee").textContent = s.idee; $("stat-appunti").textContent = s.appunti; $("stat-libri").textContent = s.libri; $("stat-eventi").textContent = s.eventi;
    $("link-admin").hidden = !u.admin;
    $("consenso-info").textContent = "Hai accettato regole e informativa il " + new Date(u.consenso_il).toLocaleDateString("it-IT") + " (versione " + u.consenso_versione + ").";
    const f = $("form-profilo").elements;
    if (document.activeElement && !$("form-profilo").contains(document.activeElement)) {
        f.nome.value = u.nome; f.cognome.value = u.cognome;
        f.anno.value = (u.classe || "").slice(0, 2); f.sezione.value = (u.classe || "").slice(2);
    }
}

/* ---- Admin ---- */
function renderAdmin() {
    if (SCUOLA && SCUOLA.codice_invito) {
        $("scuola-riga").textContent = SCUOLA.nome + " · " + SCUOLA.membri + (SCUOLA.membri === 1 ? " iscritto" : " iscritti");
        $("scuola-codice").textContent = SCUOLA.codice_invito;
        const f = document.querySelector('[data-form="scuola"]').elements;
        if (!document.activeElement || !f.soglia.form.contains(document.activeElement)) { f.soglia.value = SCUOLA.soglia_idee; f.dominio.value = SCUOLA.dominio_email || ""; }
    }
    $("lista-segnalazioni").innerHTML = SEGNALAZIONI.length ? SEGNALAZIONI.map((s) =>
        `<div class="segnalazione"><div><span class="badge">${esc(s.tipo)}</span> <strong>${esc(s.contenuto)}</strong>
            <p class="count" style="margin:.125rem 0 0">${s.motivo ? "Motivo: " + esc(s.motivo) : "Nessun motivo indicato"} · ${tempoFa(s.creato_il)}</p></div>
            <div class="azioni">
                <button class="btn-text danger" type="button" data-azione="elimina-segnalato" data-tipo="${esc(s.tipo)}" data-id="${esc(s.contenuto_id)}" data-segn="${esc(s.id)}">${svg("cestino")}Elimina contenuto</button>
                <button class="btn-text" type="button" data-azione="risolvi-segnalazione" data-id="${esc(s.id)}">Ignora</button>
            </div></div>`).join("") : "<p class='count'>Nessuna segnalazione aperta.</p>";
}

// Ridisegna tutto: chiamato dopo ogni modifica dei dati
function renderTutto() { renderBacheca(); renderIdee(); renderSondaggi(); renderAppunti(); renderLibri(); renderProfilo(); if (isAdmin()) renderAdmin(); }
async function ricarica() { await carica(); renderTutto(); }

/* ---------------------------------------------------------------------
   6. NAVIGAZIONE TRA LE SEZIONI (usa la parte dell'indirizzo dopo il #)
   --------------------------------------------------------------------- */
let primaVolta = true;
function mostraVista() {
    let nome = location.hash.slice(1);
    if (!VISTE[nome] || (nome === "admin" && !isAdmin())) nome = "bacheca";
    document.querySelectorAll(".vista").forEach((v) => { v.hidden = v.id !== "vista-" + nome; });
    document.querySelectorAll("[data-vista]").forEach((a) => {
        if (a.dataset.vista === nome) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    document.title = VISTE[nome] + " – Hub Studenti";
    window.scrollTo(0, 0);
    if (!primaVolta) { const h = document.querySelector("#vista-" + nome + " h1"); if (h) h.focus({ preventScroll: true }); }
    primaVolta = false;
}
window.addEventListener("hashchange", mostraVista);

/* ---------------------------------------------------------------------
   7. AZIONI: cosa succede quando si preme un pulsante con data-azione="..."
   Ogni voce riceve i data-* del pulsante (id, dir, ecc.) e può chiamare il server.
   Se restituisce false, non si ricaricano i dati.
   --------------------------------------------------------------------- */
const ENDPOINT_ELIMINA = { idee: "idee", sondaggi: "sondaggi", appunti: "appunti", libri: "libri", eventi: "eventi", comunicazioni: "comunicazioni", commenti: "commenti" };
const ENDPOINT_TIPO = { idea: "idee", sondaggio: "sondaggi", appunto: "appunti", commento: "commenti", libro: "libri" };

const AZIONI = {
    // Bacheca: iscriversi / annullare la partecipazione a un evento
    async partecipa({ id }) {
        const e = D.eventi.find((x) => x.id === id);
        if (e.partecipo) { await Api.del("/api/eventi/" + id + "/partecipa"); avviso("Partecipazione annullata: " + e.titolo); }
        else { await Api.put("/api/eventi/" + id + "/partecipa"); avviso("Ti sei segnato a: " + e.titolo); }
    },
    // Filtri (chips) di eventi, appunti e libri
    filtro({ gruppo, valore }) { FILTRI[gruppo] = valore; return "locale"; },

    // Idee: un solo sostegno a testa, ripremendo si toglie
    async "sostieni-idea"({ id }) {
        const i = D.idee.find((x) => x.id === id);
        if (i.io_voto) await Api.del("/api/idee/" + id + "/voto"); else await Api.put("/api/idee/" + id + "/voto");
    },
    // Solo admin: segna l'idea come già presentata in assemblea (il server controlla comunque il ruolo)
    async "segna-esposta"({ id }) { await Api.post("/api/idee/" + id + "/esponi"); avviso("Idea segnata come portata in assemblea."); },

    // Sondaggi: si può cambiare voto
    async "vota-sondaggio"({ id }, btn) {
        const r = btn.closest(".poll").querySelector("input:checked");
        if (!r) { avviso("Scegli prima un'opzione."); return false; }
        await Api.put("/api/sondaggi/" + id + "/voto", { opzione: r.value });
        sondaggiInModifica.delete(id);
        avviso("Voto registrato. Grazie!");
    },
    "cambia-voto"({ id }) { sondaggiInModifica.add(id); return "locale"; },
    "aggiungi-opzione"() {
        const box = $("opzioni-sondaggio"), n = box.querySelectorAll("input").length, max = CFG().max_opzioni_sondaggio;
        if (n >= max) { avviso("Massimo " + max + " opzioni."); return false; }
        box.insertAdjacentHTML("beforeend", htmlOpzione(n + 1));
        box.lastElementChild.focus();
        return false;
    },

    // Appunti: voto positivo/negativo come su Reddit (ripremendo lo stesso si annulla)
    async "vota-appunto"({ id, dir }) {
        const p = D.appunti.find((x) => x.id === id), nuovo = dir === "su" ? 1 : -1;
        if (p.mio_voto === nuovo) await Api.del("/api/appunti/" + id + "/voto");
        else await Api.put("/api/appunti/" + id + "/voto", { valore: nuovo });
    },
    "toggle-commenti"({ id }) { if (commentiAperti.has(id)) commentiAperti.delete(id); else commentiAperti.add(id); return "locale"; },

    // Libri
    async "lo-voglio"({ id }) {
        const l = D.libri.find((x) => x.id === id);
        if (l.mia_richiesta) { await Api.del("/api/libri/" + id + "/richiesta"); avviso("Richiesta annullata."); }
        else { await Api.put("/api/libri/" + id + "/richiesta"); avviso("Richiesta inviata: " + l.venditore + " potrà accettarla."); }
    },
    async "rispondi-richiesta"({ id, utente, stato }) { await Api.patch("/api/libri/" + id + "/richieste/" + utente, { stato }); avviso(stato === "accettata" ? "Richiesta accettata." : "Richiesta rifiutata."); },
    async "stato-libro"({ id, stato }) { await Api.patch("/api/libri/" + id, { stato }); },

    // Elimina un contenuto (il server controlla che sia tuo o che tu sia admin)
    async elimina({ coll, id }) {
        if (!ENDPOINT_ELIMINA[coll] || !confirm("Vuoi davvero eliminare questo contenuto?")) return false;
        await Api.del("/api/" + ENDPOINT_ELIMINA[coll] + "/" + id);
        avviso("Contenuto eliminato.");
    },

    // Moderazione
    async segnala({ tipo, id }) {
        const motivo = prompt("Perché lo segnali? (facoltativo, max 300 caratteri)");
        if (motivo === null) return false;
        await Api.post("/api/segnalazioni", { tipo, contenuto_id: id, motivo: motivo.slice(0, 300) });
        avviso("Grazie, i rappresentanti controlleranno la segnalazione.");
        return false;
    },
    async "nuovo-codice"() {
        if (!confirm("Generare un nuovo codice? Il vecchio smetterà di funzionare subito.")) return false;
        await Api.post("/api/scuola/codice"); avviso("Nuovo codice generato.");
    },
    async "copia-link-invito"() {
        const link = location.origin + "/register.html?codice=" + encodeURIComponent(SCUOLA.codice_invito);
        try { await navigator.clipboard.writeText(link); avviso("Link copiato negli appunti."); } catch (e) { avviso(link); }
        return "locale";
    },
    async "risolvi-segnalazione"({ id }) { await Api.post("/api/segnalazioni/" + id + "/risolvi"); },
    async "elimina-segnalato"({ tipo, id, segn }) {
        if (!confirm("Eliminare definitivamente il contenuto segnalato?")) return false;
        try { await Api.del("/api/" + ENDPOINT_TIPO[tipo] + "/" + id); } catch (e) { if (e.stato !== 404) throw e; }
        await Api.post("/api/segnalazioni/" + segn + "/risolvi");
        avviso("Contenuto eliminato.");
    }
};

// Un solo ascoltatore per tutti i pulsanti con data-azione
document.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("[data-azione]");
    if (!btn || !AZIONI[btn.dataset.azione]) return;
    // Ricordiamo quale pulsante era, per rimettere il focus dopo il ridisegno (utile a chi usa la tastiera)
    const sel = Object.entries(btn.dataset).map(([k, v]) => `[data-${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}="${cssEsc(v)}"]`).join("");
    const indice = [...document.querySelectorAll(sel)].indexOf(btn);
    btn.disabled = true;
    try {
        const esito = await AZIONI[btn.dataset.azione](btn.dataset, btn);
        if (esito === false) { btn.disabled = false; return; }
        if (esito !== "locale") await carica();
    } catch (err) {
        btn.disabled = false;
        if (err.stato === 401) return vaiAlLogin();
        avviso(err.message);
        return;
    }
    renderTutto();
    const nuovo = document.querySelectorAll(sel)[indice];
    if (nuovo) nuovo.focus();
});

/* ---------------------------------------------------------------------
   8. MODULI (form): pubblicare idee, sondaggi, appunti, libri, commenti, profilo…
   Ogni <form data-form="nome"> chiama la funzione con lo stesso nome.
   --------------------------------------------------------------------- */
const htmlOpzione = (n) => `<input type="text" name="opzione" maxlength="60" placeholder="Opzione ${n}" aria-label="Opzione ${n}" ${n <= 2 ? "required" : ""}>`;
function ripristinaOpzioni() { $("opzioni-sondaggio").innerHTML = htmlOpzione(1) + htmlOpzione(2); }
const chiudi = (form) => { const d = form.closest("details"); if (d) d.open = false; };

// Riduce la foto (max 1000px, JPEG): file più leggero e senza i metadati della fotocamera (posizione GPS, modello…)
function riduciImmagine(file, latoMax = 1000, qualita = 0.72) {
    return new Promise((ok, ko) => {
        const url = URL.createObjectURL(file), img = new Image();
        img.onload = () => {
            const r = Math.min(1, latoMax / Math.max(img.width, img.height));
            const c = document.createElement("canvas");
            c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
            c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
            URL.revokeObjectURL(url);
            ok(c.toDataURL("image/jpeg", qualita));
        };
        img.onerror = () => { URL.revokeObjectURL(url); ko(new Error("immagine non valida")); };
        img.src = url;
    });
}

// Anteprima del prezzo con la commissione, mentre si scrive nel modulo dei libri
function aggiornaAnteprimaPrezzo() {
    if (!D) return;
    const cent = Math.round(Math.max(0, parseFloat($("libro-prezzo").value) || 0) * 100);
    $("anteprima-prezzo").textContent = cent === 0
        ? "Lo regali: nessuna commissione."
        : !CFG().commissione_percentuale ? `Gli altri vedranno ${euroCent(cent)}. Nessuna commissione.`
        : `Gli altri vedranno ${euroCent(cent)}. Commissione ${CFG().commissione_percentuale}%: ${euroCent(commissioneCent(cent))}. Tu ricevi ${euroCent(nettoCent(cent))}.`;
}

// Esegue una chiamata di un modulo gestendo pulsante bloccato ed errori
async function inviaForm(form, lavoro, messaggio) {
    const bottone = form.querySelector('button[type="submit"]'), etichetta = bottone && bottone.textContent;
    if (bottone) { bottone.disabled = true; bottone.textContent = "Un momento…"; }
    try {
        await lavoro();
        if (messaggio) avviso(messaggio);
        return true;
    } catch (err) {
        if (err.stato === 401) { vaiAlLogin(); return false; }
        avviso(err.message);
        return false;
    } finally { if (bottone) { bottone.disabled = false; bottone.textContent = etichetta; } }
}

const FORM = {
    async scuola(form) {
        const f = form.elements;
        if (await inviaForm(form, () => Api.patch("/api/scuola", { soglia_idee: Number(f.soglia.value), dominio_email: f.dominio.value }), "Impostazioni salvate.")) await ricarica();
    },
    async idea(form) {
        const f = form.elements;
        if (await inviaForm(form, () => Api.post("/api/idee", { titolo: f.titolo.value, descrizione: f.desc.value }), "Idea pubblicata!")) { form.reset(); chiudi(form); await ricarica(); }
    },
    async sondaggio(form) {
        const opzioni = [...form.querySelectorAll('input[name="opzione"]')].map((i) => i.value.trim()).filter(Boolean);
        if (await inviaForm(form, () => Api.post("/api/sondaggi", { domanda: form.elements.domanda.value, opzioni }), "Sondaggio pubblicato!")) { form.reset(); ripristinaOpzioni(); chiudi(form); await ricarica(); }
    },
    async appunto(form) {
        const f = form.elements, file = f.foto.files[0];
        if (!file) { avviso("Scegli una foto degli appunti."); return; }
        const ok = await inviaForm(form, async () => {
            let foto;
            try { foto = await riduciImmagine(file); } catch (e) { throw new Error("Non riesco a leggere questa foto. Provane un'altra."); }
            await Api.post("/api/appunti", { titolo: f.titolo.value, materia: f.materia.value, testo: f.testo.value, foto });
        }, "Appunti pubblicati!");
        if (ok) { form.reset(); $("anteprima-foto").hidden = true; chiudi(form); await ricarica(); }
    },
    async libro(form) {
        const f = form.elements, cent = Math.round(Math.max(0, parseFloat(f.prezzo.value) || 0) * 100);
        const ok = await inviaForm(form, () => Api.post("/api/libri", { titolo: f.titolo.value, materia: f.materia.value, classe: f.classe.value,
            condizione: f.condizione.value, prezzo_cent: cent, nota: f.nota.value }), cent ? "Annuncio pubblicato!" : "Grazie per il regalo!");
        if (ok) { form.reset(); chiudi(form); await ricarica(); aggiornaAnteprimaPrezzo(); }
    },
    async commento(form) {
        const id = form.dataset.id;
        if (await inviaForm(form, () => Api.post("/api/appunti/" + id + "/commenti", { testo: form.elements.testo.value }))) {
            await ricarica();
            const campo = $("c-" + id); if (campo) campo.focus();
        }
    },

    // ---- Profilo e diritti sui dati (GDPR) ----
    async profilo(form) {
        const f = form.elements;
        if (await inviaForm(form, () => Api.patch("/api/me", { nome: f.nome.value, cognome: f.cognome.value, classe: f.anno.value + f.sezione.value.toUpperCase() }), "Profilo aggiornato.")) await ricarica();
    },
    async password(form) {
        const f = form.elements;
        if (f.nuova.value !== f.conferma.value) { avviso("Le due password non coincidono."); return; }
        if (await inviaForm(form, () => Api.post("/api/me/password", { vecchia: f.vecchia.value, nuova: f.nuova.value }), "Password cambiata.")) form.reset();
    },
    async "elimina-account"(form) {
        const f = form.elements;
        if (!f.conferma.checked) { avviso("Spunta la casella per confermare."); return; }
        if (!confirm("Ultima conferma: l'account e tutto ciò che hai pubblicato verranno eliminati per sempre. Continuare?")) return;
        const ok = await inviaForm(form, () => Api.del("/api/me", { password: f.password.value, conferma: true }));
        if (ok) location.href = "index.html?eliminato=1";
    },

    // ---- Strumenti admin ----
    async evento(form) {
        const f = form.elements, inizio = new Date(f.data.value + "T" + (f.ora.value || "00:00")).getTime();
        if (!Number.isFinite(inizio)) { avviso("Scegli data e ora."); return; }
        if (await inviaForm(form, () => Api.post("/api/eventi", { titolo: f.titolo.value, descrizione: f.descrizione.value, luogo: f.luogo.value, categoria: f.categoria.value, inizio }), "Evento pubblicato.")) { form.reset(); await ricarica(); }
    },
    async comunicazione(form) {
        const f = form.elements;
        if (await inviaForm(form, () => Api.post("/api/comunicazioni", { titolo: f.titolo.value, testo: f.testo.value }), "Comunicazione pubblicata.")) { form.reset(); await ricarica(); }
    }
};

document.addEventListener("submit", (ev) => {
    const nome = ev.target.dataset && ev.target.dataset.form;
    if (!nome || !FORM[nome]) return;
    ev.preventDefault();
    FORM[nome](ev.target);
});

/* ---------------------------------------------------------------------
   9. AVVIO: controlla la sessione, scarica i dati, riempie i menu e disegna la pagina
   --------------------------------------------------------------------- */
function riempiSelect(id, elenco) { $(id).innerHTML = elenco.map((v) => `<option>${esc(v)}</option>`).join(""); }

(async function avvio() {
    try { await carica(); }
    catch (err) { if (err.stato === 401) return vaiAlLogin(); document.body.insertAdjacentHTML("afterbegin", `<p style="padding:1rem">${esc(err.message)}</p>`); return; }

    riempiSelect("appunto-materia", Object.keys(MATERIE));
    riempiSelect("libro-materia", Object.keys(MATERIE));
    riempiSelect("libro-classe", CLASSI);
    riempiSelect("libro-cond", CONDIZIONI);
    riempiSelect("profilo-anno", CLASSI);
    riempiSelect("evento-categoria", CATEGORIE_EVENTI.slice(1));

    $("soglia-testo").textContent = CFG().soglia_idee;
    $("max-opzioni").textContent = CFG().max_opzioni_sondaggio;
    $("commissione-testo").textContent = CFG().commissione_percentuale + "%";
    $("commissione-box").hidden = !CFG().commissione_percentuale;
    ripristinaOpzioni();
    aggiornaAnteprimaPrezzo();

    $("cerca-eventi").addEventListener("input", (e) => { RICERCHE.eventi = e.target.value; renderBacheca(); });
    $("cerca-libri").addEventListener("input", (e) => { RICERCHE.libri = e.target.value; renderLibri(); });
    $("ordine-appunti").addEventListener("change", (e) => { ordineAppunti = e.target.value; renderAppunti(); });
    $("libro-prezzo").addEventListener("input", aggiornaAnteprimaPrezzo);
    $("appunto-foto").addEventListener("change", (e) => {
        const f = e.target.files[0], img = $("anteprima-foto");
        if (!f) { img.hidden = true; return; }
        img.src = URL.createObjectURL(f); img.hidden = false;
    });
    $("logout").addEventListener("click", async () => { await Auth.logout(); location.href = "index.html"; });

    renderTutto();
    mostraVista();
})();
