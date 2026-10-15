/**
 * Hosts that next/image may optimise. Shared with next.config.ts so that the
 * UI can fall back gracefully instead of throwing on an unknown host.
 */
export const REMOTE_IMAGE_HOSTS = ["upload.wikimedia.org"] as const;

export function isOptimizableImageSrc(src: string | null | undefined) {
  if (!src) return false;
  if (src.startsWith("/")) return !src.startsWith("//");
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      (REMOTE_IMAGE_HOSTS as readonly string[]).includes(url.hostname)
    );
  } catch {
    return false;
  }
}
