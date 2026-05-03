# KindnessConnect

## App Purpose

KindnessConnect is a school-safe, mobile-first social platform for students to share anonymous support messages and kindness acts within their school community. Students join via a school-specific join code and receive a randomly generated anonymous nickname (e.g. "BraveOtter"). They can post support messages, log acts of kindness, comment on posts, and earn a kindness score. School administrators can moderate content through a reporting and moderation dashboard.

**Core values baked into the design:**
- Every student is anonymous — nicknames never reveal real identity
- No direct messaging between students — ever
- No photo uploads — text only
- All content is school-scoped — students only see posts from their own school
- Moderation is first-class — reporting and admin review built into the MVP

---

## Architecture

### Monorepo Structure

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

### Tech Stack (100% Open Source, Cloud Agnostic)

| Layer | Technology | Notes |
|---|---|---|
| Mobile | Expo (React Native) | Open source, runs on iOS/Android/web |
| API | Express 5 | Open source Node.js framework |
| Database | PostgreSQL | Open source, self-hostable anywhere |
| ORM | Drizzle ORM | Open source, type-safe |
| Auth | JWT + bcrypt | Open source, no vendor lock-in |
| Validation | Zod v4 + drizzle-zod | Open source schema validation |
| API Contract | OpenAPI 3.1 + Orval codegen | Open source spec-driven codegen |
| Monorepo | pnpm workspaces | Open source package manager |

### Authentication

- **Students**: Register with school join code + password → assigned a random anonymous nickname → receive a JWT
- **Admins**: Login with credentials → receive a JWT with `role: admin`
- **JWT** is stored in AsyncStorage on mobile (no cookies)
- All API routes require a valid JWT; school-scoped routes verify `school_id` matches the token

### Kindness Score Engine

Points are awarded automatically:
- +5 when a student posts a `kindness_act`
- +1 when a student's post receives a like
- +2 when a student's post receives a comment

Scores are stored as a running total on the `users` table (`kindness_score` integer column).

### Moderation Flow

1. Any student can report a post or comment
2. Reports enter the `reports` table with status `pending`
3. Admin views pending reports via the moderation dashboard
4. Admin can: mark reviewed, hide the content, or suspend the student

---

## Database Schema

All tables are in PostgreSQL managed by Drizzle ORM.

| Table | Purpose |
|---|---|
| `schools` | School records with unique join codes |
| `users` | Student + admin profiles with anonymous nicknames |
| `posts` | Support posts and kindness act posts (text only) |
| `comments` | Text comments on posts |
| `reports` | Moderation reports on posts or comments |

---

## Coding Conventions

### General
- TypeScript strict mode throughout
- Never use `console.log` in server code — use `req.log` in route handlers, `logger` singleton elsewhere
- All new shared types go in `lib/db` (Drizzle types) or `lib/api-zod` (generated Zod types)
- Never import across artifacts — use shared `lib/*` packages

### API Server
- All routes live in `artifacts/api-server/src/routes/`
- Each feature domain gets its own file (e.g. `auth.ts`, `posts.ts`, `comments.ts`)
- All inputs validated with Zod schemas from `@workspace/api-zod`
- All DB queries go through Drizzle — no raw SQL except for complex aggregations
- Errors use structured JSON: `{ error: string, code?: string }`

### Mobile App
- **Startup shim**: `artifacts/mobile/scripts/start.js` binds port 18115 instantly (health-check passes in <1 s), then starts Metro on port 18116 and transparently proxies HTTP + WebSocket once Metro is ready. This is required because Replit's health-check fires before Metro can compile its first bundle.
- Expo Router for file-based navigation
- AuthContext wraps the app and exposes `user`, `token`, `login`, `logout`, `refreshUser`
  - On app boot: restores JWT from AsyncStorage, then fetches `/api/auth/me` to hydrate current user (including role)
  - User is persisted to `kc_user` in AsyncStorage so admin tab survives app restart
