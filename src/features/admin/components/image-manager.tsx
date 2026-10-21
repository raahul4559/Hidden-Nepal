"use client";

import { useActionState } from "react";

import { RemoteImage } from "@/components/media/remote-image";
import { Button } from "@/components/ui/button";

import {
  addDestinationImageUrl,
  deleteDestinationImage,
  moveDestinationImage,
  updateDestinationImage,
  uploadDestinationImage,
  type ImageActionState,
} from "../actions/images";

export type AdminImage = {
  id: string;
  url: string;
  alt: string;
  caption: string | null;
  credit: string | null;
  license: string | null;
  sourceUrl: string | null;
  position: number;
};

const inputClass =
  "h-9 w-full rounded-md border border-input bg-white px-2.5 text-sm text-navy outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20";

function Message({ state }: { state: ImageActionState }) {
  if (state.status === "idle") return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={
        "mt-2 rounded-md px-3 py-2 text-sm " +
        (state.status === "error"
          ? "bg-destructive/5 text-destructive"
          : "bg-teal/10 text-teal-button")
      }
    >
      {state.message}
    </p>
  );
}

function MetadataFields({ image }: { image?: AdminImage }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm sm:col-span-2">
        <span className="mb-1 block font-medium text-navy">Alt text</span>
        <input
          name="alt"
          required
          defaultValue={image?.alt ?? ""}
          maxLength={300}
          className={inputClass}
          placeholder="Describe what the image shows"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-navy">Credit</span>
        <input
          name="credit"
          defaultValue={image?.credit ?? ""}
          maxLength={200}
          className={inputClass}
          placeholder="Photographer or source"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-navy">Licence</span>
        <input
          name="license"
          defaultValue={image?.license ?? ""}
          maxLength={60}
          className={inputClass}
          placeholder="CC BY-SA 4.0"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-navy">Source URL</span>
        <input
          name="sourceUrl"
          type="url"
          defaultValue={image?.sourceUrl ?? ""}
          className={inputClass}
          placeholder="https://…"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-navy">Caption</span>
        <input
          name="caption"
          defaultValue={image?.caption ?? ""}
          maxLength={200}
          className={inputClass}
        />
      </label>
    </div>
  );
}

