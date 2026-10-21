# Admin content studio

The admin area lives under `/admin`. It is guarded on the server: the layout
calls `requireAdminPage`, and every mutation calls `assertAdmin` again before
touching the database. Non-admins receive a 404, not a hint that the area
exists. All pages are `noindex, nofollow`.

## What editors can do

| Screen | Actions |
| --- | --- |
| `/admin` | Real PostgreSQL counts, latest audit entries, links into the queues |
| `/admin/destinations` | Search, filter by status, paginate, create, edit, preview, publish, unpublish, archive, restore |
| `/admin/destinations/[id]/images` | Upload or add by URL, edit alt text and attribution, reorder, choose the cover, remove |
| `/admin/guides` | Same lifecycle for long-form travel guides; published guides appear at `/guides` |
| `/admin/submissions` | Review community suggestions: inspect the full record and photo, approve, reject, request changes or reopen |
| `/admin/categories` | Edit the seven experience names, descriptions and sort order |
| `/admin/instagram` | Add public Instagram references through the idempotent importer |
| `/admin/users` | Change another user's role (never your own) |

There are no placeholder statistics or decorative buttons: each control either
writes to PostgreSQL or links to a screen that does.

## Validation and persistence

Admin forms are parsed by a form-specific Zod schema in
`src/features/admin/*-validation.ts`. The parsed values become the canonical
`destinationInputSchema` payload before persistence, so the public data rules
are never bypassed. Invalid submissions return field errors and preserve the
typed values.

Slugs are unique. A duplicate returns an inline error instead of overwriting
the existing row. Creating and updating are separate paths; editing preserves
images, sources and Instagram links, which have their own screens.

Archive is deliberately reversible: `ARCHIVED` hides a row from every public
query but keeps it for editors. Restore returns it to `DRAFT`; publishing sets
`publishedAt` only when it is missing. Deletes are limited to gallery images,
which are confirmed before removal; destination rows are archived rather than
destroyed.

## Community suggestions

`/contribute` writes a `PlaceSubmission` with status `PENDING`; nothing enters
the destination catalogue automatically. The queue at `/admin/submissions`
filters by status, searches place, district and submitter, and links to a detail
page with the description, province/district, category, coordinates, location
details, photo and submitter contact.

The detail page offers only the decisions that make sense for the current
status (`src/features/admin/submission-review.ts`):

| From | Allowed decisions |
| --- | --- |
| `PENDING` | approve, reject, request changes |
| `CHANGES_REQUESTED` | approve, reject, request changes, reopen |
| `REJECTED` | approve, request changes, reopen |
| `SPAM` | approve, reopen |
| `APPROVED` | none — approval is final |

Rejecting or requesting changes requires a written explanation. Each decision
records the reviewer and timestamp and appends an `AuditLog` row in the same
transaction. `reviewSubmission` re-checks `isAdmin` next to the data as well as
in the server action, so a direct service call cannot bypass the role check.

**Approval does not publish.** It records that an editor accepted the
suggestion. Creating the destination, writing researched copy and publishing it
remain separate steps, so an unverified suggestion or photo cannot reach
travellers through this queue. The photo is visible to admins only; reusing it
in a destination requires explicit permission from the submitter.

## Audit log

Every content mutation writes an append-only `AuditLog` row through
`recordAudit` inside the same transaction as the change. The dashboard reads
the latest ten entries. The log records the actor, action, entity type, entity
id and a small JSON metadata payload. Passwords and storage credentials are
never logged.

## Image uploads

Uploads go through `src/features/uploads/provider.ts`, a server-only
abstraction with a Cloudinary implementation:

1. The server action checks the admin session.
2. The file type and size are validated (JPEG, PNG, WebP or AVIF; 8 MB max).
3. The first bytes are checked against the expected file signature.
4. The file is signed and sent to Cloudinary with `node:crypto`; no SDK and no
   credential ever reaches the browser.
5. The durable `secure_url`, dimensions and public id are stored in
   `DestinationImage`.

If the three Cloudinary variables are missing, the upload control is replaced
by a setup guide and a working "add by URL" form. It does not pretend to
upload. See `.env.example` for the variable names. `res.cloudinary.com` is in
the `next/image` allow-list, and `next.config.ts` raises the server-action body
limit to 10 MB so an 8 MB image fits inside the multipart envelope.

Community suggestions reuse `validateImageMeta` and the signature check before
uploading. If Cloudinary is unconfigured, the photo field returns a clear error
and the rest of the suggestion can still be submitted. A file uploaded for a
submission whose database write then fails is destroyed as an orphan, the same
way as an admin upload.

When a file upload succeeds but the database write fails, the action attempts
to destroy the orphaned asset. Removing an image row does not delete the
storage asset; that is a separate, deliberate operation.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Content, audit log and counts |
| `AUTH_SECRET` | yes | Sign-in sessions |
| `CLOUDINARY_CLOUD_NAME` | for uploads | Cloudinary cloud |
| `CLOUDINARY_API_KEY` | for uploads | Server-side key |
| `CLOUDINARY_API_SECRET` | for uploads | Server-side signing secret |
| `CLOUDINARY_FOLDER` | no | Destination folder prefix |

Without a database, every admin screen renders an explicit "connect a
database" state instead of fake content.

## Tests

- `src/features/admin/*.test.ts` cover form validation, canonical conversion,
  publication timestamps, sample protection and guide validation.
- `src/features/uploads/validation.test.ts` covers types, size, signatures and
  renamed non-images.
- `src/features/admin/actions/authorization.test.ts` confirms unauthorized
  callers cannot create content, change status, upload or edit categories.
- `src/features/admin/submission-review.test.ts` covers allowed transitions,
  the mandatory explanations and status labels.
- `tests/integration/admin.test.ts` exercises CRUD, persistence, publication
  visibility, archive/restore, duplicate slugs, guides and audit rows when
  `TEST_DATABASE_URL` is configured.
- `tests/integration/moderation.test.ts` covers suggestion account linking,
  per-IP rate limits, non-admin refusal, every review transition, audit rows and
  the guarantee that approval does not publish a destination.
