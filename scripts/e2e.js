"use strict";
/* scripts/e2e.js — browser smoke test + screenshot generator (Playwright, not part of `npm test`).
   Starts the app on a throw-away database, seeds a demo school, signs in and visits every page at phone and desktop size,
   in Italian and English. Reports: console errors, horizontal overflow, text that is still Italian in EN mode.
   Usage: node scripts/e2e.js [outDir]       (needs `playwright` + a Chromium; screenshots go to outDir, default ./e2e-out) */
const fs = require("fs"), os = require("os"), path = require("path");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hub-e2e-"));
process.env.DATA_DIR = tmp; process.env.HUB_DB_FILE = path.join(tmp, "e2e.sqlite"); process.env.BASE_URL = "http://localhost"; process.env.REGISTRAZIONI_ORA_PER_IP = "1000";
const root = path.join(__dirname, "..");
const db = require(path.join(root, "src/backend/db")), mail = require(path.join(root, "src/backend/mail")), M = require(path.join(root, "src/backend/modules"));
const { creaApp } = require(path.join(root, "src/backend/app"));
const { chromium } = require("playwright");
const out = path.resolve(process.argv[2] || "e2e-out"); fs.mkdirSync(out, { recursive: true });

const tokens = {}; mail.inviaVerifica = async (a, n, t) => { tokens[a] = t; }; mail.inviaGiaRegistrato = async () => {};
const scuola = db.creaScuola({ nome: "Istituto Demo" }); M.impostaModulo(scuola.id, "bar", true);
const PW = "Una-password-lunga-1", COD = db.formattaCodice(scuola.codice_invito);
const day = (n) => { const d = new Date(Date.now() + n * 86400000); if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };

