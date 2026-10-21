import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-white p-8 text-center">
      <p className="font-serif text-xl text-navy">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{children}</div> : null}
    </div>
  );
}
