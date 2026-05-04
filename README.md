# KindnessConnect

[![Mobile Tests](https://img.shields.io/github/actions/workflow/status/vvidiyala247/kindness-connect/ci.yml?job=test-mobile&label=Mobile%20Tests&logo=expo)](https://github.com/vvidiyala247/kindness-connect/actions/workflows/ci.yml?query=job%3Atest-mobile)
[![API Tests](https://img.shields.io/github/actions/workflow/status/vvidiyala247/kindness-connect/ci.yml?job=test-api&label=API%20Tests&logo=node.js)](https://github.com/vvidiyala247/kindness-connect/actions/workflows/ci.yml?query=job%3Atest-api)
[![Type Check](https://img.shields.io/github/actions/workflow/status/vvidiyala247/kindness-connect/ci.yml?job=typecheck&label=Type%20Check&logo=typescript)](https://github.com/vvidiyala247/kindness-connect/actions/workflows/ci.yml?query=job%3Atypecheck)

A school-safe, mobile-first social platform for students to share anonymous support messages and kindness acts within their school community.

## CI Jobs

| Badge | Job ID | Workflow file | Trigger |
|---|---|---|---|
| Mobile Tests | `test-mobile` | `.github/workflows/ci.yml` | Changes to `artifacts/mobile/**` or shared libs |
| API Tests | `test-api` | `.github/workflows/ci.yml` | Changes to `artifacts/api-server/**` or shared libs |
| Type Check | `typecheck` | `.github/workflows/ci.yml` | Changes to any package |

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
| `CI / Mobile Test Suite` | `test-mobile` | `artifacts/mobile/**` or shared libs |
| `CI / API Server Tests` | `test-api` | `artifacts/api-server/**` or shared libs |
| `CI / Type Check` | `typecheck` | any package change |

> **Skipped jobs count as passing.** When a PR touches only the API server, the
> `test-mobile` job is skipped by the path filter — GitHub marks a skipped check
> as neutral, which satisfies a required-status-check rule. You do not need every
> job to run on every PR.

**Required pull request reviews:**

| Setting | Value |
|---|---|
| Required approving reviews | 1 |
| Dismiss stale reviews | `true` — pushing new commits resets existing approvals |
| Require code owner review | `false` (see CODEOWNERS below) |

### Configuring CODEOWNERS (optional)

If you want specific people or teams to be required reviewers for certain paths,
create a `.github/CODEOWNERS` file. For example:

```
# All files — any one of these people must approve
*   @your-org/mobile-team

# API changes must also be approved by a backend owner
artifacts/api-server/   @your-org/backend-team
```

Then set `require_code_owner_reviews` to `true` in `.github/protect-main.sh` and re-run the script.

### Manual setup via GitHub UI

1. Go to **Settings → Branches** in your GitHub repository.
2. Click **Add branch ruleset** (or **Add rule** on older UI) and set the target branch to `main`.
3. Enable **Require a pull request before merging** and set **Required approvals** to `1`.
4. Check **Dismiss stale pull request approvals when new commits are pushed**.
5. Enable **Require status checks to pass before merging**.
6. Search for and add each of these checks:
   - `CI / Mobile Test Suite`
   - `CI / API Server Tests`
   - `CI / Type Check`
7. Optionally enable **Require branches to be up to date before merging** (the script sets `strict: true`).
8. Save the ruleset.

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
