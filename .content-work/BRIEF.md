# Destination content brief

Goal: write the long-form **"About {place}"** body copy that the destination page
renders, for every researched destination, with facts cross-checked against
sources.

Repo: `/Users/baldev/Desktop/Tourism`

## Where the content lives

`data/nepal-tourism-destinations.json` → `prisma/seed/researched-destinations.ts`
(maps each record into `DestinationInput`) → Postgres → the destination page.

The page renders:
- `short_description` → the hero summary **and** the card summary on /explore
- `description` → the "About {name}" body, split into paragraphs on blank lines
- `provenance` → the "Sources" list

So the only two text fields you write are `short_description` and `description`.

**Do not edit `data/nepal-tourism-destinations.json` yourself.** Write your
output to your assigned batch file so the batches can be merged safely.

## Input

Each record already has: `name`, `slug`, `province`, `district`, `municipality`,
`latitude`, `longitude`, `categories`, `short_description`, `description`,
`scenic_features`, `activities`, `best_season`, `source_urls`, `provenance`,
`verification_status`, `data_quality_notes`.

Print your records with:

```bash
cd /Users/baldev/Desktop/Tourism && node -e '
const d=require("./data/nepal-tourism-destinations.json");
for (const s of ["slug-a","slug-b"]) {
  const x=d.destinations.find(y=>y.slug===s);
  console.log(JSON.stringify(x,null,1));
}'
```

Many records are thin: some only cite Wikidata, some are marked
`needs_review`. Keep your claims inside what you can verify.

## What to write

### `description` (the important one)

- 3 paragraphs, roughly 200–320 words total, paragraphs separated by a blank
  line (`\n\n` in the JSON string).
- Paragraph 1: what the place is and where it is — province/district, what kind
  of place it is (lake, national park, temple, durbar square, town, trekking
  area), and any verified headline figure (elevation, area, inscribed year).
- Paragraph 2: what makes it notable — ecology, history, living culture,
  religious significance, wildlife, architecture, what it is known for.
- Paragraph 3: what a visitor actually experiences here — the landscape or
  setting, typical activities, and the general shape of a visit (no prices).
- Plain, neutral editorial English. No marketing hype ("must-see", "breathtaking",
  "paradise"), no first person, no calls to action.
- Do **not** invent numbers. Only include a figure if you verified it (see below).
  If you cannot verify an elevation, area or date, describe the place without it.
- No prices, permit fees, bus times or visa rules — the site deliberately shows
  no unverified practical figures.
- Do not repeat the summary sentence verbatim; the body should add substance.

### `short_description`

- One sentence, about 90–170 characters, no newline.
- It becomes the hero summary, so it must stand alone and contain no fact that
  is absent from the description.
- If the existing `short_description` already meets this, you may keep it.

## Cross-checking facts

- Use web search to verify the key factual claims for each place: location,
  elevation, area, designation/inscription years, what it is (lake vs wetland vs
  national park), and any World Heritage or Ramsar status.
- Prefer authoritative sources: UNESCO World Heritage Centre, Ramsar Sites
  Information Service, Nepal Tourism Board (ntb.gov.np), national park /
  conservation area official pages, government or municipality pages. Wikipedia
  and Wikidata are fine for orientation; cite them if they are what backs a claim.
- If a claim cannot be verified, drop the claim — a shorter honest paragraph is
  better than a confident wrong one.
- Note contradictions (for example two different elevations) and leave the
  figure out, or report it in your response.

## Output format

Write exactly one file: `.content-work/batch-<N>.json`

```json
{
  "slug-a": {
    "short_description": "One sentence summary.",
    "description": "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.",
    "notes": [
      "Optional: a short data-quality note, e.g. 'Elevation differs between sources (x m vs y m); omitted.'"
    ],
    "add_sources": [
      {
        "url": "https://example.org/page",
        "publisher": "UNESCO World Heritage Centre",
        "license": "Unknown",
        "fields": ["description"]
      }
    ]
  }
}
```

- `notes` is optional; it is appended to the record's `data_quality_notes`.
- `add_sources` is optional; it is appended to the record's `provenance`, so only
  include sources you actually used, with the real publisher name. `license` may
  be omitted if unknown; `fields` should be `["description"]`.
- Valid JSON only, no comments, no trailing commas. Keep it ASCII (no smart quotes
  or em dashes — use plain `-` or `,`).

## Constraints (validated by tests)

- `short_description` (becomes `summary`): 20–280 characters.
- `description`: at most 5000 characters.
- Slugs must match the existing records exactly.
