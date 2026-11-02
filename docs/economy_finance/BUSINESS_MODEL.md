# Business model

Back to [index](README.md). All figures are assumptions from [financial_model.xlsx](financial_model.xlsx). Not legal or tax advice.

## 1. Goal and constraints

- Goal: keep a free, school-scoped student hub alive and safe, with costs covered, without selling student data or showing behavioural ads.
- Constraints: solo/small student-led team, volunteers (stipend = 0 in the model), operator in Italy/EU, users are mostly minors (GDPR and parental-consent questions apply: see [../eu/gdpr/GDPR.md](../eu/gdpr/GDPR.md)).
- Principle: students never pay to use the hub. Money, if any, comes from schools, sponsors, donors, grants.

## 2. Revenue streams

| # | Stream | Status in model | Notes |
|---|---|---|---|
| 1 | Self-hosting of the open-source code (AGPL) | Free, no revenue | The core stays fully usable; this is the credibility base |
| 2 | **Hosted SaaS per school** | Main stream. Base 39 EUR/school/month, billing from month 13, 3-month free trial | See [PRICING_AND_REVENUE.md](PRICING_AND_REVENUE.md) |
| 3 | Optional paid extras (open-core) | Not modelled | E.g. SSO with school identity provider, custom branding, data export tooling, priority support. Keep the student-facing features free |
| 4 | Sponsorship | Base 50 EUR/month from month 10 | Local, non-targeted, clearly labelled; no personal data shared with sponsors |
| 5 | Donations | Base 15 EUR/month | Via a platform such as GitHub Sponsors / Open Collective (verify fees and fiscal treatment) |
| 6 | Grants / school contributions | Base 1,000 EUR one-off in month 6 | See [COSTS_AND_FUNDING.md](COSTS_AND_FUNDING.md) |
| 7 | Book-exchange commission | **OFF by default** (`Commission enabled? = 0`), rate 2% if ON, average book 12 EUR | See section 4 |
| 8 | Dual/commercial licence | Not modelled | Only if a company wants to embed the code without AGPL obligations; see [LICENSING_STRATEGY.md](LICENSING_STRATEGY.md) |

## 3. Open-core and hosted SaaS

- **Open core:** the whole platform (events, announcements, idea voting, polls, notes, book exchange, communities with invite code) is published under AGPL-3.0-or-later.
- **What a paying school buys:** not the software but the service: managed hosting in the EU, backups, updates, security patches, onboarding, support, a data-processing agreement. A school can always self-host instead.
- **Honest limit:** SQLite means one writer per server; the model assumes one VPS per 10 schools (see [../HOSTING.md](../HOSTING.md) and the ADR in [../project_management/PROCESS.md](../project_management/PROCESS.md)). Operating many schools is therefore an operations job, which costs volunteer time (not in the cash model).
- **Free tier:** pilot school(s) are free design partners (1 in the model, never billed).

## 4. Book commission and the payment-licence caveat (PSD2)

The platform could take a small commission (project default 2%) on second-hand book sales between students. Receiving money from a buyer and passing it to a seller can qualify as a **payment service** under the EU Payment Services Directive (PSD2, in Italy implemented by decree and supervised by Banca d'Italia). Operating one without authorisation can be an offence. Whether a given flow is regulated depends on details (who holds the funds, even briefly; the "commercial agent" exclusion; limited-network exclusion). **This must be verified with a lawyer before enabling.**

Recommended order of preference:

1. **Do not handle funds at all (default).** The hub only lists books and connects buyer and seller; payment happens hand to hand at school. Commission = 0. This is the model's default and the safe launch state.
2. **Voluntary contribution.** An optional "support the hub" tip, not a per-sale fee.
3. **Licensed PSP only.** If a commission is wanted, arrange payments exclusively through a licensed payment service provider with a marketplace product (for example Stripe Connect, which holds the regulatory role and does KYC on sellers), so the project never holds or routes funds itself. Check: seller age (minors cannot easily contract or pass KYC), PSP terms for marketplaces, fees (the model's 2% processing share is an assumption), VAT/income treatment of the commission.
4. Never: collecting money in a project bank account or wallet and paying sellers out manually.

Sizing under assumptions (Base, commission ON, for illustration only): 0.03 books per registered student per month x 500 students x 35% registered = about 5.3 books/school/month x 12 EUR x 2% = about 1.26 EUR/school/month. This is tiny next to a subscription; the commission is not a business pillar, mainly a feature.

## 5. Italian regime notes (hedged: verify with a commercialista)

- Revenue from services, even small, generally needs a **partita IVA** once activity is habitual and for-profit; occasional work has different rules. Do not assume; ask.
- The **regime forfettario** (flat-rate regime) may be available to a sole trader below a revenue threshold with a flat substitute tax; thresholds, eligibility (age, other income) and rates change by law. Verify current rules. A minor/student situation (age of majority, parental involvement, student status) must be checked specifically.
- A team of several people usually points to an association (APS/ETS), a cooperative or a company; each has different tax, liability and grant eligibility. The Third Sector regime may help for grants/donations but adds duties. Verify.
- Invoicing to schools (public bodies) normally uses electronic invoicing (fattura elettronica) and public procurement rules may apply above small thresholds; verify before selling to public schools.
- Donations and sponsorship have specific fiscal treatment (sponsorship is typically a taxable service). Verify.
- In the model, `Tax & contributions reserve` is left at 0 on purpose: fill it after asking the accountant. `Accountant` is 40 EUR/month from billing start (assumption).

## 6. Principles that protect users

- No sale or sharing of student personal data; no behavioural advertising.
- Data processing agreement offered to schools; data stays in the EU.
- Exit path: any school can export its data and self-host.
- Transparent finances: publish yearly income and costs once real.

## 7. Key risks of the model

See [../project_management/RISK_REGISTER.md](../project_management/RISK_REGISTER.md). Main ones: low school conversion, schools without budget (public schools buy slowly), volunteer burnout, regulatory exposure (minors, payments), single-server SQLite limits.
