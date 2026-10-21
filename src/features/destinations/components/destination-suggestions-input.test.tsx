import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DestinationSuggestionsInput } from "./destination-suggestions-input";

const suggestions = [
  {
    slug: "rara-lake",
    name: "Rara Lake",
    district: "Mugu",
    region: "Karnali",
  },
];

describe("DestinationSuggestionsInput", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows matching places and supports keyboard selection", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <>
        <label htmlFor="place-search">Where to?</label>
        <DestinationSuggestionsInput
          id="place-search"
          name="q"
          placeholder="Search places"
          className="search-input"
        />
      </>,
    );

    const input = screen.getByRole("combobox", { name: "Where to?" });
    fireEvent.change(input, { target: { value: "ra" } });

    const option = await screen.findByRole("option", { name: /Rara Lake/ });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/destinations/suggestions?q=ra",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(option).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(input).toHaveValue("Rara Lake");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("keeps search usable when suggestions fail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(
      <>
        <label htmlFor="place-search">Where to?</label>
        <DestinationSuggestionsInput
          id="place-search"
          name="q"
          placeholder="Search places"
          className="search-input"
        />
      </>,
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "ra" } });

    expect(
      await screen.findByText("Suggestions are unavailable. You can still search."),
    ).toBeInTheDocument();
  });
});
