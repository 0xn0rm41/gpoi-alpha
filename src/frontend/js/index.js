/* index.js — logica della pagina di accesso */
"use strict";
(async function () {
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const feedback = document.getElementById("feedback");
    const submitBtn = document.getElementById("submitBtn");
    collegaMostraPassword();

    try {
        await Auth.init();
        emailInput.placeholder = "nome@esempio.it";
        document.getElementById("emailHint").textContent = "";
    } catch (e) { mostraFeedback(feedback, "error", e.message); }

    // Messaggi in arrivo da altre pagine
    const p = new URLSearchParams(location.search);
    if (p.get("verificato") === "1") mostraFeedback(feedback, "ok", "Email confermata! Ora puoi accedere.");
    else if (p.get("verificato") === "0") mostraFeedback(feedback, "error", "Il link di conferma non è valido o è scaduto. Registrati di nuovo.");
    else if (p.get("reset") === "1") mostraFeedback(feedback, "ok", "Password aggiornata. Ora puoi accedere.");
    else if (p.get("eliminato") === "1") mostraFeedback(feedback, "ok", "Il tuo account e i tuoi contenuti sono stati eliminati.");

    // Se hai già una sessione aperta vai direttamente alla bacheca
    Api.get("/api/auth/sessione").then(function (r) { if (r.autenticato) location.replace("bacheca.html"); }).catch(function () { /* server non raggiungibile */ });

    function riabilita() { submitBtn.disabled = false; submitBtn.textContent = "Entra nel portale"; }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        feedback.className = "";

        if (!email || !password) { mostraFeedback(feedback, "error", "Inserisci email e password per continuare."); return; }
        if (!Auth.emailValida(email)) {
            mostraFeedback(feedback, "error", "Inserisci un indirizzo email valido.");
            emailInput.focus();
            return;
        }
        submitBtn.disabled = true;
        submitBtn.textContent = "Accesso in corso…";
        try {
            await Auth.accedi(email, password);
            mostraFeedback(feedback, "ok", "Accesso autorizzato. Ti porto alla bacheca…");
            location.href = "bacheca.html";
        } catch (err) {
            // Messaggio generico per le credenziali sbagliate: non dice se è sbagliata l'email o la password
            mostraFeedback(feedback, "error", err.stato === 401 ? "Email o password non corretti. Se non hai un account, registrati." : err.message);
            riabilita();
        }
    });
})();
