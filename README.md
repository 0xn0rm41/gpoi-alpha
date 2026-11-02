# Hub Studenti

Open-source student hub for schools: event board, idea voting, polls, shared notes and a second-hand book exchange.
Every school gets its own private community, joined with an **invite code**; users sign up with their **own email**.

Built on **Node.js + SQLite**: no XAMPP, no Apache/MySQL, identical on **Linux, Windows and macOS**.
Licensed **AGPL-3.0-or-later**, with commercial licensing and a hosted service planned
(see [docs/economy_finance](docs/economy_finance/README.md)).

> Status: pilot. The UI and code comments are in Italian; the documentation is in English. Legal documents are drafts that need review by a lawyer/DPO before real users, especially minors, are onboarded ([docs/eu](docs/eu/README.md)).

## Quick start

Requires [Node.js](https://nodejs.org) 20 or newer (tested on 22).

```bash
npm install
cp .env.example .env                                   # Windows: copy .env.example .env
npm run admin -- school-create "My School"             # prints the school's invite code
npm start                                              # http://localhost:3000
```

Open `register.html`, enter the invite code and sign up. Without SMTP configured, the confirmation link is printed in the
server console. Then make a representative a school admin:

```bash
npm run admin -- promote someone@example.org
```

Demo data: `npm run demo` (test databases only). All CLI commands: `npm run admin`. Backup: `npm run backup`. Tests: `npm test`.

## Project structure

```
hub-studenti/
├── docs/
│   ├── analisi_mercato/      market analysis: theory (THEORY.md) and frameworks (FRAMEWORKS.md)
│   ├── fattibilita/          feasibility: requirements, template, ROI/payback/NPV/IRR, Gantt template (.xlsx)
│   ├── economy_finance/      business model, pricing, costs, licensing strategy, financial model (.xlsx)
│   ├── project_management/   roadmap, risk register, process & ADRs, RACI, WBS
│   ├── github/               GitHub cheat sheet and templates
│   ├── eu/                   cookies, gdpr, cra (+ DSA): regulatory docs
│   ├── HOSTING.md            run and deploy (test → production), cross-platform
│   └── DATABASE.md           schema, migrations, backup
├── src/
│   ├── backend/              Express API, SQLite, migrations, CLI scripts
│   ├── frontend/             static pages and scripts (strict CSP, no external requests)
│   └── tests/                automated API tests (node --test)
├── .github/                  CI, Dependabot, PR template
├── CHANGELOG.md  CONTRIBUTING.md  LICENSE (AGPL-3.0-or-later)  README.md
```

## Documentation map

| Need | Read |
|---|---|
| Run it / go live | [docs/HOSTING.md](docs/HOSTING.md) |
| Database and migrations | [docs/DATABASE.md](docs/DATABASE.md) |
| Privacy, cookies, EU rules | [docs/eu/README.md](docs/eu/README.md) |
| Business and money | [docs/economy_finance/README.md](docs/economy_finance/README.md) |
| Market and feasibility | [docs/analisi_mercato/README.md](docs/analisi_mercato/README.md), [docs/fattibilita/README.md](docs/fattibilita/README.md) |
| Plan, risks, process | [docs/project_management/README.md](docs/project_management/README.md) |
| Contributing | [CONTRIBUTING.md](CONTRIBUTING.md), [docs/github/README.md](docs/github/README.md) |

## Security and privacy in short

scrypt password hashing, hashed session and email tokens, `HttpOnly` cookie, CSRF header + Origin check, strict CSP, rate limits,
anti-enumeration responses, private photo serving, per-school data isolation (tested), GDPR export/rectification/erasure,
automatic retention clean-up, one technical cookie and no trackers. Report vulnerabilities as described in
[docs/eu/cra/VULNERABILITY-POLICY.md](docs/eu/cra/VULNERABILITY-POLICY.md).

## Licence

[GNU AGPL-3.0-or-later](LICENSE). If you run a modified version as a network service you must offer its source to your users
(the footer links to `SOURCE_URL`). Fonts are self-hosted under the SIL OFL (licences in `src/frontend/fonts`).
