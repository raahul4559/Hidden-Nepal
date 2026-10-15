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

Requirements: Node.js `^20.19 || ^22.12 || >=24`, npm. PostgreSQL is optional
for UI work.

```bash
npm install            # also runs `prisma generate`
cp .env.example .env
npm run dev            # http://localhost:3000
```

Without `DATABASE_URL`, the site runs fully. Destination sections show an
empty state, plus a "no database connected" hint in development.

### Connecting a database

1. Create a PostgreSQL database, for example with Homebrew:
   `brew services start postgresql@17 && createdb hidden_nepal`.
2. Set `DATABASE_URL` in `.env`, e.g.
   `postgresql://<user>@localhost:5432/hidden_nepal`.
3. Apply migrations and seed reference data:

   ```bash
   npm run db:migrate   # prisma migrate dev
   npm run db:seed      # seeds Nepal's 7 provinces only
   ```

The seed intentionally creates **no destinations**. Destinations must come from
verified research, not placeholders.

## Scripts

| Script                | What it does                                    |
| --------------------- | ----------------------------------------------- |
| `npm run dev`         | Development server                              |
| `npm run build`       | `prisma generate` + production build            |
| `npm run start`       | Serve the production build                      |
| `npm run lint`        | ESLint                                          |
| `npm run typecheck`   | Generate route types and run `tsc --noEmit`     |
| `npm test`            | Vitest unit/component tests                     |
| `npm run test:e2e`    | Playwright (builds and serves on port 3100)     |
| `npm run check`       | lint + typecheck + unit tests                   |
| `npm run db:migrate`  | Create/apply migrations in development          |
| `npm run db:deploy`   | Apply migrations in production                  |
| `npm run db:seed`     | Seed provinces                                  |
| `npm run db:studio`   | Prisma Studio                                   |

The first Playwright run needs a browser: `npx playwright install chromium`.

## Project structure

```
prisma/
  schema.prisma          Region, Destination, enums
  migrations/            SQL migrations
  seed.ts                Province seed
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
    destinations/        Search schema, server queries, cards, result states
    experiences/         Category definitions and grid
    regions/             Province definitions and grid
    home/                Hero, responsible-travel section
  lib/
    db.ts                Server-only Prisma client (null when unconfigured)
    env.ts               Zod-validated server env
    images.ts            Allowed remote image hosts (shared with next.config)
    site.ts              Site name, tagline, navigation
tests/e2e/               Playwright specs
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

This is phase 1 of 8 (foundation and design system). Destination detail pages,
content management, authentication (Auth.js) and other features follow in
later phases.
