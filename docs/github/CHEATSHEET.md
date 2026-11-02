# GitHub cheat sheet

Back to [index](README.md). Menu names can change; check GitHub docs when a button is missing.

## 1. Git basics

| Task | Command |
|---|---|
| Clone | `git clone https://github.com/OWNER/REPO.git` |
| Status / diff | `git status`, `git diff`, `git diff --staged` |
| Stage and commit | `git add -p` then `git commit -s -m "feat: add poll results"` |
| Log | `git log --oneline --graph --decorate -20` |
| New branch | `git switch -c feat/idea-threshold` |
| Switch | `git switch main` |
| Update from remote | `git fetch origin` then `git pull --ff-only` |
| Push new branch | `git push -u origin feat/idea-threshold` |
| Rebase on main | `git fetch origin && git rebase origin/main` |
| Undo unstaged file | `git restore FILE` |
| Unstage | `git restore --staged FILE` |
| Amend last commit (not yet pushed) | `git commit --amend` |
| Revert a pushed commit | `git revert COMMIT` |
| Stash | `git stash push -m "wip"`, `git stash pop` |
| Tag | `git tag -a v0.2.0 -m "v0.2.0"`, `git push origin v0.2.0` |
| Delete merged branch | `git branch -d NAME`, `git push origin --delete NAME` |
| Find a bug commit | `git bisect start`, `git bisect bad`, `git bisect good TAG` |

Rules: never `git push --force` to `main`; use `--force-with-lease` only on your own branch; never commit secrets (`.env`, keys, `data/*.sqlite`); if one leaks, rotate it, history rewrite is not enough.

## 2. Branching

Trunk-based: short-lived branches from `main`, names `feat/`, `fix/`, `docs/`, `chore/`, `hotfix/`. See [../project_management/PROCESS.md](../project_management/PROCESS.md).

Fork workflow (outside contributors): fork, `git remote add upstream URL`, branch, push to the fork, open the PR to upstream; sync with `git fetch upstream && git rebase upstream/main`.

## 3. Pull requests

1. Small PR, one purpose, linked issue (`Closes #12`).
2. Fill the template: [templates/PULL_REQUEST.md](templates/PULL_REQUEST.md).
3. Draft PR for early feedback; mark ready when CI is green.
4. At least one review; address comments with new commits, resolve threads.
5. Merge: squash for small changes, rebase-merge for clean series, merge commit rarely.
6. Delete the branch.

Review checklist: correctness, tests, `school_id` scoping, input validation, no secrets, docs, DCO sign-off.

## 4. Issues and labels

Templates: [templates/ISSUE_BUG.md](templates/ISSUE_BUG.md), [templates/ISSUE_FEATURE.md](templates/ISSUE_FEATURE.md).

Suggested labels:

| Group | Labels |
|---|---|
| Type | `bug`, `feature`, `docs`, `chore`, `security` |
| Priority | `P0-critical`, `P1-high`, `P2-normal`, `P3-low` |
| Status | `blocked`, `needs-info`, `needs-design`, `wontfix`, `duplicate` |
| Community | `good first issue`, `help wanted` |
| Area | `area:events`, `area:ideas`, `area:polls`, `area:notes`, `area:books`, `area:auth`, `area:infra` |

Keywords in PR/commit text: `Closes #N`, `Fixes #N`, `Refs #N`. Milestones map to roadmap phases ([../project_management/ROADMAP.md](../project_management/ROADMAP.md)). Projects (board view) implement the Kanban columns.

## 5. GitHub Actions

Workflow file: `.github/workflows/ci.yml`.

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test --if-present
      - run: npm audit --audit-level=high
```

Good practice: least-privilege `permissions`, pin third-party actions to a full commit SHA (Dependabot can update them), never print secrets, use environments with required reviewers for deploys, avoid `pull_request_target` with untrusted code. Verify current action versions before copying.

## 6. Branch protection (or rulesets)

Settings, Branches (or Rules), for `main`:

- Require a pull request before merging, at least 1 approval, dismiss stale approvals, require review from code owners.
- Require status checks (CI) and branches up to date.
- Require conversation resolution; require signed commits if the team uses them.
- Block force pushes and deletions; include administrators.
- Optional: require linear history. Note a solo maintainer cannot approve their own PR; set approvals to 0 while solo but keep required checks.

## 7. Dependabot

`.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

Enable Dependabot alerts and security updates in Settings, Code security. Review each PR; merge only with CI green. Relevant to supply-chain risk R11 in [../project_management/RISK_REGISTER.md](../project_management/RISK_REGISTER.md).

## 8. Security: advisories and private vulnerability reporting

- Enable **Private vulnerability reporting** (Settings, Code security) so reporters can disclose privately via the Security tab.
- Add `SECURITY.md` pointing to it and to [../eu/cra/VULNERABILITY-POLICY.md](../eu/cra/VULNERABILITY-POLICY.md).
- Triage a report, create a **draft security advisory** (Security, Advisories), work in the temporary private fork, request a CVE if appropriate, publish the advisory with the patched release.
- Also enable secret scanning and push protection, and code scanning (CodeQL) if available for the repository.

## 9. Releases

1. Update changelog and version (SemVer, see [../project_management/PROCESS.md](../project_management/PROCESS.md)).
2. Tag `vX.Y.Z` on `main`.
3. Releases, Draft a new release, choose the tag, generate release notes, mark pre-release for `-rc`.
4. Attach artifacts or the SBOM ([../eu/cra/sbom.cdx.json](../eu/cra/sbom.cdx.json)) if useful.
5. CLI: `gh release create v0.2.0 --generate-notes`.

## 10. CODEOWNERS

File `.github/CODEOWNERS` (last matching pattern wins):

```
*                   @0xn0rm41
/docs/economy_finance/  @FINANCE-LEAD
/docs/eu/           @LEGAL-LEAD
/db/ /migrations/   @TECH-LEAD
/.github/           @TECH-LEAD
```

Replace the placeholders with real GitHub handles or teams. Pair with "Require review from Code Owners" in branch protection.

## 11. DCO sign-off

The Developer Certificate of Origin certifies you may submit the code under the project licence (AGPL-3.0-or-later). It is not a CLA: see [../economy_finance/LICENSING_STRATEGY.md](../economy_finance/LICENSING_STRATEGY.md).

- Sign a commit: `git commit -s -m "fix: escape note title"` adds `Signed-off-by: Name <email>` (name and email from `git config`).
- Sign all commits of a branch: `git rebase --signoff origin/main`; fix the last one: `git commit --amend -s --no-edit`.
- Enforce with the DCO GitHub App or a CI check that every commit has the trailer.
- Signed-off is not the same as cryptographically signed (`-S`, GPG/SSH); you may use both.

## 12. gh CLI

| Task | Command |
|---|---|
| Login | `gh auth login` |
| Clone | `gh repo clone OWNER/REPO` |
| Create issue | `gh issue create --title "..." --body "..." --label bug` |
| List issues | `gh issue list --label "good first issue"` |
| Create PR | `gh pr create --fill --draft` |
| Check out a PR | `gh pr checkout 42` |
| PR status and checks | `gh pr status`, `gh pr checks` |
| Review and merge | `gh pr review --approve`, `gh pr merge --squash --delete-branch` |
| Run workflows | `gh run list`, `gh run watch`, `gh workflow run ci.yml` |
| Release | `gh release create v0.2.0 --generate-notes` |
| Raw API | `gh api repos/OWNER/REPO/branches/main/protection` |
| Labels | `gh label create "area:books" --color 0E8A16` |
