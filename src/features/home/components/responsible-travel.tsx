import { Camera, Footprints, HandHeart, Landmark, Leaf } from "lucide-react";
import Image from "next/image";

import { SectionHeading } from "@/components/editorial/section-heading";
import { PhotoCredit } from "@/components/media/photo-credit";
import { PHOTOS } from "@/content/photos";

const photo = PHOTOS.terraces;

const PRINCIPLES = [
  {
    icon: HandHeart,
    title: "Spend locally",
    body: "Hire local guides and porters, stay in family-run lodges and homestays, and eat where your money stays in the valley.",
  },
  {
    icon: Leaf,
    title: "Leave no trace",
    body: "Carry out what you carry in, refill water instead of buying plastic bottles, and keep to established trails.",
  },
  {
    icon: Landmark,
    title: "Respect sacred places",
    body: "Walk clockwise around stupas and chortens, ask before entering temples, and dress modestly in villages.",
  },
  {
    icon: Camera,
    title: "Ask before you photograph",
    body: "People are not scenery. A question and a smile come first, and a ‘no’ is an answer.",
  },
  {
    icon: Footprints,
    title: "Travel at the mountain’s pace",
    body: "Plan time to acclimatise at altitude, and check local conditions and permit rules before you set out.",
  },
] as const;

export function ResponsibleTravel() {
  return (
    <section
      id="responsible-travel"
      aria-labelledby="responsible-title"
      className="py-20 sm:py-28"
    >
      <div className="container-page grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
        <figure className="relative lg:sticky lg:top-8">
          <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-navy-800 sm:aspect-[3/2] lg:aspect-[4/5]">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-3 text-sm text-muted-foreground">
            {photo.caption}
          </figcaption>
          <PhotoCredit
            author={photo.author}
            license={photo.license}
            sourceUrl={photo.sourceUrl}
            className="mt-1"
          />
        </figure>

        <div>
          <SectionHeading
            id="responsible-title"
            eyebrow="Responsible tourism"
            title="Travel lightly, leave something good behind"
            intro="Quiet places stay special when visitors treat them with care. These are the principles we ask every traveller to carry with them."
          />
          <div className="mt-10 rule-gold" />
          <ul className="divide-y divide-border">
            {PRINCIPLES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-5 py-6">
                <Icon aria-hidden className="mt-1 size-5 shrink-0 text-himalaya" strokeWidth={1.75} />
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
