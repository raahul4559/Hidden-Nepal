import { ChevronRight, CloudRain, Flower2, Leaf, Snowflake } from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/editorial/section-heading";
import { exploreHref } from "@/features/destinations/schemas";

import { SEASONS, type SeasonSlug } from "../seasons";

const ICONS: Record<SeasonSlug, typeof Flower2> = {
  spring: Flower2,
  monsoon: CloudRain,
  autumn: Leaf,
  winter: Snowflake,
};

export function SeasonalDiscovery() {
  return (
    <section
      id="seasons"
      aria-labelledby="seasons-title"
      className="border-t border-border bg-white py-20 sm:py-28"
    >
      <div className="container-page">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <SectionHeading
            id="seasons-title"
            eyebrow="Seasonal discovery"
            title="Every season opens a different Nepal"
            className="lg:col-span-7"
          />
          <p className="text-sm leading-relaxed text-muted-foreground lg:col-span-5">
            Months are approximate and shift with altitude and year. Season
            links only show destinations whose seasonal details have been
            verified. Always check current conditions locally before you travel.
          </p>
        </div>

        <ul className="mt-12 grid border-t border-l border-border sm:grid-cols-2 lg:grid-cols-4">
          {SEASONS.map((season) => {
            const Icon = ICONS[season.slug];
            return (
              <li
                key={season.slug}
                className="group relative flex flex-col border-r border-b border-border p-6 transition-colors duration-300 hover:bg-ivory sm:p-8"
              >
                <Icon aria-hidden className="size-6 text-himalaya" strokeWidth={1.5} />
                <h3 className="mt-6 font-serif text-3xl leading-none">
                  <Link
                    href={exploreHref({ season: season.slug })}
                    className="rounded-sm after:absolute after:inset-0 after:content-['']"
                  >
                    {season.label}
                  </Link>
                </h3>
                <p className="mt-2 text-sm font-semibold text-muted-foreground">{season.months}</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {season.description}
                </p>
                <span
                  aria-hidden
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-himalaya"
                >
                  Places for {season.label.toLowerCase()}
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
