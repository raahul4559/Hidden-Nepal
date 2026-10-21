# Data model

Source of truth: `prisma/schema.prisma`. This document explains the decisions
behind it and records models that are planned but not yet built.

## Implemented

```
User 1 ── * PlaceSubmission * ── 0..1 Region / Category
User 1 ── * PlaceSubmission (reviewer)             decided suggestions only
User 1 ── * Trip 1 ── * TripStop * ── 0..1 Destination
User 1 ── * SavedDestination * ── 1 Destination
User 1 ── * TravelGuide
User 1 ── * AuditLog                                  (append-only)
RateLimit                                         (standalone counters)

Region 1 ── * Destination * ── * Category        via DestinationCategory
                  │
                  ├── * DestinationImage          ordered gallery
                  ├── * DestinationInstagramPost  permitted Instagram links
                  ├── * DestinationSeason         best seasons
                  └── * TripStop                  0..1 place in a saved trip
```

| Model | Purpose | Key constraints |
| --- | --- | --- |
| `User` | Identity, role (`USER`, `EDITOR`, `ADMIN`), scrypt `passwordHash`, `sessionVersion` | `email` unique and lowercase (CHECK); hash format CHECK; `sessionVersion >= 0` |
| `SavedDestination` | A user's favourite destinations | PK `(userId, destinationId)` prevents duplicates |
| `RateLimit` | Fixed-window counters for sign-in, registration and submissions | `key` is a SHA-256 hash (no email/IP stored) |
| `Region` | Nepal's 7 provinces | `slug` unique and formatted |
| `Category` | Experience categories (waterfalls, lakes…) | `slug` unique and formatted |
| `Destination` | A place | `slug` unique and formatted; range CHECKs |
| `DestinationCategory` | Destination ↔ category; lowest `position` is primary | PK `(destinationId, categoryId)` |
| `DestinationImage` | Gallery with attribution; `position 0` is the cover | unique `(destinationId, position)` |
| `DestinationInstagramPost` | Permitted Instagram permalinks with caption, creator, location tag and rights status | `shortcode` and `url` unique; only `PERMITTED` rows render publicly |
| `DestinationSeason` | Best seasons (`SPRING`, `MONSOON`, `AUTUMN`, `WINTER`) | PK `(destinationId, season)` |
| `Activity` / `DestinationActivity` | Things to do; shown only when practical info is `VERIFIED` | slug format; PK `(destinationId, activityId)` |
| `DestinationSource` | References for the published text | https only; unique `(destinationId, url)` |
| `PlaceSubmission` | Community suggestions from `/contribute`, moderated (`PENDING` → `APPROVED`/`REJECTED`/`CHANGES_REQUESTED`/`SPAM`) | consent must be true; lowercase email; length limits; both-or-neither coordinates; refusal requires an explanation; any non-pending status requires reviewer and timestamp |
| `Trip` | A saved itinerary owned by one account | title 2–120 characters; notes ≤ 4,000; visibility defaults to `PRIVATE`; index `(userId, updatedAt DESC)` |
| `TripStop` | One place in a trip, in stable order | gapless unique `(tripId, position)`; unique `(tripId, destinationId)`; optional day 1–60; `destinationName` snapshot |
| `TravelGuide` | Long-form public guide with the same `PublishStatus` lifecycle as destinations | `slug` unique; published ⇒ `publishedAt`; author is `SetNull` |
| `AuditLog` | Append-only record of admin content changes | actor is `SetNull`; indexed by entity and creation time |

`Destination.isFeatured` drives the homepage "Featured" grid and
`Destination.isHiddenGem` the editorial "Off the map" section. Editors set
both; neither implies the content is verified.

### Delete behaviour

| Relation | On delete | Why |
| --- | --- | --- |
| Destination → Region | **Restrict** | A province with destinations must not vanish. |
| DestinationCategory → Category | **Restrict** | Retiring a category is a deliberate reassignment. |
| DestinationCategory / Image / Season → Destination | **Cascade** | Children are owned by the destination. |
| DestinationInstagramPost → Destination | **Cascade** | A post link means nothing without its place. |
| PlaceSubmission → Region / Category / User / Reviewer | **SetNull** | A suggestion and its moderation history outlive the things they reference. |
| SavedDestination → User / Destination | **Cascade** | A save means nothing without either side. |
| Trip → User | **Cascade** | A trip is owned by exactly one account. |
| TripStop → Trip | **Cascade** | A stop means nothing outside its itinerary. |
| TripStop → Destination | **SetNull** | The stop keeps its `destinationName` snapshot if the catalogue entry is removed. |

### Indexes

| Index | Serves |
| --- | --- |
| `Destination(status, isFeatured, publishedAt DESC)` | Homepage featured list |
| `Destination(status, isHiddenGem, publishedAt DESC)` | Homepage "Off the map" |
| `PlaceSubmission(status, createdAt)` | Moderation queue |
| `Trip(userId, updatedAt DESC)` | Account/profile: one traveller's trips, most recently edited first |
| `TripStop(tripId)` | Ordered stops for one trip |
| Unique `TripStop(tripId, position)` | Gapless ordering; also lets reorders be checked by the database |
| Unique `TripStop(tripId, destinationId)` | One stop per place per trip |
| `SavedDestination(userId, createdAt DESC)` | Account page: a user's saves, newest first |
| `SavedDestination(destinationId)` | Cascade deletes; future "saved by N travellers" |
| `RateLimit(resetAt)` | Expired-counter cleanup |
| `Destination(regionId, status)` | Explore → province filter |
| `DestinationCategory(categoryId)` | Explore → category filter |
| `DestinationSeason(season)` | Explore → season filter |
| `Destination(difficulty)` | Explore → difficulty filter |
| `Destination(status, name)` | Explore → A–Z sort |
| `Destination(regionId, district)` | Explore → district filter |
| `Destination(status, practicalInfoStatus, estimatedCostMin)` | Explore → verified-only budget filter |
| `DestinationInstagramPost(destinationId, collectedAt DESC)` | Destination page: recent permitted posts |
| `DestinationInstagramPost(rightsStatus)` | Moderation/reporting of unverified links |
| Unique `slug` on Destination, Category, Region | Lookups by URL |

