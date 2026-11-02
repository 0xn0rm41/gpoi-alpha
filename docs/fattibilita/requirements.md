# Requirements gathering framework

How to turn "what students and schools want" into a short, testable, prioritised list - and keep the link between a need and the thing you built. Applied to Hub Studenti throughout; replace example rows with real findings.

Contents: [1 Stakeholders](#1-stakeholders) - [2 Elicitation](#2-elicitation-techniques) - [3 User stories](#3-user-stories) - [4 MoSCoW](#4-moscow-prioritisation) - [5 Acceptance criteria](#5-acceptance-criteria) - [6 Non-functional](#6-non-functional-requirements) - [7 Traceability](#7-traceability-matrix) - [8 Process](#8-process-and-quality-checks)

---

## 1. Stakeholders

Identify everyone affected or with power over the outcome; then decide how to involve each.

| Stakeholder | Interest | Influence | Involve by | Notes |
|---|---|---|---|---|
| Students (users) | Useful, safe, simple tool | Adoption decides success | Interviews, survey, pilot feedback | Includes minors; 14+ consent rule in Italy |
| Class reps / student council | Voice, organisation | High for adoption | Workshops, early access | Likely the first admins |
| Teachers / referent | Low workload, no incidents | Medium-high | Interviews | Potential sponsor |
| Principal / school board | Compliance, reputation, safety | Decides on adoption | Meetings, documentation pack | Buyer in SaaS scenario |
| Parents | Child's data safety | Indirect, can block | Information note | |
| School DPO / data controller | GDPR compliance | Can veto | Review of privacy documents | Role definition to be agreed per school |
| Development team (students) | Learning, sustainability | High | Planning | Capacity-limited |
| Hosting/email providers | Contract terms | Low | DPA review | EU datacentre preferred |
| Contributors (open source) | Contribution rules | Medium | Contribution guide | Licence/CLA decision needed |
| Regulators (Garante privacy) | Compliance | Enforcement | Follow guidance | |

Technique: place each on a power/interest grid; manage high-high closely, keep high-power/low-interest informed.

## 2. Elicitation techniques

| Technique | Good for | Hub Studenti use | Watch out |
|---|---|---|---|
| Interviews | Deep needs, context | Students, reps, decision-makers (see [../analisi_mercato/FRAMEWORKS.md](../analisi_mercato/FRAMEWORKS.md#3-interview-and-survey-plans)) | Interviewer bias; ask about past, not hypothetical |
| Surveys | Measuring prevalence | Priorities per feature | Self-reported, not representative by default |
| Observation | What people actually do | Watch how a class shares info today | Needs permission |
| Workshops | Consensus, quick prioritisation | Council session: dot-voting on features | Loudest voice wins |
| Prototype / pilot | Concrete feedback | Test phase in the school | Users critique the prototype, not the need |
| Document analysis | Constraints | School regulations, privacy docs, existing digital tools | May be outdated |
| Analytics from the pilot | Real behaviour | Which sections are used (respect privacy; aggregate only) | Privacy: collect minimum, document in the GDPR register |
| Issue tracker / feedback form | Continuous input | Bug and idea reports | Triage regularly |

## 3. User stories

Format: **As a** [role], **I want** [capability], **so that** [benefit]. Each story must be small enough for one iteration and testable (INVEST: Independent, Negotiable, Valuable, Estimable, Small, Testable). Give each a stable ID.

**Applied example (derived from the product as documented; priorities are hypotheses `ASSUMPTION - to validate`):**

| ID | Story |
|---|---|
| US-01 | As a student, I want to register with my school's join code and my own email, so that I only see my school's content. |
| US-02 | As a student, I want to confirm my email and reset my password, so that my account is secure. |
| US-03 | As a student, I want to see upcoming events with search and filters, so that I do not miss them. |
| US-04 | As a class rep (admin), I want to publish events and announcements, so that official information is in one place. |
| US-05 | As a student, I want to propose an idea and support others' ideas once each, so that popular ideas become visible. |
| US-06 | As a student rep, I want ideas that cross the vote threshold flagged as proposals, so that I can bring them to the assembly. |
| US-07 | As a student, I want to vote in polls and change my vote, so that my opinion counts. |
| US-08 | As a student, I want to upload note photos with an explanation and see votes/comments, so that the best notes surface. |
| US-09 | As a student, I want to list a book for sale or gift and accept or refuse requests, so that I can exchange books safely. |
| US-10 | As a student, I want to download my data and delete my account, so that I control my personal data (GDPR). |
| US-11 | As an admin, I want to handle reports of inappropriate content, so that the space stays safe. |
| US-12 | As a school administrator, I want to onboard my school with a join code and settings, so that students can join without manual work. |
| US-13 | As a platform operator, I want backups and monitoring, so that data is not lost. |
| US-14 | As a school decision-maker, I want clear privacy documents and a data-processing agreement, so that I can approve the service. |

## 4. MoSCoW prioritisation

**M**ust (without it the release is useless or illegal), **S**hould (important, workaround exists), **C**ould (nice to have), **W**on't (this time, recorded explicitly).

Rule of thumb: keep Must below roughly half of the effort so there is room for the unexpected (team convention, tune it).

| Priority | Stories / items (example, to validate with stakeholders) | Rationale |
|---|---|---|
| Must | US-01, US-02, US-03, US-04, US-10, US-11, US-13, US-14 | Access, core information flow, GDPR rights, moderation, data safety, adoption blocker |
| Should | US-05, US-06, US-07, US-12 | Differentiators (idea board) and scalability to more schools |
| Could | US-08, US-09 | Valuable but with higher moderation/legal load (photos, sales); can follow once the base is stable |
| Won't (now) | In-platform payments, native mobile app, integration with electronic register, push notifications | Out of scope until evidence of demand and legal design (payments) |

Note the tension: US-08 and US-09 may be the most attractive to students (A-1, A-6 in the market hypothesis register) yet carry the most risk. Decide with evidence, not taste.

## 5. Acceptance criteria

Use Given/When/Then; each criterion must be verifiable by someone who did not write the code. Where possible, link to an automated test (`npm test`) or a manual test case ID.

| Story | Acceptance criteria (examples) |
|---|---|
| US-01 | Given a valid join code and unused email, when the student submits the form, then an account is created pending confirmation. Given an invalid code, then registration is refused with a clear message and no account exists. |
| US-05 | Given a logged-in student, when they support an idea, then the count rises by one; a second attempt by the same student does not change the count; withdrawing is possible (if specified). |
| US-06 | Given a threshold of N (configurable), when support reaches N, then the idea is shown as a proposal to admins. |
| US-09 | Given a book listing, when another student presses "I want it", then the seller sees the request and can accept or refuse; no payment is taken by the platform. |
| US-10 | Given a logged-in user, when they request an export, then they receive their data in a readable format; when they delete the account, then personal data is removed or anonymised as documented in the GDPR register, and they cannot log in. |
| US-11 | Given a reported item, when an admin reviews it, then they can hide/remove it and the reporter's identity is not shown to the author. |

Definition of done (team): code reviewed, tests pass, acceptance criteria checked, docs updated, privacy impact considered.

## 6. Non-functional requirements

Do not forget these; they decide success as much as features. Targets below are **placeholders - set your own**.

| Category | Requirement (example) | Target |
|---|---|---|
| Privacy / GDPR | Data minimisation, export and deletion, EU hosting, DPA with providers | Documented in `docs/eu/gdpr/` |
| Security | Hashed passwords, CSRF protection, rate limiting, HTTPS, vulnerability policy | Per `docs/eu/cra/` |
| Availability | Acceptable downtime for a school service | `[to set]` |
| Performance | Page response under normal class-size load | `[to set]`, measure in pilot |
| Backup/restore | Regular backups, restore tested | Frequency `[to set]` |
| Accessibility | Usable with keyboard/screen reader | Aim for WCAG 2.1 AA (to audit) |
| Maintainability | Tests, documentation, simple deployment | `npm test` green |
| Scalability | SQLite single-instance limit | Re-evaluate beyond a few schools |
| Licensing | AGPL source offer for hosted modifications | Link to source in the UI footer |

## 7. Traceability matrix

Links **need -> requirement -> design/code -> test -> status**. Use it to find requirements with no test, features with no need, and the impact of a change.

| Need / source | Requirement | Priority | Implemented in (module/PR) | Test (ID/file) | Status |
|---|---|---|---|---|---|
| Interview theme T1 (to fill) | US-03 events with search | Must | `[to fill]` | `[to fill]` | Draft |
| GDPR art. 15/17/20 | US-10 export/delete | Must | `[to fill]` | `[to fill]` | Draft |
| Hypothesis A-3 (idea board) | US-05, US-06 | Should | `[to fill]` | `[to fill]` | Draft |
| Hypothesis A-6 (book volume) | US-09 | Could | `[to fill]` | `[to fill]` | Draft |
| Buyer blocker (privacy docs) | US-14 | Must | docs | review checklist | Draft |

Maintenance: update on every merged change; review before each release; keep IDs stable (never reuse).

## 8. Process and quality checks

1. List stakeholders -> plan elicitation.
2. Collect raw needs; write them in the users' words.
3. Convert to stories; remove duplicates; split big ones.
4. Prioritise with MoSCoW in a workshop with reps and the team.
5. Write acceptance criteria and non-functional targets.
6. Review: each requirement is **necessary, unambiguous, testable, feasible, traceable**. Words like "fast", "easy", "secure" without a measure are defects.
7. Baseline the list; handle changes through a simple change log (date, who, why).
8. Feed the Must list into the [feasibility study](template_fattibilita.md) and the plan ([template_gantt.xlsx](template_gantt.xlsx)).
