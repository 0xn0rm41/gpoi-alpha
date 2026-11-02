# Cyber Resilience Act (CRA): analysis for Hub Studenti

> Informational document, **not legal advice**. Reference: [Regulation (EU) 2024/2847](https://eur-lex.europa.eu/eli/reg/2024/2847/oj) on cybersecurity requirements for "products with digital elements".
> Article, recital and annex numbers below are given from the author's reading of the Regulation and **must be verified against the official text** before you rely on them. The Commission's guidance on open source, commercial activity and the stewards regime is still evolving. **Have a lawyer review sections 2 and 3 before you start charging money.**

Status of this document: rewritten for the commercialisation plan (hosted subscriptions per school, sponsorship, optional book commission that is OFF by default, possible dual commercial licence). Earlier versions assumed a non-commercial school project.

## 1. Dates

| Date | What (verify wording in the Regulation, Art. 71) |
|---|---|
| 10 Dec 2024 | Entry into force |
| 11 Jun 2026 | Provisions on notification of conformity assessment bodies apply (not relevant for self-assessment) |
| **11 Sep 2026** | **Reporting obligations of manufacturers apply** (Art. 14): actively exploited vulnerabilities and severe incidents. This date has **already passed** (today is 31 Oct 2026), and it applies to products already on the market, not only new ones |
| **11 Dec 2027** | **Full application**: essential requirements (Art. 13, Annex I), technical documentation, conformity assessment, CE marking, user information |

## 2. Is Hub Studenti in scope?

### 2.1 Building blocks of the test

| Concept | Where (verify) | Meaning for this project |
|---|---|---|
| Product with digital elements | Art. 2, Art. 3(1) | A software or hardware product and its remote data processing solutions, including software or hardware components placed on the market separately |
| Remote data processing | Art. 3(2) | Data processing at a distance for which the software is designed and developed by the manufacturer (or under its responsibility), and without which the product could not perform one of its functions |
| Making available on the market | Art. 3 (definitions of "making available" and "placing on the market") | Supply of a product for distribution or use in the course of a commercial activity, whether in return for payment or free of charge |
| Commercial activity | Recital 18 (hedge: check exact wording and numbering) | Not only charging a price for the product. The recitals list charging for technical support, providing a software platform through which the manufacturer monetises other services, and using personal data for purposes other than security, software maintenance or improvement |
| Free and open-source software outside commercial activity | Recital 15 and following, Art. 2 | Non-monetised open source supplied outside a commercial activity is not covered |
| Open-source software steward | Art. 3 (definition), Art. 24 | A legal person (not a manufacturer) that systematically provides support on a sustained basis for the development of open-source products intended for commercial activities, and ensures their viability. Light regime: cybersecurity policy, cooperation with market surveillance, and vulnerability reporting duties for the steward's role. **No administrative fines** for stewards |
| Manufacturer | Art. 3, Art. 13 | The natural or legal person who develops or manufactures a product, or has it designed, developed or manufactured, and markets it under its own name or trademark, for payment or free of charge. Carries the full obligations |

### 2.2 Scenarios for this project

| Scenario | Likely classification | Reasoning and caveats |
|---|---|---|
| Source code on a public repository, volunteers, no income, no hosted offer | Probably **out of scope** (non-commercial FOSS) | Matches the old assumption of this document. Donations alone are a grey area: pure donations without conditions are usually treated more leniently than donations tied to features or support, but check the guidance |
| A school or association runs **its own** instance for its students, nobody pays | Probably out of scope for the code, and the instance is a service | Not a distribution of a product |
| **Operator hosts the app for several schools for a subscription fee** (pure SaaS: schools only use a browser) | **Uncertain, leaning outside the CRA as a pure service**, but not safe to assume | The CRA regulates *products*. A service that merely runs software on the operator's own servers is not "making a product available". The CRA text covers *remote data processing solutions* only as part of a product (for example a mobile app that needs the vendor's backend). Here the web front end is served from the same host and nothing is installed by the user, which argues for "service". Counter-argument: regulators may look at the whole offer. Also consider other regimes (NIS2 if the operator or customers qualify, GDPR as processor, Italian rules for schools) |
| Operator **sells a licence to the code** (dual commercial licence to anyone who does not want AGPL), or distributes builds, images or installers for a price | **Likely a manufacturer: in scope** | Charging a price for the software makes the supply commercial. The AGPL does not change this |
| Operator sells **paid support, installation or maintenance** for self-hosted copies | **Likely commercial activity**, so the software the operator provides may be in scope | Recital 18 explicitly mentions paid technical support as a possible indicator. A school that self-hosts a package it bought or received from the operator is the typical in-scope pattern |
| **Sponsorship / advertising** inside the platform | Possible indicator of commercial activity (monetising through the platform) | Depends on structure and scale |
| **Book commission** (default OFF; `commissione_percentuale` is only a displayed calculation today, no payment flows through the app) | If switched on, it is a way of monetising the platform | Re-run this assessment before enabling it |
| A company or foundation that **systematically sponsors development** of the code that others use commercially | Possibly an **open-source steward** (Art. 24) rather than a manufacturer | Applies to the entity supporting the project, not to the operator of a hosted service |

