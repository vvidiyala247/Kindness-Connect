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
