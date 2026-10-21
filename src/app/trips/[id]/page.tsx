import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/features/auth/session";
import { formatDate } from "@/features/destinations/format";
import { AddStopForm } from "@/features/trips/components/add-stop-form";
import { DeleteTripForm } from "@/features/trips/components/delete-trip-form";
import { TripDetailsForm } from "@/features/trips/components/trip-details-form";
import { TripStopCard } from "@/features/trips/components/trip-stop-card";
import { getTrip, listTripDestinationOptions } from "@/features/trips/service";

export const metadata: Metadata = {
  title: "Trip",
  robots: { index: false },
};

export default function TripPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<TripSkeleton />}>
      <TripContent params={params} />
    </Suspense>
  );
}

async function TripContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/trips/${id}`);

  let result;
  try {
    // Ownership is checked in the query, so another account's trip is not found.
    result = await getTrip(user, id);
  } catch {
    return (
      <>
        <PageHeader eyebrow="Trip planner" title="Trip" />
        <div className="container-page py-14 sm:py-20">
          <p className="text-muted-foreground">
            This trip couldn’t be loaded. Please try again.
          </p>
        </div>
      </>
    );
  }

  if (result.status === "not_found") notFound();
  const trip = result.trip;

  const options = await listTripDestinationOptions().catch(() => null);
  const usedSlugs = new Set(
    trip.stops
      .map((stop) => stop.destinationSlug)
      .filter((slug): slug is string => slug !== null),
  );
  const availableOptions = options?.filter((option) => !usedSlugs.has(option.slug)) ?? [];
  const order = trip.stops.map((stop) => stop.id);

  return (
    <>
      <PageHeader
        eyebrow="Your trip"
        title={trip.title}
        intro={
          <>
            {trip.stops.length} {trip.stops.length === 1 ? "stop" : "stops"} · updated{" "}
            {formatDate(trip.updatedAt)}
          </>
        }
      >
        <p className="mt-6">
          <Link
            href="/trips"
            className="text-sm font-semibold text-ivory underline decoration-gold underline-offset-4 hover:text-gold"
          >
            ← All trips
          </Link>
        </p>
      </PageHeader>

      <div className="container-page grid gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-16">
        <div className="space-y-12 lg:col-span-7">
          <section aria-labelledby="stops-title">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="stops-title" className="font-serif text-3xl">
                Stops
              </h2>
              <p className="text-sm text-ink-muted">Ordered from first to last.</p>
            </div>

            {trip.stops.length === 0 ? (
              <div className="mt-6 rounded-md border border-border bg-white p-6">
                <p className="text-muted-foreground">
                  No stops yet. Add a place below, then move it up or down as you plan the route.
                </p>
              </div>
            ) : (
              <ol className="mt-6 space-y-4">
                {trip.stops.map((stop, index) => (
                  <TripStopCard
                    key={stop.id}
                    tripId={trip.id}
                    stop={stop}
                    index={index}
                    total={trip.stops.length}
                    order={order}
                  />
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="add-stop-title">
            <div className="rule-gold" />
            <h2 id="add-stop-title" className="mt-5 font-serif text-2xl">
              Add a stop
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Only published destinations can be added. New stops go to the end; use the arrows
              to put them in order.
            </p>
            <div className="mt-5">
              {options === null ? (
                <p className="text-sm text-ink-muted">
                  The destination list couldn’t be loaded. Refresh the page to try again.
                </p>
              ) : (
                <AddStopForm tripId={trip.id} options={availableOptions} />
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-10 lg:col-span-5">
          <section aria-labelledby="details-title">
            <div className="rule-gold" />
            <h2 id="details-title" className="mt-5 font-serif text-2xl">
              Trip details
            </h2>
            <div className="mt-5">
              <TripDetailsForm tripId={trip.id} title={trip.title} notes={trip.notes} />
            </div>
          </section>

          <section aria-labelledby="visibility-title">
            <div className="rule-gold" />
            <h2 id="visibility-title" className="mt-5 font-serif text-2xl">
              Visibility
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              This trip is private to your account. Nothing here is shown on the public site.
            </p>
          </section>

          <section aria-labelledby="delete-trip-title">
            <div className="rule-gold" />
            <h2 id="delete-trip-title" className="mt-5 font-serif text-2xl">
              Delete trip
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Permanently removes this trip and its stops. Destinations in the catalogue are not
              affected.
            </p>
            <div className="mt-5">
              <DeleteTripForm tripId={trip.id} title={trip.title} />
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function TripSkeleton() {
  return (
    <>
      <PageHeader eyebrow="Trip planner" title="Trip" />
      <div className="container-page py-14 sm:py-20" aria-busy>
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-40 animate-pulse rounded bg-muted" />
      </div>
    </>
  );
}