- API calls use React Query hooks from `@workspace/api-client-react`
- `setBaseUrl` + `setAuthTokenGetter` configured at module level in `app/_layout.tsx`
- Navigation: auth guard in root layout redirects unauthenticated users to login
- Screens:
  - `(auth)/login` — nickname + schoolId + password login
  - `(auth)/register` — join code + password, shows assigned nickname on success
  - `(tabs)/index` — feed with filter chips (All/Support/Kindness)
  - `(tabs)/new-post` — create post (support or kindness act)
  - `(tabs)/profile` — user profile, kindness score, milestone rank, own posts list, avatar picker (36 emoji via PATCH /api/auth/me)
  - `(tabs)/admin` — moderation dashboard (admin-role-gated, hidden from students)
  - `post/[id]` — post detail with comments + comment input
- Components: PostCard, CommentItem, KindnessScore, ReportModal, EmptyState
- Tab bar: NativeTabs (iOS 26 liquid glass) with classic BlurView fallback
- Never store sensitive user data beyond the JWT token
- All screens must work without an internet connection gracefully (empty states)

### OpenAPI
- Single source of truth: `lib/api-spec/openapi.yaml`
- After any spec change, run codegen: `pnpm --filter @workspace/api-spec run codegen`
- Never edit generated files in `lib/api-client-react/src/generated/` or `lib/api-zod/src/generated/`

---

## Safety Rules (Non-Negotiable)

These rules exist to protect students. They must never be removed or bypassed:

1. **No Direct Messages** — There must be no endpoint, UI element, or data model that allows one student to send a private message to another. No `messages` table, no DM routes, no chat UI.

2. **No Photo Uploads** — There must be no file upload endpoint, no image URL field in any post/comment schema, no camera or image picker in the mobile app UI.

3. **Anonymous Nicknames Only** — Usernames are system-assigned adjective-animal combinations (e.g. "BraveOtter"). Students cannot choose their own nickname. Real names must never be stored or displayed.

4. **School Scoping** — Every post and comment query must filter by `school_id` from the authenticated user's JWT. Students must never see content from other schools.

5. **Content Length Limits** — Posts: max 500 characters. Comments: max 300 characters. Enforced at the API (Zod) and database (check constraint) levels.

6. **Moderation by Default** — Reporting is always available on every post and comment. Admins have a dashboard. Suspended users cannot post or comment.

7. **Age-Appropriate Content** — No profanity filter is built in at MVP, but the moderation system is designed to catch and remove harmful content quickly.

---

## Key Commands

```bash
# Full typecheck across all packages
pnpm run typecheck

# Build all packages
pnpm run build

# Push DB schema changes to PostgreSQL (dev only)
pnpm --filter @workspace/db run push

# Regenerate API hooks and Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Run API server (managed by workflow, not manually)
pnpm --filter @workspace/api-server run dev

# Run mobile unit/integration tests (70 tests, all passing)
cd artifacts/mobile && pnpm test
```

## Testing

The mobile app has a Jest-based test suite under `artifacts/mobile/__tests__/` covering:

- **login.test.tsx** — Login screen form, validation, auth context
- **register.test.tsx** — Registration flow, school picker modal, validation
- **feed.test.tsx** — Feed screen, post cards, filter chips, empty/error states
- **new-post.test.tsx** — Post creation form, type selection, character count, validation
- **post-detail.test.tsx** — Post detail view, comments, comment submission
- **report-modal.test.tsx** — Report modal, reason selection, submission

**Test setup:** Uses `@testing-library/react` (RTL with DOM queries) instead of RNTL, because jest-expo/web renders via react-native-web which produces HTML elements. The mock for `@workspace/api-client-react` lives in `artifacts/mobile/__mocks__/`.

Key patterns:
- `fireEvent.click` for TouchableOpacity (renders as `<div tabindex="0">`)
- `fireEvent.change(el, { target: { value } })` for TextInput (renders as `<input>`)
- `getAllByText(...).at(-1)` when the same text appears in parent+child elements

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs (min 32 chars) |
| `PORT` | Yes | Port for the API server (set by workflow) |
