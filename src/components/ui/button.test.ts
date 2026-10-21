import { describe, expect, it } from "vitest";

import { buttonVariants } from "./button";

describe("buttonVariants", () => {
  it("uses white text on a high-contrast teal background for accent buttons", () => {
    const classes = buttonVariants({ variant: "accent" });

    expect(classes).toContain("bg-teal-button");
    expect(classes).toContain("text-white");
    expect(classes).toContain("hover:bg-teal-button-hover");
  });
});
