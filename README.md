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
| Tests      | Vitest + Testing Library (unit), Playwright (end-to-end) |

## Getting started

Requirements: Node.js `^20.19 || ^22.12 || >=24`, npm, and PostgreSQL 14+
(optional for UI-only work).

```bash
npm install            # also runs `prisma generate`
cp .env.example .env   # then edit DATABASE_URL
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
npm run db:seed        # provinces, categories and 4 sample destinations
```

In production or CI, apply committed migrations without creating new ones:

```bash
npm run db:deploy      # prisma migrate deploy
SEED_SAMPLE_DATA=false npm run db:seed   # reference data only
```

The seed is **idempotent**. Rows are upserted by slug and a destination's
categories, images and seasons are replaced, so re-running never duplicates.

**Sample destinations** (Rara Lake, Tansen, Khaptad National Park, Tsum Valley)
are for development only:

- Their descriptions reflect widely documented facts.
- Every practical figure (cost, coordinates, elevation, difficulty, days,
  seasons) is a **development placeholder**.
- They're stored as `isSample = true` and `practicalInfoStatus = PLACEHOLDER`.
  The UI badges them as "Sample content" and hides unverified practical details.
- The seed refuses to load samples when `NODE_ENV=production`.

Inspect data with `npm run db:studio`.

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

| Script                     | What it does                                          |
| -------------------------- | ----------------------------------------------------- |
| `npm run dev`              | Development server                                    |
| `npm run build`            | `prisma generate` + production build                  |
| `npm run start`            | Serve the production build                            |
| `npm run lint`             | ESLint                                                |
| `npm run typecheck`        | Generate route types and run `tsc --noEmit`           |
| `npm test`                 | Vitest unit tests (integration tests skip without a test DB) |
| `npm run test:integration` | Database tests; needs `TEST_DATABASE_URL` (name ends in `_test`) |
| `npm run test:e2e`         | Playwright (builds and serves on port 3100)           |
| `npm run check`            | lint + typecheck + unit tests                         |
| `npm run db:generate`      | Generate the Prisma client                            |
| `npm run db:migrate`       | Create/apply migrations in development                |
| `npm run db:deploy`        | Apply committed migrations (production/CI)            |
| `npm run db:seed`          | Seed reference data (+ samples unless disabled)       |
| `npm run db:studio`        | Prisma Studio                                         |

The first Playwright run needs a browser: `npx playwright install chromium`.

## Routes

| Route | What it shows |
| --- | --- |
| `/` | Hero search, 5 experiences, featured (DB), Off the map (DB), provinces with live counts, seasons, responsible travel, community CTA |
| `/explore` | Search plus `q`, `theme`, `category`, `region` and `season` filters (all in the URL) |
| `/destinations/[slug]` | Published destination; practical details only when `VERIFIED` |
| `/contribute` | Place suggestion form, stored as `PlaceSubmission` (status `PENDING`) |
| `/credits` | Attribution for bundled photography |

Experiences: the homepage shows five themes (Nature, Culture, Adventure,
Villages, Food). Each groups one or more of the seven database categories
(`src/features/experiences/themes.ts`).

## Project structure

```
prisma/
  schema.prisma          Data model (see docs/data-model.md)
  migrations/            SQL migrations (incl. hand-written CHECKs)
  seed.ts                Seed entry point
  seed/                  Reference data, sample destinations, idempotent writer
docs/data-model.md       Model decisions and planned models
src/
  app/                   Routes: /, /explore, /credits, 404, error boundary
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
    submissions/         Place suggestion form, server action, validation
    experiences/         Categories, themes and the theme grid
    regions/             Province definitions and grid
    home/                Hero, responsible-travel section
  lib/
    db.ts                Server-only Prisma client (null when unconfigured)
    env.ts               Zod-validated server env
    images.ts            Allowed remote image hosts (shared with next.config)
    site.ts              Site name, tagline, navigation
tests/e2e/               Playwright specs
tests/integration/       Database tests (real PostgreSQL)
```

Conventions:

- Server Components by default. Client Components exist only for interactivity
  (`mobile-nav.tsx`, `remote-image.tsx`, `error.tsx`).
- Database access lives in `features/*/queries.ts`, guarded by `server-only`.
  Loaders return a tagged result (`ok` / `unconfigured` / `error`) so pages
  render honest states instead of throwing.
- URL search params are parsed with Zod. Unknown values are dropped, not errors.
- Destination data is read at request time inside `<Suspense>` (Partial
  Prerendering). The rest of each page is prerendered.

## Design system

Tokens are defined in `src/app/globals.css`.

| Token        | Hex       | Use                                        |
| ------------ | --------- | ------------------------------------------ |
| `navy`       | `#0B1F33` | Primary text, dark surfaces, primary button |
| `himalaya`   | `#1769AA` | Links and focus ring on light surfaces     |
| `teal`       | `#20B8A6` | Accent; text only on navy                  |
| `gold`       | `#D6B36A` | Eyebrows, rules; focus ring on dark        |
| `ivory`      | `#F7F5F0` | Page background                            |
| `white`      | `#FFFFFF` | Cards, alternate section                   |

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

Still to come: admin and moderation (Chunk 4), authentication (Auth.js),
saved places, trips and guides.
