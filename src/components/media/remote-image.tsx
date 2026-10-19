"use client";

import Image from "next/image";
import { useState } from "react";

import { getImageOptimizationSrc, isOptimizableImageSrc } from "@/lib/images";

import { ImageFallback } from "./image-fallback";

type RemoteImageProps = {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  className?: string;
  /** Above-the-fold hero: load immediately at high priority. */
  priority?: boolean;
};

/**
 * Fill-mode image for content-managed URLs. Falls back to <ImageFallback>
 * when the URL is missing, from a host next/image is not configured for,
 * or fails to load.
 */
export function RemoteImage({ src, alt, sizes, className, priority }: RemoteImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = getImageOptimizationSrc(src, priority ? 1600 : 960);

  if (!imageSrc || !isOptimizableImageSrc(imageSrc) || failedSrc === imageSrc) {
    return <ImageFallback label={alt || undefined} />;
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      loading={priority ? "eager" : undefined}
      fetchPriority={priority ? "high" : undefined}
      onError={() => setFailedSrc(imageSrc)}
    />
  );
}
