import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";

export default function NotFound() {
  return (
    <PageHeader
      eyebrow="404"
      title="This trail doesn’t go anywhere"
      intro="The page you were looking for doesn’t exist or has moved."
      className="pb-24 sm:pb-32"
    >
      <div className="mt-10 flex flex-wrap gap-3">
        <LinkButton href="/" variant="accent" size="lg">
          Back to home
        </LinkButton>
        <LinkButton href="/explore" variant="outline" size="lg" className="border-ivory/40 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory">
          Explore destinations
        </LinkButton>
      </div>
    </PageHeader>
  );
}
