"use client";

import { useEffect } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageHeader
      eyebrow="Something went wrong"
      title="We lost the trail for a moment"
      intro="An unexpected error stopped this page from loading. Please try again."
      className="pb-24 sm:pb-32"
    >
      <div className="mt-10 flex flex-wrap gap-3">
        <Button variant="accent" size="lg" onClick={retry}>
          Try again
        </Button>
        <LinkButton href="/" variant="outline" size="lg" className="border-ivory/40 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory">
          Back to home
        </LinkButton>
      </div>
    </PageHeader>
  );
}
