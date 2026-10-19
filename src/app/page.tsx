import type { Metadata } from "next";

import { FeaturedDestinations } from "@/features/destinations/components/featured-destinations";
import { HiddenGems } from "@/features/destinations/components/hidden-gems";
import { ThemeGrid } from "@/features/experiences/components/theme-grid";
import { Hero } from "@/features/home/components/hero";
import { ResponsibleTravel } from "@/features/home/components/responsible-travel";
import { RegionGrid } from "@/features/regions/components/region-grid";
import { SeasonalDiscovery } from "@/features/seasons/components/seasonal-discovery";
import { CommunityCta } from "@/features/submissions/components/community-cta";

export const metadata: Metadata = {
  title: "Hidden Places to Visit in Nepal",
  description:
    "Find hidden and offbeat places to visit in Nepal, with destination guides to Himalayan trails, remote villages, cultural traditions and regional food.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Hidden Places to Visit in Nepal | Hidden Nepal",
    description:
      "Find hidden and offbeat places to visit in Nepal, with destination guides to Himalayan trails, remote villages, cultural traditions and regional food.",
    url: "/",
    images: ["/images/destinations/kathmandu-valley.jpg"],
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ThemeGrid />
      <FeaturedDestinations />
      <HiddenGems />
      <RegionGrid />
      <SeasonalDiscovery />
      <ResponsibleTravel />
      <CommunityCta />
    </>
  );
}
