/* =====================================================================
   auth.js — configurazione pubblica e accesso, usato da index, register, password e bacheca.
   La configurazione (lunghezza minima password…) arriva dal server
   (file .env): qui non c'è nulla da modificare. Le password non restano mai nel browser.
   ===================================================================== */
"use strict";

const HUB = { PASSWORD_MIN: 8, ANNI: [] };

// Mostra un messaggio nel riquadro #feedback. tipo = "error" | "ok" | "admin"
function mostraFeedback(el, tipo, testo) {
    el.className = "show " + tipo;
    el.textContent = testo;
}

// Pulsanti "Mostra/Nascondi" accanto ai campi password (data-for = id del campo)
function collegaMostraPassword() {
    document.querySelectorAll(".pw-toggle").forEach(function (b) {
        b.addEventListener("click", function () {
            const campo = document.getElementById(b.dataset.for);
            const mostra = campo.type === "password";
            campo.type = mostra ? "text" : "password";
            b.textContent = mostra ? "Nascondi" : "Mostra";
            b.setAttribute("aria-pressed", mostra);
        });
    });
}

const Auth = {
    // Carica la configurazione dal server (da chiamare prima di usare HUB)
    init: async function () {
        const c = await Api.get("/api/config");
        HUB.PASSWORD_MIN = c.password_min; HUB.ANNI = c.anni;
        document.querySelectorAll('[data-source-link]').forEach(function (a) { a.href = c.source_url; });
        return c;
    },
    emailValida: function (email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); },
    // Registrazione: il server invia l'email di conferma
    registra: function (dati) { return Api.post("/api/auth/register", dati); },
    accedi: function (email, password) { return Api.post("/api/auth/login", { email: email, password: password }); },
    logout: async function () { try { await Api.post("/api/auth/logout"); } catch (e) { /* già uscito */ } },
    // Utente collegato (o errore 401 se non c'è sessione)
    me: function () { return Api.get("/api/me"); }
};
