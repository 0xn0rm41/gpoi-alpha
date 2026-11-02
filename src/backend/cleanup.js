"use strict";
/* cleanup.js — pulizia periodica (GDPR: limitazione della conservazione). */
const db = require("./db");
const config = require("./config");

const GIORNO = 86400000;

function pulisci() {
    const ora = Date.now(), esito = {};
    esito.sessioni = db.prepare("DELETE FROM sessioni WHERE scade_il < ?").run(ora).changes;
    esito.token = db.prepare("DELETE FROM token_email WHERE scade_il < ?").run(ora).changes;
    esito.segnalazioni = db.prepare("DELETE FROM segnalazioni WHERE stato = 'risolta' AND creato_il < ?").run(ora - 90 * GIORNO).changes;

    // Account mai confermati
    const nonVerificati = db.prepare("SELECT id FROM utenti WHERE verificato = 0 AND creato_il < ?")
        .all(ora - config.RITENZIONE_NON_VERIFICATI_GIORNI * GIORNO);
    nonVerificati.forEach((u) => db.eliminaUtente(u.id));
    esito.non_verificati = nonVerificati.length;

    // Account inattivi
    esito.inattivi = 0;
    if (config.RITENZIONE_INATTIVI_MESI > 0) {
        const limite = ora - config.RITENZIONE_INATTIVI_MESI * 30 * GIORNO;
        const inattivi = db.prepare("SELECT id FROM utenti WHERE ultimo_accesso < ? AND verificato = 1").all(limite);
        inattivi.forEach((u) => db.eliminaUtente(u.id));
        esito.inattivi = inattivi.length;
    }
    return esito;
}

function avviaPulizia() {
    const esegui = () => {
        try {
            const e = pulisci();
            if (e.non_verificati || e.inattivi) console.log("Pulizia dati:", JSON.stringify(e));
        } catch (err) { console.error("Pulizia fallita:", err.message); }
    };
    esegui();
    setInterval(esegui, 6 * 3600 * 1000).unref();
}

module.exports = { pulisci, avviaPulizia };
