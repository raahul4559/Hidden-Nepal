import { describe, expect, it } from "vitest";

import { isOptimizableImageSrc } from "./images";

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
