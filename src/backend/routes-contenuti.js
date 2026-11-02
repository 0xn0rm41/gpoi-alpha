"use strict";
/* routes-contenuti.js — dati della bacheca e azioni su eventi, idee, sondaggi, appunti, libri, segnalazioni. */
const fs = require("fs");
const path = require("path");
const express = require("express");
const db = require("./db");
const config = require("./config");
const S = require("./security");
const { testo, scelta, nomeBreve, asincrona } = require("./util");
const { richiediLogin, soloAdmin } = require("./routes-me");

const { HttpError } = S;
const router = express.Router();
router.use(richiediLogin);

const MATERIE = ["Matematica", "Italiano", "Inglese", "Scienze", "Storia", "Informatica", "Altro"];
const CATEGORIE = ["Scuola", "Sport", "Studio", "Cultura"];
const CLASSI = ["1ª", "2ª", "3ª", "4ª", "5ª"];
const CONDIZIONI = ["Come nuovo", "Buono", "Usato"];

// Limite di scritture per utente (antiabuso): 40 al minuto
const limiteScritture = S.creaLimitatore(40, 60 * 1000);
router.use((req, res, next) => {
    if (req.method !== "GET" && !limiteScritture.consenti(req.utente.id)) return next(new HttpError(429, "Stai andando troppo veloce. Riprova fra un minuto."));
    next();
});

const adesso = () => Date.now();
const sogliaScuola = (id) => { const r = db.prepare("SELECT soglia_idee FROM scuole WHERE id = ?").get(id); return (r && r.soglia_idee) || db.impostazioneNum("soglia_idee", 30); };
const soglia = (req) => sogliaScuola(sc(req));
const uid = (req) => req.utente.id;
const èAdmin = (req) => req.utente.ruolo === "admin";
const trova = (sql, ...p) => db.prepare(sql).get(...p);
const inizioGiornata = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };

const sc = (req) => req.utente.scuola_id;
/** Looks up a row by id INSIDE the user's school (the query must end with "WHERE id = ?"). */
function esiste(sql, id, cosa, req) {
    const r = trova(sql + " AND scuola_id = ?", id, sc(req));
    if (!r) throw new HttpError(404, `${cosa} non trovato.`);
    return r;
}
/** L'autore o un admin può eliminare. */
function permessoElimina(req, autoreId) {
    if (autoreId !== uid(req) && !èAdmin(req)) throw new HttpError(403, "Non puoi eliminare questo contenuto.");
}

/* =====================================================================
   LETTURA: tutto ciò che serve alla bacheca in una sola chiamata
   ===================================================================== */
