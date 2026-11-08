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

### Modified
- Fonts **locally hosted** instead of Google Fonts (no student IPs sent to third parties).
- Scripts moved to external '.js' files, so CSP can ban inline scripts.
- Pages are now in 'src/frontend/'; server code is in 'src/backend/'.
- All permissions (admin, author, single votes) are verified by the server, no longer by the browser.
- The book fee is explained as an indicative calculation: no payments go through the platform.

### Corrected
- The admin role is no longer deducible from a list of emails visible to anyone in the site code.
- Anyone could register with an email that wasn't theirs: now you need confirmation from the link you received.
- The accounts and data were only in the browser of the person creating them: now they are on the server.
- The «Admin» link remained visible to students due to a CSS issue with the 'hidden' attribute.
- The dates of the events were «days from today»: now they are real dates and times.

### Removed
- - Supabase Scheme (`docs/legacy/`) and recommendations for third-party hosting as the main route.

## [0.1.0] - prototipo

-  HTML pages with data saved in the browser's 'localStorage', without a server.
