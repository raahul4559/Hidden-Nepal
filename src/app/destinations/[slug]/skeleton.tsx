export function DestinationDetailSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading destination…</span>
      <div aria-hidden className="surface-dark flex min-h-[560px] items-end lg:min-h-[min(78svh,760px)]">
        <div className="container-page space-y-5 pt-32 pb-16">
          <div className="h-3 w-48 animate-pulse rounded-sm bg-ivory/15" />
          <div className="h-14 w-2/3 animate-pulse rounded-sm bg-ivory/15" />
          <div className="h-5 w-1/2 animate-pulse rounded-sm bg-ivory/10" />
        </div>
      </div>
      <div aria-hidden className="container-page grid gap-12 py-14 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="h-8 w-1/2 animate-pulse rounded-sm bg-ivory-deep" />
          <div className="h-32 animate-pulse rounded-sm bg-ivory-deep" />
        </div>
        <div className="h-64 animate-pulse rounded-md bg-ivory-deep lg:col-span-5" />
      </div>
    </div>
  );
}
