"use strict";
/* Test end-to-end delle API: registrazione, accesso, permessi, contenuti, privacy (export/cancellazione).
   Si avviano con `npm test`. Usano un database e una cartella dati temporanei: i dati veri non vengono toccati. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hub-test-"));
process.env.DATA_DIR = tmp;
process.env.HUB_DB_FILE = path.join(tmp, "test.sqlite");
process.env.BASE_URL = "http://localhost";
process.env.REGISTRAZIONI_ORA_PER_IP = "1000";

const config = require("../backend/config");
const db = require("../backend/db");
const mail = require("../backend/mail");
const { creaApp } = require("../backend/app");

const scuolaA = db.creaScuola({ nome: "School A", dominio_email: "@scuola.test" });   // domain-restricted
const scuolaB = db.creaScuola({ nome: "School B" });                                  // any email
const CODICE = db.formattaCodice(scuolaA.codice_invito), CODICE_B = db.formattaCodice(scuolaB.codice_invito);

const tokens = {};            // email -> ultimo token ricevuto
mail.inviaVerifica = async (a, n, t) => { tokens["verifica:" + a] = t; };
mail.inviaReset = async (a, n, t) => { tokens["reset:" + a] = t; };
mail.inviaGiaRegistrato = async (a) => { tokens["gia:" + a] = true; };

let server, base;
test.before(async () => { server = creaApp().listen(0); await new Promise((r) => server.on("listening", r)); base = "http://127.0.0.1:" + server.address().port; });
test.after(() => { server.close(); db.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

/** Piccolo client con cookie. */
function client() {
    let cookie = "";
    const chiama = async (metodo, url, corpo, intestazioni = {}) => {
        const h = { "X-Requested-With": "hub", ...intestazioni };
        if (cookie) h.Cookie = cookie;
        if (corpo !== undefined) h["Content-Type"] = "application/json";
        const r = await fetch(base + url, { method: metodo, headers: h, body: corpo !== undefined ? JSON.stringify(corpo) : undefined, redirect: "manual" });
        const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
        for (const c of sc) { const kv = c.split(";")[0]; cookie = kv.endsWith("=") ? "" : kv; }
        const testo = await r.text();
        let json = null; try { json = JSON.parse(testo); } catch (e) { /* non JSON */ }
        return { stato: r.status, json, testo, headers: r.headers };
    };
    return { get: (u) => chiama("GET", u), post: (u, c) => chiama("POST", u, c || {}), put: (u, c) => chiama("PUT", u, c || {}),
             patch: (u, c) => chiama("PATCH", u, c || {}), del: (u, c) => chiama("DELETE", u, c || {}), raw: chiama };
}

const PW = "Una-password-lunga-1";
async function nuovoUtente(email, extra = {}) {
    const c = client();
    const r = await c.post("/api/auth/register", { nome: "Mario", cognome: "Rossi", email, classe: "3ªB", password: PW, consenso: true, eta14: true, codice_scuola: CODICE, ...extra });
    assert.equal(r.stato, 200, JSON.stringify(r.json));
    const v = await fetch(base + "/api/auth/verifica?token=" + tokens["verifica:" + email], { redirect: "manual" });
    assert.equal(v.headers.get("location"), "/index.html?verificato=1");
    const l = await c.post("/api/auth/login", { email, password: PW });
    assert.equal(l.stato, 200);
    return c;
}

test("intestazioni di sicurezza e file sensibili non raggiungibili", async () => {
    const r = await fetch(base + "/index.html");
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-security-policy"), /default-src 'self'/);
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
    for (const p of ["/.env", "/package.json", "/src/backend/config.js", "/data/test.sqlite", "/../package.json"]) {
        const x = await fetch(base + p); assert.notEqual(x.status, 200, p);
    }
});

