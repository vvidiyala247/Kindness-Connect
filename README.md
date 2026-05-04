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

Branch protection on `main` ensures no PR can be merged if any of the three CI jobs fail.

### One-time setup (requires GitHub CLI)

```bash
# Authenticate if needed
gh auth login

# Apply protection rules (auto-detects repo from git remote)
bash .github/protect-main.sh
```

> **Warning:** The script uses a full `PUT` replace, not a partial update.
> It will **overwrite** the entire protection ruleset — including any existing
> pull-request review or push-restriction rules. Re-apply those manually in
> **Settings → Branches** after running, or edit the script payload first.

This script calls the GitHub REST API to mark the following as **required status checks**:

| GitHub check context | CI job ID | Triggered by |
|---|---|---|
| `CI / Mobile Test Suite` | `test-mobile` | `artifacts/mobile/**` or shared libs |
| `CI / API Server Tests` | `test-api` | `artifacts/api-server/**` or shared libs |
| `CI / Type Check` | `typecheck` | any package change |

> **Skipped jobs count as passing.** When a PR touches only the API server, the
> `test-mobile` job is skipped by the path filter — GitHub marks a skipped check
> as neutral, which satisfies a required-status-check rule. You do not need every
> job to run on every PR.

### Manual setup via GitHub UI

1. Go to **Settings → Branches** in your GitHub repository.
2. Click **Add branch ruleset** (or **Add rule** on older UI) and set the target branch to `main`.
3. Enable **Require status checks to pass before merging**.
4. Search for and add each of these checks:
   - `CI / Mobile Test Suite`
   - `CI / API Server Tests`
   - `CI / Type Check`
5. Optionally enable **Require branches to be up to date before merging** (the script sets `strict: true`).
6. Save the ruleset.

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
