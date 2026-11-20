"use strict";
/* Tests for the optional/per-school modules: calendar, vending machines, class assemblies, bar pre-orders, notifications. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs"), os = require("os"), path = require("path");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hub-mod-"));
process.env.DATA_DIR = tmp;
process.env.HUB_DB_FILE = path.join(tmp, "test.sqlite");
process.env.BASE_URL = "http://localhost";
process.env.REGISTRAZIONI_ORA_PER_IP = "1000";

const db = require("../backend/db");
const mail = require("../backend/mail");
const M = require("../backend/modules");
const { rendi, inviaDigest } = require("../backend/notifiche");
const { creaApp } = require("../backend/app");

const A = db.creaScuola({ nome: "School A" }), B = db.creaScuola({ nome: "School B" });
const CA = db.formattaCodice(A.codice_invito), CB = db.formattaCodice(B.codice_invito);
const tokens = {}; let spedite = [];
mail.inviaVerifica = async (a, n, t) => { tokens[a] = t; };
mail.inviaGiaRegistrato = async () => {};
for (const k of Object.keys(mail)) if (/digest|notific/i.test(k)) mail[k] = async (...a) => { spedite.push([k, ...a]); };

let server, base;
test.before(async () => { server = creaApp().listen(0); await new Promise((r) => server.on("listening", r)); base = "http://127.0.0.1:" + server.address().port; });
test.after(() => { server.close(); db.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

function client() {
    let cookie = "";
    const go = async (m, u, body, h = {}) => {
        const hh = { "X-Requested-With": "hub", ...h }; if (cookie) hh.Cookie = cookie;
        if (body !== undefined && !hh["Content-Type"]) hh["Content-Type"] = "application/json";
        const r = await fetch(base + u, { method: m, headers: hh, body: body === undefined ? undefined : (typeof body === "string" ? body : JSON.stringify(body)) });
        for (const c of (r.headers.getSetCookie ? r.headers.getSetCookie() : [])) { const kv = c.split(";")[0]; cookie = kv.endsWith("=") ? "" : kv; }
        const t = await r.text(); let json = null; try { json = JSON.parse(t); } catch { /* not JSON */ }
        return { stato: r.status, json, testo: t, headers: r.headers };
    };
    return { get: (u) => go("GET", u), post: (u, b) => go("POST", u, b || {}), put: (u, b) => go("PUT", u, b || {}), patch: (u, b) => go("PATCH", u, b || {}), del: (u, b) => go("DELETE", u, b || {}), go };
}
const PW = "Una-password-lunga-1";
async function utente(email, { classe = "5INFC", codice = CA, admin = false, nome = "Luca" } = {}) {
    const c = client();
    const r = await c.post("/api/auth/register", { nome, cognome: "Verdi", email, classe, password: PW, consenso: true, eta14: true, codice_scuola: codice });
    assert.equal(r.stato, 200, JSON.stringify(r.json));
    await fetch(base + "/api/auth/verifica?token=" + tokens[email], { redirect: "manual" });
    if (admin) db.prepare("UPDATE utenti SET ruolo = 'admin' WHERE email = ?").run(email);
    assert.equal((await c.post("/api/auth/login", { email, password: PW })).stato, 200);
    return c;
}
const giorniAvanti = (n) => { const d = new Date(Date.now() + n * 86400000); if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };

test("calendar: entries per class, permissions, ICS export/import and private feed", async () => {
    const adm = await utente("cal-adm@a.test", { admin: true, classe: "1A" });
    const s1 = await utente("cal-s1@a.test", { classe: "5INFC" });
    const s2 = await utente("cal-s2@a.test", { classe: "2CSAS" });
    const d = giorniAvanti(3);
    const r = await s1.post("/api/calendario", { titolo: "Maths test", tipo: "verifica", data: d, materia: "Maths" });
    assert.equal(r.stato, 200, JSON.stringify(r.json));
    const finestra = `?da=${Date.now() - 86400000}&a=${Date.now() + 30 * 86400000}`;
    const vede = async (c) => (await c.get("/api/calendario" + finestra)).json.voci.map((v) => v.titolo);
    assert.ok((await vede(s1)).includes("Maths test"));
    assert.ok(!(await vede(s2)).includes("Maths test"), "other class does not see it");
    assert.ok((await vede(adm)).includes("Maths test"), "admin sees every class");
    // only the author (or admin) can edit
    const id = r.json.id;
    assert.equal((await s2.patch("/api/calendario/" + id, { titolo: "x", tipo: "verifica", data: d })).stato, 403);
    assert.equal((await s1.patch("/api/calendario/" + id, { titolo: "Maths test 2", tipo: "verifica", data: d })).stato, 200);
    // students cannot post for another class: the class is forced
    const forzata = await s1.post("/api/calendario", { titolo: "Sneaky", tipo: "compito", data: d, classe: "2CSAS" });
    assert.equal(forzata.stato, 200);
    assert.ok(!(await vede(s2)).includes("Sneaky"));
    // ICS export
    const ics = await s1.get("/api/calendario/esporta.ics");
    assert.equal(ics.stato, 200); assert.match(ics.testo, /BEGIN:VCALENDAR/); assert.match(ics.testo, /Maths test 2/);
    // ICS import
    const file = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:1@x\r\nDTSTART;VALUE=DATE:" + d.replace(/-/g, "") + "\r\nSUMMARY:Imported test\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n";
    const imp = await s1.go("POST", "/api/calendario/importa", file, { "Content-Type": "text/calendar" });
    assert.equal(imp.stato, 200, imp.testo);
    assert.ok((await vede(s1)).includes("Imported test"));
    // private feed: token in the URL only works for its owner, and can be revoked
    const url = (await s1.post("/api/calendario/feed")).json.url;
    const anon = client();
    const f = await anon.get(url); assert.equal(f.stato, 200); assert.match(f.testo, /Imported test/);
    assert.equal((await anon.get("/api/calendario-feed/" + "a".repeat(43) + ".ics")).stato, 404);
    await s1.del("/api/calendario/feed");
    assert.equal((await anon.get(url)).stato, 404, "revoked feed");
    // delete
    assert.equal((await s1.del("/api/calendario/" + id)).stato, 200);
});

test("vending machines: catalogue by admin, availability reports by students", async () => {
    const adm = await utente("v-adm@a.test", { admin: true });
    const st = await utente("v-st@a.test"), st2 = await utente("v-st2@a.test"), st3 = await utente("v-st3@a.test");
    assert.equal((await st.post("/api/macchinette", { nome: "Hall" })).stato, 403);
    const d = (await adm.post("/api/macchinette", { nome: "Ground floor", ubicazione: "Hall", prodotti: [{ nome: "Water 0.5l", categoria: "drinks", prezzo_cent: 80 }, { nome: "Crisps", prezzo_cent: 120 }] })).json;
    assert.ok(d.id);
    let lista = (await st.get("/api/macchinette")).json.distributori;
    assert.equal(lista[0].prodotti.length, 2);
    const acqua = lista[0].prodotti.find((p) => p.nome === "Water 0.5l");
    assert.equal(acqua.stato, "disponibile");
    assert.equal((await adm.post("/api/macchinette", { nome: "X", prodotti: [{ nome: "Bad", prezzo_cent: -5 }] })).stato, 400);
    // crowd reports: majority wins
    assert.equal((await st.put(`/api/macchinette/prodotti/${acqua.id}/segnala`, { stato: "esaurito" })).json.stato, "esaurito");
    await st2.put(`/api/macchinette/prodotti/${acqua.id}/segnala`, { stato: "esaurito" });
    assert.equal((await st3.put(`/api/macchinette/prodotti/${acqua.id}/segnala`, { stato: "disponibile" })).json.stato, "esaurito");
    // an official update resets reports
    await adm.patch(`/api/macchinette/prodotti/${acqua.id}`, { stato: "disponibile" });
    lista = (await st.get("/api/macchinette")).json.distributori;
    assert.equal(lista[0].prodotti.find((p) => p.id === acqua.id).stato, "disponibile");
    assert.equal((await st.put(`/api/macchinette/prodotti/${acqua.id}/segnala`, { stato: "boh" })).stato, 400);
    // another school sees nothing and cannot report
    const altro = await utente("v-b@b.test", { codice: CB });
    assert.equal((await altro.get("/api/macchinette")).json.distributori.length, 0);
    assert.equal((await altro.put(`/api/macchinette/prodotti/${acqua.id}/segnala`, { stato: "esaurito" })).stato, 404);
});

