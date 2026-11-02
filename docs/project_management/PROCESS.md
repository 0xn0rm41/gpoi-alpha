# Process

Back to [index](README.md).

## 1. Kanban board

Columns and WIP limits (sized for 2-4 people; adjust to team size, rule: WIP per person about 1-2).

| Column | WIP limit | Meaning |
|---|---|---|
| Backlog | none | Ideas and issues, unordered |
| Ready | 8 | Meets Definition of Ready, ordered by priority |
| In Progress | 3 | Someone is working on it (one assignee) |
| In Review | 3 | Pull request open, waiting review |
| Done | none | Meets Definition of Done; archive monthly |

Rules: pull, do not push; finish before starting; blocked items get a `blocked` label and a comment saying why; review the board weekly (15 minutes). Implement it with GitHub Projects ([../github/CHEATSHEET.md](../github/CHEATSHEET.md)).

## 2. Definition of Ready

- Problem and user value stated in 2-3 lines; linked issue exists.
- Acceptance criteria written and testable.
- Small enough to finish in a few days; otherwise split (see [WBS.md](WBS.md)).
- Privacy / security impact noted (does it add personal data? new input?).
- Dependencies identified; design or mock-up attached if UI.

## 3. Definition of Done

- Code merged to `main` through a reviewed pull request; CI green.
- Tests added or updated; manual check of the acceptance criteria.
- No new secrets, no new unreviewed dependency; `npm audit` reviewed.
- Docs and changelog updated; DB migration included and reversible where possible.
- All commits signed off (DCO) and files carry the SPDX header.
- Works for multi-school scoping (`school_id` checks, see ADR-0003).

## 4. Branching

Trunk-based with short-lived branches.

- `main`: always deployable, protected (PR + review + CI).
- Branch names: `feat/<short>`, `fix/<short>`, `docs/<short>`, `chore/<short>`, `release/x.y.z`, `hotfix/<short>`.
- Commit style: Conventional Commits (`feat:`, `fix:`, `docs:`...), with `Signed-off-by`.
- Squash-merge small PRs; delete the branch after merge.
- Details and commands: [../github/CHEATSHEET.md](../github/CHEATSHEET.md); PR template: [../github/templates/PULL_REQUEST.md](../github/templates/PULL_REQUEST.md).

## 5. Releases and versioning (SemVer)

Format `MAJOR.MINOR.PATCH`.

| Change | Bump | Example |
|---|---|---|
| Breaking change (API, config, DB needing manual action) | MAJOR | 1.4.2 to 2.0.0 |
| Backward-compatible feature | MINOR | 1.4.2 to 1.5.0 |
| Bug / security fix | PATCH | 1.4.2 to 1.4.3 |

- Before 1.0.0 anything may change; the pilot runs on `0.x`. Target `1.0.0` at public launch (phase 3, see [ROADMAP.md](ROADMAP.md)).
- Pre-releases: `1.0.0-rc.1`.
- Release steps: create `release/x.y.z`, update changelog and version, run tests, tag `vX.Y.Z`, create GitHub Release with notes, deploy, verify, announce. Rollback = redeploy previous tag and restore backup if a migration ran.
- Security fixes: patch release plus a GitHub security advisory.

## 6. Architecture Decision Records

Store as `docs/adr/NNNN-title.md` (or keep in this file while few). One decision per record; never edit history, supersede instead.

### Template

```markdown
# ADR-NNNN: Title
- Status: Proposed | Accepted | Superseded by ADR-XXXX
- Date: YYYY-MM-DD
- Deciders: names/roles

## Context
What forces are at play?

## Decision
What we decided.

## Consequences
Positive, negative, what to revisit and when.

## Alternatives considered
```

### ADR-0001: SQLite as the database

- Status: Accepted. Date: 2026-10-31 (documents an existing choice). Deciders: Tech Lead.
- **Context:** small team, low traffic per school, operation must be simple (single Node process, one file, easy backup) and cheap (one small VPS). See [../DATABASE.md](../DATABASE.md) and [../HOSTING.md](../HOSTING.md).
- **Decision:** use SQLite (WAL mode) with one server process per deployment.
- **Consequences:** + zero DB administration, trivial backup (copy file with the online backup API), fast for read-heavy loads. - One writer at a time; cannot run several app servers on one file; scaling means more servers (the model assumes one VPS per 10 schools, a technical guess to validate under load). Revisit if write contention appears or when above that threshold; keep data access in one layer to ease a move to PostgreSQL.
- **Alternatives:** PostgreSQL (more operations work, better concurrency), Supabase (the legacy prototype; external dependency, see [../legacy/consigli-supabase.md](../legacy/consigli-supabase.md)).

### ADR-0002: Server-side session cookies for authentication

- Status: Accepted. Date: 2026-10-31. Deciders: Tech Lead.
- **Context:** server-rendered/Express app, same-origin browser clients, users are minors, need simple revocation and low risk.
- **Decision:** opaque session ID in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie; session data stored server-side; CSRF protection on state-changing requests; email-confirmation sign-up restricted to the school's email domain; password hashing with a modern algorithm (argon2id or scrypt/bcrypt as implemented).
- **Consequences:** + easy logout and revocation, no tokens in JavaScript reach (XSS cannot read the cookie). - Server holds state (sessions table, must be backed up/expired); CSRF must be handled; mobile or third-party API clients would need a token mechanism later (new ADR).
- **Alternatives:** JWT in local storage (XSS-exposed, hard to revoke), JWT in cookies (same revocation issue), external identity provider (cost, data sharing).

### ADR-0003: Multi-school isolation via `school_id` scoping

- Status: Accepted. Date: 2026-10-31. Deciders: Tech Lead.
- **Context:** several schools share one deployment; each school's communities, content and users must be isolated; invite codes join users to a school-scoped community.
- **Decision:** a single database with a `school_id` column on school-owned tables; every query goes through data-access functions that require a `school_id` taken from the authenticated session (never from client input); tests assert cross-school access returns nothing; unique constraints include `school_id`.
- **Consequences:** + simple, cheap, one backup, easy onboarding of a new school. - A missed `WHERE school_id = ?` is a data leak across schools (high impact, see risk R1 in [RISK_REGISTER.md](RISK_REGISTER.md)); mitigate with review checklist (Definition of Done), tests, and possibly SQLite views/helpers. Exporting or deleting one school's data needs scoped queries; a school can be split into its own database file if it demands stricter isolation.
- **Alternatives:** one SQLite file per school (strong isolation, more operations, cross-school features harder), one deployment per school (strongest, most expensive).
