"use strict";
/* routes-macchinette.js — vending machines: which products, price, availability. Admins keep the catalogue,
   every student can report availability ("sold out" / "few left" / "available"). */
const express = require("express");
const db = require("./db");
const S = require("./security");
const { testo, scelta } = require("./util");
const { richiediLogin, soloAdmin } = require("./routes-me");
const { richiediModulo } = require("./modules");
const { emetti } = require("./notifiche");
const { HttpError } = S;

const router = express.Router();
router.use(richiediLogin, richiediModulo("macchinette"));

const TIPI = ["snack", "bevande", "caffe", "misto"], STATI = ["disponibile", "pochi", "esaurito"];
const FINESTRA_SEGNALAZIONI = 6 * 3600 * 1000;
const ora = () => Date.now();

function prezzo(v) {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > 10000) throw new HttpError(400, "Prezzo non valido (da 0 a 100 euro).");
    return n;
}
function distributore(req) {
    const d = db.prepare("SELECT * FROM distributori WHERE id = ? AND scuola_id = ?").get(req.params.id, req.utente.scuola_id);
    if (!d) throw new HttpError(404, "Distributore non trovato.");
    return d;
}
function prodotto(req) {
    const p = db.prepare("SELECT * FROM distributori_prodotti WHERE id = ? AND scuola_id = ?").get(req.params.pid, req.utente.scuola_id);
    if (!p) throw new HttpError(404, "Prodotto non trovato.");
    return p;
}

router.get("/", (req, res) => {
    const S0 = req.utente.scuola_id, t = ora();
    const ds = db.prepare("SELECT * FROM distributori WHERE scuola_id = ? ORDER BY nome").all(S0);
    const ps = db.prepare("SELECT * FROM distributori_prodotti WHERE scuola_id = ? ORDER BY categoria, nome").all(S0);
    const seg = db.prepare(`SELECT s.prodotto_id, s.stato, COUNT(*) n, MAX(s.creato_il) ultimo FROM distributori_segnalazioni s
                            JOIN distributori_prodotti p ON p.id = s.prodotto_id WHERE p.scuola_id = ? AND s.creato_il > ? GROUP BY s.prodotto_id, s.stato`).all(S0, t - FINESTRA_SEGNALAZIONI);
    const mie = Object.fromEntries(db.prepare("SELECT prodotto_id, stato FROM distributori_segnalazioni WHERE utente_id = ? AND creato_il > ?").all(req.utente.id, t - FINESTRA_SEGNALAZIONI).map((r) => [r.prodotto_id, r.stato]));
    res.json({
        distributori: ds.map((d) => ({ id: d.id, nome: d.nome, ubicazione: d.ubicazione, tipo: d.tipo, attivo: !!d.attivo,
            prodotti: ps.filter((p) => p.distributore_id === d.id).map((p) => ({
                id: p.id, nome: p.nome, categoria: p.categoria, prezzo_cent: p.prezzo_cent, stato: p.stato, fonte: p.fonte, aggiornato_il: p.aggiornato_il,
                segnalazioni: seg.filter((s) => s.prodotto_id === p.id).map((s) => ({ stato: s.stato, n: s.n })), mia_segnalazione: mie[p.id] || null })) })),
        tipi: TIPI, stati: STATI
    });
});

/* ---- admin: catalogue ---- */
router.post("/", soloAdmin, (req, res) => {
    const b = req.body || {}, id = S.uuid(), t = ora();
    db.transaction(() => {
        db.prepare("INSERT INTO distributori (id, scuola_id, nome, ubicazione, tipo, creato_il) VALUES (?,?,?,?,?,?)")
            .run(id, req.utente.scuola_id, testo(b.nome, "Nome", 1, 60), testo(b.ubicazione, "Ubicazione", 0, 100), scelta(b.tipo || "misto", TIPI, "Tipo"), t);
        if (Array.isArray(b.prodotti)) {
            if (b.prodotti.length > 80) throw new HttpError(400, "Troppi prodotti in una volta (massimo 80).");
            const ins = db.prepare("INSERT INTO distributori_prodotti (id, distributore_id, scuola_id, nome, categoria, prezzo_cent, aggiornato_il) VALUES (?,?,?,?,?,?,?)");
            for (const p of b.prodotti) ins.run(S.uuid(), id, req.utente.scuola_id, testo(p.nome, "Prodotto", 1, 80), testo(p.categoria, "Categoria", 0, 30), prezzo(p.prezzo_cent), t);
        }
    })();
    res.json({ id });
});
router.patch("/:id", soloAdmin, (req, res) => {
    const d = distributore(req), b = req.body || {};
    db.prepare("UPDATE distributori SET nome = ?, ubicazione = ?, tipo = ?, attivo = ? WHERE id = ?")
        .run(b.nome === undefined ? d.nome : testo(b.nome, "Nome", 1, 60), b.ubicazione === undefined ? d.ubicazione : testo(b.ubicazione, "Ubicazione", 0, 100),
             b.tipo === undefined ? d.tipo : scelta(b.tipo, TIPI, "Tipo"), b.attivo === undefined ? d.attivo : (b.attivo ? 1 : 0), d.id);
    res.json({ ok: true });
});
router.delete("/:id", soloAdmin, (req, res) => { const d = distributore(req); db.prepare("DELETE FROM distributori WHERE id = ?").run(d.id); res.json({ ok: true }); });