router.get("/dati", (req, res) => {
    const me = uid(req), S0 = sc(req);
    const q = (sql, ...p) => db.prepare(sql).all(...p);

    const eventi = q(`SELECT e.*, (SELECT COUNT(*) FROM partecipazioni p WHERE p.evento_id = e.id) AS partecipanti,
                             EXISTS(SELECT 1 FROM partecipazioni p WHERE p.evento_id = e.id AND p.utente_id = ?) AS partecipo
                      FROM eventi e WHERE e.scuola_id = ? AND e.inizio >= ? ORDER BY e.inizio LIMIT 200`, me, S0, inizioGiornata())
        .map((e) => ({ id: e.id, titolo: e.titolo, descrizione: e.descrizione, luogo: e.luogo, categoria: e.categoria,
                       inizio: e.inizio, partecipanti: e.partecipanti, partecipo: !!e.partecipo }));

    const comunicazioni = q(`SELECT c.id, c.titolo, c.testo, c.creato_il FROM comunicazioni c WHERE c.scuola_id = ? ORDER BY c.creato_il DESC LIMIT 10`, S0);

    const idee = q(`SELECT i.id, i.titolo, i.descrizione, i.stato, i.creato_il, i.autore_id, u.nome, u.cognome,
                           (SELECT COUNT(*) FROM voti_idee v WHERE v.idea_id = i.id) AS voti,
                           EXISTS(SELECT 1 FROM voti_idee v WHERE v.idea_id = i.id AND v.utente_id = ?) AS io_voto
                    FROM idee i JOIN utenti u ON u.id = i.autore_id WHERE i.scuola_id = ? ORDER BY voti DESC, i.creato_il DESC LIMIT 300`, me, S0)
        .map((i) => ({ id: i.id, titolo: i.titolo, descrizione: i.descrizione, stato: i.stato, creato_il: i.creato_il,
                       autore: nomeBreve(i.nome, i.cognome), voti: i.voti, io_voto: !!i.io_voto, mio: i.autore_id === me }));

    const opzioni = q(`SELECT o.id, o.sondaggio_id, o.testo, (SELECT COUNT(*) FROM sondaggi_voti v WHERE v.opzione_id = o.id) AS voti
                       FROM sondaggi_opzioni o JOIN sondaggi s ON s.id = o.sondaggio_id WHERE s.scuola_id = ? ORDER BY o.posizione`, S0);
    const mieiVoti = Object.fromEntries(q("SELECT sondaggio_id, opzione_id FROM sondaggi_voti WHERE utente_id = ?", me).map((v) => [v.sondaggio_id, v.opzione_id]));
    const sondaggi = q(`SELECT s.id, s.domanda, s.creato_il, s.autore_id, u.nome, u.cognome FROM sondaggi s JOIN utenti u ON u.id = s.autore_id
                        WHERE s.scuola_id = ? ORDER BY s.creato_il DESC LIMIT 100`, S0)
        .map((s) => ({ id: s.id, domanda: s.domanda, creato_il: s.creato_il, autore: nomeBreve(s.nome, s.cognome), mio: s.autore_id === me,
                       mio_voto: mieiVoti[s.id] || null,
                       opzioni: opzioni.filter((o) => o.sondaggio_id === s.id).map((o) => ({ id: o.id, testo: o.testo, voti: o.voti })) }));

    const commenti = q(`SELECT c.id, c.appunto_id, c.testo, c.creato_il, c.autore_id, u.nome, u.cognome FROM commenti_appunti c
                        JOIN utenti u ON u.id = c.autore_id WHERE c.scuola_id = ? ORDER BY c.creato_il`, S0);
    const mieiVotiAppunti = Object.fromEntries(q("SELECT appunto_id, valore FROM appunti_voti WHERE utente_id = ?", me).map((v) => [v.appunto_id, v.valore]));
    const appunti = q(`SELECT a.id, a.titolo, a.materia, a.testo, a.creato_il, a.autore_id, u.nome, u.cognome,
                              COALESCE((SELECT SUM(v.valore) FROM appunti_voti v WHERE v.appunto_id = a.id), 0) AS punteggio
                       FROM appunti a JOIN utenti u ON u.id = a.autore_id WHERE a.scuola_id = ? ORDER BY a.creato_il DESC LIMIT 200`, S0)
        .map((a) => ({ id: a.id, titolo: a.titolo, materia: a.materia, testo: a.testo, creato_il: a.creato_il, autore: nomeBreve(a.nome, a.cognome),
                       punteggio: a.punteggio, mio_voto: mieiVotiAppunti[a.id] || 0, mio: a.autore_id === me, foto: `/api/appunti/${a.id}/foto`,
                       commenti: commenti.filter((c) => c.appunto_id === a.id).map((c) => ({ id: c.id, testo: c.testo, creato_il: c.creato_il,
                                 autore: nomeBreve(c.nome, c.cognome), mio: c.autore_id === me })) }));

    const richiesteTutte = q(`SELECT r.libro_id, r.richiedente_id, r.stato, u.nome, u.cognome, u.classe FROM richieste_libri r
                              JOIN utenti u ON u.id = r.richiedente_id JOIN libri l ON l.id = r.libro_id WHERE l.scuola_id = ? ORDER BY r.creato_il`, S0);
    const libri = q(`SELECT l.*, u.nome, u.cognome FROM libri l JOIN utenti u ON u.id = l.venditore_id
                     WHERE l.scuola_id = ? AND (l.stato <> 'ceduto' OR l.venditore_id = ?) ORDER BY l.creato_il DESC LIMIT 300`, S0, me)
        .map((l) => {
            const rich = richiesteTutte.filter((r) => r.libro_id === l.id), mio = l.venditore_id === me;
            const mia = rich.find((r) => r.richiedente_id === me);
            return { id: l.id, titolo: l.titolo, materia: l.materia, classe: l.classe, condizione: l.condizione, prezzo_cent: l.prezzo_cent,
                     nota: l.nota, stato: l.stato, creato_il: l.creato_il, venditore: nomeBreve(l.nome, l.cognome), mio,
                     n_richieste: rich.length, mia_richiesta: mia ? mia.stato : null,
                     // solo il venditore vede chi ha chiesto il libro
                     richieste: mio ? rich.map((r) => ({ utente_id: r.richiedente_id, nome: nomeBreve(r.nome, r.cognome), classe: r.classe, stato: r.stato })) : undefined };
        });

    res.json({
        eventi, comunicazioni, idee, sondaggi, appunti, libri,
        config: { soglia_idee: soglia(req), commissione_percentuale: db.impostazioneNum("commissione_percentuale", 2),
                  max_opzioni_sondaggio: db.impostazioneNum("max_opzioni_sondaggio", 5) }
    });
});

