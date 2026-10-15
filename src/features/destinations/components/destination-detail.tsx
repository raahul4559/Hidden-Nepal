import {
  BookOpen,
  CalendarRange,
  ExternalLink,
  ChevronRight,
  Clock,
  FlaskConical,
  Gauge,
  MapPin,
  Mountain,
  ShieldQuestion,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { PhotoCredit } from "@/components/media/photo-credit";
import { RemoteImage } from "@/components/media/remote-image";
import { getCategory } from "@/features/experiences/categories";
import { getSeasonByValue } from "@/features/seasons/seasons";

import {
  DIFFICULTY_LABELS,
  formatCostRange,
  formatDate,
  formatDays,
  formatElevation,
  toParagraphs,
} from "../format";
import { getRelatedDestinations } from "../queries";
import { exploreHref, provinceHref } from "../schemas";
import type { DestinationDetail as Detail, VerifiedPracticalInfo } from "../types";
import { DestinationResults, DestinationResultsSkeleton } from "./destination-results";

export function DestinationDetail({ destination }: { destination: Detail }) {
  const [cover, ...gallery] = destination.images;
  const paragraphs = toParagraphs(destination.description);
  const place = [destination.district, destination.region.name].filter(Boolean).join(", ");

  return (
    <article>
      {/* Hero */}
      <header className="surface-dark relative isolate flex min-h-[560px] items-end overflow-hidden lg:min-h-[min(78svh,760px)]">
        <div className="absolute inset-0 -z-20">
          <RemoteImage
            src={cover?.url}
            alt={cover?.alt ?? ""}
            sizes="100vw"
            priority
            className="object-cover"
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,var(--navy)_0%,rgb(11_31_51/0.75)_35%,rgb(11_31_51/0.2)_70%,rgb(11_31_51/0.55)_100%)]"
        />
        <div className="container-page pt-32 pb-12 sm:pb-16">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ivory/75">
              <li>
                <Link href="/" className="rounded-sm hover:text-ivory hover:underline">Home</Link>
              </li>
              <li aria-hidden><ChevronRight className="size-3.5" /></li>
              <li>
                <Link href="/explore" className="rounded-sm hover:text-ivory hover:underline">Explore</Link>
              </li>
              <li aria-hidden><ChevronRight className="size-3.5" /></li>
              <li>
                <Link
                  href={provinceHref(destination.region.slug)}
                  className="rounded-sm hover:text-ivory hover:underline"
                >
                  {destination.region.name}
                </Link>
              </li>
              <li aria-hidden><ChevronRight className="size-3.5" /></li>
              <li aria-current="page" className="text-ivory">{destination.name}</li>
            </ol>
          </nav>
          <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-[1.02] font-normal tracking-tight text-balance sm:text-6xl lg:text-7xl">
            {destination.name}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-ivory/85 sm:text-xl">
            {destination.summary}
          </p>
          <p className="mt-6 flex items-center gap-2 text-sm font-medium text-ivory/80">
            <MapPin aria-hidden className="size-4 text-gold" />
            {place}
          </p>
        </div>
        {cover?.credit ? (
          <PhotoCredit
            author={cover.caption ? `${cover.caption} · ${cover.credit}` : cover.credit}
            license={cover.license}
            sourceUrl={cover.sourceUrl}
            className="absolute right-3 bottom-3 max-w-[calc(100%-1.5rem)]"
          />
        ) : null}
      </header>

      {destination.isSample ? <SampleNotice /> : null}

      {/* Body */}
      <div className="container-page grid gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          {destination.categories.length ? (
            <ul aria-label="Experiences" className="flex flex-wrap gap-2">
              {destination.categories.map((slug) => (
                <li key={slug}>
                  <Link
                    href={exploreHref({ category: slug })}
                    className="inline-flex h-8 items-center rounded-full border border-input/50 bg-white px-3.5 text-sm font-medium transition-colors hover:border-navy"
                  >
                    {getCategory(slug)?.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          <h2 className="mt-10 font-serif text-3xl sm:text-4xl">About {destination.name}</h2>
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-pretty text-foreground/90">
            {paragraphs.length ? (
              paragraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p className="text-muted-foreground">A full write-up for this place is still being prepared.</p>
            )}
          </div>

          <PlanYourVisit info={destination.practicalInfo} />

          {gallery.length ? (
            <section aria-labelledby="gallery-title" className="mt-14">
              <h2 id="gallery-title" className="font-serif text-2xl">Gallery</h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {gallery.map((image) => (
                  <li key={image.url}>
                    <figure>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-navy-800">
                        <RemoteImage
                          src={image.url}
                          alt={image.alt}
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                        {image.credit ? (
                          <PhotoCredit
                            author={image.credit}
                            license={image.license}
                            sourceUrl={image.sourceUrl}
                            className="absolute right-2 bottom-2"
                          />
                        ) : null}
                      </div>
                      {image.caption ? (
                        <figcaption className="mt-2 text-sm text-muted-foreground">{image.caption}</figcaption>
                      ) : null}
                    </figure>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <Sources sources={destination.sources} />
        </div>

        <aside aria-labelledby="practical-title" className="lg:col-span-5">
          <div className="rounded-md border border-border bg-white p-6 sm:p-8 lg:sticky lg:top-8">
            <h2 id="practical-title" className="font-serif text-2xl">Practical information</h2>
            {destination.practicalInfo ? (
              <PracticalInfo info={destination.practicalInfo} />
            ) : (
              <UnverifiedPracticalInfo />
            )}
            <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
              {destination.practicalInfo
                ? `Last verified ${formatDate(destination.practicalInfo.verifiedAt)}`
                : "Practical details not yet verified"}
              {" · "}Page updated {formatDate(destination.updatedAt)}
            </p>
          </div>
        </aside>
      </div>

      <section
        aria-labelledby="related-title"
        className="border-t border-border bg-white py-14 sm:py-20"
      >
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="related-title" className="font-serif text-3xl sm:text-4xl">
              More in {destination.region.name}
            </h2>
            <Link
              href={provinceHref(destination.region.slug)}
              className="rounded-sm font-semibold text-himalaya hover:underline"
            >
              All of {destination.region.name}
            </Link>
          </div>
          <div className="mt-8">
            <Suspense fallback={<DestinationResultsSkeleton />}>
              <Related slug={destination.slug} region={destination.region.slug} regionName={destination.region.name} />
            </Suspense>
          </div>
        </div>
      </section>
    </article>
  );
}

async function Related({ slug, region, regionName }: { slug: string; region: Detail["region"]["slug"]; regionName: string }) {
  await connection();
  const result = await getRelatedDestinations(slug, region);
  return (
    <DestinationResults
      result={result}
      empty={{
        title: `Nothing else in ${regionName} yet`,
        body: "We’re researching more places here. Explore other provinces in the meantime.",
      }}
    />
  );
}

function SampleNotice() {
  return (
    <div role="note" className="border-b border-gold/40 bg-gold/10">
      <div className="container-page flex items-start gap-3 py-4 text-sm leading-relaxed">
        <FlaskConical aria-hidden className="mt-0.5 size-4 shrink-0 text-navy" />
        <p>
          <strong className="font-semibold">Sample content.</strong> This destination is
          development sample data. Its practical details are placeholders and must not be
          used to plan a trip.
        </p>
      </div>
    </div>
  );
}

function UnverifiedPracticalInfo() {
  return (
    <div className="mt-5 flex gap-3 rounded-md bg-ivory p-4">
      <ShieldQuestion aria-hidden className="mt-0.5 size-5 shrink-0 text-himalaya" />
      <p className="text-sm leading-relaxed text-muted-foreground">
        Costs, difficulty, elevation, best seasons and coordinates for this place haven’t
        been verified yet, so we’re not showing them. Check with local sources before you travel.
      </p>
    </div>
  );
}

function PracticalInfo({ info }: { info: VerifiedPracticalInfo }) {
  const rows: { icon: typeof Mountain; label: string; value: React.ReactNode }[] = [];
  if (info.elevationM !== null) rows.push({ icon: Mountain, label: "Elevation", value: formatElevation(info.elevationM) });
  if (info.difficulty) rows.push({ icon: Gauge, label: "Difficulty", value: DIFFICULTY_LABELS[info.difficulty] });
  if (info.suggestedDays) rows.push({ icon: Clock, label: "Suggested time", value: formatDays(info.suggestedDays) });
  if (info.cost)
    rows.push({
      icon: Wallet,
      label: "Estimated cost per person",
      value: (
        <>
          {formatCostRange(info.cost.min, info.cost.max, info.cost.currency)}
          {info.cost.notes ? <span className="block text-sm font-normal text-muted-foreground">{info.cost.notes}</span> : null}
        </>
      ),
    });
  if (info.seasons.length)
    rows.push({
      icon: CalendarRange,
      label: "Best seasons",
      value: (
        <>
          {info.seasons.map((s) => getSeasonByValue(s).label).join(", ")}
          {info.bestSeasonNotes ? <span className="block text-sm font-normal text-muted-foreground">{info.bestSeasonNotes}</span> : null}
        </>
      ),
    });
  if (info.coordinates) {
    const { latitude, longitude } = info.coordinates;
    rows.push({
      icon: MapPin,
      label: "Coordinates",
      value: (
        <a
          href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=12/${latitude}/${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-himalaya underline-offset-2 hover:underline"
        >
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
          <span className="sr-only"> (opens OpenStreetMap in a new tab)</span>
        </a>
      ),
    });
  }

  return (
    <>
      <dl className="mt-5 divide-y divide-border">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex gap-3 py-3.5">
            <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-himalaya" />
            <div>
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</dt>
              <dd className="mt-0.5 font-medium">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </>
  );
}

function PlanYourVisit({ info }: { info: VerifiedPracticalInfo | null }) {
  return (
    <section aria-labelledby="plan-title" className="mt-14">
      <h2 id="plan-title" className="font-serif text-2xl sm:text-3xl">Plan your visit</h2>
      {info ? (
        <div className="mt-6 space-y-8">
          <PlanBlock title="Activities">
            {info.activities.length ? (
              <ul className="flex flex-wrap gap-2">
                {info.activities.map((a) => (
                  <li key={a} className="rounded-full bg-ivory-deep px-3 py-1 text-sm">{a}</li>
                ))}
              </ul>
            ) : null}
          </PlanBlock>
          <PlanBlock title="Getting there">
            {toParagraphs(info.accessInfo).map((p, i) => <p key={i}>{p}</p>)}
          </PlanBlock>
          <PlanBlock title="Safety and preparation">
            {toParagraphs(info.safetyInfo).map((p, i) => <p key={i}>{p}</p>)}
          </PlanBlock>
        </div>
      ) : (
        <div className="mt-5 flex gap-3 rounded-md border border-border bg-white p-5">
          <ShieldQuestion aria-hidden className="mt-0.5 size-5 shrink-0 text-himalaya" />
          <p className="leading-relaxed text-muted-foreground">
            Activities, transport and access, permits, and safety and preparation advice for this
            place haven’t been verified yet, so we don’t show them. Conditions in Nepal change with
            the season; check with local authorities and operators before you travel.
          </p>
        </div>
      )}
    </section>
  );
}

/** A verified section; says so plainly when there's nothing verified to show. */
function PlanBlock({ title, children }: { title: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const empty = Array.isArray(items) ? items.length === 0 : !items;
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      <div className="mt-3 space-y-3 leading-relaxed">
        {empty ? <p className="text-muted-foreground">No verified information yet.</p> : items}
      </div>
    </div>
  );
}

function Sources({ sources }: { sources: Detail["sources"] }) {
  if (!sources.length) return null;
  return (
    <section aria-labelledby="sources-title" className="mt-14 border-t border-border pt-8">
      <h2 id="sources-title" className="flex items-center gap-2 font-serif text-2xl">
        <BookOpen aria-hidden className="size-5 text-himalaya" />
        Sources
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">References for the description above.</p>
      <ul className="mt-4 space-y-2">
        {sources.map((source) => (
          <li key={source.url} className="text-sm">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-himalaya underline-offset-2 hover:underline"
            >
              {source.title}
              <ExternalLink aria-hidden className="size-3.5" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            {source.publisher ? <span className="text-muted-foreground"> · {source.publisher}</span> : null}
            {source.accessedAt ? (
              <span className="text-muted-foreground"> · accessed {formatDate(source.accessedAt)}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