Text search currently uses `ILIKE` (`contains` + `insensitive`). With more
than a few hundred destinations, add `pg_trgm` GIN indexes or full-text search.

### Database CHECK constraints

Prisma can't express these, so they're hand-written in the migrations that add
them (for example `prisma/migrations/*_catalog_relations` and
`*_community_moderation_and_trips`). Prisma's diffing ignores CHECK
constraints, so they survive future migrations.

- `slug` matches `^[a-z0-9]+(-[a-z0-9]+)*$` (Destination, Category, Region).
- Coordinates are both null or both set, and within valid ranges.
- `elevationM` is between 0 and 8849.
- Costs are non-negative, with `max >= min`.
- `suggestedDays > 0`.
- `PUBLISHED` requires `publishedAt`. `VERIFIED` practical info requires
  `practicalInfoVerifiedAt`.
- Image and category `position >= 0`.
- `User.email = lower(email)`.
- `User.passwordHash` is null or starts with `scrypt$` (no plaintext).
- `User.sessionVersion >= 0`.
- `PlaceSubmission` consent must be true; `status` in
  `REJECTED`/`CHANGES_REQUESTED` requires `reviewNotes`; any status other than
  `PENDING` requires `reviewedAt` and `reviewerId`.
- Submission coordinates are both-or-neither and within valid ranges; image
  URL/public id/alt text lengths are capped; district is 2–80 characters.
- `Trip.title` is 2–120 characters and `Trip.notes` ≤ 4,000.
- `TripStop.position >= 0`, `day` is 1–60 when set, `destinationName` is
  1–120 characters and `notes` ≤ 2,000.

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

### Roles and sessions

`UserRole` was `TRAVELER | EDITOR | ADMIN`; migration
`*_auth_and_saved_destinations` renames `TRAVELER` to `USER` in place
(`ALTER TYPE … RENAME VALUE`), so existing rows keep working. `EDITOR` is
reserved for the editorial workflow and grants nothing yet.

Sessions are stateless encrypted cookies, so there is no `Session` table.
`User.sessionVersion` is copied into each token at sign-in and compared on
every request; incrementing it revokes all of a user's sessions.

### Money

`estimatedCostMin/Max` are whole units of `currency` (`NPR` or `USD`) per
person for a typical visit. `costNotes` holds caveats.

### Community submissions and moderation

`PlaceSubmission` is a queue, never a publishing path. `/contribute` accepts a
place name, province, optional district, description, optional category,
optional coordinate pair and optional photo. A province requires a district
unless the visitor selects "Not sure"; coordinates must be supplied together.
Photos are checked for type, size and file signature before upload, and the
stored URL is never rendered publicly while the suggestion is pending.

New rows always start `PENDING`. A reviewer can move them only through the
documented transitions:

| From | Allowed decisions |
| --- | --- |
| `PENDING` | approve, reject, request changes |
| `CHANGES_REQUESTED` | approve, reject, request changes, reopen |
| `REJECTED` | approve, request changes, reopen |
| `SPAM` | approve, reopen |
| `APPROVED` | none — approval is final |

Rejecting or requesting changes requires an explanation. Every decision writes
the reviewer, the timestamp and an `AuditLog` row in the same transaction.
**Approving only records the decision.** It never creates, edits or publishes a
`Destination`; catalogue copy is researched and entered separately, so an
unverified suggestion cannot reach travellers by being approved.

### Trip planning

`Trip` and `TripStop` store an account's itinerary. Every read and mutation is
scoped by `userId` in the query itself, so a trip or stop id from the browser
can never reach another account's data. The service layer
(`src/features/trips/service.ts`) has no React or Next.js imports, so a future
AI planner, map view or sharing endpoint can call the same functions.

- One account may hold 20 trips; one trip may hold 50 stops.
- A stop references a published `Destination` and snapshots its name. If the
  destination is later removed, the stop stays readable with no link.
- The same destination cannot be added twice to one trip.
- `position` is gapless from 0 and unique. Reorders send the complete stop-id
  array, which must be an exact permutation; the service writes temporary
  positions first so the unique constraint never collides mid-update.
- Stops can carry notes and an optional day (1–60). Trips are `PRIVATE` today;
  `PUBLIC` is reserved for a later sharing feature and is never accepted from
  input.

## Planned, not yet implemented

These are deferred until the feature that needs them, so the schema doesn't
carry unused tables. The sketches show intended shape and delete behaviour.

| Model | Chunk | Sketch |
| --- | --- | --- |
| `Account`, `VerificationToken` | OAuth / email sign-in | Auth.js Prisma adapter tables, needed only when OAuth providers or emailed links (password reset, verification) are added. `User` already uses compatible field names. Cascade from User. |
| `PlaceSubmission.destinationId` | Promotion | Optional link to the destination eventually created from a suggestion, so the moderation history can point at the published result. |
| Booking inquiry | Booking requests | `id`, `userId?`, `destinationId`, dates, party size, contact, status; no payment data and no live availability without a partner integration. |
| Local guide profile | Guide directory | Account-linked profile with regions, languages and verification state; separate from the existing editorial `TravelGuide`. |
