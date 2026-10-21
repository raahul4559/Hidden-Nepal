import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";

import { SectionHeading } from "@/components/editorial/section-heading";
import { PHOTOS } from "@/content/photos";
import { exploreHref } from "@/features/destinations/schemas";

import { THEMES } from "../themes";

/*
 * Mosaic on large screens (4 columns × 2 rows):
 *   [ lead lead ][ sm ][ sm ]
 *   [ lead lead ][ sm ][ sm ]
 * On small screens the lead spans both columns above a 2×2 grid.
 */
export function ThemeGrid() {
  return (
    <section id="experiences" aria-labelledby="experiences-title" className="py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading
          id="experiences-title"
          eyebrow="Experiences"
          title="Five ways into the country"
          intro="Start with what draws you: wild water, living culture, the trail, village life or the table."
        />

        <ul className="mt-12 grid auto-rows-[190px] grid-cols-2 gap-3 sm:auto-rows-[240px] sm:gap-4 lg:auto-rows-[260px] lg:grid-cols-4">
          {THEMES.map((theme, index) => {
            const photo = PHOTOS[theme.photo];
            const lead = index === 0;
            return (
              <li
                key={theme.slug}
                className={cn(
                  "group relative isolate overflow-hidden rounded-md bg-navy-800",
                  lead && "col-span-2 row-span-2",
                )}
              >
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  placeholder="blur"
                  sizes={lead ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                  className="-z-20 object-cover transition-transform duration-700 ease-out-soft motion-safe:group-hover:scale-[1.04]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 bg-linear-to-t from-navy/90 via-navy/35 to-navy/0 transition-colors duration-500 group-hover:from-navy/95"
                />

                <div className="on-dark flex h-full flex-col justify-end p-4 sm:p-6">
                  <h3
                    className={cn(
                      "font-serif leading-tight font-normal",
                      lead ? "text-3xl sm:text-5xl" : "text-xl sm:text-3xl",
                    )}
                  >
                    <Link
                      href={
                        theme.slug === "food"
                          ? "/food"
                          : theme.slug === "culture"
                            ? "/culture"
                            : exploreHref({ theme: theme.slug })
                      }
                      className="rounded-sm after:absolute after:inset-0 after:content-['']"
                    >
                      {theme.label}
                    </Link>
                  </h3>
                  <p
                    className={cn(
                      "mt-2 max-w-sm text-sm leading-relaxed text-ivory/80",
                      lead ? "sm:text-base" : "hidden sm:block",
                    )}
                  >
                    {theme.description}
                  </p>
                  <ChevronRight
                    aria-hidden
                    className="absolute top-4 left-4 size-5 text-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
                  />
                </div>

              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
