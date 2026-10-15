import Image from "next/image";

import { PhotoCredit } from "@/components/media/photo-credit";
import { PHOTOS } from "@/content/photos";
import { DestinationSearchForm } from "@/features/destinations/components/destination-search-form";
import { siteConfig } from "@/lib/site";

const photo = PHOTOS.hero;

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="surface-dark relative isolate flex min-h-[640px] items-end overflow-hidden lg:min-h-[min(100svh,960px)]"
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        placeholder="blur"
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        className="-z-20 object-cover object-[50%_60%]"
      />
      {/* Navy wash for legibility: strongest behind the copy (bottom-left). */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,var(--navy)_0%,rgb(11_31_51/0.82)_32%,rgb(11_31_51/0.25)_62%,rgb(11_31_51/0.55)_100%)] lg:bg-[linear-gradient(100deg,rgb(11_31_51/0.92)_0%,rgb(11_31_51/0.6)_45%,rgb(11_31_51/0.1)_75%),linear-gradient(to_bottom,rgb(11_31_51/0.5),transparent_25%)]"
      />

      <div className="container-page pt-32 pb-14 sm:pb-20 lg:pb-24">
        <div className="max-w-3xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
          <p className="eyebrow text-gold">Nepal, off the beaten trail</p>
          <h1
            id="hero-title"
            className="mt-5 font-serif text-[2.75rem] leading-[1.02] font-normal tracking-tight text-balance sm:text-6xl lg:text-7xl"
          >
            {siteConfig.tagline}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-ivory/85">
            Hidden waterfalls, remote villages, Himalayan lakes and the people
            who keep their traditions alive: a slower, more considered way to
            see the country.
          </p>
        </div>

        <DestinationSearchForm className="mt-10 max-w-4xl motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:delay-150 motion-safe:fill-mode-backwards" />
      </div>

      <PhotoCredit
        author={`${photo.caption} · ${photo.author}`}
        license={photo.license}
        sourceUrl={photo.sourceUrl}
        className="absolute right-3 bottom-3 max-w-[calc(100%-1.5rem)] sm:right-4 sm:bottom-4"
      />
    </section>
  );
}
