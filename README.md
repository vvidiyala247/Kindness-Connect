# KindnessConnect

[![CI / Gate](https://img.shields.io/github/actions/workflow/status/vvidiyala247/kindness-connect/ci.yml?job=gate&label=CI%20%2F%20Gate&logo=githubactions)](https://github.com/vvidiyala247/kindness-connect/actions/workflows/ci.yml?query=job%3Agate)
[![Mobile Tests](https://img.shields.io/github/actions/workflow/status/vvidiyala247/kindness-connect/ci.yml?job=test-mobile&label=Mobile%20Tests&logo=expo)](https://github.com/vvidiyala247/kindness-connect/actions/workflows/ci.yml?query=job%3Atest-mobile)
[![API Tests](https://img.shields.io/github/actions/workflow/status/vvidiyala247/kindness-connect/ci.yml?job=test-api&label=API%20Tests&logo=node.js)](https://github.com/vvidiyala247/kindness-connect/actions/workflows/ci.yml?query=job%3Atest-api)
[![Type Check](https://img.shields.io/github/actions/workflow/status/vvidiyala247/kindness-connect/ci.yml?job=typecheck&label=Type%20Check&logo=typescript)](https://github.com/vvidiyala247/kindness-connect/actions/workflows/ci.yml?query=job%3Atypecheck)
[![Coverage](https://codecov.io/gh/vvidiyala247/kindness-connect/branch/main/graph/badge.svg)](https://codecov.io/gh/vvidiyala247/kindness-connect)

A school-safe, mobile-first social platform for students to share anonymous support messages and kindness acts within their school community.

## CI Jobs

| Badge | Job ID | Workflow file | Trigger |
|---|---|---|---|
| **CI / Gate** | `gate` | `.github/workflows/ci.yml` | Runs after all jobs; required check for branch protection |
| Mobile Tests | `test-mobile` | `.github/workflows/ci.yml` | Changes to `artifacts/mobile/**` or shared libs |
| API Tests | `test-api` | `.github/workflows/ci.yml` | Changes to `artifacts/api-server/**` or shared libs |
| Type Check | `typecheck` | `.github/workflows/ci.yml` | Changes to any package |
| Coverage | — (Codecov) | `.github/workflows/ci.yml` | Uploaded by `test-mobile` and `test-api` jobs |

> **One-time setup:** Add a `CODECOV_TOKEN` secret in **Settings → Secrets and variables → Actions** in your GitHub repository. Obtain the token from [codecov.io](https://codecov.io) after connecting your repository. The badge will display "unknown" until the first successful upload.

## Branch Protection

Branch protection on `main` ensures no PR can be merged unless:

1. All required CI jobs pass (or are skipped), **and**
2. At least **1 approving review** has been submitted by another team member.

### One-time setup (requires GitHub CLI)

```bash
# Authenticate if needed
gh auth login

# Apply protection rules (auto-detects repo from git remote)
bash .github/protect-main.sh
```

> **Warning:** The script uses a full `PUT` replace, not a partial update.
> It will **overwrite** the entire protection ruleset — including any existing
> PR review settings and push-restriction rules — replacing them with the values
> configured in the script payload. Edit the payload before running if you need
> different defaults, or re-apply changes manually in **Settings → Branches** afterwards.

This script calls the GitHub REST API to configure the following rules:

**Required status checks** (CI must pass before merge):

| GitHub check context | CI job ID | Triggered by |
|---|---|---|
| `CI / Gate` | `gate` | every PR, always |

The `gate` job always runs on every PR. It passes only when the three
path-filtered jobs (`test-mobile`, `test-api`, `typecheck`) all resulted in
`success` or `skipped`. It fails if any of them failed or were cancelled.

This means branch protection works correctly even on PRs that touch only docs or
config files — where all three path-filtered jobs are skipped and no individual
check would otherwise appear.

**Required pull request reviews:**

| Setting | Value |
|---|---|
| Required approving reviews | 1 |
| Dismiss stale reviews | `true` — pushing new commits resets existing approvals |
| Require code owner review | `true` — owners defined in `.github/CODEOWNERS` |
| Enforce for admins | `true` — repository admins are subject to the same rules |

**Push restrictions:**

Direct pushes to `main` are fully disabled — nobody (including admins) may push commits directly to the branch. Every change must arrive via a pull request and pass the review and CI requirements above. The `restrictions` field in the API payload is set to an empty allowlist (`users: [], teams: [], apps: []`), which is the strictest available setting.

If you ever need to grant a machine account (e.g. a release bot) the ability to push directly, add its GitHub username to the `"users"` array in the `restrictions` block inside `.github/protect-main.sh` before running the script, and document the reason here.

### CODEOWNERS

`.github/CODEOWNERS` defines which people must review changes to each area of
the codebase. GitHub automatically adds them as required reviewers when a PR
touches the matching paths:

| Path | Owner(s) |
|---|---|
| `*` (catch-all) | `@vvidiyala247` |
| `artifacts/mobile/` | `@vvidiyala247` |
| `artifacts/api-server/` | `@vvidiyala247` |
| `lib/` | `@vvidiyala247` |
| `.github/` | `@vvidiyala247` |

To change ownership, edit `.github/CODEOWNERS` directly — no need to re-run
`protect-main.sh` unless you also want to toggle `require_code_owner_reviews`.
Update the handles with team slugs (e.g. `@your-org/mobile-team`) as your
team grows to route reviews to the right people per area automatically.

### Manual setup via GitHub UI

1. Go to **Settings → Branches** in your GitHub repository.
2. Click **Add branch ruleset** (or **Add rule** on older UI) and set the target branch to `main`.
3. Enable **Require a pull request before merging** and set **Required approvals** to `1`.
4. Check **Dismiss stale pull request approvals when new commits are pushed**.
5. Enable **Require status checks to pass before merging**.
6. Search for and add this check:
   - `CI / Gate`
7. Optionally enable **Require branches to be up to date before merging** (the script sets `strict: true`).
8. Under **Restrict who can push to matching branches**, leave the allowlist empty so that nobody can push directly to `main` — all changes must go through a pull request.
9. Save the ruleset.

## Quick Start

```bash
# Install dependencies
pnpm install

# Full typecheck across all packages
pnpm run typecheck

# Run mobile tests
pnpm --filter @workspace/mobile test --ci

# Run API tests
pnpm --filter @workspace/api-server test

# Push DB schema changes (dev only)
pnpm --filter @workspace/db run push

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

## Architecture

```
artifacts/
  api-server/         # Express 5 backend API
  mobile/             # Expo React Native mobile app
lib/
  db/                 # Drizzle ORM schema + database client
  api-spec/           # OpenAPI spec + Orval codegen config
  api-client-react/   # Generated React Query hooks
  api-zod/            # Generated Zod validation schemas
```

See `replit.md` for full architecture documentation, coding conventions, and safety rules.
