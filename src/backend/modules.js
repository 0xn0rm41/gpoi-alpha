"use strict";
/* modules.js — per-school feature switches and options.
   Core modules are ON by default; optional modules (bar) are OFF until the operator enables them for a school
   (after the school requested it by e-mail: see docs/project_management/outreach/SCHOOLS.md). */
const db = require("./db");
const { HttpError } = require("./security");

const MODULI = {
    calendario:  { predefinito: true,  richiede_email: false },
    macchinette: { predefinito: true,  richiede_email: false },
    assemblee:   { predefinito: true,  richiede_email: false },
    bar:         { predefinito: false, richiede_email: true }      // only for schools with a bar/canteen (hotel & catering institutes, ...)
};

const OPZIONI_PREDEFINITE = {
    assemblee: { preavviso_giorni: 5, max_ore: 2, max_al_mese: 1, fine_lezioni: null, solo_rappresentanti: false },
    bar: { max_prodotti_per_ordine: 10, max_ordini_al_giorno: 2 }
};

const leggiJson = (s) => { try { const o = JSON.parse(s); return o && typeof o === "object" ? o : {}; } catch { return {}; } };

function moduliScuola(scuolaId) {
    const r = db.prepare("SELECT moduli FROM scuole WHERE id = ?").get(scuolaId);
    const ov = leggiJson(r && r.moduli), out = {};
    for (const [n, d] of Object.entries(MODULI)) out[n] = n in ov ? !!ov[n] : d.predefinito;
    return out;
}
const attivo = (scuolaId, nome) => !!moduliScuola(scuolaId)[nome];

function opzioniScuola(scuolaId, modulo) {
    const r = db.prepare("SELECT opzioni FROM scuole WHERE id = ?").get(scuolaId);
    const o = leggiJson(r && r.opzioni);
    return { ...OPZIONI_PREDEFINITE[modulo], ...(o[modulo] || {}) };
}
function impostaModulo(scuolaId, nome, on) {
    if (!MODULI[nome]) throw new Error("Unknown module: " + nome + " (valid: " + Object.keys(MODULI).join(", ") + ")");
    const r = db.prepare("SELECT moduli FROM scuole WHERE id = ?").get(scuolaId);
    const ov = leggiJson(r.moduli); ov[nome] = !!on;
    db.prepare("UPDATE scuole SET moduli = ? WHERE id = ?").run(JSON.stringify(ov), scuolaId);
}
function impostaOpzione(scuolaId, modulo, chiave, valore) {
    const r = db.prepare("SELECT opzioni FROM scuole WHERE id = ?").get(scuolaId);
    const o = leggiJson(r.opzioni); o[modulo] = { ...(o[modulo] || {}), [chiave]: valore };
    db.prepare("UPDATE scuole SET opzioni = ? WHERE id = ?").run(JSON.stringify(o), scuolaId);
}

/** Express middleware: 403 when the module is not enabled for the user's school. */
const richiediModulo = (nome) => (req, res, next) => {
    if (!attivo(req.utente.scuola_id, nome))
        return next(new HttpError(403, "Questo servizio non è attivo per la tua scuola.", "modulo_non_attivo"));
    next();
};

module.exports = { MODULI, moduliScuola, attivo, opzioniScuola, impostaModulo, impostaOpzione, richiediModulo };