### 2.3 Working conclusion

1. While the project stays non-monetised open source, the CRA most probably does not apply to the code as such.
2. The moment the operator earns revenue **from the software as a distributable product** (licences, support packages for self-hosting, paid installers or images), assume **manufacturer status** and plan for full compliance by 11 Dec 2027, with the reporting duties already in force since 11 Sep 2026.
3. A **pure hosted subscription** (the operator alone runs the only instance or instances, customers get a login) may fall outside the CRA because it is a service, **not a product delivered to the customer**. That is a legal interpretation and not a safe harbour: **verify with a lawyer** before relying on it, and document the reasoning in writing.
4. The safest practical path is to **apply the CRA requirements voluntarily and from day one** (they largely overlap with GDPR Art. 32), keep the architecture of the hosted offer clearly service-based, and decide deliberately before selling self-hosted licences or support.

## 3. Classification

The CRA has a **default** category and two stricter ones: **important products** (Annex III, class I and II) and **critical products** (Annex IV), which require third-party assessment or certification in some cases.

Hub Studenti is a web application with login, content sharing, polls, notes with photos and a book exchange. It does not appear to be an identity management system, password manager, browser, network or security device, operating system, or any other listed category (verify the current Annex III list and any Commission implementing acts that refine the descriptions). **Expected class: default.**

Consequence: **self-assessment (internal control, "Module A")** is available (Art. 32), no notified body is needed. Re-check if the product scope changes (for example adding SSO/identity provider functions or payment handling).

## 4. Essential requirements (Annex I, Part I) mapped to this codebase

Annex I, Part I contains requirement (1) (products designed to ensure an appropriate level of cybersecurity based on risk) and a list (2)(a)-(m) of specific properties. Wording is paraphrased. "Evidence" points to files in this repository.

