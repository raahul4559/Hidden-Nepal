import type { Metadata } from "next";

import { AdminHeading } from "@/features/admin/components/admin-heading";
import {
  DestinationForm,
  EMPTY_DESTINATION,
} from "@/features/admin/components/destination-form";
import { getAdminReferenceOptions } from "@/features/admin/reference";

export const metadata: Metadata = { title: "New destination" };

export default async function NewDestinationPage() {
  const result = await getAdminReferenceOptions();

  if (result.status === "unconfigured") {
    return (
      <>
        <AdminHeading eyebrow="Content" title="New destination" />
        <p className="rounded-md border border-gold/50 bg-gold/10 p-4 text-sm">
          Connect a database before creating destinations.
        </p>
      </>
    );
  }
  if (result.status === "error") throw new Error("Could not load reference data");
  if (result.regions.length === 0 || result.categories.length === 0) {
    return (
      <>
        <AdminHeading eyebrow="Content" title="New destination" />
        <p className="rounded-md border border-gold/50 bg-gold/10 p-4 text-sm">
          Reference data is missing. Run <code className="font-mono">npm run db:seed</code> to
          create provinces, categories and activities.
        </p>
      </>
    );
  }

  return (
    <>
      <AdminHeading
        eyebrow="Content"
        title="New destination"
        intro="Drafts are private. Publishing makes the destination visible immediately, after validation."
      />
      <DestinationForm
        mode="create"
        values={EMPTY_DESTINATION}
        regions={result.regions}
        categories={result.categories}
        activities={result.activities}
      />
    </>
  );
}
