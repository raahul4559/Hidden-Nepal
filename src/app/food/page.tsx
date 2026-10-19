import type { Metadata } from "next";
import Image from "next/image";

import { PageHeader } from "@/components/layout/page-header";
import { PhotoCredit } from "@/components/media/photo-credit";
import { PHOTOS } from "@/content/photos";
import { FoodCultureExplorer } from "@/features/experiences/components/food-culture-explorer";
import { FOOD_CULTURE_EXPERIENCES, FOOD_CULTURE_METADATA } from "@/features/experiences/food-culture";

export const metadata: Metadata = {
  title: "Food and drink",
  description:
    "Explore Nepal through regional foodways, from Newar dishes and Mithila cooking to Himalayan grains and Tharu foods.",
  alternates: { canonical: "/food" },
  openGraph: {
    title: "Food and drink | Hidden Nepal",
    description:
      "Explore Nepal through regional foodways, from Newar dishes and Mithila cooking to Himalayan grains and Tharu foods.",
    url: "/food",
    images: [{ url: PHOTOS.food.src.src, alt: PHOTOS.food.alt }],
  },
};

export default function FoodPage() {
  const experiences = FOOD_CULTURE_EXPERIENCES.filter((item) => item.kind === "food");
  const photo = PHOTOS.food;

  return (
    <>
      <PageHeader
        eyebrow="Food and drink"
        title="A country told through its kitchens"
        intro="Explore everyday staples, regional dishes, seasonal ingredients and community food traditions across Nepal."
      />
      <section className="container-page pt-10">
        <figure className="relative overflow-hidden rounded-md bg-navy-800">
          <div className="relative aspect-[16/7] min-h-52">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              priority
              sizes="(min-width: 1280px) 1200px, 100vw"
              placeholder="blur"
              className="object-cover"
            />
            <figcaption className="absolute right-3 bottom-3">
              <PhotoCredit
                author={`${photo.caption} · ${photo.author}`}
                license={photo.license}
                sourceUrl={photo.sourceUrl}
              />
            </figcaption>
          </div>
        </figure>
      </section>
      <FoodCultureExplorer kind="food" experiences={experiences} />
      <p className="container-page pb-12 text-xs leading-relaxed text-muted-foreground">
        {FOOD_CULTURE_METADATA.editorial_method}
      </p>
    </>
  );
}