test("registrazione: regole, privacy e verifica email", async () => {
    const c = client();
    const ok = { nome: "Anna", cognome: "Bianchi", email: "anna@scuola.test", classe: "2ªA", password: PW, consenso: true, eta14: true, codice_scuola: CODICE };
    assert.equal((await c.post("/api/auth/register", { ...ok, email: "anna@gmail.com" })).json.codice, "dominio");
    assert.equal((await c.post("/api/auth/register", { ...ok, consenso: false })).json.codice, "consenso");
    assert.equal((await c.post("/api/auth/register", { ...ok, eta14: false })).json.codice, "eta");
    assert.equal((await c.post("/api/auth/register", { ...ok, password: "corta" })).json.codice, "password");
    assert.equal((await c.post("/api/auth/register", { ...ok, classe: "9ªZ" })).stato, 400);
    assert.equal((await c.post("/api/auth/register", ok)).stato, 200);
    // stessa risposta se l'email esiste già (nessuna enumerazione) e arriva un'email "hai già un account"
    const dup = await c.post("/api/auth/register", ok);
    assert.deepEqual(dup.json, { ok: true });
    assert.ok(tokens["gia:anna@scuola.test"]);
    // la password non è in chiaro nel database
    const riga = db.prepare("SELECT pw_hash, verificato FROM utenti WHERE email = ?").get("anna@scuola.test");
    assert.match(riga.pw_hash, /^scrypt\$/); assert.ok(!riga.pw_hash.includes(PW)); assert.equal(riga.verificato, 0);
    // senza conferma email non si entra
    const l = await c.post("/api/auth/login", { email: "anna@scuola.test", password: PW });
    assert.equal(l.stato, 403); assert.equal(l.json.codice, "non_verificato");
    // link sbagliato
    assert.equal((await fetch(base + "/api/auth/verifica?token=sbagliato", { redirect: "manual" })).headers.get("location"), "/index.html?verificato=0");
    // link giusto (monouso)
    const t = tokens["verifica:anna@scuola.test"];
    assert.equal((await fetch(base + "/api/auth/verifica?token=" + t, { redirect: "manual" })).headers.get("location"), "/index.html?verificato=1");
    assert.equal((await fetch(base + "/api/auth/verifica?token=" + t, { redirect: "manual" })).headers.get("location"), "/index.html?verificato=0");
    assert.equal((await c.post("/api/auth/login", { email: "anna@scuola.test", password: "sbagliata123" })).stato, 401);
    assert.equal((await c.post("/api/auth/login", { email: "anna@scuola.test", password: PW })).stato, 200);
});

test("CSRF, sessione e logout", async () => {
    const c = await nuovoUtente("csrf@scuola.test");
    assert.equal((await c.raw("POST", "/api/idee", { titolo: "x" }, { "X-Requested-With": "" })).stato, 403);
    assert.equal((await c.raw("POST", "/api/idee", { titolo: "x" }, { Origin: "https://evil.example" })).stato, 403);
    assert.equal((await client().get("/api/dati")).stato, 401);
    assert.equal((await c.get("/api/me")).stato, 200);
    await c.post("/api/auth/logout");
    assert.equal((await c.get("/api/me")).stato, 401);
});

test("blocco dopo troppi tentativi di accesso", async () => {
    await nuovoUtente("brute@scuola.test");
    const c = client();
    let ultimo;
    for (let i = 0; i < 8; i++) ultimo = await c.post("/api/auth/login", { email: "brute@scuola.test", password: "sbagliata" + i });
    assert.equal(ultimo.stato, 429);
    // anche con la password giusta, finché dura il blocco
    assert.equal((await c.post("/api/auth/login", { email: "brute@scuola.test", password: PW })).stato, 429);
});

test("recupero password chiude le altre sessioni", async () => {
    const c = await nuovoUtente("reset@scuola.test");
    const anon = client();
    assert.deepEqual((await anon.post("/api/auth/forgot", { email: "nessuno@scuola.test" })).json, { ok: true });
    assert.deepEqual((await anon.post("/api/auth/forgot", { email: "reset@scuola.test" })).json, { ok: true });
    const t = tokens["reset:reset@scuola.test"];
    assert.equal((await anon.post("/api/auth/reset", { token: t, password: "corta" })).stato, 400);
    assert.equal((await anon.post("/api/auth/reset", { token: t, password: "Nuova-password-9" })).stato, 200);
    assert.equal((await anon.post("/api/auth/reset", { token: t, password: "Altra-password-9" })).stato, 400);   // monouso
    assert.equal((await c.get("/api/me")).stato, 401);
    assert.equal((await client().post("/api/auth/login", { email: "reset@scuola.test", password: "Nuova-password-9" })).stato, 200);
});

