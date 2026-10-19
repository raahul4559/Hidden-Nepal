import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
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
    const illustrated = food.filter((item) => item.image);
    expect(illustrated).toHaveLength(28);
    expect(food.filter((item) => !item.image).map((item) => item.slug).sort()).toEqual([
      "eastern-nepal-wachipa",
      "eastern-nepal-yangben",
    ]);
    expect(new Set(illustrated.map((item) => item.image?.url)).size).toBe(illustrated.length);
    const imageHashes = illustrated.map((item) =>
      createHash("sha256")
        .update(readFileSync(join(process.cwd(), "public", item.image!.url.slice(1))))
        .digest("hex"),
    );
    expect(new Set(imageHashes).size).toBe(illustrated.length);
    const samayBaji = food.find((item) => item.slug === "newar-samay-baji")?.image;
    expect(samayBaji?.url).toBe("/images/food-culture/samay-baji.jpg");
    expect(samayBaji?.source_url).toBe("https://commons.wikimedia.org/wiki/File:Samaybaji.JPG");
    expect(samayBaji?.creator).toBe("Ashish J.");
    expect(food.find((item) => item.slug === "far-western-deuda-food")?.image?.context_note).toBeTruthy();
    expect(FOOD_CULTURE_METADATA.coverage_notes).toContain(
      "28 of 30 food entries have locally bundled, attributed images. Cards without a directly matching, reusable photo omit the image until one is verified.",
    );
    expect(FOOD_CULTURE_METADATA.limitations).toContain(
      "Directly matching, reusable photos were not verified for Wachipa or Yangben; those food cards intentionally omit photos pending verification.",
    );
  });

  it("does not reuse an image across food and culture cards", () => {
    const illustrated = FOOD_CULTURE_EXPERIENCES.filter((item) => item.image);
    const paths = illustrated.map((item) => item.image?.url);
    const hashes = illustrated.map((item) =>
      createHash("sha256")
        .update(readFileSync(join(process.cwd(), "public", item.image!.url.slice(1))))
        .digest("hex"),
    );

    expect(new Set(paths).size).toBe(illustrated.length);
    expect(new Set(hashes).size).toBe(illustrated.length);
  });

  it("uses distinct, locally bundled, credited photos for verified culture matches", () => {
    const culture = FOOD_CULTURE_EXPERIENCES.filter((item) => item.kind === "culture");
    const illustrated = culture.filter((item) => item.image);
    expect(illustrated).toHaveLength(42);
    expect(culture.filter((item) => !item.image).map((item) => item.slug)).toEqual([
      "mithila-music-and-wedding-songs",
    ]);
    expect(new Set(illustrated.map((item) => item.image?.url)).size).toBe(42);
    const imageHashes = illustrated.map((item) =>
      createHash("sha256")
        .update(readFileSync(join(process.cwd(), "public", item.image!.url.slice(1))))
        .digest("hex"),
    );
    expect(new Set(imageHashes).size).toBe(42);
    expect(culture.find((item) => item.slug === "tharu-maghi")?.image?.context_note).toMatch(
      /customs differ/i,
    );
    expect(culture.find((item) => item.slug === "newar-kumari-tradition")?.image?.context_note).toMatch(
      /not the living Kumari/i,
    );
    expect(culture.find((item) => item.slug === "buddhist-thangka-workshops")?.image?.context_note).toMatch(
      /not a photograph of a contemporary workshop/i,
    );
    for (const slug of [
      "newar-guthi",
      "palpa-dhaka-craft",
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

    expect(culture.find((item) => item.slug === "tihar-lights-and-bhai-tika")?.image).toMatchObject({
      url: "/images/food-culture/tihar-bhai-tika.jpg",
      creator: "Sandesh Lamsal Nepal",
      license: "CC BY-SA 4.0",
    });
    expect(culture.find((item) => item.slug === "chhath-puja")?.image?.source_url).toBe(
      "https://commons.wikimedia.org/wiki/File:Chhath_Puja_Sandhya_Ghats_Malangwa_Bhelhi_Sarlahi_2.jpg",
    );
    expect(culture.find((item) => item.slug === "newar-gaijatra")?.image?.source_url).toBe(
      "https://commons.wikimedia.org/wiki/File:Floats_Gai_Jatra.jpg",
    );
    expect(culture.find((item) => item.slug === "maithili-language-and-folk-song")?.image).toMatchObject({
      url: "/images/food-culture/maithili-thakur-performance.jpg",
      creator: "Devendra Fadnavis",
      license: "CC BY 3.0",
    });
    expect(culture.find((item) => item.slug === "newar-kumari-tradition")?.image).toMatchObject({
      url: "/images/food-culture/kumari-ghar-courtyard.jpg",
      creator: "Faj2323",
      license: "CC BY-SA 4.0",
    });
  });

  it("uses a directly matching photo for Newar feast and khaja traditions", () => {
    const khaja = FOOD_CULTURE_EXPERIENCES.find((item) => item.slug === "newar-khwa-swan")?.image;
    expect(khaja).toMatchObject({
      url: "/images/food-culture/newari-khaja-set.jpg",
      creator: "Gaurav Dhwaj Khadka",
      license: "CC BY-SA 4.0",
      source_url: "https://commons.wikimedia.org/wiki/File:Newari_Khaja_Set.jpg",
    });
  });

  it("uses a dedicated, credited Yomari dumpling photo", () => {
    const yomari = FOOD_CULTURE_EXPERIENCES.find((item) => item.slug === "newar-yomari");
    expect(yomari?.image?.url).toBe("/images/food-culture/yomari-food.jpg");
    expect(yomari?.image?.source_url).toBe("https://commons.wikimedia.org/wiki/File:Yomari_2.jpg");
    expect(yomari?.image?.creator).toBe("Gaurav Dhwaj Khadka");
  });

  it("documents research coverage and cultural-respect limitations", () => {
    expect(FOOD_CULTURE_METADATA.research_date).toBe("2026-10-19");
    expect(FOOD_CULTURE_METADATA.coverage_notes.length).toBeGreaterThan(0);
    expect(FOOD_CULTURE_METADATA.limitations.length).toBeGreaterThan(0);
  });
});
