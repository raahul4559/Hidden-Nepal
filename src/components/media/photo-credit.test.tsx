import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PhotoCredit } from "./photo-credit";

describe("PhotoCredit", () => {
  it("shows linked attribution and license outside the photo overlay", () => {
    render(
      <PhotoCredit
        author="Vyacheslav Argenberg"
        license="CC BY 4.0"
        sourceUrl="https://commons.wikimedia.org/wiki/File:Example.jpg"
      />,
    );

    const link = screen.getByRole("link", {
      name: "Photo: Vyacheslav Argenberg, CC BY 4.0",
    });

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer license");
    expect(link).toHaveTextContent("Photo: Vyacheslav Argenberg · CC BY 4.0");
    expect(link).not.toHaveClass("absolute");
    expect(link.parentElement).toHaveClass("text-muted-foreground");
  });
});
