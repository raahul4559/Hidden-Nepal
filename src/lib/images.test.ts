import { describe, expect, it } from "vitest";

import { getImageOptimizationSrc, isOptimizableImageSrc } from "./images";

describe("isOptimizableImageSrc", () => {
  it("allows local paths", () => {
    expect(isOptimizableImageSrc("/images/rara.jpg")).toBe(true);
  });

  it("allows configured https hosts only", () => {
    expect(
      isOptimizableImageSrc("https://upload.wikimedia.org/wikipedia/commons/a/b.jpg"),
    ).toBe(true);
    expect(isOptimizableImageSrc("http://upload.wikimedia.org/a.jpg")).toBe(false);
    expect(isOptimizableImageSrc("https://example.com/a.jpg")).toBe(false);
  });

  it("rejects empty, protocol-relative and malformed values", () => {
    expect(isOptimizableImageSrc(undefined)).toBe(false);
    expect(isOptimizableImageSrc("")).toBe(false);
    expect(isOptimizableImageSrc("//example.com/a.jpg")).toBe(false);
    expect(isOptimizableImageSrc("not a url")).toBe(false);
  });
});

describe("getImageOptimizationSrc", () => {
  it("uses a size-limited Wikimedia thumbnail and removes tracking query parameters", () => {
    expect(
      getImageOptimizationSrc(
        "https://upload.wikimedia.org/wikipedia/commons/9/90/Everest%2C_Himalayas.jpg?utm_source=commons.wikimedia.org",
        960,
      ),
    ).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Everest%2C_Himalayas.jpg/960px-Everest%2C_Himalayas.jpg",
    );
  });

  it("leaves local, non-Wikimedia, and already-thumb sources unchanged", () => {
    expect(getImageOptimizationSrc("/images/rara.jpg", 960)).toBe("/images/rara.jpg");
    expect(getImageOptimizationSrc("https://example.com/image.jpg", 960)).toBe(
      "https://example.com/image.jpg",
    );
    const thumbnail =
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/file.jpg/960px-file.jpg";
    expect(getImageOptimizationSrc(thumbnail, 960)).toBe(thumbnail);
  });
});
