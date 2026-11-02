# Risk register

Scale: Probability (P) and Impact (I) each Low / Medium / High, qualitative judgement of the team, not measured. Review monthly. Owners are roles (see [RACI.md](RACI.md)).

| ID | Risk | P | I | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | Personal data breach (students are mostly minors) | M | H | Hardening, least privilege, encrypted backups, vulnerability policy ([../eu/cra/VULNERABILITY-POLICY.md](../eu/cra/VULNERABILITY-POLICY.md)), breach procedure ([../eu/gdpr/PROCEDURES.md](../eu/gdpr/PROCEDURES.md)) | Tech Lead |
| R2 | GDPR / minors' consent non-compliance | M | H | Legal review before go-live, DPA, data minimisation, school as controller | Project Lead |
| R3 | Payment-licence (PSD2) breach via book commission | L | H | Commission OFF by default; PSP-only if enabled; lawyer check | Project Lead |
| R4 | Low school conversion to paying | H | H | Price interviews, free pilot proof, grants and sponsors as backup; model shows no break-even in Base | Project Lead |
| R5 | Team burnout / graduation, bus factor of 1 | H | H | Documentation, ADRs, handover each semester, small scope | Project Lead |
| R6 | Single SQLite server: outage or data loss | M | H | Frequent backups, tested restore, one server per 10 schools, migration plan ([PROCESS.md](PROCESS.md) ADR-0001) | Tech Lead |
| R7 | Email deliverability problems (confirmation emails lost) | M | M | Transactional provider, SPF/DKIM/DMARC, manual fallback | Tech Lead |
| R8 | Abuse content / moderation burden among minors | M | H | Reporting, admin tools, community rules, school admins as moderators | Community Lead |
| R9 | Licence problem: contributions block dual licensing | L | M | DCO now, CLA before outside code, contributors list ([../economy_finance/LICENSING_STRATEGY.md](../economy_finance/LICENSING_STRATEGY.md)) | Project Lead |
| R10 | Fork or clone uses the name | L | L | Trademark policy, AGPL source duty | Project Lead |
| R11 | Vulnerable dependency or supply-chain issue | M | M | Dependabot, SBOM ([../eu/cra/sbom.cdx.json](../eu/cra/sbom.cdx.json)), lockfile, CI audit | Tech Lead |
| R12 | Public schools cannot buy (procurement, budgets) | M | M | Annual invoice, small amounts, self-host option, grants | Project Lead |
| R13 | Funding gap uncovered | M | M | Fund pessimistic gap before purchase ([../economy_finance/COSTS_AND_FUNDING.md](../economy_finance/COSTS_AND_FUNDING.md)) | Finance Lead |
| R14 | Tax / regime mistake (partita IVA, forfettario) | M | M | Consult commercialista before first invoice | Finance Lead |
| R15 | Hosting provider outage or price rise | L | M | Portable setup (single Node app + data folder), backups off-site | Tech Lead |
| R16 | Scope creep delays pilot | H | M | WIP limits, Definition of Ready ([PROCESS.md](PROCESS.md)) | Project Lead |
