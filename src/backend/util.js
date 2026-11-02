"use strict";
/* util.js — validazione input e piccoli aiuti condivisi dalle rotte. */
const { HttpError } = require("./security");

/** Testo obbligatorio/facoltativo: toglie spazi doppi, controlla la lunghezza. */
function testo(v, nomeCampo, min, max, { multilinea = false } = {}) {
    if (v === undefined || v === null) v = "";
    if (typeof v !== "string") throw new HttpError(400, `${nomeCampo}: valore non valido.`);
    v = multilinea ? v.replace(/\r\n/g, "\n").trim() : v.replace(/\s+/g, " ").trim();
    // niente caratteri di controllo
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(v)) throw new HttpError(400, `${nomeCampo}: caratteri non validi.`);
    if (v.length < min) throw new HttpError(400, min === 1 ? `${nomeCampo}: campo obbligatorio.` : `${nomeCampo}: troppo corto.`);
    if (v.length > max) throw new HttpError(400, `${nomeCampo}: massimo ${max} caratteri.`);
    return v;
}
function scelta(v, elenco, nomeCampo) {
    if (!elenco.includes(v)) throw new HttpError(400, `${nomeCampo}: valore non valido.`);
    return v;
}
const nomeBreve = (nome, cognome) => nome + (cognome ? " " + cognome[0].toUpperCase() + "." : "");

/** Rende asincrone le rotte compatibili con Express 4 (gli errori vanno al gestore comune). */
const asincrona = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { testo, scelta, nomeBreve, asincrona };
