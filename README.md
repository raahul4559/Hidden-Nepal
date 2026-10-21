# Hidden Nepal

> Discover the Nepal beyond the ordinary.

A tourism discovery platform for hidden waterfalls, remote villages, Himalayan
lakes, trekking routes, cultural heritage, regional food and local experiences
in Nepal.

This repository is a single Next.js application (modular monolith). There is no
separate API server.

## Stack

| Concern    | Choice                                                   |
| ---------- | -------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Cache Components, Turbopack)     |
| Language   | TypeScript (strict)                                      |
| Styling    | Tailwind CSS v4, shadcn/ui (Base UI), Lucide icons       |
| Data       | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`)           |
| Validation | Zod                                                      |
| Auth       | Auth.js v5 (Credentials, encrypted JWT cookie), scrypt   |
| Tests      | Vitest + Testing Library (unit), Playwright (end-to-end) |

## Getting started

Requirements: Node.js `^20.19 || ^22.12 || >=24`, npm, and PostgreSQL 14+
(optional for UI-only work).

```bash
npm install            # also runs `prisma generate`
cp .env.example .env   # then edit DATABASE_URL and AUTH_SECRET
npm run dev            # http://localhost:3000
```

Without `DATABASE_URL`, the site still runs. Destination sections show an
empty state, plus a "no database connected" hint in development.

## Database

### 1. PostgreSQL

Use a database dedicated to Hidden Nepal. **Do not share a database with
another application:** Prisma tracks history in `_prisma_migrations`, and
foreign tables such as another app's `User` would collide.

**Local (Homebrew):**

```bash
brew services start postgresql@17
createdb hidden_nepal
createdb hidden_nepal_test   # only for integration tests
```

**Hosted (e.g. Neon):** create a separate database or branch for this project,
and copy its connection string from the provider's dashboard.

### 2. `DATABASE_URL`

Set it in `.env`. The file is git-ignored; never commit credentials.

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/hidden_nepal"
# Hosted providers usually need TLS:
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

- The scheme must be `postgresql://` or `postgres://`. Python-style URLs such
  as `postgresql+psycopg://` are rejected with an explanatory error.
- For Neon, use the **direct** host (no `-pooler`) for migrations. Neon
  recommends direct connections for schema changes.
- The URL is read only on the server (`src/lib/env.ts` and `src/lib/db.ts`,
  both `server-only`). It is never sent to the browser, and there are no
  `NEXT_PUBLIC_` variables.

### 3. Generate the client, migrate, seed

```bash
npm run db:generate    # prisma generate (also runs on install and build)
npm run db:migrate     # development: apply migrations, create new ones from schema changes
npm run db:seed        # reference data, researched destination records and optional samples
```

In production or CI, apply committed migrations without creating new ones:

```bash
npm run db:deploy      # prisma migrate deploy
SEED_SAMPLE_DATA=false npm run db:seed   # reference and researched data; no development samples
```

The seed is **idempotent**. Rows are upserted by slug and a destination's
categories, images and seasons are replaced, so re-running never duplicates.
Editor-supplied Instagram references and places in
[`data/instagram-references.json`](./data/instagram-references.json) are also
imported by default through the same idempotent importer as
`npm run data:instagram`; set `SEED_INSTAGRAM_DATA=false` to skip them.

The researched catalogue in [`data/nepal-tourism-destinations.json`](./data/nepal-tourism-destinations.json)
is imported and published by default so the full 59-record inventory is
available through Explore and province pages. Publication makes the sourced
destination entries discoverable; it does not certify every detail.
Practical information remains `UNVERIFIED` until an editor verifies it, so
coordinates, seasons, activities and access advice are not presented as
confirmed visitor guidance. Six destinations are curated for the homepage
feature section.
`SEED_RESEARCHED_DATA=false` skips the researched catalogue. When development
samples are enabled, researched records with the same slug as an existing
sample are left untouched to preserve that sample content.
Selected Wikimedia Commons photos are bundled as size-limited local assets so
the website does not depend on Commons availability or rate limits at runtime.
Each image retains its Commons source link, license and author attribution.
The researched destination catalogue has a curated photo for all 59
destinations; entries without a directly relevant verified photo use the
designed fallback rather than an unrelated image.

