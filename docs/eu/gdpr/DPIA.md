# Data protection impact assessment (art. 35 GDPR): Hub Studenti (draft)

> **DRAFT: needs DPO / lawyer review. This is not legal advice.**
> Structure follows the CNIL / EDPB approach: (1) description, (2) necessity and proportionality, (3) risks, (4) measures, (5) residual risk and decision. The controller (default: the operator; under model B: the school, with the operator's help under art. 28.3.f) owns this document. Related: [GDPR.md](GDPR.md) · [PROCESSING-REGISTER.md](PROCESSING-REGISTER.md) · [PROCEDURES.md](PROCEDURES.md) · [DPA-TEMPLATE.md](DPA-TEMPLATE.md).

| | |
|---|---|
| Controller | [Operator / school] |
| DPO advice (art. 35.2) | [name, date, opinion] |
| Author(s) / date / version | [ ] |
| Status | Draft: validation pending |

## 0. Why a DPIA

Screening (WP248 criteria): **vulnerable data subjects (minors): yes**; innovative technology: no; systematic monitoring: no; profiling or automated decisions: no; special categories: not collected (risk of accidental disclosure in content); **scale: expected to grow** (several schools hosted by one provider). Because a service for minors is expected to scale, a DPIA is recommended even if the threshold is not clearly met. Re-run it before: opening a new country, adding private messaging or any new data category, enabling commissions/payments, adding a third-party service, or any change to the controller model.

## 1. Description of the processing

### 1.1 Context and nature
A web platform where students of a school share ideas, polls, study notes (photos and comments), book listings (gift or sale) and event information. Students join a **school community** with an **invite code** and a self-chosen email. School "admins" (student representatives or staff) moderate in a limited way. The operator hosts the service in the EU. Source code is AGPL-3.0-or-later. Funding may come from school subscriptions, optional sponsorship and an optional book-sale commission (OFF by default, no money passes through the platform today). **Promise: no ads, no trackers, no data sales.**

### 1.2 Data, data subjects, flows
See [PROCESSING-REGISTER.md](PROCESSING-REGISTER.md) T1-T4. Data subjects: minors (from 14 in Italy, declared by tick box) and young adults. Data: name, own email, optional class, school, password hash, consent record, content, votes, requests, reports, session/token hashes. Flows: browser to server (HTTPS); server to SMTP provider (name and email, for verification and reset); server to backup storage (encrypted). Visibility: other members of the same school see content with first name and surname initial; nobody sees emails; no public pages.

### 1.3 Retention
Unconfirmed accounts 3 days; inactive accounts 12 months; sessions 14 days; tokens 24 h / 1 h; resolved reports 90 days; backups 30 days; host logs max 14 days ([GDPR.md](GDPR.md#5-retention-values-in-the-code)).

### 1.4 Supporting assets
Node/Express application, SQLite database file, photo folder, reverse proxy, EU hosting, SMTP provider, backup storage, the operator's administration workstation.

## 2. Necessity and proportionality

| Question | Assessment |
|---|---|
| Specific, explicit, legitimate purposes | Yes: student participation, notes and books exchange, moderation, security |
| Legal basis | Consent (art. 6.1.a) for the account and features; art. 8 for minors (Italy: 14); legitimate interests (moderation, security); contract for service emails. **Weak point:** consent from minors via a tick box, no parental consent, no real age check: acceptable only for the age band the law allows consent for and with this limit accepted by the controller |
| Adequate, relevant, minimised data | Yes: no birth date, phone, address, profile photo, location or messaging; optional class; short name shown to others |
| Accuracy | Users edit their own data |
| Limited retention | Yes, automated cleanup (section 1.3); 12-month inactivity ceiling |
| Information of data subjects | Privacy notice in plain language, versioned; rules page; to be aligned with the chosen controller model |
| Rights | Self-service export, edit, deletion; other rights by email within one month ([PROCEDURES.md](PROCEDURES.md)) |
| Processors | EU providers under art. 28 agreements; placeholders to fill |
| Transfers | None: EU/EEA only |
| Prior consultation (art. 36) | Needed only if high residual risk remains after the measures |

## 3. Risks (to the data subjects)

Likelihood (L) and severity (S): negligible / limited / significant / maximum, before extra measures but counting the measures already in the code.

| # | Risk | Feared event | Sources | L | S |
|---|---|---|---|---|---|
| R1 | **Illegitimate access** to data (database leak, account takeover, admin abuse) | Emails, names, class, school, photos exposed; phishing or harassment of minors; identification of minors | External attacker; insider; credential reuse | Limited | Significant |
| R2 | **Unwanted modification** (content tampered, admin deletes or edits unfairly, cross-school data mix-up) | Loss of trust, wrong content shown, a student exposed in another school's community | Bug in school scoping; malicious admin | Limited | Limited |
| R3 | **Data disappearance** | Loss of content; resurrection of erased accounts after a backup restore | Failure, ransomware, restore without re-applying erasures | Limited | Limited |
| R4 | **Under-age users** (below the age of consent) | Unlawful processing; exposure of children to peers and strangers | Tick-box age only; false declarations; opening to other countries with different ages | Significant | Significant |
| R5 | **Contact with strangers / grooming / bullying** | Harmful contact, harassment, doxxing through content (photos, names, class) | Open invite code leaked outside the school; users posting personal data; no DM mitigates | Limited | Maximum |
| R6 | **Third-party data in content** (faces, names in notes, other students' details) | Identification and exposure of non-users, including minors | Users' photos | Significant | Limited |
| R7 | **Commercial drift** (ads, trackers, data monetisation, commission/payments with minors) | Profiling, manipulation, financial harm, loss of trust | Business pressure; configuration of the commission | Limited | Significant |
| R8 | **Over-retention / purpose creep** | Data kept after graduation; reuse for other purposes | Inactive accounts; new features | Limited | Limited |
| R9 | **Concentration of many schools in one provider** | One incident affects many communities | Scale | Limited | Significant |
| R10 | **Third-party processor failure or transfer outside the EU** | Loss of control, unlawful transfer | Provider sub-processors | Limited | Significant |

## 4. Measures

| Risk | Measures already in place (code) | Measures to put in place (organisational / operational) |
|---|---|---|
| R1 | scrypt hashing, hashed tokens, secure cookies, CSRF, rate limits, strict CSP, parameterised SQL, admins cannot see emails, admin role only from CLI, private photos | HTTPS, patching, firewall, 2FA on server access, encrypted backups, least privilege for operator staff, access log review, pen-test before scale-up, breach procedure ([PROCEDURES.md](PROCEDURES.md)) |
| R2 | All content queries scoped to `scuola_id`; ownership checks; school admin powers limited to their school | Automated tests for cross-school isolation on every new route; audit trail of admin deletions [consider]; written admin instructions |
| R3 | Backups with 30-day retention; export feature | Restore tests; **re-apply the erasure log after every restore** |
| R4 | Age tick box with explicit text; privacy notice states the minimum age; deletion of under-age accounts when found | **Italy-only launch**; per-country age-of-consent check before opening any country; no parental-consent flow exists, so do not admit under-14s; reconsider stronger age assurance if risk grows; school onboarding verified by the operator |
| R5 | No DMs, no public profiles, no contact details, login required, school scoping, invite code needed, report button, admin moderation | Invite code rotation (admin panel, CLI); communicate rules to students; 48 working hours moderation target; escalation path to the school's safeguarding contact; new features that allow private contact require a DPIA update |
| R6 | Rules forbid it; report button; browser resizing removes EXIF/GPS | Moderator guidance to delete photos with identifiable third parties; periodic reminders in the app |
| R7 | **Design promise**: no ads, no trackers, no data sales; no third-party resources; commission default OFF and only computed in the UI | Publish the promise in the notice and rules; legal review (payments, consumer law, minors' contracts) **before** any monetary flow; any change requires a new notice version and a DPIA update; sponsorship without any user data |
| R8 | Automated cleanup; 12-month inactivity deletion | Offer end-of-year deletion of final-year accounts; review retention yearly |
| R9 | Per-school scoping and suspension (`school-suspend`) | Operator security posture proportional to scale; incident drills; DPAs and, under model B, per-school DPA |
| R10 | EU-only design; local fonts; no external scripts | Check each provider's sub-processors; art. 28 agreements; SCCs only if unavoidable |

## 5. Residual risk and decision

| Risk | After measures: L / S | Comment |
|---|---|---|
| R1 | Limited / Significant, **acceptable if** production checklist is completed | Depends on operational hygiene |
| R2 | Limited / Limited | Keep isolation tests |
| R3 | Negligible / Limited | |
| R4 | Limited / Significant, **the key open risk** | Tick box cannot prevent lying: accepted only with the Italy-only launch, a minimum age of 14, and prompt deletion; the controller and DPO must explicitly accept or require a stronger measure |
| R5 | Limited / Significant | Strongly reduced by the absence of DMs and public profiles; keep it that way |
| R6 | Limited / Limited | |
| R7 | Negligible / Significant, **conditional on keeping the promise and commission OFF** | |
| R8 | Negligible / Limited | |
| R9 | Limited / Significant | Re-assess when schools exceed [number] |
| R10 | Limited / Limited | |

**Conclusion (to be completed by the controller with the DPO):** [ ] residual risks acceptable on these conditions / [ ] further measures required / [ ] prior consultation with the supervisory authority (art. 36).

### Conditions for go-live
1. Italy only; minimum age 14; per-country check before any other country.
2. Production checklist in [GDPR.md](GDPR.md#checklist-before-go-live) done; DPAs signed.
3. No DMs, no public profiles, no contact details: no change without a new DPIA.
4. Commission OFF; no ads/trackers/data sales.
5. Controller model decided; under model B a signed [DPA](DPA-TEMPLATE.md).

### Review
Review every [12] months and on any change listed in section 0. Record: [date, reviewer, outcome].

### Stakeholder views (art. 35.9)
[Record whether data subjects or their representatives (for example student councils, parents' associations) were consulted, or why not.]
