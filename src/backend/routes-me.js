"use strict";
/* routes-me.js — sessione (middleware) e diritti dell'utente sui propri dati (GDPR):
   accesso e portabilità (export), rettifica (modifica profilo), cancellazione (elimina account). */
const fs = require("fs");
const path = require("path");
const express = require("express");
const db = require("./db");
const config = require("./config");
const S = require("./security");
const { testo, asincrona } = require("./util");
const { controllaPassword } = require("./routes-auth");

const { HttpError } = S;
const GIORNO = 86400000;

/** Middleware: carica l'utente dalla sessione (cookie) oppure risponde 401. */
function richiediLogin(req, res, next) {
    const t = S.leggiCookie(req, S.NOME_COOKIE);
    if (!t) return res.status(401).json({ error: "Accesso richiesto." });
    const h = S.sha256(t);
    const riga = db.prepare(`SELECT u.*, s.scade_il FROM sessioni s JOIN utenti u ON u.id = s.utente_id
                             WHERE s.token_hash = ?`).get(h);
    if (!riga || riga.scade_il < Date.now() || !riga.verificato) {
        if (riga) db.prepare("DELETE FROM sessioni WHERE token_hash = ?").run(h);
        S.cancellaCookieSessione(res);
        return res.status(401).json({ error: "Sessione scaduta: accedi di nuovo." });
    }
    if (Date.now() - riga.ultimo_accesso > GIORNO)
        db.prepare("UPDATE utenti SET ultimo_accesso = ? WHERE id = ?").run(Date.now(), riga.id);
    const sc = db.prepare("SELECT attiva FROM scuole WHERE id = ?").get(riga.scuola_id);
    if (!sc || !sc.attiva) return res.status(403).json({ error: "La community della tua scuola è temporaneamente sospesa.", codice: "scuola_sospesa" });
    req.utente = riga;
    next();
}
const soloAdmin = (req, res, next) => (req.utente.ruolo === "admin" ? next() : res.status(403).json({ error: "Solo per gli amministratori." }));

const nomeScuola = (u) => (db.prepare("SELECT nome FROM scuole WHERE id = ?").get(u.scuola_id) || {}).nome || null;
const pubblico = (u) => ({ id: u.id, scuola: nomeScuola(u), email: u.email, nome: u.nome, cognome: u.cognome, classe: u.classe,
    admin: u.ruolo === "admin", creato_il: u.creato_il, consenso_il: u.consenso_il, consenso_versione: u.consenso_versione });

const router = express.Router();
router.use(richiediLogin);

router.get("/", (req, res) => {
    const q = (sql) => db.prepare(sql).get(req.utente.id).n;
    res.json({
        utente: pubblico(req.utente),
        statistiche: {
            idee: q("SELECT COUNT(*) n FROM idee WHERE autore_id = ?"),
            appunti: q("SELECT COUNT(*) n FROM appunti WHERE autore_id = ?"),
            libri: q("SELECT COUNT(*) n FROM libri WHERE venditore_id = ?"),
            eventi: q("SELECT COUNT(*) n FROM partecipazioni WHERE utente_id = ?")
        },
        informativa_corrente: config.VERSIONE_INFORMATIVA
    });
});

// Rettifica dei dati
router.patch("/", (req, res) => {
    const b = req.body || {};
    const nome = testo(b.nome, "Nome", 1, 60), cognome = testo(b.cognome, "Cognome", 1, 60);
    const classe = b.classe ? testo(b.classe, "Classe", 2, 6).toUpperCase() : null;
    if (classe && !/^[1-5]ª[A-Z0-9]{1,3}$/.test(classe)) throw new HttpError(400, "Classe non valida.");
    db.prepare("UPDATE utenti SET nome = ?, cognome = ?, classe = ? WHERE id = ?").run(nome, cognome, classe, req.utente.id);
    res.json({ ok: true });
});

