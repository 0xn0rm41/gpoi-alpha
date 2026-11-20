"use strict";
/* notifiche.js — follow bell: subscriptions, in-app notifications, batched e-mail digests (opt-in).
   Content routes call emetti({...}); followers of the category or of the specific object get a notification row.
   A worker sends ONE digest e-mail per user (never one e-mail per post). Everything is opt-in: default frequency is "off". */
const express = require("express");
const db = require("./db");
const S = require("./security");
const mail = require("./mail");
const { asincrona } = require("./util");
const { richiediLogin } = require("./routes-me");
const { HttpError } = S;

const CATEGORIE = ["eventi", "comunicazioni", "idee", "sondaggi", "appunti", "libri", "agenda", "assemblee", "distributori", "bar"];
const OGGETTI = ["idea", "sondaggio", "libro", "appunto"];        // follow a single object: updates, results, comments, requests
const FREQ = ["off", "subito", "giornaliera"];

/* Message catalogue: key -> { it, en } functions of the JSON parameters. Titles are rendered when read or e-mailed, in the reader's language. */
const STATI = {
    it: { inviata: "inviata", approvata: "approvata", rifiutata: "rifiutata", annullata: "annullata", svolta: "svolta", richiesto: "richiesto", in_preparazione: "in preparazione", pronto: "pronto per il ritiro", ritirato: "ritirato", annullato: "annullato", disponibile: "di nuovo disponibile", pochi: "ne restano pochi", esaurito: "esaurito" },
    en: { inviata: "submitted", approvata: "approved", rifiutata: "rejected", annullata: "cancelled", svolta: "held", richiesto: "requested", in_preparazione: "being prepared", pronto: "ready for pickup", ritirato: "picked up", annullato: "cancelled", disponibile: "available again", pochi: "few left", esaurito: "sold out" }
};
const st = (l, k) => (STATI[l][k] || k);
const TESTI = {
    evento:           { it: (d) => ({ titolo: `Nuovo evento: ${d.t}` }),                 en: (d) => ({ titolo: `New event: ${d.t}` }) },
    comunicazione:    { it: (d) => ({ titolo: `Nuovo avviso: ${d.t}` }),                  en: (d) => ({ titolo: `New announcement: ${d.t}` }) },
    idea_nuova:       { it: (d) => ({ titolo: `Nuova idea: ${d.t}` }),                    en: (d) => ({ titolo: `New idea: ${d.t}` }) },
    idea_esposta:     { it: (d) => ({ titolo: `Idea portata in assemblea: ${d.t}` }),     en: (d) => ({ titolo: `Idea taken to the assembly: ${d.t}` }) },
    sondaggio_nuovo:  { it: (d) => ({ titolo: `Nuovo sondaggio: ${d.t}` }),               en: (d) => ({ titolo: `New poll: ${d.t}` }) },
    sondaggio_chiuso: { it: (d) => ({ titolo: `Risultati del sondaggio: ${d.t}`, dettaglio: d.r }), en: (d) => ({ titolo: `Poll results: ${d.t}`, dettaglio: d.r }) },
    appunto_nuovo:    { it: (d) => ({ titolo: `Nuovi appunti: ${d.t}` }),                 en: (d) => ({ titolo: `New notes: ${d.t}` }) },
    commento:         { it: (d) => ({ titolo: `Nuovo commento su: ${d.t}` }),             en: (d) => ({ titolo: `New comment on: ${d.t}` }) },
    libro_nuovo:      { it: (d) => ({ titolo: `Nuovo libro: ${d.t}` }),                   en: (d) => ({ titolo: `New book: ${d.t}` }) },
    libro_accettata:  { it: (d) => ({ titolo: `Richiesta accettata: ${d.t}` }),           en: (d) => ({ titolo: `Request accepted: ${d.t}` }) },
    agenda_nuova:     { it: (d) => ({ titolo: `Nuovo in agenda (${d.c}): ${d.t}`, dettaglio: d.q }), en: (d) => ({ titolo: `New in the agenda (${d.c}): ${d.t}`, dettaglio: d.q }) },
    assemblea_stato:  { it: (d) => ({ titolo: `Assemblea di classe ${d.c}: ${st('it', d.s)}`, dettaglio: d.m }), en: (d) => ({ titolo: `Class assembly ${d.c}: ${st('en', d.s)}`, dettaglio: d.m }) },
    macchinetta:      { it: (d) => ({ titolo: `Distributore: ${d.t}`, dettaglio: st('it', d.q) }),   en: (d) => ({ titolo: `Vending machine: ${d.t}`, dettaglio: st('en', d.q) }) },
    bar_ordine:       { it: (d) => ({ titolo: `Ordine bar ${d.c}: ${st('it', d.s)}` }),             en: (d) => ({ titolo: `Bar order ${d.c}: ${st('en', d.s)}` }) }
};
function rendi(lingua, chiave, dati) {
    const f = TESTI[chiave]; let d = {}; try { d = JSON.parse(dati) || {}; } catch { /* keep empty */ }
    const o = f ? f[lingua === "en" ? "en" : "it"](d) : { titolo: chiave };
    return { titolo: String(o.titolo || "").slice(0, 200), dettaglio: String(o.dettaglio || "").slice(0, 300) };
}

