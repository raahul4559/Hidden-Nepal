# Data model

Source of truth: `prisma/schema.prisma`. This document explains the decisions
behind it and records models that are planned but not yet built.

## Implemented

```
User 1 ── * PlaceSubmission * ── 0..1 Region / Category

Region 1 ── * Destination * ── * Category        via DestinationCategory
                  │
                  ├── * DestinationImage          ordered gallery
                  └── * DestinationSeason         best seasons
```

| Model | Purpose | Key constraints |
| --- | --- | --- |
| `User` | Identity and role (`TRAVELER`, `EDITOR`, `ADMIN`) | `email` unique and lowercase (CHECK) |
| `Region` | Nepal's 7 provinces | `slug` unique and formatted |
| `Category` | Experience categories (waterfalls, lakes…) | `slug` unique and formatted |
| `Destination` | A place | `slug` unique and formatted; range CHECKs |
| `DestinationCategory` | Destination ↔ category; lowest `position` is primary | PK `(destinationId, categoryId)` |
| `DestinationImage` | Gallery with attribution; `position 0` is the cover | unique `(destinationId, position)` |
| `DestinationSeason` | Best seasons (`SPRING`, `MONSOON`, `AUTUMN`, `WINTER`) | PK `(destinationId, season)` |
| `Activity` / `DestinationActivity` | Things to do; shown only when practical info is `VERIFIED` | slug format; PK `(destinationId, activityId)` |
| `DestinationSource` | References for the published text | https only; unique `(destinationId, url)` |
| `PlaceSubmission` | Community suggestions from `/contribute`, moderated (`PENDING` → `APPROVED`/`REJECTED`/`SPAM`) | consent must be true; lowercase email; length limits; reviewed ⇒ `reviewedAt` |

`Destination.isFeatured` drives the homepage "Featured" grid and
`Destination.isHiddenGem` the editorial "Off the map" section. Editors set
both; neither implies the content is verified.

### Delete behaviour

| Relation | On delete | Why |
| --- | --- | --- |
| Destination → Region | **Restrict** | A province with destinations must not vanish. |
| DestinationCategory → Category | **Restrict** | Retiring a category is a deliberate reassignment. |
| DestinationCategory / Image / Season → Destination | **Cascade** | Children are owned by the destination. |
| PlaceSubmission → Region / Category / User | **SetNull** | A suggestion outlives the things it references. |

### Indexes

| Index | Serves |
| --- | --- |
| `Destination(status, isFeatured, publishedAt DESC)` | Homepage featured list |
| `Destination(status, isHiddenGem, publishedAt DESC)` | Homepage "Off the map" |
| `PlaceSubmission(status, createdAt)` | Moderation queue |
| `Destination(regionId, status)` | Explore → province filter |
| `DestinationCategory(categoryId)` | Explore → category filter |
| `DestinationSeason(season)` | Explore → season filter |
| `Destination(difficulty)` | Explore → difficulty filter |
| `Destination(status, name)` | Explore → A–Z sort |
| `Destination(regionId, district)` | Explore → district filter |
| `Destination(status, practicalInfoStatus, estimatedCostMin)` | Explore → verified-only budget filter |
| Unique `slug` on Destination, Category, Region | Lookups by URL |

Text search currently uses `ILIKE` (`contains` + `insensitive`). With more
than a few hundred destinations, add `pg_trgm` GIN indexes or full-text search.

### Database CHECK constraints

Prisma can't express these, so they're hand-written at the end of
`prisma/migrations/*_catalog_relations/migration.sql`. Prisma's diffing
ignores CHECK constraints, so they survive future migrations.

- `slug` matches `^[a-z0-9]+(-[a-z0-9]+)*$` (Destination, Category, Region).
- Coordinates are both null or both set, and within valid ranges.
- `elevationM` is between 0 and 8849.
- Costs are non-negative, with `max >= min`.
- `suggestedDays > 0`.
- `PUBLISHED` requires `publishedAt`. `VERIFIED` practical info requires
  `practicalInfoVerifiedAt`.
- Image and category `position >= 0`.
- `User.email = lower(email)`.

Application validation (`src/features/destinations/validation.ts`) mirrors
these and adds domain rules: coordinates must lie within Nepal, categories and
seasons must be known and unique, and sample data must be marked
`PLACEHOLDER`.

### Trustworthiness of practical details

`Destination.practicalInfoStatus` covers cost, coordinates, elevation,
difficulty, suggested days, seasons, activities, access (`accessInfo`) and
safety (`safetyInfo`):

- `PLACEHOLDER`: invented for development. Seed samples always use this.
- `UNVERIFIED`: sourced but not checked. This is the default for new rows.
- `VERIFIED`: checked; requires `practicalInfoVerifiedAt`.

The UI shows practical details only when they are `VERIFIED`. Cards for
`isSample` destinations carry a visible "Sample content" badge.

### Money

`estimatedCostMin/Max` are whole units of `currency` (`NPR` or `USD`) per
person for a typical visit. `costNotes` holds caveats.

## Planned, not yet implemented

These are deferred until the feature that needs them, so the schema doesn't
carry unused tables. The sketches show intended shape and delete behaviour.

| Model | Chunk | Sketch |
| --- | --- | --- |
| `Account`, `Session`, `VerificationToken` | Auth | Auth.js Prisma adapter tables; `User` already uses compatible field names. Cascade from User. |
| `SavedDestination` | Saved places | PK `(userId, destinationId)`, `createdAt`. Cascade from both sides. |
| `Trip` | Trip planner | `id`, `userId` (Cascade), `title`, `startDate?`, `endDate?`, `visibility` enum, timestamps; index `(userId, updatedAt)`. |
| `TripStop` | Trip planner | `id`, `tripId` (Cascade), `destinationId` (Restrict, or SetNull with a snapshot name), `position`, `nights?`, `notes?`; unique `(tripId, position)`. |
| `TravelGuide` | Guides | `id`, unique `slug`, `title`, `excerpt`, `body`, `status` (PublishStatus), `authorId` (User, SetNull), `publishedAt`, timestamps; optional guide ↔ destination join. |
| `PlaceSubmission` additions | Admin | `reviewerId?` (User, SetNull) and `destinationId?` once a suggestion is promoted. |
| `AuditLog` | Admin | Append-only: `id`, `actorId` (User, SetNull so history survives), `action`, `entityType`, `entityId`, `metadata Json`, `createdAt`; indexes `(entityType, entityId)` and `(actorId, createdAt)`. |
