/** Reference list of activities. Seeded into the Activity table. */
export const ACTIVITIES = [
  { slug: "hiking", name: "Hiking" },
  { slug: "trekking", name: "Multi-day trekking" },
  { slug: "boating", name: "Boating" },
  { slug: "birdwatching", name: "Birdwatching" },
  { slug: "wildlife-watching", name: "Wildlife watching" },
  { slug: "cycling", name: "Cycling" },
  { slug: "rafting", name: "Rafting" },
  { slug: "camping", name: "Camping" },
  { slug: "heritage-walks", name: "Heritage walks" },
  { slug: "monastery-visits", name: "Monastery visits" },
  { slug: "homestays", name: "Homestays" },
  { slug: "local-food", name: "Local food" },
  { slug: "craft-workshops", name: "Craft workshops" },
  { slug: "photography", name: "Photography" },
] as const;

export type ActivitySlug = (typeof ACTIVITIES)[number]["slug"];
export const ACTIVITY_SLUGS = ACTIVITIES.map((a) => a.slug) as [ActivitySlug, ...ActivitySlug[]];
