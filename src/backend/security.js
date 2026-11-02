"use strict";
/* security.js — password, token, limitatori di richieste, cookie e intestazioni di sicurezza. */
const crypto = require("crypto");
const { promisify } = require("util");
const config = require("./config");

const scrypt = promisify(crypto.scrypt);
const N = 32768, R = 8, P = 1, LEN = 64;

/** Impronta della password: scrypt con sale casuale. Formato: scrypt$N$r$p$sale$hash */
async function hashPassword(password) {
    const sale = crypto.randomBytes(16);
    const h = await scrypt(password, sale, LEN, { N, r: R, p: P, maxmem: 128 * 1024 * 1024 });
    return ["scrypt", N, R, P, sale.toString("hex"), h.toString("hex")].join("$");
}
async function verificaPassword(password, salvato) {
    try {
        const [tipo, n, r, p, sale, hash] = String(salvato).split("$");
        if (tipo !== "scrypt") return false;
        const atteso = Buffer.from(hash, "hex");
        const h = await scrypt(password, Buffer.from(sale, "hex"), atteso.length,
            { N: +n, r: +r, p: +p, maxmem: 128 * 1024 * 1024 });
        return crypto.timingSafeEqual(h, atteso);
    } catch (e) { return false; }
}
// Impronta finta per confrontare comunque quando l'email non esiste (tempi di risposta uguali)
let _finto;
const hashFinto = async () => (_finto ||= await hashPassword("password-finta-" + crypto.randomBytes(8).toString("hex")));

const nuovoToken = () => crypto.randomBytes(32).toString("base64url");
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const uuid = () => crypto.randomUUID();

/* ---------- Limitatore di richieste (in memoria) ---------- */
function creaLimitatore(max, finestraMs) {
    const mappa = new Map();
    setInterval(() => { const t = Date.now(); for (const [k, v] of mappa) if (v.scade < t) mappa.delete(k); }, 60000).unref();
    return {
        /** true se la richiesta è consentita (e la conta) */
        consenti(chiave) {
            const t = Date.now();
            let v = mappa.get(chiave);
            if (!v || v.scade < t) { v = { n: 0, scade: t + finestraMs }; mappa.set(chiave, v); }
            v.n++;
            return v.n <= max;
        },
        conta(chiave) { const v = mappa.get(chiave); return v && v.scade >= Date.now() ? v.n : 0; },
        azzera(chiave) { mappa.delete(chiave); }
    };
}

/* ---------- Cookie ---------- */
const NOME_COOKIE = "hub_sid";
const sicuro = config.BASE_URL.startsWith("https://");
function leggiCookie(req, nome) {
    const h = req.headers.cookie;
    if (!h) return null;
    for (const parte of h.split(";")) {
        const i = parte.indexOf("=");
        if (i > 0 && parte.slice(0, i).trim() === nome) return decodeURIComponent(parte.slice(i + 1).trim());
    }
    return null;
}
function impostaCookieSessione(res, token, giorni) {
    res.append("Set-Cookie", `${NOME_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${giorni * 86400}${sicuro ? "; Secure" : ""}`);
}
function cancellaCookieSessione(res) {
    res.append("Set-Cookie", `${NOME_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${sicuro ? "; Secure" : ""}`);
}

/* ---------- Intestazioni di sicurezza ---------- */
function intestazioni(req, res, next) {
    res.setHeader("Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; " +
        "font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    if (sicuro) res.setHeader("Strict-Transport-Security", "max-age=15552000");
    res.removeHeader("X-Powered-By");
    next();
}

class HttpError extends Error {
    constructor(stato, messaggio, codice) { super(messaggio); this.stato = stato; this.codice = codice; }
}

module.exports = { hashPassword, verificaPassword, hashFinto, nuovoToken, sha256, uuid, creaLimitatore,
    NOME_COOKIE, leggiCookie, impostaCookieSessione, cancellaCookieSessione, intestazioni, HttpError };
