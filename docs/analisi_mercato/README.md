# Market analysis - Hub Studenti

This folder helps the team answer one question with evidence instead of enthusiasm:
**is there a real, reachable group of schools and students who need Hub Studenti enough to adopt it (and, for some, to pay for it)?**

> **Status & Language note:** The project is currently in **pilot** status. The project documentation is in English here, while the UI, code comments, schools, and users are Italian (Italian equivalents of key terms are given where useful). Legal documents are drafts that need review by a lawyer/DPO before real users—especially minors—are onboarded (see [docs/eu/README.md](../eu/README.md)).

## Contents

| File | What it is | Use it when |
|---|---|---|
| [THEORY.md](THEORY.md) | Short reference on the market-analysis models (TAM/SAM/SOM, PESTEL, Porter, SWOT, Value Proposition Canvas, JTBD, STP, competitor analysis, network effects) | You need to remember what a model is for, when it fits, and how people misuse it |
| [FRAMEWORKS.md](FRAMEWORKS.md) | Step-by-step templates, already filled with Hub Studenti **hypotheses** | You are about to actually do the work: size the market, interview students, compare competitors |

**Related documentation:**
* **Feasibility:** [docs/fattibilita/README.md](../fattibilita/README.md) (requirements, feasibility template, ROI/payback/NPV/IRR, Gantt template `.xlsx`)
* **Business & Finance:** [docs/economy_finance/README.md](../economy_finance/README.md) (business model, pricing, costs, licensing strategy, financial model `.xlsx`)
* **Project Management:** [docs/project_management/README.md](../project_management/README.md) (roadmap, risk register, process & ADRs, RACI, WBS)
* **Compliance & Privacy:** [docs/eu/README.md](../eu/README.md) (cookies, GDPR, CRA + DSA regulatory docs)

## The product in one paragraph

Hub Studenti is a multi-school web platform where every school gets its own private community. Students register with a **school invite/join code** and their own email, then use an event board, announcements, an idea board (ideas above a vote threshold become proposals), polls, shared notes (photos, votes, comments), and a second-hand book exchange (optional small commission, default 2%). Built on **Node.js + SQLite** (cross-platform on Linux, Windows, and macOS with no XAMPP or Apache/MySQL required), it is licensed under **AGPL-3.0-or-later**, with a commercial/dual license and a hosted SaaS service planned as revenue streams. Its privacy-by-design architecture—featuring per-school data isolation, GDPR export/rectification/erasure, automatic retention clean-up, a single technical cookie, and zero trackers—serves as a core differentiator for school adoption. See the [project README](../../README.md) and [HOSTING.md](../HOSTING.md).

## Ground rules for this folder

1. **No invented numbers.** Every figure must have a source (survey, interview, public statistic with link and date) or be labelled `ASSUMPTION - to validate`.
2. **Hypotheses are written to be falsified.** Each assumption gets a test and a kill/continue threshold *before* you collect data.
3. **Students are the users, schools are (usually) the buyers.** Analyse both; they have different needs, different technical/privacy requirements, and different decision speeds.
4. **Minors and data.** Surveys and interviews with under-18s need care: under Italian law a minor aged 14 or more can consent to online services, younger ones need a parent (see draft GDPR notes in `docs/eu/gdpr/`). For interviews with students, ask the school for authorisation and keep answers anonymous.
5. **Date everything.** Markets move; a note without a date is a rumour.

## Suggested workflow
