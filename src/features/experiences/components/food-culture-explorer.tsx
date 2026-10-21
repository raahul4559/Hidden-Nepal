"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { PROVINCES } from "@/features/regions/provinces";

import {
  type FoodCultureExperience,
  type FoodCultureKind,
} from "../food-culture";

export function FoodCultureExplorer({
  kind,
  experiences,
}: {
  kind: FoodCultureKind;
  experiences: FoodCultureExperience[];
}) {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("all");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return experiences.filter((item) => {
      const matchesProvince =
        province === "all" ||
        item.region_slugs.some((slug) => slug === "all" || slug === province);
      const searchable = [
        item.name,
        ...item.also_known_as,
        item.place,
        item.description,
      ]
        .join(" ")
        .toLocaleLowerCase();
      return matchesProvince && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [experiences, province, query]);

  return (
    <section aria-labelledby="directory-title" className="py-12 sm:py-16">
      <div className="container-page">
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <h2 id="directory-title" className="font-serif text-3xl sm:text-4xl">
              Browse {kind === "food" ? "food and drink" : "traditions and experiences"}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {filtered.length} {kind === "food" ? "foodways" : "cultural experiences"}
              {province !== "all" ? ` in ${PROVINCES.find((region) => region.slug === province)?.name}` : ""}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.filter((item) => item.image).length} of {filtered.length} entries have
              verified, credited photos. Entries without a suitable subject-matched image remain
              text-only.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(14rem,1fr)_13rem]">
            <label className="relative block">
              <span className="sr-only">Search this directory</span>
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${kind === "food" ? "dishes" : "traditions"}...`}
                className="h-11 w-full rounded-md border border-input bg-white pr-3 pl-9 text-sm"
              />
            </label>
            <label className="block">
              <span className="sr-only">Filter by province</span>
              <select
                value={province}
                onChange={(event) => setProvince(event.target.value)}
                className="h-11 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="all">All provinces</option>
                {PROVINCES.map((region) => (
                  <option key={region.slug} value={region.slug}>
                    {region.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {filtered.length ? (
          <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <li key={item.slug}>
                <ExperienceCard experience={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 rounded-md border border-border bg-white p-8 text-muted-foreground">
            No matches. Try another search or province.
          </p>
        )}

        <aside className="mt-12 rounded-md border border-border bg-white p-6 sm:p-8">
          <h2 className="font-serif text-2xl">Travel with respect</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-muted-foreground md:grid-cols-2">
            <li>Practices differ among communities and even between nearby households; ask local hosts what applies here.</li>
            <li>Festival dates follow local calendars and change from year to year. Confirm current dates and access before travelling.</li>
            <li>Ask permission before photographing people, private homes, religious ceremonies or sacred objects.</li>
            <li>For food, check ingredients, allergens and preparation with the person serving it.</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}

function ExperienceCard({ experience }: { experience: FoodCultureExperience }) {
  const regions = experience.region_slugs.includes("all")
    ? "Across Nepal"
    : experience.region_slugs
        .map((slug) => PROVINCES.find((province) => province.slug === slug)?.name)
        .filter(Boolean)
        .join(" · ");

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-white">
      {experience.image ? (
        <figure className="overflow-hidden bg-muted">
          <div className="relative aspect-[16/10]">
            <Image
              src={experience.image.url}
              alt={experience.image.alt}
              fill
              sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          {experience.image.context_note ? (
            <figcaption className="border-t border-border px-4 py-2">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {experience.image.context_note}
              </p>
            </figcaption>
          ) : null}
        </figure>
      ) : null}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="eyebrow text-himalaya">{regions}</p>
        <h3 className="mt-3 font-serif text-2xl leading-tight">{experience.name}</h3>
        {experience.also_known_as.length ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Also known as {experience.also_known_as.join(", ")}
          </p>
        ) : null}
        <p className="mt-3 text-sm font-medium">{experience.place}</p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {experience.description}
        </p>
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-sm leading-relaxed">{experience.explore}</p>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-semibold text-himalaya">
              Research sources ({experience.source_urls.length})
            </summary>
            <ul className="mt-2 space-y-2 pl-4">
              {experience.source_urls.map((url) => (
                <li key={url} className="list-disc">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-words underline underline-offset-2 hover:text-navy"
                  >
                    {decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() ?? url)
                      .replaceAll("_", " ")}
                    <span className="sr-only"> ({new URL(url).hostname}; opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </article>
  );
}
