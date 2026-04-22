# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the HSK Chinese Vocabulary Trainer — a premium web app with a React/Vite frontend and a secured Express API backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 + helmet + express-rate-limit
- **Auth**: Supabase (magic-link email, JWTs, RLS)
- **Payments**: Gumroad webhooks (premium subscription gating)
- **Database**: Replit PostgreSQL (profiles, saved_words, purchases tables)
- **Frontend**: React 18 + Vite + TanStack Query + Wouter + Framer Motion + shadcn/ui
- **Validation**: Zod (`zod/v4`)

## Project Structure

```text
workspace/
├── artifacts/
│   ├── api-server/          # Express API — auth, lessons, progress, webhooks
│   └── hsk-trainer/         # React + Vite frontend
├── lib/
│   ├── api-spec/            # OpenAPI spec + Orval codegen
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod schemas
│   └── db/                  # Drizzle ORM schema + DB connection
├── migrations/
│   └── 001_supabase_schema.sql  # profiles, saved_words, purchases + RLS
├── scripts/                 # Utility scripts
└── pnpm-workspace.yaml
```

## HSK Trainer — Feature Summary

### Access Model
- **ALL levels locked** for free users — premium gates everything (changed from HSK 1 being free)
- **HSK 1–6**: Premium only, words served from `GET /api/lessons?level=N` (requires valid Supabase JWT + `is_premium = true` in DB)

### Frontend (`artifacts/hsk-trainer`)
- **Pages**: MarketingPage (centered nav, About+Contact sections), PricingPage (`/pricing`), LandingPage (magic link+password auth with optional name on signup), AuthCallback, DashboardPage (`/dashboard` — unified learning hub), FlashcardPage, ReviewPage, QuizPage, PhrasesPage, StrokesPage, SettingsPage, MembershipPage (`/membership` — plan status, license activation, sync), AffiliatePage (`/affiliate` — referral code + link), MaintenancePage (`/maintenance` — standalone public), ChineseThemesPage (auth+premium-gated at `/chinese-themes`), AdminPage / AdminLoginPage
- **Removed/redirected**: ProgressPage (redirects to `/dashboard`), LevelSelection (`/levels` redirects to `/dashboard`)
- **Auth context**: `src/contexts/auth-context.tsx` — `AuthProvider` + `useAuth` hook
- **Components**: `NotificationBell.tsx` — bell icon with click-outside dropdown, empty state; shows in MobileTopbar (AppShell) and sidebar
- **Data hooks**: `use-profile.ts`, `use-saved-words.ts`, `use-study-prefs.ts`, `use-streak.ts`, `use-flashcard-position.ts`, `use-referral.ts`
  - `useStudyPrefs()` → `{ prefs: { showPinyin, autoPlay, lastLevel }, set }` — persisted to `hsk_study_prefs` in localStorage
  - `useStreak()` → `{ streak: { current_streak, longest_streak, last_active_date }, ping }` — calls `/api/streak/ping` on flashcard mount
  - `useFlashcardPosition(level)` → `{ savedPosition, savePosition }` — debounced auto-save of category + card index per level
  - `useReferral()` → `{ referralCode, referralCount }` — referral code + count of **purchase-attributed** referrals
- **Referral system** (`use-referral-capture.ts` + `lib/gumroad.ts`):
  - `captureReferralCode()` — reads `?ref=CODE` from URL, stores in localStorage (`hsk_ref`)
  - `getStoredReferralCode()` — returns stored code; used in all upgrade CTA hrefs
  - `buildGumroadUrl(code?)` — appends `?ref=CODE` to the `VITE_GUMROAD_URL` checkout URL
  - `ReferralCaptureEffect` component in `App.tsx` — captures on every route change
  - All upgrade links (Paywall, Sidebar, PricingPage, DashboardPage, DemoPage, LevelSelection, QuizPage, SettingsPage) use `buildGumroadUrl(getStoredReferralCode())`
  - Webhook parses `ref` back from Gumroad's `url_params` field and records purchase-attributed referral row
- **API layer**: `src/lib/api.ts` — `apiFetch` with Bearer token injection + `ApiError` class
- **Supabase client**: `src/lib/supabase.ts` — graceful no-op if secrets absent
- **Route guard**: `ProtectedPages` in `App.tsx` (redirects to `/app` if unauthenticated)
- **HSK data**: `src/data/hskData.ts` — HSK 1 only (188 lines); HSK 2–6 removed from frontend bundle
- **Study prefs wired**: FlashcardPage reads `prefs.showPinyin` → toggles pinyin on card front; `prefs.autoPlay` → auto-speaks word on card advance; updates `lastLevel` pref on mount

