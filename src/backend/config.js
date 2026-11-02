"use strict";
/* =====================================================================
   config.js — tutta la configurazione del server.
   I valori si cambiano nel file .env (copia .env.example in .env),
   mai direttamente qui. Funziona uguale su Linux, Windows e macOS.
   ===================================================================== */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");

// Piccolo lettore di .env (così non serve nessuna libreria). Le variabili già
// presenti nell'ambiente (per esempio quelle di Docker o systemd) hanno la precedenza.
(function caricaEnv() {
    const file = path.join(ROOT, ".env");
    if (!fs.existsSync(file)) return;
    for (const riga of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
        const m = riga.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
        if (!m || riga.trim().startsWith("#")) continue;
        let v = m[2];
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        if (process.env[m[1]] === undefined) process.env[m[1]] = v;
    }
})();

const env = process.env;
const num = (v, d) => (v !== undefined && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : d);
const bool = (v, d) => (v === undefined || v === "" ? d : /^(1|true|si|sì|yes|on)$/i.test(v));

const dataDir = path.resolve(ROOT, env.DATA_DIR || "data");

const config = {
    ROOT,
    PRODUCTION: env.NODE_ENV === "production",
    PORT: num(env.PORT, 3000),
    HOST: env.HOST || "0.0.0.0",

    // Indirizzo pubblico del sito (usato nei link delle email). Senza slash finale.
    BASE_URL: (env.BASE_URL || `http://localhost:${num(env.PORT, 3000)}`).replace(/\/+$/, ""),
    // 1 se il sito sta dietro a un reverse proxy (Caddy, nginx, Cloudflare Tunnel…): serve per HTTPS e IP corretti
    TRUST_PROXY: bool(env.TRUST_PROXY, false),

    DATA_DIR: dataDir,
    DB_FILE: path.join(dataDir, "hub.sqlite"),
    UPLOAD_DIR: path.join(dataDir, "uploads"),
    BACKUP_DIR: path.resolve(ROOT, env.BACKUP_DIR || path.join("data", "backups")),
    PUBLIC_DIR: path.join(ROOT, "src", "frontend"),

    // ---- Scuola e regole di registrazione ----
    PASSWORD_MIN: num(env.PASSWORD_MIN, 8),
    ANNI: ["1ª", "2ª", "3ª", "4ª", "5ª"],

    // ---- Email (verifica indirizzo e recupero password) ----
    // Senza SMTP_HOST i link vengono stampati nella console del server (va bene per provare).
    SMTP_HOST: env.SMTP_HOST || "",
    SMTP_PORT: num(env.SMTP_PORT, 587),
    SMTP_SECURE: bool(env.SMTP_SECURE, false),
    SMTP_USER: env.SMTP_USER || "",
    SMTP_PASS: env.SMTP_PASS || "",
    MAIL_FROM: env.MAIL_FROM || "Hub Studenti <no-reply@localhost>",

    // ---- Sessioni e conservazione dei dati (GDPR: limitazione della conservazione) ----
    SESSIONE_GIORNI: num(env.SESSIONE_GIORNI, 14),
    // Account mai confermati: cancellati dopo N giorni
    RITENZIONE_NON_VERIFICATI_GIORNI: num(env.RITENZIONE_NON_VERIFICATI_GIORNI, 3),
    // Account senza accessi da N mesi: cancellati (0 = non cancellare mai; sconsigliato: vedi docs/GDPR.md)
    RITENZIONE_INATTIVI_MESI: num(env.RITENZIONE_INATTIVI_MESI, 12),
    // Backup più vecchi di N giorni vengono cancellati da `npm run backup`
    RITENZIONE_BACKUP_GIORNI: num(env.RITENZIONE_BACKUP_GIORNI, 30),

    // Limite anti-spam: registrazioni per ora da uno stesso indirizzo IP (una scuola dietro un solo IP: alzalo se serve)
    REGISTRAZIONI_ORA_PER_IP: num(env.REGISTRAZIONI_ORA_PER_IP, 20),

    // Versione dell'informativa privacy/regole: se la cambi in modo sostanziale, aumentala.
    VERSIONE_INFORMATIVA: env.VERSIONE_INFORMATIVA || "2026-10",

    // ---- Dati del titolare del trattamento (compaiono in privacy.html) ----
    SOURCE_URL: env.SOURCE_URL || "https://github.com/0xn0rm41/hub-studenti",   // AGPL §13: link to the running version's source
    TITOLARE_NOME: env.TITOLARE_NOME || "[NOME DEL TITOLARE: chi gestisce il servizio]",
    TITOLARE_CONTATTO: env.TITOLARE_CONTATTO || "[EMAIL DI CONTATTO PRIVACY]",
    DPO_CONTATTO: env.DPO_CONTATTO || "",

    // Valori iniziali delle impostazioni modificabili da riga di comando
    DEFAULTS_IMPOSTAZIONI: {
        soglia_idee: String(num(env.SOGLIA_IDEE, 30)),
        commissione_percentuale: String(num(env.COMMISSIONE_PERCENTUALE, 0)),
        max_opzioni_sondaggio: "5"
    }
};

module.exports = config;
