/**
 * Hosts that next/image may optimise. Shared with next.config.ts so that the
 * UI can fall back gracefully instead of throwing on an unknown host.
 */
export const REMOTE_IMAGE_HOSTS = ["upload.wikimedia.org"] as const;

/**
 * Use Commons-generated thumbnails instead of making the image optimizer
 * download multi-megabyte originals for destination cards and headers.
 */
export function getImageOptimizationSrc(
  src: string | null | undefined,
  width: number,
): string | null {
  if (!src) return null;

  try {
    const url = new URL(src);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "upload.wikimedia.org" ||
      !url.pathname.startsWith("/wikipedia/commons/")
    ) {
      return src;
    }

    const parts = url.pathname.split("/");
    if (parts[3] === "thumb" || parts.length !== 6 || !parts[5]) return src;

    const filePath = parts.slice(3).join("/");
    return `${url.origin}/wikipedia/commons/thumb/${filePath}/${width}px-${parts[5]}`;
  } catch {
    return src;
  }
}

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
