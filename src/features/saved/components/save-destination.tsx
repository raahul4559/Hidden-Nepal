import { Bookmark } from "lucide-react";
import Link from "next/link";

import { getCurrentUser, loginHref } from "@/features/auth/session";
import { destinationHref } from "@/features/destinations/schemas";

import { isDestinationSaved } from "../service";
import { SaveToggle } from "./save-toggle";

/**
 * Reads the session, so render it inside <Suspense>. Signed-out visitors get
 * a sign-in link that returns them to this destination.
 */
export async function SaveDestination({ slug }: { slug: string }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link
        href={loginHref(destinationHref(slug))}
        className="inline-flex h-11 items-center gap-2 rounded-md border border-ivory/35 px-5 text-sm font-semibold text-ivory transition-colors hover:border-gold hover:bg-ivory/10"
      >
        <Bookmark aria-hidden className="size-4" />
        Sign in to save
      </Link>
    );
  }

  const saved = await isDestinationSaved(user, slug).catch(() => false);
  return <SaveToggle slug={slug} initiallySaved={saved} />;
}
