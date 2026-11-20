"use strict";
/* routes-calendario.js — Google-Calendar-like calendar: school events + class/school agenda + approved class assemblies.
   Entries come from: hub events (admins), the agenda (students for THEIR class, admins for any class / whole school),
   assemblies approved by the school, and ICS imports. A private ICS feed lets people subscribe from Google/Apple/Outlook calendar.
   NOTE on Classeviva: there is no public API; we never ask for Classeviva credentials (see docs/product/CALENDAR.md). */
const express = require("express");
const db = require("./db");
const S = require("./security");
const { testo, scelta, nomeBreve, dataFloating } = require("./util");
const { richiediLogin, soloAdmin } = require("./routes-me");
const { richiediModulo } = require("./modules");
const { emetti } = require("./notifiche");
const { HttpError } = S;

const TIPI = ["verifica", "interrogazione", "compito", "evento", "altro"];
const router = express.Router();
const feed = express.Router();       // public, token-authenticated

const èAdmin = (req) => req.utente.ruolo === "admin";
const GIORNO = 86400000, MAX_FINESTRA = 400 * GIORNO;

/** Entries visible to the user between [da, a): school events, school-wide agenda, own-class agenda (admins: every class), approved assemblies. */
function voci(utente, da, a, { soloMiei = false } = {}) {
    const S0 = utente.scuola_id, admin = utente.ruolo === "admin", classe = utente.classe || null;
    const out = [];
    for (const e of db.prepare("SELECT * FROM eventi WHERE scuola_id = ? AND inizio >= ? AND inizio < ?").all(S0, da - GIORNO, a))
        out.push({ id: "e:" + e.id, origine: "evento", tipo: "evento", titolo: e.titolo, descrizione: e.descrizione, luogo: e.luogo, inizio: e.inizio, fine: null, tutto_il_giorno: false, classe: null, modificabile: false });
    const tutteLeClassi = admin && !soloMiei;      // school admins see every class; ICS feeds only show "my" view
    const sql = `SELECT g.*, u.nome, u.cognome FROM agenda g LEFT JOIN utenti u ON u.id = g.autore_id
                 WHERE g.scuola_id = ? AND g.inizio >= ? AND g.inizio < ? ${tutteLeClassi ? "" : "AND (g.classe IS NULL OR g.classe = ?)"} ORDER BY g.inizio`;
    for (const g of db.prepare(sql).all(...(tutteLeClassi ? [S0, da - GIORNO, a] : [S0, da - GIORNO, a, classe])))
        out.push({ id: "g:" + g.id, origine: "agenda", tipo: g.tipo, titolo: g.titolo, descrizione: g.descrizione, materia: g.materia, inizio: g.inizio, fine: g.fine,
                   tutto_il_giorno: !!g.tutto_il_giorno, classe: g.classe, autore: g.nome ? nomeBreve(g.nome, g.cognome) : null,
                   modificabile: admin || g.autore_id === utente.id });
    for (const s of db.prepare(`SELECT * FROM assemblee WHERE scuola_id = ? AND stato IN ('approvata','svolta') AND COALESCE(data_confermata, data_proposta) >= ? AND COALESCE(data_confermata, data_proposta) < ?`).all(S0, da - GIORNO, a)) {
        if (!admin && s.classe !== classe) continue;
        out.push({ id: "a:" + s.id, origine: "assemblea", tipo: "assemblea", titolo: `Assemblea di classe ${s.classe}`, descrizione: s.ordine_giorno, inizio: s.data_confermata || s.data_proposta, fine: null, tutto_il_giorno: true, classe: s.classe, modificabile: false });
    }
    return out.sort((x, y) => x.inizio - y.inizio);
}

function finestra(q) {
    const da = Number(q.da), a = Number(q.a);
    if (!Number.isFinite(da) || !Number.isFinite(a) || a <= da || a - da > MAX_FINESTRA) throw new HttpError(400, "Intervallo non valido.");
    return [da, a];
}

router.use(richiediLogin, richiediModulo("calendario"));

router.get("/", (req, res) => {
    const [da, a] = finestra(req.query);
    res.json({ voci: voci(req.utente, da, a), tipi: TIPI, classe: req.utente.classe || null });
});

