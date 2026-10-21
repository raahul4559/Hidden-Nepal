import "server-only";

import { revalidatePath } from "next/cache";

/** Refreshes the public and admin surfaces that show a destination. */
export function revalidateDestination(slug: string, previousSlug?: string) {
  revalidatePath(`/destinations/${slug}`);
  if (previousSlug && previousSlug !== slug) revalidatePath(`/destinations/${previousSlug}`);
  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/provinces");
  revalidatePath("/admin");
  revalidatePath("/admin/destinations");
  revalidatePath("/sitemap.xml");
}

export function revalidateGuide(slug: string, previousSlug?: string) {
  revalidatePath(`/guides/${slug}`);
  if (previousSlug && previousSlug !== slug) revalidatePath(`/guides/${previousSlug}`);
  revalidatePath("/guides");
  revalidatePath("/admin");
  revalidatePath("/admin/guides");
  revalidatePath("/sitemap.xml");
}
