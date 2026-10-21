export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading admin content">
      <div className="space-y-3 border-b border-border pb-5">
        <div className="h-3 w-24 rounded bg-ivory-deep" />
        <div className="h-8 w-64 rounded bg-ivory-deep" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 rounded-md border border-border bg-white" />
        ))}
      </div>
      <div className="h-72 rounded-md border border-border bg-white" />
    </div>
  );
}