/** Creates notifications for followers. { scuolaId, categoria, oggetto?:{tipo,ref}, chiave, dati, link?, escludi?:userId, diretti?:[userId] }
    `diretti` are notified regardless of what they follow (e.g. the user whose request was accepted). */
function emetti({ scuolaId, categoria, oggetto, chiave, dati = {}, link = "", escludi = null, diretti = [] }) {
    const ora = Date.now();
    const destinatari = new Map();
    const q = db.prepare(`SELECT DISTINCT i.utente_id AS id FROM iscrizioni i JOIN utenti u ON u.id = i.utente_id
                          WHERE u.scuola_id = ? AND u.verificato = 1 AND i.tipo = ? AND i.ref = ?`);
    if (categoria) for (const r of q.all(scuolaId, categoria, "")) destinatari.set(r.id, 1);
    if (oggetto) for (const r of q.all(scuolaId, oggetto.tipo, oggetto.ref)) destinatari.set(r.id, 1);
    for (const id of diretti) destinatari.set(id, 1);
    if (escludi) destinatari.delete(escludi);
    const ins = db.prepare("INSERT INTO notifiche (id, utente_id, tipo, chiave, dati, link, creato_il) VALUES (?,?,?,?,?,?,?)");
    const json = JSON.stringify(dati);
    db.transaction(() => { for (const id of destinatari.keys()) ins.run(S.uuid(), id, categoria || (oggetto && oggetto.tipo) || chiave, chiave, json, link, ora); })();
    return destinatari.size;
}

/* ---------------------------------------------------------------- routes (logged in) */
const router = express.Router();
router.use(richiediLogin);

router.get("/", (req, res) => {
    const u = req.utente.id;
    const elenco = db.prepare("SELECT id, tipo, chiave, dati, link, creato_il, letta FROM notifiche WHERE utente_id = ? ORDER BY creato_il DESC LIMIT 40").all(u)
        .map((n) => ({ id: n.id, tipo: n.tipo, link: n.link, creato_il: n.creato_il, letta: !!n.letta, ...rendi(req.utente.lingua, n.chiave, n.dati) }));
    const non_lette = db.prepare("SELECT COUNT(*) n FROM notifiche WHERE utente_id = ? AND letta = 0").get(u).n;
    res.json({ elenco, non_lette });
});
router.post("/lette", (req, res) => {
    db.prepare("UPDATE notifiche SET letta = 1 WHERE utente_id = ?").run(req.utente.id);
    res.json({ ok: true });
});

router.get("/preferenze", (req, res) => {
    const seguiti = db.prepare("SELECT tipo, ref FROM iscrizioni WHERE utente_id = ?").all(req.utente.id);
    res.json({ frequenza: req.utente.notifiche_freq, categorie: CATEGORIE, seguiti });
});
router.put("/preferenze", (req, res) => {
    const f = (req.body || {}).frequenza;
    if (!FREQ.includes(f)) throw new HttpError(400, "Frequenza non valida.");
    db.prepare("UPDATE utenti SET notifiche_freq = ? WHERE id = ?").run(f, req.utente.id);
    if (f !== "off" && !req.utente.disiscr_token) db.prepare("UPDATE utenti SET disiscr_token = ? WHERE id = ?").run(S.nuovoToken(), req.utente.id);
    res.json({ ok: true, frequenza: f });
});