function ImageOrderForm({
  destinationId,
  imageId,
  intent,
  label,
  confirmMessage,
}: {
  destinationId: string;
  imageId: string;
  intent: "up" | "down" | "cover";
  label: string;
  confirmMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(moveDestinationImage, { status: "idle" });
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <input type="hidden" name="destinationId" value={destinationId} />
      <input type="hidden" name="imageId" value={imageId} />
      <input type="hidden" name="intent" value={intent} />
      <Button type="submit" variant="outline" size="xs" disabled={pending}>
        {pending ? "…" : label}
      </Button>
      {state.status === "error" ? (
        <span role="alert" className="ml-2 text-xs text-destructive">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

function DeleteImageForm({
  destinationId,
  image,
}: {
  destinationId: string;
  image: AdminImage;
}) {
  const [state, formAction, pending] = useActionState(deleteDestinationImage, { status: "idle" });
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Remove this image from the gallery? The stored file is not deleted.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="destinationId" value={destinationId} />
      <input type="hidden" name="imageId" value={image.id} />
      <Button type="submit" variant="destructive" size="xs" disabled={pending}>
        {pending ? "Removing…" : "Remove"}
      </Button>
      {state.status === "error" ? (
        <span role="alert" className="ml-2 text-xs text-destructive">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

function ImageEditorRow({
  destinationId,
  image,
  index,
  count,
}: {
  destinationId: string;
  image: AdminImage;
  index: number;
  count: number;
}) {
  const [state, formAction, pending] = useActionState(updateDestinationImage, {
    status: "idle",
  });

  return (
    <li className="rounded-md border border-border bg-white p-4">
      <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-ivory-deep">
          <RemoteImage src={image.url} alt={image.alt} sizes="180px" className="object-cover" />
          <span className="absolute top-2 left-2 rounded bg-navy/85 px-2 py-0.5 text-xs font-semibold text-ivory">
            {index === 0 ? "Cover" : `#${index + 1}`}
          </span>
        </div>

        <div>
          <form action={formAction}>
            <input type="hidden" name="destinationId" value={destinationId} />
            <input type="hidden" name="imageId" value={image.id} />
            <MetadataFields image={image} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button type="submit" variant="default" size="sm" disabled={pending}>
                {pending ? "Saving…" : "Save details"}
              </Button>
              <span className="text-xs text-ink-muted">Stored at position {image.position}</span>
            </div>
            <Message state={state} />
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {index > 0 ? (
              <ImageOrderForm
                destinationId={destinationId}
                imageId={image.id}
                intent="up"
                label="Move up"
              />
            ) : null}
            {index < count - 1 ? (
              <ImageOrderForm
                destinationId={destinationId}
                imageId={image.id}
                intent="down"
                label="Move down"
              />
            ) : null}
            {index > 0 ? (
              <ImageOrderForm
                destinationId={destinationId}
                imageId={image.id}
                intent="cover"
                label="Make cover"
              />
            ) : null}
            <DeleteImageForm destinationId={destinationId} image={image} />
            <code className="ml-auto max-w-full truncate text-xs text-ink-muted" title={image.url}>
              {image.url}
            </code>
          </div>
        </div>
      </div>
    </li>
  );
}

export function ImageManager({
  destination,
  storageConfigured,
}: {
  destination: { id: string; slug: string; name: string; images: AdminImage[] };
  storageConfigured: boolean;
}) {
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadDestinationImage, {
    status: "idle",
  });
  const [urlState, urlAction, urlPending] = useActionState(addDestinationImageUrl, {
    status: "idle",
  });

  return (
    <div className="space-y-6">
      {storageConfigured ? (
        <section className="rounded-md border border-border bg-white p-5">
          <h3 className="font-serif text-xl text-navy">Upload an image</h3>
          <p className="mt-1 text-sm text-ink-muted">
            JPEG, PNG, WebP or AVIF, up to 8 MB. Uploads go to the configured server-side storage
            provider; no credentials reach the browser.
          </p>
          <form action={uploadAction} className="mt-4 space-y-3">
            <input type="hidden" name="destinationId" value={destination.id} />
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-navy">Image file</span>
              <input
                type="file"
                name="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                required
                className="block w-full rounded-md border border-input bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-ivory-deep file:px-3 file:py-1.5 file:text-sm file:font-medium"
              />
            </label>
            <MetadataFields />
            <Button type="submit" variant="accent" size="sm" disabled={uploadPending}>
              {uploadPending ? "Uploading…" : "Upload image"}
            </Button>
            <Message state={uploadState} />
          </form>
        </section>
      ) : (
        <section className="rounded-md border border-gold/50 bg-gold/10 p-5">
          <h3 className="font-serif text-xl text-navy">Uploads need storage credentials</h3>
          <p className="mt-1 text-sm text-navy/80">
            The upload button is intentionally disabled rather than pretending an upload worked.
            Add these server-only variables to <code className="font-mono">.env.local</code> and
            restart the app:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-md bg-navy p-3 text-xs text-ivory">
            {`CLOUDINARY_CLOUD_NAME=…
CLOUDINARY_API_KEY=…
CLOUDINARY_API_SECRET=…
# optional
CLOUDINARY_FOLDER=hidden-nepal/destinations`}
          </pre>
          <p className="mt-3 text-xs text-navy/70">
            Create these values in the Cloudinary dashboard. Keep the API secret server-side and
            never prefix it with <code className="font-mono">NEXT_PUBLIC_</code>.
          </p>
        </section>
      )}

      <section className="rounded-md border border-border bg-white p-5">
        <details>
          <summary className="cursor-pointer font-serif text-xl text-navy">
            Add an image by URL
          </summary>
          <p className="mt-2 text-sm text-ink-muted">
            Use this for images already hosted on a durable HTTPS URL. You are responsible for the
            licence and attribution.
          </p>
          <form action={urlAction} className="mt-4 space-y-3">
            <input type="hidden" name="destinationId" value={destination.id} />
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-navy">Image URL</span>
              <input
                name="url"
                type="url"
                required
                placeholder="https://…"
                className={inputClass}
              />
            </label>
            <MetadataFields />
            <Button type="submit" variant="default" size="sm" disabled={urlPending}>
              {urlPending ? "Adding…" : "Add image URL"}
            </Button>
            <Message state={urlState} />
          </form>
        </details>
      </section>

      <section aria-labelledby="gallery-heading">
        <h3 id="gallery-heading" className="font-serif text-xl text-navy">
          Gallery ({destination.images.length})
        </h3>
        {destination.images.length === 0 ? (
          <p className="mt-3 rounded-md border border-dashed border-border bg-white p-6 text-sm text-ink-muted">
            No images yet. The first image becomes the cover on cards and the destination hero.
          </p>
        ) : (
          <ol className="mt-3 space-y-3">
            {destination.images.map((image, index) => (
              <ImageEditorRow
                key={image.id}
                destinationId={destination.id}
                image={image}
                index={index}
                count={destination.images.length}
              />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
