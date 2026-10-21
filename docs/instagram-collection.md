# Instagram and place collection

This feature adds Instagram references to the existing destination catalogue.
It does **not** scrape Instagram, download Instagram images, or invent posts.
Instagram content is only fetched through the authorized Graph API; otherwise
an editor supplies real public permalinks manually.

## How it works

```
data/instagram-references.json ──┐
                                ├─> validate ──> plan (dedupe/resolve) ──> PostgreSQL
Instagram Graph API (optional) ─┘                       │
                                                        └─> data/reports/instagram-import.json
```

- **Places** stay in the existing `Destination` model. The importer can create
  a new place from a manual record, but never overwrites an existing slug.
- **Instagram references** live in `DestinationInstagramPost` (shortcode and
  permalink are unique), linked to a destination with cascade delete.
- Public editorial references use the existing `DestinationSource` model.
- Only `PERMITTED` references are rendered on `/destinations/[slug]`. They are
  outbound links, not rehosted images.

## Access rules

### When Graph API credentials exist

Set:

```bash
INSTAGRAM_ACCESS_TOKEN="..."
INSTAGRAM_USER_ID="..."
# Optional:
INSTAGRAM_API_VERSION="v23.0"
INSTAGRAM_DESTINATION_SLUG="pokhara"
INSTAGRAM_HASHTAGS="everest:mount-everest,pokhara:pokhara"
INSTAGRAM_MAX_PAGES="5"
```

The command then fetches authorized account media and hashtag top media. It
records the permalink, caption, creator handle, optional media reference and
collection date. Media URLs are metadata only: they expire and are never
rehosted. Access still requires a professional account, a linked Facebook
Page, and the relevant Meta permissions. If Meta denies access, the command
reports the error and continues with manual data.

### When Graph API credentials do not exist

Add real posts to `data/instagram-references.json`:

```json
{
  "metadata": { "schemaVersion": "1.0.0", "updatedAt": "2026-10-21T00:00:00.000Z" },
  "posts": [
    {
      "destinationSlug": "phewa-lake",
      "postUrl": "https://www.instagram.com/p/REAL_SHORTCODE/",
      "creatorUsername": "creator_handle",
      "caption": "Caption supplied or confirmed by the creator/editor.",
      "locationTag": "Phewa Lake, Pokhara",
      "rightsStatus": "PERMITTED",
      "rightsNote": "Creator gave permission to link and quote this caption.",
      "collectedAt": "2026-10-21T00:00:00.000Z"
    }
  ],
  "places": []
}
```

Rules:

- `postUrl` must be an `instagram.com/p/`, `/reel/` or `/tv/` permalink.
- `destinationSlug` must already exist, or be defined under `places` in the
  same file.
- `rightsStatus` is `PERMITTED` only when the editor has permission to display
  the link and caption. Otherwise use `UNVERIFIED`; it is stored but not shown
  publicly.
- Do not put an invented caption, location tag, creator or shortcode in the
  file. Unknown values should be omitted.

## Adding a place manually

A manual place needs a province, district, coordinates and a reliable
geographic source. Accepted sources are OpenStreetMap/Nominatim, Wikidata,
Nepal Tourism Board, UNESCO/WHC, and `*.gov.np`. Coordinates must fall inside
Nepal. Practical information is imported as `UNVERIFIED`, and the place is a
draft unless `"status": "PUBLISHED"` is set deliberately.

```json
{
  "places": [
    {
      "slug": "example-place",
      "name": "Example Place",
      "summary": "A short, factual summary of at least twenty characters.",
      "province": "gandaki",
      "district": "Kaski",
      "latitude": 28.2096,
      "longitude": 83.9856,
      "categorySlugs": ["lakes"],
      "sourceUrls": ["https://ntb.gov.np/"],
      "geoSourceUrl": "https://www.openstreetmap.org/",
      "status": "DRAFT"
    }
  ]
}
```

The importer refuses to overwrite an existing destination with the same slug.

## Commands

```bash
npm run data:instagram:dry   # validate and report, no writes
npm run data:instagram       # idempotent import
npm run data:instagram -- --strict
npm run data:instagram -- --no-graph
npm run data:instagram -- --file=data/instagram-references.json
```

`npm run db:seed` imports the same file by default, so a normal application
setup includes collected references and places. Set `SEED_INSTAGRAM_DATA=false`
to keep seeding limited to reference and destination data.

Every run writes `data/reports/instagram-import.json` (git-ignored). It records
created/updated/skipped/rejected counts, per-province coverage, Instagram
rights totals, Graph API errors and the exact verification still pending.

## Repeatability and duplicates

- Destinations are matched by unique slug.
- Instagram rows are matched by unique shortcode; re-importing updates the
  existing row rather than adding another.
- Duplicate shortcodes in one file keep the first occurrence and report the
  rest.
- A bad record is rejected individually; the rest of the batch continues.
- `--strict` exits non-zero if any record or Graph request failed.

## What the report answers

`data/reports/instagram-import.json` contains:

- destination counts per province;
- how many have coordinates, districts and public sources;
- how many have permitted Instagram references;
- manual vs Graph API totals;
- rejected records with reasons;
- pending verification (missing coordinates, missing districts, absent API
  access, no permitted posts).
