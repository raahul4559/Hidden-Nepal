import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { PROVINCES } from "@/features/regions/provinces";

import { FOOD_CULTURE_EXPERIENCES, FOOD_CULTURE_METADATA } from "./food-culture";

describe("food and culture explorer data", () => {
  it("has a substantial, uniquely sluggified food and culture inventory", () => {
    expect(FOOD_CULTURE_EXPERIENCES.filter((item) => item.kind === "food")).toHaveLength(30);
    expect(FOOD_CULTURE_EXPERIENCES.filter((item) => item.kind === "culture")).toHaveLength(43);
    expect(new Set(FOOD_CULTURE_EXPERIENCES.map((item) => item.slug)).size).toBe(
      FOOD_CULTURE_EXPERIENCES.length,
    );
  });

  it("covers every province with both food and cultural experiences", () => {
    for (const province of PROVINCES) {
      for (const kind of ["food", "culture"] as const) {
        expect(
          FOOD_CULTURE_EXPERIENCES.some(
            (item) =>
              item.kind === kind &&
              (item.region_slugs.includes("all") || item.region_slugs.includes(province.slug)),
          ),
          `${kind} in ${province.name}`,
        ).toBe(true);
      }
    }
  });

  it("retains at least one https source and a visitor discovery prompt for every entry", () => {
    for (const item of FOOD_CULTURE_EXPERIENCES) {
      expect(item.source_urls.length, item.slug).toBeGreaterThan(0);
      expect(item.source_urls.every((url) => url.startsWith("https://")), item.slug).toBe(true);
      expect(item.explore.length, item.slug).toBeGreaterThan(10);
    }
  });

  it("uses only locally bundled, credited photos with source and license metadata", () => {
    const illustrated = FOOD_CULTURE_EXPERIENCES.filter((item) => item.image);
    expect(illustrated.length).toBeGreaterThanOrEqual(30);
    expect(illustrated.some((item) => item.kind === "food")).toBe(true);
    expect(illustrated.some((item) => item.kind === "culture")).toBe(true);

    for (const item of illustrated) {
      expect(item.image?.alt.length, item.slug).toBeGreaterThan(10);
      expect(item.image?.creator, item.slug).toBeTruthy();
      expect(item.image?.license, item.slug).toBeTruthy();
      expect(item.image?.source_url, item.slug).toMatch(
        /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/,
      );
      expect(
        existsSync(join(process.cwd(), "public", item.image!.url.slice(1))),
        item.slug,
      ).toBe(true);
    }
  });

  it("provides photos for all food entries and labels representative images", () => {
    const food = FOOD_CULTURE_EXPERIENCES.filter((item) => item.kind === "food");
    expect(food.filter((item) => item.image)).toHaveLength(30);
    expect(food.filter((item) => !item.image)).toHaveLength(0);
    expect(
      food.filter((item) => ["eastern-nepal-yangben", "far-western-deuda-food"].includes(item.slug))
        .every((item) => item.image?.context_note),
    ).toBe(true);
    expect(FOOD_CULTURE_METADATA.coverage_notes).toContain(
      "30 of 30 food entries have locally bundled, attributed images. Dish-specific photos are used where found; representative images are visibly labeled and explain what they do and do not depict.",
    );
  });

  it("has a locally bundled, credited photo for every culture entry", () => {
    const culture = FOOD_CULTURE_EXPERIENCES.filter((item) => item.kind === "culture");
    expect(culture.filter((item) => item.image)).toHaveLength(43);
    expect(culture.filter((item) => !item.image).map((item) => item.slug)).toEqual([]);
    expect(new Set(culture.map((item) => item.image?.url)).size).toBe(43);
    expect(culture.find((item) => item.slug === "tharu-maghi")?.image?.context_note).toMatch(
      /customs differ/i,
    );
    expect(culture.find((item) => item.slug === "newar-kumari-tradition")?.image?.context_note).toMatch(
      /not the Kumari/i,
    );
    expect(culture.find((item) => item.slug === "buddhist-thangka-workshops")?.image?.context_note).toMatch(
      /not a photograph of a contemporary workshop/i,
    );
    for (const slug of [
      "newar-guthi",
      "palpa-dhaka-craft",
      "maithili-language-and-folk-song",
      "mithila-music-and-wedding-songs",
      "nepal-lokta-paper-craft",
    ]) {
      expect(culture.find((item) => item.slug === slug)?.image?.context_note, slug).toBeTruthy();
    }
    expect(culture.find((item) => item.slug === "mithila-samachakewa")?.image?.url).toBe(
      "/images/food-culture/sama-chakewa-figures.jpg",
    );
    expect(culture.find((item) => item.slug === "tamang-selo-and-damphu")?.image?.url).toBe(
      "/images/food-culture/tamang-selo-performance.jpg",
    );
    const mithilaPainting = culture.find((item) => item.slug === "mithila-painting")?.image;
    expect(mithilaPainting?.source_url).toBe(
      "https://commons.wikimedia.org/wiki/File:Madhubani_painting_by_Bhuvana_Meenakshi.jpg",
    );
    expect(mithilaPainting?.creator).toBe("Bhuvana Meenakshi");
    expect(mithilaPainting?.license).toBe("CC BY-SA 3.0");
  });

  it("uses the Kathmandu Valley place photo for Yomari with an explicit context note", () => {
    const yomari = FOOD_CULTURE_EXPERIENCES.find((item) => item.slug === "newar-yomari");
    expect(yomari?.image?.url).toBe("/images/destinations/kathmandu-valley.jpg");
    expect(yomari?.image?.context_note).toMatch(/not Yomari dumplings/i);
  });

  it("documents research coverage and cultural-respect limitations", () => {
    expect(FOOD_CULTURE_METADATA.research_date).toBe("2026-10-19");
    expect(FOOD_CULTURE_METADATA.coverage_notes.length).toBeGreaterThan(0);
    expect(FOOD_CULTURE_METADATA.limitations.length).toBeGreaterThan(0);
  });
});
