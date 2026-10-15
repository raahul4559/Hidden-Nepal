import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { exploreHref } from "@/features/destinations/schemas";
import { CATEGORIES } from "@/features/experiences/categories";
import { PROVINCES } from "@/features/regions/provinces";
import { siteConfig } from "@/lib/site";

const linkClass =
  "rounded-sm text-ivory/75 transition-colors hover:text-ivory hover:underline hover:decoration-gold underline-offset-4";

export function SiteFooter() {
  return (
    <footer className="surface-dark">
      <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <Logo />
          <p className="mt-5 max-w-xs font-serif text-lg leading-snug text-ivory/85 italic">
            {siteConfig.tagline}
          </p>
        </div>

        <FooterColumn title="Experiences" className="md:col-span-3">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link href={exploreHref({ category: c.slug })} className={linkClass}>
                {c.label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Provinces" className="md:col-span-3">
          {PROVINCES.map((p) => (
            <li key={p.slug}>
              <Link href={exploreHref({ region: p.slug })} className={linkClass}>
                {p.name}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Hidden Nepal" className="md:col-span-2">
          <li>
            <Link href="/explore" className={linkClass}>
              Explore
            </Link>
          </li>
          <li>
            <Link href="/#responsible-travel" className={linkClass}>
              Travel responsibly
            </Link>
          </li>
          <li>
            <Link href="/credits" className={linkClass}>
              Photo credits
            </Link>
          </li>
        </FooterColumn>
      </div>

      <div className="border-t border-border">
        <p className="container-page py-6 text-xs text-ivory/65">
          © {siteConfig.name}. Photography is credited to its authors under
          Creative Commons licenses.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <h2 className="eyebrow text-gold">{title}</h2>
      <ul className="mt-5 space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}