router.post("/:id/prodotti", soloAdmin, (req, res) => {
    const d = distributore(req), b = req.body || {}, id = S.uuid();
    if (db.prepare("SELECT COUNT(*) n FROM distributori_prodotti WHERE distributore_id = ?").get(d.id).n >= 120) throw new HttpError(400, "Troppi prodotti in questo distributore.");
    db.prepare("INSERT INTO distributori_prodotti (id, distributore_id, scuola_id, nome, categoria, prezzo_cent, stato, aggiornato_il) VALUES (?,?,?,?,?,?,?,?)")
        .run(id, d.id, req.utente.scuola_id, testo(b.nome, "Prodotto", 1, 80), testo(b.categoria, "Categoria", 0, 30), prezzo(b.prezzo_cent), scelta(b.stato || "disponibile", STATI, "Stato"), ora());
    res.json({ id });
});
router.patch("/prodotti/:pid", soloAdmin, (req, res) => {
    const p = prodotto(req), b = req.body || {};
    db.prepare("UPDATE distributori_prodotti SET nome = ?, categoria = ?, prezzo_cent = ?, stato = ?, fonte = 'admin', aggiornato_il = ? WHERE id = ?")
        .run(b.nome === undefined ? p.nome : testo(b.nome, "Prodotto", 1, 80), b.categoria === undefined ? p.categoria : testo(b.categoria, "Categoria", 0, 30),
             b.prezzo_cent === undefined ? p.prezzo_cent : prezzo(b.prezzo_cent), b.stato === undefined ? p.stato : scelta(b.stato, STATI, "Stato"), ora(), p.id);
    if (b.stato !== undefined) db.prepare("DELETE FROM distributori_segnalazioni WHERE prodotto_id = ?").run(p.id);   // an official update resets crowd reports
    res.json({ ok: true });
});
router.delete("/prodotti/:pid", soloAdmin, (req, res) => { const p = prodotto(req); db.prepare("DELETE FROM distributori_prodotti WHERE id = ?").run(p.id); res.json({ ok: true }); });

/* ---- everybody: availability report ---- */
const limite = S.creaLimitatore(40, 60 * 60 * 1000);
router.put("/prodotti/:pid/segnala", (req, res) => {
    if (!limite.consenti(req.utente.id)) throw new HttpError(429, "Troppe segnalazioni in poco tempo. Riprova più tardi.");
    const p = prodotto(req), stato = scelta((req.body || {}).stato, STATI, "Stato"), t = ora();
    db.prepare(`INSERT INTO distributori_segnalazioni (prodotto_id, utente_id, stato, creato_il) VALUES (?,?,?,?)
                ON CONFLICT (prodotto_id, utente_id) DO UPDATE SET stato = excluded.stato, creato_il = excluded.creato_il`).run(p.id, req.utente.id, stato, t);
    // current status = most reported value in the last hours (ties: the most recent report wins)
    const righe = db.prepare("SELECT stato, COUNT(*) n, MAX(creato_il) ultimo FROM distributori_segnalazioni WHERE prodotto_id = ? AND creato_il > ? GROUP BY stato").all(p.id, t - FINESTRA_SEGNALAZIONI);
    righe.sort((x, y) => y.n - x.n || y.ultimo - x.ultimo);
    const nuovo = righe[0].stato;
    db.prepare("UPDATE distributori_prodotti SET stato = ?, fonte = 'studenti', aggiornato_il = ? WHERE id = ?").run(nuovo, t, p.id);
    if (nuovo !== p.stato && (nuovo === "esaurito" || p.stato === "esaurito"))
        emetti({ scuolaId: req.utente.scuola_id, categoria: "distributori", chiave: "macchinetta", dati: { t: p.nome, q: nuovo }, link: "/bacheca.html#macchinette", escludi: req.utente.id });
    res.json({ ok: true, stato: nuovo });
});
router.delete("/prodotti/:pid/segnala", (req, res) => {
    prodotto(req); db.prepare("DELETE FROM distributori_segnalazioni WHERE prodotto_id = ? AND utente_id = ?").run(req.params.pid, req.utente.id);
    res.json({ ok: true });
});

module.exports = { router };