test("idee, sondaggi, libri, commenti e permessi", async () => {
    const a = await nuovoUtente("a@scuola.test"), b = await nuovoUtente("b@scuola.test");
    // idee: chi propone sostiene già; un solo voto a testa
    const idea = (await a.post("/api/idee", { titolo: "Distributori d'acqua", descrizione: "Meno plastica" })).json.id;
    await b.put(`/api/idee/${idea}/voto`); await b.put(`/api/idee/${idea}/voto`);
    let d = (await b.get("/api/dati")).json;
    let i = d.idee.find((x) => x.id === idea);
    assert.equal(i.voti, 2); assert.equal(i.io_voto, true); assert.equal(i.autore, "Mario R."); assert.equal(i.mio, false);
    assert.ok(!JSON.stringify(d).includes("a@scuola.test"), "le email non devono arrivare agli altri utenti");
    // permessi
    assert.equal((await b.del(`/api/idee/${idea}`)).stato, 403);
    assert.equal((await b.post(`/api/idee/${idea}/esponi`)).stato, 403);
    assert.equal((await b.post("/api/eventi", { titolo: "x", inizio: Date.now() + 1e8, categoria: "Sport" })).stato, 403);
    assert.equal((await b.post("/api/comunicazioni", { titolo: "x" })).stato, 403);
    assert.equal((await b.get("/api/segnalazioni")).stato, 403);
    // validazioni
    assert.equal((await a.post("/api/idee", { titolo: "" })).stato, 400);
    assert.equal((await a.post("/api/idee", { titolo: "x".repeat(81) })).stato, 400);
    assert.equal((await a.post("/api/idee", { titolo: { $ne: 1 } })).stato, 400);
    // XSS: il testo resta testo (la pagina lo mostra con esc()); il server non lo altera
    const xss = (await a.post("/api/idee", { titolo: "<img src=x onerror=alert(1)>" })).json.id;
    assert.ok((await a.get("/api/dati")).json.idee.find((x) => x.id === xss).titolo.includes("<img"));
    // sondaggi: 2-5 opzioni, si cambia voto
    assert.equal((await a.post("/api/sondaggi", { domanda: "Q?", opzioni: ["solo una"] })).stato, 400);
    assert.equal((await a.post("/api/sondaggi", { domanda: "Q?", opzioni: ["1", "2", "3", "4", "5", "6"] })).stato, 400);
    assert.equal((await a.post("/api/sondaggi", { domanda: "Q?", opzioni: ["A", "a"] })).stato, 400);
    const sond = (await a.post("/api/sondaggi", { domanda: "Gita?", opzioni: ["Mare", "Monti"] })).json.id;
    let s = (await b.get("/api/dati")).json.sondaggi.find((x) => x.id === sond);
    await b.put(`/api/sondaggi/${sond}/voto`, { opzione: s.opzioni[0].id });
    await b.put(`/api/sondaggi/${sond}/voto`, { opzione: s.opzioni[1].id });
    s = (await b.get("/api/dati")).json.sondaggi.find((x) => x.id === sond);
    assert.deepEqual(s.opzioni.map((o) => o.voti), [0, 1]); assert.equal(s.mio_voto, s.opzioni[1].id);
    assert.equal((await b.put(`/api/sondaggi/${sond}/voto`, { opzione: "inesistente" })).stato, 400);
    // libri: richiesta, solo il venditore vede chi chiede
    const libro = (await a.post("/api/libri", { titolo: "Matematica 3", materia: "Matematica", classe: "3ª", condizione: "Buono", prezzo_cent: 800, nota: "" })).json.id;
    assert.equal((await a.post("/api/libri", { titolo: "x", materia: "Matematica", classe: "3ª", condizione: "Buono", prezzo_cent: -5 })).stato, 400);
    assert.equal((await a.put(`/api/libri/${libro}/richiesta`)).stato, 400);   // non il proprio libro
    assert.equal((await b.put(`/api/libri/${libro}/richiesta`)).stato, 200);
    let lb = (await b.get("/api/dati")).json.libri.find((x) => x.id === libro);
    assert.equal(lb.mia_richiesta, "in_attesa"); assert.equal(lb.richieste, undefined);
    let la = (await a.get("/api/dati")).json.libri.find((x) => x.id === libro);
    assert.equal(la.richieste.length, 1); assert.equal(la.richieste[0].nome, "Mario R.");
    const bId = (await b.get("/api/me")).json.utente.id;
    assert.equal((await b.patch(`/api/libri/${libro}/richieste/${bId}`, { stato: "accettata" })).stato, 403);
    assert.equal((await a.patch(`/api/libri/${libro}/richieste/${bId}`, { stato: "accettata" })).stato, 200);
    lb = (await b.get("/api/dati")).json.libri.find((x) => x.id === libro);
    assert.equal(lb.stato, "riservato"); assert.equal(lb.mia_richiesta, "accettata");
    // segnalazioni
    assert.equal((await b.post("/api/segnalazioni", { tipo: "idea", contenuto_id: idea, motivo: "spam" })).stato, 200);
    assert.equal((await b.post("/api/segnalazioni", { tipo: "idea", contenuto_id: idea, motivo: "spam" })).stato, 200);   // doppia: ignorata
    assert.equal(db.prepare("SELECT COUNT(*) n FROM segnalazioni WHERE contenuto_id = ?").get(idea).n, 1);
    assert.equal((await b.post("/api/segnalazioni", { tipo: "utenti; DROP TABLE utenti", contenuto_id: idea })).stato, 400);
});

