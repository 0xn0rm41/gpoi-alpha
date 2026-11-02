# Operational frameworks - Hub Studenti

Step-by-step templates. Every pre-filled value is a **hypothesis** marked `ASSUMPTION - to validate` (abbreviated **A-n** in the register). No market statistics are given here on purpose: collect them and cite source + date. Theory behind each tool: [THEORY.md](THEORY.md).

Contents: [1 Hypothesis register](#1-hypothesis-register) - [2 Market sizing](#2-market-sizing-template-tamsamsom) - [3 Interviews and survey](#3-interview-and-survey-plans) - [4 Competitor comparison](#4-competitor-comparison-table) - [5 Validation checklist](#5-validation-checklist) - [6 Canvas, JTBD, STP, SWOT worksheets](#6-short-worksheets)

---

## 1. Hypothesis register

Write assumptions first, then test them. Keep this table up to date; it is the spine of the analysis.

| ID | Hypothesis | Status | Test | Continue if... | Stop/pivot if... | Result (date) |
|---|---|---|---|---|---|---|
| A-1 | Students use unofficial group chats for events/notes/books and find them messy. `ASSUMPTION - to validate` | Open | 10 student interviews (section 3) | e.g. >= 7 of 10 describe a concrete recent problem | Few describe any problem | |
| A-2 | Students would register with a school code to get a single place for these things. `ASSUMPTION - to validate` | Open | Pilot registration rate in one class/school | Threshold set *before* the pilot (placeholder: 40% of invited in 2 weeks) | Far below threshold after a fair push | |
| A-3 | The idea board with a vote threshold gives student reps a legitimate channel to the school. `ASSUMPTION - to validate` | Open | Interview 3+ class/school reps and 2 teachers or the principal's delegate | Reps say they would use it for assembly agendas | Reps/teachers prefer existing channels | |
| A-4 | Schools will accept a student-run tool if privacy documentation is clear. `ASSUMPTION - to validate` | Open | Meet 3+ schools; ask what blocks adoption | Blockers are solvable (documents, DPA, hosting) | Blocker is structural (e.g. mandated platform only) | |
| A-5 | Some schools or associations would pay for hosted SaaS (support, uptime, no self-hosting). `ASSUMPTION - to validate` | Open | Ask for a letter of intent / price reaction in school meetings | At least some buyers name a budget line and approximate price | Everyone expects free | |
| A-6 | Book exchange creates enough volume for a small commission to matter. `ASSUMPTION - to validate` | Open | Count listings/requests in pilot; ask sellers about fees | Meaningful volume per school per season | Volume trivial -> treat as a free feature, not revenue | |
| A-7 | Open source (AGPL) is a trust advantage for privacy-minded schools. `ASSUMPTION - to validate` | Open | Ask in school meetings whether source availability matters | Raised as positive | Irrelevant to buyers (then do not market it as the headline) | |
| A-8 | A technically capable student team can run support for 1-3 schools without burnout. `ASSUMPTION - to validate` | Open | Track hours/week during pilot | Fits in agreed hours | Exceeds capacity | |

Rule: define "continue" and "stop" thresholds **before** the test. Changing them afterwards is a result in itself (confirmation bias).

---

## 2. Market sizing template (TAM/SAM/SOM)

Use **bottom-up**. Fill the *Source* column with a link and date; if you have none, write the cell as `ASSUMPTION - to validate`.

### 2.1 Buyer units

| Variable | Symbol | Value | Source / status |
|---|---|---|---|
| Number of upper-secondary schools in the geographic scope (Italy, region, province - choose) | N_schools | `[to fill]` | Official ministry/regional open data - cite link + date |
| Share that fits our target type (e.g. size, public/private, has IT referent) | f_fit | `[to fill]` | `ASSUMPTION - to validate` |
| Students per target school (average) | S | `[to fill]` | Same official data |
| Price per school per year for hosted SaaS | P | `[to fill]` | `ASSUMPTION - to validate` via school meetings |
| Share of reachable schools that could adopt within 3 years | a | `[to fill]` | `ASSUMPTION - to validate` (calibrate with pilot conversion) |

### 2.2 Formulas

```
TAM_schools  = N_schools x P                 (every school buys)
SAM_schools  = N_schools x f_fit x P         (schools we can serve: language, legal basis, type)
SOM_schools  = N_schools x f_fit x a x P     (what we capture in the chosen period)
```

Second revenue line (kept separate - different customer, different risk):

```
Commission_revenue = (book transactions per year) x (average price) x (commission rate)
```
Commission rate default in the product is 2%, but today it is only a displayed calculation; no payment passes through the platform. Treat any revenue from it as **blocked until payment/legal design exists**.

### 2.3 Sanity checks
- If SOM per year does not cover realistic yearly costs (hosting, domain, insurance/legal, your time) see [ROI_Payback_VAL_TIR.md](../fattibilita/ROI_Payback_VAL_TIR.md) - the project is a *community/impact* project, not a business, and that is a valid decision if stated openly.
- Reality-check top-down vs bottom-up; large gaps mean a wrong assumption.
- Re-run sizing after the pilot using measured numbers.

---

## 3. Interview and survey plans

Order: **interviews first** (learn the right questions), **survey second** (measure how common).

### 3.1 Ethics and legal pre-check (both)

- [ ] Ask the school (principal/delegate) for authorisation before approaching students on school premises.
- [ ] Under 14: parental consent needed in Italy; 14+ may consent themselves to online services, but for a school activity prefer informing parents too. Confirm wording with the school's DPO.
- [ ] Anonymous by default; no names in notes (use "S1, S2..."). Do not record audio without explicit consent.
- [ ] Say who you are, why you ask, how data is used, that participation is voluntary and can stop at any time.
- [ ] Store raw data outside the repository; delete when the analysis is done.

### 3.2 Interview plan

| Item | Plan |
|---|---|
| Goal | Test A-1, A-2, A-3, A-6; discover jobs, pains, current tools |
| Segments | Students (mixed years), class reps / student council, 2-3 teachers or school staff, 1+ school decision-maker |
| Sample | Placeholder: 8-12 students, 3-5 reps, 2-3 teachers, 1-3 decision-makers. `ASSUMPTION - to validate`; stop when new interviews stop surfacing new themes |
| Length | 20-30 minutes, semi-structured |
| Method | Ask about **past behaviour**, not future intentions |

**Student script (adapt):**
1. Warm-up: year, how you usually find out about school events/announcements.
2. "Tell me about the last time you needed class notes you did not have. What did you do?"
3. "Last time you wanted to buy/sell a textbook - walk me through it." (cost, trust, time)
4. "Have you ever had an idea for the school? What happened to it?"
5. "Which apps/groups do you use for school today? What annoys you about them?"
6. "What worries you about sharing things on a school platform?" (privacy, bullying, grades)
7. Only at the end, show a screen: "What would you expect to happen here?" (usability, not selling)

**Decision-maker script (adapt):**
1. How do you communicate with students today? Which platforms are mandatory?
2. Who decides on new digital tools; what documents are needed (privacy impact, DPA, security)?
3. Has a student-run initiative been adopted before? What made it work or fail?
4. What would make this a "no" immediately?
5. Is there a budget line for digital services? Who would pay and roughly how (ask for their reaction, do not state a price first).

**Analysis:** write each finding on a note; cluster; count how many interviewees mention each theme (counts of *your sample*, never extrapolated to "X% of students"); record quotes (anonymised); update the register in section 1.

### 3.3 Survey plan

| Item | Plan |
|---|---|
| Goal | Measure prevalence of the pains/behaviours found in interviews; size the pilot |
| Tool | Any GDPR-compliant form tool or a self-hosted form; no mandatory personal data |
| Length | <= 10 questions, <= 3 minutes |
| Sample | As many as the school allows; report the **response count and who answered**, and say it is not a representative sample unless you designed it to be |
| Timing | Avoid exam weeks |

**Question bank (pick what the interviews justify):**

| # | Question | Type | Tests |
|---|---|---|---|
| 1 | Year of study | Single choice | Segment |
| 2 | How do you currently find out about school events? | Multi-choice + other | A-1 |
| 3 | How often did you miss an event/announcement in the last month? | Scale | A-1 |
| 4 | Have you bought or sold a used textbook this school year? Where? | Single choice | A-6 |
| 5 | How do you share/obtain notes today? | Multi-choice | A-1 |
| 6 | Have you ever proposed an idea to the school? Did you get an answer? | Single choice | A-3 |
| 7 | How interested would you be in a single school site for these things? | 5-point scale | A-2 |
| 8 | What would stop you registering? | Multi-choice (privacy, effort, "nobody will use it", other) | A-2 |
| 9 | Would you accept a small fee on book sales (e.g. 2%)? | Single choice | A-6 |
| 10 | Anything else? | Free text | Discovery |

Pitfalls: leading questions, "would you use" optimism (stated interest overstates real adoption - the pilot is the real test), double-barrelled questions.

---

## 4. Competitor comparison table

Fill one column per competitor from **public sources** (website, store listing, pricing page, documentation). Record URL and date in the last two rows. Leave `?` if unknown; do not guess.

**Candidates to evaluate (categories, to be researched - not yet verified):**
- Informal substitutes: class messaging groups, social media pages, paper notice boards, shared cloud drives.
- School-provided platforms: electronic register, school portal, school learning-management or workspace suite.
- Dedicated student apps / note-sharing / book-resale marketplaces / school-community apps (find actual names by searching; list them here once verified).
- Generic polling/forms/event tools.

| Criterion | Hub Studenti | Competitor 1: ____ | Competitor 2: ____ | Competitor 3: ____ | Substitute: messaging group |
|---|---|---|---|---|---|
| Type (direct / indirect / substitute) | - | | | | substitute |
| Target buyer (school / student / none) | school (SaaS) + students (users) | | | | none |
| Events | yes | | | | partial |
| Announcements (official, by reps) | yes | | | | mixed with chat |
| Idea board -> proposal by vote threshold | yes | | | | no |
| Polls | yes | | | | partial |
| Shared notes (photos, votes, comments) | yes | | | | files, unorganised |
| Second-hand book exchange | yes | | | | ad hoc |
| Multi-school support | yes (join code) | | | | n/a |
| Registration needs own email + school code | yes | | | | phone number/account |
| Privacy: hosting location, GDPR docs, data deletion/export | EU-hostable; export/delete built in | | | | platform-dependent |
| Source code available | yes (planned AGPL-3.0-or-later) | | | | no |
| Pricing | free self-host; hosted price TBD (`ASSUMPTION - to validate`) | | | | free |
| Mobile app | web only (today) | | | | yes |
| Known weaknesses (from reviews/forums) | `[to fill]` | | | | |
| Switching cost for a student | | | | | very low to stay |
| Source URL | - | | | | |
| Date checked | - | | | | |

**Reading the table:** (1) which jobs does nobody serve well? (2) where are we *worse* (e.g. no mobile app, no brand) and does it matter for the first segment? (3) what is our single clearest differentiator that a school decision-maker values?

---

## 5. Validation checklist

Go through before deciding to invest more time or money. Tick only with evidence; link it.

**Problem**
- [ ] At least N students (set N, placeholder 8-12) described the problem from real recent experience
- [ ] Current alternatives and their pain are documented
- [ ] A named segment feels the pain most (beachhead chosen)

**Solution**
- [ ] Top 3 jobs mapped to features; features that map to no job are listed for removal or deferral
- [ ] Pilot users completed the core task without help
- [ ] Core features beyond the pilot's first month are still used (retention measured)

**Market**
- [ ] SAM computed bottom-up with cited sources
- [ ] Competitor table filled from sources, dated
- [ ] Network effect strategy per school written (seed content, target activation)

**Buyer**
- [ ] At least 3 school decision-makers interviewed
- [ ] Blockers listed (privacy impact assessment, DPA, mandated platforms)
- [ ] At least one written expression of interest (letter of intent / pilot agreement)

**Legal and trust** (details in the feasibility study)
- [ ] Privacy notice, legal bases and minors' consent reviewed by a qualified person
- [ ] Hosting in the EU, data-processing agreements in place
- [ ] Licence plan (AGPL + commercial) checked; contributors' rights (CLA or equivalent) decided *before* accepting outside contributions
- [ ] Rules on student-run service, liability and the future owner of the domain (adult/association) settled

**Business**
- [ ] Price tested in conversations, not only guessed
- [ ] Break-even and payback computed with the template ([ROI_Payback_VAL_TIR.md](../fattibilita/ROI_Payback_VAL_TIR.md))
- [ ] Team capacity checked against support hours

**Decision:** Continue / Pivot (what changes) / Stop (and keep open source as community project). Record date, decision and who agreed.

---

## 6. Short worksheets

### 6.1 Value Proposition Canvas (one per segment)

| Customer profile: Student | Value map |
|---|---|
| **Jobs:** know what is happening at school; get notes after absence; find affordable textbooks; be heard by the school (`ASSUMPTION - to validate`) | **Products:** events, announcements, notes, book exchange, idea board, polls |
| **Pains:** scattered info in chats; notes are unorganised; buying new books is costly; ideas get lost (`ASSUMPTION - to validate`) | **Pain relievers:** one place per school; searchable notes with votes; peer exchange; votes make ideas visible |
| **Gains:** feel part of school life; save money; look prepared (`ASSUMPTION - to validate`) | **Gain creators:** transparency of proposals; reputation through useful notes |

Repeat for: class rep, teacher/staff, school decision-maker (buyer), parent (indirect).

### 6.2 JTBD statements (hypotheses)

- When I miss a lesson, I want to find good notes quickly, so I can catch up without asking around. `ASSUMPTION - to validate`
- When a new school year starts, I want to get my textbooks cheaply from a trusted peer, so I spend less. `ASSUMPTION - to validate`
- When I have an idea to improve school life, I want to know if others support it, so I can bring it to the assembly with proof. `ASSUMPTION - to validate`
- (Buyer) When students want to organise themselves, I want a tool that respects privacy and needs little IT effort, so I can approve it without risk. `ASSUMPTION - to validate`

### 6.3 STP draft

| Step | Draft (all to be validated) |
|---|---|
| Segmentation | By school type and size, by IT readiness (has referent?), by student-body engagement (active council?), by region/language |
| Targeting (beachhead) | Schools with an active student council and a supportive teacher referent, close enough to support in person. `ASSUMPTION - to validate` |
| Positioning | *For student councils and school leadership who need a safe, simple space for school life, Hub Studenti is an open-source, EU-hostable student platform that combines events, ideas, polls, notes and book exchange in one place. Unlike generic chat groups, it is organised, moderated and privacy-by-design.* |

### 6.4 SWOT with TOWS actions (starter)

| | Helps | Hurts |
|---|---|---|
| **Internal** | **S:** working product with GDPR features (export/delete), simple self-hosting (Node + SQLite), open code | **W:** student team capacity, no brand, single-server SQLite architecture, web-only |
| **External** | **O:** schools seeking privacy-respecting tools; student councils needing a voice; EU data-protection focus | **T:** free incumbents, school-mandated platforms, legal/liability concerns with minors, copycat hosting of open code |

TOWS actions (examples): S+O -> lead pilot pitch with privacy documentation; W+T -> limit to 1-3 schools until support load is known; S+T -> keep commercial/hosted value in support, SLA and managed compliance, not in the code alone. All `ASSUMPTION - to validate`.