### API Server (`artifacts/api-server`)
- **app.ts**: helmet, CORS (restricted to `APP_URL`), rate limiter, routes at `/api`
- **Routes**:
  - `GET /api/healthz` — health check
  - `GET /api/me` — returns profile (auth required)
  - `POST /api/premium/sync` — syncs premium status from Gumroad purchases table
  - `GET /api/lessons?level=N` — serves word list (level 1 open; 2–6 require premium)
  - `POST /api/progress` — upsert word progress (auth required)
  - `GET /api/progress` — list user progress (auth required)
  - `GET /api/streak` — get current streak data (auth required)
  - `POST /api/streak/ping` — record study activity, update streak (idempotent per day)
  - `GET /api/flashcard-position?level=N` — get saved card position for a level (auth required)
  - `POST /api/flashcard-position` — save card position for a level (auth required)
  - `GET /api/referral` — get/generate referral code + count (auth required)
  - `POST /api/gumroad/webhook` — Gumroad ping validation + purchases insert
  - `GET /api/admin/users` — admin only, lists all profiles
- **Middleware**: `src/middleware/auth.ts` (verifyJwt, requirePremium), rate limiter
- **Supabase**: `src/supabase.ts` — service role client, logs warning if secrets absent

### Database Schema
- `profiles` — id (Supabase UID), email, is_premium, role ('user' | 'admin'), referral_code, timestamps
- `saved_words` — user_id, word_id, next_review, interval, ease_factor, reps (SRS)
- `purchases` — id, user_id, sale_id (Gumroad), buyer_email, product_permalink, price_cents, refunded, raw_payload (JSONB)
- `referrals` — referral_code, referrer_id, buyer_email, referred_id (nullable), sale_id (FK → purchases), status ('purchased'|'rewarded')
- `streaks` — user_id, current_streak, longest_streak, last_active_date
- `flashcard_positions` — user_id, level, category_index, card_index
- Row Level Security enabled on all tables; users only see their own rows

## Required Secrets (Replit Secrets)

| Secret | Used by | Purpose |
|--------|---------|---------|
| `SUPABASE_URL` | API server | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | API server | Admin key for JWT verification |
| `SUPABASE_ANON_KEY` | API server | Public key |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public anon key |
| `GUMROAD_WEBHOOK_SECRET` | API server | Validates Gumroad pings |
| `GUMROAD_PRODUCT_PERMALINK` | API server | Filters product-specific purchases |
| `APP_URL` | API server | Allowed CORS origin (e.g. `https://yourapp.replit.app`) |
| `VITE_GUMROAD_URL` | Frontend | Gumroad checkout link shown to users |

## Admin Panel

Accessible at `/admin` — requires `role = 'admin'` in the `profiles` table. Has its own layout (no sidebar). All actions are server-verified.

### Routes
- `/admin/login` — dedicated admin verification page (password-only; sets 60-min session)
- `/admin` — Dashboard (overview stats)
- `/admin/users` — User search + detail panel
- `/admin/purchases` — Purchase list with filter chips
- `/admin/logs` — Admin audit log with action filter
- `/admin/settings` — Env health + runtime settings editor

### Identity Verification
The admin panel is viewable in read-only mode once you're signed in as admin. To enable write actions (grant/revoke/link/settings), you must verify at `/admin/login` using email + password. Verification is stored in `sessionStorage` and expires after 60 minutes. The server independently verifies admin role on every API call regardless.

### Features
- **Dashboard**: 6 stat cards (total users, premium users, 7-day signups, 7-day purchases, refunds, unlinked purchases) + recent admin activity feed
- **Users**: partial email search (live, debounced), user list, click-to-expand detail panel with profile / premium / progress / purchases / audit log; Grant/Revoke/Link actions require reason + verified identity
- **Purchases**: list with filter chips (All / Paid / Refunded / Linked / Unlinked); shows linkage status and guidance
- **Logs**: admin log feed filtered by action type (grants, revokes, link, settings)
- **Config**: env health grid (true/false only — no secrets exposed); editable `app_settings` with allowlist enforcement and change logging

