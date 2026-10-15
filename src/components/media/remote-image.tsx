"use client";

import Image from "next/image";
import { useState } from "react";

import { isOptimizableImageSrc } from "@/lib/images";

import { ImageFallback } from "./image-fallback";

type RemoteImageProps = {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  className?: string;
};

/**
 * Fill-mode image for content-managed URLs. Falls back to <ImageFallback>
 * when the URL is missing, from a host next/image is not configured for,
 * or fails to load.
 */
export function RemoteImage({ src, alt, sizes, className }: RemoteImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || !isOptimizableImageSrc(src) || failedSrc === src) {
    return <ImageFallback label={alt || undefined} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
