import { describe, expect, it } from "vitest";

import {
  MAX_IMAGE_BYTES,
  matchesImageSignature,
  validateImageMeta,
} from "./validation";

describe("image upload validation", () => {
  it("accepts the supported image types within the size limit", () => {
    expect(validateImageMeta("image/jpeg", 1024)).toBeNull();
    expect(validateImageMeta("image/png", 1024)).toBeNull();
    expect(validateImageMeta("image/webp", 1024)).toBeNull();
    expect(validateImageMeta("image/avif", 1024)).toBeNull();
  });

  it("rejects SVG and other non-photo uploads", () => {
    expect(validateImageMeta("image/svg+xml", 1024)).toMatch(/JPEG/);
    expect(validateImageMeta("application/pdf", 1024)).toMatch(/JPEG/);
  });

  it("rejects empty and oversized files", () => {
    expect(validateImageMeta("image/jpeg", 0)).toMatch(/Choose an image/);
    expect(validateImageMeta("image/jpeg", MAX_IMAGE_BYTES + 1)).toMatch(/8 MB/);
  });

  it("recognises real file signatures", () => {
    expect(matchesImageSignature(new Uint8Array([0xff, 0xd8, 0xff, 0x00]), "image/jpeg")).toBe(true);
    expect(
      matchesImageSignature(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        "image/png",
      ),
    ).toBe(true);
    expect(
      matchesImageSignature(
        new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
        "image/webp",
      ),
    ).toBe(true);
    expect(
      matchesImageSignature(
        new Uint8Array([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]),
        "image/avif",
      ),
    ).toBe(true);
  });

  it("rejects a renamed non-image", () => {
    expect(matchesImageSignature(new TextEncoder().encode("<html>no</html>"), "image/png")).toBe(
      false,
    );
  });
});