### Admin API Routes (all protected by `requireAuth + requireAdmin`)
- `GET /api/admin/overview` — dashboard aggregate stats
- `GET /api/admin/users?q=fragment` — user list with partial email search
- `GET /api/admin/users/:id` — full user detail by UUID
- `GET /api/admin/user?email=` — full user detail by email (legacy)
- `GET /api/admin/purchases?filter=all|paid|refunded|linked|unlinked`
- `POST /api/admin/grant-premium` — requires `reason` (400 if missing)
- `POST /api/admin/revoke-premium` — requires `reason` (400 if missing)
- `POST /api/admin/link-purchase` — links purchase; guards against re-linking
- `GET /api/admin/logs?user_id=&action=` — filtered admin log
- `GET /api/admin/config` — env health check (true/false only, no raw values)
- `GET /api/admin/settings` — list app_settings
- `POST /api/admin/settings` — update allowlisted key (logged)

### Admin Audit Log (`admin_logs` table)
Every grant, revoke, link, and setting change writes a row with admin user ID, target user ID, action name, required reason, and metadata JSON.

### Frontend file structure
```
src/pages/
  AdminLoginPage.tsx        — /admin/login (standalone, no AppShell)
  AdminPage.tsx             — /admin/* shell (tabs + auth guard)
  admin/
    adminTypes.ts           — shared TypeScript types
    adminUtils.tsx          — helpers: fmt, StatusBadge, isAdminVerified, etc.
    DashboardTab.tsx
    UsersTab.tsx            — UserListItem + UserDetailPanel
    PurchasesTab.tsx
    LogsTab.tsx
    ConfigTab.tsx
```

## Setup Checklist

