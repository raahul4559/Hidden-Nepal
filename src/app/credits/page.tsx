import type { Metadata } from "next";
import Image from "next/image";

import { PageHeader } from "@/components/layout/page-header";
import { PHOTOS } from "@/content/photos";

export const metadata: Metadata = {
  title: "Photo credits",
  description: "Attribution and licenses for photography used on Hidden Nepal.",
};

export default function CreditsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Credits"
        title="Photography"
        intro="The photographs on this site come from Wikimedia Commons and are used under Creative Commons licenses. Images may be resized and cropped for layout."
      />
      <div className="container-page py-14 sm:py-20">
        <ul className="divide-y divide-border border-y border-border">
          {Object.values(PHOTOS).map((photo) => (
            <li key={photo.sourceUrl} className="flex items-center gap-5 py-5">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-sm bg-navy-800">
                <Image src={photo.src} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div className="min-w-0 text-sm leading-relaxed">
                <p className="font-serif text-lg text-foreground">{photo.caption}</p>
                <p className="text-muted-foreground">
                  By {photo.author} ·{" "}
                  <a href={photo.licenseUrl} rel="license noopener noreferrer" target="_blank" className="text-himalaya underline-offset-2 hover:underline">
                    {photo.license}
                  </a>{" "}
                  ·{" "}
                  <a href={photo.sourceUrl} rel="noopener noreferrer" target="_blank" className="text-himalaya underline-offset-2 hover:underline">
                    Source
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
