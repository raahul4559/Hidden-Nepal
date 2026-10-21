"use client";

import { useActionState } from "react";

import { InstagramRightsStatus } from "@/generated/prisma/enums";

import { FormAlert, SubmitButton, TextField } from "@/features/auth/components/form-parts";

import { addInstagramReference, type InstagramFormState } from "../actions";

const initialState: InstagramFormState = { status: "idle" };

type DestinationOption = {
  slug: string;
  name: string;
  region: { name: string };
};

export function InstagramReferenceForm({ destinations }: { destinations: DestinationOption[] }) {
  const [state, formAction] = useActionState(addInstagramReference, initialState);

  return (
    <form action={formAction} className="grid gap-5 rounded-md border border-border bg-white p-6 sm:p-8">
      <div className="grid gap-2">
        <label htmlFor="destinationSlug" className="text-sm font-semibold">
          Destination
        </label>
        <select
          id="destinationSlug"
          name="destinationSlug"
          required
          defaultValue=""
          className="h-12 w-full rounded-md border border-input bg-white px-3.5 text-base text-navy aria-invalid:border-destructive"
        >
          <option value="" disabled>
            Choose a published destination…
          </option>
          {destinations.map((destination) => (
            <option key={destination.slug} value={destination.slug}>
              {destination.name} — {destination.region.name}
            </option>
          ))}
        </select>
      </div>

      <TextField
        id="postUrl"
        label="Public Instagram post URL"
        type="url"
        required
        placeholder="https://www.instagram.com/p/…/"
        hint="Only a public /p/, /reel/ or /tv/ link is stored. Nothing is scraped."
      />

      <TextField
        id="creatorUsername"
        label="Creator username"
        optional
        maxLength={31}
        placeholder="username"
      />

      <div className="grid gap-2">
        <label htmlFor="caption" className="text-sm font-semibold">
          Caption <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="caption"
          name="caption"
          rows={4}
          maxLength={2200}
          className="w-full rounded-md border border-input bg-white px-3.5 py-3 text-base text-navy placeholder:text-ink-muted aria-invalid:border-destructive"
          placeholder="Short excerpt or description, if useful."
        />
      </div>

      <TextField
        id="locationTag"
        label="Location tag"
        optional
        maxLength={120}
        placeholder="As shown on the post"
      />

      <div className="grid gap-2">
        <label htmlFor="rightsStatus" className="text-sm font-semibold">
          Rights status
        </label>
        <select
          id="rightsStatus"
          name="rightsStatus"
          defaultValue={InstagramRightsStatus.UNVERIFIED}
          className="h-12 w-full rounded-md border border-input bg-white px-3.5 text-base text-navy"
        >
          <option value={InstagramRightsStatus.UNVERIFIED}>
            UNVERIFIED — store, do not publish
          </option>
          <option value={InstagramRightsStatus.PERMITTED}>
            PERMITTED — creator gave permission
          </option>
        </select>
        <p className="text-sm text-muted-foreground">
          Only PERMITTED references appear on the public destination page. Choose it only with the
          creator’s permission.
        </p>
      </div>

      <TextField
        id="rightsNote"
        label="Rights note"
        optional
        maxLength={500}
        placeholder="Where or when permission was given"
      />

      {state.status === "error" ? <FormAlert message={state.message} /> : null}
      {state.status === "ok" ? (
        <p role="status" className="rounded-md border border-himalaya/30 bg-himalaya/5 p-4 text-sm font-semibold text-himalaya">
          {state.message}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Saving…">Save reference</SubmitButton>
    </form>
  );
}
