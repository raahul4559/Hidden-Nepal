"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/destinations", label: "Destinations" },
  { href: "/admin/guides", label: "Travel guides" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/instagram", label: "Instagram references" },
  { href: "/admin/users", label: "Users & roles" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="-mx-1 overflow-x-auto lg:mx-0">
      <ul className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col">
        {ITEMS.map((item) => {
          const active = "exact" in item && item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  "block rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                  (active
                    ? "bg-navy text-ivory"
                    : "text-ink-muted hover:bg-ivory-deep hover:text-navy")
                }
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
