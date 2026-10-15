import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DestinationSummary } from "../types";
import { DestinationResults } from "./destination-results";

const empty = { title: "Nothing here yet", body: "Check back soon." };

const destination: DestinationSummary = {
  slug: "test-place",
  name: "Test Place",
  summary: "A fixture used only in tests.",
  category: "lakes",
  region: { slug: "karnali", name: "Karnali" },
  district: "Test District",
  elevationM: 2990,
  coverImage: null,
  isSample: true,
  practicalInfoStatus: "VERIFIED",
};

describe("DestinationResults", () => {
  it("renders a card per destination", () => {
    render(
      <DestinationResults
        result={{ status: "ok", destinations: [destination] }}
        empty={empty}
      />,
    );
    expect(screen.getByRole("heading", { name: "Test Place" })).toBeInTheDocument();
    expect(screen.getByText(/Test District, Karnali/)).toBeInTheDocument();
    expect(screen.getByText(/2,990 m/)).toBeInTheDocument();
    expect(screen.getByText("Sample content")).toBeInTheDocument();
  });

  it("shows the empty state when nothing is published", () => {
    render(<DestinationResults result={{ status: "ok", destinations: [] }} empty={empty} />);
    expect(screen.getByRole("heading", { name: empty.title })).toBeInTheDocument();
  });

  it("announces query failures", () => {
    render(<DestinationResults result={{ status: "error" }} empty={empty} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn’t be loaded/);
  });

  it("falls back to the empty state when no database is configured outside development", () => {
    // Vitest runs with NODE_ENV=test, so the developer hint stays hidden.
    render(<DestinationResults result={{ status: "unconfigured" }} empty={empty} />);
    expect(screen.getByRole("heading", { name: empty.title })).toBeInTheDocument();
    expect(screen.queryByText(/No database connected/)).not.toBeInTheDocument();
  });
});
