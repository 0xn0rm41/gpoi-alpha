"use strict";
/* app.js — costruisce l'applicazione Express (separata da index.js per poterla testare). */
const express = require("express");
const path = require("path");
const config = require("./config");
const db = require("./db");
const S = require("./security");

const authRoutes = require("./routes-auth");
const meRoutes = require("./routes-me");
const contenutiRoutes = require("./routes-contenuti");

function creaApp() {
    const app = express();
    app.disable("x-powered-by");
    if (config.TRUST_PROXY) app.set("trust proxy", 1);
    app.use(S.intestazioni);

    // Protezione CSRF: le richieste che modificano dati devono arrivare dal nostro sito
    // (intestazione personalizzata + controllo di Origin). Il cookie è anche SameSite=Lax.
    app.use("/api", (req, res, next) => {
        res.setHeader("Cache-Control", "no-store");
        if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
        const origin = req.headers.origin;
        if (origin) {
            let ok = false;
            try { ok = new URL(origin).host === req.headers.host; } catch (e) { /* origin non valido */ }
            if (!ok) return res.status(403).json({ error: "Richiesta non consentita." });
        }
        if (req.headers["x-requested-with"] !== "hub") return res.status(403).json({ error: "Richiesta non consentita." });
        next();
    });

    // Corpo delle richieste: piccolo ovunque, più grande solo per la pubblicazione degli appunti (foto)
    const piccolo = express.json({ limit: "20kb" }), grande = express.json({ limit: "3mb" });
    app.use((req, res, next) => ((req.method === "POST" && req.path === "/api/appunti") ? grande : piccolo)(req, res, next));

    // Dati pubblici di configurazione per le pagine di accesso/registrazione
    app.get("/api/config", (req, res) => res.json({
        source_url: config.SOURCE_URL, password_min: config.PASSWORD_MIN, anni: config.ANNI,
        versione_informativa: config.VERSIONE_INFORMATIVA, titolare: config.TITOLARE_NOME, contatto_privacy: config.TITOLARE_CONTATTO,
        dpo: config.DPO_CONTATTO, commissione_percentuale: db.impostazioneNum("commissione_percentuale", 2)
    }));

    app.use("/api/auth", authRoutes.router);
    app.use("/api/me", meRoutes.router);
    app.use("/api", contenutiRoutes.router);
    app.use("/api", (req, res) => res.status(404).json({ error: "Non trovato." }));

    // Pagine statiche (solo la cartella src/frontend/: codice del server e database non sono raggiungibili)
    app.use(express.static(config.PUBLIC_DIR, {
        index: "index.html", dotfiles: "ignore", extensions: ["html"],
        setHeaders: (res, file) => {
            if (file.endsWith(".woff2")) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            else res.setHeader("Cache-Control", "no-cache");
        }
    }));
    app.use((req, res) => res.status(404).sendFile(path.join(config.PUBLIC_DIR, "404.html")));

    // Gestore errori comune: nessun dettaglio tecnico verso l'utente
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        if (err instanceof S.HttpError) return res.status(err.stato).json({ error: err.message, codice: err.codice });
        if (err.type === "entity.too.large") return res.status(413).json({ error: "Contenuto troppo grande." });
        if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Richiesta non valida." });
        console.error("Errore:", err);
        res.status(500).json({ error: "Errore interno. Riprova più tardi." });
    });
    return app;
}

module.exports = { creaApp };
