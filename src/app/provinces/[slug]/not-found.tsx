import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";

export default function ProvinceNotFound() {
  return (
    <PageHeader
      eyebrow="Province not found"
      title="Nepal has seven provinces, and that isn’t one of them"
      intro="Check the link, or choose a province from the list."
      className="pb-24 sm:pb-32"
    >
      <div className="mt-10">
        <LinkButton href="/provinces" variant="accent" size="lg">
          See all provinces
        </LinkButton>
      </div>
    </PageHeader>
  );
}
