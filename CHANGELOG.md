
<<<<<<< Updated upstream
**Changelog**

All notable changes are recorded here. Format inspired by Keep a Changelog; versions follow SemVer.

 **- 2026-11-17 minor change**

 Modified and renamed some docs

 **- 2026-10-31**

Multi-school, open-source and commercially usable. Breaking: configuration and sign-up changed.

**Added**
=======
> Changelog

All notable changes are recorded here. Format inspired by Keep a Changelog; versions follow SemVer.

## [2.1.0] - 2026-11-18

### Added
- Calendar (month/week/day/agenda), class and school entries, .ics import/export, private subscription feed.
- Vending machines with prices and student-reported availability.
- Class assembly requests with per-school rules and notifications.
- Bar pre-order module, off by default, enabled per school by the operator (`school-module`).
- Follow bell, notification list and opt-in e-mail digests with one-click unsubscribe.
- English interface, e-mails and notifications (Italian remains the default).
- Mobile layout, installable web app (manifest, service worker, offline page).
- Robust password policy (length first, blocklist, pattern and context checks, optional breached-password check).
- Browser smoke test and screenshot script (`scripts/e2e.js`).

### Changed
- Class field is one free-form value of up to 10 characters (5INFC, 2CSAS, 3B).
- Requires Node.js 22+; `.npmrc` sets `ignore-scripts=true` so `npm ci` needs no compiler.

### Fixed
- Long text in ideas and other cards no longer leaves its box.

 - 2026-10-31

Multi-school, open-source and commercially usable. Breaking: configuration and sign-up changed.

## Added
>>>>>>> Stashed changes

• Multi-school communities: scuole table, invite codes, scuola_id scoping on every content table; users of one school never see or modify another school's data (covered by tests).
• Sign-up with a school invite code and the user's own email address (optional per-school domain restriction).
• School admin panel: member count, invite code (copy link, regenerate), per-school idea threshold, optional email domain.
• Operator CLI: school-create, school-list, school-code, school-suspend, school-activate, school-delete, school-of.
• Migration runner (src/backend/migrations/, version in meta.schema_versione); databases from 1.0.0 are upgraded automatically into a default school.
• Licence changed to AGPL-3.0-or-later (source link in the footer, SOURCE_URL); dual/commercial licensing documented.
• New docs: docs/analisi_mercato, docs/fattibilita (incl. Gantt template), docs/economy_finance (incl. financial model), docs/project_management, docs/github, docs/eu/DSA.md, DPA template and DPIA.
• GitHub scaffolding: CI workflow (Linux/Windows/macOS), Dependabot, PR template, CONTRIBUTING.md.
• Tests for registration with codes, isolation, school admin, suspension, school deletion and the 001→002 migration.

<<<<<<< Updated upstream
**Changed**
=======
## Changed
>>>>>>> Stashed changes

• All documentation rewritten in English and updated for the operator-as-controller model.
• Book commission defaults to 0 (hidden in the UI unless set above 0).
• Admin links, privacy notice and rules no longer assume a single school.

<<<<<<< Updated upstream
**Removed**
=======
## Removed
>>>>>>> Stashed changes

• NOME_SCUOLA and DOMINIO_SCUOLA environment variables (schools live in the database).

## Upgrade notes

Run the server once: migration 002 runs automatically and moves existing data into one school named from NOME_SCUOLA if still set, otherwise "Default school". Find its invite code with npm run admin -- school-list. Back up data/ first.

 **- 2026-10-30**

First version with a real server and database.

## Added

• Node.js (Express) server with SQLite database: works on Linux, Windows, and macOS without XAMPP.
• Registration with email confirmation, login, and password recovery (password.html).
• Shared data among all students: events, announcements, ideas, polls, notes with photos, and books.
• "I want it" requests managed by the seller (accept/reject, reserved/handed over).
• Content reporting and Admin area (events, announcements, moderation).
• GDPR compliance: privacy notice and rules (privacy.html, regole.html), "I am at least 14 years old" checkbox, consent logging with versioning, data export (JSON), rectification, account deletion along with all contents and photos, automatic cleanup of unconfirmed accounts (3 days) and inactive accounts (12 months), and limited-retention backups.
• Commands npm run admin, npm run backup, npm run demo; automated tests (npm test).
• Documentation: docs/HOSTING.md, docs/DATABASE.md, docs/eu/{gdpr,cookies,cra}; CycloneDX SBOM.
• Dockerfile and docker-compose.yml (optional).

<<<<<<< Updated upstream
**Changed**
=======
## Changed
>>>>>>> Stashed changes

• Fonts locally hosted instead of Google Fonts (no student IPs sent to third parties).
• Scripts moved to external .js files, so CSP can ban inline scripts.
• Pages moved to src/frontend/; server code is in src/backend/.
• All permissions (admin, author, single votes) are verified by the server, no longer by the browser.
• The book fee is explained as an indicative calculation: no payments go through the platform.

<<<<<<< Updated upstream
**Fixed**
=======
## Fixed
>>>>>>> Stashed changes

• The admin role is no longer deducible from a list of emails visible to anyone in the site code.
• Fixed registration verification: users must now confirm their identity via the email link provided.
• Fixed data persistence: accounts and data are now safely stored on the server rather than only in the user's browser localStorage.
• Fixed a CSS issue where the hidden attribute failed, leaving the "Admin" link visible to students.
• Fixed event dates: replaced relative formats ("days from today") with real dates and times.

<<<<<<< Updated upstream
**Removed**
=======
## Removed
>>>>>>> Stashed changes

• Supabase schema (docs/legacy/) and recommendations for third-party hosting as the primary route.

 - Prototype

<<<<<<< Updated upstream
=======

## Added

>>>>>>> Stashed changes
• HTML pages with data saved in the browser's localStorage, without a server.
I have updated and fully translated your changelog to English, aligning it with the official Keep a Changelog standard headings (Added, Changed, Fixed, Removed).
