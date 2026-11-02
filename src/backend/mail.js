"use strict";
/* mail.js — invio email. Senza SMTP_HOST stampa il messaggio nella console (utile in prova). */
const config = require("./config");

let trasporto = null;
function ottieniTrasporto() {
    if (!config.SMTP_HOST) return null;
    if (!trasporto) {
        const nodemailer = require("nodemailer");
        trasporto = nodemailer.createTransport({
            host: config.SMTP_HOST, port: config.SMTP_PORT, secure: config.SMTP_SECURE,
            auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined
        });
    }
    return trasporto;
}

async function inviaEmail(a, oggetto, testo) {
    const t = ottieniTrasporto();
    if (!t) {
        console.log("\n──────── EMAIL (SMTP non configurato: non viene inviata) ────────\nA: " + a + "\nOggetto: " + oggetto + "\n\n" + testo + "\n──────────────────────────────────────────────────────────────────\n");
        return;
    }
    await t.sendMail({ from: config.MAIL_FROM, to: a, subject: oggetto, text: testo });
}

const firma = `\n\n— Hub Studenti\nSe non sei stato tu, ignora questo messaggio.`;

module.exports = {
    inviaVerifica: (a, nome, token) => inviaEmail(a, "Conferma il tuo account Hub Studenti",
        `Ciao ${nome},\n\nper attivare l'account apri questo link (vale 24 ore):\n${config.BASE_URL}/api/auth/verifica?token=${token}${firma}`),
    inviaGiaRegistrato: (a, nome) => inviaEmail(a, "Hai già un account su Hub Studenti",
        `Ciao ${nome},\n\nqualcuno ha provato a registrarsi con questo indirizzo, ma un account esiste già.\nSe sei stato tu, accedi qui: ${config.BASE_URL}/index.html\nSe hai dimenticato la password: ${config.BASE_URL}/password.html${firma}`),
    inviaReset: (a, nome, token) => inviaEmail(a, "Recupero password Hub Studenti",
        `Ciao ${nome},\n\nper scegliere una nuova password apri questo link (vale 1 ora):\n${config.BASE_URL}/password.html?token=${token}${firma}`)
};
