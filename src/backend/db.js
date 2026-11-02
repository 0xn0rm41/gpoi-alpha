"use strict";
/* db.js — apre il database SQLite, applica le migrazioni e le impostazioni iniziali. */
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const config = require("./config");

fs.mkdirSync(config.DATA_DIR, { recursive: true });
fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });

const db = new Database(process.env.HUB_DB_FILE || config.DB_FILE);
db.pragma("journal_mode = WAL");     // più robusto e veloce con molte letture
db.pragma("foreign_keys = ON");      // indispensabile per le cancellazioni a cascata (GDPR)
db.pragma("busy_timeout = 5000");

/* Migrations: migrations/NNN_name.sql, applied in order inside a transaction.
   The applied version is stored in meta.schema_versione (databases created before the
   runner existed already hold "1", which matches 001_init.sql). */
function versioneCorrente() {
    const t = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='meta'").get();
    if (!t) return 0;
    const r = db.prepare("SELECT valore FROM meta WHERE chiave='schema_versione'").get();
    return r ? Number(r.valore) : 0;
}
function migra() {
    const dir = path.join(__dirname, "migrations");
    const file = fs.readdirSync(dir).filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort();
    for (const f of file) {
        const n = Number(f.slice(0, 3));
        if (n <= versioneCorrente()) continue;
        const sql = fs.readFileSync(path.join(dir, f), "utf8");
        db.pragma("foreign_keys = OFF");           // SQLite: needed for table rebuilds, harmless here
        try {
            db.transaction(() => {
                db.exec(sql);
                if (n === 2) retroCompatibilita002();
                db.prepare("INSERT INTO meta (chiave, valore) VALUES ('schema_versione', ?) ON CONFLICT (chiave) DO UPDATE SET valore = excluded.valore").run(String(n));
            })();
        } finally { db.pragma("foreign_keys = ON"); }
    }
}
/** Databases created before multi-school: everything moves into one school created on the fly. */
function retroCompatibilita002() {
    const n = db.prepare("SELECT COUNT(*) n FROM utenti").get().n;
    if (!n) return;                                // fresh install: no school until the operator creates one
    const id = require("crypto").randomUUID();
    db.prepare("INSERT INTO scuole (id, nome, codice_invito, creato_il) VALUES (?,?,?,?)")
        .run(id, process.env.NOME_SCUOLA || "Default school", db.nuovoCodiceInvito(), Date.now());
    for (const t of ["utenti", "comunicazioni", "eventi", "idee", "sondaggi", "appunti", "commenti_appunti", "libri", "segnalazioni"])
        db.prepare(`UPDATE ${t} SET scuola_id = ?`).run(id);
}

/** Invite code: 10 characters, no ambiguous ones (0/O, 1/I). Shown as XXXXX-XXXXX. */
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
db.nuovoCodiceInvito = () => {
    const crypto = require("crypto");
    let c = "";
    for (let i = 0; i < 10; i++) c += ALFABETO[crypto.randomInt(ALFABETO.length)];
    return c;
};
db.formattaCodice = (c) => c.slice(0, 5) + "-" + c.slice(5);
db.normalizzaCodice = (v) => String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

migra();

const inserisci = db.prepare("INSERT OR IGNORE INTO impostazioni (chiave, valore) VALUES (?, ?)");
for (const [k, v] of Object.entries(config.DEFAULTS_IMPOSTAZIONI)) inserisci.run(k, v);

const leggiImp = db.prepare("SELECT valore FROM impostazioni WHERE chiave = ?");
/** Legge un'impostazione (sempre testo). */
db.impostazione = (chiave) => { const r = leggiImp.get(chiave); return r ? r.valore : null; };
db.impostazioneNum = (chiave, def) => { const n = Number(db.impostazione(chiave)); return Number.isFinite(n) ? n : def; };

/** Elimina un account con TUTTI i suoi contenuti e toglie le foto dal disco (diritto alla cancellazione). */
db.creaScuola = ({ nome, dominio_email = null, soglia_idee = null }) => {
    const id = require("crypto").randomUUID();
    const dom = dominio_email ? String(dominio_email).trim().toLowerCase().replace(/^(?!@)/, "@") : null;
    db.prepare("INSERT INTO scuole (id, nome, codice_invito, dominio_email, soglia_idee, creato_il) VALUES (?,?,?,?,?,?)")
        .run(id, String(nome).trim(), db.nuovoCodiceInvito(), dom, soglia_idee, Date.now());
    return db.prepare("SELECT * FROM scuole WHERE id = ?").get(id);
};
/** Deletes a school with all its users and content, and the photos on disk. */
db.eliminaScuola = (id) => {
    const foto = db.prepare("SELECT foto FROM appunti WHERE scuola_id = ?").all(id).map((r) => r.foto);
    db.transaction(() => {
        // content first (children cascade), then users, then the school; order avoids SET NULL leftovers
        for (const t of ["eventi", "comunicazioni", "segnalazioni", "idee", "sondaggi", "appunti", "libri"])
            db.prepare(`DELETE FROM ${t} WHERE scuola_id = ?`).run(id);
        db.prepare("DELETE FROM utenti WHERE scuola_id = ?").run(id);
        db.prepare("DELETE FROM scuole WHERE id = ?").run(id);
    })();
    for (const f of foto) db.rimuoviFoto(f);
};
db.eliminaUtente = (id) => {
    const foto = db.prepare("SELECT foto FROM appunti WHERE autore_id = ?").all(id).map((r) => r.foto);
    db.prepare("DELETE FROM utenti WHERE id = ?").run(id);     // le tabelle collegate si svuotano a cascata
    for (const f of foto) db.rimuoviFoto(f);
};
db.rimuoviFoto = (nome) => {
    if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(nome || "")) return;
    try { fs.unlinkSync(path.join(config.UPLOAD_DIR, nome)); } catch (e) { /* già assente */ }
};

module.exports = db;
