import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";

export default function DestinationNotFound() {
  return (
    <PageHeader
      eyebrow="Destination not found"
      title="We couldn’t find that place"
      intro="It may not be published yet, or the link may be wrong."
      className="pb-24 sm:pb-32"
    >
      <div className="mt-10 flex flex-wrap gap-3">
        <LinkButton href="/explore" variant="accent" size="lg">
          Explore destinations
        </LinkButton>
      </div>
    </PageHeader>
  );
}
