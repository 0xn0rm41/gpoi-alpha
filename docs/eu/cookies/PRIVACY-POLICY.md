# Privacy notice — fill-in template (GDPR arts. 13/14)

> **DRAFT TEMPLATE — NOT LEGAL ADVICE.** This text must be completed with the operator's real details and reviewed by a lawyer and/or a DPO before the service is opened to the public. Replace every `[BRACKETED PLACEHOLDER]`. Delete this box and the "Operator checklist" at the end before publishing.
>
> The in-app version lives in [`src/frontend/privacy.html`](../../../src/frontend/privacy.html) (Italian) and is filled from `.env`. Keep both in sync and bump `VERSIONE_INFORMATIVA` when the content changes materially.

---

# Hub Studenti — Privacy notice

Version: `[VERSION, e.g. 2026-11]` · Last updated: `[DATE]`

## The short version (plain language)

- **Who we are.** `[OPERATOR NAME]` runs Hub Studenti. We decide how your data is used. You can write to us at `[PRIVACY CONTACT EMAIL]`.
- **What we keep.** Your name, email, school, optionally your class, a scrambled version of your password (we never see the real one), and what you post: ideas, polls, notes with photos, comments, book listings, votes and reports.
- **Who sees it.** Other students see your first name and the first letter of your surname. They do not see your email. School admins can remove content in their school but cannot see your email or other personal details.
- **No tracking.** No ads, no analytics, no data sold, nothing loaded from other companies' servers. We use one cookie, only to keep you logged in.
- **You are in control.** In your Profile you can download your data, fix it, or delete your account and everything you posted.
- **Age.** You must be at least 14. If you are younger, a parent or guardian must agree (Italian law).
- **Problems?** Write to us. You can also complain to the Italian data protection authority, the Garante (garanteprivacy.it).

The rest of this page gives the full details.

---

## 1. Who is responsible (the controller)

| | |
|---|---|
| Controller | `[OPERATOR LEGAL NAME / TRADING NAME]` |
| Legal form and registration | `[e.g. sole trader, association, company; VAT / tax ID / registry number]` |
| Registered address | `[ADDRESS, COUNTRY]` |
| Privacy contact | `[PRIVACY CONTACT EMAIL]` |
| Data Protection Officer (DPO) | `[DPO NAME AND EMAIL, or: "We have not appointed a DPO because it is not required in our case"]` |
| EU representative (only if the operator is outside the EU) | `[NAME AND ADDRESS, or delete]` |

Whether a DPO is mandatory depends on the operator's activities and scale (GDPR art. 37); the operator must assess this and document the decision.

## 2. How the service is organised: schools and invite codes

Hub Studenti is divided into **school communities**. You join a community with an **invite code** that a school representative gives you. Content is shared inside your school community.

- **School admins** (student representatives or staff with the admin role) can delete content in their school, see reports, see how many members there are, and manage the invite code. They **cannot** see members' email addresses, passwords or other personal data.
- The **school itself is not the controller** of Hub Studenti, unless the operator and the school have agreed otherwise in writing: `[CONFIRM: the operator is the sole controller / the school and operator are joint controllers or the operator is a processor under a separate agreement]`.
- Technical access to the database is limited to `[NAMED ROLES, e.g. the operator and its administrators]`, who are bound by confidentiality.

## 3. What data we process, why, and on what legal basis

| Data | Why | Legal basis (GDPR art. 6) |
|---|---|---|
| First name, surname, email, school, class (optional), password hash (scrypt, never plain text), date and version of acceptance of the rules and this notice, last login date | Create and run your account; let you use the service | Consent (art. 6(1)(a)), given at sign-up and withdrawable at any time by deleting your account. `[Operator may prefer contract (6(1)(b)) for logged-in features: decide with your lawyer]` |
| Content you publish: ideas, polls, notes and their photos, comments, book listings, "I want it" requests; votes, event participation | Provide the features you use | Same as above |
| Reports you send and the moderation decisions on them | Keep the community safe; handle illegal or rule-breaking content | Legitimate interest (art. 6(1)(f)) and, where applicable, legal obligations under the EU Digital Services Act (art. 6(1)(c)) |
| Service emails (confirm your address, reset your password) | Provide what you requested | Contract / steps at your request (art. 6(1)(b)) |
| Session cookie `hub_sid` | Keep you logged in | Strictly necessary technical cookie (no consent needed under ePrivacy art. 5(3)) |
| Technical security data: short-lived in-memory request counters per IP address (minutes), and web server / proxy logs at the hosting provider (IP, time, request) | Protect against password guessing and abuse | Legitimate interest (art. 6(1)(f)) |
| `[IF ADDED LATER: subscription or payment data]` | `[purpose]` | `[basis]` |

We do **not** ask for date of birth, phone number, home address, or special categories of data (health, religion and so on). Please do not put them, or other people's personal data, in what you post. No photos where classmates or teachers can be recognised.

Giving us the sign-up data is optional, but without it we cannot create your account. We do **not** use automated decision-making or profiling that has legal or similarly significant effects on you.

