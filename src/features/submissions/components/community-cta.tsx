import { ArrowRight } from "lucide-react";
import Image from "next/image";

import { PhotoCredit } from "@/components/media/photo-credit";
import { LinkButton } from "@/components/ui/link-button";
import { PHOTOS } from "@/content/photos";

const photo = PHOTOS.heritage;

export function CommunityCta() {
  return (
    <section aria-labelledby="community-title" className="surface-dark relative isolate overflow-hidden">
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-72 sm:min-h-96 lg:order-2 lg:min-h-full">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            placeholder="blur"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-[50%_35%]"
          />
          <PhotoCredit
            author={photo.author}
            license={photo.license}
            sourceUrl={photo.sourceUrl}
            className="absolute right-3 bottom-3"
          />
        </div>

        <div className="container-page py-20 sm:py-24 lg:mr-0 lg:max-w-[40rem] lg:py-32 lg:pr-16">
          <p className="eyebrow text-gold">Community</p>
          <h2
            id="community-title"
            className="mt-4 font-serif text-4xl leading-[1.05] font-normal text-balance sm:text-5xl"
          >
            Know a place the guidebooks missed?
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ivory/80">
            The best of Nepal is often known only locally: a waterfall above
            your village, a family kitchen, a quiet trail. Tell us about it. Our
            editors research every suggestion before anything is published.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <LinkButton href="/contribute" variant="accent" size="xl">
              Suggest a place
              <ArrowRight aria-hidden data-icon="inline-end" />
            </LinkButton>
            <p className="text-sm text-ivory/65">Takes about five minutes. No account needed.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
