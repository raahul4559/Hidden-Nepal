import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { mainNav } from "@/lib/site";

import { MobileNav } from "./mobile-nav";

/**
 * Transparent header that sits over each page's dark opening band
 * (the home hero or a <PageHeader>).
 */
export function SiteHeader() {
  return (
    <header className="on-dark absolute inset-x-0 top-0 z-40">
      <div className="container-page flex h-20 items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm font-medium">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-sm py-1 text-ivory/85 underline-offset-8 transition-colors hover:text-ivory hover:underline hover:decoration-gold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <MobileNav items={mainNav} />
      </div>
    </header>
  );
}