Every researched destination carries a written, source-attributed body: a
one-sentence summary for cards and page headers plus a three-paragraph
"About this place" section covering what and where the place is, what makes it
notable, and what a visit involves. Each entry records the sources behind its
copy, and the page lists them. Figures that could not be reconciled between
sources are described approximately or left out entirely, with the
discrepancy recorded in the record's `data_quality_notes` rather than
published as fact.

The home page Food and Culture tiles open dedicated, searchable directories at
[`/food`](./src/app/food/page.tsx) and [`/culture`](./src/app/culture/page.tsx).
Their 73 paraphrased discovery entries are catalogued in
[`data/nepal-food-culture.json`](./data/nepal-food-culture.json) with regional
tags and item-level references. The directory is a starting inventory rather
than an exhaustive or community-approved account of every tradition; practices
and festival dates vary, so visitors are encouraged to confirm locally and
follow community guidance. Relevant Wikimedia Commons photographs are bundled
locally in `public/images/food-culture/` for fast, reliable loading. Yomari
uses its Kathmandu Valley destination photo as contextual place imagery. Each
illustrated entry records its alt text, creator, license and Commons file-page
link, which is displayed with the image. All 30 food entries and all 43
cultural entries have locally bundled photos. When a culture photo shows a
related place, artwork or celebration rather than the exact practice, its
context note makes that distinction explicit; the photo is illustrative, not
evidence of a current event or universal custom.
Where a dish-specific or region-specific photo was not available, the card
shows a clearly labeled representative image and explains what it does and does
not depict.

**Sample destinations** (Rara Lake, Tansen, Khaptad National Park, Tsum Valley)
are for development only:

- Their descriptions reflect widely documented facts.
- Every practical figure (cost, coordinates, elevation, difficulty, days,
  seasons) is a **development placeholder**.
- They're stored as `isSample = true` and `practicalInfoStatus = PLACEHOLDER`.
  The UI badges them as "Sample content" and hides unverified practical details.
- The seed refuses to load samples when `NODE_ENV=production`.

Inspect data with `npm run db:studio`.

### Instagram references

Permitted Instagram permalinks can be attached to destinations. The importer
uses the authorized Instagram Graph API when `INSTAGRAM_ACCESS_TOKEN` and
`INSTAGRAM_USER_ID` are set; otherwise it imports real, manually supplied post
URLs from [`data/instagram-references.json`](./data/instagram-references.json).
It never scrapes Instagram or rehosts Instagram images. Only `PERMITTED`
references are shown on destination pages, as outbound links with creator
attribution. Run `npm run data:instagram:dry` first; the full format, access
rules and report fields are in
[`docs/instagram-collection.md`](./docs/instagram-collection.md).

### Schema changes

1. Edit `prisma/schema.prisma`.
2. Run `npm run db:migrate -- --name describe_change`, then commit the new
   folder under `prisma/migrations/`.
3. Don't edit a migration once it has been applied anywhere shared. Add a new
   one.

Some invariants (slug format, coordinate and cost ranges, lowercase email) are
database CHECK constraints written by hand in a migration. Model design, delete
behaviour, indexes and planned models are in
[`docs/data-model.md`](docs/data-model.md).

## Scripts

| Script                                      | What it does                                                     |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                               | Development server                                               |
| `npm run build`                             | `prisma generate` + production build                             |
| `npm run start`                             | Serve the production build                                       |
| `npm run lint`                              | ESLint                                                           |
| `npm run typecheck`                         | Generate route types and run `tsc --noEmit`                      |
| `npm test`                                  | Vitest unit tests (integration tests skip without a test DB)     |
| `npm run test:integration`                  | Database tests; needs `TEST_DATABASE_URL` (name ends in `_test`) |
| `npm run test:e2e`                          | Playwright (builds and serves on port 3100)                      |
| `npm run check`                             | lint + typecheck + unit tests                                    |
| `npm run db:generate`                       | Generate the Prisma client                                       |
| `npm run db:migrate`                        | Create/apply migrations in development                           |
| `npm run db:deploy`                         | Apply committed migrations (production/CI)                       |
| `npm run db:seed`                           | Seed reference data (+ samples unless disabled)                  |
| `npm run db:studio`                         | Prisma Studio                                                    |
| `npm run data:instagram`                    | Import permitted Instagram references (Graph API or manual)      |
| `npm run data:instagram:dry`                | Validate/report the Instagram import without writing             |
| `npm run admin:grant -- <email> [--revoke]` | Make an existing account ADMIN (or revert to USER)               |