(async () => {
    const server = creaApp().listen(0); await new Promise((r) => server.on("listening", r));
    const base = "http://127.0.0.1:" + server.address().port;
    const browser = await chromium.launch({ args: ["--no-proxy-server"] }); const problemi = [];
    const crea = async (email, classe, admin) => {
        const ctx = await browser.newContext({ baseURL: base }); const p = await ctx.newPage();
        await p.goto("/index.html", { waitUntil: "domcontentloaded" });
        const r = await p.evaluate(async (b) => (await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "hub" }, body: JSON.stringify(b) })).status,
            { nome: admin ? "Giulia" : "Luca", cognome: "Verdi", email, classe, password: PW, consenso: true, eta14: true, codice_scuola: COD });
        if (r !== 200) throw new Error("register " + r);
        await fetch(base + "/api/auth/verifica?token=" + tokens[email], { redirect: "manual" });
        if (admin) db.prepare("UPDATE utenti SET ruolo = 'admin' WHERE email = ?").run(email);
        await p.evaluate(async (b) => (await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "hub" }, body: JSON.stringify(b) })).status, { email, password: PW });
        return { ctx, p };
    };
    const api = (p, m, u, b) => p.evaluate(async ([m, u, b]) => { const r = await fetch(u, { method: m, headers: { "Content-Type": "application/json", "X-Requested-With": "hub" }, body: b ? JSON.stringify(b) : undefined }); return r.json().catch(() => ({})); }, [m, u, b]);
    const adm = await crea("admin@demo.test", "1A", true), stu = await crea("luca@demo.test", "5INFC", false);
    // demo content
    await api(adm.p, "POST", "/api/calendario", { titolo: "Verifica di matematica", tipo: "verifica", data: day(3), materia: "Matematica", classe: "5INFC" });
    await api(adm.p, "POST", "/api/calendario", { titolo: "Interrogazione di storia", tipo: "interrogazione", data: day(5), classe: "5INFC" });
    await api(adm.p, "POST", "/api/calendario", { titolo: "Consegna relazione di laboratorio sui sistemi operativi con un titolo molto lungo", tipo: "compito", data: day(7), classe: "5INFC" });
    await api(adm.p, "POST", "/api/calendario", { titolo: "Giornata dello sport", tipo: "evento", data: day(10) });
    const t0 = new Date(); t0.setHours(10, 0, 0, 0);
    await api(adm.p, "POST", "/api/calendario", { titolo: "Laboratorio informatica", tipo: "altro", tutto_il_giorno: false, inizio: t0.getTime() + 86400000, fine: t0.getTime() + 86400000 + 7200000, classe: "5INFC" });
    await api(adm.p, "POST", "/api/macchinette", { nome: "Macchinetta atrio", ubicazione: "Piano terra", tipo: "misto", prodotti: [{ nome: "Acqua 50cl", categoria: "Bevande", prezzo_cent: 50 }, { nome: "Crackers", categoria: "Snack", prezzo_cent: 80 }, { nome: "Caffè", categoria: "Caffè", prezzo_cent: 45 }] });
    await api(adm.p, "POST", "/api/bar/fasce", { etichetta: "Intervallo", ora: "10:10", cutoff_min: 0 });
    await api(adm.p, "POST", "/api/bar/prodotti", { nome: "Panino prosciutto", categoria: "Panini", prezzo_cent: 250, allergeni: "glutine" });
    await api(adm.p, "POST", "/api/bar/prodotti", { nome: "Succo di frutta", categoria: "Bevande", prezzo_cent: 120 });
    await api(adm.p, "POST", "/api/idee", { titolo: "Una parola lunghissima " + "x".repeat(80), descrizione: "Testo molto lungo senza spazi ".repeat(8) + "y".repeat(150) });
    await api(stu.p, "POST", "/api/assemblee", { data: day(14), ora_inizio: "4ª ora", durata_ore: 2, ordine_giorno: "Organizzazione della gita e proposte per il torneo di istituto" });

    const VISTE = ["bacheca", "idee", "appunti", "sondaggi", "libri", "calendario", "macchinette", "assemblee", "bar", "profilo"];
    for (const [who, u] of [["studente", stu], ["admin", adm]]) {
        for (const [dev, vp] of [["mobile", { width: 390, height: 844 }], ["desktop", { width: 1280, height: 860 }]]) {
            for (const lang of ["it", "en"]) {
                const ctx = await browser.newContext({ baseURL: base, viewport: vp, deviceScaleFactor: 2, storageState: await u.ctx.storageState() });
                await ctx.addInitScript((l) => { try { localStorage.setItem("hub-lang", l); } catch (e) {} }, lang);
                const p = await ctx.newPage();
                p.on("pageerror", (e) => problemi.push(`[${who}/${dev}/${lang}] pageerror: ${e.message}`));
                p.on("console", (m) => { if (m.type() === "error") problemi.push(`[${who}/${dev}/${lang}] console: ${m.text()}`); });
                const viste = who === "admin" ? [...VISTE, "admin"] : VISTE;
                for (const v of viste) {
                    await p.goto("/bacheca.html#" + v); await p.waitForTimeout(450);
                    if (v === "calendario" && dev === "mobile") { await p.waitForTimeout(150); }
                    const info = await p.evaluate(() => {
                        const over = document.documentElement.scrollWidth - document.documentElement.clientWidth;
                        const wide = [...document.querySelectorAll(".vista:not([hidden]) *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 && !e.closest(".cal-gr, .chips, .cal-ore-scroll"); }).slice(0, 3).map((e) => e.tagName + "." + e.className);
                        const it = []; const w = document.createTreeWalker(document.querySelector(".vista:not([hidden])") || document.body, NodeFilter.SHOW_TEXT);
                        for (let n = w.nextNode(); n; n = w.nextNode()) { const t = n.nodeValue.trim(); if (t.length > 3 && !n.parentElement.closest("script,style,[translate=no]") && /\b(il|la|le|di|che|per|non|con|una|sono|della|delle|nel|nella|tuo|tua|puoi|alla|dei|gli|più|già)\b/i.test(t) && /[a-z]/i.test(t)) it.push(t.slice(0, 70)); }
                        return { over, wide, it: [...new Set(it)].slice(0, 8) };
                    });
                    if (info.over > 1) problemi.push(`[${who}/${dev}/${lang}/${v}] horizontal overflow ${info.over}px: ${info.wide.join(", ")}`);
                    if (lang === "en" && info.it.length && who === "studente" && dev === "desktop") problemi.push(`[en/${v}] Italian left: ` + info.it.map((x) => JSON.stringify(x)).join(" | "));
                    if (lang === "en" && info.it.length && who === "admin" && v === "admin") problemi.push(`[en/admin] Italian left: ` + info.it.map((x) => JSON.stringify(x)).join(" | "));
                    if (lang === "it" && who === "studente") await p.screenshot({ path: path.join(out, `${dev}-${v}.png`), fullPage: dev === "desktop" });
                    if (lang === "en" && who === "studente" && ["calendario", "bacheca", "macchinette"].includes(v)) await p.screenshot({ path: path.join(out, `${dev}-${v}-en.png`) });
                }
                await ctx.close();
            }
        }
    }
    console.log(problemi.length ? problemi.join("\n") : "No problems found.");
    fs.writeFileSync(path.join(out, "report.txt"), problemi.join("\n"));
    await browser.close(); server.close(); db.close(); fs.rmSync(tmp, { recursive: true, force: true });
})().catch((e) => { console.error(e); process.exit(1); });