| Requirement (paraphrased) | What the code does today | Evidence | Honest gap |
|---|---|---|---|
| No known exploitable vulnerabilities at placing on the market | `npm audit --omit=dev` reports 0 vulnerabilities (checked 31 Oct 2026); three direct dependencies | `package.json` | No automated dependency monitoring in CI; checked manually |
| Secure by default configuration, with the possibility to reset to the original state | No default accounts or passwords. The first admin is created only by CLI (`promote`). Registration requires an invite code and a verified email. Cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` when `BASE_URL` is https | `routes-auth.js`, `security.js`, `scripts/admin.js` | `NODE_ENV=production` and `TRUST_PROXY` must be set by the operator; the server only prints a warning when production runs without https (`index.js`). No documented "reset to factory state" procedure |
| Security updates, automatic by default with an opt-out, plus a way to notify users | Updates are manual: `git pull`, `npm ci`, restart. Schema migrations run automatically at start-up (`db.js`, `migrations/`) | `docs/HOSTING.md` | **No automatic update mechanism**. For a hosted service the operator updates every school at once; for self-hosted users the manufacturer would need to define an update channel (releases, advisories) and think about how the "automatic by default" wording applies (verify) |
| Protection against unauthorised access (authentication, access control) | Server-side checks for every route; passwords hashed with scrypt (N=32768, r=8, p=1, random 16-byte salt); constant-time comparison; dummy hash for unknown emails; sessions and email tokens stored only as SHA-256; admin role set only via CLI; school scoping on every content query (`scuola_id`); suspended schools are blocked from signing in | `security.js`, `routes-me.js`, `routes-contenuti.js` | No multi-factor authentication. Admin role is not tied to a school in the CLI (`promote` works on any user); school-level isolation depends on application queries, not on database-level enforcement |
| Confidentiality of data (encryption at rest and in transit) | In transit: HTTPS via the reverse proxy, HSTS (max-age 15552000) when `BASE_URL` is https. At rest: passwords hashed, tokens hashed | `security.js`, `docs/HOSTING.md` | **SQLite database and uploaded photos are not encrypted at rest** (rely on disk encryption); backups are plain copies until the operator encrypts them. HSTS has no `includeSubDomains` or preload |
| Integrity (protection against unauthorised manipulation) | Parameterised queries (better-sqlite3 prepared statements), length and enum `CHECK` constraints in the schema, foreign keys ON, CSRF defence (custom `X-Requested-With: hub` header + Origin check), small body limits (20 kB, 3 MB for note photos) | `app.js`, `migrations/001_init.sql`, `db.js` | No signed releases or signed container images. No integrity check on uploaded images beyond the name pattern |
| Data minimisation | Only name, surname, email, class, password hash, consent record. No date of birth, phone, address | `migrations/001_init.sql`, `docs/eu/gdpr/` | None known. Analytics: none. Emails are now users' own addresses on any provider (if no domain restriction is set), which is more personal data than a school address |
| Availability and resilience, including DoS mitigation | Restart policies (systemd, Docker `restart: unless-stopped`), health check in `Dockerfile`, backups | `docs/HOSTING.md`, `Dockerfile` | Rate limiters are **in memory, per process** (reset on restart, no shared store). No global request rate limit on content endpoints; the reverse proxy should provide it. Single SQLite file means a single node |
| Minimise negative impact on other services | One process, outbound connections only to the configured SMTP server | `mail.js` | No SMTP circuit breaker or queue: a slow SMTP server delays the request that sends mail (verify) |
| Limit the attack surface | Only `src/frontend` is served; `dotfiles: "ignore"`; strict CSP (`default-src 'self'`, no inline scripts, `frame-ancestors 'none'`, `object-src 'none'`); `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `X-Frame-Options`, `Permissions-Policy`, COOP; `X-Powered-By` removed; container runs as non-root user | `security.js`, `app.js`, `Dockerfile` | `style-src` allows `'unsafe-inline'`. Docker base image is a floating tag (`node:22-bookworm-slim`), not pinned by digest |
| Reduce impact of incidents with exploitation mitigation | Failure isolation by process user, systemd hardening in the documented unit, `logout-all` command to invalidate every session and email token | `scripts/admin.js`, `docs/HOSTING.md` | No incident runbook specific to the CRA; GDPR breach steps are in `docs/eu/gdpr/PROCEDURES.md` |
| Security-relevant logging and monitoring, with an opt-out for the user | Server errors go to stdout (journald); proxy keeps access logs | `app.js`, `index.js` | **No structured security event log** (failed logins, role changes, school deletion, invite code rotation are not recorded as events). No alerting |
| Secure and permanent deletion of data, and easy transfer | Account deletion cascades through all content and removes photo files; school deletion removes all users, content, photos; JSON export of own data; automatic retention clean-up | `db.js` (`eliminaUtente`, `eliminaScuola`), `cleanup.js`, `routes-me.js` | Backups keep deleted data until they expire (default 30 days) and restores need re-deletion (see `docs/HOSTING.md`). SQLite free pages may retain deleted content until vacuum (not verified here) |

## 5. Vulnerability handling (Annex I, Part II)