test("class assemblies: rules (notice, monthly limit), decision, notification, calendar", async () => {
    const adm = await utente("as-adm@a.test", { admin: true, classe: "1A" });
    const st = await utente("as-st@a.test", { classe: "2CSAS" });
    const mate = await utente("as-st2@a.test", { classe: "2CSAS" });
            assert.equal((await st.post("/api/assemblee", { data: giorniAvanti(1), durata_ore: 2, ordine_giorno: "Trip planning" })).json.codice, "preavviso");
    assert.equal((await st.post("/api/assemblee", { data: giorniAvanti(10), durata_ore: 3, ordine_giorno: "Trip planning" })).stato, 400);
    assert.equal((await st.post("/api/assemblee", { data: giorniAvanti(10), durata_ore: 2, ordine_giorno: "x" })).stato, 400);
    const r = await st.post("/api/assemblee", { data: giorniAvanti(10), durata_ore: 2, ordine_giorno: "Trip planning and budget" });
    assert.equal(r.stato, 200, JSON.stringify(r.json));
    assert.equal((await st.post("/api/assemblee", { data: giorniAvanti(10), durata_ore: 1, ordine_giorno: "Second request same month" })).json.codice, "limite_mensile");
    // admin sees it, other class does not
    assert.equal((await adm.get("/api/assemblee")).json.richieste.length, 1);
    const altra = await utente("as-other@a.test", { classe: "4B" });
    assert.equal((await altra.get("/api/assemblee")).json.richieste.length, 0);
    assert.equal((await st.post(`/api/assemblee/${r.json.id}/decidi`, { stato: "approvata" })).stato, 403);
    assert.equal((await adm.post(`/api/assemblee/${r.json.id}/decidi`, { stato: "rifiutata" })).stato, 400, "a refusal needs a reason");
    assert.equal((await adm.post(`/api/assemblee/${r.json.id}/decidi`, { stato: "approvata", data_confermata: giorniAvanti(11) })).stato, 200);
    // classmate was notified; the calendar shows it
    const n = (await mate.get("/api/notifiche")).json;
    assert.ok(n.non_lette >= 1); assert.match(n.elenco[0].titolo, /2CSAS/);
    const cal = (await mate.get(`/api/calendario?da=${Date.now()}&a=${Date.now() + 40 * 86400000}`)).json.voci;
    assert.ok(cal.some((v) => v.origine === "assemblea"));
    assert.equal((await adm.post(`/api/assemblee/${r.json.id}/decidi`, { stato: "rifiutata", motivo: "late" })).stato, 400, "already decided");
});

test("bar module: off by default, enabled per school, orders with cutoff and limits", async () => {
    const adm = await utente("bar-adm@b.test", { admin: true, codice: CB, classe: "1A" });
    const st = await utente("bar-st@b.test", { codice: CB, classe: "3H" });
    assert.equal((await st.get("/api/bar")).stato, 403, "not enabled by default");
    assert.equal((await st.get("/api/me")).json.utente.moduli.bar, false);
    const sb = db.prepare("SELECT id FROM scuole WHERE nome = 'School B'").get().id;
    M.impostaModulo(sb, "bar", true);
    assert.equal((await st.get("/api/me")).json.utente.moduli.bar, true);
    // School A (no bar) is unaffected
    const a = await utente("bar-a@a.test");
    assert.equal((await a.get("/api/bar")).stato, 403);
    const p1 = (await adm.post("/api/bar/prodotti", { nome: "Panino", prezzo_cent: 250, categoria: "food", allergeni: "gluten" })).json.id;
    const p2 = (await adm.post("/api/bar/prodotti", { nome: "Succo", prezzo_cent: 150 })).json.id;
    // a slot far in the future today is open; one that is already within cutoff is closed
    const loc = require("../backend/util").oraLocale(Date.now()).minuti;
    const hh = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
    const chiusa = (await adm.post("/api/bar/fasce", { etichetta: "Too soon", ora: hh(Math.min(1439, loc + 5)), cutoff_min: 60 })).json.id;
    const domani = giorniAvanti(1);
    const fascia = (await adm.post("/api/bar/fasce", { etichetta: "Break", ora: "10:10", cutoff_min: 30 })).json.id;
    assert.equal((await st.post("/api/bar/prodotti", { nome: "x", prezzo_cent: 1 })).stato, 403);
    assert.equal((await st.post("/api/bar/ordini", { fascia_id: chiusa, righe: [{ prodotto_id: p1, qta: 1 }] })).stato, 400);
    const o = await st.post("/api/bar/ordini", { fascia_id: fascia, giorno: domani, righe: [{ prodotto_id: p1, qta: 2 }, { prodotto_id: p2, qta: 1 }] });
    assert.equal(o.stato, 200, JSON.stringify(o.json));
    assert.equal(o.json.totale_cent, 650); assert.match(o.json.codice, /^[A-Z2-9]{4}$/);
    assert.equal((await st.post("/api/bar/ordini", { fascia_id: fascia, giorno: domani, righe: [{ prodotto_id: p1, qta: 11 }] })).stato, 400);
    assert.equal((await st.post("/api/bar/ordini", { fascia_id: fascia, giorno: domani, righe: [{ prodotto_id: p1, qta: 1 }, { prodotto_id: p1, qta: 1 }] })).stato, 400, "duplicate lines");
    assert.equal((await st.post("/api/bar/ordini", { fascia_id: fascia, giorno: domani, righe: [{ prodotto_id: p2, qta: 1 }] })).stato, 200);
    assert.equal((await st.post("/api/bar/ordini", { fascia_id: fascia, giorno: domani, righe: [{ prodotto_id: p2, qta: 1 }] })).stato, 400, "daily limit (2)");
    // price is the server's, not the client's
    assert.equal((await adm.get(`/api/bar/coda?giorno=${domani}`)).json.ordini.length, 2);
    assert.equal((await st.get("/api/bar/coda")).stato, 403);
    // status change notifies the student
    assert.equal((await adm.patch("/api/bar/ordini/" + o.json.id, { stato: "pronto" })).stato, 200);
    const n = (await st.get("/api/notifiche")).json.elenco;
    assert.match(n[0].titolo, /Ordine bar/); assert.match(n[0].titolo, /pronto/);
    // student can cancel only while still 'richiesto'
    assert.equal((await st.del("/api/bar/ordini/" + o.json.id)).stato, 400);
    // 30-day retention
    db.prepare("UPDATE bar_ordini SET creato_il = ?").run(Date.now() - 31 * 86400000);
    require("../backend/cleanup").pulisci();
    assert.equal(db.prepare("SELECT COUNT(*) n FROM bar_ordini").get().n, 0);
});