The first Playwright run needs a browser: `npx playwright install chromium`.

## Routes

| Route                             | What it shows                                                                                                                                                                                         |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                               | Hero search, 5 experiences, featured (DB), Off the map (DB), provinces with live counts, seasons, responsible travel, community CTA                                                                   |
| `/explore`                        | Server-side search, filters and pagination. Params: `q`, `theme`, `category`, `region`, `district`, `season`, `difficulty`, `budget`, `sort` (`featured`/`name`), `page`. Invalid values are ignored. |
| `/provinces`, `/provinces/[slug]` | All seven provinces; each prerendered, with its published destinations, filters and pagination                                                                                                        |
| `/sitemap.xml`, `/robots.txt`     | Sitemap of static routes, provinces and published non-sample destinations (read at request time)                                                                                                      |
| `/destinations/[slug]`            | Published destination: gallery, description, sources, related places. Practical details (difficulty, budget, seasons, activities, access, safety, coordinates) only when `VERIFIED`                   |
| `/contribute`                     | Place suggestion form: validated, rate-limited and stored as `PlaceSubmission` (status `PENDING`)                                                                                                     |
| `/credits`                        | Attribution for bundled photography                                                                                                                                                                   |
| `/login`, `/register`             | Sign in and create an account. `?next=` returns to a same-site path only                                                                                                                              |
| `/account`                        | Profile, saved destinations, your trips, sign out (this device or everywhere). Signed-in users only                                                                                                   |
| `/trips`, `/trips/[id]`           | Private trip planner: create or rename a trip, add, reorder and remove stops, notes and optional day. Signed-in users only                                                                            |
| `/admin`                          | Content dashboard and role management. Admins only; everyone else gets a 404                                                                                                                          |
| `/admin/submissions`, `/admin/submissions/[id]` | Community suggestion queue: inspect a suggestion, approve, reject, request changes or reopen. Admins only                                                                               |
| `/api/auth/*`                     | Auth.js endpoints (CSRF-protected)                                                                                                                                                                    |
| `/api/me/saved-destinations`      | `GET` list, `POST`/`DELETE` `{ slug }`. Session user only                                                                                                                                             |
| `/api/admin/users/[id]/role`      | `PATCH { role }`. Admins only; not their own role                                                                                                                                                     |

**Verified-only filters.** Season, difficulty and budget filters only match
destinations whose `practicalInfoStatus` is `VERIFIED`. Placeholder or
unverified figures are never used to filter or rank. Budget bands use the
per-person starting cost in NPR.

**SEO.** `SITE_URL` overrides the production origin. Vercel deployments use
their configured production domain; other production deployments default to
`https://hiddennepal-one.vercel.app`, while development defaults to localhost.
Canonical URLs, Open Graph, social previews, structured data and the sitemap
use that origin.
`robots.txt` advertises the sitemap and blocks API crawling. Account and
sign-in routes use `noindex`; filtered, sorted and paginated search results
and sample destinations are also `noindex`. Unknown destination or province
URLs render not-found pages with `noindex`; Next.js keeps status 200 once
streaming has started.

Experiences: the homepage shows five themes (Nature, Culture, Adventure,
Villages, Food). Each groups one or more of the seven database categories
(`src/features/experiences/themes.ts`).

## Community suggestions and moderation