test("admin: eventi, comunicazioni, soglia idee, moderazione", async () => {
    const adm = await nuovoUtente("admin@scuola.test"), st = await nuovoUtente("stud@scuola.test");
    db.prepare("UPDATE utenti SET ruolo = 'admin' WHERE email = 'admin@scuola.test'").run();
    const ev = await adm.post("/api/eventi", { titolo: "Assemblea", descrizione: "", luogo: "Aula magna", categoria: "Scuola", inizio: Date.now() + 3 * 86400000 });
    assert.equal(ev.stato, 200);
    assert.equal((await adm.post("/api/eventi", { titolo: "Passato", categoria: "Scuola", inizio: 1000 })).stato, 400);
    assert.equal((await adm.post("/api/eventi", { titolo: "Cat", categoria: "Inventata", inizio: Date.now() + 1e8 })).stato, 400);
    assert.equal((await adm.post("/api/comunicazioni", { titolo: "Avviso", testo: "Ciao" })).stato, 200);
    await st.put(`/api/eventi/${ev.json.id}/partecipa`);
    let d = (await st.get("/api/dati")).json;
    assert.equal(d.eventi.find((e) => e.id === ev.json.id).partecipanti, 1);
    assert.equal(d.comunicazioni.length, 1);
    // soglia: l'idea non può essere "esposta" prima
    const idea = (await st.post("/api/idee", { titolo: "Idea" })).json.id;
    assert.equal((await adm.post(`/api/idee/${idea}/esponi`)).stato, 400);
    db.prepare("UPDATE impostazioni SET valore = '1' WHERE chiave = 'soglia_idee'").run();
    assert.equal((await adm.post(`/api/idee/${idea}/esponi`)).stato, 200);
    // moderazione: un admin può eliminare i contenuti altrui e leggere le segnalazioni
    await st.post("/api/segnalazioni", { tipo: "idea", contenuto_id: idea, motivo: "prova" });
    const mie = (await adm.get("/api/segnalazioni")).json.filter((x) => x.contenuto_id === idea);
    assert.equal(mie.length, 1); assert.equal(mie[0].contenuto, "Idea");
    assert.equal((await adm.del(`/api/idee/${idea}`)).stato, 200);
    assert.equal((await adm.post(`/api/segnalazioni/${mie[0].id}/risolvi`)).stato, 200);
    assert.equal((await adm.get("/api/segnalazioni")).json.filter((x) => x.contenuto_id === idea).length, 0);
});

// PNG 1x1 valido
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

