import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { logout, logoutEverywhere } from "@/features/auth/actions";
import { ProfileForm } from "@/features/auth/components/profile-form";
import { type CurrentUser, isAdmin, requireUser } from "@/features/auth/session";
import { formatDate } from "@/features/destinations/format";
import { destinationHref } from "@/features/destinations/schemas";
import { SaveToggle } from "@/features/saved/components/save-toggle";
import { listSavedDestinations } from "@/features/saved/service";
import { listTrips } from "@/features/trips/service";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <>
      <PageHeader eyebrow="Your account" title="Your Nepal" intro="Your profile and the places you’ve saved." />
      <Suspense fallback={<AccountSkeleton />}>
        <AccountContent />
      </Suspense>
    </>
  );
}

async function AccountContent() {
  // The real check. The proxy only redirects visitors without a cookie.
  const user = await requireUser("/account");

  return (
    <div className="container-page grid gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-16">
      <div className="space-y-12 lg:col-span-7">
        <section aria-labelledby="saved-title">
          <h2 id="saved-title" className="font-serif text-3xl">
            Saved destinations
          </h2>
          <SavedList user={user} />
        </section>

        <section aria-labelledby="trips-title">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="trips-title" className="font-serif text-3xl">
              Your trips
            </h2>
            <Link href="/trips" className="text-sm font-semibold text-himalaya underline underline-offset-2">
              Open trip planner
            </Link>
          </div>
          <TripsList user={user} />
        </section>
      </div>

      <aside className="space-y-10 lg:col-span-5">
        <section aria-labelledby="profile-title">
          <div className="rule-gold" />
          <h2 id="profile-title" className="mt-5 font-serif text-2xl">
            Profile
          </h2>
          <dl className="mt-4 space-y-1 text-sm">
            <div>
              <dt className="inline font-semibold">Email: </dt>
              <dd className="inline">{user.email}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Account type: </dt>
              <dd className="inline">{isAdmin(user) ? "Administrator" : "Traveller"}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <ProfileForm name={user.name} />
          </div>
          {isAdmin(user) ? (
            <p className="mt-6 text-sm">
              <Link href="/admin" className="font-semibold text-himalaya underline underline-offset-2">
                Open admin
              </Link>
            </p>
          ) : null}
        </section>

        <section aria-labelledby="session-title">
          <div className="rule-gold" />
          <h2 id="session-title" className="mt-5 font-serif text-2xl">
            Sign out
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <form action={logout}>
              <Button type="submit" size="lg">
                Sign out
              </Button>
            </form>
            <form action={logoutEverywhere}>
              <Button type="submit" variant="outline" size="lg">
                Sign out everywhere
              </Button>
            </form>
          </div>
        </section>
      </aside>
    </div>
  );
}

async function SavedList({ user }: { user: CurrentUser }) {
  const saved = await listSavedDestinations(user).catch(() => null);
  if (!saved) {
    return <p className="mt-6 text-muted-foreground">Your saved destinations couldn’t be loaded. Please try again.</p>;
  }
  if (saved.length === 0) {
    return (
      <div className="mt-6 rounded-md border border-border bg-white p-6">
        <p className="text-muted-foreground">You haven’t saved any destinations yet.</p>
        <LinkButton href="/explore" size="lg" className="mt-5">
          Explore destinations
        </LinkButton>
      </div>
    );
  }
  return (
    <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-white">
      {saved.map((d) => (
        <li key={d.slug} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href={destinationHref(d.slug)} className="font-serif text-xl hover:underline">
              {d.name}
            </Link>
            <p className="text-sm text-muted-foreground">{d.regionName}</p>
          </div>
          <SaveToggle slug={d.slug} initiallySaved tone="light" />
        </li>
      ))}
    </ul>
  );
}

async function TripsList({ user }: { user: CurrentUser }) {
  const trips = await listTrips(user).catch(() => null);
  if (!trips) {
    return <p className="mt-6 text-muted-foreground">Your trips couldn’t be loaded. Please try again.</p>;
  }
  if (trips.length === 0) {
    return (
      <div className="mt-6 rounded-md border border-border bg-white p-6">
        <p className="text-muted-foreground">You haven’t planned a trip yet.</p>
        <LinkButton href="/trips" size="lg" className="mt-5">
          Start a trip
        </LinkButton>
      </div>
    );
  }
  return (
    <>
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
      <LinkButton href="/trips" variant="outline" className="mt-4">
        All trips
      </LinkButton>
    </>
  );
}

function AccountSkeleton() {
  return (
    <div className="container-page py-14 sm:py-20" aria-busy>
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-40 animate-pulse rounded bg-muted" />
    </div>
  );
}
