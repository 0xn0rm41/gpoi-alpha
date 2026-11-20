"use strict";
/* password-policy.js — robust-password rules for a service used by teenagers.
   Follows NIST SP 800-63B ideas: length matters more than composition rules, block known-bad
   passwords and context words, never require periodic changes, allow long passphrases.
   Optional: HaveIBeenPwned range check (k-anonymity: only the first 5 hex chars of the SHA-1 leave the server).
   Enable with PASSWORD_HIBP=1; it is OFF by default (it is an outgoing request to a third party) and fails open. */
const crypto = require("crypto");

const MIN = 8, MAX = 200;

// Most common passwords worldwide + Italian favourites (football, school, names). Lower-case, letters+digits only.
const COMUNI = new Set(`password passw0rd password1 password12 password123 password1234 pass1234 qwerty qwerty123 qwertyui qwertyuiop qwerty12 qwerty1234 azerty azerty123
12345678 123456789 1234567890 11111111 00000000 12341234 123123123 87654321 987654321 1q2w3e4r 1q2w3e4r5t 1qaz2wsx 123qweasd qazwsxedc zaq12wsx asdfghjk asdfghjkl asdf1234 zxcvbnm zxcvbnm123
iloveyou iloveyou1 letmein welcome welcome1 admin admin123 administrator login master dragon monkey shadow sunshine princess football baseball superman batman trustno1 abc12345 abcd1234 abcdefgh
ciao ciao1234 ciaociao ciaociao1 ciao12345 ciaobello ciaobella ciaoamore password! buongiorno buonasera bellissimo ti amo tiamo tiamo123 tvb tvb12345 amore amore123 amoremio
juventus juventus1 juve1897 forzajuve finoallafine forzaroma romanista roma1927 forzainter inter1908 interista milan1899 forzamilan milanista napoli1926 forzanapoli atalanta atalanta1907 forzaatalanta
ronaldo cristiano ronaldo7 cr7cr7cr7 messi10 messi1010 totti10 balotelli pallone calcio calcio123 calcetto
scuola scuola123 scuola2026 studente studente1 studenti hubstudenti hub12345 istituto istituto1 liceo liceo123 classe classe123 prof prof1234 matematica italiano inglese
italia italia1 italia123 italy2026 roma milano torino napoli bergamo bergamo1 brescia lombardia
mario mario123 luca1234 giuseppe francesco alessandro andrea matteo lorenzo gabriele riccardo davide leonardo marco1234 giulia123 sofia123 martina123 chiara123 sara1234 anna1234
estate2026 inverno2026 autunno2026 primavera2026 gennaio2026 novembre2026 dicembre2026 settembre2026 ottobre2026 2026 20262026 2025 2024 2023 20252025
playstation playstation1 fortnite fortnite1 minecraft minecraft1 roblox roblox123 pokemon pokemon1 naruto naruto123 onepiece tiktok tiktok123 instagram instagram1 snapchat whatsapp whatsapp1 youtube
changeme changeme123 default test test1234 prova prova123 prova1234 provaprova temp1234 guest guest123 user1234 user password0 nomeutente cambiami`.split(/\s+/).filter(Boolean));

const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9@$!]/g, "").replace(/[0134578@$!]/g, (c) => LEET[c] || c);
const alnum = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function sequenziale(p) {            // abcdefgh, 12345678, 87654321, aaaaaaaa, abababab
    const s = alnum(p);
    if (s.length < 6) return false;
    if (/^(.)\1+$/.test(s)) return true;
    if (/^(.{1,3})\1+$/.test(s)) return true;
    let asc = 0, desc = 0;
    for (let i = 1; i < s.length; i++) {
        const d = s.charCodeAt(i) - s.charCodeAt(i - 1);
        if (d === 1) asc++; else if (d === -1) desc++;
    }
    return asc >= s.length - 2 || desc >= s.length - 2;
}

const RIGHE = ["qwertyuiop", "asdfghjkl", "zxcvbnm", "1234567890", "qazwsxedcrfv"];
const tastiera = (p) => { const s = alnum(p); return s.length >= 6 && RIGHE.some((r) => r.includes(s) || r.split("").reverse().join("").includes(s)); };

/** Returns null when OK, otherwise a short machine code + Italian message (the API layer translates it). */
function valuta(p, ctx = {}) {
    if (typeof p !== "string") return { codice: "tipo", messaggio: "Password non valida." };
    if (p.length < MIN) return { codice: "corta", messaggio: `La password deve avere almeno ${MIN} caratteri.` };
    if (p.length > MAX) return { codice: "lunga", messaggio: "Password troppo lunga." };
    if (/^\s|\s$/.test(p) && p.trim().length < MIN) return { codice: "spazi", messaggio: "Password non valida." };
    const a = alnum(p), n = norm(p);
    if (new Set(a).size < 5) return { codice: "ripetuta", messaggio: "Password troppo semplice: usa più caratteri diversi." };
    if (COMUNI.has(a) || COMUNI.has(n)) return { codice: "comune", messaggio: "Questa password è tra le più usate e facili da indovinare. Sceglierne un'altra." };
    // common word + a few digits/symbols at the end (ciao2026!, password99)
    const base = a.replace(/[0-9]+$/, "");
    if (base.length >= 3 && base.length < a.length && (COMUNI.has(base) || COMUNI.has(norm(base))) && a.length < 14)
        return { codice: "comune", messaggio: "Questa password è una parola comune con dei numeri in fondo: troppo facile da indovinare." };
    if (/^\d+$/.test(a) && a.length < 14) return { codice: "schema", messaggio: "Una password di soli numeri è troppo facile da indovinare: aggiungi lettere o parole." };
    if (sequenziale(p) || tastiera(p)) return { codice: "schema", messaggio: "Evita sequenze (12345678, qwerty, aaaa…): scegli una frase o parole a caso." };
    // context: name, surname, e-mail local part, school, service name
    const parole = [ctx.nome, ctx.cognome, ctx.email && String(ctx.email).split("@")[0], ctx.scuola, "hubstudenti", "hub studenti"]
        .filter(Boolean).map(alnum).filter((w) => w.length >= 4);
    const resto = parole.reduce((r, w) => r.split(w).join(""), a).replace(/[0-9]/g, "");
    if (parole.some((w) => a.includes(w)) && resto.length < 4)
        return { codice: "contesto", messaggio: "La password non deve contenere il tuo nome, la tua email o il nome della scuola." };
    if (ctx.email && a === alnum(ctx.email)) return { codice: "contesto", messaggio: "La password non può essere uguale all'email." };
    return null;
}

/** Optional k-anonymity breach check. Resolves to the number of known breaches, or 0 (fail-open). */
async function violazioni(p, { timeoutMs = 2500 } = {}) {
    try {
        const h = crypto.createHash("sha1").update(p).digest("hex").toUpperCase();
        const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeoutMs);
        const r = await fetch(`https://api.pwnedpasswords.com/range/${h.slice(0, 5)}`, { signal: ctrl.signal, headers: { "Add-Padding": "true" } });
        clearTimeout(t);
        if (!r.ok) return 0;
        for (const riga of (await r.text()).split("\n")) {
            const [suf, n] = riga.trim().split(":");
            if (suf === h.slice(5)) return Number(n) || 0;
        }
    } catch { /* offline or blocked: never block sign-up because of this check */ }
    return 0;
}

module.exports = { valuta, violazioni, MIN, MAX };
