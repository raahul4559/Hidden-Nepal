import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { exploreHref } from "@/features/destinations/schemas";
import { THEMES } from "@/features/experiences/themes";
import { PROVINCES } from "@/features/regions/provinces";
import { SEASONS } from "@/features/seasons/seasons";
import { siteConfig } from "@/lib/site";

const linkClass =
  "rounded-sm text-ivory/75 transition-colors hover:text-ivory hover:underline hover:decoration-gold underline-offset-4";

const SITE_LINKS = [
  { label: "All destinations", href: "/explore" },
  { label: "Off the map", href: "/#off-the-map" },
  { label: "Travel responsibly", href: "/#responsible-travel" },
  { label: "Suggest a place", href: "/contribute" },
  { label: "Photo credits", href: "/credits" },
] as const;

export function SiteFooter() {
  return (
    <footer className="surface-dark">
      <div className="container-page grid grid-cols-2 gap-x-8 gap-y-12 py-16 sm:grid-cols-4 md:py-20 lg:grid-cols-12">
        <div className="col-span-2 sm:col-span-4 lg:col-span-4">
          <Logo />
          <p className="mt-5 max-w-xs font-serif text-lg leading-snug text-ivory/85 italic">
            {siteConfig.tagline}
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivory/65">
            A guide to Nepal’s lesser-known places, written to be travelled
            slowly and responsibly.
          </p>
        </div>

        <FooterColumn title="Experiences" className="lg:col-span-2">
          {THEMES.map((t) => (
            <li key={t.slug}>
              <Link href={exploreHref({ theme: t.slug })} className={linkClass}>
                {t.label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Provinces" className="lg:col-span-2">
          {PROVINCES.map((p) => (
            <li key={p.slug}>
              <Link href={exploreHref({ region: p.slug })} className={linkClass}>
                {p.name}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Seasons" className="lg:col-span-2">
          {SEASONS.map((s) => (
            <li key={s.slug}>
              <Link href={exploreHref({ season: s.slug })} className={linkClass}>
                {s.label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Hidden Nepal" className="lg:col-span-2">
          {SITE_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={linkClass}>
                {l.label}
              </Link>
            </li>
          ))}
        </FooterColumn>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-ivory/65 sm:flex-row sm:justify-between">
          <p>© {siteConfig.name}</p>
          <p>
            Photography credited to its authors under Creative Commons licenses.{" "}
            <Link href="/credits" className="underline underline-offset-2 hover:text-ivory">
              See credits
            </Link>
          </p>
        </div>
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
