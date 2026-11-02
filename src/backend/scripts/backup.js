"use strict";
/* scripts/backup.js — copia coerente del database (e delle foto) in data/backups/.
   Uso: npm run backup     (da pianificare ogni notte: vedi docs/HOSTING.md)         */
const fs = require("fs");
const path = require("path");
const db = require("../db");
const config = require("../config");

(async () => {
    const t = new Date(), p = (n) => String(n).padStart(2, "0");
    const nome = `hub-${t.getFullYear()}${p(t.getMonth() + 1)}${p(t.getDate())}-${p(t.getHours())}${p(t.getMinutes())}${p(t.getSeconds())}`;
    const cartella = path.join(config.BACKUP_DIR, nome);
    fs.mkdirSync(cartella, { recursive: true });
    await db.backup(path.join(cartella, "hub.sqlite"));          // copia sicura anche a server acceso
    fs.cpSync(config.UPLOAD_DIR, path.join(cartella, "uploads"), { recursive: true });
    console.log("Backup creato:", cartella);

    // Conservazione limitata: i backup vecchi vengono cancellati (i dati cancellati dagli utenti non restano per sempre)
    const limite = Date.now() - config.RITENZIONE_BACKUP_GIORNI * 86400000;
    for (const d of fs.readdirSync(config.BACKUP_DIR)) {
        const pth = path.join(config.BACKUP_DIR, d);
        if (/^hub-\d{8}-\d{6}$/.test(d) && fs.statSync(pth).mtimeMs < limite) { fs.rmSync(pth, { recursive: true, force: true }); console.log("Backup scaduto eliminato:", d); }
    }
    db.close();
})().catch((e) => { console.error("Backup fallito:", e.message); process.exit(1); });
