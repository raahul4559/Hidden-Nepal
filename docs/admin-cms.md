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
- `tests/integration/admin.test.ts` exercises CRUD, persistence, publication
  visibility, archive/restore, duplicate slugs, guides and audit rows when
  `TEST_DATABASE_URL` is configured.
