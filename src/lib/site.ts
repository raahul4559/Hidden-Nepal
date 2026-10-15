export const siteConfig = {
  name: "Hidden Nepal",
  tagline: "Discover the Nepal beyond the ordinary.",
  description:
    "Hidden waterfalls, remote villages, Himalayan lakes, trekking routes, cultural heritage and regional food: a guide to travelling Nepal with care.",
} as const;

/** Every entry must resolve to a real route or an on-page section. */
export const mainNav = [
  { label: "Experiences", href: "/#experiences" },
  { label: "Regions", href: "/#regions" },
  { label: "Travel responsibly", href: "/#responsible-travel" },
  { label: "Explore", href: "/explore" },
] as const;
