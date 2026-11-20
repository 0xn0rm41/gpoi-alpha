"use strict";
/* routes-bar.js — pre-order of bar/canteen products (optional module, enabled per school by the operator).
   Payment happens at pickup: this module never handles money. Orders hold the user's name, so they are deleted after 30 days. */
const express = require("express");
const db = require("./db");
const S = require("./security");
const { testo, scelta, oraLocale } = require("./util");
const { richiediLogin, soloAdmin } = require("./routes-me");
const { richiediModulo, opzioniScuola } = require("./modules");
const { emetti } = require("./notifiche");
const { HttpError } = S;

const router = express.Router();
router.use(richiediLogin, richiediModulo("bar"));

const STATI = ["richiesto", "in_preparazione", "pronto", "ritirato", "annullato"];
const ATTIVI = ["richiesto", "in_preparazione", "pronto"];
const prezzo = (v) => { const n = Number(v); if (!Number.isInteger(n) || n < 0 || n > 10000) throw new HttpError(400, "Prezzo non valido (da 0 a 100 euro)."); return n; };
const codice = () => { const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; let c = ""; for (let i = 0; i < 4; i++) c += A[require("crypto").randomInt(A.length)]; return c; };

/* ---- menu + slots + my orders ---- */
router.get("/", (req, res) => {
    const s = req.utente.scuola_id, oggi = oraLocale(Date.now()).giorno;
    const admin = req.utente.ruolo === "admin";
    res.json({
        prodotti: db.prepare(`SELECT id, nome, descrizione, categoria, prezzo_cent, allergeni, disponibile FROM bar_prodotti WHERE scuola_id = ? ${admin ? "" : "AND disponibile = 1"} ORDER BY categoria, nome`).all(s),
        fasce: db.prepare(`SELECT id, etichetta, ora, cutoff_min, attiva FROM bar_fasce WHERE scuola_id = ? ${admin ? "" : "AND attiva = 1"} ORDER BY ora`).all(s),
        mie: ordini("o.utente_id = ? AND o.giorno >= ?", [req.utente.id, oggi]),
        opzioni: opzioniScuola(s, "bar"), oggi
    });
});

function ordini(where, args) {
    const rows = db.prepare(`SELECT o.*, f.etichetta fascia, f.ora ora_fascia, u.nome utente_nome, u.classe utente_classe FROM bar_ordini o
        JOIN bar_fasce f ON f.id = o.fascia_id JOIN utenti u ON u.id = o.utente_id WHERE ${where} ORDER BY o.giorno, f.ora, o.creato_il`).all(...args);
    const righe = db.prepare("SELECT nome, prezzo_cent, qta FROM bar_ordini_righe WHERE ordine_id = ?");
    return rows.map((o) => ({ id: o.id, giorno: o.giorno, fascia: o.fascia, ora: o.ora_fascia, codice: o.codice, stato: o.stato, nota: o.nota, totale_cent: o.totale_cent,
        utente: o.utente_nome, classe: o.utente_classe, righe: righe.all(o.id) }));
}

