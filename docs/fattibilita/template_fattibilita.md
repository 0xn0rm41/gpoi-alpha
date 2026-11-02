# Feasibility study template (Studio di fattibilita) - Hub Studenti

How to use: copy this file per decision (e.g. "Move to own domain and host", "Offer hosted SaaS to schools"). Replace every `[...]`. Remove sections that do not apply, but write *why*. Keep to the evidence; cite sources and dates. Legal items are discussion checklists, **not legal advice**.

| Field | Value |
|---|---|
| Study title | `[e.g. Hub Studenti after the test: own domain, host and SaaS]` |
| Version / date | `[v0.1 - YYYY-MM-DD]` |
| Authors / reviewers | `[names or roles]` |
| Decision requested | `[what exactly will be decided and by whom]` |
| Options compared | `[Option 0: do nothing / stop; Option 1: ...; Option 2: ...]` |

## 1. Executive summary
Five lines: the problem, the options, the recommendation, the main risk, the main cost. Written last.

## 2. Context and objectives
- Problem and users (link to [market analysis](../analisi_mercato/README.md) findings and [requirements](requirements.md)).
- Objectives, each measurable (e.g. "N schools in pilot by `[date]`"; `[N]` is yours to set).
- Scope in / out; constraints (team capacity, exams, budget, age of team members).

## 3. Technical feasibility

| Question | Evidence / answer | Risk (L/M/H) |
|---|---|---|
| Does the current stack (Node.js, Express, SQLite) meet the expected load? | `[load test result / pilot data]` | |
| Single-server SQLite limit: when do we need another database or a replica? | `[threshold]` | |
| Multi-school isolation (data separation by school) verified and tested? | `[test reference]` | |
| Hosting plan (see [HOSTING.md](../HOSTING.md)): provider, region (EU), sizing, cost | `[...]` | |
| Backups, restore test, monitoring, incident process | `[...]` | |
| Email delivery (SMTP provider, deliverability, SPF/DKIM/DMARC) | `[...]` | |
| Security: vulnerability handling, dependency updates (see `docs/eu/cra/`) | `[...]` | |
| Storage of note photos (private uploads): growth, limits, moderation | `[...]` | |
| Team skills and bus factor (who maintains it when members graduate?) | `[...]` | |
| Technical debt / items to build before launch | `[...]` | |

Conclusion: `[feasible / feasible with conditions / not feasible]`.

## 4. Legal and regulatory feasibility

| Topic | Questions to settle | Owner | Status |
|---|---|---|---|
| Data controller / processor roles | Who is controller per school (school, or the platform operator)? Written agreement (GDPR art. 26/28)? | `[ ]` | `[ ]` |
| Legal entity | Team are students/minors: who legally runs the service and owns the domain and contracts? (adult, association, cooperative, company) | `[ ]` | `[ ]` |
| Minors' consent | Italy: 14+ may consent to online services; under 14 need parental consent. Process for verifying/handling it | `[ ]` | `[ ]` |
| Privacy notice, cookie policy, records of processing, DPIA | Up to date, in plain Italian (see `docs/eu/gdpr/`, `docs/eu/cookies/`) | `[ ]` | `[ ]` |
| Data transfers | EU hosting; sub-processors list | `[ ]` | `[ ]` |
| Content liability and moderation | Rules, report handling, removal times, user-generated photos (copyright of notes/book photos) | `[ ]` | `[ ]` |
| Book exchange | No payments through the platform today. If a commission is charged: payment services rules, tax/VAT, consumer rules - **needs professional advice** before activating | `[ ]` | `[ ]` |
| Open-source licensing | Move from the current MIT `LICENSE` to AGPL-3.0-or-later: relicensing is straightforward only if all authors agree; decide contribution policy (CLA/DCO) before external contributions; keep third-party licences compatible (fonts are OFL) | `[ ]` | `[ ]` |
| Dual / commercial licence | Terms for buyers who cannot comply with AGPL; trademark policy for the name | `[ ]` | `[ ]` |
| SaaS contract | Terms of service, DPA, SLA, liability cap, termination and data return | `[ ]` | `[ ]` |
| Cyber Resilience Act and related EU rules | Applicability to this product/commercial activity; vulnerability policy exists (`docs/eu/cra/`) | `[ ]` | `[ ]` |
| School rules | Authorisation by principal / school board; compatibility with school policies | `[ ]` | `[ ]` |
| Tax and accounting for revenue | Registration, invoicing, taxes | `[ ]` | `[ ]` |

