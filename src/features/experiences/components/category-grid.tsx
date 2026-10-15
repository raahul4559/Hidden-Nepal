import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";

import { SectionHeading } from "@/components/editorial/section-heading";
import { PhotoCredit } from "@/components/media/photo-credit";
import { PHOTOS } from "@/content/photos";
import { exploreHref } from "@/features/destinations/schemas";

import { CATEGORIES } from "../categories";

/*
 * Editorial mosaic on large screens (4 columns, 3 rows):
 *   [ big  big ][ sm ][ sm ]
 *   [ big  big ][  wide   ]
 *   [  wide    ][ sm ][ sm ]
 */
const layout: Record<number, string> = {
  0: "col-span-2 lg:row-span-2",
  3: "col-span-2",
  4: "col-span-2",
};

export function CategoryGrid() {
  return (
    <section
      id="experiences"
      aria-labelledby="experiences-title"
      className="py-20 sm:py-28"
    >
      <div className="container-page">
        <SectionHeading
          id="experiences-title"
          eyebrow="Experiences"
          title="Seven ways into the country"
          intro="Start with what draws you: water, mountains, history or the table. Each path leads somewhere most itineraries pass by."
        />

        <ul
          className="mt-12 grid auto-rows-[200px] grid-cols-2 gap-3 sm:auto-rows-[240px] sm:gap-4 lg:grid-cols-4 lg:auto-rows-[250px]"
        >
          {CATEGORIES.map((category, index) => {
            const photo = PHOTOS[category.photo];
            const large = index === 0;
            return (
              <li
                key={category.slug}
                className={cn(
                  "group relative isolate overflow-hidden rounded-md bg-navy-800",
                  layout[index],
                )}
              >
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  placeholder="blur"
                  sizes={
                    large || layout[index]
                      ? "(min-width: 1024px) 50vw, 100vw"
                      : "(min-width: 1024px) 25vw, 50vw"
                  }
                  className="-z-20 object-cover transition-transform duration-700 ease-out-soft motion-safe:group-hover:scale-[1.04]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 bg-linear-to-t from-navy/90 via-navy/35 to-navy/0 transition-colors duration-500 group-hover:from-navy/95"
                />

                <div className="on-dark flex h-full flex-col justify-end p-4 sm:p-5">
                  <h3
                    className={cn(
                      "font-serif leading-tight font-normal text-balance",
                      large ? "text-2xl sm:text-4xl" : "text-lg sm:text-2xl",
                    )}
                  >
                    <Link
                      href={exploreHref({ category: category.slug })}
                      className="rounded-sm after:absolute after:inset-0 after:content-['']"
                    >
                      {category.label}
                    </Link>
                  </h3>
                  <p
                    className={cn(
                      "mt-2 max-w-sm text-sm leading-relaxed text-ivory/80",
                      !large && !layout[index] && "hidden sm:block",
                    )}
                  >
                    {category.description}
                  </p>
                  <ArrowUpRight
                    aria-hidden
                    className="absolute top-4 left-4 size-5 text-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
                  />
                </div>

                {/* Sits above the stretched link so it remains clickable. */}
                <PhotoCredit
                  author={photo.author}
                  license={photo.license}
                  sourceUrl={photo.sourceUrl}
                  className="absolute top-2 right-2 z-10 max-w-[calc(100%-3rem)] opacity-90"
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
