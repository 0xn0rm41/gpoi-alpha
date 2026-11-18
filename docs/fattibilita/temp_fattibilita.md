# Temporary Feasibility study (Studio di fattibilità) - Hub Studenti

| **Field** | **Value** |
|---|---|
| Study title | Hub Studenti – Technical, Legal and Economic Feasibility Study |
| Version / date | v1.0 – 2026-11-15 |
| Authors / reviewers | Hub Studenti Project Team |
| Decision requested | Evaluate the feasibility of continuing the pilot and preparing Hub Studenti for adoption by schools and future hosted SaaS operation. |
| Options compared | Option 0: Keep the project as a local open-source pilot. Option 1: Continue development and run a controlled school pilot. Option 2: Develop a hosted SaaS service and offer commercial licensing. |

## 1. Executive summary

Hub Studenti is an open-source student platform designed for schools, offering an event board, idea voting, polls, shared notes and a second-hand book exchange.

The project uses Node.js, Express and SQLite, supports Linux, Windows and macOS, and provides separate private communities for each school through invite codes.

The recommendation is to continue the pilot, validate the technical and organisational aspects, and prepare the project for a controlled school pilot.

The main risks concern GDPR compliance, the processing of minors' data, security, hosting reliability and the legal responsibilities of the project team.

The main costs will involve hosting, email delivery, backups, monitoring, legal review and ongoing maintenance.

## 2. Context and objectives

- **Problem and users:** Hub Studenti aims to provide schools and students with a single digital platform for school events, ideas, polls, shared notes and second-hand book exchanges. Each school has its own private community, accessible through an invitation code. Users register using their own email addresses. The project is documented in the market analysis and requirements documents.
- **Objectives, each measurable:**
  - Complete the pilot and verify all main features.
  - Test the platform with at least one school.
  - Verify the separation of school data.
  - Validate installation on Linux, Windows and macOS.
  - Evaluate the possibility of introducing a hosted SaaS service.
  - Develop a sustainable commercial licensing model.
- **Scope in / out; constraints:** The project includes the five main platform features, user registration, school invitation codes, administration tools and database management. Payment processing and commissions on book exchanges are not included in the current project description. Main constraints include team availability, possible legal limitations for underage team members, hosting costs and GDPR requirements.

## 3. Technical feasibility

