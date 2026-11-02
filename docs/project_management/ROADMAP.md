# Roadmap

Month numbers match [../economy_finance/financial_model.xlsx](../economy_finance/financial_model.xlsx) (month 1 = November 2026). Every phase has an exit gate: do not start the next phase if the gate fails.

## Overview

| Phase | Months | Calendar | Main goal |
|---|---|---|---|
| 1. Pilot test | 1-3 | Nov 2026 - Jan 2027 | Prove the hub works for one school, free |
| 2. Domain and host purchase | 3-4 | Jan - Feb 2027 | Buy domain and EU host after the testing phase; legal basics |
| 3. Public launch | 4-12 | Feb - Oct 2027 | Open to more schools (onboarding from month 7), free trials |
| 4. Growth | 13-36 | Nov 2027 - Oct 2029 | Start billing, more schools, sustainability |

## Phase 1: Pilot test (months 1-3)

- Run one pilot school (free design partner, never billed) with invite-code communities.
- Test all modules: events, announcements, idea voting (threshold and "expose to school"), polls, notes, book exchange (commission OFF).
- Collect feedback weekly; fix top bugs; harden security (see [../eu/cra/VULNERABILITY-POLICY.md](../eu/cra/VULNERABILITY-POLICY.md)).
- Run price interviews with 5-10 school contacts (Van Westendorp / Gabor-Granger how-to in [../economy_finance/PRICING_AND_REVENUE.md](../economy_finance/PRICING_AND_REVENUE.md)); sample size is a target, not a forecast.
- **Gate:** pilot school still uses it after the first weeks; no open critical security issue; privacy documents reviewed.

## Phase 2: Domain and host purchase (months 3-4)

- Month 3: legal / DPO review (1,000 EUR assumption): privacy policy, terms, DPA, minors.
- Month 4: buy domain and VPS in the EU; set up Caddy, backups, SPF/DKIM/DMARC, monitoring ([../HOSTING.md](../HOSTING.md)).
- Decide legal wrapper and accountant questions ([../economy_finance/BUSINESS_MODEL.md](../economy_finance/BUSINESS_MODEL.md)).
- Insurance quote.
- **Gate:** restore from backup tested; funding gap of the pessimistic scenario covered ([../economy_finance/COSTS_AND_FUNDING.md](../economy_finance/COSTS_AND_FUNDING.md)).

## Phase 3: Public launch (months 4-12)

- Month 6: grant / contribution expected (assumption, 1,000 EUR).
- Month 7: multi-school onboarding starts (3-month free trial per school).
- Month 10: sponsorship starts (assumption).
- Publish docs, issue templates, contributor policy, DCO ([../github/README.md](../github/README.md)).
- Book exchange stays commission OFF unless a licensed PSP and legal advice are in place.
- **Gate:** at least one non-pilot school completed a trial; support load is manageable by the team.

## Phase 4: Growth (months 13-36)

- Month 13 (Nov 2027): billing of paying schools starts (Base 39 EUR/month, assumption).
- Add a second VPS when a server nears 10 schools; revisit the SQLite ADR ([PROCESS.md](PROCESS.md)).
- Optional extras (SSO, branding), possible commercial licence if rights are clean ([../economy_finance/LICENSING_STRATEGY.md](../economy_finance/LICENSING_STRATEGY.md)).
- Re-run the financial model quarterly with real numbers.
- **Decision point (month 18 and 24):** continue, change model, hand over to a foundation, or wind down with data export for schools.

## Standing activities

- Monthly: dependency updates (Dependabot), backup restore test, review [RISK_REGISTER.md](RISK_REGISTER.md).
- Quarterly: update model, review roadmap, funding applications table.
- Each semester: handover plan, because student team members graduate.
