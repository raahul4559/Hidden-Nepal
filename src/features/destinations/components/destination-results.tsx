import { CloudOff, Compass, Database } from "lucide-react";
import { cn } from "cn";

import type { DestinationListResult } from "../types";
import { DestinationCard, DestinationCardSkeleton } from "./destination-card";

type DestinationResultsProps = {
  result: DestinationListResult;
  /** Copy for the empty state, which differs between pages. */
  empty: { title: string; body: React.ReactNode; action?: React.ReactNode };
  /** `featured` gives the first card a larger, editorial treatment. */
  layout?: "grid" | "featured";
  headingLevel?: "h2" | "h3";
  /** Load the lead card's photo eagerly — set only when it is above the fold. */
  priorityLead?: boolean;
};

/**
 * How many of the three desktop columns the lead card spans so the grid
 * never ends with a gap: 3 (own row), 2 (shares a row with one card) or 0
 * (no lead; every card is regular).
 */
export function leadCardSpan(count: number): 0 | 2 | 3 {
  if (count <= 1) return count === 1 ? 3 : 0;
  const remainder = count % 3;
  return remainder === 1 ? 3 : remainder === 2 ? 2 : 0;
}

export function DestinationResults({
  result,
  empty,
  layout = "grid",
  headingLevel,
  priorityLead = false,
}: DestinationResultsProps) {
  if (result.status === "ok" && result.destinations.length > 0) {
    const count = result.destinations.length;
    const span = layout === "featured" ? leadCardSpan(count) : 0;
    // On the 2-column (sm/md) grid, span only if the rest pair up evenly.
    const spanOnSmall = span > 0 && (count - 1) % 2 === 0;
    return (
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {result.destinations.map((d, i) => {
          const lead = i === 0 && span > 0;
          return (
            <li
              key={d.slug}
              className={cn(
                "flex",
                lead && spanOnSmall && "sm:col-span-2",
                lead && span === 2 && "lg:col-span-2",
                lead && span === 3 && "lg:col-span-3",
              )}
            >
              <DestinationCard
                destination={d}
                variant={lead ? "feature" : "default"}
                headingLevel={headingLevel}
                priority={priorityLead && i === 0}
              />
            </li>
          );
        })}
      </ul>
    );
  }

  if (result.status === "error") {
    return (
      <StatePanel
        icon={<CloudOff aria-hidden className="size-6" />}
        title="Destinations couldn’t be loaded"
        body="Something went wrong on our side. Please try again in a moment."
        role="alert"
      />
    );
  }

  if (result.status === "unconfigured" && process.env.NODE_ENV === "development") {
    return (
      <StatePanel
        icon={<Database aria-hidden className="size-6" />}
        title="No database connected"
        body={
          <>
            Set <code className="rounded-sm bg-ivory-deep px-1">DATABASE_URL</code>{" "}
            in <code className="rounded-sm bg-ivory-deep px-1">.env</code> and run the
            migrations to load destinations. See the README. (Shown in development
            only.)
          </>
        }
      />
    );
  }

  return (
    <StatePanel
      icon={<Compass aria-hidden className="size-6" />}
      title={empty.title}
      body={empty.body}
      action={empty.action}
    />
  );
}

export function StatePanel({
  icon,
  title,
  body,
  action,
  role,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
  role?: "alert";
}) {
  return (
    <div
      role={role}
      className="flex flex-col items-start gap-4 rounded-md border border-dashed border-input/60 bg-card/60 p-8 sm:flex-row sm:p-10"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-navy text-gold">
        {icon}
      </span>
      <div className="max-w-xl">
        <h3 className="font-serif text-2xl leading-tight">{title}</h3>
        <div className="mt-2 leading-relaxed text-muted-foreground">{body}</div>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}

export function DestinationResultsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading destinations…</span>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <DestinationCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
