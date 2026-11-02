"use strict";
/* routes-auth.js — registrazione, verifica email, accesso, recupero password. */
const express = require("express");
const db = require("./db");
const config = require("./config");
const mail = require("./mail");
const S = require("./security");
const { testo, asincrona } = require("./util");

const router = express.Router();
const { HttpError } = S;

const limiteIP = S.creaLimitatore(40, 15 * 60 * 1000);          // tentativi di accesso per IP
const limiteCoppia = S.creaLimitatore(6, 15 * 60 * 1000);       // tentativi sbagliati per IP+email
const limiteRegistrazioni = S.creaLimitatore(config.REGISTRAZIONI_ORA_PER_IP, 60 * 60 * 1000);
const limiteEmail = S.creaLimitatore(5, 60 * 60 * 1000);

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GIORNO = 86400000;

function normalizzaEmail(v) {
    if (typeof v !== "string") throw new HttpError(400, "Email non valida.");
    const e = v.trim().toLowerCase();
    if (e.length > 254 || !RE_EMAIL.test(e)) throw new HttpError(400, "Email non valida.");
    return e;
}
/** Finds the school from the invite code; applies the optional per-school email domain restriction. */
function trovaScuola(codice, email) {
    const c = db.normalizzaCodice(codice);
    const sc = c.length === 10 ? db.prepare("SELECT * FROM scuole WHERE codice_invito = ? AND attiva = 1").get(c) : null;
    if (!sc) throw new HttpError(400, "Codice scuola non valido. Chiedilo al rappresentante o all'amministratore della tua scuola.", "codice");
    if (sc.dominio_email && !email.endsWith(sc.dominio_email))
        throw new HttpError(400, `Questa scuola accetta solo email che finiscono con ${sc.dominio_email}.`, "dominio");
    return sc;
}
function controllaPassword(p, email) {
    if (typeof p !== "string" || p.length < config.PASSWORD_MIN)
        throw new HttpError(400, `La password deve avere almeno ${config.PASSWORD_MIN} caratteri.`, "password");
    if (p.length > 200) throw new HttpError(400, "Password troppo lunga.", "password");
    if (email && p.toLowerCase() === email.toLowerCase()) throw new HttpError(400, "La password non può essere uguale all'email.", "password");
}

function creaToken(utenteId, scopo, durataMs) {
    db.prepare("DELETE FROM token_email WHERE utente_id = ? AND scopo = ?").run(utenteId, scopo);
    const token = S.nuovoToken();
    db.prepare("INSERT INTO token_email (token_hash, utente_id, scopo, scade_il) VALUES (?,?,?,?)")
        .run(S.sha256(token), utenteId, scopo, Date.now() + durataMs);
    return token;
}
function consumaToken(token, scopo) {
    if (typeof token !== "string" || token.length < 20 || token.length > 100) return null;
    const riga = db.prepare("SELECT utente_id, scade_il FROM token_email WHERE token_hash = ? AND scopo = ?").get(S.sha256(token), scopo);
    if (!riga) return null;
    db.prepare("DELETE FROM token_email WHERE token_hash = ?").run(S.sha256(token));
    return riga.scade_il >= Date.now() ? riga.utente_id : null;
}

/** Crea la sessione e imposta il cookie. */
function apriSessione(res, utenteId) {
    const token = S.nuovoToken(), ora = Date.now();
    db.prepare("INSERT INTO sessioni (token_hash, utente_id, creata_il, scade_il) VALUES (?,?,?,?)")
        .run(S.sha256(token), utenteId, ora, ora + config.SESSIONE_GIORNI * GIORNO);
    S.impostaCookieSessione(res, token, config.SESSIONE_GIORNI);
    db.prepare("UPDATE utenti SET ultimo_accesso = ? WHERE id = ?").run(ora, utenteId);
}

