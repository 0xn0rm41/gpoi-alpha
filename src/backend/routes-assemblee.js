"use strict";
/* routes-assemblee.js — class assembly requests (assemblea di classe).
   Students of a class submit a request (date, hours, agenda); the school approves/rejects/moves it; approved ones show in the calendar.
   The default rules follow the usual Italian practice (D.Lgs. 297/1994 art. 13: max 2 hours, once a month, not in the last month of lessons,
   notice ahead — verify against your school's regolamento d'istituto) and are configurable per school (modules.js: OPZIONI_PREDEFINITE.assemblee). */
const express = require("express");
const db = require("./db");
const S = require("./security");
const { testo, dataFloating, oraLocale } = require("./util");
const { richiediLogin, soloAdmin } = require("./routes-me");
const { richiediModulo, opzioniScuola } = require("./modules");
const { emetti } = require("./notifiche");
const { HttpError } = S;

const router = express.Router();
router.use(richiediLogin, richiediModulo("assemblee"));

const GIORNO = 86400000;
const èAdmin = (req) => req.utente.ruolo === "admin";
const oggiFloating = () => Date.parse(oraLocale(Date.now()).giorno + "T00:00:00Z");
const meseDi = (ts) => new Date(ts).toISOString().slice(0, 7);

function vista(a, req, nomi) {
    return { id: a.id, classe: a.classe, data_proposta: a.data_proposta, ora_inizio: a.ora_inizio, durata_ore: a.durata_ore, ordine_giorno: a.ordine_giorno, note: a.note,
             stato: a.stato, data_confermata: a.data_confermata, motivo_decisione: a.motivo_decisione, creato_il: a.creato_il,
             richiedente: nomi[a.richiedente_id] || null, mia: a.richiedente_id === req.utente.id };
}

router.get("/", (req, res) => {
    const S0 = req.utente.scuola_id, ops = opzioniScuola(S0, "assemblee");
    const righe = èAdmin(req)
        ? db.prepare("SELECT * FROM assemblee WHERE scuola_id = ? ORDER BY CASE stato WHEN 'inviata' THEN 0 ELSE 1 END, data_proposta DESC LIMIT 300").all(S0)
        : db.prepare("SELECT * FROM assemblee WHERE scuola_id = ? AND classe = ? ORDER BY data_proposta DESC LIMIT 100").all(S0, req.utente.classe || "");
    const nomi = Object.fromEntries(db.prepare("SELECT id, nome, cognome FROM utenti WHERE scuola_id = ?").all(S0).map((u) => [u.id, u.nome + " " + u.cognome[0] + "."]));
    res.json({ richieste: righe.map((a) => vista(a, req, nomi)), regole: ops,
               puoi_richiedere: !!req.utente.classe && (!ops.solo_rappresentanti || !!req.utente.rappresentante || èAdmin(req)),
               classe: req.utente.classe || null, rappresentante: !!req.utente.rappresentante });
});