/* ---- place an order ---- */
const limite = S.creaLimitatore(30, 60 * 60 * 1000);
router.post("/ordini", (req, res) => {
    if (!limite.consenti(req.utente.id)) throw new HttpError(429, "Troppi ordini in poco tempo. Riprova più tardi.");
    const b = req.body || {}, s = req.utente.scuola_id, opz = opzioniScuola(s, "bar"), adesso = Date.now(), loc = oraLocale(adesso);
    const fascia = db.prepare("SELECT * FROM bar_fasce WHERE id = ? AND scuola_id = ? AND attiva = 1").get(String(b.fascia_id || ""), s);
    if (!fascia) throw new HttpError(404, "Fascia di ritiro non trovata.");
    const giorno = b.giorno ? String(b.giorno) : loc.giorno;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(giorno) || giorno < loc.giorno || giorno > new Date(adesso + 7 * 86400000).toISOString().slice(0, 10)) throw new HttpError(400, "Giorno non valido (entro i prossimi 7 giorni).");
    if (giorno === loc.giorno) {
        const [h, m] = fascia.ora.split(":").map(Number);
        if (h * 60 + m - fascia.cutoff_min <= loc.minuti) throw new HttpError(400, "Troppo tardi per questa fascia: le prenotazioni sono chiuse.", "fascia_chiusa");
    }
    if (!Array.isArray(b.righe) || !b.righe.length) throw new HttpError(400, "L'ordine è vuoto.");
    if (b.righe.length > opz.max_prodotti_per_ordine) throw new HttpError(400, `Troppi prodotti (massimo ${opz.max_prodotti_per_ordine}).`);
    const nota = testo(b.nota || "", "Nota", 0, 200);
    const id = S.uuid();
    db.transaction(() => {
        const n = db.prepare("SELECT COUNT(*) n FROM bar_ordini WHERE utente_id = ? AND giorno = ? AND stato IN ('richiesto','in_preparazione','pronto')").get(req.utente.id, giorno).n;
        if (n >= opz.max_ordini_al_giorno) throw new HttpError(400, `Hai già ${n} ordini attivi per quel giorno (massimo ${opz.max_ordini_al_giorno}).`);
        let totale = 0; const viste = new Set(), righe = [];
        for (const r of b.righe) {
            const q = Number(r && r.qta), pid = String(r && r.prodotto_id || "");
            if (!Number.isInteger(q) || q < 1 || q > 10 || viste.has(pid)) throw new HttpError(400, "Quantità o prodotti non validi.");
            viste.add(pid);
            const p = db.prepare("SELECT * FROM bar_prodotti WHERE id = ? AND scuola_id = ? AND disponibile = 1").get(pid, s);
            if (!p) throw new HttpError(400, "Un prodotto non è più disponibile.");
            totale += p.prezzo_cent * q; righe.push([p, q]);
        }
        let cod = codice();
        for (let i = 0; i < 20 && db.prepare("SELECT 1 FROM bar_ordini WHERE scuola_id = ? AND giorno = ? AND codice = ?").get(s, giorno, cod); i++) cod = codice();
        db.prepare("INSERT INTO bar_ordini (id, scuola_id, utente_id, fascia_id, giorno, codice, nota, totale_cent, creato_il, aggiornato_il) VALUES (?,?,?,?,?,?,?,?,?,?)")
            .run(id, s, req.utente.id, fascia.id, giorno, cod, nota, totale, adesso, adesso);
        const ins = db.prepare("INSERT INTO bar_ordini_righe (ordine_id, prodotto_id, nome, prezzo_cent, qta) VALUES (?,?,?,?,?)");
        for (const [p, q] of righe) ins.run(id, p.id, p.nome, p.prezzo_cent, q);
    })();
    res.json(ordini("o.id = ?", [id])[0]);
});
router.delete("/ordini/:id", (req, res) => {
    const o = db.prepare("SELECT * FROM bar_ordini WHERE id = ? AND scuola_id = ?").get(req.params.id, req.utente.scuola_id);
    if (!o || (o.utente_id !== req.utente.id && req.utente.ruolo !== "admin")) throw new HttpError(404, "Ordine non trovato.");
    if (o.stato !== "richiesto") throw new HttpError(400, "L'ordine è già in lavorazione: contatta il bar.");
    db.prepare("UPDATE bar_ordini SET stato = 'annullato', aggiornato_il = ? WHERE id = ?").run(Date.now(), o.id);
    res.json({ ok: true });
});

