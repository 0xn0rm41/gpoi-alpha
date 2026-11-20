/* register.js — logica della pagina di registrazione */
"use strict";
(async function () {
    const form = document.getElementById("registerForm");
    const f = form.elements;                       // scorciatoia: f.nome, f.email, f.password…
    const feedback = document.getElementById("feedback");
    const submitBtn = document.getElementById("submitBtn");
    const meter = document.getElementById("meter");
    const pwHint = document.getElementById("pwHint");
    collegaMostraPassword();

    try { await Auth.init(); } catch (e) { mostraFeedback(feedback, "error", e.message); }

    f.email.placeholder = "nome@esempio.it";
    document.getElementById("emailHint").textContent = "Usa la tua email personale: ti serve per confermare l'account e recuperare la password. Se la tua scuola richiede un dominio, te lo diremo.";
    // Codice scuola: arriva anche dal link d'invito (register.html?codice=XXXXX-XXXXX)
    const daLink = new URLSearchParams(location.search).get("codice");
    if (daLink) f.codice_scuola.value = daLink.slice(0, 16);
    f.codice_scuola.addEventListener("input", function () { f.codice_scuola.value = f.codice_scuola.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""); });
    const suggerimento = "Almeno " + HUB.PASSWORD_MIN + " caratteri. Meglio una frase di 3-4 parole a caso (es. \"gatto verde corre piano\"): lunga, facile da ricordare, difficile da indovinare.";
    pwHint.textContent = suggerimento;

    // Classe sempre in maiuscolo e solo lettere/numeri (es. 5INFC)
    f.classe.addEventListener("input", function () { f.classe.value = f.classe.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });

    // Robustezza: conta soprattutto la LUNGHEZZA (una frase di 3-4 parole batte "P@ssw0rd!"). Il server controlla anche le password comuni.
    // 0 = troppo corta, 1 = debole, 2 = discreta, 3 = robusta
    function livelloPassword(p) {
        if (p.length < HUB.PASSWORD_MIN) return 0;
        const classi = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(function (r) { return r.test(p); }).length;
        const unici = new Set(p.toLowerCase()).size;
        if (unici < 5) return 1;
        const punti = (p.length >= 14 ? 2 : p.length >= 11 ? 1 : 0) + (p.length >= 20 ? 1 : 0) + (classi >= 3 ? 1 : 0) + (/\s/.test(p) ? 1 : 0);
        return punti <= 1 ? 1 : punti === 2 ? 2 : 3;
    }
    f.password.addEventListener("input", function () {
        const p = f.password.value, l = livelloPassword(p);
        meter.dataset.l = l;
        pwHint.textContent = !p ? suggerimento
            : ["Troppo corta: servono almeno " + HUB.PASSWORD_MIN + " caratteri.", "Password debole: allungala o usa più parole.", "Password discreta.", "Password robusta."][l];
    });

    const pulisci = function (s) { return s.trim().replace(/\s+/g, " "); };
    function errore(campo, testo) { mostraFeedback(feedback, "error", testo); f[campo].focus(); }
    function riabilita() { submitBtn.disabled = false; submitBtn.textContent = "Crea account"; }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        feedback.className = "";

        const nome = pulisci(f.nome.value), cognome = pulisci(f.cognome.value);
        const email = f.email.value.trim().toLowerCase();
        const classe = f.classe.value.trim();

        // Controlli, dal primo campo all'ultimo (il server li ripete: questi servono solo a dare un messaggio rapido)
        if (!nome)    return errore("nome", "Inserisci il tuo nome.");
        if (!cognome) return errore("cognome", "Inserisci il tuo cognome.");
        const codice = f.codice_scuola.value.trim();
        if (!codice)  return errore("codice_scuola", "Inserisci il codice della tua scuola.");
        if (!email)   return errore("email", "Inserisci la tua email.");
        if (!Auth.emailValida(email)) return errore("email", "L'indirizzo email non sembra valido.");
        if (!/^(?=.{2,10}$)[1-9][A-Z0-9]*[A-Z][A-Z0-9]*$/.test(classe)) return errore("classe", "Scrivi la classe come sul registro, per esempio 5INFC, 2CSAS o 3B.");
        if (f.password.value.length < HUB.PASSWORD_MIN) return errore("password", "La password deve avere almeno " + HUB.PASSWORD_MIN + " caratteri.");
        if (f.password.value !== f.conferma.value) return errore("conferma", "Le due password non coincidono.");
        if (!f.eta14.checked) return errore("eta14", "Per registrarti devi avere almeno 14 anni.");
        if (!f.regole.checked) return errore("regole", "Per registrarti devi accettare le regole e l'informativa.");

        submitBtn.disabled = true;
        submitBtn.textContent = "Creazione in corso…";
        try {
            await Auth.registra({ nome: nome, cognome: cognome, email: email, codice_scuola: codice, classe: classe,
                                  password: f.password.value, eta14: true, consenso: true });
            form.reset(); meter.dataset.l = 0;
            submitBtn.textContent = "Email inviata";
            mostraFeedback(feedback, "ok", "Quasi fatto! Ti abbiamo scritto a " + email + ": apri il link nell'email per attivare l'account (controlla anche lo spam).");
        } catch (err) {
            riabilita();
            mostraFeedback(feedback, "error", err.message);
        }
    });
})();
