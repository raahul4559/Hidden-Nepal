import { PageHeader } from "@/components/layout/page-header";
import { DestinationResultsSkeleton } from "@/features/destinations/components/destination-results";

export default function ExploreLoading() {
  return (
    <>
      <PageHeader eyebrow="Explore" title="Find your way beyond the ordinary" />
      <div className="container-page py-14 sm:py-20">
        <DestinationResultsSkeleton count={6} />
      </div>
    </>
  );
}
