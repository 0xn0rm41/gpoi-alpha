"use strict";
/* mail.js — outgoing e-mail, in the user's language (it/en). Without SMTP_HOST the message is printed to the console (testing). */
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

async function inviaEmail(a, oggetto, testo, extra = {}) {
    const t = ottieniTrasporto();
    if (!t) {
        console.log("\n──────── EMAIL (SMTP not configured: not sent) ────────\nTo: " + a + "\nSubject: " + oggetto + "\n\n" + testo + "\n──────────────────────────────────────────────────────────────────\n");
        return;
    }
    await t.sendMail({ from: config.MAIL_FROM, to: a, subject: oggetto, text: testo, ...extra });
}

const T = {
    it: {
        firma: "\n\n— Hub Studenti\nSe non sei stato tu, ignora questo messaggio.",
        verificaOgg: "Conferma il tuo account Hub Studenti",
        verifica: (n, url) => `Ciao ${n},\n\nper attivare l'account apri questo link (vale 24 ore):\n${url}`,
        giaOgg: "Hai già un account su Hub Studenti",
        gia: (n, login, reset) => `Ciao ${n},\n\nqualcuno ha provato a registrarsi con questo indirizzo, ma un account esiste già.\nSe sei stato tu, accedi qui: ${login}\nSe hai dimenticato la password: ${reset}`,
        resetOgg: "Recupero password Hub Studenti",
        reset: (n, url) => `Ciao ${n},\n\nper scegliere una nuova password apri questo link (vale 1 ora):\n${url}`,
        digestOgg: (n) => n === 1 ? "Hub Studenti: 1 novità" : `Hub Studenti: ${n} novità`,
        digest: (nome, voci, base, disiscr) => `Ciao ${nome},\n\ncosa è successo da quando hai guardato l'ultima volta:\n\n${voci.map((v) => `• ${v.titolo}${v.dettaglio ? " — " + v.dettaglio : ""}\n  ${base}${v.link || "/bacheca.html"}`).join("\n\n")}\n\n` +
            `Ricevi questa email perché hai attivato la campanella. Per smettere: ${disiscr}\n(Puoi anche cambiare cosa seguire dal tuo profilo.)\n\n— Hub Studenti`
    },
    en: {
        firma: "\n\n— Hub Studenti\nIf this wasn't you, just ignore this message.",
        verificaOgg: "Confirm your Hub Studenti account",
        verifica: (n, url) => `Hi ${n},\n\nopen this link to activate your account (valid for 24 hours):\n${url}`,
        giaOgg: "You already have a Hub Studenti account",
        gia: (n, login, reset) => `Hi ${n},\n\nsomeone tried to sign up with this address, but an account already exists.\nIf it was you, sign in here: ${login}\nIf you forgot your password: ${reset}`,
        resetOgg: "Reset your Hub Studenti password",
        reset: (n, url) => `Hi ${n},\n\nopen this link to choose a new password (valid for 1 hour):\n${url}`,
        digestOgg: (n) => n === 1 ? "Hub Studenti: 1 update" : `Hub Studenti: ${n} updates`,
        digest: (nome, voci, base, disiscr) => `Hi ${nome},\n\nwhat happened since you last looked:\n\n${voci.map((v) => `• ${v.titolo}${v.dettaglio ? " — " + v.dettaglio : ""}\n  ${base}${v.link || "/bacheca.html"}`).join("\n\n")}\n\n` +
            `You get this e-mail because you turned the bell on. To stop: ${disiscr}\n(You can also change what you follow from your profile.)\n\n— Hub Studenti`
    }
};
const L = (l) => T[l] || T.it;

module.exports = {
    inviaVerifica: (a, nome, token, l) => inviaEmail(a, L(l).verificaOgg, L(l).verifica(nome, `${config.BASE_URL}/api/auth/verifica?token=${token}`) + L(l).firma),
    inviaGiaRegistrato: (a, nome, l) => inviaEmail(a, L(l).giaOgg, L(l).gia(nome, `${config.BASE_URL}/index.html`, `${config.BASE_URL}/password.html`) + L(l).firma),
    inviaReset: (a, nome, token, l) => inviaEmail(a, L(l).resetOgg, L(l).reset(nome, `${config.BASE_URL}/password.html?token=${token}`) + L(l).firma),
    /** One digest e-mail with several notifications; the unsubscribe link also goes in the List-Unsubscribe header (RFC 8058 one-click). */
    inviaDigest: (a, nome, l, voci, tokenDisiscr) => {
        const url = `${config.BASE_URL}/disiscrivi.html?t=${tokenDisiscr}`;
        return inviaEmail(a, L(l).digestOgg(voci.length), L(l).digest(nome, voci, config.BASE_URL, url),
            { headers: { "List-Unsubscribe": `<${url}>` } });
    }
};
