"use strict";
/* scripts/seed-demo.js — riempie un database di PROVA con eventi, idee, sondaggi e libri di esempio.
   NON usarlo in produzione. Gli studenti d'esempio hanno password casuali: nessuno può accedere con loro. */
const crypto = require("crypto");
const db = require("../db");
const config = require("../config");
const S = require("../security");

(async () => {
    if (db.prepare("SELECT COUNT(*) n FROM eventi").get().n > 0) { console.log("Il database contiene già degli eventi: demo non applicata."); return; }
    const ora = Date.now(), G = 86400000;
    const scuola = db.prepare("SELECT * FROM scuole LIMIT 1").get() || db.creaScuola({ nome: "Demo School" });
    const SID = scuola.id;
    const hash = await S.hashPassword(crypto.randomBytes(24).toString("hex"));
    const studenti = [["Marco", "Tosi", "3ªA"], ["Sara", "Landi", "2ªB"], ["Elena", "Rota", "4ªC"], ["Luca", "Pezzoli", "5ªA"], ["Giulia", "Bonomi", "3ªB"]].map(([nome, cognome, classe], i) => {
        const id = S.uuid();
        db.prepare(`INSERT INTO utenti (id, email, nome, cognome, classe, pw_hash, verificato, consenso_il, consenso_versione, creato_il, ultimo_accesso, scuola_id)
                    VALUES (?,?,?,?,?,?,1,?,?,?,?,?)`).run(id, `demo${i + 1}@demo.invalid`, nome, cognome, classe, hash, ora, config.VERSIONE_INFORMATIVA, ora, ora, SID);
        return id;
    });
    const giorno = (n, h, m) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, m, 0, 0); return d.getTime(); };
    for (const [n, h, m, titolo, luogo, cat, desc] of [
        [3, 10, 0, "Assemblea d'istituto", "Aula magna", "Scuola", "Si parla del regolamento e delle proposte per il secondo quadrimestre."],
        [6, 14, 30, "Torneo di pallavolo", "Palestra", "Sport", "Squadre miste da sei. Iscrivi la tua classe entro venerdì."],
        [8, 14, 30, "Sportello di matematica", "Biblioteca", "Studio", "Ripasso con gli studenti delle classi quinte."],
        [12, 16, 0, "Cineforum e discussione", "Aula 2.4", "Cultura", "Proiezione di un film scelto dagli studenti, poi dibattito."],
        [16, 9, 30, "Scambio dei libri di testo", "Atrio", "Scuola", "Porta i libri che non usi più e trova quelli che ti servono."]])
        db.prepare("INSERT INTO eventi (id, titolo, descrizione, luogo, categoria, inizio, creato_il, scuola_id) VALUES (?,?,?,?,?,?,?,?)").run(S.uuid(), titolo, desc, luogo, cat, giorno(n, h, m), ora, SID);
    db.prepare("INSERT INTO comunicazioni (id, titolo, testo, creato_il, scuola_id) VALUES (?,?,?,?,?)").run(S.uuid(), "Nuovo orario dello sportello", "Da lunedì lo sportello di studio è aperto anche il giovedì.", ora - G, SID);
    db.prepare("INSERT INTO comunicazioni (id, titolo, testo, creato_il, scuola_id) VALUES (?,?,?,?,?)").run(S.uuid(), "Cerchiamo aiuto per la festa d'istituto", "Servono volontari per allestimento e musica.", ora - 3 * G, SID);
    [["Torneo di calcetto interclasse", "Un torneo a squadre fra le classi, con finale davanti a tutta la scuola.", 0, 6],
     ["Distributori d'acqua nei corridoi", "Meno plastica e meno code alle macchinette.", 1, 4],
     ["Sala studio aperta il pomeriggio", "Un'aula tranquilla con un rappresentante di turno fino alle 17.", 2, 3]].forEach(([titolo, desc, a, gg], k) => {
        const id = S.uuid();
        db.prepare("INSERT INTO idee (id, titolo, descrizione, autore_id, creato_il, scuola_id) VALUES (?,?,?,?,?,?)").run(id, titolo, desc, studenti[a], ora - gg * G, SID);
        studenti.slice(0, 5 - k).forEach((s) => db.prepare("INSERT OR IGNORE INTO voti_idee VALUES (?,?,?)").run(id, s, ora));
    });
    const sid = S.uuid();
    db.prepare("INSERT INTO sondaggi (id, domanda, autore_id, creato_il, scuola_id) VALUES (?,?,?,?,?)").run(sid, "Quale attività vorresti per la settimana dello studente?", studenti[4], ora - 2 * G, SID);
    ["Torneo di calcetto", "Serata cinema", "Mercatino e scambio libri", "Hackathon di programmazione"].forEach((t, n) =>
        db.prepare("INSERT INTO sondaggi_opzioni (id, sondaggio_id, testo, posizione) VALUES (?,?,?,?)").run(S.uuid(), sid, t, n));
    [["Matematica – Volume 3", "Matematica", "3ª", "Buono", 800, "Qualche sottolineatura a matita.", 2],
     ["I Promessi Sposi (edizione scolastica)", "Italiano", "2ª", "Come nuovo", 0, "", 3],
     ["Inglese B2 – Student's Book", "Inglese", "4ª", "Usato", 500, "Esercizi già svolti a matita.", 1]].forEach(([t, m, c, cond, p, nota, a]) =>
        db.prepare("INSERT INTO libri (id, titolo, materia, classe, condizione, prezzo_cent, nota, venditore_id, creato_il, scuola_id) VALUES (?,?,?,?,?,?,?,?,?,?)").run(S.uuid(), t, m, c, cond, p, nota, studenti[a], ora - G, SID));
    console.log(`Demo data inserted. School "${scuola.nome}", invite code: ${db.formattaCodice(scuola.codice_invito)}`);
})();
