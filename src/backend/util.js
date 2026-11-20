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

/** Class code such as 5INFC, 2CSAS, 3B (legacy "3ªB" is accepted). Returns null when empty, throws when invalid. */
function classe(v) {
    const c = String(v == null ? "" : v).toUpperCase().replace(/[\s.ª°º-]/g, "");
    if (!c) return null;
    if (!/^(?=.{2,10}$)[1-9][A-Z0-9]*[A-Z][A-Z0-9]*$/.test(c)) throw new HttpError(400, "Classe non valida (esempi: 5INFC, 2CSAS, 3B).");
    return c;
}
module.exports = { classe, testo, scelta, nomeBreve, asincrona };

/* ---- time zone helpers: the school's local day, independent of the server's time zone ---- */
const TZ = process.env.TZ_SCUOLA || "Europe/Rome";
const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** { giorno: "YYYY-MM-DD", minuti: minutes since local midnight } of a timestamp in the school's time zone. */
function oraLocale(ts) {
    const p = Object.fromEntries(fmt.formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
    return { giorno: `${p.year}-${p.month}-${p.day}`, minuti: Number(p.hour) * 60 + Number(p.minute) };
}
/** All-day dates are "floating": stored as UTC midnight of that calendar day. */
function dataFloating(v, nomeCampo = "Data") {
    if (typeof v === "number") v = new Date(v).toISOString().slice(0, 10);
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new HttpError(400, `${nomeCampo}: data non valida.`);
    const t = Date.parse(v + "T00:00:00Z");
    if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== v) throw new HttpError(400, `${nomeCampo}: data non valida.`);
    return t;
}
module.exports.oraLocale = oraLocale;
module.exports.dataFloating = dataFloating;
module.exports.TZ = TZ;

/** Language for a request: logged-in user's choice, else X-Lang header, else Accept-Language, else Italian. */
function linguaRichiesta(req) {
    const v = (req.utente && req.utente.lingua) || req.get("x-lang") || (req.get("accept-language") || "").slice(0, 2);
    return String(v).toLowerCase().startsWith("en") ? "en" : "it";
}
module.exports.linguaRichiesta = linguaRichiesta;