/* =====================================================================
   EVENTI e COMUNICAZIONI (solo admin scrive)
   ===================================================================== */
router.post("/eventi", soloAdmin, (req, res) => {
    const b = req.body || {};
    const inizio = Number(b.inizio);
    if (!Number.isFinite(inizio) || inizio < Date.now() - 86400000 || inizio > Date.now() + 5 * 365 * 86400000) throw new HttpError(400, "Data non valida.");
    const id = S.uuid();
    db.prepare("INSERT INTO eventi (id, titolo, descrizione, luogo, categoria, inizio, autore_id, creato_il, scuola_id) VALUES (?,?,?,?,?,?,?,?,?)")
        .run(id, testo(b.titolo, "Titolo", 1, 120), testo(b.descrizione, "Descrizione", 0, 600, { multilinea: true }), testo(b.luogo, "Luogo", 0, 80),
             scelta(b.categoria, CATEGORIE, "Categoria"), Math.round(inizio), uid(req), adesso(), sc(req));
    res.json({ id });
});
router.delete("/eventi/:id", soloAdmin, (req, res) => {
    db.prepare("DELETE FROM eventi WHERE id = ? AND scuola_id = ?").run(req.params.id, sc(req));
    res.json({ ok: true });
});
router.put("/eventi/:id/partecipa", (req, res) => {
    esiste("SELECT id FROM eventi WHERE id = ?", req.params.id, "Evento", req);
    db.prepare("INSERT OR IGNORE INTO partecipazioni (evento_id, utente_id, creato_il) VALUES (?,?,?)").run(req.params.id, uid(req), adesso());
    res.json({ ok: true });
});
router.delete("/eventi/:id/partecipa", (req, res) => {
    db.prepare("DELETE FROM partecipazioni WHERE evento_id = ? AND utente_id = ?").run(req.params.id, uid(req));
    res.json({ ok: true });
});

router.post("/comunicazioni", soloAdmin, (req, res) => {
    const b = req.body || {}, id = S.uuid();
    db.prepare("INSERT INTO comunicazioni (id, titolo, testo, autore_id, creato_il, scuola_id) VALUES (?,?,?,?,?,?)")
        .run(id, testo(b.titolo, "Titolo", 1, 120), testo(b.testo, "Testo", 0, 600, { multilinea: true }), uid(req), adesso(), sc(req));
    res.json({ id });
});
router.delete("/comunicazioni/:id", soloAdmin, (req, res) => {
    db.prepare("DELETE FROM comunicazioni WHERE id = ? AND scuola_id = ?").run(req.params.id, sc(req));
    res.json({ ok: true });
});

/* =====================================================================
   IDEE
   ===================================================================== */
