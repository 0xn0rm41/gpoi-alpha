# Market analysis - Hub Studenti

This folder helps the team answer one question with evidence instead of enthusiasm:
**is there a real, reachable group of schools and students who need Hub Studenti enough to adopt it (and, for some, to pay for it)?**

> Language note: the project documentation is in English here; the product, the schools and the users are Italian. Italian equivalents of key terms are given where useful.

## Contents

| File | What it is | Use it when |
|---|---|---|
| [THEORY.md](THEORY.md) | Short reference on the market-analysis models (TAM/SAM/SOM, PESTEL, Porter, SWOT, Value Proposition Canvas, JTBD, STP, competitor analysis, network effects) | You need to remember what a model is for, when it fits, and how people misuse it |
| [FRAMEWORKS.md](FRAMEWORKS.md) | Step-by-step templates, already filled with Hub Studenti **hypotheses** | You are about to actually do the work: size the market, interview students, compare competitors |

Related: [feasibility study folder](../fattibilita/README.md) (requirements, feasibility template, ROI/NPV/IRR, Gantt).

## The product in one paragraph

Hub Studenti is a multi-school web platform. Students register with a **school join code** and their own email, then use events, announcements, an idea board (ideas above a vote threshold become proposals), polls, shared notes (photos, votes, comments) and a second-hand book exchange (optional small commission, default 2%). It is planned as AGPL-3.0-or-later open source, with a commercial/dual license and a hosted SaaS offer as revenue. See the [project README](../../README.md) and [HOSTING.md](../HOSTING.md).

## Ground rules for this folder

1. **No invented numbers.** Every figure must have a source (survey, interview, public statistic with link and date) or be labelled `ASSUMPTION - to validate`.
2. **Hypotheses are written to be falsified.** Each assumption gets a test and a kill/continue threshold *before* you collect data.
3. **Students are the users, schools are (usually) the buyers.** Analyse both; they have different needs and different decision speeds.
4. **Minors and data.** Surveys and interviews with under-18s need care: under Italian law a minor aged 14 or more can consent to online services, younger ones need a parent (see GDPR notes in `docs/eu/gdpr/`). For interviews with students, ask the school for authorisation and keep answers anonymous.
5. **Date everything.** Markets move; a note without a date is a rumour.

## Suggested workflow

```
1. THEORY.md  -> pick the 3-4 models that fit your current question (do not use all)
2. FRAMEWORKS.md section 1 -> write assumptions (hypothesis register)
3. FRAMEWORKS.md sections 2-3 -> run interviews first, then the survey
4. FRAMEWORKS.md section 4 -> competitor table (desk research)
5. FRAMEWORKS.md section 5 -> validation checklist: continue / pivot / stop
6. Feed the results into ../fattibilita/template_fattibilita.md and ../fattibilita/ROI_Payback_VAL_TIR.md
```

## Keeping evidence

Suggested (not yet created) subfolders when you have real data: `evidence/interviews/` (anonymised notes), `evidence/survey/` (aggregate exports only, no personal data), `evidence/competitors/` (screenshots with date and URL). Never commit raw personal data to the repository.