1. Run `migrations/001_supabase_schema.sql` in Supabase SQL editor
2. Run `migrations/002_admin_tables.sql` in Supabase SQL editor
3. Run `migrations/003_password_auth_support.sql` in Supabase SQL editor
4. Run `migrations/004_admin_panel_upgrade.sql` in Supabase SQL editor (indexes + seed)
5. Run `migrations/005_ensure_profiles_backfill.sql` in Supabase SQL editor
6. Run `migrations/006_level_progress.sql` in Supabase SQL editor
7. Run `migrations/007_flashcard_resume.sql` in Supabase SQL editor (flashcard position table)
8. Run `migrations/008_streaks.sql` in Supabase SQL editor (daily streak table)
9. Run `migrations/009_referrals.sql` in Supabase SQL editor (adds `referral_code` to profiles)
10. Run `migrations/010_referrals_v2.sql` in Supabase SQL editor (purchase-attributed referrals table)
11. Run `migrations/011_profile_name.sql` in Supabase SQL editor (adds `name` column to profiles)
12. Set all secrets listed above in Replit Secrets
13. After first sign-in, promote yourself to admin: `UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL';`
14. Configure Gumroad webhook URL: `https://<APP_URL>/api/gumroad/webhook?secret=<GUMROAD_WEBHOOK_SECRET>`
15. Access admin panel at `<APP_URL>/admin` — verify at `/admin/login` to enable write actions

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` (`composite: true`). Run `pnpm run typecheck` from the root to type-check the full dependency graph.

## Root Scripts

- `pnpm run build` — typecheck + build all packages
- `pnpm run typecheck` — `tsc --build --emitDeclarationOnly`

## HSK Vocabulary Content

### API Access Rules
- **HSK 1**: Any authenticated user (free tier) — `GET /api/lessons?level=1` requires auth only
- **HSK 2–6**: Requires `is_premium = true` or `role = 'admin'` in the profiles table

### Word Counts per Level
| Level | Words | Categories |
|-------|-------|-----------|
| HSK 1 | 150   | 9 (Greetings, Family, Numbers, Animals, Food, Colors, Time, Actions, Places) |
| HSK 2 | 142   | 12 (Travel, Home, Food & Dining, Health, People, School, Work, Time, Actions, Feelings, Location, Grammar) |
| HSK 3 | 280   | 14 (Home, Nature, Travel, Food, Health, Shopping, Work, Education, Emotions, Technology, Time, Actions, Descriptions, Grammar) |
| HSK 4 | ~1,240 | 16 categories (full data) |
| HSK 5 | ~1,240 | 16 categories (full data) |
| HSK 6 | 2,406 | 20 categories (Academic & Scholarly, Classical Literature & Poetry, Politics & Governance, Law & Jurisprudence, Economics Advanced, Business & Management, Science & Innovation, Medicine & Biology, Culture & Heritage, History & Civilization, Society & Social Issues, Philosophy & Religion, Psychology & Behaviour, Language & Communication, Environment & Ecology, Geography & International Relations, Arts & Aesthetics, Technology & Digital Society, Military/Sports/Recreation, Idioms & Advanced Expressions) |

### Phrases Content
Static phrase data lives in `artifacts/hsk-trainer/src/data/phraseData.ts`.
- **HSK 1**: 6 categories — Greetings, Introductions, Food & Drink, Time, Shopping, Directions (~29 phrases)
- **HSK 2**: 6 categories — Travel, Restaurant, Health, Daily Life, School & Work, Shopping (~30 phrases)
- **HSK 3**: 6 categories — At Work, Travel, Health, Education, Daily Life, Shopping (~30 phrases)
- **HSK 4**: 6 categories — Business, Technology, Society, Health & Medicine, Arts & Culture, Environment (~30 phrases)
- **HSK 5**: 6 categories — Advanced Business, Government & Policy, Science & Research, Media & Communication, Education & Psychology, Environment & Health (~30 phrases)
- **HSK 6**: 6 categories — Academic & Philosophy, Politics & Law, Economics & Society, Culture & History, Science & Technology, Environment & International Affairs (~30 phrases)

### Phrases Page
Route: `/phrases/:level` (level-aware) — reads level from URL path param, displays categorized phrases with Chinese / pinyin / tap-to-reveal English translation. Also supports `/phrases` fallback to level 1.

## Word ID Format

Word IDs follow the pattern `hsk{level}-{category}{n}` (e.g. `hsk1-f1`, `hsk2-1`, `hsk3-ho1`). The ProgressPage parses the level from the id using `/^hsk(\d)/`.

New words from the CSV import use sequential zero-padded IDs: `hsk{N}-{4-digit}` (e.g. `hsk2-0001`). Homophones (same character, different pronunciation) use tone-aware pinyin slugs (e.g. `hsk3-de2`, `hsk3-dei3`). All 119 legacy IDs from hskData.ts are preserved exactly.

## Vocabulary Migration (Migration 016)

### Status
Vocabulary table schema defined — not yet created in Supabase (no `/pg/query` endpoint available). App runs on static fallback (`hskData.ts`, 151 HSK1 words) until table is created and seeded.

### Files
| File | Purpose |
|------|---------|
| `artifacts/api-server/migrations/016_vocabulary.sql` | Full DDL — run in Supabase SQL Editor |
| `artifacts/api-server/scripts/transform-csv.cjs` | Transforms CSV → seed JSON |
| `artifacts/api-server/scripts/vocabulary_seed.json` | 5,427-row seed dataset (pre-generated) |
| `artifacts/api-server/src/lib/vocabularyService.ts` | Supabase-first + static fallback |

### Database Schema (vocabulary table)
- `id TEXT PRIMARY KEY` — stable, human-readable
- `hsk_level SMALLINT` — 1–6
- `hanzi TEXT` — Chinese characters (API maps to `word` for frontend compat)
- `pinyin TEXT` — tone-marked pronunciation
- `meaning TEXT` — full English translation
- `meaning_short TEXT` — ≤30 char display label
- `word_type TEXT` — primary grammar type (noun/verb/adjective/adverb/…)
- `word_types TEXT[]` — all grammar types (polysemy: ["noun","verb"])
- `topic_category TEXT` — semantic group (Greetings/Food/… — null for CSV words)
- `search_vector TSVECTOR` — full-text search, GIN indexed
- `image_url`, `image_alt` — optional media

### Activation Steps
1. Run `artifacts/api-server/migrations/016_vocabulary.sql` in Supabase SQL Editor
2. Call `POST /api/admin/seed-vocabulary` to load all 5,427 words
3. Optionally preview first: `POST /api/admin/seed-vocabulary?dry=1`

### Admin Endpoints
- `POST /api/admin/seed-vocabulary` — seed from `vocabulary_seed.json` (5,427 words)
- `POST /api/admin/seed-vocabulary?legacy=1` — seed from `hskData.ts` (151 words)
- `POST /api/admin/seed-vocabulary?dry=1` — preview counts only
- `POST /api/admin/import-vocabulary` — body: `SeedRow[]` for incremental updates
- `POST /api/admin/invalidate-vocabulary-cache` — clear in-memory cache

### CSV Dataset Summary (hanplayvocab_clean.csv)
| Level | Words | Notes |
|-------|-------|-------|
| HSK 1 | 300 | 119 matched to existing IDs; 32 legacy-only kept as inactive |
| HSK 2 | 200 | All new |
| HSK 3 | 500 | 12 homophones (得 de/děi, 只 zhǐ/zhī etc.) |
| HSK 4 | 999 | |
| HSK 5 | 1,599 | |
| HSK 6 | 1,797 | |
| **Total** | **5,427** | **Zero duplicate IDs** |

Category column in CSV = grammar types only (Noun/Verb/Adjective…). No semantic topic column. `topic_category` field populated only for the 119 carried-over legacy words.
