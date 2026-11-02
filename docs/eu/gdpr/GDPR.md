# GDPR guide for Hub Studenti

> **DRAFT: needs DPO / lawyer review. This is not legal advice.**
> This is a technical and organisational guide written alongside the code. Most users are **minors**. Before real personal data is collected, have this guide, the privacy notice (`src/frontend/privacy.html`) and the rules (`src/frontend/regole.html`) reviewed by a data protection officer (DPO) or a qualified lawyer.
> References: [Regulation (EU) 2016/679 (GDPR)](https://eur-lex.europa.eu/eli/reg/2016/679/oj) · [EDPB](https://www.edpb.europa.eu) · [Garante per la protezione dei dati personali (Italy)](https://www.garanteprivacy.it).

Related documents: [PROCESSING-REGISTER.md](PROCESSING-REGISTER.md) (art. 30) · [PROCEDURES.md](PROCEDURES.md) (data subject rights, breaches, moderation) · [DPIA.md](DPIA.md) (art. 35) · [DPA-TEMPLATE.md](DPA-TEMPLATE.md) (art. 28) · [../cookies/](../cookies/PRIVACY-POLICY.md) · [../cra/](../cra/CRA.md) · [../../HOSTING.md](../../HOSTING.md).

---

## 0. What changed with the multi-school version

- Users join a **school community** through an **invite code** (tables `scuole`, column `scuola_id` on users and on top-level content tables). All reads and writes are scoped to the user's school.
- Emails are the **users' own**. No school email domain is required. A school may optionally restrict sign-ups to one domain (`scuole.dominio_email`).
- The service will be run by the project's **operator** on its own domain and host (to be bought after the pilot). The software is open source (AGPL-3.0-or-later) and the operator may monetise it (see section 8).
- School "admins" are student representatives or staff. They are **authorised moderators with limited powers**, not owners of the data (see section 1.2).

## 1. Who is who (roles)

### 1.1 Decision box (for the team, not decided here)

| | **Model A (default): operator is the controller** | **Model B: school is the controller, operator is processor** |
|---|---|---|
| Who decides purposes and means | The operator (it designs the service, runs it, sets retention, chooses providers) | The school (it adopts the service for its own students and decides how it is used) |
| School admins | Authorised moderators acting under the operator's written instructions (art. 29) | Persons authorised by the school (art. 29; art. 2-quaterdecies Italian Privacy Code) |
| Paperwork | Privacy notice by the operator; processing register by the operator; DPIA by the operator | **Art. 28 data processing agreement** between school and operator ([DPA-TEMPLATE.md](DPA-TEMPLATE.md)); the school's register and DPIA cover the processing; the operator keeps a processor register (art. 30.2) |
| When it fits | Open registration by invite code; students join on their own initiative; the school has not formally adopted the service | A school (public or private) **formally adopts** the service: its management or DPO signs, it communicates the service to students and families, it integrates it into school activities |
| Main risk | The operator carries the full controller duties towards minors | The school needs its own DPO sign-off and a signed DPA before go-live; mixed use (some schools adopt, others do not) means both models can coexist per school |

**Decision needed from the team:** confirm Model A as the default, and decide whether Model B is offered to schools that ask. If both coexist, the privacy notice must say which one applies to each school. A school that uses the service informally and has not signed anything is treated under Model A.

Note: a student representative is **not** a controller in their own right and cannot sign for a school. If a school only "tolerates" the service, do not describe it as the school's service.

### 1.2 Roles table (default model A)

| Role | Who | Notes |
|---|---|---|
| **Controller** (art. 4(7), 24) | The operator [name, address, contact to be filled in `.env`: `TITOLARE_NOME`, `TITOLARE_CONTATTO`] | Decides purposes and means. Under model B this is the school |
| **Authorised persons** (art. 29) | School admins (`utenti.ruolo = 'admin'`) | Can: delete content in their school, read open reports for their school, see the member count, manage the invite code and the optional domain restriction, post events and announcements. **Cannot** see members' emails or other personal data. The admin role can only be granted from the command line by the operator (`npm run admin -- promote`) |
| **Processors** (art. 28) | Hosting provider, SMTP provider, backup storage, optional CDN/tunnel | Written agreement with each. Data in the EU. Placeholders in [PROCESSING-REGISTER.md](PROCESSING-REGISTER.md) |
| **DPO** (art. 37) | Not mandatory for the operator by default (not a public authority; no large-scale systematic monitoring or special-category processing): **to be confirmed by a lawyer**. Under model B the school's DPO is involved | Contact in `DPO_CONTATTO` if any |
| **Data subjects** | Students (minors and young adults) who joined a school community | |

Operator contact details go in `.env` and appear automatically in the privacy notice.

## 2. What data and why (data minimisation, art. 5.1.c)

| Data | Purpose | Who sees it | Where |
|---|---|---|---|
| First name, surname | Account; other students see "Mario R." (first name + initial) | Other students: first name + initial. Admins: same | `utenti` |
| Email (the user's own) | Login, verification, password reset | The user and persons with technical database access. **Not** school admins, **not** other students | `utenti` |
| School membership | Scoping of every community | Members of the same school | `utenti.scuola_id`, `scuole` |
| Class (optional) | School context; shown to the seller of a book the user requested | Seller of the requested book | `utenti.classe` |
| Password | Login | **Nobody**: only a scrypt hash with random salt | `utenti.pw_hash` |
| Consent (date, notice version), age declaration | Prove consent (art. 7.1) | Persons with technical access | `utenti.consenso_il`, `consenso_versione` |
| Content (ideas, polls, notes with photo, comments, book listings), votes, event participations, book requests, reports | Service features and moderation | Depends on the feature: votes and requests are not public | dedicated tables, `data/uploads/` |
| Sessions, email tokens | Security | Nobody (only SHA-256 hashes) | `sessioni`, `token_email` |

**Not collected:** date of birth (only an "I am at least 14" tick box), phone, postal address, profile photo, location, direct messages, special categories (art. 9), analytics, advertising identifiers.

**Residual risk:** users may write or photograph other people's data (faces, names in a notebook). The rules forbid it, there is a "Report" button, and photos are resized in the browser, which removes EXIF/GPS metadata.

## 3. Legal basis and minors

- **Consent** (art. 6.1.a) for the account and use of features: explicit tick at registration, stored with date and notice **version**; withdrawable by deleting the account (art. 7.3).
- **Legitimate interests** (art. 6.1.f) for security and moderation; **contract/service requested** (art. 6.1.b) for service emails (verification, password reset). A legitimate-interest assessment for the moderation and security processing should be written down by the controller.
- **Age of digital consent (art. 8 GDPR).** Member states may set the age for consent to information society services between **13 and 16**. **Italy: 14** (art. 2-quinquies Italian Privacy Code). Below that age the consent of the holder of parental responsibility is needed, and the controller must make reasonable efforts to verify it (art. 8.2).
- **Verify per country before opening a country.** Do not rely on a memorised table: for each country, check the national law on the age of consent, any national rules on processing minors' data and any national consumer rules. Recommended: **launch in Italy only**. Open registration to users from other countries only after a per-country check (record the result in this repository).
- **Age verification limits.** The service only asks for a tick box ("I am at least 14"). This is self-declaration: under-age users can lie. There is no parental-consent mechanism and none is planned for the pilot. If a school wants to admit younger pupils (for example lower secondary), a parental-consent flow must be designed first: it is **not implemented**. If an under-age account is discovered, delete it (procedure in [PROCEDURES.md](PROCEDURES.md)).
- **Safeguarding by design:** no direct messages, no public profiles (login required, short name only), no contact information shown, photos visible only to logged-in members of the same school, a reporting tool, and admin moderation. Any new feature that enables private contact between users requires a new risk assessment and a DPIA update.

## 4. Where the software applies the GDPR

| Obligation | How it is implemented |
|---|---|
| Lawfulness and transparency (art. 5.1.a, 12-14) | `privacy.html` and `regole.html` linked at registration, in the profile and in the footer; controller details from `.env` |
| Purpose limitation, minimisation (5.1.b-c) | Schema stores only necessary data; short name towards others; emails and surnames are not sent to other users (tested); school admins do not see emails |
| Accuracy (5.1.d, art. 16) | *Profile → edit* (`PATCH /api/me`); password change |
| Storage limitation (5.1.e) | `cleanup.js`, see section 5 |
| Integrity and confidentiality (5.1.f, art. 32) | Section 6 |
| Consent (art. 7, 8) | Ticks at registration; `consenso_il`, `consenso_versione`; age declaration (self-declared) |
| Access and portability (art. 15, 20) | *Profile → Download my data*: JSON with profile, content, votes, requests and photos (`GET /api/me/export`) |
| Erasure (art. 17) | *Profile → Delete my account* (`DELETE /api/me`, password required): cascade on all tables and photos removed from disk. Operator: `npm run admin -- delete-user <email>` |
| Restriction, objection, withdrawal (art. 18, 21, 7.3) | By email to the privacy contact: [PROCEDURES.md](PROCEDURES.md) |
| Data protection by design and by default (art. 25) | No tracking, no third-party resources (local fonts, strict CSP), private photos, non-public votes, no public profiles, school-scoped queries |
| Processors (art. 28) | Section 7; [DPA-TEMPLATE.md](DPA-TEMPLATE.md) |
| Records (art. 30) | [PROCESSING-REGISTER.md](PROCESSING-REGISTER.md) |
| Breach (art. 33-34) | [PROCEDURES.md](PROCEDURES.md); `npm run admin -- logout-all` to contain |
| DPIA (art. 35) | [DPIA.md](DPIA.md) |
| International transfers (chapter V, art. 44-49) | None if all providers are in the EU/EEA and do not use non-EU sub-processors (verify for each provider) |

## 5. Retention (values in the code)

| Data | Default | Variable (`.env`) | Source |
|---|---|---|---|
| Unconfirmed registration (account deleted) | **3 days** | `RITENZIONE_NON_VERIFICATI_GIORNI` | `cleanup.js` |
| Inactive account (account and content deleted) | **12 months** since last access | `RITENZIONE_INATTIVI_MESI` (0 = never delete: **not recommended**) | `cleanup.js` |
| Expired sessions | removed when expired; session lifetime **14 days** | `SESSIONE_GIORNI` | `cleanup.js`, `config.js` |
| Expired email tokens | removed when expired; verification link 24 h, reset link 1 h | n/a | `cleanup.js`, `routes-auth.js` |
| Resolved reports | **90 days** after creation, then deleted | not configurable | `cleanup.js` |
| Backups | **30 days** | `RITENZIONE_BACKUP_GIORNI` | `config.js`, `npm run backup` |
| Proxy/host technical logs (if enabled) | max **14 days** (stated in the privacy notice: must be honoured) | host configuration | privacy notice |

Cleanup runs at start-up and every 6 hours. Note that resolved reports are aged by their creation date, not by the date they were resolved.
A student who has graduated has no reason to stay registered. The 12-month inactivity limit is a ceiling, not a target. A school adopting the service (model B) may ask for shorter retention or for end-of-year deletion of final-year accounts (`npm run admin -- delete-user <email>`, one at a time).
When a school is removed by the operator (`npm run admin -- school-delete <school> --yes`) all its users, content and photos are permanently deleted; backups age out within 30 days.

## 6. Security measures (art. 32)

**Technical (in the code):** scrypt password hashing with salt; session cookie `HttpOnly` + `SameSite=Lax` (+ `Secure` over HTTPS), tokens stored only as hashes; CSRF protection (dedicated header plus `Origin` check); rate limits on login and registration; email verification; error messages that do not reveal whether an email exists; permissions enforced on the server (admin role only assignable from the command line); school scoping on every content query; validation and limits on all inputs; parameterised SQL; photos checked by real content (not file name), max 2 MB, stored outside the public folder and served only to logged-in members; strict CSP (no inline scripts, no external resources), `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'none'`; application logs without personal data; automated tests (`npm test`).

**To do in production (not done by the software):** HTTPS; OS and Node updates; firewall; **encrypted** off-site backups; server access limited to authorised people with strong passwords and 2FA; protected `.env`; periodic review of admins; checklist in [../../HOSTING.md](../../HOSTING.md).

**Organisational:** written appointment and instructions for school admins; procedures for rights and breaches ([PROCEDURES.md](PROCEDURES.md)); moderation rules; basic training for admins; a separate **school onboarding** step (the operator verifies who requests a school code).

## 7. Providers (processors) and international transfers

| Provider | Why | What to do |
|---|---|---|
| Hosting / VPS | Hosts database and photos | EU datacentre; art. 28 DPA; [placeholder: provider, country] |
| SMTP service | Sends verification and reset emails (address and name visible to the provider) | EU servers; DPA; no marketing use; [placeholder] |
| Backup storage | Encrypted backups | EU; DPA; encryption keys held by the operator; [placeholder] |
| Domain registrar / DNS | Domain name | Usually no personal data of users; check |
| Tunnel/CDN (optional) | Sees traffic in clear text | Avoid; if used, DPA and transfer assessment |

Transfers outside the EEA: **avoid**. Choose EU providers and check their sub-processors. If a transfer is unavoidable, use an adequacy decision (art. 45) or standard contractual clauses (art. 46) with a transfer impact assessment, and update the notice and the register.
Under model B the operator's own sub-processors must be listed in the DPA (see [DPA-TEMPLATE.md](DPA-TEMPLATE.md)).

## 8. Commercial use

The operator may fund the service through: **hosted subscriptions per school**, **optional sponsorship**, and an **optional book-sale commission (default OFF)**.

- **Design promise (to be stated in the privacy notice and the rules): no advertising, no third-party trackers, no sale or sharing of user data for commercial purposes.** Sponsorship, if any, must not involve any personal data of users and must not target users.
- **Subscriptions:** the school (a business or public body) pays the operator. Billing data are about the school's representatives (a separate processing, to be added to the register when it starts).
- **Book-sale commission:** today the commission is only a **calculation shown in the app** (`commissione_percentuale`, default 2, `npm run admin -- set commissione_percentuale 0` to disable). **No money passes through the platform** (the schema records only listings and requests). If the operator actually collects payments or a commission, this brings in other obligations that need legal advice before activation: payment services rules (use a licensed payment provider, do not hold funds), consumer law (information duties, withdrawal rights, identification of the seller as consumer or trader), tax, the rules on contracts with minors (capacity to contract), platform transparency rules for online marketplaces, and an update of the privacy notice and DPIA. Keep it OFF until then.
- Any change that turns user data into a commercial asset requires a new legal assessment and a new notice version (increase `VERSIONE_INFORMATIVA`).

## 9. DPIA

A full DPIA draft is in [DPIA.md](DPIA.md). Screening against the WP248 criteria: vulnerable data subjects (minors) **yes**; scale: **growing** (multiple schools, a provider serving many communities); no profiling, no automated decisions, no special categories collected. Because minors are involved and the service will scale, the draft DPIA is **recommended** and should be validated by a DPO.

## 10. Open points for the team

1. **Controller model** (section 1.1): A by default, B for schools that formally adopt.
2. **Countries:** Italy only first; per-country age check before opening another country (section 3).
3. **Age of consent and verification:** self-declaration only; decide about stronger checks or parental consent before admitting under-14s.
4. **Commercial model:** confirm the "no ads / no trackers / no data sales" promise; keep commission OFF until legal review.
5. **Moderation:** response time target 48 working hours; escalation of serious content (bullying, threats, self-harm) to the school's safeguarding contact.
6. **Proxy/host logs:** max 14 days, as stated in the notice.
7. **Contact between students** for books: only short name and class towards the seller; no private messages; arrangements happen in person at school.
8. **School onboarding:** how the operator verifies that the person asking for a school code speaks for the school.
9. **Privacy notice:** `privacy.html` still reads as if the controller were a school-level entity in places; align it to the model chosen.

## Checklist before go-live

- [ ] Controller model chosen; operator details, privacy contact (and DPO if any) set in `.env`
- [ ] Privacy notice and rules reviewed by a DPO or lawyer
- [ ] DPAs signed with hosting, SMTP and backup providers; data in the EU
- [ ] Processing register completed ([PROCESSING-REGISTER.md](PROCESSING-REGISTER.md))
- [ ] DPIA reviewed ([DPIA.md](DPIA.md))
- [ ] Italy-only launch confirmed; per-country check recorded for any other country
- [ ] School admins appointed in writing and instructed
- [ ] Commission OFF (or legal review done); "no ads / trackers / data sales" statement published
- [ ] HTTPS, SMTP, encrypted backups and a restore test ([../../HOSTING.md](../../HOSTING.md))
- [ ] Procedures for rights, breaches and moderation shared with everyone who runs the service ([PROCEDURES.md](PROCEDURES.md))
- [ ] Full test with a test account: registration, verification, data export, account deletion
- [ ] Announcement to students with links to the notice and the rules
