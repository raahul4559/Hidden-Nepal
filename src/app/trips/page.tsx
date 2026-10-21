import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { requireUser } from "@/features/auth/session";
import { formatDate } from "@/features/destinations/format";
import { NewTripForm } from "@/features/trips/components/new-trip-form";
import { listTrips } from "@/features/trips/service";

export const metadata: Metadata = {
  title: "Your trips",
  robots: { index: false },
};

export default function TripsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Trip planner"
        title="Your trips"
        intro="Sketch an itinerary, keep the places you want to see in order, and come back to it from any device."
      />
      <Suspense fallback={<TripsSkeleton />}>
        <TripsContent />
      </Suspense>
    </>
  );
}

async function TripsContent() {
  // The real check. The proxy only redirects visitors without a cookie.
  const user = await requireUser("/trips");
  const trips = await listTrips(user).catch(() => null);

  return (
    <div className="container-page grid gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-16">
      <section aria-labelledby="trips-title" className="lg:col-span-7">
        <h2 id="trips-title" className="font-serif text-3xl">
          Saved trips
        </h2>

        {trips === null ? (
          <p className="mt-6 text-muted-foreground">
            Your trips couldn’t be loaded. Please try again.
          </p>
        ) : trips.length === 0 ? (
          <div className="mt-6 rounded-md border border-border bg-white p-6">
            <p className="text-muted-foreground">
              You haven’t planned a trip yet. Start one, then add places from the catalogue.
            </p>
            <LinkButton href="/explore" size="lg" className="mt-5">
              Explore destinations
            </LinkButton>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-white">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Link
                  href={`/trips/${trip.id}`}
                  className="flex flex-col gap-1 p-5 transition-colors hover:bg-ivory sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-serif text-xl text-navy">{trip.title}</span>
                  <span className="text-sm text-ink-muted">
                    {trip.stopCount} {trip.stopCount === 1 ? "stop" : "stops"} · updated{" "}
                    {formatDate(trip.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="space-y-10 lg:col-span-5">
        <section aria-labelledby="new-trip-title">
          <div className="rule-gold" />
          <h2 id="new-trip-title" className="mt-5 font-serif text-2xl">
            Start a trip
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Give it a name to begin. You can add stops, change the order and keep notes as the
            plan takes shape.
          </p>
          <div className="mt-5">
            <NewTripForm />
          </div>
        </section>

        <section aria-labelledby="trips-privacy-title">
          <div className="rule-gold" />
          <h2 id="trips-privacy-title" className="mt-5 font-serif text-2xl">
            Private by default
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Trips belong to your account and are only visible to you. Sharing and public
            itineraries will arrive later; nothing is published from here.
          </p>
        </section>
      </aside>
    </div>
  );
}

function TripsSkeleton() {
  return (
    <div className="container-page py-14 sm:py-20" aria-busy>
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-40 animate-pulse rounded bg-muted" />
    </div>
  );
}
