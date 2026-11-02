"use strict";
/* scripts/admin.js — gestione da riga di comando (uguale su Linux, Windows e macOS).
   Uso:  npm run admin -- <comando> [argomenti]                                          */
const db = require("../db");
const { pulisci } = require("../cleanup");

const [cmd, a, b, c] = process.argv.slice(2);
const scuola = (ref) => {
    const r = db.prepare("SELECT * FROM scuole WHERE id = ? OR nome = ? COLLATE NOCASE OR codice_invito = ?").get(String(ref || ""), String(ref || ""), db.normalizzaCodice(ref));
    if (!r) { console.error("School not found: " + ref); process.exit(1); }
    return r;
};
const utente = (email) => {
    const u = db.prepare("SELECT id, email, nome, cognome, ruolo, verificato FROM utenti WHERE email = ?").get(String(email || "").toLowerCase());
    if (!u) { console.error("Utente non trovato: " + email); process.exit(1); }
    return u;
};
const CHIAVI = ["soglia_idee", "commissione_percentuale", "max_opzioni_sondaggio"];

switch (cmd) {
    case "promote": { const u = utente(a); db.prepare("UPDATE utenti SET ruolo = 'admin' WHERE id = ?").run(u.id); console.log(`${u.email} ora è amministratore.`); break; }
    case "demote":  { const u = utente(a); db.prepare("UPDATE utenti SET ruolo = 'studente' WHERE id = ?").run(u.id); console.log(`${u.email} ora è studente.`); break; }
    case "verify":  { const u = utente(a); db.prepare("UPDATE utenti SET verificato = 1 WHERE id = ?").run(u.id); console.log(`${u.email}: email segnata come confermata.`); break; }
    case "delete-user": { const u = utente(a); db.eliminaUtente(u.id); console.log(`${u.email}: account e contenuti eliminati.`); break; }
    case "logout-all": {      // emergenza (es. sospetta violazione): chiude tutte le sessioni e annulla i link email in sospeso
        const n = db.prepare("DELETE FROM sessioni").run().changes; db.prepare("DELETE FROM token_email").run();
        console.log(`${n} sessioni chiuse: tutti dovranno accedere di nuovo.`);
        break;
    }
    case "school-create": {
        if (!a) { console.error('Usage: school-create "<name>" [@email-domain]'); process.exit(1); }
        const r = db.creaScuola({ nome: a, dominio_email: b || null });
        console.log(`School created: ${r.nome}\nInvite code: ${db.formattaCodice(r.codice_invito)}\nId: ${r.id}`);
        break;
    }
    case "school-list":
        for (const r of db.prepare("SELECT s.*, (SELECT COUNT(*) FROM utenti u WHERE u.scuola_id = s.id) AS n FROM scuole s ORDER BY s.creato_il").all())
            console.log(`${r.attiva ? "[active]   " : "[SUSPENDED]"} ${r.nome}  code ${db.formattaCodice(r.codice_invito)}  members ${r.n}${r.dominio_email ? "  domain " + r.dominio_email : ""}`);
        break;
    case "school-code": { const r = scuola(a); const n = db.nuovoCodiceInvito(); db.prepare("UPDATE scuole SET codice_invito = ? WHERE id = ?").run(n, r.id); console.log(`${r.nome}: new invite code ${db.formattaCodice(n)}`); break; }
    case "school-suspend":  { const r = scuola(a); db.prepare("UPDATE scuole SET attiva = 0 WHERE id = ?").run(r.id); db.prepare("DELETE FROM sessioni WHERE utente_id IN (SELECT id FROM utenti WHERE scuola_id = ?)").run(r.id); console.log(`${r.nome}: suspended (sessions closed, no sign-in or sign-up).`); break; }
    case "school-activate": { const r = scuola(a); db.prepare("UPDATE scuole SET attiva = 1 WHERE id = ?").run(r.id); console.log(`${r.nome}: active.`); break; }
    case "school-delete": {
        const r = scuola(a);
        if (b !== "--yes") { console.error(`This permanently deletes "${r.nome}" with ALL its users, content and photos. Repeat with --yes to confirm.`); process.exit(1); }
        db.eliminaScuola(r.id); console.log(`${r.nome}: deleted.`);
        break;
    }
    case "school-of": { const u = utente(a); const r = db.prepare("SELECT nome FROM scuole WHERE id = (SELECT scuola_id FROM utenti WHERE id = ?)").get(u.id); console.log(r ? r.nome : "(none)"); break; }
    case "list": {
        for (const u of db.prepare("SELECT email, nome, cognome, classe, ruolo, verificato FROM utenti ORDER BY creato_il").all())
            console.log(`${u.ruolo === "admin" ? "[ADMIN] " : "        "}${u.email}  ${u.nome} ${u.cognome} ${u.classe || ""}${u.verificato ? "" : "  (non confermato)"}`);
        break;
    }
    case "set": {
        if (!CHIAVI.includes(a) || b === undefined || !/^\d+$/.test(b)) { console.error("Uso: set <" + CHIAVI.join("|") + "> <numero>"); process.exit(1); }
        db.prepare("INSERT INTO impostazioni (chiave, valore) VALUES (?, ?) ON CONFLICT (chiave) DO UPDATE SET valore = excluded.valore").run(a, b);
        console.log(`${a} = ${b}`);
        break;
    }
    case "settings": for (const r of db.prepare("SELECT chiave, valore FROM impostazioni").all()) console.log(`${r.chiave} = ${r.valore}`); break;
    case "cleanup": console.log("Pulizia eseguita:", pulisci()); break;
    case "stats": {
        for (const t of ["scuole", "utenti", "eventi", "idee", "sondaggi", "appunti", "libri", "segnalazioni"])
            console.log(t.padEnd(14), db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n);
        break;
    }
    default:
        console.log(`Comandi:
  promote <email>        rende amministratore (dopo che si è registrato e ha confermato l'email)
  demote <email>         toglie il ruolo di amministratore
  verify <email>         conferma l'email a mano (utile se non hai ancora configurato SMTP)
  delete-user <email>    elimina un account e tutti i suoi contenuti
  logout-all             chiude TUTTE le sessioni (emergenza, vedi docs/eu/gdpr/PROCEDURES.md)
  school-create "<name>" [@domain]   creates a school/community and prints its invite code
  school-list                        lists schools with code and member count
  school-code <school>               generates a new invite code
  school-suspend|school-activate <school>
  school-delete <school> --yes       deletes a school with all users and content
  school-of <email>                  shows which school a user belongs to
  list                   elenca gli utenti
  set <chiave> <valore>  chiavi: ${CHIAVI.join(", ")}
  settings               mostra le impostazioni
  cleanup                esegue subito la pulizia dei dati scaduti
  stats                  numero di elementi nel database`);
}