**Cookies.** One strictly necessary first-party cookie, `hub_sid` (HttpOnly, SameSite=Lax, Secure on HTTPS, 14 days by default). No analytics, advertising or third-party cookies and no third-party requests; fonts are hosted on our server. See [COOKIE-POLICY.md](COOKIE-POLICY.md).

**Where the data comes from.** Directly from you. If another user posts something that mentions you, we may hold that content (art. 14); you can report it and we will assess removal.

## 4. Age and minors

You must be **at least 14 years old** to register on your own. In Italy, for online services offered directly to children, consent given by a child aged 14 or over is valid; below 14, consent of the person with parental responsibility is required (art. 2-quinquies of the Italian Privacy Code, implementing GDPR art. 8). `[If you accept users under 14 with parental consent, describe the process here; otherwise state that you do not.]` If you live in another EU country the age may be different: `[state how you handle this]`.

## 5. Who receives your data

- **Other users of your school community**: your first name and the initial of your surname next to what you post. Your full surname, email and class are not shown, except that the class of someone who asks for a book is visible to that book's seller, to arrange the hand-over at school.
- **School admins**: as described in section 2.
- **Service providers (processors, GDPR art. 28)**:
  - Hosting / server: `[HOSTING PROVIDER NAME, country/region of data centre]`
  - Email sending: `[EMAIL PROVIDER NAME, country]`
  - Backups: `[PROVIDER or "same as hosting"]`
  - `[Payment provider, only if you add paid plans]`
- Authorities, if the law requires or in serious cases to protect people (for example credible threats).
- We do **not** sell your data, and we do **not** use it for advertising.

**Transfers outside the EU/EEA.** `[None. All providers store and process data in the EU/EEA.]` If this changes, name the safeguard (adequacy decision, standard contractual clauses) and update this notice.

Hosted subscriptions, sponsorship or an optional book commission (if enabled) will not involve selling personal data. `[State here what each money flow involves in data terms, once decided.]`

## 6. How long we keep data

| Data | Retention |
|---|---|
| Account and content | Until you delete your account, or until **12 months after your last login**, then deleted automatically |
| Sign-ups never confirmed by email | **3 days** |
| Login sessions | **14 days** |
| Email confirmation / password reset links | 24 hours / 1 hour |
| Resolved reports | **90 days** |
| Web server / proxy logs | At most `[14]` days |
| Backups | At most **30 days**, then overwritten or deleted. If you delete your account, copies in backups disappear when those backups expire |
| `[Billing records, if ever added]` | `[as required by tax law, to be confirmed with an accountant]` |

## 7. Your rights

You can: access your data and get a copy, correct it, delete it, restrict its use, object to processing based on legitimate interest, receive your data in a portable format, and withdraw consent at any time (without affecting what happened before).

- **Download your data**: Profile → "Download my data"
- **Correct**: Profile → "Edit profile"
- **Delete**: Profile → "Delete my account" (removes the account and everything you posted, including photos)
- **Anything else**: write to `[PRIVACY CONTACT EMAIL]`. We answer within one month (extendable in complex cases, and we will tell you why).

**Complaint.** If you think we handle your data wrongly, you can complain to the Italian supervisory authority, the **Garante per la protezione dei dati personali** (Piazza Venezia 11, Rome; garanteprivacy.it) `[verify current contact details]`, or to the authority of the EU country where you live or work. You can also go to court.

## 8. Data breaches

If a breach is likely to put people at risk we will notify the Garante within 72 hours of becoming aware of it, and tell the people affected directly when the risk is high.

## 9. Moderation and reports (Digital Services Act)

Any user can report content with the "Report" button. Reports are reviewed by school admins and the operator. If we remove content or restrict an account we will tell you why and how to object (see [DSA.md](../DSA.md)). Reports and decisions are kept for the periods above.

## 10. Changes

When this notice changes materially we change the version number, update the date above, and tell you in the app. Previous versions: `[LINK OR "on request"]`.

---

## Operator checklist (delete before publishing)

- [ ] Fill in section 1 and every `[...]` placeholder; keep `.env` values (`TITOLARE_NOME`, `TITOLARE_CONTATTO`, `DPO_CONTATTO`, `VERSIONE_INFORMATIVA`) in line with this text and `privacy.html`.
- [ ] Decide and document the legal basis per purpose (consent vs contract), the controller/processor roles with schools, and whether a DPO is required.
- [ ] Sign DPAs (art. 28) with the hosting and email providers; see `gdpr/DPA-TEMPLATE.md`. Confirm data locations are in the EU/EEA.
- [ ] Make sure retention values in the `.env` match section 6 (3 days, 12 months, 14 days, 30 days) and that the 90-day purge of resolved reports and log retention are actually implemented.
- [ ] If the operator is a business with paid plans, add billing data, the payment provider and tax retention periods; revisit the cookie analysis.
- [ ] Have an Italian-language version reviewed: the in-app Italian text is the one most users will read.
- [ ] Related: [COOKIE-POLICY.md](COOKIE-POLICY.md), [../gdpr/GDPR.md](../gdpr/GDPR.md), [../gdpr/PROCESSING-REGISTER.md](../gdpr/PROCESSING-REGISTER.md), [../gdpr/DPIA.md](../gdpr/DPIA.md), [../DSA.md](../DSA.md).
