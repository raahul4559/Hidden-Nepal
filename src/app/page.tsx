import { FeaturedDestinations } from "@/features/destinations/components/featured-destinations";
import { CategoryGrid } from "@/features/experiences/components/category-grid";
import { Hero } from "@/features/home/components/hero";
import { ResponsibleTravel } from "@/features/home/components/responsible-travel";
import { RegionGrid } from "@/features/regions/components/region-grid";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <FeaturedDestinations />
      <RegionGrid />
      <ResponsibleTravel />
    </>
  );
}
