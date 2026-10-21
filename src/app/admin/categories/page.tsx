import type { Metadata } from "next";

import { AdminHeading } from "@/features/admin/components/admin-heading";
import { CategoryForm } from "@/features/admin/components/category-form";
import { listAdminCategories } from "@/features/admin/categories";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const result = await listAdminCategories();

  if (result.status === "unconfigured") {
    return (
      <>
        <AdminHeading eyebrow="Taxonomy" title="Categories" />
        <p className="rounded-md border border-gold/50 bg-gold/10 p-4 text-sm">
          Connect a database to manage categories.
        </p>
      </>
    );
  }
  if (result.status === "error") throw new Error("Could not load categories");

  return (
    <>
      <AdminHeading
        eyebrow="Taxonomy"
        title="Categories"
        intro="The public navigation defines seven fixed experience slugs. You can edit their names, descriptions and order here; destinations choose from the same list."
      />

      {result.categories.length === 0 ? (
        <p className="rounded-md border border-border bg-white p-6 text-sm text-ink-muted">
          No categories exist. Run <code className="font-mono">npm run db:seed</code> to create the
          reference taxonomy.
        </p>
      ) : (
        <div className="space-y-4">
          {result.categories.map((category) => (
            <section key={category.id} className="rounded-md border border-border bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-border pb-3">
                <div>
                  <p className="font-mono text-xs text-ink-muted">{category.slug}</p>
                  <p className="text-sm text-ink-muted">
                    {category.destinationCount} destination
                    {category.destinationCount === 1 ? "" : "s"} · {category.publishedCount}{" "}
                    published
                  </p>
                </div>
                <a
                  href={`/explore?category=${encodeURIComponent(category.slug)}`}
                  className="ml-auto text-sm font-medium text-himalaya underline-offset-4 hover:underline"
                >
                  View in explore
                </a>
              </div>
              <CategoryForm category={category} />
            </section>
          ))}
        </div>
      )}
    </>
  );
}