function leggiVoce(b, req) {
    const titolo = testo(b.titolo, "Titolo", 1, 120), tipo = scelta(b.tipo, TIPI, "Tipo");
    const descrizione = testo(b.descrizione, "Descrizione", 0, 1000, { multilinea: true }), materia = testo(b.materia, "Materia", 0, 40);
    const tutto = b.tutto_il_giorno !== false;
    let inizio, fine = null;
    if (tutto) inizio = dataFloating(b.data, "Data");
    else {
        inizio = Number(b.inizio); fine = b.fine == null ? null : Number(b.fine);
        if (!Number.isFinite(inizio) || (fine !== null && (!Number.isFinite(fine) || fine < inizio))) throw new HttpError(400, "Orario non valido.");
    }
    if (inizio < Date.now() - 2 * 365 * GIORNO || inizio > Date.now() + 3 * 365 * GIORNO) throw new HttpError(400, "Data troppo lontana.");
    // classe: students only their own class (or none = nothing for others); admins any class or the whole school
    let classe = b.classe === undefined || b.classe === "" ? null : String(b.classe).toUpperCase().replace(/[\s.ª°º-]/g, "");
    if (!èAdmin(req)) {
        if (!req.utente.classe) throw new HttpError(400, "Imposta la tua classe nel profilo per usare l'agenda di classe.", "classe_mancante");
        classe = req.utente.classe;
    } else if (classe !== null && !/^[1-9][A-Z0-9]{1,9}$/.test(classe)) throw new HttpError(400, "Classe non valida.");
    return { titolo, tipo, descrizione, materia, tutto, inizio, fine, classe };
}

