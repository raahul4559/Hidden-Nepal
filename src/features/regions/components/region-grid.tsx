import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { cn } from "cn";

import { SectionHeading } from "@/components/editorial/section-heading";
import { getProvinceCounts } from "@/features/destinations/queries";
import { provinceHref } from "@/features/destinations/schemas";

import { PROVINCES, type ProvinceSlug } from "../provinces";

type Counts = Partial<Record<ProvinceSlug, number>> | null;

export function RegionGrid() {
  return (
    <section
      id="provinces"
      aria-labelledby="provinces-title"
      className="surface-dark py-20 sm:py-28"
    >
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:sticky lg:top-12 lg:col-span-5 lg:self-start">
          <SectionHeading
            id="provinces-title"
            eyebrow="Explore by province"
            title="Seven provinces, from the Terai to the high Himalaya"
            intro="Nepal’s provinces run north to south across lowland plains, middle hills and mountains. Pick one and see what lies beyond the usual stops."
          />
        </div>
        <ProvinceDirectory className="lg:col-span-7" />
      </div>
    </section>
  );
}

/** The seven provinces with live published counts (the list itself is static). */
export function ProvinceDirectory({ className }: { className?: string }) {
  return (
    <Suspense fallback={<ProvinceList counts={null} className={className} />}>
      <ProvinceListWithCounts className={className} />
    </Suspense>
  );
}

async function ProvinceListWithCounts({ className }: { className?: string }) {
  await connection();
  const result = await getProvinceCounts();
  // On failure or without a database, simply omit counts.
  return <ProvinceList counts={result.status === "ok" ? result.counts : null} className={className} />;
}

function countLabel(count: number) {
  return count === 0
    ? "No destinations yet"
    : `${count} destination${count === 1 ? "" : "s"}`;
}

function ProvinceList({ counts, className }: { counts: Counts; className?: string }) {
  return (
    <ol className={cn("grid border-t border-border sm:grid-cols-2", className)}>
      {PROVINCES.map((province, index) => {
        const count = counts?.[province.slug];
        return (
          <li
            key={province.slug}
            className="group relative border-b border-border sm:odd:border-r sm:odd:pr-8 sm:even:pl-8"
          >
            <div className="flex items-start gap-5 py-7">
              <span aria-hidden className="font-serif text-sm text-gold tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <h3 className="font-serif text-2xl leading-tight sm:text-3xl">
                  <Link
                    href={provinceHref(province.slug)}
                    className="rounded-sm after:absolute after:inset-0 after:content-['']"
                  >
                    {province.name}
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-ivory/70">
                  <span className="sr-only">Known for: </span>
                  {province.knownFor.join(" · ")}
                </p>
                {count !== undefined ? (
                  <p className="mt-3 text-xs font-semibold tracking-wide text-teal uppercase">
                    {countLabel(count)}
                  </p>
                ) : null}
              </div>
              <ArrowRight
                aria-hidden
                className="mt-2 size-5 text-ivory/40 transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-teal"
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