/** Follow / unfollow. Body: { tipo, ref? } — a category (ref omitted) or a single object. */
function validaSegui(b) {
    const tipo = String((b || {}).tipo || ""), ref = String((b || {}).ref || "");
    if (CATEGORIE.includes(tipo) && ref === "") return { tipo, ref };
    if (OGGETTI.includes(tipo) && /^[0-9a-f-]{36}$/.test(ref)) return { tipo, ref };
    throw new HttpError(400, "Cosa vuoi seguire?");
}
router.put("/segui", (req, res) => {
    const { tipo, ref } = validaSegui(req.body);
    const n = db.prepare("SELECT COUNT(*) n FROM iscrizioni WHERE utente_id = ?").get(req.utente.id).n;
    if (n >= 200) throw new HttpError(400, "Segui già troppe cose.");
    db.prepare("INSERT OR IGNORE INTO iscrizioni (utente_id, tipo, ref, creato_il) VALUES (?,?,?,?)").run(req.utente.id, tipo, ref, Date.now());
    res.json({ ok: true });
});
router.delete("/segui", (req, res) => {
    const { tipo, ref } = validaSegui(req.body);
    db.prepare("DELETE FROM iscrizioni WHERE utente_id = ? AND tipo = ? AND ref = ?").run(req.utente.id, tipo, ref);
    res.json({ ok: true });
});

/* ---------------------------------------------------------------- public one-click unsubscribe */
const pubblico = express.Router();
const limite = S.creaLimitatore(30, 60 * 60 * 1000);
pubblico.post("/disiscrivi", (req, res) => {
    if (!limite.consenti(req.ip)) throw new HttpError(429, "Troppe richieste.");
    const t = String((req.body || {}).token || "");
    if (!/^[A-Za-z0-9_-]{20,100}$/.test(t)) throw new HttpError(400, "Link non valido.");
    const r = db.prepare("UPDATE utenti SET notifiche_freq = 'off' WHERE disiscr_token = ?").run(t);
    if (!r.changes) throw new HttpError(400, "Link non valido o già usato.");
    res.json({ ok: true });
});

/* ---------------------------------------------------------------- digest worker */
const GIORNO = 86400000;
/** Sends pending notifications. 'subito' = grouped, sent once the oldest pending item is 10 minutes old; 'giornaliera' = once a day at 07:00 school time. */
async function inviaDigest(ora = Date.now()) {
    const { oraLocale } = require("./util");
    const loc = oraLocale(ora);
    const utenti = db.prepare(`SELECT u.id, u.email, u.nome, u.lingua, u.notifiche_freq AS f, u.disiscr_token AS tok, MIN(n.creato_il) AS primo
                               FROM utenti u JOIN notifiche n ON n.utente_id = u.id
                               WHERE n.inviata_il IS NULL AND u.notifiche_freq != 'off' AND u.verificato = 1 GROUP BY u.id`).all();
    let inviati = 0;
    for (const u of utenti) {
        const pronto = u.f === "subito" ? ora - u.primo >= 10 * 60 * 1000 : (loc.minuti >= 7 * 60 && loc.minuti < 7 * 60 + 30) || ora - u.primo >= 26 * 3600 * 1000;
        if (!pronto) continue;
        const righe = db.prepare("SELECT id, chiave, dati, link FROM notifiche WHERE utente_id = ? AND inviata_il IS NULL ORDER BY creato_il LIMIT 25").all(u.id);
        const voci = righe.map((r) => ({ id: r.id, link: r.link, ...rendi(u.lingua, r.chiave, r.dati) }));
        if (!voci.length) continue;
        try {
            await mail.inviaDigest(u.email, u.nome, u.lingua, voci, u.tok || "");
            db.prepare(`UPDATE notifiche SET inviata_il = ? WHERE id IN (${voci.map(() => "?").join(",")})`).run(ora, ...voci.map((v) => v.id));
            inviati++;
        } catch (e) { console.error("Invio digest fallito:", e.message); }
    }
    db.prepare("DELETE FROM notifiche WHERE (inviata_il IS NOT NULL AND inviata_il < ?) OR creato_il < ?").run(ora - 7 * GIORNO, ora - 30 * GIORNO);
    return inviati;
}
function avviaDigest() {
    const t = setInterval(() => inviaDigest().catch((e) => console.error("Digest:", e.message)), 5 * 60 * 1000);
    t.unref();
}

module.exports = { router, pubblico, emetti, rendi, inviaDigest, avviaDigest, CATEGORIE };
