# Operating procedures: data subject rights, breaches, moderation

> **DRAFT: needs DPO / lawyer review. This is not legal advice.**
> For the operator and anyone who runs the service. Under model B (school as controller) share it with the school's DPO and follow the DPA ([DPA-TEMPLATE.md](DPA-TEMPLATE.md)). Related: [GDPR.md](GDPR.md) · [PROCESSING-REGISTER.md](PROCESSING-REGISTER.md) · [DPIA.md](DPIA.md).

## A. Data subject requests (arts. 15-22 GDPR)

**Deadline:** reply **within one month** of receipt (art. 12.3); extendable by two further months for complex requests, informing the person within the first month. Free of charge, except for manifestly unfounded or excessive requests.
**Where they arrive:** the privacy contact email (`TITOLARE_CONTATTO`). Under model B, forward to the school without delay (the processor must assist, art. 28.3.e). School admins do **not** handle requests themselves: if a student asks them, they forward the request to the privacy contact.

### The user does almost everything alone

| Right | Where | If the user cannot |
|---|---|---|
| Access and copy (15, 20) | *Profile → Download my data* | Staff cannot generate the export for them: guide the user; if they cannot log in, see "Identity check" |
| Rectification (16) | *Profile → edit*; change password | |
| Erasure (17) | *Profile → Delete my account* | `npm run admin -- delete-user <email>` |
| Restriction (18) | none (manual) | The software has no "suspended" state. Note the request; if the user wants, delete the account. `logout-all` closes **all** sessions, not just theirs |
| Objection (21), withdrawal of consent (7.3) | none | Equivalent to deleting the account for consent-based processing |
| Complaint | Supervisory authority (Italy: [Garante](https://www.garanteprivacy.it)) | Mention it in the reply |

### Identity check
Reply **only to the registered email address**. If the request comes from another address or from a third party (parent, teacher, school), ask for confirmation from the data subject: do not delete or disclose data to unverified people. A parent of a minor may act for the child where national law allows: verify the relationship and the age case by case, with the DPO.

### Under-age accounts
If it emerges that a user is below the age of digital consent of their country (14 in Italy), delete the account and its content (`delete-user`), tell the user, and record it in the request log. Do not ask for more data than needed.

### Request log (keep)

| Request date | Who (email) | Right | Identity check | Reply date | Outcome / notes |
|---|---|---|---|---|---|
| | | | | | |

Do **not** copy deleted data into the log: it only proves a timely reply. Keep it 2 years (or as the DPO says).

### After restoring a backup
A backup may contain accounts already erased. **After every restore**, re-read the erasure log and repeat `npm run admin -- delete-user <email>` for each.

---

## B. Personal data breach (arts. 33-34)

**What it is:** loss, theft, unauthorised access or disclosure of personal data (copied database, compromised server, lost backup, email sent to the wrong person, stolen admin account...).

### Steps (the first 72 hours matter)

1. **Detect and note the time.** The **72 hours** to notify the supervisory authority start when the controller becomes aware (art. 33.1). A processor must notify the controller **without undue delay** (art. 33.2).
2. **Alert** the operator's contact, the DPO (if any) and, under model B, the school. Do not wait for all the details.
3. **Contain:**
   - close all sessions: `npm run admin -- logout-all`;
   - change service passwords (server, SMTP) and revoke suspicious keys/access;
   - if an admin is involved: `npm run admin -- demote <email>`;
   - suspend an affected school if needed: `npm run admin -- school-suspend <school>`;
   - take the site offline if needed;
   - **do not delete** logs or evidence: copy them somewhere safe.
4. **Assess the risk** for data subjects (minors: treat risk as higher): which data (emails, names, classes, photos, password hashes), how many people, whether data were encrypted, how hard the scrypt hashes are to crack.
5. **The controller decides, with the DPO:**
   - **notify the supervisory authority within 72 hours** unless the breach is unlikely to result in a risk to rights and freedoms (Italy: online procedure of the Garante); if late, give the reasons;
   - **inform data subjects** without undue delay if the risk is **high** (art. 34): plain language, what happened, what to do (change passwords elsewhere if reused), whom to contact; consider informing parents of minors;
   - if the breach is cross-border, identify the lead supervisory authority with the DPO.
6. **Always record** the breach, even if not notified (art. 33.5): form below.
7. **Fix and learn:** correct the cause, update this procedure, inform providers if relevant.

### Breach record

| Field | |
|---|---|
| Date/time of discovery | |
| Who discovered it | |
| What happened (facts) | |
| Data and people involved (categories and number) | |
| Possible consequences | |
| Containment measures | |
| Notification to authority (yes/no, date/time, reasons) | |
| Communication to data subjects (yes/no, date, how) | |
| Corrective actions | |

### Contacts to fill in

| Who | Name | Phone / email |
|---|---|---|
| Controller (operator) | | |
| DPO | | |
| IT contact | | |
| Hosting support | | |
| School contact (model B) | | |

---

## C. Moderation and safeguarding

- Reports appear in **Admin → Open reports** (each admin sees only their own school). Target: reply **within 48 working hours**.
- Remove content that breaks the rules (*Delete content*). Content about **bullying, threats, self-harm or other risks to a person** is escalated to the school's safeguarding contact and, in urgent cases, to the competent authorities; do not discuss it publicly.
- Photos with faces or data of third parties without consent: delete them and warn the author.
- Do not use user data for anything other than moderation.
- Resolved reports are deleted automatically after 90 days.

## D. Onboarding and offboarding a school

- **Onboarding:** the operator verifies who requests the school (official email or written confirmation from the school management), creates the school (`npm run admin -- school-create`), hands the invite code to the verified representative, appoints the admin(s) in writing, and, under model B, signs the [DPA](DPA-TEMPLATE.md) first.
- **Invite code leaked:** an admin or the operator generates a new code (admin panel or `school-code`).
- **Offboarding:** on termination, export or delete the community data as agreed (deletion within the DPA period, backups included after 30 days); record the date. `npm run admin -- school-delete <school> --yes` permanently deletes the school with all its users, content and photos (backups age out within 30 days); export first if the school asks for its data.
