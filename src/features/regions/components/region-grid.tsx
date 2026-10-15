import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/editorial/section-heading";
import { exploreHref } from "@/features/destinations/schemas";

import { PROVINCES } from "../provinces";

export function RegionGrid() {
  return (
    <section
      id="regions"
      aria-labelledby="regions-title"
      className="surface-dark py-20 sm:py-28"
    >
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading
            id="regions-title"
            eyebrow="Explore by region"
            title="Seven provinces, from the Terai to the high Himalaya"
            intro="Nepal’s provinces run north to south across lowland plains, middle hills and mountains. Pick one and see what lies beyond the usual stops."
          />
        </div>

        <ol className="grid border-t border-border sm:grid-cols-2 lg:col-span-7">
          {PROVINCES.map((province, index) => (
            <li
              key={province.slug}
              className="group relative border-b border-border sm:odd:border-r sm:odd:pr-8 sm:even:pl-8"
            >
              <div className="flex items-start gap-5 py-7">
                <span
                  aria-hidden
                  className="font-serif text-sm text-gold tabular-nums"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <h3 className="font-serif text-2xl leading-tight sm:text-3xl">
                    <Link
                      href={exploreHref({ region: province.slug })}
                      className="rounded-sm after:absolute after:inset-0 after:content-['']"
                    >
                      {province.name}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm text-ivory/70">
                    <span className="sr-only">Known for: </span>
                    {province.knownFor.join(" · ")}
                  </p>
                </div>
                <ArrowRight
                  aria-hidden
                  className="mt-2 size-5 text-ivory/40 transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-teal"
                />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
