import { z } from "zod";

import data from "../../../data/nepal-food-culture.json";
import { PROVINCE_SLUGS } from "@/features/regions/provinces";

const experienceSchema = z.object({
  slug: z.string().min(2),
  name: z.string().min(2),
  also_known_as: z.array(z.string()),
  kind: z.enum(["food", "culture"]),
  region_slugs: z.array(z.string()),
  place: z.string().min(2),
  description: z.string().min(20),
  explore: z.string().min(10),
  source_urls: z.array(z.url({ protocol: /^https$/ })).min(1),
  image: z.object({
    url: z.string().regex(/^\/images\/(?:food-culture|destinations)\/[a-z0-9-]+\.(?:jpe?g|png)$/),
    alt: z.string().min(10),
    creator: z.string().min(1),
    license: z.string().min(1),
    source_url: z.url({ protocol: /^https$/ }),
    context_note: z.string().min(20).optional(),
  }).optional(),
});

const regionSlugSchema = z.union([z.literal("all"), z.enum(PROVINCE_SLUGS)]);
const directorySchema = z.object({
  metadata: z.object({
    dataset_name: z.string(),
    research_date: z.iso.date(),
    editorial_method: z.string(),
    coverage_notes: z.array(z.string()),
    sources_used: z.array(z.object({
      publisher: z.string(),
      url: z.url(),
      use: z.string(),
    })),
    limitations: z.array(z.string()),
  }),
  experiences: z.array(experienceSchema.extend({
    region_slugs: z.array(regionSlugSchema).min(1),
  })),
});

const directory = directorySchema.parse(data);

export type FoodCultureKind = "food" | "culture";
export type FoodCultureExperience = z.infer<typeof directorySchema>["experiences"][number];

export const FOOD_CULTURE_METADATA = directory.metadata;
export const FOOD_CULTURE_EXPERIENCES = directory.experiences;
