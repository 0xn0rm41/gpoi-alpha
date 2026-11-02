# Pricing and revenue

Back to [index](README.md). Numbers come from [financial_model.xlsx](financial_model.xlsx) (hypothetical, editable). Replace them with data from your own pilot and interviews.

## 1. Price points used in the model

| Scenario | Price per paying school per month | Assumption label |
|---|---|---|
| Pessimistic | 19 EUR | ASSUMPTION |
| **Base** | **39 EUR** | ASSUMPTION |
| Optimistic | 59 EUR | ASSUMPTION |

Note on consistency: the older worked example in [../fattibilita/ROI_Payback_VAL_TIR.md](../fattibilita/ROI_Payback_VAL_TIR.md) uses 600 EUR/school/year (50 EUR/month) with other inputs. It is a separate teaching example; the spreadsheet is the reference for this folder.

## 2. Proposed tiers (draft, to be tested)

| Tier | Who | Price (placeholder) | Includes |
|---|---|---|---|
| Self-hosted (AGPL) | Any school/IT teacher | 0 EUR | Full code, community support, own server and backups |
| Pilot | Design-partner school | 0 EUR (never billed, 3-month trial for later schools) | Hosted, direct support, feedback loop |
| **School (hosted)** | One school, unlimited students | Base 39 EUR/month (annual invoice, about 468 EUR/year) | EU hosting, backups, updates, DPA, email support |
| School Plus (optional) | Larger school or district | To be defined, e.g. from the 59 EUR/month optimistic point | Branding, SSO, export tooling, priority support |
| Commercial licence | Company wanting non-AGPL terms | Quote | See [LICENSING_STRATEGY.md](LICENSING_STRATEGY.md) |

Why flat per school and not per student: simpler for school budgets and procurement; avoids a "price per minor" optics problem. Trade-off: heavy schools cost the same as small ones (check against server load).

## 3. Finding the price: Van Westendorp (Price Sensitivity Meter)

Use with school decision-makers (headteacher, DSGA, digital-innovation teacher), n as large as you can reach; with few respondents treat as qualitative.

1. Describe the service (what is included, what is not) in 3 lines.
2. Ask four questions, in EUR per month (or per year):
   - At what price would it be so cheap that you doubt its quality?
   - At what price is it a bargain?
   - At what price does it start to feel expensive, but you would still consider it?
   - At what price is it too expensive to consider?
3. Plot four cumulative curves (too cheap and bargain inverted). Read:
   - Point of Marginal Cheapness: "too cheap" meets "not cheap".
   - Point of Marginal Expensiveness: "too expensive" meets "not expensive".
   - Acceptable range is between these two points; the optimal price point is where "too cheap" meets "too expensive".
4. Caveats: stated, not revealed, preferences; public schools often have fixed spending thresholds that matter more than a curve; anchoring by the order of questions.

## 4. Finding the price: Gabor-Granger

1. Show one price at a time (random order across respondents, e.g. 19, 29, 39, 49, 59 EUR/month).
2. Ask: "Would your school subscribe at this price?" (yes/no, or 5-point intent scale).
3. Compute the share of yes at each price (demand curve) and **revenue index = price x share yes**. The maximum is the revenue-maximising price; the elasticity is read from the slope.
4. Apply a haircut: stated intent overstates real purchase. The model's conversion to paying (10 / 25 / 40%) is an assumption of this kind; calibrate it with the pilot.

Sample worksheet:

| Price (EUR/month) | Respondents asked | Yes | Share yes | Price x share |
|---|---|---|---|---|
| 19 | | | | |
| 29 | | | | |
| 39 | | | | |
| 49 | | | | |
| 59 | | | | |

## 5. Revenue structure in the model

Revenue per month = paying schools x price + donations + sponsorship (+ commission if enabled) + one-off grant.

- Paying schools = onboarded schools (excluding the pilot) after the 3-month trial x conversion share; onboarding starts month 7 (May 2027), billing from month 13 (November 2027).
- Base inputs: 0.5 new schools/month, 500 students per school, 35% registered, 25% conversion, 1.5% monthly churn.
- Result as saved: about 2.8 paying schools at month 36. Revenue is small; that is why costs are kept near zero.

## 6. Unit economics (Base, as computed in the BreakEven sheet)

| Metric | Formula | Base value |
|---|---|---|
| Variable cost share | payment fee 2% + support 8% + tax reserve 0% | 10% |
| Contribution per school per month | 39 x (1 - 10%) | 35.10 EUR |
| Expected lifetime | 1 / churn (1.5%) | about 66.7 months |
| LTV per paying school | contribution / churn | 2,340 EUR |
| CAC per paying school | 120 EUR per onboarded school / 25% conversion | 480 EUR |
| LTV / CAC | | about 4.9 |
| CAC payback | CAC / monthly contribution | about 13.7 months |

Caveats: LTV via 1/churn is sensitive to the churn guess (a 1.5% monthly figure is invented; school contracts are often annual and renew in September). CAC excludes volunteer hours, which are the real acquisition cost. Rule of thumb often quoted for healthy SaaS is LTV/CAC above 3: treat as a heuristic, not a law.

## 7. Break-even

Static break-even (one server, billing active):

- Fixed monthly costs = VPS 8 + domain 15/12 + email 15 + backup 4 + legal update 300/12 + insurance 300/12 + accountant 40 + stipend 0 = **118.25 EUR/month**.
- Break-even paying schools = 118.25 / contribution.
- To get that many paying schools, onboard = break-even / conversion (Base 25%).

| Price EUR/month | Contribution | Break-even paying schools | LTV | LTV / CAC (CAC 480) |
|---|---|---|---|---|
| 19 | 17.10 | 7 | 1,140 | 2.4 |
| 29 | 26.10 | 5 | 1,740 | 3.6 |
| **39** | **35.10** | **4** | **2,340** | **4.9** |
| 49 | 44.10 | 3 | 2,940 | 6.1 |
| 59 | 53.10 | 3 | 3,540 | 7.4 |
| 79 | 71.10 | 2 | 4,740 | 9.9 |
| 99 | 89.10 | 2 | 5,940 | 12.4 |

At Base: 4 paying schools means about 16 onboarded schools at 25% conversion. At 0.5 new schools per month that takes roughly 32 months after onboarding starts, which is why the dynamic model shows no monthly break-even within 36 months. Levers, in order of effect: conversion rate, onboarding speed, price, then costs.

Donations, sponsorship, grants and commission are excluded from the static figure (conservative), as in the spreadsheet.

## 8. How to update this document

Change inputs only in the spreadsheet (yellow/blue cells), recalculate, then copy the new values into the tables above. If you change a number here without the model, the two will drift.
