import { PageHeader } from "@/components/layout/page-header";
import { formatDate, toParagraphs } from "@/features/destinations/format";

export type GuideArticleData = {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  publishedAt: Date | null;
  updatedAt: Date;
  author: { name: string | null; email?: string } | null;
};

export function GuideArticle({ guide }: { guide: GuideArticleData }) {
  const paragraphs = toParagraphs(guide.body);
  const byline = guide.author?.name || "Hidden Nepal editors";
  const date = guide.publishedAt ?? guide.updatedAt;

  return (
    <article>
      <PageHeader eyebrow="Travel guide" title={guide.title} intro={guide.excerpt ?? undefined}>
        <p className="mt-6 text-sm text-ivory/75">
          By {byline} · {formatDate(date)}
        </p>
      </PageHeader>

      <div className="container-page py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-5 text-lg leading-relaxed text-ink-muted">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <footer className="mt-10 border-t border-border pt-5 text-sm text-ink-muted">
            Last updated {formatDate(guide.updatedAt)}. Always check local conditions and access
            rules before travelling.
          </footer>
        </div>
      </div>
    </article>
  );
}
