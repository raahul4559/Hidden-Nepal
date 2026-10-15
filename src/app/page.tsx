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
  alternates: { canonical: "/" },
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
