"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AdminError({
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
    <div className="rounded-md border border-border bg-white p-8">
      <p className="eyebrow text-destructive">Admin error</p>
      <h2 className="mt-2 font-serif text-2xl text-navy">This screen could not be loaded</h2>
      <p className="mt-2 max-w-xl text-sm text-ink-muted">
        The database or the page request failed. No changes were made. Try again, or check the
        server logs if the problem continues.
      </p>
      <Button className="mt-5" variant="accent" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}
