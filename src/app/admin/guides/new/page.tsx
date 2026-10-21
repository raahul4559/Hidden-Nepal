import type { Metadata } from "next";

import { AdminHeading } from "@/features/admin/components/admin-heading";
import { EMPTY_GUIDE, GuideForm } from "@/features/admin/components/guide-form";

export const metadata: Metadata = { title: "New guide" };

export default function NewGuidePage() {
  return (
    <>
      <AdminHeading
        eyebrow="Editorial"
        title="New guide"
        intro="Drafts stay private until published. Publishing makes the guide available at /guides."
      />
      <GuideForm mode="create" values={EMPTY_GUIDE} />
    </>
  );
}