/* ---- admin: queue, status, menu, slots ---- */
router.get("/coda", soloAdmin, (req, res) => {
    const giorno = /^\d{4}-\d{2}-\d{2}$/.test(req.query.giorno || "") ? req.query.giorno : oraLocale(Date.now()).giorno;
    res.json({ giorno, ordini: ordini("o.scuola_id = ? AND o.giorno = ?", [req.utente.scuola_id, giorno]) });
});
router.patch("/ordini/:id", soloAdmin, (req, res) => {
    const o = db.prepare("SELECT * FROM bar_ordini WHERE id = ? AND scuola_id = ?").get(req.params.id, req.utente.scuola_id);
    if (!o) throw new HttpError(404, "Ordine non trovato.");
    const stato = scelta((req.body || {}).stato, STATI, "Stato");
    db.prepare("UPDATE bar_ordini SET stato = ?, aggiornato_il = ? WHERE id = ?").run(stato, Date.now(), o.id);
    if (stato !== o.stato && stato !== "richiesto")
        emetti({ scuolaId: o.scuola_id, chiave: "bar_ordine", categoria: "bar", dati: { c: o.codice, s: stato }, link: "/bacheca.html#bar", diretti: [o.utente_id] });
    res.json({ ok: true });
});
const prod = (req) => { const p = db.prepare("SELECT * FROM bar_prodotti WHERE id = ? AND scuola_id = ?").get(req.params.id, req.utente.scuola_id); if (!p) throw new HttpError(404, "Prodotto non trovato."); return p; };
router.post("/prodotti", soloAdmin, (req, res) => {
    const b = req.body || {}, id = S.uuid();
    if (db.prepare("SELECT COUNT(*) n FROM bar_prodotti WHERE scuola_id = ?").get(req.utente.scuola_id).n >= 300) throw new HttpError(400, "Troppi prodotti.");
    db.prepare("INSERT INTO bar_prodotti (id, scuola_id, nome, descrizione, categoria, prezzo_cent, allergeni, creato_il) VALUES (?,?,?,?,?,?,?,?)")
        .run(id, req.utente.scuola_id, testo(b.nome, "Nome", 1, 80), testo(b.descrizione || "", "Descrizione", 0, 300), testo(b.categoria || "", "Categoria", 0, 30), prezzo(b.prezzo_cent), testo(b.allergeni || "", "Allergeni", 0, 200), Date.now());
    res.json({ id });
});
router.patch("/prodotti/:id", soloAdmin, (req, res) => {
    const p = prod(req), b = req.body || {};
    db.prepare("UPDATE bar_prodotti SET nome=?, descrizione=?, categoria=?, prezzo_cent=?, allergeni=?, disponibile=? WHERE id=?")
        .run(b.nome === undefined ? p.nome : testo(b.nome, "Nome", 1, 80), b.descrizione === undefined ? p.descrizione : testo(b.descrizione, "Descrizione", 0, 300),
            b.categoria === undefined ? p.categoria : testo(b.categoria, "Categoria", 0, 30), b.prezzo_cent === undefined ? p.prezzo_cent : prezzo(b.prezzo_cent),
            b.allergeni === undefined ? p.allergeni : testo(b.allergeni, "Allergeni", 0, 200), b.disponibile === undefined ? p.disponibile : (b.disponibile ? 1 : 0), p.id);
    res.json({ ok: true });
});
router.delete("/prodotti/:id", soloAdmin, (req, res) => { const p = prod(req); db.prepare("DELETE FROM bar_prodotti WHERE id = ?").run(p.id); res.json({ ok: true }); });

const ORA = (v) => { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v))) throw new HttpError(400, "Ora non valida (HH:MM)."); return String(v); };
const cutoff = (v) => { const n = Number(v); if (!Number.isInteger(n) || n < 0 || n > 600) throw new HttpError(400, "Anticipo non valido (0–600 minuti)."); return n; };
router.post("/fasce", soloAdmin, (req, res) => {
    const b = req.body || {}, id = S.uuid();
    if (db.prepare("SELECT COUNT(*) n FROM bar_fasce WHERE scuola_id = ?").get(req.utente.scuola_id).n >= 20) throw new HttpError(400, "Troppe fasce.");
    db.prepare("INSERT INTO bar_fasce (id, scuola_id, etichetta, ora, cutoff_min) VALUES (?,?,?,?,?)").run(id, req.utente.scuola_id, testo(b.etichetta, "Etichetta", 1, 40), ORA(b.ora), b.cutoff_min === undefined ? 60 : cutoff(b.cutoff_min));
    res.json({ id });
});
router.patch("/fasce/:id", soloAdmin, (req, res) => {
    const f = db.prepare("SELECT * FROM bar_fasce WHERE id = ? AND scuola_id = ?").get(req.params.id, req.utente.scuola_id);
    if (!f) throw new HttpError(404, "Fascia non trovata.");
    const b = req.body || {};
    db.prepare("UPDATE bar_fasce SET etichetta=?, ora=?, cutoff_min=?, attiva=? WHERE id=?").run(b.etichetta === undefined ? f.etichetta : testo(b.etichetta, "Etichetta", 1, 40),
        b.ora === undefined ? f.ora : ORA(b.ora), b.cutoff_min === undefined ? f.cutoff_min : cutoff(b.cutoff_min), b.attiva === undefined ? f.attiva : (b.attiva ? 1 : 0), f.id);
    res.json({ ok: true });
});
router.delete("/fasce/:id", soloAdmin, (req, res) => {
    db.prepare("DELETE FROM bar_fasce WHERE id = ? AND scuola_id = ?").run(req.params.id, req.utente.scuola_id); res.json({ ok: true });
});

module.exports = { router };
