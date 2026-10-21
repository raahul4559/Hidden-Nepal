import type { Metadata } from "next";
import Image from "next/image";
import { connection } from "next/server";

import { PageHeader } from "@/components/layout/page-header";
import { PHOTOS } from "@/content/photos";
import { FOOD_CULTURE_EXPERIENCES } from "@/features/experiences/food-culture";
import { getPublishedImageCredits } from "@/features/destinations/queries";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/credits" },
  title: "Photo credits",
  description: "Attribution and licenses for photography used on Hidden Nepal.",
  openGraph: {
    title: "Photo credits | Hidden Nepal",
    description: "Attribution and licenses for photography used on Hidden Nepal.",
    url: "/credits",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

const LICENSE_URLS: Record<string, string> = {
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
};

export default async function CreditsPage() {
  await connection();
  const destinationCredits = await getPublishedImageCredits();
  const experienceImages = FOOD_CULTURE_EXPERIENCES.flatMap((experience) =>
    experience.image
      ? [
          {
            title: experience.name,
            credit: experience.image.creator,
            license: experience.image.license,
            sourceUrl: experience.image.source_url,
          },
        ]
      : [],
  );

  return (
    <>
      <PageHeader
        eyebrow="Credits"
        title="Photography"
        intro="Photo attribution and license details for images used throughout Hidden Nepal. Images may be resized and cropped for layout."
      />
      <div className="container-page py-14 sm:py-20">
        <CreditSection title="Site photography">
          {Object.values(PHOTOS).map((photo) => (
            <CreditRow
              key={photo.sourceUrl}
              title={photo.caption}
              credit={photo.author}
              license={photo.license}
              licenseUrl={photo.licenseUrl}
              sourceUrl={photo.sourceUrl}
              image={<Image src={photo.src} alt="" fill sizes="80px" className="object-cover" />}
            />
          ))}
        </CreditSection>

        <CreditSection title="Food and culture photography">
          {experienceImages.map((image) => (
            <CreditRow key={image.sourceUrl} {...image} />
          ))}
        </CreditSection>

        <CreditSection title="Destination photography">
          {destinationCredits.status === "ok" ? (
            destinationCredits.imageCredits.map((image, index) => (
              <CreditRow
                key={`${image.sourceUrl ?? image.destination}-${index}`}
                title={image.caption ? `${image.destination} — ${image.caption}` : image.destination}
                credit={image.credit}
                license={image.license}
                sourceUrl={image.sourceUrl}
              />
            ))
          ) : (
            <p role="status" className="py-4 text-sm text-muted-foreground">
              {destinationCredits.status === "unconfigured"
                ? "Destination photo credits are unavailable until the catalog is connected."
                : "Destination photo credits could not be loaded. Please try again later."}
            </p>
          )}
        </CreditSection>
      </div>
    </>
  );
}

function CreditSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="mb-12 last:mb-0">
      <h2 className="mb-4 font-serif text-2xl">{title}</h2>
      <ul className="divide-y divide-border border-y border-border">{children}</ul>
    </section>
  );
}

function CreditRow({
  title,
  credit,
  license,
  licenseUrl,
  sourceUrl,
  image,
}: {
  title: string;
  credit: string;
  license?: string | null;
  licenseUrl?: string;
  sourceUrl?: string | null;
  image?: React.ReactNode;
}) {
  const licenseHref = licenseUrl ?? (license ? LICENSE_URLS[license] : undefined);

  return (
    <li className="flex items-center gap-5 py-5">
      {image ? (
        <div className="relative size-20 shrink-0 overflow-hidden rounded-sm bg-navy-800">
          {image}
        </div>
      ) : null}
      <div className="min-w-0 text-sm leading-relaxed">
        <p className="font-serif text-lg text-foreground">{title}</p>
        <p className="text-muted-foreground">
          By {credit}
          {license ? (
            <>
              {" · "}
              {licenseHref ? (
                <a
                  href={licenseHref}
                  rel="license noopener noreferrer"
                  target="_blank"
                  className="text-himalaya underline-offset-2 hover:underline"
                >
                  {license}
                </a>
              ) : (
                license
              )}
            </>
          ) : null}
          {sourceUrl ? (
            <>
              {" · "}
              <a
                href={sourceUrl}
                rel="noopener noreferrer"
                target="_blank"
                className="text-himalaya underline-offset-2 hover:underline"
              >
                Source
              </a>
            </>
          ) : null}
        </p>
      </div>
    </li>
  );
}
