import type { Metadata } from "next";
import Image from "next/image";

import { PageHeader } from "@/components/layout/page-header";
import { PhotoCredit } from "@/components/media/photo-credit";
import { PHOTOS } from "@/content/photos";
import { FoodCultureExplorer } from "@/features/experiences/components/food-culture-explorer";
import { FOOD_CULTURE_EXPERIENCES, FOOD_CULTURE_METADATA } from "@/features/experiences/food-culture";

export const metadata: Metadata = {
  title: "Culture and living traditions",
  description:
    "Explore Nepal's living cultural traditions, festivals, music, crafts and community experiences across all seven provinces.",
  alternates: { canonical: "/culture" },
  openGraph: {
    title: "Culture and living traditions | Hidden Nepal",
    description:
      "Explore Nepal's living cultural traditions, festivals, music, crafts and community experiences across all seven provinces.",
    url: "/culture",
    images: [{ url: PHOTOS.culture.src.src, alt: PHOTOS.culture.alt }],
  },
};

export default function CulturePage() {
  const experiences = FOOD_CULTURE_EXPERIENCES.filter((item) => item.kind === "culture");
  const photo = PHOTOS.culture;

  return (
    <>
      <PageHeader
        eyebrow="Culture and living traditions"
        title="Meet Nepal through its living cultures"
        intro="Discover regional festivals, arts, music, craft and community-led experiences. Traditions belong to the people who sustain them."
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
      <FoodCultureExplorer kind="culture" experiences={experiences} />
      <p className="container-page pb-12 text-xs leading-relaxed text-muted-foreground">
        {FOOD_CULTURE_METADATA.editorial_method}
      </p>
    </>
  );
}