router.post("/", (req, res) => {
    const u = req.utente, ops = opzioniScuola(u.scuola_id, "assemblee"), b = req.body || {};
    if (!u.classe) throw new HttpError(400, "Imposta la tua classe nel profilo per richiedere un'assemblea.", "classe_mancante");
    if (ops.solo_rappresentanti && !u.rappresentante && !èAdmin(req)) throw new HttpError(403, "Solo i rappresentanti di classe possono richiedere l'assemblea.");
    const data = dataFloating(b.data, "Data"), durata = Number(b.durata_ore);
    if (!Number.isInteger(durata) || durata < 1 || durata > ops.max_ore) throw new HttpError(400, `La durata può essere da 1 a ${ops.max_ore} ore.`);
    const giorniAlla = Math.round((data - oggiFloating()) / GIORNO);
    if (giorniAlla < ops.preavviso_giorni) throw new HttpError(400, `La richiesta va fatta con almeno ${ops.preavviso_giorni} giorni di anticipo.`, "preavviso");
    if (giorniAlla > 120) throw new HttpError(400, "La data è troppo lontana.");
    const dow = new Date(data).getUTCDay();
    if (dow === 0) throw new HttpError(400, "Scegli un giorno di lezione (non la domenica).");
    if (ops.fine_lezioni) {
        const fine = Date.parse(ops.fine_lezioni + "T00:00:00Z");
        if (!Number.isNaN(fine) && data > fine - 30 * GIORNO) throw new HttpError(400, "L'assemblea non si può tenere nell'ultimo mese di lezione.", "ultimo_mese");
    }
    const mese = meseDi(data);
    const nelMese = db.prepare("SELECT data_proposta, data_confermata FROM assemblee WHERE scuola_id = ? AND classe = ? AND stato IN ('inviata','approvata','svolta')").all(u.scuola_id, u.classe)
        .filter((a) => meseDi(a.data_confermata || a.data_proposta) === mese).length;
    if (nelMese >= ops.max_al_mese) throw new HttpError(400, `La classe ha già ${nelMese === 1 ? "un'assemblea richiesta o fissata" : nelMese + " assemblee richieste o fissate"} in quel mese (massimo ${ops.max_al_mese}).`, "limite_mensile");
    const oraInizio = testo(b.ora_inizio, "Orario", 0, 20);
    const id = S.uuid();
    db.prepare(`INSERT INTO assemblee (id, scuola_id, classe, richiedente_id, data_proposta, ora_inizio, durata_ore, ordine_giorno, note, creato_il) VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .run(id, u.scuola_id, u.classe, u.id, data, oraInizio, durata, testo(b.ordine_giorno, "Ordine del giorno", 5, 1000, { multilinea: true }), testo(b.note, "Note", 0, 500, { multilinea: true }), Date.now());
    res.json({ id });
});

function trova(req) {
    const a = db.prepare("SELECT * FROM assemblee WHERE id = ? AND scuola_id = ?").get(req.params.id, req.utente.scuola_id);
    if (!a) throw new HttpError(404, "Richiesta non trovata.");
    return a;
}
router.post("/:id/annulla", (req, res) => {
    const a = trova(req);
    const delGruppo = a.classe === req.utente.classe && (a.richiedente_id === req.utente.id || req.utente.rappresentante);
    if (!delGruppo && !èAdmin(req)) throw new HttpError(403, "Non puoi annullare questa richiesta.");
    if (!["inviata", "approvata"].includes(a.stato)) throw new HttpError(400, "La richiesta non si può più annullare.");
    db.prepare("UPDATE assemblee SET stato = 'annullata' WHERE id = ?").run(a.id);
    res.json({ ok: true });
});

function avvisaClasse(a, stato, motivo, req) {
    const membri = db.prepare("SELECT id FROM utenti WHERE scuola_id = ? AND classe = ? AND verificato = 1").all(a.scuola_id, a.classe).map((u) => u.id);
    emetti({ scuolaId: a.scuola_id, chiave: "assemblea_stato", dati: { c: a.classe, s: stato, m: motivo || "" }, link: "/bacheca.html#assemblee", diretti: membri, escludi: req.utente.id });
}
router.post("/:id/decidi", soloAdmin, (req, res) => {
    const a = trova(req), b = req.body || {};
    if (a.stato !== "inviata") throw new HttpError(400, "Questa richiesta è già stata decisa.");
    const stato = b.stato === "approvata" ? "approvata" : b.stato === "rifiutata" ? "rifiutata" : null;
    if (!stato) throw new HttpError(400, "Decisione non valida.");
    const motivo = testo(b.motivo, "Motivo", stato === "rifiutata" ? 3 : 0, 500, { multilinea: true });
    let data = null;
    if (stato === "approvata" && b.data_confermata) data = dataFloating(b.data_confermata, "Data");
    db.prepare("UPDATE assemblee SET stato = ?, motivo_decisione = ?, data_confermata = ?, deciso_il = ? WHERE id = ?").run(stato, motivo, data, Date.now(), a.id);
    avvisaClasse(a, stato, motivo, req);
    res.json({ ok: true });
});
router.post("/:id/svolta", soloAdmin, (req, res) => {
    const a = trova(req);
    if (a.stato !== "approvata") throw new HttpError(400, "Solo un'assemblea approvata può essere segnata come svolta.");
    db.prepare("UPDATE assemblee SET stato = 'svolta' WHERE id = ?").run(a.id);
    res.json({ ok: true });
});

/* ---- school admins: who are the class representatives ---- */
router.get("/rappresentanti/elenco", soloAdmin, (req, res) => {
    const q = String(req.query.q || "").trim().toLowerCase().slice(0, 40);
    const righe = db.prepare("SELECT id, nome, cognome, classe, rappresentante FROM utenti WHERE scuola_id = ? AND verificato = 1 ORDER BY classe, cognome, nome").all(req.utente.scuola_id)
        .filter((u) => !q || `${u.nome} ${u.cognome} ${u.classe || ""}`.toLowerCase().includes(q)).slice(0, 100);
    res.json(righe.map((u) => ({ id: u.id, nome: u.nome + " " + u.cognome, classe: u.classe, rappresentante: !!u.rappresentante })));      // no e-mail addresses
});
router.put("/rappresentanti/:utente", soloAdmin, (req, res) => {
    const r = db.prepare("UPDATE utenti SET rappresentante = ? WHERE id = ? AND scuola_id = ?").run((req.body || {}).valore ? 1 : 0, req.params.utente, req.utente.scuola_id);
    if (!r.changes) throw new HttpError(404, "Utente non trovato.");
    res.json({ ok: true });
});

module.exports = { router };
