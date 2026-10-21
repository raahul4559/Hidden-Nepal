import type { ReactNode } from "react";

export function AdminHeading({
  eyebrow,
  title,
  intro,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="eyebrow text-himalaya">{eyebrow}</p> : null}
        <h2 className="mt-1 font-serif text-3xl leading-tight text-navy">{title}</h2>
        {intro ? <div className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{intro}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      {children ? <div className="basis-full">{children}</div> : null}
    </div>
  );
}