`/contribute` accepts a place name, province, optional district, description,
optional category, coordinate pair and photo, plus contact details and an
optional account link. A province requires a district (or "Not sure"), and the
two coordinates must be supplied together. The form is parsed by Zod, protected
by a honeypot and limited to 5 submissions per IP and 10 per signed-in account
per hour. Photos reuse the admin upload validation: JPEG, PNG, WebP or AVIF,
8 MB maximum, with the file signature checked before upload. Contact details are
for follow-up only and are never published.

Every new suggestion starts `PENDING`. Admins review it at `/admin/submissions`,
where they can approve, reject, request changes or reopen according to
[`src/features/admin/submission-review.ts`](./src/features/admin/submission-review.ts).
Rejecting or requesting changes requires an explanation. Each decision records
the reviewer, timestamp and audit entry in the same transaction.

**Approval never publishes a place.** It records that an editor accepted the
suggestion; the destination entry is still researched, written and published
separately. A submitted photo also needs explicit permission before reuse. The
full data model and transition rules are in
[`docs/data-model.md`](./docs/data-model.md#community-submissions-and-moderation).
The transition matrix is unit-tested in
`src/features/admin/submission-review.test.ts`; account linking, per-IP limits,
permissions, audit rows and the no-publication guarantee are covered by
`tests/integration/moderation.test.ts`.

## Trip planning

Signed-in users can create private trips at `/trips` and open one at
`/trips/[id]`. A trip has a name and notes; stops are published destinations
kept in a stable order, with optional per-stop notes and a day number (1–60).
Stops can be added, moved up or down, edited and removed. Both the list and the
planner are linked from `/account`.

Every trip and stop is scoped by the session user's id in the query itself, so
another account's ids return not-found rather than data. Limits are 20 trips per
account and 50 stops per trip, and a destination can appear only once per trip.
The service layer (`src/features/trips/service.ts`) has no React or Next.js
imports, leaving room for a later AI planner, map view or sharing endpoint.
Trips are `PRIVATE`; `PUBLIC` visibility exists in the schema for future
sharing but is never accepted from input. See
[`docs/data-model.md`](./docs/data-model.md#trip-planning).
Validation, ordering and unauthorized/error-state handling have unit tests;
`tests/integration/trips.test.ts` exercises persistence, ownership, ordering,
removal and limits against PostgreSQL.

## Authentication and authorization

Email + password accounts with [Auth.js](https://authjs.dev) v5 (Credentials
provider). There is no separate auth service.

### Setup

1. Set `AUTH_SECRET` in `.env` (≥ 32 characters): `npx auth secret` or
   `openssl rand -base64 33`. It encrypts session cookies; rotating it signs
   everyone out. The app refuses a shorter value.
2. Apply migrations: `npm run db:migrate` (development) or `npm run db:deploy`.
3. Production outside Vercel: set `AUTH_URL` to the public origin (or
   `AUTH_TRUST_HOST=true` behind a proxy that sets the host headers).
   Serve over HTTPS so cookies get the `Secure` flag and `__Secure-` prefix.

### First administrator

New accounts are always `USER`. Nothing a browser submits can set a role. To
create the first admin:

```bash
# 1. Register normally at /register.
# 2. With DATABASE_URL pointing at the target database:
npm run admin:grant -- you@example.com
```

Only someone with database credentials can run this. After that, admins can
change other users' roles at `/admin`, but never their own, so the last admin
can't lock themselves out. `--revoke` sets the account back to `USER` and
signs it out everywhere.

### How it works

| Concern        | Approach                                                                                                                                                                                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Passwords      | scrypt (Node `crypto`, N=2¹⁷, r=8, p=1, random 16-byte salt) in `src/features/auth/password.ts`. A DB CHECK rejects anything not in the `scrypt$…` format. 10–128 characters, no composition rules.                                                            |
| Sessions       | Encrypted JWT cookie (Auth.js), 7 days, refreshed daily. HttpOnly, SameSite=Lax, Secure on HTTPS. The token holds only the user id and `sessionVersion`.                                                                                                       |
| Current user   | `getCurrentUser()` in `src/features/auth/session.ts` re-reads the user (role included) from the database on every request. Role changes apply immediately; bumping `sessionVersion` revokes every session ("Sign out everywhere", `admin:grant --revoke`).     |
| Pages          | `requireUser()` redirects to `/login?next=…`; `requireAdminPage()` returns 404 for non-admins. `src/proxy.ts` only adds an early redirect for `/account`, `/admin` and `/trips` when there is no session cookie. It is not the access check. |
| Server Actions | Each resolves the user itself (`getCurrentUser`/`assertAdmin`) and validates input with Zod. Next.js rejects cross-origin calls.                                                                                                                               |
| Route Handlers | Each calls `assertUser`/`assertAdmin`. Mutations also require a same-origin `Origin` header and `application/json` (`src/lib/http.ts`).                                                                                                                        |
| Ownership      | Saved destinations and trips are always queried by the session user's id; ids sent by the browser are ignored. Admin services re-check the actor's role next to the data.                                                                                      |
| Rate limits    | PostgreSQL-backed fixed windows (`RateLimit` table, hashed keys): sign-in 5 per email and 30 per IP per 15 min; registration 5 per IP per hour; suggestions 5 per IP and 10 per account per hour, applied after validation. Enforced inside the Credentials provider, so direct posts to `/api/auth/callback/credentials` are limited too. |
| CSRF           | Server Actions: Next.js Origin check. Auth.js endpoints: double-submit CSRF token. JSON APIs: Origin check + JSON content type + SameSite cookies.                                                                                                             |
| Errors         | Sign-in failures say "Incorrect email or password" for both unknown email and wrong password (with matching timing). Unexpected errors are logged without credentials and shown generically.                                                                   |

**Known trade-offs**

- Registration says when an email is already registered. Hiding it needs
  email verification, which needs an email provider.
- The per-email sign-in limit lets someone lock an account out of password
  sign-in for 15 minutes by guessing wrongly.
- Per-IP limits trust the first `X-Forwarded-For` entry. That holds on Vercel
  and behind most load balancers, but not when the app is exposed directly.

**Not implemented:** password reset and email verification. Both need an
outbound email provider (e.g. Resend or SES) to send single-use, expiring
tokens, and none is configured. Until one is, an admin can't reset a
password from the UI. Delete the account, or set a new hash from a trusted
shell.

### Tests

- `tests/integration/auth.test.ts` (real PostgreSQL) covers: signed-out
  access to pages, actions and APIs; users blocked from admin actions and
  routes; cross-user edits of saves and profiles; self-promotion through
  registration, profile, action and API; malformed credentials, rate limits
  and session revocation; CSRF checks on Route Handlers.
- Unit tests: `password.test.ts`, `validation.test.ts` (open-redirect
  guard), `proxy.test.ts`, `src/lib/http.test.ts`.
- `tests/e2e/auth.spec.ts`: protected-route redirects and API 401s,
  read-only. The register → save → sign-out flow writes a user and only runs
  with `E2E_DB_WRITES=1`. Use a disposable database:
  `DATABASE_URL=… E2E_DB_WRITES=1 npm run test:e2e`.
  Each run registers two users, so after a few runs within an hour the
  registration limit (5 per IP) applies; `TRUNCATE "RateLimit"` on that
  disposable database resets it.

## Project structure

```
prisma/
  schema.prisma          Data model (see docs/data-model.md)
  migrations/            SQL migrations (incl. hand-written CHECKs)
  seed.ts                Seed entry point
  seed/                  Reference data, sample destinations, idempotent writer
docs/data-model.md       Model decisions and planned models
docs/admin-cms.md        Admin screens, moderation, validation and uploads
src/
  app/                   Routes: /, /explore, /trips, /contribute, /admin, 404, error boundary
  assets/photos/         Bundled, licensed photography
  components/
    ui/                  shadcn/ui primitives (button, input, link-button)
    layout/              Header, mobile nav, footer, page header
    editorial/           Section heading
    media/               Photo credit, remote image with fallback
    brand/               Logo
  content/photos.ts      Photo registry with author/license/source
  features/
    destinations/        Search + input validation, queries, cards, detail, states
    seasons/             Season definitions and homepage section
    submissions/         Place suggestion form, server action, validation, rate limits
    auth/                Auth.js credentials check, session DAL, actions, forms, rate limits
    saved/               Saved destinations: service, actions, save button
    trips/               Private itineraries: validation, ordering, service, actions, UI
    admin/               Content dashboard, role management, submissions moderation
    experiences/         Categories, themes and the theme grid
    regions/             Province definitions and grid
    home/                Hero, responsible-travel section
  lib/
    db.ts                Server-only Prisma client (null when unconfigured)
    env.ts               Zod-validated server env
    images.ts            Allowed remote image hosts (shared with next.config)
    site.ts              Site name, tagline, navigation
    http.ts              Route Handler helpers: same-origin check, JSON errors
  auth.ts                Auth.js configuration
  proxy.ts               Optimistic redirect for /account, /admin and /trips
scripts/grant-admin.ts   First-admin bootstrap (npm run admin:grant)
tests/e2e/               Playwright specs
tests/integration/       Database tests (real PostgreSQL)
```

Conventions:

- Server Components by default. Client Components exist only for interactivity
  (`mobile-nav.tsx`, `remote-image.tsx`, `error.tsx`, forms, the save button).
- Identity comes only from `src/features/auth/session.ts`. Never read a user
  id, role or owner from form data, JSON, params or hidden fields. Every
  Server Action and Route Handler checks access itself, even when the page
  that renders it already did.
- Database access lives in `features/*/queries.ts`, guarded by `server-only`.
  Loaders return a tagged result (`ok` / `unconfigured` / `error`) so pages
  render honest states instead of throwing.
- URL search params are parsed with Zod. Unknown values are dropped, not errors.
- Destination data is read at request time inside `<Suspense>` (Partial
  Prerendering). The rest of each page is prerendered.

## Design system

Tokens are defined in `src/app/globals.css`.

| Token      | Hex       | Use                                         |
| ---------- | --------- | ------------------------------------------- |
| `navy`     | `#0B1F33` | Primary text, dark surfaces, primary button |
| `himalaya` | `#1769AA` | Links and focus ring on light surfaces      |
| `teal`     | `#20B8A6` | Accent; text only on navy                   |
| `gold`     | `#D6B36A` | Eyebrows, rules; focus ring on dark         |
| `ivory`    | `#F7F5F0` | Page background                             |
| `white`    | `#FFFFFF` | Cards, alternate section                    |

- Type: Manrope (interface) and Fraunces (editorial headings), via `next/font`.
- `.surface-dark` / `.on-dark` swap semantic tokens for navy contexts,
  including a gold focus ring (blue fails contrast on navy).
- Motion is subtle and wrapped in `motion-safe:`. `prefers-reduced-motion`
  disables animations globally.
- Teal and gold fail 4.5:1 on ivory. Never use them for text on light
  backgrounds.

## Photography and licensing

All bundled photos are from Wikimedia Commons under CC BY 4.0 or CC BY-SA 4.0.
Each image carries its author, license and source in `src/content/photos.ts`,
is credited where it appears, and is listed on `/credits`. When adding images:

- Record author, license and source URL alongside the file.
- Remote images must be on a host listed in `src/lib/images.ts`. Others render
  the contour-pattern fallback instead of breaking.

## Roadmap

- Phase 1: foundation and design system.
- Phase 2: PostgreSQL schema, migrations, validated idempotent seed.
- Phase 3: Production homepage, destination detail pages, explore filters
  (experience, province, season) and community place suggestions.
- Phase 4: Discovery engine: paginated, validated explore; province pages;
  verified-only practical filters; activities, access, safety and sources on
  detail pages; canonical URLs, sitemap and robots.txt.

- Phase 5: Authentication (Auth.js), USER/ADMIN roles with server-side
  checks, saved destinations, minimal role management.
- Phase 6: Community suggestion moderation and private trip planning, with
  ownership checks, rate limits, audit trails and database-backed tests.

Still to come: public/shared itineraries, an AI trip planner, an interactive
map, a local-guide directory, booking inquiries, and password reset (needs an
email provider).
