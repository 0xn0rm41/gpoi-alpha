/* =====================================================================
   i18n.js — Italian / English interface.
   The source text of every page is Italian. English is applied on the fly:
     - exact strings are looked up in I18N_EN (js/i18n-en.js: "Italian" -> "English");
     - strings with numbers or names are handled by PATTERNS below;
     - anything that is not found stays Italian (user-written content is never touched: exact match only).
   The choice is remembered in the browser (localStorage) and, for signed-in users, on the server
   (it also decides the language of e-mails and notifications).
   To add a string: add one line to js/i18n-en.js. To add a language: copy that file and extend LANGS.
   ===================================================================== */
"use strict";
const I18N = (function () {
    const LANGS = { it: { nome: "Italiano", locale: "it-IT" }, en: { nome: "English", locale: "en-GB" } };
    const EN = window.I18N_EN || {};
    let lang = "it";
    try {
        const s = localStorage.getItem("hub-lang");
        lang = s && LANGS[s] ? s : ((navigator.language || "it").toLowerCase().startsWith("en") ? "en" : "it");
    } catch (e) { lang = (navigator.language || "it").toLowerCase().startsWith("en") ? "en" : "it"; }

    const num = "(\\d+)";
    /* [regex on the Italian text, English replacement (string with $1.. or function)] */
    const plural = (n, one, many) => (Number(n) === 1 ? one : many);
    const PATTERNS = [
        [/^adesso$/, "now"],
        [/^(\d+) min fa$/, "$1 min ago"],
        [/^(\d+) ora fa$/, "$1 hour ago"], [/^(\d+) ore fa$/, "$1 hours ago"],
        [/^(\d+) giorno fa$/, "$1 day ago"], [/^(\d+) giorni fa$/, "$1 days ago"],
        [/^Tra (\d+) giorni$/, "In $1 days"],
        [/^(\d+) voti?$/, (m, n) => `${n} ${plural(n, "vote", "votes")}`],
        [/^(\d+) di (\d+) sostegni$/, "$1 of $2 supporters"],
        [/^(\d+)% della soglia$/, "$1% of the threshold"],
        [/^(\d+) iscritt[io]$/, (m, n) => `${n} ${plural(n, "member", "members")}`],
        [/^Di (.+), (.+)$/, (m, a, t) => `By ${a}, ${tr(t)}`],
        [/^Ciao, (.+)!$/, "Hi, $1!"],
        [/^(.+) · (\d+) iscritt[io]$/, (m, s, n) => `${s} · ${n} ${plural(n, "member", "members")}`],
        [/^Ora (\d{2}:\d{2})$/, "At $1"],
        [/^(.+), ore (\d{2}:\d{2})(.*)$/, (m, g, o, r) => `${tr(g)}, ${o}${r}`],
        [/^Motivo: (.+)$/, "Reason: $1"],
        [/^Hai accettato regole e informativa il (.+) \(versione (.+)\)\.$/, "You accepted the rules and the privacy notice on $1 (version $2)."],
        [/^Richiedi un'assemblea per (.+)$/, "Request an assembly for $1"],
        [/^Assemblea di classe (.+)$/, "Class assembly $1"],
        [/^(\d+) (?:ora|ore)$/, (m, n) => `${n} ${plural(n, "hour", "hours")}`],
        [/^(.+) \((\d+) da leggere\)$/, "$1 ($2 unread)"],
        [/^Notifiche \((\d+) da leggere\)$/, "Notifications ($1 unread)"],
        [/^Hai già (\d+) ordini? attiv[io] per quel giorno \(massimo (\d+)\)\.$/, "You already have $1 active orders for that day (maximum $2)."],
        [/^Troppi prodotti \(massimo (\d+)\)\.$/, "Too many products (maximum $1)."],
        [/^Ti sei segnato a: (.+)$/, "You signed up for: $1"],
        [/^Partecipazione annullata: (.+)$/, "Signup cancelled: $1"],
        [/^Opzione (\d+)$/, "Option $1"],
        [/^La durata può essere da 1 a (\d+) ore\.$/, "Duration can be from 1 to $1 hours."],
        [/^La richiesta va fatta con almeno (\d+) giorni di anticipo\.$/, "The request must be made at least $1 days in advance."],
        [/^Troppi prodotti \(massimo (\d+)\)\.$/, "Too many products (maximum $1)."],
        [/^Troppe (.+) in poco tempo\. Riprova più tardi\.$/, "Too many requests in a short time. Try again later."]
    ];

    function tr(s) {
        if (lang === "it" || typeof s !== "string") return s;
        const k = s.trim();
        if (!k) return s;
        const lead = s.slice(0, s.indexOf(k)), trail = s.slice(s.indexOf(k) + k.length);
        if (Object.prototype.hasOwnProperty.call(EN, k)) return lead + EN[k] + trail;
        for (const [re, rep] of PATTERNS) {
            const m = k.match(re);
            if (m) return lead + (typeof rep === "function" ? rep(...m) : k.replace(re, rep)) + trail;
        }
        return s;
    }

    /* ---- DOM translation (text nodes + a few attributes), remembering the Italian original ---- */
    const ATTR = ["placeholder", "aria-label", "title", "alt", "content"];
    const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE", "NOSCRIPT"]);
    const memo = new WeakMap();                 // node/element -> { it: original, en: what we put there }
    const memoAttr = new WeakMap();             // element -> { attr: {it, en} }

    function testo(n) {
        const m = memo.get(n), cur = n.nodeValue;
        if (m && m.mostrato === cur) { if (lang === "it") { n.nodeValue = m.it; m.mostrato = m.it; } else { const e = tr(m.it); n.nodeValue = e; m.mostrato = e; } return; }
        const e = lang === "it" ? cur : tr(cur);
        memo.set(n, { it: cur, mostrato: e });
        if (e !== cur) n.nodeValue = e;
    }
    function attributi(el) {
        for (const a of ATTR) {
            if (!el.hasAttribute(a)) continue;
            if (a === "content" && !(el.tagName === "META" && el.getAttribute("name") === "description")) continue;
            const cur = el.getAttribute(a);
            let m = memoAttr.get(el); if (!m) { m = {}; memoAttr.set(el, m); }
            const r = m[a];
            if (r && r.mostrato === cur) { const e = lang === "it" ? r.it : tr(r.it); if (e !== cur) el.setAttribute(a, e); r.mostrato = e; continue; }
            const e = lang === "it" ? cur : tr(cur);
            m[a] = { it: cur, mostrato: e };
            if (e !== cur) el.setAttribute(a, e);
        }
    }
    function visita(radice) {
        if (!radice) return;
        if (radice.nodeType === 3) { if (radice.parentNode && !SKIP.has(radice.parentNode.nodeName)) testo(radice); return; }
        if (radice.nodeType !== 1 || SKIP.has(radice.nodeName) || radice.closest("[translate=no]")) return;
        attributi(radice);
        const w = document.createTreeWalker(radice, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
            if (n.nodeType === 3) { if (!SKIP.has(n.parentNode.nodeName) && !n.parentNode.closest("[translate=no]")) testo(n); }
            else if (!SKIP.has(n.nodeName)) attributi(n);
        }
    }
    let titoloIt = null;
    function titolo() { if (titoloIt === null || document.title !== titoloMostrato) titoloIt = document.title; titoloMostrato = lang === "it" ? titoloIt : tr(titoloIt); if (document.title !== titoloMostrato) document.title = titoloMostrato; }
    let titoloMostrato = "";

    let osserva = null, inCorso = false;
    function tutto() {
        document.documentElement.lang = lang;
        inCorso = true; visita(document.documentElement); titolo(); inCorso = false;
        const b = document.querySelector("[data-lang-switch]");
        if (b) { b.textContent = lang === "it" ? "EN" : "IT"; b.setAttribute("aria-label", lang === "it" ? "Switch to English" : "Passa all'italiano"); b.title = b.getAttribute("aria-label"); b.lang = lang === "it" ? "en" : "it"; }
        document.dispatchEvent(new CustomEvent("lingua", { detail: lang }));
    }
    function avvia() {
        osserva = new MutationObserver((muts) => {
            if (inCorso || lang === "it") return;
            inCorso = true;
            for (const m of muts) {
                if (m.type === "childList") m.addedNodes.forEach(visita);
                else if (m.type === "attributes") attributi(m.target);
            }
            titolo();
            inCorso = false;
        });
        osserva.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ATTR });
        mettiInterruttore();
        tutto();
    }

    function mettiInterruttore() {
        if (document.querySelector("[data-lang-switch]")) return;
        const b = document.createElement("button");
        b.type = "button"; b.className = "lang-switch"; b.setAttribute("data-lang-switch", ""); b.setAttribute("translate", "no");
        b.addEventListener("click", () => imposta(lang === "it" ? "en" : "it", true));
        const dentro = document.querySelector(".user");
        if (dentro) dentro.insertBefore(b, dentro.firstChild); else { b.classList.add("fisso"); document.body.appendChild(b); }
    }

    function imposta(l, salva) {
        if (!LANGS[l]) return;
        lang = l;
        try { localStorage.setItem("hub-lang", l); } catch (e) { /* private mode */ }
        tutto();
        if (salva && window.Api && document.querySelector(".topbar")) Api.put("/api/me/lingua", { lingua: l }).catch(() => {});
    }

    const stile = document.createElement("style");
    stile.textContent = ".lang-switch{min-width:2.5rem;min-height:2.25rem;padding:0 .625rem;border:1.5px solid rgba(255,255,255,.55);border-radius:.625rem;background:transparent;color:#fff;font:600 .8125rem/1 inherit;letter-spacing:.04em;cursor:pointer}" +
        ".lang-switch:hover{background:rgba(255,255,255,.12)}.lang-switch.fisso{position:fixed;top:max(.75rem,env(safe-area-inset-top));right:.75rem;z-index:50;color:#0B3B45;background:#fff;border-color:#B5C2C4}";
    document.head.appendChild(stile);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia); else avvia();

    return {
        get lang() { return lang; }, locale: () => LANGS[lang].locale, t: tr, imposta, LANGS,
        /** called after sign-in: the server-side preference wins over the browser's */
        daServer(l) { if (l && LANGS[l] && l !== lang) imposta(l, false); }
    };
})();
const LOC = () => I18N.locale();
const T = (s) => I18N.t(s);
