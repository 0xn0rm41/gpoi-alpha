# Record of processing activities (art. 30 GDPR): Hub Studenti

> **DRAFT: needs DPO / lawyer review. This is not legal advice.**
> Pre-filled for the technical part. **Complete the fields in [square brackets].** Default model: the **operator is the controller** (art. 30.1). If a school formally adopts the service (model B in [GDPR.md](GDPR.md#11-decision-box-for-the-team-not-decided-here)), the school records these activities in its own register and the operator keeps a processor record (art. 30.2): see the last section.

| | |
|---|---|
| **Controller** | [Operator name, address, contact] |
| **Joint controller** | None [confirm] |
| **Representative (art. 27)** | [Not needed while the operator is established in the EU: confirm] |
| **DPO** | [Name and contact, or "not appointed: reason"] |
| **Operational contact** | [Operator maintainer / IT contact] |
| **Register version / date** | [1.0 - dd/mm/yyyy] |

Related: [GDPR.md](GDPR.md) · [PROCEDURES.md](PROCEDURES.md) · [DPIA.md](DPIA.md) · [DPA-TEMPLATE.md](DPA-TEMPLATE.md)

## Activities

### T1: Accounts and access
| Field | Content |
|---|---|
| Purpose | Create and manage the account, join a school community with an invite code, authenticate the user, send service emails (verification, password reset) |
| Legal basis | Consent (art. 6.1.a) with art. 8 GDPR and art. 2-quinquies Italian Privacy Code (14 years in Italy; other countries: verify before opening); service emails: art. 6.1.b |
| Data subjects | Students who joined a school community |
| Data categories | First name, surname, own email, optional class, school membership, password hash (scrypt), consent date and notice version, last access date, sessions and email tokens (hashes only) |
| Recipients | Persons with technical access (operator); processors: [hosting], [SMTP]. School admins do **not** see emails |
| Third-country transfers | None [verify each provider and sub-processor] |
| Retention | Until account deletion or **12 months** since last access; unconfirmed accounts **3 days**; sessions **14 days**; email tokens 24 h (verification) / 1 h (reset) |
| Security measures | scrypt, HttpOnly/SameSite/Secure cookie, CSRF, rate limits, HTTPS, server-side permissions (see [GDPR.md](GDPR.md#6-security-measures-art-32)) |

### T2: Content and interactions
| Field | Content |
|---|---|
| Purpose | Provide the features: ideas, polls, notes with photos and comments, book listings and requests, event participation, announcements |
| Legal basis | Consent (art. 6.1.a) |
| Data subjects | Members of the school community (and, by mistake, people shown or named in content: forbidden by the rules, handled by moderation) |
| Data categories | Texts, note photos, votes, participations, book requests; shown with short name ("Mario R."); class visible only to the seller of a requested book |
| Recipients | Other members of the **same school** (internal visibility only); school admins for moderation; no public access |
| Third-country transfers | None |
| Retention | Until deletion of the content or of the account (cascade, photos included) |
| Security measures | School scoping of queries, private photos (logged-in members of the school), resizing that removes metadata, type and size validation, reporting tool |

### T3: Moderation and school administration
| Field | Content |
|---|---|
| Purpose | Remove unlawful or offensive content, handle reports, let school admins manage the invite code, the optional email-domain restriction and the member count |
| Legal basis | Legitimate interests (art. 6.1.f) [legitimate interest assessment to be written] |
| Data categories | Reports (type, content id, reason, reporter), school settings (name, invite code, optional domain, ideas threshold, active flag) |
| Recipients | School admins of that school (reports of their school only); operator |
| Retention | Resolved reports **90 days** after creation |
| Security measures | Admin role granted only from the command line by the operator; admins cannot see emails; admin list reviewed periodically; school suspension (`school-suspend`) closes sessions |

### T4: Security, rate limiting, logs, backups
| Field | Content |
|---|---|
| Purpose | Service continuity and recovery; protection against abuse and guessing of passwords |
| Legal basis | Legitimate interests (art. 6.1.f) |
| Data categories | IP address kept **in memory** for rate limiting (minutes, then forgotten; the application does not log IPs); proxy/hosting technical logs (IP, time, request) if enabled; copies of database and photos |
| Recipients | Operator; processors: [hosting], [backup storage] |
| Retention | Backups **30 days**; proxy/host logs max **14 days** |
| Security measures | Encrypted off-site backups; after a restore, repeat erasures already performed ([PROCEDURES.md](PROCEDURES.md#a-data-subject-requests-arts-15-22-gdpr)) |

### T5: Operator business administration (to be activated)
| Field | Content |
|---|---|
| Purpose | Contracts, invoicing and communication with the schools or organisations that subscribe; sponsorship agreements (no user data involved) |
| Legal basis | Contract (art. 6.1.b), legal obligations (art. 6.1.c: accounting and tax) |
| Data categories | Contact details of school representatives, billing data |
| Retention | As required by tax and accounting law [verify] |
| Note | Add details when this processing starts. **Book-sale commission is OFF**; if activated, add a payments processing activity and update [DPIA.md](DPIA.md) |

## Design promise (not a processing activity)
No advertising, no third-party trackers or analytics, no sale or sharing of user data for commercial purposes.

## Processors (art. 28)

| Provider | Service | Data location | Sub-processors checked | DPA signed (date) |
|---|---|---|---|---|
| [hosting / VPS] | Server, storage | [EU: country] | [ ] | [ ] |
| [SMTP service] | Email sending | [EU: country] | [ ] | [ ] |
| [backup storage] | Encrypted backups | [EU: country] | [ ] | [ ] |
| [tunnel/CDN, if used] | Traffic forwarding | [verify] | [ ] | [ ] |

## Authorised persons (art. 29)

| Name | Role | School | Appointment and instructions (date) | Revoked |
|---|---|---|---|---|
| [ ] | School admin / representative | [ ] | [ ] | |
| [ ] | Operator staff with technical access | n/a | [ ] | |

## Processor record (art. 30.2): only for schools under model B

| Field | Content |
|---|---|
| Processor | [Operator name and contact]; DPO [ ] |
| Controller(s) on whose behalf | [School name, contact, DPO] (one row per school with a signed [DPA](DPA-TEMPLATE.md)) |
| Categories of processing | Hosting and operation of the Hub Studenti community of that school |
| Third-country transfers | None |
| Security measures | As in [GDPR.md](GDPR.md#6-security-measures-art-32) |