const limite = S.creaLimitatore(60, 60 * 60 * 1000);
router.post("/", (req, res) => {
    if (!limite.consenti(req.utente.id)) throw new HttpError(429, "Troppe voci in poco tempo. Riprova più tardi.");
    const v = leggiVoce(req.body || {}, req), id = S.uuid();
    db.prepare(`INSERT INTO agenda (id, scuola_id, classe, tipo, titolo, descrizione, materia, inizio, fine, tutto_il_giorno, autore_id, creato_il)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, req.utente.scuola_id, v.classe, v.tipo, v.titolo, v.descrizione, v.materia, v.inizio, v.fine, v.tutto ? 1 : 0, req.utente.id, Date.now());
    emetti({ scuolaId: req.utente.scuola_id, categoria: "agenda", chiave: "agenda_nuova",
             dati: { t: v.titolo, c: v.classe || "—", q: new Date(v.inizio).toISOString().slice(0, 10) }, link: "/bacheca.html#calendario", escludi: req.utente.id });
    res.json({ id });
});
function mia(req) {
    const g = db.prepare("SELECT * FROM agenda WHERE id = ? AND scuola_id = ?").get(req.params.id, req.utente.scuola_id);
    if (!g) throw new HttpError(404, "Voce non trovata.");
    if (!èAdmin(req) && g.autore_id !== req.utente.id) throw new HttpError(403, "Puoi modificare solo le tue voci.");
    return g;
}
router.patch("/:id", (req, res) => {
    mia(req);
    const v = leggiVoce(req.body || {}, req);
    db.prepare(`UPDATE agenda SET classe=?, tipo=?, titolo=?, descrizione=?, materia=?, inizio=?, fine=?, tutto_il_giorno=? WHERE id=?`)
        .run(v.classe, v.tipo, v.titolo, v.descrizione, v.materia, v.inizio, v.fine, v.tutto ? 1 : 0, req.params.id);
    res.json({ ok: true });
});
router.delete("/feed", (req, res) => { db.prepare("UPDATE utenti SET ics_token_hash = NULL WHERE id = ?").run(req.utente.id); res.json({ ok: true }); });
router.delete("/:id", (req, res) => { mia(req); db.prepare("DELETE FROM agenda WHERE id = ?").run(req.params.id); res.json({ ok: true }); });

/* ---------------------------------------------------------------- ICS import (a file exported from any calendar) */
function unfold(s) { return s.replace(/\r?\n[ \t]/g, ""); }
const unescapeIcs = (v) => v.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1");
function parseData(valore, params) {
    const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(valore);
    if (!m) return null;
    if (!m[4]) return { tutto: true, ts: Date.UTC(+m[1], +m[2] - 1, +m[3]) };
    return { tutto: false, ts: m[7] ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() };
}
/** Minimal VEVENT parser: SUMMARY, DESCRIPTION, DTSTART, DTEND. Recurring events (RRULE) are skipped and counted. */
function leggiIcs(testoIcs) {
    const righe = unfold(testoIcs).split(/\r?\n/);
    const eventi = []; let cur = null, ricorrenti = 0;
    for (const riga of righe) {
        if (riga === "BEGIN:VEVENT") cur = {};
        else if (riga === "END:VEVENT") { if (cur && cur.inizio) eventi.push(cur); cur = null; }
        else if (cur) {
            const i = riga.indexOf(":"); if (i < 0) continue;
            const [nome, ...p] = riga.slice(0, i).split(";"), val = riga.slice(i + 1);
            if (nome === "SUMMARY") cur.titolo = unescapeIcs(val);
            else if (nome === "DESCRIPTION") cur.descrizione = unescapeIcs(val);
            else if (nome === "DTSTART") { const d = parseData(val, p); if (d) { cur.inizio = d.ts; cur.tutto = d.tutto; } }
            else if (nome === "DTEND") { const d = parseData(val, p); if (d) cur.fine = d.ts; }
            else if (nome === "RRULE") cur.ricorrente = true;
        }
    }
    return { eventi: eventi.filter((e) => !(e.ricorrente && ++ricorrenti)), ricorrenti };
}
router.post("/importa", express.text({ type: "*/*", limit: "400kb" }), (req, res) => {
    // text/plain body = the .ics file; query ?tipo=altro
    if (typeof req.body !== "string" || !req.body.includes("BEGIN:VCALENDAR")) throw new HttpError(400, "Il file non sembra un calendario .ics.");
    if (!req.utente.classe && !èAdmin(req)) throw new HttpError(400, "Imposta la tua classe nel profilo per importare nell'agenda di classe.", "classe_mancante");
    const tipo = TIPI.includes(req.query.tipo) ? req.query.tipo : "altro";
    const { eventi, ricorrenti } = leggiIcs(req.body);
    const ora = Date.now(), ins = db.prepare(`INSERT INTO agenda (id, scuola_id, classe, tipo, titolo, descrizione, materia, inizio, fine, tutto_il_giorno, autore_id, creato_il) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
    let importati = 0, scartati = 0;
    db.transaction(() => {
        for (const e of eventi.slice(0, 300)) {
            if (e.inizio < ora - 365 * GIORNO || e.inizio > ora + 2 * 365 * GIORNO) { scartati++; continue; }
            ins.run(S.uuid(), req.utente.scuola_id, req.utente.classe || null, tipo, (e.titolo || "(senza titolo)").slice(0, 120), (e.descrizione || "").slice(0, 1000), "", e.inizio, e.fine || null, e.tutto ? 1 : 0, req.utente.id, ora);
            importati++;
        }
    })();
    res.json({ importati, scartati: scartati + Math.max(0, eventi.length - 300), ricorrenti_saltati: ricorrenti });
});

/* ---------------------------------------------------------------- ICS export / private feed */
const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const dt = (ts) => new Date(ts).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
const dd = (ts) => new Date(ts).toISOString().slice(0, 10).replace(/-/g, "");
function creaIcs(lista, scuola) {
    const r = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hub Studenti//Calendar//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${esc("Hub Studenti – " + scuola)}`, "REFRESH-INTERVAL;VALUE=DURATION:PT6H"];
    for (const v of lista) {
        r.push("BEGIN:VEVENT", `UID:${v.id}@hubstudenti`, `DTSTAMP:${dt(Date.now())}`);
        if (v.tutto_il_giorno) { r.push(`DTSTART;VALUE=DATE:${dd(v.inizio)}`, `DTEND;VALUE=DATE:${dd(v.inizio + GIORNO)}`); }
        else { r.push(`DTSTART:${dt(v.inizio)}`); r.push(`DTEND:${dt(v.fine || v.inizio + 3600000)}`); }
        r.push(`SUMMARY:${esc((v.classe && v.origine === "agenda" ? `[${v.classe}] ` : "") + v.titolo)}`);
        if (v.descrizione) r.push(`DESCRIPTION:${esc(v.descrizione)}`);
        if (v.luogo) r.push(`LOCATION:${esc(v.luogo)}`);
        r.push(`CATEGORIES:${esc(v.tipo)}`, "END:VEVENT");
    }
    r.push("END:VCALENDAR");
    return r.join("\r\n").replace(/(.{74})(?=.)/g, "$1\r\n ") + "\r\n";     // fold at ~75 octets
}
router.get("/esporta.ics", (req, res) => {
    const ora = Date.now();
    const s = db.prepare("SELECT nome FROM scuole WHERE id = ?").get(req.utente.scuola_id).nome;
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="hub-studenti.ics"');
    res.send(creaIcs(voci(req.utente, ora - 30 * GIORNO, ora + 365 * GIORNO, { soloMiei: true }), s));
});
/** Creates (or replaces) the private subscription URL. The token is shown once; only its hash is stored. */
router.post("/feed", (req, res) => {
    const token = S.nuovoToken();
    db.prepare("UPDATE utenti SET ics_token_hash = ? WHERE id = ?").run(S.sha256(token), req.utente.id);
    res.json({ url: `/api/calendario-feed/${token}.ics` });
});

const limiteFeed = S.creaLimitatore(120, 60 * 60 * 1000);
feed.get("/:token.ics", (req, res) => {
    if (!limiteFeed.consenti(req.ip)) return res.status(429).end();
    const u = /^[A-Za-z0-9_-]{20,100}$/.test(req.params.token) ? db.prepare("SELECT * FROM utenti WHERE ics_token_hash = ? AND verificato = 1").get(S.sha256(req.params.token)) : null;
    if (!u || !require("./modules").attivo(u.scuola_id, "calendario")) return res.status(404).end();
    const ora = Date.now(), s = db.prepare("SELECT nome FROM scuole WHERE id = ?").get(u.scuola_id).nome;
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Cache-Control", "private, max-age=900");
    res.send(creaIcs(voci(u, ora - 30 * GIORNO, ora + 365 * GIORNO, { soloMiei: true }), s));
});

module.exports = { router, feed, voci, leggiIcs };
