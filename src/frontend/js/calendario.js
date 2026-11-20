/* =====================================================================
   calendario.js — Google-Calendar-style calendar: month / week / day / agenda views, create-edit dialog,
   ICS import and export, private subscription link (Google / Apple / Outlook calendar "from URL").
   Data: GET /api/calendario?da=&a= (see routes-calendario.js). All-day entries are "floating" dates
   (UTC midnight = the calendar day, no time zone), timed entries are real instants shown in local time.
   ===================================================================== */
"use strict";
(function () {
    const GIORNO = 86400000;
    const TIPI = { verifica: "Verifica", interrogazione: "Interrogazione", compito: "Compito", evento: "Evento", altro: "Altro", assemblea: "Assemblea" };
    const ST = { vista: window.innerWidth < 720 ? "agenda" : "mese", cursore: new Date(), voci: [], tipi: Object.keys(TIPI), nascosti: new Set(), caricamento: false, scrollFatto: false };
    ST.cursore.setHours(0, 0, 0, 0);

    const pad = (n) => String(n).padStart(2, "0");
    const chiaveLocale = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const aggiungi = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const lunedi = (d) => aggiungi(d, -((d.getDay() + 6) % 7));
    const stessoGiorno = (a, b) => chiaveLocale(a) === chiaveLocale(b);
    /** calendar day (yyyy-mm-dd) of an entry: floating for all-day, local for timed ones */
    const giornoVoce = (v) => (v.tutto_il_giorno ? new Date(v.inizio).toISOString().slice(0, 10) : chiaveLocale(new Date(v.inizio)));
    const giornoFineVoce = (v) => (v.tutto_il_giorno || !v.fine ? giornoVoce(v) : chiaveLocale(new Date(Math.max(v.inizio, v.fine - 1))));
    const minuti = (ts) => { const d = new Date(ts); return d.getHours() * 60 + d.getMinutes(); };
    const fmtOra = (ts) => new Date(ts).toLocaleTimeString(LOC(), { hour: "2-digit", minute: "2-digit" });
    const fmtGiorno = (d, o) => d.toLocaleDateString(LOC(), o);
    const nomeTipo = (t) => T(TIPI[t] || t);
    const root = () => $("vista-calendario");

    function finestra() {
        const c = ST.cursore;
        if (ST.vista === "mese") { const i = lunedi(new Date(c.getFullYear(), c.getMonth(), 1)); return [i, aggiungi(i, 42)]; }
        if (ST.vista === "settimana") { const i = lunedi(c); return [i, aggiungi(i, 7)]; }
        if (ST.vista === "giorno") return [c, aggiungi(c, 1)];
        return [c, aggiungi(c, 60)];
    }
    async function carica() {
        const [da, a] = finestra();
        ST.caricamento = true;
        try {
            const r = await Api.get(`/api/calendario?da=${da.getTime()}&a=${a.getTime()}`);
            // keep only entries that really start inside the window (the server pads by one day for floating dates)
            const dk = chiaveLocale(da), ak = chiaveLocale(a);
            ST.voci = r.voci.filter((v) => { const g = giornoVoce(v); return g >= dk && g < ak; });
            ST.tipi = r.tipi; ST.classe = r.classe;
        } catch (e) { avviso(e.message); }
        ST.caricamento = false;
        disegna();
    }

    /* ------------------------------------------------------------ shell */
    function scheletro() {
        const el = root();
        if (el.dataset.pronto) return;
        el.dataset.pronto = "1";
        el.innerHTML = `
            <div class="page-head"><h1 tabindex="-1">Calendario</h1>
                <p>Verifiche, compiti ed eventi della tua classe e della scuola, in un colpo d'occhio. Puoi importare il calendario del registro e iscriverti da Google Calendar.</p></div>
            <div class="cal-barra">
                <div class="cal-nav">
                    <button class="btn-line" type="button" data-cal="oggi">Oggi</button>
                    <button class="btn-text cal-freccia" type="button" data-cal="prec" aria-label="Precedente">‹</button>
                    <button class="btn-text cal-freccia" type="button" data-cal="succ" aria-label="Successivo">›</button>
                    <h2 class="cal-titolo" id="cal-titolo" aria-live="polite"></h2>
                </div>
                <div class="cal-destra">
                    <div class="cal-viste" role="group" aria-label="Vista">
                        ${[["mese", "Mese"], ["settimana", "Settimana"], ["giorno", "Giorno"], ["agenda", "Agenda"]].map(([v, n]) => `<button type="button" class="chip" data-cal-vista="${v}">${n}</button>`).join("")}
                    </div>
                    <button class="btn-main" type="button" data-cal="nuova">+ Nuova voce</button>
                    <details class="cal-altro"><summary class="btn-line">Importa / esporta</summary>
                        <div class="menu-pop">
                            <button type="button" class="btn-text" data-cal="importa">Importa file .ics…</button>
                            <a class="btn-text" href="/api/calendario/esporta.ics" download>Scarica .ics</a>
                            <button type="button" class="btn-text" data-cal="feed">Iscriviti da Google/Apple/Outlook…</button>
                        </div></details>
                </div>
            </div>
            <div class="cal-legenda" id="cal-legenda"></div>
            <div class="panel cal-corpo" id="cal-corpo"></div>
            <input type="file" id="cal-file" accept=".ics,text/calendar" hidden>
            <dialog id="cal-dialog" class="dialog" aria-labelledby="cal-dlg-titolo"></dialog>`;
        el.addEventListener("click", clic);
        $("cal-file").addEventListener("change", importa);
        $("cal-dialog").addEventListener("click", (e) => { if (e.target.id === "cal-dialog") e.target.close(); });
        window.addEventListener("resize", () => { if (!el.hidden && ST.vista === "mese" && window.innerWidth < 720 && !ST.avvisoStretto) { ST.avvisoStretto = true; } });
    }

    function legenda() {
        $("cal-legenda").innerHTML = Object.keys(TIPI).map((t) => `<button type="button" class="cal-leg" data-cal-tipo="${t}" aria-pressed="${!ST.nascosti.has(t)}"><i class="cal-pt t-${t}"></i>${esc(T(TIPI[t]))}</button>`).join("");
    }
    const visibili = () => ST.voci.filter((v) => !ST.nascosti.has(v.tipo));

    function titolo() {
        const c = ST.cursore;
        if (ST.vista === "mese") return fmtGiorno(c, { month: "long", year: "numeric" });
        if (ST.vista === "settimana") { const i = lunedi(c), f = aggiungi(i, 6); return `${fmtGiorno(i, { day: "numeric", month: "short" })} – ${fmtGiorno(f, { day: "numeric", month: "short", year: "numeric" })}`; }
        if (ST.vista === "giorno") return fmtGiorno(c, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        return T("Prossimi 60 giorni");
    }
    function disegna() {
        const el = root();
        if (!el || !el.dataset.pronto) return;
        $("cal-titolo").textContent = titolo();
        el.querySelectorAll("[data-cal-vista]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.calVista === ST.vista)));
        legenda();
        const corpo = $("cal-corpo");
        corpo.className = "panel cal-corpo cal-" + ST.vista;
        corpo.innerHTML = ST.vista === "mese" ? htmlMese() : ST.vista === "agenda" ? htmlAgenda() : htmlGriglia(ST.vista === "giorno" ? [ST.cursore] : Array.from({ length: 7 }, (_, i) => aggiungi(lunedi(ST.cursore), i)));
        if ((ST.vista === "settimana" || ST.vista === "giorno") && !ST.scrollFatto) { const sc = corpo.querySelector(".cal-ore-scroll"); if (sc) { sc.scrollTop = 7 * 48; ST.scrollFatto = true; } }
    }

    /* ------------------------------------------------------------ month */
    const chip = (v) => `<button type="button" class="cal-chip t-${esc(v.tipo)}" data-cal-voce="${esc(v.id)}" title="${esc(v.titolo)}">${v.tutto_il_giorno ? "" : `<b>${esc(fmtOra(v.inizio))}</b> `}${v.classe && v.origine === "agenda" ? `<em>${esc(v.classe)}</em> ` : ""}${esc(v.titolo)}</button>`;
    function perGiorno() { const m = {}; visibili().forEach((v) => { (m[giornoVoce(v)] = m[giornoVoce(v)] || []).push(v); }); return m; }
    function htmlMese() {
        const c = ST.cursore, inizio = lunedi(new Date(c.getFullYear(), c.getMonth(), 1)), oggi = chiaveLocale(new Date()), m = perGiorno();
        const nomi = Array.from({ length: 7 }, (_, i) => fmtGiorno(aggiungi(inizio, i), { weekday: "short" }));
        let h = `<div class="cal-mese" role="grid" aria-label="${esc(titolo())}"><div class="cal-testa" role="row">${nomi.map((n) => `<div role="columnheader">${esc(n)}</div>`).join("")}</div>`;
        for (let s = 0; s < 6; s++) {
            h += '<div class="cal-riga" role="row">';
            for (let g = 0; g < 7; g++) {
                const d = aggiungi(inizio, s * 7 + g), k = chiaveLocale(d), lista = m[k] || [], fuori = d.getMonth() !== c.getMonth();
                const mostra = lista.slice(0, 3);
                h += `<div class="cal-cella ${fuori ? "fuori" : ""} ${k === oggi ? "oggi" : ""}" role="gridcell" data-cal-giorno="${k}">
                    <button type="button" class="cal-num" data-cal-vai="${k}" aria-label="${esc(fmtGiorno(d, { weekday: "long", day: "numeric", month: "long" }))}${lista.length ? ", " + lista.length + " " + T("voci") : ""}">${d.getDate()}</button>
                    ${mostra.map(chip).join("")}${lista.length > 3 ? `<button type="button" class="cal-altre" data-cal-vai="${k}">+${lista.length - 3} ${esc(T("altre"))}</button>` : ""}
                    ${lista.length ? `<span class="cal-punti" aria-hidden="true">${lista.slice(0, 4).map((v) => `<i class="cal-pt t-${esc(v.tipo)}"></i>`).join("")}</span>` : ""}</div>`;
            }
            h += "</div>";
        }
        return h + "</div>";
    }

    /* ------------------------------------------------------------ week / day (time grid) */
    function htmlGriglia(giorni) {
        const oggi = chiaveLocale(new Date()), tutte = visibili(), ore = Array.from({ length: 24 }, (_, i) => i);
        const col = (d) => {
            const k = chiaveLocale(d);
            const tempo = tutte.filter((v) => !v.tutto_il_giorno && giornoVoce(v) === k).sort((a, b) => a.inizio - b.inizio);
            // simple overlap handling: greedy lanes
            const lanes = []; tempo.forEach((v) => { v._fine = v.fine && v.fine > v.inizio ? v.fine : v.inizio + 3600000; let l = lanes.findIndex((f) => f <= v.inizio); if (l < 0) { l = lanes.length; lanes.push(0); } lanes[l] = v._fine; v._lane = l; });
            const n = Math.max(1, lanes.length);
            return `<div class="cal-col ${k === oggi ? "oggi" : ""}" data-cal-giorno="${k}">${ore.map((o) => `<i class="cal-linea" style="top:${o * 48}px"></i>`).join("")}${tempo.map((v) => {
                const top = minuti(v.inizio) * 0.8, alt = Math.max(22, Math.min(((v._fine - v.inizio) / 60000) * 0.8, 24 * 48 - top));
                return `<button type="button" class="cal-blocco t-${esc(v.tipo)}" data-cal-voce="${esc(v.id)}" style="top:${top}px;height:${alt}px;left:calc(${v._lane} * 100% / ${n});width:calc(100% / ${n} - 2px)"><b>${esc(fmtOra(v.inizio))}</b> ${esc(v.titolo)}</button>`;
            }).join("")}${k === oggi ? `<i class="cal-adesso" style="top:${minuti(Date.now()) * 0.8}px"></i>` : ""}</div>`;
        };
        const tuttoGiorno = giorni.map((d) => { const k = chiaveLocale(d); return `<div class="cal-tg-cella">${tutte.filter((v) => v.tutto_il_giorno && giornoVoce(v) === k).map(chip).join("")}</div>`; }).join("");
        return `<div class="cal-gr" style="--giorni:${giorni.length}">
            <div class="cal-gr-testa"><div class="cal-ora-sp"></div>${giorni.map((d) => { const k = chiaveLocale(d); return `<button type="button" class="cal-gr-g ${k === oggi ? "oggi" : ""}" data-cal-vai="${k}"><span>${esc(fmtGiorno(d, { weekday: "short" }))}</span><b>${d.getDate()}</b></button>`; }).join("")}</div>
            <div class="cal-gr-tg"><div class="cal-ora-sp">${esc(T("Tutto il giorno"))}</div>${tuttoGiorno}</div>
            <div class="cal-ore-scroll"><div class="cal-ore"><div class="cal-ore-lab">${ore.map((o) => `<span style="top:${o * 48}px">${o ? pad(o) + ":00" : ""}</span>`).join("")}</div>${giorni.map(col).join("")}</div></div></div>`;
    }

    /* ------------------------------------------------------------ agenda */
    function htmlAgenda() {
        const m = perGiorno(), chiavi = Object.keys(m).sort();
        if (!chiavi.length) return vuoto(T("Niente in programma"), T("Nei prossimi 60 giorni non ci sono voci. Aggiungine una con “Nuova voce” o importa il calendario del registro."));
        const oggi = chiaveLocale(new Date());
        return `<ul class="cal-agenda">${chiavi.map((k) => {
            const d = new Date(k + "T12:00:00");
            return `<li class="cal-ag-g ${k === oggi ? "oggi" : ""}"><div class="cal-ag-data"><b>${d.getDate()}</b><span>${esc(fmtGiorno(d, { weekday: "short", month: "short" }))}</span></div><div class="cal-ag-voci">${m[k].map((v) =>
                `<button type="button" class="cal-ag-voce t-${esc(v.tipo)}" data-cal-voce="${esc(v.id)}"><span class="cal-ag-ora">${v.tutto_il_giorno ? esc(T("Tutto il giorno")) : esc(fmtOra(v.inizio))}</span><span class="cal-ag-tit">${esc(v.titolo)}</span><span class="cal-ag-sub">${esc(nomeTipo(v.tipo))}${v.materia ? " · " + esc(v.materia) : ""}${v.classe ? " · " + esc(v.classe) : ""}</span></button>`).join("")}</div></li>`;
        }).join("")}</ul>`;
    }

    /* ------------------------------------------------------------ dialog: details / create / edit */
    function apriDialog(html) { const d = $("cal-dialog"); d.innerHTML = html; if (!d.open) d.showModal(); d.querySelector("[autofocus]") && d.querySelector("[autofocus]").focus(); }
    function dettaglio(id) {
        const v = ST.voci.find((x) => x.id === id);
        if (!v) return;
        const quando = v.tutto_il_giorno ? fmtGiorno(new Date(v.inizio), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : `${fmtGiorno(new Date(v.inizio), { weekday: "long", day: "numeric", month: "long" })}, ${fmtOra(v.inizio)}${v.fine ? "–" + fmtOra(v.fine) : ""}`;
        apriDialog(`<div class="dlg-corpo"><span class="cal-pt-grande t-${esc(v.tipo)}"></span><h2 id="cal-dlg-titolo">${esc(v.titolo)}</h2>
            <p class="count">${esc(quando)}</p>
            <p><span class="badge">${esc(nomeTipo(v.tipo))}</span>${v.materia ? ` <span class="badge">${esc(v.materia)}</span>` : ""}${v.classe ? ` <span class="badge">${esc(v.classe)}</span>` : v.origine === "agenda" ? ` <span class="badge">${esc(T("Tutta la scuola"))}</span>` : ""}</p>
            ${v.luogo ? `<p>${esc(v.luogo)}</p>` : ""}${v.descrizione ? `<p class="cal-desc">${esc(v.descrizione)}</p>` : ""}${v.autore ? `<p class="count">${esc(T("Aggiunto da"))} ${esc(v.autore)}</p>` : ""}
            <div class="dlg-azioni">${v.modificabile ? `<button class="btn-line" type="button" data-cal-modifica="${esc(v.id)}">${esc(T("Modifica"))}</button><button class="btn-text danger" type="button" data-cal-elimina="${esc(v.id)}">${esc(T("Elimina"))}</button>` : ""}<button class="btn-main" type="button" data-cal-chiudi autofocus>${esc(T("Chiudi"))}</button></div></div>`);
    }
    function modulo(v, giorno) {
        const admin = isAdmin(), nuova = !v;
        const tutto = v ? v.tutto_il_giorno : true;
        const giornoV = v ? giornoVoce(v) : giorno || chiaveLocale(ST.cursore);
        const oraIn = v && !v.tutto_il_giorno ? `${pad(new Date(v.inizio).getHours())}:${pad(new Date(v.inizio).getMinutes())}` : "08:00";
        const oraFi = v && !v.tutto_il_giorno && v.fine ? `${pad(new Date(v.fine).getHours())}:${pad(new Date(v.fine).getMinutes())}` : "";
        const tipiSel = ["verifica", "interrogazione", "compito", "evento", "altro"];
        apriDialog(`<form class="dlg-corpo" id="cal-form" data-id="${v ? esc(v.id) : ""}"><h2 id="cal-dlg-titolo">${nuova ? esc(T("Nuova voce")) : esc(T("Modifica voce"))}</h2>
            <div class="field"><label for="cf-titolo">${esc(T("Titolo"))}</label><input id="cf-titolo" name="titolo" maxlength="120" required autofocus value="${v ? esc(v.titolo) : ""}" placeholder="${esc(T("Es. Verifica di matematica"))}"></div>
            <div class="riga-2"><div class="field"><label for="cf-tipo">${esc(T("Tipo"))}</label><select id="cf-tipo" name="tipo">${tipiSel.map((t) => `<option value="${t}" ${v && v.tipo === t ? "selected" : ""}>${esc(T(TIPI[t]))}</option>`).join("")}</select></div>
            <div class="field"><label for="cf-materia">${esc(T("Materia"))} <span class="count">(${esc(T("facoltativa"))})</span></label><input id="cf-materia" name="materia" maxlength="40" value="${v && v.materia ? esc(v.materia) : ""}"></div></div>
            <label class="check-riga"><input type="checkbox" name="tutto" ${tutto ? "checked" : ""}><span>${esc(T("Tutto il giorno"))}</span></label>
            <div class="riga-3"><div class="field"><label for="cf-data">${esc(T("Data"))}</label><input id="cf-data" name="data" type="date" required value="${giornoV}"></div>
            <div class="field cf-ora"><label for="cf-ini">${esc(T("Inizio"))}</label><input id="cf-ini" name="ini" type="time" value="${oraIn}"></div>
            <div class="field cf-ora"><label for="cf-fin">${esc(T("Fine"))}</label><input id="cf-fin" name="fin" type="time" value="${oraFi}"></div></div>
            ${admin ? `<div class="field"><label for="cf-classe">${esc(T("Classe"))} <span class="count">(${esc(T("vuoto = tutta la scuola"))})</span></label><input id="cf-classe" name="classe" maxlength="10" value="${v && v.classe ? esc(v.classe) : ""}" placeholder="5INFC"></div>`
                : `<p class="count">${esc(T("La voce sarà visibile alla tua classe"))}${ST.classe ? " (" + esc(ST.classe) + ")" : ""}.</p>`}
            <div class="field"><label for="cf-desc">${esc(T("Note"))} <span class="count">(${esc(T("facoltative"))})</span></label><textarea id="cf-desc" name="descrizione" rows="3" maxlength="1000">${v && v.descrizione ? esc(v.descrizione) : ""}</textarea></div>
            <div class="dlg-azioni"><button class="btn-main" type="submit">${esc(T("Salva"))}</button><button class="btn-text" type="button" data-cal-chiudi>${esc(T("Annulla"))}</button></div></form>`);
        const f = $("cal-form"), ore = () => f.querySelectorAll(".cf-ora").forEach((e) => { e.hidden = f.elements.tutto.checked; });
        f.elements.tutto.addEventListener("change", ore); ore();
        f.addEventListener("submit", salva);
    }
    async function salva(e) {
        e.preventDefault();
        const f = e.target, el = f.elements, id = f.dataset.id, tutto = el.tutto.checked;
        const corpo = { titolo: el.titolo.value, tipo: el.tipo.value, materia: el.materia.value, descrizione: el.descrizione.value, tutto_il_giorno: tutto };
        if (el.classe) corpo.classe = el.classe.value;
        if (tutto) corpo.data = el.data.value;
        else {
            corpo.inizio = new Date(el.data.value + "T" + (el.ini.value || "00:00")).getTime();
            if (el.fin.value) corpo.fine = new Date(el.data.value + "T" + el.fin.value).getTime();
        }
        if (await inviaForm(f, () => (id ? Api.patch("/api/calendario/" + id.slice(2), corpo) : Api.post("/api/calendario", corpo)), T("Calendario aggiornato."))) { $("cal-dialog").close(); await carica(); }
    }

    /* ------------------------------------------------------------ import / feed */
    async function importa() {
        const file = $("cal-file").files[0]; $("cal-file").value = "";
        if (!file) return;
        if (file.size > 400000) { avviso(T("Il file è troppo grande (massimo 400 KB).")); return; }
        try {
            const r = await fetch("/api/calendario/importa", { method: "POST", credentials: "same-origin", headers: { "X-Requested-With": "hub", "Content-Type": "text/plain" }, body: await file.text() });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(d.error || T("Importazione non riuscita."));
            avviso(`${d.importati} ${T("voci importate")}${d.ricorrenti_saltati ? ` · ${d.ricorrenti_saltati} ${T("ricorrenti saltate")}` : ""}`);
            await carica();
        } catch (e) { avviso(e.message); }
    }
    function dialogFeed() {
        apriDialog(`<div class="dlg-corpo"><h2 id="cal-dlg-titolo">${esc(T("Iscriviti dal tuo calendario"))}</h2>
            <p>${esc(T("Crea un link privato e incollalo in Google Calendar (“Altri calendari → Da URL”), Apple Calendario o Outlook: le verifiche della classe si aggiornano da sole. Chi ha il link vede il tuo calendario: non condividerlo."))}</p>
            <div id="cal-feed-out"></div>
            <div class="dlg-azioni"><button class="btn-main" type="button" data-cal="feed-crea">${esc(T("Crea link privato"))}</button><button class="btn-text danger" type="button" data-cal="feed-revoca">${esc(T("Disattiva il link"))}</button><button class="btn-text" type="button" data-cal-chiudi>${esc(T("Chiudi"))}</button></div>
            <p class="count">${esc(T("Il registro elettronico non offre un collegamento ufficiale: se esporti il suo calendario in .ics puoi caricarlo con “Importa”. Non ci serve mai la tua password del registro."))}</p></div>`);
    }

    /* ------------------------------------------------------------ events */
    function sposta(dir) {
        const c = ST.cursore;
        ST.cursore = ST.vista === "mese" ? new Date(c.getFullYear(), c.getMonth() + dir, 1) : aggiungi(c, dir * (ST.vista === "settimana" ? 7 : ST.vista === "giorno" ? 1 : 30));
        carica();
    }
    async function clic(e) {
        const t = e.target, tasto = (s) => t.closest(s);
        let b;
        if ((b = tasto("[data-cal-voce]"))) return dettaglio(b.dataset.calVoce);
        if ((b = tasto("[data-cal-vista]"))) { ST.vista = b.dataset.calVista; ST.scrollFatto = false; return carica(); }
        if ((b = tasto("[data-cal-tipo]"))) { const k = b.dataset.calTipo; ST.nascosti.has(k) ? ST.nascosti.delete(k) : ST.nascosti.add(k); return disegna(); }
        if ((b = tasto("[data-cal-vai]"))) { ST.cursore = new Date(b.dataset.calVai + "T00:00:00"); if (ST.vista === "mese" || ST.vista === "agenda") ST.vista = "giorno"; ST.scrollFatto = false; return carica(); }
        if ((b = tasto("[data-cal-modifica]"))) { const v = ST.voci.find((x) => x.id === b.dataset.calModifica); return modulo(v); }
        if ((b = tasto("[data-cal-elimina]"))) {
            if (!confirm(T("Eliminare questa voce?"))) return;
            try { await Api.del("/api/calendario/" + b.dataset.calElimina.slice(2)); $("cal-dialog").close(); avviso(T("Voce eliminata.")); await carica(); } catch (x) { avviso(x.message); }
            return;
        }
        if (tasto("[data-cal-chiudi]")) return $("cal-dialog").close();
        if ((b = tasto("[data-cal-giorno]")) && !tasto("button") && ST.vista !== "agenda") return modulo(null, b.dataset.calGiorno);
        if (!(b = tasto("[data-cal]"))) return;
        const az = b.dataset.cal;
        if (az === "oggi") { ST.cursore = new Date(); ST.cursore.setHours(0, 0, 0, 0); return carica(); }
        if (az === "prec") return sposta(-1);
        if (az === "succ") return sposta(1);
        if (az === "nuova") return modulo(null);
        if (az === "importa") { document.querySelector(".cal-altro").open = false; return $("cal-file").click(); }
        if (az === "feed") { document.querySelector(".cal-altro").open = false; return dialogFeed(); }
        if (az === "feed-crea") {
            try { const r = await Api.post("/api/calendario/feed"), url = location.origin + r.url; $("cal-feed-out").innerHTML = `<div class="field"><label for="cal-feed-url">${esc(T("Il tuo link privato (si vede una volta sola)"))}</label><input id="cal-feed-url" readonly value="${esc(url)}"><button class="btn-line" type="button" data-cal="feed-copia">${esc(T("Copia"))}</button></div>`; } catch (x) { avviso(x.message); }
            return;
        }
        if (az === "feed-copia") { const i = $("cal-feed-url"); i.select(); try { await navigator.clipboard.writeText(i.value); avviso(T("Copiato.")); } catch (x) { document.execCommand && document.execCommand("copy"); } return; }
        if (az === "feed-revoca") { try { await Api.del("/api/calendario/feed"); $("cal-feed-out").textContent = T("Link disattivato."); } catch (x) { avviso(x.message); } }
    }

    Moduli.registra("calendario", {
        vista: "calendario", titolo: "Calendario", gruppo: "principale", larga: true,
        avvia() { scheletro(); },
        apri() { scheletro(); carica(); },
        rendi() { scheletro(); if (!root().hidden && !ST.caricamento && !ST.iniziale) { ST.iniziale = true; carica(); } else disegna(); }
    });
    document.addEventListener("lingua", () => disegna());
})();