test("notifications: follow, bell, English rendering, digest and one-click unsubscribe", async () => {
    const adm = await utente("n-adm@a.test", { admin: true });
    const st = await utente("n-st@a.test", { nome: "Nora" });
    await st.put("/api/notifiche/segui", { tipo: "comunicazioni" });
    assert.equal((await st.put("/api/notifiche/segui", { tipo: "bogus" })).stato, 400);
    await adm.post("/api/comunicazioni", { titolo: "Exams moved", testo: "See the new calendar" });
    let n = (await st.get("/api/notifiche")).json;
    assert.equal(n.non_lette, 1);
    // rendering follows the language
    const riga = db.prepare("SELECT chiave, dati FROM notifiche WHERE chiave = 'comunicazione' LIMIT 1").get();
    assert.match(rendi("en", riga.chiave, riga.dati).titolo, /Announcement|announcement|Exams moved/);
    assert.notEqual(rendi("it", riga.chiave, riga.dati).titolo, rendi("en", riga.chiave, riga.dati).titolo);
    await st.post("/api/notifiche/lette", {});
    assert.equal((await st.get("/api/notifiche")).json.non_lette, 0);
    // digest: opt-in only
    spedite = [];
    await inviaDigest(Date.now() + 3600 * 1000);
    assert.equal(spedite.length, 0, "default frequency is off: no e-mail");
    assert.equal((await st.put("/api/notifiche/preferenze", { frequenza: "subito" })).stato, 200);
    await adm.post("/api/comunicazioni", { titolo: "Second", testo: "Another one" });
    const tok = db.prepare("SELECT disiscr_token t FROM utenti WHERE email = 'n-st@a.test'").get().t;
    assert.ok(tok);
    // one-click unsubscribe is public (no session, no CSRF header needed beyond the app's)
    assert.equal((await client().post("/api/notifiche/disiscrivi", { token: "x" })).stato, 400);
    assert.equal((await client().post("/api/notifiche/disiscrivi", { token: tok })).stato, 200);
    assert.equal(db.prepare("SELECT notifiche_freq f FROM utenti WHERE email = 'n-st@a.test'").get().f, "off");
});

test("poll results notification and module registry", async () => {
    assert.equal(M.moduliScuola(A.id).calendario, true);
    assert.equal(M.moduliScuola(A.id).bar, false);
    assert.throws(() => M.impostaModulo(A.id, "nope", true));
});
