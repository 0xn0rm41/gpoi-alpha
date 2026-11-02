# EU compliance documents — Hub Studenti

> Draft documents, **not legal advice**. Have a lawyer and/or DPO review them before the service is opened to the public.

## Index

| Document | Purpose |
|---|---|
| [cookies/COOKIE-POLICY.md](cookies/COOKIE-POLICY.md) | Why only one strictly necessary cookie (`hub_sid`) means no consent banner, and what would change that |
| [cookies/PRIVACY-POLICY.md](cookies/PRIVACY-POLICY.md) | Fill-in public privacy notice (GDPR arts. 13/14) for the operator, with a plain-language summary for teenagers |
| [gdpr/GDPR.md](gdpr/GDPR.md) | Overall GDPR guide: roles, legal bases, minors, rights, checklist |
| [gdpr/PROCESSING-REGISTER.md](gdpr/PROCESSING-REGISTER.md) | Record of processing activities (art. 30) |
| [gdpr/PROCEDURES.md](gdpr/PROCEDURES.md) | Operational procedures: data-subject requests, breaches, retention, moderation data |
| [gdpr/DPA-TEMPLATE.md](gdpr/DPA-TEMPLATE.md) | Data processing agreement template (art. 28) for hosting, email and other processors |
| [gdpr/DPIA.md](gdpr/DPIA.md) | Data protection impact assessment, important because users are minors |
| [cra/CRA.md](cra/CRA.md) | Cyber Resilience Act analysis: whether and how the CRA applies to this software |
| [cra/VULNERABILITY-POLICY.md](cra/VULNERABILITY-POLICY.md) | How vulnerabilities are reported, handled and disclosed |
| [DSA.md](DSA.md) | Digital Services Act analysis: hosting service, online platform, notice and action, minors, book listings |

## Launch checklist before opening to the public

- [ ] 1. **Operator identity.** Decide the legal entity or person that operates the service, and fill in `TITOLARE_NOME`, `TITOLARE_CONTATTO` and `DPO_CONTATTO` in `.env`; remove every `[bracket]` placeholder from `PRIVACY-POLICY.md`, `privacy.html` and `regole.html`.
- [ ] 2. **Legal review.** A lawyer (and the DPO, if appointed) has read the privacy notice, the rules and the DSA analysis, including the points marked **[VERIFY]**.
- [ ] 3. **Own domain over HTTPS.** `BASE_URL` starts with `https://`, `TRUST_PROXY` is set correctly behind the reverse proxy, and the `hub_sid` cookie shows `Secure; HttpOnly; SameSite=Lax` in the browser.
- [ ] 4. **Processors and data location.** Data processing agreements signed with the hosting and email providers ([gdpr/DPA-TEMPLATE.md](gdpr/DPA-TEMPLATE.md)); data stored in the EU/EEA; providers named in the privacy notice.
- [ ] 5. **GDPR paper trail.** Processing register ([gdpr/PROCESSING-REGISTER.md](gdpr/PROCESSING-REGISTER.md)) and DPIA ([gdpr/DPIA.md](gdpr/DPIA.md)) completed; procedures for access, deletion and breaches ([gdpr/PROCEDURES.md](gdpr/PROCEDURES.md)) assigned to named people.
- [ ] 6. **Retention is real.** `.env` values match the notice (3 days unverified, 12 months inactive, 14-day sessions, 30-day backups) and the automatic clean-up jobs, including the 90-day purge of resolved reports and log rotation, have been tested.
- [ ] 7. **Moderation and DSA basics.** Report button works end to end; a named human reads the abuse / DSA contact; admins trained; statement of reasons sent on removals; escalation path for illegal content ([DSA.md](DSA.md)).
- [ ] 8. **Minors.** Age 14+ statement in sign-up; parental-consent route decided for under 14s (or explicitly refused); school-admin powers explained to students; no ads, no analytics, no public profiles.
- [ ] 9. **Cookie and request check.** Run the browser check in [cookies/COOKIE-POLICY.md](cookies/COOKIE-POLICY.md): only own-domain requests and only `hub_sid`. Re-run if analytics, payments or embeds are ever added, and update the notice and CSP.
- [ ] 10. **Security and open-source duties.** Backups and restore tested; dependencies updated; vulnerability contact published ([cra/VULNERABILITY-POLICY.md](cra/VULNERABILITY-POLICY.md)); CRA position recorded ([cra/CRA.md](cra/CRA.md)); AGPL source link visible in the footer (`SOURCE_URL`).

If you add payments, hosted subscriptions with billing, sponsorship tags or the book commission, go back to items 2, 4, 9 and the DSA marketplace section before enabling them.