Conclusion: `[no blockers / blockers with remedy / blocking]`.

## 5. Economic feasibility

1. **Costs.** One-off: domain, legal review, design, setup, hardware. Recurring: hosting, email service, backups, monitoring, insurance, accounting, support time (price your time even if volunteer, to know the true cost).
2. **Revenues** (only with evidence): SaaS subscriptions per school, commercial licences, support, commission on book sales (blocked until legal design exists), grants/sponsorship.
3. **Indicators:** compute break-even, payback, NPV, IRR with [ROI_Payback_VAL_TIR.md](ROI_Payback_VAL_TIR.md).
4. **Sensitivity:** vary price, number of schools, churn, costs +/- `[20]`%; show the best/base/worst case.

| Item | Year 0 | Year 1 | Year 2 | Year 3 | Source / status |
|---|---|---|---|---|---|
| Investment | `[ ]` | | | | |
| Revenue | | `[ ]` | `[ ]` | `[ ]` | `[evidence or ASSUMPTION]` |
| Operating costs | | `[ ]` | `[ ]` | `[ ]` | |
| Net cash flow | | | | | |

Conclusion: `[self-sustaining / needs funding / community project without revenue]`. A non-profit/community outcome is a valid result if stated.

## 6. Operational / organisational feasibility
- Roles: product owner, developers, support, privacy contact, school liaison; backup person for each.
- Support model: channels, response targets `[to set]`, hours per week (measure in pilot).
- Onboarding of a new school: steps, documents, time per school (see [requirements US-12](requirements.md#3-user-stories)).
- Moderation capacity and escalation to the school.
- Succession plan when team members graduate; documentation and handover.
- Dependencies on school staff.

## 7. Schedule feasibility
- Milestones and critical path in [template_gantt.xlsx](template_gantt.xlsx).
- Constraints: school calendar, exams, holidays, legal review lead times, domain/entity set-up lead times.
- Realistic buffer `[e.g. 20-30%]` (assumption).

## 8. Risk register

Score: likelihood (1-5) x impact (1-5). Review every `[2 weeks]`.

| ID | Risk | Category | L | I | Score | Mitigation | Contingency | Owner |
|---|---|---|---|---|---|---|---|---|
| R1 | Data breach or leak of student data | Security/legal | | | | Hardening, minimal data, incident plan | Notify authority within the legal term, inform users | |
| R2 | Inappropriate content / bullying | Safety | | | | Moderation, reporting, school liaison | Remove, escalate | |
| R3 | School refuses adoption | Market | | | | Documentation pack, pilot | Choose another pilot | |
| R4 | Key team member leaves | Organisation | | | | Docs, pairing | Reassign | |
| R5 | Legal entity/domain ownership unresolved | Legal | | | | Settle before purchase | Delay launch | |
| R6 | Free competitors dominate | Market | | | | Differentiate on privacy/organisation | Stay a community project | |
| R7 | SQLite/server limit reached | Technical | | | | Load test, thresholds | Migrate DB | |
| R8 | Licence conflict (MIT -> AGPL) | Legal | | | | Obtain all authors' consent | Keep current licence | |
| R9 | Revenue lower than costs | Economic | | | | Cost control, grants | Wind down / handover | |
| R10 | Hosting outage without backup | Technical | | | | Tested backups | Restore | |

## 9. Go / no-go decision

Criteria set **before** looking at results; every criterion needs a threshold and evidence link.

| Criterion | Threshold | Result | Pass? |
|---|---|---|---|
| Problem validated (interviews) | `[ ]` | | |
| Pilot activation | `[ ]` | | |
| Legal blockers resolved (entity, DPA, minors) | None open | | |
| Technical readiness (backup tested, security checks) | `[ ]` | | |
| Economics (payback or sustainable cost coverage) | `[ ]` | | |
| Team capacity | `[ ]` | | |

Decision: **GO / GO WITH CONDITIONS / NO-GO / PIVOT** - conditions: `[...]` - date: `[...]` - decided by: `[...]`.

## 10. Annexes
Evidence links, interview summaries (anonymised), competitor table, requirement list, cost sheets, Gantt, legal opinions.
