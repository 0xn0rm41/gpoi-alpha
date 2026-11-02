# Digital Services Act (Regulation (EU) 2022/2065) — analysis for Hub Studenti

> **Draft analysis — not legal advice.** Article numbers below are given from general knowledge of the Regulation and must be checked against the official text on EUR-Lex. Every point marked **[VERIFY]** needs confirmation with a lawyer before you rely on it.

## 1. Why the DSA applies

Hub Studenti stores and publishes information provided by its users (ideas, polls, notes with photos, comments, book listings) and makes it visible to other users. It is offered to recipients in the EU, so the DSA applies to the operator regardless of where the operator is established.

## 2. Classification

The DSA is layered. Each layer adds duties on top of the previous one.

| Layer | Does Hub Studenti fall in it? | Reasoning |
|---|---|---|
| Intermediary service: "mere conduit", "caching", **"hosting"** (arts. 4–6) | **Yes: hosting service** | It stores information at the request of users |
| **Online platform** (art. 3(i): a hosting service that, at a user's request, stores *and disseminates to the public* information) | **Probably yes** | Content is made available to other users of a school community. "Public" is the point to check: the DSA defines "dissemination to the public" as making information available to a potentially unlimited number of third parties. Content here is visible only to members who hold an invite code. Whether a closed, invite-only community counts as "the public" is arguable. A recital also says that interpersonal communication services (e.g. email, private messaging) are not platforms, and the closed-group question is not obviously settled **[VERIFY]**. A cautious operator treats the service as an online platform |
| Very large online platform (≥ 45 million monthly EU users) | **No** | Orders of magnitude away |
| Online marketplace (platform that lets consumers conclude distance contracts with traders) | **No, as designed** | Book listings only connect users; no payment, no contract concluded through the platform (see section 7). Re-assess if you add checkout, escrow or commission on completed sales |

Practical approach: comply with the hosting-service duties in full (they apply in every case), then document why, as a micro/small enterprise, the section 3 online-platform duties do not apply, while voluntarily keeping a lightweight version of them (a clear report flow, explanations of decisions, an appeal route). That is cheap, builds trust with schools, and covers you if the classification is decided against you.

## 3. Duties for all intermediary services

These apply whether or not the SME exemption is available.

| Article | Duty | What it means here |
|---|---|---|
| Art. 11–12 | **Points of contact** for authorities (art. 11) and for users (art. 12), reachable electronically and in a language used (Italian, English recommended) | Publish a dedicated email (for example `[DSA CONTACT EMAIL]`) on the site, in the terms and in the footer. A human must read it. Do not rely solely on an automated chatbot |
| Art. 13 | **Legal representative** in the EU if the provider is not established in the EU | Not needed if the operator is established in the EU/Italy. Needed otherwise **[VERIFY]** |
| Art. 14 | **Terms and conditions**: restrictions on use of the service (content rules, moderation policies and tools, including algorithmic decision-making and human review, and the internal complaint-handling system) in clear, plain, intelligible, user-friendly, unambiguous language. If the service is directed at or predominantly used by minors, conditions must be explained in a way minors can understand | The rules page `regole.html` is the terms. It must describe what is prohibited, how reports work, what happens on removal or suspension, and how to complain. Use short sentences and examples; keep the teenager-friendly tone. Notify users of significant changes |
| Art. 14 (fundamental rights) | Apply restrictions diligently, objectively and proportionately, with regard to users' rights, including freedom of expression | Moderators should follow written criteria |
| Art. 15 | **Transparency reports** | Micro and small enterprises are exempt from the annual report duty **[VERIFY]**. Keep simple internal counts (reports received, content removed) anyway |

## 4. Hosting services: liability exemption (art. 6)

A hosting provider is **not liable for illegal content stored by users** provided that:

1. it **does not have actual knowledge** of the illegal activity or content and, as regards damages claims, is not aware of facts or circumstances from which the illegality is apparent; **or**
2. once it obtains such knowledge or awareness, it **acts expeditiously to remove or disable access** to the content.

Consequences for operations:

- A report (notice) can give "actual knowledge". The report queue must be looked at promptly: define internal target times (for example, review obvious abuse within 24–48 hours) **[the DSA says "expeditiously", with no fixed number]**.
- The exemption does not apply when the user acts under the authority or control of the provider. Keep clear that content is the users', not the operator's. Operator-curated content (official announcements) is the operator's own content and not covered by the exemption.
- Voluntary own-initiative moderation does not by itself cost you the exemption (art. 7, "Good Samaritan"). You can moderate proactively.
- **No general monitoring obligation** (art. 8). The operator is not obliged to scan everything in advance.
- **Orders from authorities** to act against illegal content (art. 9) or to give information (art. 10): the point of contact must be able to receive them, and the operator must respond and inform the user concerned where required.

## 5. Notice and action (art. 16) and statement of reasons (art. 17)

**Art. 16** requires hosting providers to offer an easy-to-access, user-friendly, electronic mechanism for anyone (individuals and entities) to notify content they consider illegal. The notice mechanism should allow a sufficiently substantiated explanation of why the content is illegal, the exact location (URL or identifier), the notifier's name and email (except for certain serious offences, where it may be anonymous), and a statement of good faith **[VERIFY exact elements in art. 16(2)]**. The provider must confirm receipt (if there is a contact email), decide in a timely, diligent, non-arbitrary and objective manner, and inform the notifier of the decision and the redress options.

**Art. 17** requires a **clear and specific statement of reasons** to each affected user when the provider restricts content (removal, disabling, demotion), suspends payments, suspends or terminates the service or the account. It must say what was decided, the facts and grounds (illegal content or breach of the terms), whether automated means were used, the legal or contractual basis, and the redress possibilities. A user-visible message that says "removed because it breaks rule 1.2" with a way to reply meets the spirit; check the full list in art. 17(3) **[VERIFY]**. Exceptions exist (for example deceptive high-volume commercial content, or where law enforcement requests confidentiality).

Hub Studenti's **"Report" button** is the art. 16 mechanism in embryonic form. To make it more complete:

- accept a free-text reason and a category (illegal / breaks school rules / other);
- confirm receipt to the reporter;
- record who decided, when, and why (moderation log);
- when an admin removes content or suspends an account, tell the author the reason and how to object.

**Where "reports about illegal content" go.** Note that school admins are volunteer students. They should handle breaches of the community rules, but for potentially illegal content (child abuse imagery, serious threats, doxxing, non-consensual images) there should be an escalation path to the operator, who is the legally responsible party, and to the authorities where required. For child sexual abuse material, report to the competent authorities immediately and do not keep or forward the material beyond what the law requires.

## 6. Online-platform obligations (section 3 of chapter III, art. 19 onward)

If the service is an online platform, these duties would apply **unless the provider is a micro or small enterprise**:

- internal complaint-handling system for decisions on content or accounts (art. 20) and out-of-court dispute settlement (art. 21);
- trusted flaggers' priority (art. 22);
- measures against misuse, such as warning and suspending users who frequently post manifestly illegal content or submit manifestly unfounded notices (art. 23);
- additional transparency reporting (art. 24);
- a ban on dark patterns in interface design (art. 25);
- advertising transparency (art. 26) and no ad profiling of minors or using special categories (art. 26(3), 28(2));
- recommender-system transparency (art. 27);
- **protection of minors online (art. 28)**;
- traceability of traders and compliance by design only for marketplaces (arts. 30–32), not relevant while the service is not a marketplace.

**The micro/small-enterprise exemption.** My understanding is that art. 19 excludes online platforms provided by enterprises that qualify as micro or small enterprises within the meaning of the Annex to Commission Recommendation 2003/361/EC, unless they have been designated as a very large online platform, with a grace period when an enterprise stops qualifying. The Recommendation's definition is: **a small enterprise has fewer than 50 staff and annual turnover or balance sheet total not exceeding EUR 10 million; a micro enterprise has fewer than 10 staff and turnover or balance sheet not exceeding EUR 2 million.** The Recommendation also contains rules on partner and linked enterprises (so a project backed by a larger organisation may not qualify). **This exemption, its exact wording, the staff and financial-ceiling calculation, the treatment of a sole trader or association, and the grace period must be verified against the text of the Regulation and the Recommendation with a lawyer [VERIFY].** Do not assume it. Note that the exemption does not apply to hosting-service duties in sections 3–5 above, and the Commission has stated it can still apply other rules to such providers **[VERIFY]**.

**Art. 28 and minors.** Art. 28(1) requires providers of online platforms accessible to minors to put in place appropriate and proportionate measures to ensure a high level of privacy, safety and security of minors on their service. The Commission has published guidelines on the protection of minors under art. 28 (I believe adopted in 2025) **[VERIFY existence, date and content]**. These guidelines address things like age assurance proportionate to risk, privacy-protective default settings, safe-by-design interfaces, contact and visibility controls, moderation and reporting tools suited to minors. It is unclear to me whether the SME exemption for section 3 also removes art. 28 for a given operator, because art. 28 sits in section 3 **[VERIFY — this is a key question for the lawyer]**. Even if exempt, an educational service whose users are largely 14–19 should follow the guidelines as best practice. Hub Studenti already does several things in that spirit: no ads, no profiling, no analytics, minimal data, no public profiles (first name plus initial only), no direct messaging, no payments, invite-only communities, and a report button.

## 7. Book listings, marketplace and consumer rules

- The platform **only connects users**. It does not process payments, hold funds, take delivery or conclude the sale. The agreement is made between the two users, in person.
- **Traders vs consumers.** A student who sells their own used textbook occasionally is, in general, a private person (consumer-to-consumer), and consumer-protection rules for business-to-consumer sales do not apply to that sale. A user who sells regularly for profit may be a "trader" under EU and Italian consumer law **[VERIFY thresholds and case law]**. The terms should say that traders must not use the service, or must identify themselves. Do not offer the business tools (bulk listings, shops) that would attract traders.
- **DSA marketplace duties** (arts. 30–32: trader traceability, compliance by design, right to information) apply to **online marketplaces** only. If you add payments or a checkout, or take a commission on completed sales, **re-do this analysis**: you may become an online marketplace, may fall under payment-services law (PSD2: avoid holding funds yourself, use a licensed provider), and the optional commission needs consumer-law, tax and invoicing review.
- **Optional commission (default OFF).** Today the commission is an informational calculation only. Do not enable it for real money without legal and tax advice.
- **Illegal or unsafe items.** Rules already limit listings to textbooks and school materials. Add a rule against anything else and a report category for it.
- **Sponsorship.** If sponsors appear, label them clearly as sponsored (DSA art. 26 transparency if you are an online platform; consumer-law and Italian advertising-rules on identifiable commercial communications otherwise **[VERIFY]**), and keep them contextual, with no profiling and no ads aimed at minors based on personal data (art. 28(2) **[VERIFY]**).

## 8. Supervision in Italy

The DSA requires each Member State to designate a Digital Services Coordinator. My understanding is that in Italy this is **AGCOM** (Autorità per le garanzie nelle comunicazioni), with other authorities involved on specific matters (the Garante for data protection, the AGCM for consumer protection) **[VERIFY the current designation and the contact route]**. If the operator is established in Italy, AGCOM is the coordinator with jurisdiction over it. Publish the point-of-contact (art. 11) so authorities can reach you, and keep this document updated with the correct authority.

## 9. Interaction with the GDPR

- Moderation involves personal data (reports, decisions, logs): record this in the processing register and give notice in the privacy notice (see [`gdpr/PROCESSING-REGISTER.md`](gdpr/PROCESSING-REGISTER.md) and [`cookies/PRIVACY-POLICY.md`](cookies/PRIVACY-POLICY.md)).
- Retention: resolved reports are kept for 90 days. This must be consistent with any period you need to defend a moderation decision or to handle a complaint.
- Reporter identity should not be disclosed to the reported user unless necessary and lawful.

## 10. Compliance checklist mapped to existing features

Status values: **Done** = feature exists in the code or pages; **Partial** = exists but needs work; **To do** = missing. Verify the status against the current code before launch.

| DSA topic (article) | Applies to us? | Existing feature | Status | Action |
|---|---|---|---|---|
| Point of contact for authorities and users (11–12) | Yes | Privacy contact in `.env` (`TITOLARE_CONTATTO`) | Partial | Add a named DSA/abuse contact to `regole.html`, footer and terms; make sure a human monitors it |
| Legal representative (13) | Only if operator is outside EU | n/a | To check | Confirm operator establishment |
| Terms and conditions in plain, minor-friendly language (14) | Yes | `regole.html` (rules, moderation, sanctions) | Partial | Add: how reports are handled, statement of reasons, appeals route, notice of changes, DSA contact; keep the language simple |
| Notice and action (16) | Yes | "Report" button; admin report queue | Partial | Add reason categories, confirmation to reporter, notice of outcome, moderation log, escalation path for illegal content |
| Statement of reasons (17) | Yes | Admins can delete content / suspend accounts | To do | Notify the author with reason, legal or rule basis, and redress; record it |
| Liability exemption conditions (6) | Yes | Report queue and removal tools | Partial | Define response targets; train admins; log time from report to action |
| No general monitoring (8) / own-initiative moderation (7) | Yes | Moderation is reactive | Done | Keep it documented |
| Orders from authorities (9–10) | Yes | None | To do | Written procedure: who receives an order, who answers, within what time |
| Transparency reports (15) | Likely exempt as small | None | Internal | Keep simple counts: reports, removals, accounts suspended |
| Internal complaint handling (20) | If exemption does not apply | Contact email | Partial | Provide a simple appeal route and have a different person review |
| Out-of-court dispute settlement (21) | If exemption does not apply | None | To check with lawyer | Evaluate; likely not required for a small provider |
| Misuse measures (23) | If exemption does not apply | Account suspension | Partial | Add warning before suspension; rate-limit abusive reporting |
| Dark patterns, ads, recommender transparency (25–27) | If exemption does not apply | No ads, no profiling, no recommender system | Done | Keep it that way; label sponsorship if introduced |
| Protection of minors (28) and Commission guidelines | Check | No ads, no profiling, minimal data, invite-only, no public profiles, no DMs, first name plus initial | Partial | Review the guidelines point by point; age-appropriate defaults; age statement (14+); safety information and trusted-adult contacts |
| Marketplace duties (30–32) | No (no payments) | Book listings only connect users; no payment | Done | Re-assess before enabling payments or commission; ban professional sellers in terms |
| Supervisory authority (Italy: AGCOM, to verify) | Yes | n/a | To do | Record authority and operator establishment in the compliance file |

## 11. Questions to put to a lawyer

1. Is an invite-only school community "dissemination to the public" for art. 3(i), i.e. are we an online platform at all?
2. Does the operator, in its actual legal form and with any linked bodies, qualify as a micro or small enterprise, and does the exemption cover art. 28?
3. Do the Commission's art. 28 guidelines impose concrete measures on a service our size?
4. At what point do repeated book sales make a user a trader, and does the term "marketplace" apply once a commission is charged?
5. Who is the competent Digital Services Coordinator and what is the right contact route?