| **Question** | **Evidence / answer** | **Risk (L/M/H)** |
|---|---|---|
| Does the current stack (Node.js, Express, SQLite) meet the expected load? | The current stack is suitable for the pilot. Load testing is required before a multi-school deployment. | M |
| Single-server SQLite limit: when do we need another database or a replica? | SQLite is currently used. A migration should be considered if concurrent usage, database size or write operations exceed tested limits. | M |
| Multi-school isolation (data separation by school) verified and tested? | The README reports that per-school data isolation has been tested. Further testing is recommended before production deployment. | M |
| Hosting plan (see [HOSTING.md](https://github.com/0xn0rm41/gpoi-alpha/blob/main/docs/HOSTING.md)): provider, region (EU), sizing, cost | Hosting instructions are documented in `docs/HOSTING.md`. An EU hosting provider, server configuration and costs still need to be selected. | H |
| Backups, restore test, monitoring, incident process | The project includes `npm run backup`. Restore testing, monitoring and an incident-response procedure must be verified. | M |
| Email delivery (SMTP provider, deliverability, SPF/DKIM/DMARC) | Email confirmation is supported. Without SMTP configuration, confirmation links are printed in the server console. A production SMTP provider must be configured. | M |
| Security: vulnerability handling, dependency updates (see `docs/eu/cra/`) | The project includes scrypt password hashing, hashed session and email tokens, HttpOnly cookies, CSRF protection, strict CSP, rate limits, Dependabot and a vulnerability policy. | M |
| Storage of note photos (private uploads): growth, limits, moderation | Private photo serving is implemented according to the README. Storage limits, growth, retention and moderation procedures need verification. | M |
| Team skills and bus factor (who maintains it when members graduate?) | The project includes documentation, contribution guidelines, GitHub templates and project-management documentation. Primary and backup maintainers must be identified. | M |
| Technical debt / items to build before launch | Production hosting, SMTP configuration, monitoring, restore testing, security verification and production deployment procedures must be completed. | M |

**Conclusion:** Feasible with conditions.

## 4. Legal and regulatory feasibility

| **Topic** | **Questions to settle** | **Owner** | **Status** |
|---|---|---|---|
| Data controller / processor roles | Who is controller per school (school, or the platform operator)? Written agreement (GDPR art. 26/28)? | Project team / DPO | To be reviewed |
| Legal entity | Team are students/minors: who legally runs the service and owns the domain and contracts? (adult, association, cooperative, company) | Project team / legal advisor | Open |
| Minors' consent | Italy: 14+ may consent to online services; under 14 need parental consent. Process for verifying/handling it | DPO / legal advisor | To be reviewed |
| Privacy notice, cookie policy, records of processing, DPIA | Up to date, in plain Italian (see `docs/eu/gdpr/`, `docs/eu/cookies/`) | DPO / project team | Draft completed, review pending |
| Data transfers | EU hosting; sub-processors list | Technical team / DPO | Open |
| Content liability and moderation | Rules, report handling, removal times, user-generated photos (copyright of notes/book photos) | Project team / school representatives | Open |
| Book exchange | No payments through the platform today. If a commission is charged: payment services rules, tax/VAT, consumer rules - **needs professional advice** before activating | Project team / legal advisor | No payments currently planned |
| Open-source licensing | Move from the current MIT `LICENSE` to AGPL-3.0-or-later: relicensing is straightforward only if all authors agree; decide contribution policy (CLA/DCO) before external contributions; keep third-party licences compatible (fonts are OFL) | Project team | Current licence identified as AGPL-3.0-or-later in README; verify `LICENSE` and contributor rights |
| Dual / commercial licence | Terms for buyers who cannot comply with AGPL; trademark policy for the name | Project team / legal advisor | Planned |
| SaaS contract | Terms of service, DPA, SLA, liability cap, termination and data return | Project team / legal advisor | Not completed |
| Cyber Resilience Act and related EU rules | Applicability to this product/commercial activity; vulnerability policy exists (`docs/eu/cra/`) | Project team / legal advisor | To be reviewed |
| School rules | Authorisation by principal / school board; compatibility with school policies | School representatives | Open |
| Tax and accounting for revenue | Registration, invoicing, taxes | Legal entity / accountant | Open |

**Conclusion:** Blockers with remedy.

## 5. Economic feasibility

1. **Costs.** One-off: domain registration, legal review, security review and initial setup. Recurring: hosting, email service, backups, monitoring, storage, accounting and maintenance. The main technical costs will depend on the selected hosting and email providers.
2. **Revenues** (only with evidence): Planned revenue sources include hosted SaaS subscriptions for schools and commercial licences. Additional possibilities include grants and sponsorships. No confirmed revenue or paying schools are currently documented. Book-exchange commissions are excluded from the current model.
3. **Indicators:** Compute break-even, payback, NPV, IRR with [ROI_Payback_VAL_TIR.md](https://github.com/0xn0rm41/gpoi-alpha/blob/main/docs/fattibilita/ROI_Payback_VAL_TIR.md).
4. **Sensitivity:** Vary price, number of schools, churn, costs +/- 20%; show the best/base/worst case.

| **Item** | **Year 0** | **Year 1** | **Year 2** | **Year 3** | **Source / status** |
|---|---|---|---|---|---|
| Investment | Initial development and setup costs – TBD | — | — | — | Estimated project costs |
| Revenue | — | TBD | TBD | TBD | ASSUMPTION – SaaS subscriptions and commercial licences |
| Operating costs | — | TBD | TBD | TBD | Hosting, SMTP, backups, monitoring and maintenance |
| Net cash flow | TBD | TBD | TBD | TBD | Revenue minus operating costs and investments |

**Conclusion:** Needs funding.

## 6. Operational / organisational feasibility

- Roles: Product owner, backend developers, frontend developers, database administrator, technical support, privacy contact and school liaison; backup person for each.
- Support model: Technical support for registration, invitation codes, account access and platform functionality. Initial response target: within two school days, subject to available team capacity.
- Onboarding of a new school: Obtain school approval, create the school through the administration CLI, generate an invitation code, promote the school representative to administrator, distribute instructions and verify registration.
- Moderation capacity and escalation to the school: Establish procedures for reporting inappropriate content, bullying, copyright complaints and privacy issues. Serious reports must be escalated to the authorised school representative.
- Succession plan when team members graduate: Maintain technical documentation, GitHub repositories, contribution guidelines, database documentation and deployment instructions. Ensure at least two people understand critical components.
- Dependencies on school staff: School representatives must authorise participation, distribute invitation codes, support onboarding and coordinate moderation and privacy responsibilities.

## 7. Schedule feasibility

- Milestones and critical path in [template_gantt.xlsx](https://github.com/0xn0rm41/gpoi-alpha/blob/main/docs/fattibilita/template_gantt.xlsx).
- Constraints: School calendar, exams, holidays, legal review lead times, domain registration, hosting configuration and availability of school representatives.
- Realistic buffer: 20–30% (planning assumption).

## 8. Risk register

Score: likelihood (1-5) x impact (1-5). Review every 2 weeks.

| **ID** | **Risk** | **Category** | **L** | **I** | **Score** | **Mitigation** | **Contingency** | **Owner** |
|---|---|---|---:|---:|---:|---|---|---|
| R1 | Data breach or leak of student data | Security/legal | 3 | 5 | 15 | Security testing, minimal data collection, school isolation and incident procedures | Suspend affected service, investigate and follow legal notification procedures | Technical team |
| R2 | Inappropriate content / bullying | Safety | 3 | 4 | 12 | Moderation rules, reporting system and school liaison | Remove content and escalate to school representatives | Moderation team |
| R3 | School refuses adoption | Market | 3 | 3 | 9 | Interviews, demonstrations and controlled pilot | Choose another school or continue as an open-source project | Product owner |
| R4 | Key team member leaves | Organisation | 3 | 4 | 12 | Documentation, code reviews and shared responsibilities | Reassign responsibilities to backup maintainers | Project team |
| R5 | Legal entity/domain ownership unresolved | Legal | 4 | 5 | 20 | Resolve legal ownership and operating responsibilities before purchasing services | Delay production launch | Project team |
| R6 | Free competitors dominate | Market | 3 | 3 | 9 | Differentiate through school-specific communities, privacy and integrated features | Continue as a community/open-source project | Product owner |
| R7 | SQLite/server limit reached | Technical | 3 | 4 | 12 | Load tests, monitoring and documented thresholds | Migrate database or increase infrastructure capacity | Backend team |
| R8 | Licence conflict (MIT -> AGPL) | Legal | 2 | 4 | 8 | Verify contributor rights and third-party licence compatibility | Keep AGPL licensing and postpone commercial licensing | Project team |
| R9 | Revenue lower than costs | Economic | 3 | 4 | 12 | Control expenses, validate demand and evaluate grants | Reduce costs or continue without commercial operation | Project team |
| R10 | Hosting outage without backup | Technical | 3 | 5 | 15 | Automated backups, restore tests and monitoring | Restore from the latest verified backup | Technical team |

## 9. Go / no-go decision

Criteria set **before** looking at results; every criterion needs a threshold and evidence link.

| **Criterion** | **Threshold** | **Result** | **Pass?** |
|---|---|---|---|
| Problem validated (interviews) | At least 5 school representatives interviewed | Not yet documented | No |
| Pilot activation | At least 1 school successfully completes a controlled pilot | Pilot stage; school activation evidence not supplied | Pending |
| Legal blockers resolved (entity, DPA, minors) | None open | Legal documents are drafts and require professional review | No |
| Technical readiness (backup tested, security checks) | Backup restoration and security tests successfully completed | Backup command exists; test evidence not supplied | Pending |
| Economics (payback or sustainable cost coverage) | Financial model demonstrates sustainable costs or funding | No verified revenue or complete cost model | No |
| Team capacity | Primary and backup maintainers identified for critical responsibilities | Documentation exists; role assignments not supplied | Pending |

Decision: **GO WITH CONDITIONS** for continued pilot development.

Conditions: Complete legal and privacy review, verify security and school data isolation, configure production SMTP, test backup restoration, select hosting provider, calculate operating costs, assign operational responsibilities and obtain school approval before onboarding real students.

Date: 2026-11-15.

Decided by: Hub Studenti Project Team.

## 10. Annexes

Evidence links, interview summaries (anonymised), competitor table, requirement list, cost sheets, Gantt, legal opinions.

Additional project documentation:
- `README.md` – Project overview, technology, features and installation instructions.
- `docs/HOSTING.md` – Hosting and deployment documentation.
- `docs/DATABASE.md` – Database schema, migrations and backups.
- `docs/eu/` – GDPR, cookies, CRA and DSA documentation.
- `docs/economy_finance/` – Business model, pricing, costs and financial model.
- `docs/analisi_mercato/` – Market analysis and research.
- `docs/fattibilita/` – Requirements, feasibility documentation, ROI and Gantt.
- `docs/project_management/` – Roadmap, risk register, process documentation, ADRs, RACI and WBS.
- `docs/github/` – GitHub templates and contribution guidance.
- `CONTRIBUTING.md` – Contribution instructions.
- `LICENSE` – GNU AGPL-3.0-or-later licence.
- Automated test results, school interview summaries, technical test reports and supplier quotations – to be collected during the pilot.
