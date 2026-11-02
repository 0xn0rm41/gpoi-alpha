# Licensing strategy

Back to [index](README.md). Not legal advice; have a lawyer review the dual-licensing and CLA texts.

## 1. Decision: AGPL-3.0-or-later

| Option | Pros | Cons | Fit |
|---|---|---|---|
| MIT / Apache-2.0 | Maximum adoption, simple | Anyone can run a closed hosted fork and compete without giving back | Weak protection for a hosted-service project |
| GPL-3.0 | Strong copyleft for distributed code | Network use is not "distribution": SaaS forks can stay closed | Gap for web apps |
| **AGPL-3.0-or-later** | Network use triggers the source-offer duty (section 13), so hosted forks must publish changes | Some companies avoid AGPL; compatibility checks needed | **Chosen** |
| Source-available (BSL, SSPL, etc.) | Restricts competitors | Not open source (OSI), hurts trust and school/community adoption | Rejected |
| Open-core with proprietary add-ons | Revenue from extras | Contributor friction, "bait and switch" risk | Only for clearly separate extras |

"or-later" lets the project move to later AGPL versions; the cost is trusting the FSF. Document the choice in an ADR (see [../project_management/PROCESS.md](../project_management/PROCESS.md)).

Practical points: every file carries an SPDX header (`SPDX-License-Identifier: AGPL-3.0-or-later`); the running app must offer a "Source" link to the corresponding source (including modifications); check dependency licences for compatibility (the SBOM at [../eu/cra/sbom.cdx.json](../eu/cra/sbom.cdx.json) helps).

## 2. Dual licensing

Selling a commercial (non-AGPL) licence is only possible if the project **owns or has sufficient rights to all the code**. Otherwise a contributor's AGPL-only contribution blocks relicensing.

| Mechanism | What it does | Allows dual licensing? | Contributor friction |
|---|---|---|---|
| **DCO** (Developer Certificate of Origin, `Signed-off-by:`) | Contributor certifies they may submit the code under the project licence | **No**: no relicensing right | Low |
| **CLA - licence grant** | Contributor keeps copyright, grants the project a broad licence incl. right to sublicense | Yes | Medium |
| **CLA - copyright assignment** | Contributor transfers copyright | Yes | High; note that in some EU jurisdictions moral rights cannot be assigned, so a licence grant is safer. Verify |

Recommendation:

1. **Now:** use DCO sign-off for all contributions (low friction; see [../github/CHEATSHEET.md](../github/CHEATSHEET.md)). Keep contributors few and the core written by the team.
2. **If a commercial licence becomes real:** introduce a CLA (licence-grant type) *before* accepting significant outside code, and obtain written consent from existing contributors. Do not retroactively assume rights.
3. Keep a CONTRIBUTORS/AUTHORS file with who contributed what; it is the evidence when licensing is questioned.
4. A legal entity (association or company) should own the rights eventually, not an individual student whose situation may change. Verify with a lawyer.

## 3. Trademark

- Copyright licences do not grant a name. Protect the name "Hub Studenti" and logo through a trademark policy: forks may use the code but must rename and not imply endorsement.
- Check availability of the name first (Italian/EU registers) and note that a generic descriptive name may be hard to register. Verify with an IP lawyer; registration costs are not in the model.
- Publish a short TRADEMARK.md: allowed uses (accurate references, "powered by"), disallowed uses (hosted services under the same name).

## 4. Contributor policy (summary)

- Code of conduct (Contributor Covenant style) because users are minors and contributors young.
- Contributions under AGPL-3.0-or-later with DCO sign-off; CLA later if needed.
- No code copied from incompatible licences; no AI-generated code pasted without reviewing licence and correctness.
- Security issues go through private vulnerability reporting, not public issues: [../github/CHEATSHEET.md](../github/CHEATSHEET.md) and [../eu/cra/VULNERABILITY-POLICY.md](../eu/cra/VULNERABILITY-POLICY.md).
- Review rules, branching and release process: [../project_management/PROCESS.md](../project_management/PROCESS.md).

## 5. What is sold (and what is not)

| Sold | Not sold |
|---|---|
| Hosting, operations, backups, updates (SaaS per school) | The ability to use the code (always free under AGPL) |
| Support and onboarding, training for teachers | Student data, ever |
| Optional extras kept clearly separate (SSO, branding, export) | Features removed from the free version to force upgrades |
| Commercial licence for companies that cannot accept AGPL (needs full rights, section 2) | Ads or tracking |

See [BUSINESS_MODEL.md](BUSINESS_MODEL.md) for how this ties to revenue and [PRICING_AND_REVENUE.md](PRICING_AND_REVENUE.md) for prices.