| Requirement (paraphrased) | Where in this project |
|---|---|
| (1) Identify and document components, including an SBOM in a commonly used machine-readable format, covering at least top-level dependencies | [`sbom.cdx.json`](sbom.cdx.json), see section 6 |
| (2) Address and remediate vulnerabilities without delay, including through security updates | Process in [VULNERABILITY-POLICY.md](VULNERABILITY-POLICY.md); `npm audit` at each release |
| (3) Effective and regular tests and reviews | `npm test` (`src/tests/api.test.js`), manual review. **Gap:** no CI pipeline, no static analysis, no fuzzing, no pen test |
| (4) Publicly disclose fixed vulnerabilities (description, severity, affected versions, remediation) once a fix is available | GitHub Security Advisories and `CHANGELOG.md` "Security" section |
| (5) Enforce a coordinated vulnerability disclosure policy | [VULNERABILITY-POLICY.md](VULNERABILITY-POLICY.md) |
| (6) Facilitate sharing of information on potential vulnerabilities, including a contact address | Security contact in the policy and `security.txt` |
| (7) Mechanisms to securely distribute updates | Git tags and GitHub releases. **Gap:** no signed tags or signed artefacts yet |
| (8) Disseminate security patches without delay and free of charge, with advisory messages | GitHub advisories; hosted customers get the fix by redeploy. **Gap:** no subscriber channel (mailing list) for self-hosters |

## 6. SBOM

The file [`sbom.cdx.json`](sbom.cdx.json) is a CycloneDX 1.5 document generated from `package-lock.json` for **production dependencies only**.

Regenerate at every release (from the project root):

```bash
npm ci
npm sbom --sbom-format cyclonedx --omit dev > docs/eu/cra/sbom.cdx.json
node -e 'JSON.parse(require("fs").readFileSync("docs/eu/cra/sbom.cdx.json","utf8")); console.log("valid JSON")'
```

The current file was generated on 31 Oct 2026 and lists 105 components. Notes:

- It describes the **npm dependency tree**. It does not list the Node.js runtime, the OS packages, or the Docker base image. If you ship container images, generate a second SBOM for the image with a tool such as Syft or Trivy and archive both with the release.
- `better-sqlite3` compiles or downloads a native SQLite library. Check whether the embedded SQLite version is visible to your SBOM tooling; if not, add it manually to the technical documentation.
- Keep the SBOM with each tagged release, not just in the main branch, so each shipped version has a matching inventory.
- Scan the SBOM for known vulnerabilities (for example `npm audit --omit=dev`, or a scanner that reads CycloneDX) as part of the release checklist.

## 7. Support period

The manufacturer must determine the support period based on the expected use of the product, **at least 5 years** unless the product is expected to be used for less (Art. 13(8), verify). Security updates must be provided during that period (Art. 13(9)), and the period is stated clearly to the user at purchase.

Proposal (operator to confirm and publish): **each major version receives security fixes for at least 5 years from its first release, or until the end of the paid subscription for hosted customers**, whichever the operator commits to in the contract. Record it in the README, in the supported-versions table in [VULNERABILITY-POLICY.md](VULNERABILITY-POLICY.md), and in the customer terms. Current release: 1.0.0 (30 Oct 2026). Support end date: **[to be set by the operator]**.

## 8. Technical documentation and conformity (default class)

If you are a manufacturer, prepare the technical documentation (Art. 31, Annex VII) **before** placing the product on the market and keep it for **10 years or for the support period, whichever is longer** (Art. 13(13), verify).