// Cambio password (richiede la vecchia; chiude le altre sessioni)
router.post("/password", asincrona(async (req, res) => {
    const b = req.body || {};
    if (typeof b.vecchia !== "string" || !(await S.verificaPassword(b.vecchia, req.utente.pw_hash)))
        throw new HttpError(400, "La password attuale non è corretta.");
    controllaPassword(b.nuova, req.utente.email);
    const hash = await S.hashPassword(b.nuova);
    db.prepare("UPDATE utenti SET pw_hash = ? WHERE id = ?").run(hash, req.utente.id);
    const mia = S.sha256(S.leggiCookie(req, S.NOME_COOKIE));
    db.prepare("DELETE FROM sessioni WHERE utente_id = ? AND token_hash <> ?").run(req.utente.id, mia);
    res.json({ ok: true });
}));

// Accesso e portabilità: scarica tutti i propri dati in un file JSON leggibile
router.get("/export", (req, res) => {
    const id = req.utente.id, all = (sql) => db.prepare(sql).all(id);
    const foto = (nome) => {
        try { return "data:image/jpeg;base64," + fs.readFileSync(path.join(config.UPLOAD_DIR, nome)).toString("base64"); }
        catch (e) { return null; }
    };
    const dati = {
        _info: "Esportazione dei tuoi dati personali da Hub Studenti (art. 15 e 20 GDPR).",
        esportato_il: new Date().toISOString(),
        profilo: pubblico(req.utente),
        partecipazioni_eventi: all(`SELECT e.titolo, e.inizio, p.creato_il FROM partecipazioni p JOIN eventi e ON e.id = p.evento_id WHERE p.utente_id = ?`),
        idee_proposte: all("SELECT titolo, descrizione, stato, creato_il FROM idee WHERE autore_id = ?"),
        idee_sostenute: all("SELECT i.titolo, v.creato_il FROM voti_idee v JOIN idee i ON i.id = v.idea_id WHERE v.utente_id = ?"),
        sondaggi_creati: all("SELECT domanda, creato_il FROM sondaggi WHERE autore_id = ?"),
        sondaggi_votati: all(`SELECT s.domanda, o.testo AS opzione, v.creato_il FROM sondaggi_voti v
                              JOIN sondaggi s ON s.id = v.sondaggio_id JOIN sondaggi_opzioni o ON o.id = v.opzione_id WHERE v.utente_id = ?`),
        appunti: all("SELECT titolo, materia, testo, foto, creato_il FROM appunti WHERE autore_id = ?").map((a) => ({ ...a, foto: foto(a.foto) })),
        voti_appunti: all("SELECT a.titolo, v.valore FROM appunti_voti v JOIN appunti a ON a.id = v.appunto_id WHERE v.utente_id = ?"),
        commenti: all("SELECT testo, creato_il FROM commenti_appunti WHERE autore_id = ?"),
        libri: all("SELECT titolo, materia, classe, condizione, prezzo_cent, nota, stato, creato_il FROM libri WHERE venditore_id = ?"),
        richieste_libri: all("SELECT l.titolo, r.stato, r.creato_il FROM richieste_libri r JOIN libri l ON l.id = r.libro_id WHERE r.richiedente_id = ?"),
        segnalazioni_inviate: all("SELECT tipo, motivo, stato, creato_il FROM segnalazioni WHERE segnalato_da = ?"),
        sessioni_attive: db.prepare("SELECT COUNT(*) n FROM sessioni WHERE utente_id = ? AND scade_il > ?").get(id, Date.now()).n
    };
    res.setHeader("Content-Disposition", 'attachment; filename="i-miei-dati-hub-studenti.json"');
    res.type("application/json").send(JSON.stringify(dati, null, 2));
});

// Cancellazione dell'account e di tutti i suoi contenuti
router.delete("/", asincrona(async (req, res) => {
    const b = req.body || {};
    if (b.conferma !== true || typeof b.password !== "string" || !(await S.verificaPassword(b.password, req.utente.pw_hash)))
        throw new HttpError(400, "Password non corretta o conferma mancante.");
    db.eliminaUtente(req.utente.id);
    S.cancellaCookieSessione(res);
    res.json({ ok: true });
}));

module.exports = { router, richiediLogin, soloAdmin };
