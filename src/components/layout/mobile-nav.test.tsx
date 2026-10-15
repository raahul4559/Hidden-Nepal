import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MobileNav } from "./mobile-nav";

const items = [
  { label: "Experiences", href: "/#experiences" },
  { label: "Explore", href: "/explore" },
];

describe("MobileNav", () => {
  it("toggles the menu and reflects state in aria-expanded", () => {
    render(<MobileNav items={items} />);
    const button = screen.getByRole("button", { name: "Open menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Explore" })).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Explore" })).toBeVisible();
  });

  it("closes on Escape and returns focus to the toggle", () => {
    render(<MobileNav items={items} />);
    const button = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(button);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });
});
