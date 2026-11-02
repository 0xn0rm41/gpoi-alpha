/* password.js — recupero password in due passi */
"use strict";
(async function () {
    collegaMostraPassword();
    const token = new URLSearchParams(location.search).get("token");
    const passoEmail = document.getElementById("passo-email"), passoNuova = document.getElementById("passo-nuova");
    try { await Auth.init(); } catch (e) { /* il server segnalerà l'errore all'invio */ }
    (token ? passoNuova : passoEmail).hidden = false;
    document.getElementById("pwHint").textContent = "Almeno " + HUB.PASSWORD_MIN + " caratteri.";

    document.getElementById("formEmail").addEventListener("submit", async function (e) {
        e.preventDefault();
        const fb = document.getElementById("feedback1"), btn = document.getElementById("btn1");
        const email = document.getElementById("email").value.trim().toLowerCase();
        if (!email) { mostraFeedback(fb, "error", "Inserisci la tua email."); return; }
        btn.disabled = true;
        try {
            await Api.post("/api/auth/forgot", { email: email });
            // Stesso messaggio sia se l'email esiste sia se non esiste
            mostraFeedback(fb, "ok", "Se l'indirizzo è registrato, tra poco riceverai un'email con il link (controlla anche lo spam).");
        } catch (err) { mostraFeedback(fb, "error", err.message); }
        btn.disabled = false;
    });

    document.getElementById("formNuova").addEventListener("submit", async function (e) {
        e.preventDefault();
        const fb = document.getElementById("feedback2"), btn = document.getElementById("btn2");
        const p = document.getElementById("password").value;
        if (p.length < HUB.PASSWORD_MIN) { mostraFeedback(fb, "error", "La password deve avere almeno " + HUB.PASSWORD_MIN + " caratteri."); return; }
        if (p !== document.getElementById("conferma").value) { mostraFeedback(fb, "error", "Le due password non coincidono."); return; }
        btn.disabled = true;
        try {
            await Api.post("/api/auth/reset", { token: token, password: p });
            location.href = "index.html?reset=1";
        } catch (err) { mostraFeedback(fb, "error", err.message); btn.disabled = false; }
    });
})();
