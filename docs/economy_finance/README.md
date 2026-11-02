# Economy and finance

Index of the economic documents for Hub Studenti (open-source, AGPL-3.0-or-later, multi-school student hub; operator based in Italy/EU).

> **Honesty rule.** Every number in these documents is a **labelled assumption** or a placeholder to be replaced with your own estimate. There are no market statistics here. Nothing is legal, tax or accounting advice: items marked "verify" must be checked with a commercialista / lawyer.

| Document | What it answers |
|---|---|
| [BUSINESS_MODEL.md](BUSINESS_MODEL.md) | How the project can sustain itself: open-core, hosted SaaS per school, sponsorship/donations, book commission (and why it is OFF by default), Italian regime notes |
| [PRICING_AND_REVENUE.md](PRICING_AND_REVENUE.md) | Price tiers, how to test willingness to pay (Van Westendorp, Gabor-Granger), unit economics, break-even |
| [COSTS_AND_FUNDING.md](COSTS_AND_FUNDING.md) | Cost lines (hosting, domain, email, legal/DPO, insurance) and funding options (grants, EU programmes, donations) |
| [LICENSING_STRATEGY.md](LICENSING_STRATEGY.md) | AGPL vs alternatives, dual licensing (CLA/DCO), trademark, contributor policy, what is sold |
| [financial_model.xlsx](financial_model.xlsx) | The 36-month model (sheets: Assumptions, Scenarios, Monthly, BreakEven). Single source of truth for the numbers |

## How the pieces fit

1. Business model decides **what** is sold; licensing decides **what is allowed to be sold**.
2. Pricing and costs feed the spreadsheet; the spreadsheet outputs break-even and funding gap.
3. The roadmap in [../project_management/ROADMAP.md](../project_management/ROADMAP.md) uses the same month numbering as the model (month 1 = November 2026, start of the pilot).

## Related documents

- Profitability indicators (ROI, payback, NPV/VAN, IRR/TIR): [../fattibilita/ROI_Payback_VAL_TIR.md](../fattibilita/ROI_Payback_VAL_TIR.md)
- Feasibility template: [../fattibilita/template_fattibilita.md](../fattibilita/template_fattibilita.md)
- Market analysis frameworks: [../analisi_mercato/FRAMEWORKS.md](../analisi_mercato/FRAMEWORKS.md)
- Hosting: [../HOSTING.md](../HOSTING.md)
- GDPR: [../eu/gdpr/GDPR.md](../eu/gdpr/GDPR.md)

## Base-scenario headline outputs of the model (as saved in the file)

These are outputs of **invented inputs**, quoted only to show scale. Change the selector in `Assumptions!B4` to see Pessimistic / Optimistic.

| Output (Base scenario) | Value |
|---|---|
| Static break-even | 4 paying schools (118.25 EUR fixed costs / 35.10 EUR contribution per school) |
| Paying schools at month 36 | about 2.8 (fractional: the model does not round) |
| Lowest cash balance / funding gap | about -2,097 EUR, reached in month 36 |
| LTV / CAC | about 4.9 (2,340 / 480 EUR) |
| First month with monthly net >= 0 | not within 36 months |

Reading: with these inputs the project does **not** pay for itself inside 3 years, because few schools convert and billing starts only in month 13. This is a finding, not a failure: it says the project must be treated as a low-cost, volunteer, grant-supported effort unless conversion or onboarding speed is better than assumed.