test("appunti: foto validata, privata, voti e commenti", async () => {
    const a = await nuovoUtente("foto@scuola.test");
    const base_ = { titolo: "Equazioni", materia: "Matematica", testo: "Riassunto" };
    assert.equal((await a.post("/api/appunti", { ...base_, foto: "data:text/html;base64,PGgxPmhpPC9oMT4=" })).stato, 400);
    assert.equal((await a.post("/api/appunti", { ...base_, foto: "data:image/png;base64," + Buffer.from("non sono un png").toString("base64") })).stato, 400);
    assert.equal((await a.post("/api/appunti", { ...base_, foto: "data:image/png;base64," + Buffer.alloc(2.1 * 1024 * 1024, 1).toString("base64") })).stato, 400);
    assert.equal((await a.post("/api/appunti", { ...base_, foto: "data:image/png;base64," + Buffer.alloc(4 * 1024 * 1024, 1).toString("base64") })).stato, 413);   // oltre il limite della richiesta
    const r = await a.post("/api/appunti", { ...base_, foto: PNG });
    assert.equal(r.stato, 200, JSON.stringify(r.json));
    const id = r.json.id;
    const img = await a.raw("GET", `/api/appunti/${id}/foto`);
    assert.equal(img.stato, 200); assert.equal(img.headers.get("content-type"), "image/png");
    assert.equal((await client().get(`/api/appunti/${id}/foto`)).stato, 401);        // la foto è privata
    await a.put(`/api/appunti/${id}/voto`, { valore: 1 }); await a.put(`/api/appunti/${id}/voto`, { valore: -1 });
    assert.equal((await a.put(`/api/appunti/${id}/voto`, { valore: 5 })).stato, 400);
    assert.equal((await a.post(`/api/appunti/${id}/commenti`, { testo: "Utile!" })).stato, 200);
    const p = (await a.get("/api/dati")).json.appunti.find((x) => x.id === id);
    assert.equal(p.punteggio, -1); assert.equal(p.commenti.length, 1);
    assert.ok(fs.readdirSync(config.UPLOAD_DIR).length >= 1);
});