| Item (Annex VII, paraphrased) | Where it will live |
|---|---|
| General description of the product, intended purpose, versions | `README.md`, this repository |
| Design and development description, system architecture, components | `docs/DATABASE.md`, `docs/HOSTING.md`, source code; add an architecture page |
| Vulnerability handling process, SBOM, coordinated disclosure policy, secure update distribution | [`sbom.cdx.json`](sbom.cdx.json), [VULNERABILITY-POLICY.md](VULNERABILITY-POLICY.md) |
| **Cybersecurity risk assessment** (Art. 13(2)-(3)) | **Missing.** Write one: assets (student personal data, including minors, photos), threats (account takeover, cross-school data leak, upload abuse, email abuse), controls from section 4 |
| Applied harmonised standards or common specifications, or other solutions used | To be listed once relevant standards are published |
| Test reports | `npm test` output; add dated pen-test or review reports |
| EU declaration of conformity (Annex V) | Template to be created |
| User information and instructions (Annex II): manufacturer name and contact, vulnerability contact, support period, secure setup and update instructions, where to find the SBOM (if provided) | `README.md`, `docs/HOSTING.md`, security contact |

Conformity route for the default class: **internal control (Module A)**: the manufacturer self-assesses against Annex I, draws up the EU declaration of conformity (Art. 28, Annex V) and affixes the **CE marking** (Art. 29-30). For software distributed digitally, the CE marking and the declaration must be easily accessible (for example on the website or in the package). Verify the exact modalities.

## 9. Reporting actively exploited vulnerabilities and severe incidents (Art. 14)

Applies to manufacturers **from 11 Sep 2026**, for all in-scope products including those placed on the market earlier. Reports go through the **single reporting platform** operated by ENISA and are addressed to the CSIRT designated as coordinator (for Italy, the national CSIRT, which sits within ACN, verify). Typical structure (verify exact deadlines and triggers in Art. 14):

| Step | Timing | Content |
|---|---|---|
| Early warning | Within **24 hours** of becoming aware of an actively exploited vulnerability | Notification that it exists, and where available the member states where the product is available |
| Vulnerability notification | Within **72 hours** | General information on the product, nature of the exploit and vulnerability, corrective or mitigating measures taken and that users can take, and how sensitive the manufacturer considers the information |
| Final report | Within **14 days** after a corrective or mitigating measure is available | Description of the vulnerability and its severity and impact, information on the malicious actor if known, details of the security update or other corrective measure |
| Severe incident having an impact on the product's security | Same early warning and notification pattern; final report within about **one month** of the incident notification (verify) | Incident description, severity, root cause, mitigation |

Internal procedure to prepare **now**:

1. Name an owner and a deputy who can file within 24 hours, including weekends.
2. Register for the ENISA single reporting platform as soon as it is available (check ENISA announcements).
3. Keep a template for each of the three reports and a log with timestamps of "becoming aware".
4. After a report, publish a security advisory and inform affected customers and self-hosters without delay.
5. If personal data are affected, the **GDPR 72-hour breach notification to the Garante** is a separate duty: see `docs/eu/gdpr/PROCEDURES.md`. The two clocks run independently.

## 10. Release checklist

- [ ] `npm test` green
- [ ] `npm audit --omit=dev` shows no high or critical findings
- [ ] SBOM regenerated and archived with the release tag
- [ ] `CHANGELOG.md` updated, with a "Security" section when relevant
- [ ] No secrets in the repository (`.env`, keys); `git log -p | grep -i smtp_pass` finds nothing
- [ ] Licence consistency checked (see section 11)
- [ ] No new monetisation element without re-running section 2
- [ ] Support period and security contact current in README and policy

## 11. Open points found while writing this version

1. **Licence mismatch:** `package.json` declares `"license": "MIT"` while `LICENSE` is the GNU AGPL v3 text. Align it (for example `AGPL-3.0-or-later`). A dual commercial licence also requires clear copyright ownership or contributor licence agreements for all contributions.
2. **`security.txt` is not served by the app:** `express.static` is configured with `dotfiles: "ignore"`, so `/.well-known/security.txt` placed under `src/frontend` would not be served. Serve it from the reverse proxy (see the Caddy snippet in [VULNERABILITY-POLICY.md](VULNERABILITY-POLICY.md)) or add a dedicated route.
3. No CRA risk assessment, no declaration of conformity template, no CI, no signed releases (sections 4, 5, 8).
4. Decide explicitly between "hosted service only" and "also sell licences or support for self-hosting", and record the decision with legal advice.