router.post("/idee", (req, res) => {
    const b = req.body || {}, id = S.uuid(), ora = adesso();
    db.transaction(() => {
        db.prepare("INSERT INTO idee (id, titolo, descrizione, autore_id, creato_il, scuola_id) VALUES (?,?,?,?,?,?)")
            .run(id, testo(b.titolo, "Titolo", 1, 80), testo(b.descrizione, "Descrizione", 0, 400, { multilinea: true }), uid(req), ora, sc(req));
        db.prepare("INSERT INTO voti_idee (idea_id, utente_id, creato_il) VALUES (?,?,?)").run(id, uid(req), ora);   // chi propone sostiene
    })();
    res.json({ id });
});
router.delete("/idee/:id", (req, res) => {
    const i = esiste("SELECT autore_id FROM idee WHERE id = ?", req.params.id, "Idea", req);
    permessoElimina(req, i.autore_id);
    db.prepare("DELETE FROM idee WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
});
router.put("/idee/:id/voto", (req, res) => {
    esiste("SELECT id FROM idee WHERE id = ?", req.params.id, "Idea", req);
    db.prepare("INSERT OR IGNORE INTO voti_idee (idea_id, utente_id, creato_il) VALUES (?,?,?)").run(req.params.id, uid(req), adesso());
    res.json({ ok: true });
});
router.delete("/idee/:id/voto", (req, res) => {
    db.prepare("DELETE FROM voti_idee WHERE idea_id = ? AND utente_id = ?").run(req.params.id, uid(req));
    res.json({ ok: true });
});
router.post("/idee/:id/esponi", soloAdmin, (req, res) => {
    const soglia = sogliaScuola(sc(req));
    const i = esiste("SELECT (SELECT COUNT(*) FROM voti_idee WHERE idea_id = idee.id) AS voti FROM idee WHERE id = ?", req.params.id, "Idea", req);
    if (i.voti < soglia) throw new HttpError(400, "L'idea non ha ancora raggiunto la soglia.");
    db.prepare("UPDATE idee SET stato = 'esposta' WHERE id = ? AND scuola_id = ?").run(req.params.id, sc(req));
    res.json({ ok: true });
});

/* =====================================================================
   SONDAGGI
   ===================================================================== */
router.post("/sondaggi", (req, res) => {
    const b = req.body || {}, max = db.impostazioneNum("max_opzioni_sondaggio", 5);
    const domanda = testo(b.domanda, "Domanda", 1, 120);
    if (!Array.isArray(b.opzioni) || b.opzioni.length > 20) throw new HttpError(400, "Opzioni non valide.");
    const opzioni = b.opzioni.map((o) => (typeof o === "string" ? o.replace(/\s+/g, " ").trim() : "")).filter(Boolean);
    if (opzioni.length < 2 || opzioni.length > max) throw new HttpError(400, `Servono da 2 a ${max} opzioni.`);
    opzioni.forEach((o) => testo(o, "Opzione", 1, 60));
    if (new Set(opzioni.map((o) => o.toLowerCase())).size !== opzioni.length) throw new HttpError(400, "Le opzioni devono essere diverse tra loro.");
    const id = S.uuid();
    db.transaction(() => {
        db.prepare("INSERT INTO sondaggi (id, domanda, autore_id, creato_il, scuola_id) VALUES (?,?,?,?,?)").run(id, domanda, uid(req), adesso(), sc(req));
        const ins = db.prepare("INSERT INTO sondaggi_opzioni (id, sondaggio_id, testo, posizione) VALUES (?,?,?,?)");
        opzioni.forEach((o, n) => ins.run(S.uuid(), id, o, n));
    })();
    res.json({ id });
});
router.delete("/sondaggi/:id", (req, res) => {
    const s = esiste("SELECT autore_id FROM sondaggi WHERE id = ?", req.params.id, "Sondaggio", req);
    permessoElimina(req, s.autore_id);
    db.prepare("DELETE FROM sondaggi WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
});
router.put("/sondaggi/:id/voto", (req, res) => {
    esiste("SELECT id FROM sondaggi WHERE id = ?", req.params.id, "Sondaggio", req);
    const opz = trova("SELECT id FROM sondaggi_opzioni WHERE id = ? AND sondaggio_id = ?", String((req.body || {}).opzione), req.params.id);
    if (!opz) throw new HttpError(400, "Opzione non valida.");
    db.prepare(`INSERT INTO sondaggi_voti (sondaggio_id, utente_id, opzione_id, creato_il) VALUES (?,?,?,?)
                ON CONFLICT (sondaggio_id, utente_id) DO UPDATE SET opzione_id = excluded.opzione_id`).run(req.params.id, uid(req), opz.id, adesso());
    res.json({ ok: true });
});

/* =====================================================================
   APPUNTI (foto salvata su disco, mostrata solo a chi ha fatto l'accesso)
   ===================================================================== */
const MAX_FOTO = 2 * 1024 * 1024;
function leggiFoto(dataUrl) {
    const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(typeof dataUrl === "string" ? dataUrl : "");
    if (!m) throw new HttpError(400, "Foto non valida (formati ammessi: JPEG, PNG, WebP).");
    const buf = Buffer.from(m[2], "base64");
    if (buf.length > MAX_FOTO) throw new HttpError(400, "La foto è troppo grande (massimo 2 MB).");
    // Controllo del contenuto reale (non ci si fida del tipo dichiarato)
    const jpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
    const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
    const webp = buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP";
    if (!(jpeg || png || webp)) throw new HttpError(400, "Il file non è un'immagine valida.");
    return { buf, ext: jpeg ? "jpg" : png ? "png" : "webp" };
}
const TIPI = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

router.post("/appunti", (req, res) => {
    const b = req.body || {};
    const titolo = testo(b.titolo, "Titolo", 1, 80), materia = scelta(b.materia, MATERIE, "Materia"), t = testo(b.testo, "Spiegazione", 1, 600, { multilinea: true });
    const { buf, ext } = leggiFoto(b.foto);
    const id = S.uuid(), nomeFile = `${S.uuid()}.${ext}`;
    fs.writeFileSync(path.join(config.UPLOAD_DIR, nomeFile), buf, { mode: 0o600 });
    try {
        db.prepare("INSERT INTO appunti (id, titolo, materia, testo, foto, autore_id, creato_il, scuola_id) VALUES (?,?,?,?,?,?,?,?)")
            .run(id, titolo, materia, t, nomeFile, uid(req), adesso(), sc(req));
    } catch (e) { db.rimuoviFoto(nomeFile); throw e; }
    res.json({ id });
});
router.get("/appunti/:id/foto", (req, res) => {
    const a = esiste("SELECT foto FROM appunti WHERE id = ?", req.params.id, "Appunto", req);
    const ext = a.foto.split(".").pop();
    res.setHeader("Content-Type", TIPI[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", "private, max-age=3600");
    fs.createReadStream(path.join(config.UPLOAD_DIR, a.foto)).on("error", () => res.status(404).end()).pipe(res);
});
router.delete("/appunti/:id", (req, res) => {
    const a = esiste("SELECT autore_id, foto FROM appunti WHERE id = ?", req.params.id, "Appunto", req);
    permessoElimina(req, a.autore_id);
    db.prepare("DELETE FROM appunti WHERE id = ?").run(req.params.id);
    db.rimuoviFoto(a.foto);
    res.json({ ok: true });
});
router.put("/appunti/:id/voto", (req, res) => {
    const valore = Number((req.body || {}).valore);
    if (valore !== 1 && valore !== -1) throw new HttpError(400, "Voto non valido.");
    esiste("SELECT id FROM appunti WHERE id = ?", req.params.id, "Appunto", req);
    db.prepare(`INSERT INTO appunti_voti (appunto_id, utente_id, valore) VALUES (?,?,?)
                ON CONFLICT (appunto_id, utente_id) DO UPDATE SET valore = excluded.valore`).run(req.params.id, uid(req), valore);
    res.json({ ok: true });
});
router.delete("/appunti/:id/voto", (req, res) => {
    db.prepare("DELETE FROM appunti_voti WHERE appunto_id = ? AND utente_id = ?").run(req.params.id, uid(req));
    res.json({ ok: true });
});
router.post("/appunti/:id/commenti", (req, res) => {
    esiste("SELECT id FROM appunti WHERE id = ?", req.params.id, "Appunto", req);
    const id = S.uuid();
    db.prepare("INSERT INTO commenti_appunti (id, appunto_id, autore_id, testo, creato_il, scuola_id) VALUES (?,?,?,?,?,?)")
        .run(id, req.params.id, uid(req), testo((req.body || {}).testo, "Commento", 1, 300, { multilinea: true }), adesso(), sc(req));
    res.json({ id });
});
router.delete("/commenti/:id", (req, res) => {
    const c = esiste("SELECT autore_id FROM commenti_appunti WHERE id = ?", req.params.id, "Commento", req);
    permessoElimina(req, c.autore_id);
    db.prepare("DELETE FROM commenti_appunti WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
});

/* =====================================================================
   LIBRI
   ===================================================================== */
router.post("/libri", (req, res) => {
    const b = req.body || {};
    const euro = Number(b.prezzo_cent);
    if (!Number.isInteger(euro) || euro < 0 || euro > 20000) throw new HttpError(400, "Prezzo non valido (da 0 a 200 euro).");
    const id = S.uuid();
    db.prepare(`INSERT INTO libri (id, titolo, materia, classe, condizione, prezzo_cent, nota, venditore_id, creato_il, scuola_id) VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .run(id, testo(b.titolo, "Titolo", 1, 80), scelta(b.materia, MATERIE, "Materia"), scelta(b.classe, CLASSI, "Classe"),
             scelta(b.condizione, CONDIZIONI, "Condizione"), euro, testo(b.nota, "Nota", 0, 200, { multilinea: true }), uid(req), adesso(), sc(req));
    res.json({ id });
});
router.delete("/libri/:id", (req, res) => {
    const l = esiste("SELECT venditore_id FROM libri WHERE id = ?", req.params.id, "Libro", req);
    permessoElimina(req, l.venditore_id);
    db.prepare("DELETE FROM libri WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
});
router.patch("/libri/:id", (req, res) => {
    const l = esiste("SELECT venditore_id FROM libri WHERE id = ?", req.params.id, "Libro", req);
    permessoElimina(req, l.venditore_id);
    db.prepare("UPDATE libri SET stato = ? WHERE id = ?").run(scelta((req.body || {}).stato, ["disponibile", "riservato", "ceduto"], "Stato"), req.params.id);
    res.json({ ok: true });
});
router.put("/libri/:id/richiesta", (req, res) => {
    const l = esiste("SELECT venditore_id, stato FROM libri WHERE id = ?", req.params.id, "Libro", req);
    if (l.venditore_id === uid(req)) throw new HttpError(400, "Non puoi chiedere un libro tuo.");
    if (l.stato === "ceduto") throw new HttpError(400, "Questo libro è già stato ceduto.");
    db.prepare("INSERT OR IGNORE INTO richieste_libri (libro_id, richiedente_id, creato_il) VALUES (?,?,?)").run(req.params.id, uid(req), adesso());
    res.json({ ok: true });
});
router.delete("/libri/:id/richiesta", (req, res) => {
    db.prepare("DELETE FROM richieste_libri WHERE libro_id = ? AND richiedente_id = ?").run(req.params.id, uid(req));
    res.json({ ok: true });
});
router.patch("/libri/:id/richieste/:utente", (req, res) => {
    const l = esiste("SELECT venditore_id FROM libri WHERE id = ?", req.params.id, "Libro", req);
    if (l.venditore_id !== uid(req)) throw new HttpError(403, "Solo il venditore può rispondere alle richieste.");
    const stato = scelta((req.body || {}).stato, ["accettata", "rifiutata"], "Stato");
    const r = db.prepare("UPDATE richieste_libri SET stato = ? WHERE libro_id = ? AND richiedente_id = ?").run(stato, req.params.id, req.params.utente);
    if (!r.changes) throw new HttpError(404, "Richiesta non trovata.");
    if (stato === "accettata") db.prepare("UPDATE libri SET stato = 'riservato' WHERE id = ? AND stato = 'disponibile'").run(req.params.id);
    res.json({ ok: true });
});

/* =====================================================================
   SEGNALAZIONI (moderazione)
   ===================================================================== */
const TABELLE_SEGNALABILI = { idea: "idee", sondaggio: "sondaggi", appunto: "appunti", commento: "commenti_appunti", libro: "libri" };
router.post("/segnalazioni", (req, res) => {
    const b = req.body || {};
    const tabella = TABELLE_SEGNALABILI[b.tipo];
    if (!tabella) throw new HttpError(400, "Tipo di contenuto non valido.");
    esiste(`SELECT id FROM ${tabella} WHERE id = ?`, String(b.contenuto_id), "Contenuto", req);
    db.prepare("INSERT OR IGNORE INTO segnalazioni (id, tipo, contenuto_id, motivo, segnalato_da, creato_il, scuola_id) VALUES (?,?,?,?,?,?,?)")
        .run(S.uuid(), b.tipo, String(b.contenuto_id), testo(b.motivo, "Motivo", 0, 300), uid(req), adesso(), sc(req));
    res.json({ ok: true });
});
router.get("/segnalazioni", soloAdmin, (req, res) => {
    const righe = db.prepare(`SELECT s.id, s.tipo, s.contenuto_id, s.motivo, s.stato, s.creato_il FROM segnalazioni s
                              WHERE s.stato = 'aperta' AND s.scuola_id = ? ORDER BY s.creato_il DESC LIMIT 100`).all(sc(req));
    const anteprima = {
        idea: "SELECT titolo AS t FROM idee WHERE id = ?", sondaggio: "SELECT domanda AS t FROM sondaggi WHERE id = ?",
        appunto: "SELECT titolo AS t FROM appunti WHERE id = ?", commento: "SELECT testo AS t FROM commenti_appunti WHERE id = ?",
        libro: "SELECT titolo AS t FROM libri WHERE id = ?"
    };
    res.json(righe.map((s) => ({ ...s, contenuto: (trova(anteprima[s.tipo], s.contenuto_id) || {}).t || "(contenuto già eliminato)" })));
});
router.post("/segnalazioni/:id/risolvi", soloAdmin, (req, res) => {
    db.prepare("UPDATE segnalazioni SET stato = 'risolta' WHERE id = ? AND scuola_id = ?").run(req.params.id, sc(req));
    res.json({ ok: true });
});
/** Segnalazioni risolte più vecchie di 90 giorni vengono cancellate dalla pulizia automatica. */

/* =====================================================================
   SCUOLA (community): info for everyone, invite code and settings for the school admin
   ===================================================================== */
const infoScuola = (req) => {
    const r = db.prepare("SELECT * FROM scuole WHERE id = ?").get(sc(req));
    const out = { nome: r.nome, soglia_idee: soglia(req) };
    if (èAdmin(req)) {
        out.codice_invito = db.formattaCodice(r.codice_invito);
        out.dominio_email = r.dominio_email;
        out.membri = db.prepare("SELECT COUNT(*) n FROM utenti WHERE scuola_id = ?").get(r.id).n;
    }
    return out;
};
router.get("/scuola", (req, res) => res.json(infoScuola(req)));
router.post("/scuola/codice", soloAdmin, (req, res) => {
    db.prepare("UPDATE scuole SET codice_invito = ? WHERE id = ?").run(db.nuovoCodiceInvito(), sc(req));
    res.json(infoScuola(req));
});
router.patch("/scuola", soloAdmin, (req, res) => {
    const b = req.body || {};
    if (b.soglia_idee !== undefined) {
        const n = Number(b.soglia_idee);
        if (!Number.isInteger(n) || n < 1 || n > 100000) throw new HttpError(400, "Soglia non valida.");
        db.prepare("UPDATE scuole SET soglia_idee = ? WHERE id = ?").run(n, sc(req));
    }
    if (b.dominio_email !== undefined) {
        const d = String(b.dominio_email || "").trim().toLowerCase();
        if (d && !/^@?[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) throw new HttpError(400, "Dominio non valido (es. @scuola.edu.it).");
        db.prepare("UPDATE scuole SET dominio_email = ? WHERE id = ?").run(d ? d.replace(/^(?!@)/, "@") : null, sc(req));
    }
    res.json(infoScuola(req));
});

module.exports = { router };