test("GDPR: esportazione, rettifica e cancellazione completa (foto comprese)", async () => {
    const u = await nuovoUtente("gdpr@scuola.test");
    const altro = await nuovoUtente("altro@scuola.test");
    const idea = (await u.post("/api/idee", { titolo: "Mia idea" })).json.id;
    await altro.put(`/api/idee/${idea}/voto`);
    const app = (await u.post("/api/appunti", { titolo: "T", materia: "Altro", testo: "x", foto: PNG })).json.id;
    await u.post("/api/libri", { titolo: "L", materia: "Altro", classe: "1ª", condizione: "Usato", prezzo_cent: 0, nota: "" });
    const file = db.prepare("SELECT foto FROM appunti WHERE id = ?").get(app).foto;
    assert.ok(fs.existsSync(path.join(config.UPLOAD_DIR, file)));

    // accesso e portabilità
    const ex = await u.get("/api/me/export");
    assert.equal(ex.stato, 200); assert.match(ex.headers.get("content-disposition"), /attachment/);
    const dati = JSON.parse(ex.testo);
    assert.equal(dati.profilo.email, "gdpr@scuola.test"); assert.equal(dati.idee_proposte.length, 1);
    assert.equal(dati.appunti.length, 1); assert.match(dati.appunti[0].foto, /^data:image\/jpeg;base64,/);
    assert.equal(dati.libri.length, 1);
    assert.ok(!ex.testo.includes("pw_hash") && !ex.testo.includes("scrypt$"), "l'export non deve contenere l'impronta della password");

    // rettifica
    assert.equal((await u.patch("/api/me", { nome: "Maria", cognome: "Verdi", classe: "4ªC" })).stato, 200);
    const me = (await u.get("/api/me")).json;
    assert.equal(me.utente.nome, "Maria"); assert.equal(me.utente.classe, "4ªC");
    assert.equal((await u.patch("/api/me", { nome: "X", cognome: "Y", classe: "99" })).stato, 400);

    // cancellazione: serve la password e la conferma
    assert.equal((await u.del("/api/me", { password: "sbagliata", conferma: true })).stato, 400);
    assert.equal((await u.del("/api/me", { password: PW })).stato, 400);
    assert.equal((await u.del("/api/me", { password: PW, conferma: true })).stato, 200);
    assert.equal((await u.get("/api/me")).stato, 401);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM utenti WHERE email = 'gdpr@scuola.test'").get().n, 0);
    for (const t of ["idee", "appunti", "libri", "sessioni"]) {
        assert.equal(db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE ${t === "libri" ? "venditore_id" : t === "sessioni" ? "utente_id" : "autore_id"} = ?`).get(me.utente.id).n, 0, t);
    }
    assert.equal(db.prepare("SELECT COUNT(*) n FROM voti_idee WHERE idea_id = ?").get(idea).n, 0);
    assert.ok(!fs.existsSync(path.join(config.UPLOAD_DIR, file)), "la foto deve sparire dal disco");
    assert.equal((await client().post("/api/auth/login", { email: "gdpr@scuola.test", password: PW })).stato, 401);
});

test("pulizia automatica: account non confermati e inattivi", async () => {
    const { pulisci } = require("../backend/cleanup");
    const G = 86400000, ora = Date.now();
    const ins = (email, verificato, creato, accesso) => db.prepare(`INSERT INTO utenti (id, email, nome, pw_hash, verificato, consenso_il, consenso_versione, creato_il, ultimo_accesso)
        VALUES (?,?,?,?,?,?,?,?,?)`).run(require("crypto").randomUUID(), email, "T", "x", verificato, creato, "v", creato, accesso);
    ins("vecchio-nv@scuola.test", 0, ora - 5 * G, ora - 5 * G);
    ins("recente-nv@scuola.test", 0, ora - 1 * G, ora - 1 * G);
    ins("inattivo@scuola.test", 1, ora - 500 * G, ora - 400 * G);
    ins("attivo@scuola.test", 1, ora - 500 * G, ora - 10 * G);
    const e = pulisci();
    assert.ok(e.non_verificati >= 1 && e.inattivi >= 1);
    const esiste = (m) => db.prepare("SELECT COUNT(*) n FROM utenti WHERE email = ?").get(m).n === 1;
    assert.equal(esiste("vecchio-nv@scuola.test"), false); assert.equal(esiste("recente-nv@scuola.test"), true);
    assert.equal(esiste("inattivo@scuola.test"), false); assert.equal(esiste("attivo@scuola.test"), true);
});


/* ---------------------------------------------------------------- multi-school */
test("registration: invite code required, per-school domain rule, any email for open schools", async () => {
    const c = client();
    const base = { nome: "Zoe", cognome: "Neri", password: PW, consenso: true, eta14: true };
    assert.equal((await c.post("/api/auth/register", { ...base, email: "zoe@gmail.com" })).json.codice, "codice");
    assert.equal((await c.post("/api/auth/register", { ...base, email: "zoe@gmail.com", codice_scuola: "AAAAA-AAAAA" })).json.codice, "codice");
    assert.equal((await c.post("/api/auth/register", { ...base, email: "zoe@gmail.com", codice_scuola: CODICE })).json.codice, "dominio");
    assert.equal((await c.post("/api/auth/register", { ...base, email: "zoe@gmail.com", codice_scuola: CODICE_B.toLowerCase().replace("-", " ") })).stato, 200);   // lenient formatting
    assert.equal(db.prepare("SELECT scuola_id FROM utenti WHERE email='zoe@gmail.com'").get().scuola_id, scuolaB.id);
});

test("isolation: users of different schools never see or touch each other's content", async () => {
    const a = await nuovoUtente("iso-a@scuola.test");
    const b = await nuovoUtente("iso-b@example.org", { codice_scuola: CODICE_B });
    const idea = (await a.post("/api/idee", { titolo: "Only for A", descrizione: "x" })).json.id;
    const poll = (await a.post("/api/sondaggi", { domanda: "Q?", opzioni: ["si", "no"] })).json.id;
    const libro = (await a.post("/api/libri", { titolo: "Book A", materia: "Altro", classe: "1ª", condizione: "Usato", prezzo_cent: 100 })).json.id;
    const dB = (await b.get("/api/dati")).json;
    assert.ok(!JSON.stringify(dB).includes("Only for A") && !JSON.stringify(dB).includes("Book A"));
    for (const [m, u] of [["put", `/api/idee/${idea}/voto`], ["del", `/api/idee/${idea}`], ["put", `/api/libri/${libro}/richiesta`], ["del", `/api/sondaggi/${poll}`]])
        assert.equal((await b[m](u)).stato, 404, m + " " + u);
    assert.equal((await b.post("/api/segnalazioni", { tipo: "idea", contenuto_id: idea, motivo: "x" })).stato, 404);
    assert.equal((await a.get("/api/dati")).json.idee.length >= 1, true);
});

test("school admin: invite code, settings, per-school idea threshold, isolation of admin powers", async () => {
    const adm = await nuovoUtente("sadm@example.org", { codice_scuola: CODICE_B });
    const altroAdmin = await nuovoUtente("sadm2@scuola.test");
    db.prepare("UPDATE utenti SET ruolo='admin' WHERE email IN ('sadm@example.org','sadm2@scuola.test')").run();
    const info = (await adm.get("/api/scuola")).json;
    assert.equal(info.codice_invito, CODICE_B); assert.ok(info.membri >= 2);
    const stud = await nuovoUtente("plain@scuola.test");
    assert.equal((await stud.get("/api/scuola")).json.codice_invito, undefined, "students must not see the code");
    assert.equal((await stud.post("/api/scuola/codice")).stato, 403);
    assert.equal((await adm.patch("/api/scuola", { soglia_idee: 2 })).json.soglia_idee, 2);
    assert.notEqual((await altroAdmin.get("/api/scuola")).json.soglia_idee, 2, "threshold is per school");
    const nuovo = (await adm.post("/api/scuola/codice")).json.codice_invito;
    assert.notEqual(nuovo, CODICE_B);
    assert.equal((await client().post("/api/auth/register", { nome: "X", cognome: "Y", email: "late@example.org", password: PW, consenso: true, eta14: true, codice_scuola: CODICE_B })).json.codice, "codice", "old code no longer works");
    // school-B admin cannot publish into school A, nor delete A's events
    const ev = (await altroAdmin.post("/api/eventi", { titolo: "A event", inizio: Date.now() + 86400000, categoria: "Scuola" })).json.id;
    assert.equal((await adm.del("/api/eventi/" + ev)).stato, 200);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM eventi WHERE id = ?").get(ev).n, 1, "other school's event must survive");
});

test("suspended school cannot sign in; deleting a school removes everything", async () => {
    const s = db.creaScuola({ nome: "Temp School" });
    const c = await nuovoUtente("temp@temp.org", { codice_scuola: db.formattaCodice(s.codice_invito) });
    await c.post("/api/appunti", { titolo: "n", materia: "Altro", testo: "t", foto: "data:image/png;base64," + PNG });
    assert.equal((await c.get("/api/dati")).stato, 200);
    db.prepare("UPDATE scuole SET attiva = 0 WHERE id = ?").run(s.id);
    assert.equal((await c.get("/api/dati")).json.codice, "scuola_sospesa");
    assert.equal((await client().post("/api/auth/register", { nome: "X", cognome: "Y", email: "n@temp.org", password: PW, consenso: true, eta14: true, codice_scuola: db.formattaCodice(s.codice_invito) })).json.codice, "codice");
    const foto = db.prepare("SELECT foto FROM appunti WHERE scuola_id = ?").all(s.id).map((r) => r.foto);
    db.eliminaScuola(s.id);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM utenti WHERE scuola_id = ?").get(s.id).n, 0);
    for (const f of foto) assert.equal(fs.existsSync(path.join(config.UPLOAD_DIR, f)), false);
});

test("migration 002 upgrades a v1 database into a default school", () => {
    const Database = require("better-sqlite3");
    const f = path.join(tmp, "v1.sqlite");
    const old = new Database(f);
    old.exec(fs.readFileSync(path.join(__dirname, "../backend/migrations/001_init.sql"), "utf8"));
    old.prepare("INSERT INTO utenti (id,email,nome,pw_hash,verificato,consenso_il,consenso_versione,creato_il,ultimo_accesso) VALUES ('u1','old@x.it','Old','h',1,1,'v',1,1)").run();
    old.close();
    const { execFileSync } = require("child_process");
    const out = execFileSync(process.execPath, ["-e", `
        process.env.HUB_DB_FILE=${JSON.stringify(f)}; process.env.DATA_DIR=${JSON.stringify(tmp)};
        const db=require(${JSON.stringify(path.join(__dirname, "../backend/db"))});
        console.log(JSON.stringify({v:db.prepare("SELECT valore FROM meta WHERE chiave='schema_versione'").get().valore,
          n:db.prepare("SELECT COUNT(*) n FROM scuole").get().n, s:db.prepare("SELECT scuola_id FROM utenti").get().scuola_id!==null}));`]).toString();
    assert.deepEqual(JSON.parse(out), { v: "2", n: 1, s: true });
});
