"use strict";
/* index.js — avvio del server: `npm start` */
const config = require("./config");
const { creaApp } = require("./app");
const { avviaPulizia } = require("./cleanup");

const app = creaApp();
avviaPulizia();
const server = app.listen(config.PORT, config.HOST, () => {
    console.log(`\nHub Studenti in ascolto su ${config.BASE_URL}  (porta ${config.PORT})`);
    if (!config.SMTP_HOST) console.log("ATTENZIONE: SMTP non configurato. I link delle email (conferma account, recupero password) compaiono qui nella console.");
    if (config.PRODUCTION && !config.BASE_URL.startsWith("https://")) console.log("ATTENZIONE: in produzione serve HTTPS (vedi docs/HOSTING.md).");
});
const chiudi = () => server.close(() => process.exit(0));
process.on("SIGINT", chiudi); process.on("SIGTERM", chiudi);
