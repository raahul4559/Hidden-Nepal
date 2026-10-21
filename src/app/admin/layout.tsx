import type { Metadata } from "next";

import { AdminNav } from "@/features/admin/components/admin-nav";
import { requireAdminPage } from "@/features/auth/session";

export const metadata: Metadata = {
  title: { default: "Content studio", template: "%s | Admin | Hidden Nepal" },
  robots: { index: false, follow: false },
};

// The auth gate in this layout reads cookies and the database on every admin
// navigation. That is intentionally a blocking request: there is no useful
// static admin shell to show before the role is known.
export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // One guard for the whole studio. Every mutation still re-checks on its own.
  const actor = await requireAdminPage("/admin");

  return (
    <div className="min-h-screen bg-ivory">
      <div className="surface-dark pt-28 pb-8 sm:pt-32">
        <div className="container-page">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-gold">Hidden Nepal</p>
              <p className="mt-1 font-serif text-3xl leading-tight text-ivory">Content studio</p>
            </div>
            <p className="text-sm text-ivory/75">
              Signed in as <span className="font-medium text-ivory">{actor.email}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="container-page py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <AdminNav />
            <p className="mt-4 hidden text-xs leading-relaxed text-ink-muted lg:block">
              All changes are recorded in the audit log. Published content appears on the public
              site immediately.
            </p>
          </aside>
          <main id="admin-content" className="min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
