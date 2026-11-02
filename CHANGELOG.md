# Changelog

All notable changes are recorded here.
Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [2.0.0] - 2026-10-31

Multi-school, open-source and commercially usable. **Breaking:** configuration and sign-up changed.

### Added
- **Multi-school communities**: `scuole` table, invite codes, `scuola_id` scoping on every content table; users of one school never see or modify another school's data (covered by tests).
- Sign-up with a school **invite code** and the user's **own email address** (optional per-school domain restriction).
- **School admin panel**: member count, invite code (copy link, regenerate), per-school idea threshold, optional email domain.
- Operator CLI: `school-create`, `school-list`, `school-code`, `school-suspend`, `school-activate`, `school-delete`, `school-of`.
- **Migration runner** (`src/backend/migrations/`, version in `meta.schema_versione`); databases from 1.0.0 are upgraded automatically into a default school.
- Licence changed to **AGPL-3.0-or-later** (source link in the footer, `SOURCE_URL`); dual/commercial licensing documented.
- New docs: `docs/analisi_mercato`, `docs/fattibilita` (incl. Gantt template), `docs/economy_finance` (incl. financial model), `docs/project_management`, `docs/github`, `docs/eu/DSA.md`, DPA template and DPIA.
- GitHub scaffolding: CI workflow (Linux/Windows/macOS), Dependabot, PR template, `CONTRIBUTING.md`.
- Tests for registration with codes, isolation, school admin, suspension, school deletion and the 001→002 migration.

### Changed
- All documentation rewritten in English and updated for the operator-as-controller model.
- Book commission defaults to **0** (hidden in the UI unless set above 0).
- Admin links, privacy notice and rules no longer assume a single school.

### Removed
- `NOME_SCUOLA` and `DOMINIO_SCUOLA` environment variables (schools live in the database).

### Upgrade notes
Run the server once: migration 002 runs automatically and moves existing data into one school named from `NOME_SCUOLA` if still set, otherwise "Default school". Find its invite code with `npm run admin -- school-list`. Back up `data/` first.

## [1.0.0] - 2026-10-30

Prima versione con server e database reali.

### Aggiunto
- Server Node.js (Express) con database SQLite: funziona su Linux, Windows e macOS senza XAMPP.
- Registrazione con **conferma dell'email**, accesso, recupero password (`password.html`).
- Dati condivisi tra tutti gli studenti: eventi, comunicazioni, idee, sondaggi, appunti con foto, libri.
- Richieste «Lo voglio» gestite dal venditore (accetta/rifiuta, riservato/ceduto).
- Segnalazioni dei contenuti e area **Admin** (eventi, comunicazioni, moderazione).
- **GDPR**: informativa e regole (`privacy.html`, `regole.html`), spunta «ho almeno 14 anni», registrazione del consenso con versione,
  esportazione dei propri dati (JSON), rettifica, cancellazione dell'account con tutti i contenuti e le foto,
  cancellazione automatica di account non confermati (3 giorni) e inattivi (12 mesi), backup a conservazione limitata.
- Comandi `npm run admin`, `npm run backup`, `npm run demo`; test automatici (`npm test`).
- Documentazione: `docs/HOSTING.md`, `docs/DATABASE.md`, `docs/eu/{gdpr,cookies,cra}`; SBOM CycloneDX.
- `Dockerfile` e `docker-compose.yml` (facoltativi).

### Modificato
- Font **ospitati in locale** al posto di Google Fonts (nessun IP degli studenti inviato a terzi).
- Script spostati in file `.js` esterni, così la CSP può vietare gli script inline.
- Le pagine ora stanno in `src/frontend/`; il codice del server in `src/backend/`.
- Tutti i permessi (admin, autore, voti singoli) sono verificati dal server, non più dal browser.
- La commissione sui libri è spiegata come calcolo indicativo: nessun pagamento passa dalla piattaforma.

### Corretto
- Il ruolo admin non è più deducibile da una lista di email visibile a chiunque nel codice del sito.
- Chiunque poteva registrarsi con un'email non sua: ora serve la conferma dal link ricevuto.
- Gli account e i dati stavano solo nel browser di chi li creava: ora sono sul server.
- Il link «Admin» restava visibile agli studenti per un problema di CSS sull'attributo `hidden`.
- Le date degli eventi erano «giorni da oggi»: ora sono date e orari veri.

### Rimosso
- Schema Supabase (conservato in `docs/legacy/`) e consigli su hosting di terze parti come strada principale.

## [0.1.0] - prototipo

- Pagine HTML con dati salvati nel `localStorage` del browser, senza server.