router.post("/register", asincrona(async (req, res) => {
    if (!limiteRegistrazioni.consenti(req.ip)) throw new HttpError(429, "Troppe registrazioni da questa rete. Riprova più tardi.");
    const b = req.body || {};
    const nome = testo(b.nome, "Nome", 1, 60), cognome = testo(b.cognome, "Cognome", 1, 60);
    const email = normalizzaEmail(b.email);
    const scuola = trovaScuola(b.codice_scuola, email);
    const classe = b.classe ? testo(b.classe, "Classe", 2, 6).toUpperCase() : null;      // optional
    if (classe && !/^[1-5]ª[A-Z0-9]{1,3}$/.test(classe)) throw new HttpError(400, "Classe non valida.");
    controllaPassword(b.password, email);
    if (b.consenso !== true) throw new HttpError(400, "Devi accettare le regole e l'informativa privacy.", "consenso");
    if (b.eta14 !== true) throw new HttpError(400, "Per registrarti devi avere almeno 14 anni (sotto i 14 serve il consenso dei genitori: parlane con la scuola).", "eta");

    const hash = await S.hashPassword(b.password);       // calcolata sempre: tempi di risposta uguali
    const esistente = db.prepare("SELECT id, nome FROM utenti WHERE email = ?").get(email);
    if (esistente) {
        mail.inviaGiaRegistrato(email, esistente.nome).catch((e) => console.error("Invio email fallito:", e.message));
    } else {
        const id = S.uuid(), ora = Date.now();
        db.prepare(`INSERT INTO utenti (id, email, nome, cognome, classe, pw_hash, verificato, consenso_il, consenso_versione, creato_il, ultimo_accesso, scuola_id)
                    VALUES (?,?,?,?,?,?,0,?,?,?,?,?)`).run(id, email, nome, cognome, classe, hash, ora, config.VERSIONE_INFORMATIVA, ora, ora, scuola.id);
        const token = creaToken(id, "verifica", GIORNO);
        mail.inviaVerifica(email, nome, token).catch((e) => console.error("Invio email fallito:", e.message));
    }
    // Risposta identica in entrambi i casi: non si rivela se l'email è già registrata
    res.json({ ok: true });
}));

router.get("/verifica", (req, res) => {
    const id = consumaToken(req.query.token, "verifica");
    if (!id) return res.redirect("/index.html?verificato=0");
    db.prepare("UPDATE utenti SET verificato = 1 WHERE id = ?").run(id);
    res.redirect("/index.html?verificato=1");
});

router.post("/login", asincrona(async (req, res) => {
    const b = req.body || {};
    if (typeof b.email !== "string" || typeof b.password !== "string" || b.password.length > 200)
        throw new HttpError(400, "Inserisci email e password.");
    const email = b.email.trim().toLowerCase();
    const chiave = req.ip + "|" + email;
    if (!limiteIP.consenti(req.ip) || limiteCoppia.conta(chiave) >= 6)
        throw new HttpError(429, "Troppi tentativi. Aspetta qualche minuto e riprova.");

    const u = db.prepare("SELECT * FROM utenti WHERE email = ?").get(email);
    const ok = await S.verificaPassword(b.password, u ? u.pw_hash : await S.hashFinto());
    if (!u || !ok) { limiteCoppia.consenti(chiave); throw new HttpError(401, "Email o password non corretti.", "credenziali"); }
    if (!u.verificato) throw new HttpError(403, "Devi prima confermare l'email: controlla la posta (anche lo spam).", "non_verificato");
    limiteCoppia.azzera(chiave);
    apriSessione(res, u.id);
    res.json({ ok: true });
}));

// Dice se c'è una sessione valida senza dare errori 401 (usata dalla pagina di accesso)
router.get("/sessione", (req, res) => {
    const t = S.leggiCookie(req, S.NOME_COOKIE);
    const r = t && db.prepare("SELECT 1 FROM sessioni s JOIN utenti u ON u.id = s.utente_id WHERE s.token_hash = ? AND s.scade_il > ? AND u.verificato = 1").get(S.sha256(t), Date.now());
    res.json({ autenticato: !!r });
});

router.post("/logout", (req, res) => {
    const t = S.leggiCookie(req, S.NOME_COOKIE);
    if (t) db.prepare("DELETE FROM sessioni WHERE token_hash = ?").run(S.sha256(t));
    S.cancellaCookieSessione(res);
    res.json({ ok: true });
});

router.post("/forgot", (req, res) => {
    if (!limiteEmail.consenti(req.ip)) throw new HttpError(429, "Troppe richieste. Riprova più tardi.");
    const email = typeof (req.body || {}).email === "string" ? req.body.email.trim().toLowerCase() : "";
    const u = email ? db.prepare("SELECT id, nome FROM utenti WHERE email = ?").get(email) : null;
    if (u) {
        const token = creaToken(u.id, "reset", 60 * 60 * 1000);
        mail.inviaReset(email, u.nome, token).catch((e) => console.error("Invio email fallito:", e.message));
    }
    res.json({ ok: true });      // sempre uguale: non si rivela se l'email esiste
});

router.post("/reset", asincrona(async (req, res) => {
    if (!limiteEmail.consenti("reset|" + req.ip)) throw new HttpError(429, "Troppe richieste. Riprova più tardi.");
    const b = req.body || {};
    controllaPassword(b.password);
    const id = consumaToken(b.token, "reset");
    if (!id) throw new HttpError(400, "Il link non è valido o è scaduto. Richiedine uno nuovo.", "token");
    const hash = await S.hashPassword(b.password);
    db.prepare("UPDATE utenti SET pw_hash = ?, verificato = 1 WHERE id = ?").run(hash, id);
    db.prepare("DELETE FROM sessioni WHERE utente_id = ?").run(id);      // chiude tutte le sessioni aperte
    res.json({ ok: true });
}));

module.exports = { router, controllaPassword };
