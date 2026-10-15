export const siteConfig = {
  name: "Hidden Nepal",
  tagline: "Discover the Nepal beyond the ordinary.",
  description:
    "Hidden waterfalls, remote villages, Himalayan lakes, trekking routes, cultural heritage and regional food: a guide to travelling Nepal with care.",
} as const;

/** Every entry must resolve to a real route or an on-page section. */
export const mainNav = [
  { label: "Experiences", href: "/#experiences" },
  { label: "Provinces", href: "/#provinces" },
  { label: "Seasons", href: "/#seasons" },
  { label: "Explore", href: "/explore" },
] as const;

export const navCta = { label: "Suggest a place", href: "/contribute" } as const;

/** Signed-out visitors are redirected from here to sign in. */
export const accountNav = { label: "Account", href: "/account" } as const;
