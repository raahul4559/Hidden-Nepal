import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { ProvinceDirectory } from "@/features/regions/components/region-grid";

export const metadata: Metadata = {
  title: "Provinces of Nepal",
  description:
    "Browse lesser-known destinations across Nepal's seven provinces, from the Terai plains to the high Himalaya.",
  alternates: { canonical: "/provinces" },
  openGraph: {
    title: "Provinces of Nepal | Hidden Nepal",
    description:
      "Browse lesser-known destinations across Nepal's seven provinces, from the Terai plains to the high Himalaya.",
    url: "/provinces",
    images: ["/images/destinations/kathmandu-valley.jpg"],
  },
};

export default function ProvincesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Explore by province"
        title="Seven provinces, from the Terai to the high Himalaya"
        intro="Nepal’s provinces run north to south across lowland plains, middle hills and mountains. Choose one to see its published destinations."
      />
      <section aria-label="Provinces" className="surface-dark pb-20 sm:pb-24">
        <div className="container-page">
          <ProvinceDirectory />
        </div>
      </section>
    </>
  );
}
