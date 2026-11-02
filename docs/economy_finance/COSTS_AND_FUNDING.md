# Costs and funding

Back to [index](README.md). Values are the model's assumptions (EUR), not quotes. Get real quotes before spending.

## 1. Cost lines

| Line | Model value | When | Comment |
|---|---|---|---|
| VPS in EU | 8 EUR/month per server | From go-live (month 4, Feb 2027) | One server per 10 schools (technical guess, SQLite single writer). See [../HOSTING.md](../HOSTING.md) |
| Domain | 15 EUR/year | From go-live | Buy after the testing phase, as planned; register the project name as soon as it is stable |
| Transactional email (SMTP) | 15 EUR/month | From go-live | See section 2 |
| Off-site backup | 4 EUR/month | From go-live | Encrypted, in the EU; test restores |
| Legal / DPO review | 1,000 EUR one-off (month 3) | Before go-live | Privacy policy, terms, DPA, minors; see section 3 |
| Legal / DPO yearly update | 300 EUR/year | Accrued from go-live | |
| Insurance | 300 EUR/year | Accrued from go-live | See section 4 |
| Accountant | 40 EUR/month | From billing start (month 13) | Italian regime questions in [BUSINESS_MODEL.md](BUSINESS_MODEL.md) |
| Acquisition per school | 120 EUR/school | Per onboarded school | Travel, demo, materials |
| Support | 8% of MRR | Variable | |
| Payment processing | 2% of MRR | Variable | Depends on payment method (bank transfer is cheaper than cards) |
| Team stipend | 0 | | Volunteers: real opportunity cost, not in cash model |
| Tax reserve | 0% (to be set with accountant) | | |

Opening cash is 0 in the model: the team contributes nothing up front, so costs are covered by grant, sponsorship, donations or a founder loan/gift decided explicitly.

## 2. Email deliverability

Email carries account confirmation links, so poor deliverability breaks sign-up (school-domain addresses are strict filters).

- Use a transactional provider (EU region if possible) instead of the VPS sending directly.
- Authenticate the sending domain: SPF, DKIM, DMARC (start with `p=none`, move to quarantine/reject after monitoring); set reverse DNS on the server.
- Use a dedicated sending subdomain; keep transactional separate from any future newsletter.
- Watch bounce and complaint rates; remove hard bounces. Test against school-domain mailboxes in the pilot.
- Keep a manual fallback (admin-generated confirmation link) for the pilot.
- Free tiers exist at some providers but have limits that change; the model keeps 15 EUR/month as a placeholder.

## 3. Legal, privacy, DPO

- Controller/processor roles: for a hosted school, the school is typically the controller and the project the processor, so a data processing agreement (DPA) is needed. Verify with a lawyer.
- Users are minors: age thresholds for consent in Italy, parental information, and school responsibilities need review.
- A Data Protection Officer is mandatory only in defined cases (e.g. public bodies, large-scale systematic monitoring). Schools as public bodies have their own DPO; the project may not need one but must verify. Budget a recurring external consultation instead (the 1,000 + 300 EUR assumption).
- Existing material: [../eu/gdpr/GDPR.md](../eu/gdpr/GDPR.md), [../eu/gdpr/PROCEDURES.md](../eu/gdpr/PROCEDURES.md), [../eu/gdpr/PROCESSING-REGISTER.md](../eu/gdpr/PROCESSING-REGISTER.md), [../eu/cookies/PRIVACY-POLICY.md](../eu/cookies/PRIVACY-POLICY.md), [../eu/cra/VULNERABILITY-POLICY.md](../eu/cra/VULNERABILITY-POLICY.md).
- EU Cyber Resilience Act: see [../eu/cra/CRA.md](../eu/cra/CRA.md); open-source stewardship rules are specific, verify applicability.

## 4. Insurance

- Options to ask a broker about: professional indemnity / cyber liability, general liability. Cover for volunteer teams and for processing minors' data may be excluded; read exclusions.
- Placeholder 300 EUR/year; real quotes may differ widely.

## 5. Funding options (hedged: availability, amounts and deadlines change; check each call)

| Option | Fit | Notes |
|---|---|---|
| School contribution / agreement | Direct | Pilot school may fund hosting; a purchase order needs a public-procurement-compliant process |
| Donations (GitHub Sponsors, Open Collective, own page) | Small, steady | Platform fees and fiscal treatment to verify |
| Local sponsors | Small | Labelled, non-targeted; sponsorship is a taxable service |
| Italian school-digital initiatives (e.g. PNRR digital education measures) | Possible for schools, not for the project directly | Schools may buy services through such funds; verify current measures |
| Italian youth / student-entrepreneurship support (regional or national youth calls, university incubators, "bandi giovani") | Possible | Often require a legal entity; check eligibility |
| EU programmes (Erasmus+ for school education partnerships, European Solidarity Corps, Horizon/Digital Europe calls) | Possible, heavy paperwork | Usually need partners and an entity; start by reading call documents |
| NLnet / NGI-type open-source grants and similar open-source funds | Good thematic fit (privacy, open source) | Competitive; small teams do apply; check whether a call is currently open |
| Open-source foundations / fiscal hosts (e.g. an Open Collective host) | Practical | Provide legal and fiscal wrapper; take a percentage |
| Founder loan or gift | Fallback | Write it down; covers the model's base funding gap of about 2,097 EUR |

Do not invent success rates. Track applications in a small table (call, deadline, amount asked, status, owner) and review it in the roadmap checkpoints: [../project_management/ROADMAP.md](../project_management/ROADMAP.md).

## 6. Funding gap check

The model reports `Funding gap = max(0, -lowest cash)`. Base: about 2,097 EUR (reached late, month 36). Re-run for Pessimistic and Optimistic and plan to fund the pessimistic gap plus a margin before buying domain and host.
