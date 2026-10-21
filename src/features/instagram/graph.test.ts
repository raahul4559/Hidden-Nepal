import { describe, expect, it, vi } from "vitest";

import {
  fetchGraphCandidates,
  instagramGraphConfigFromEnv,
  type InstagramGraphConfig,
} from "./graph";

const CONFIG: InstagramGraphConfig = {
  accessToken: "test-token",
  userId: "17841400000000000",
  apiVersion: "v23.0",
  hashtagTargets: [{ hashtag: "pokhara", destinationSlug: "phewa-lake" }],
  defaultDestinationSlug: "phewa-lake",
  maxPages: 2,
};

describe("instagramGraphConfigFromEnv", () => {
  it("stays disabled without credentials", () => {
    expect(instagramGraphConfigFromEnv({}).config).toBeNull();
  });

  it("reports a half-configured integration", () => {
    const result = instagramGraphConfigFromEnv({ INSTAGRAM_ACCESS_TOKEN: "token" });
    expect(result.config).toBeNull();
    expect(result.errors[0]).toMatch(/both INSTAGRAM_ACCESS_TOKEN/);
  });

  it("parses explicit destination mappings", () => {
    const result = instagramGraphConfigFromEnv({
      INSTAGRAM_ACCESS_TOKEN: "token",
      INSTAGRAM_USER_ID: "123",
      INSTAGRAM_HASHTAGS: "#everest:mount-everest, pokhara:phewa-lake",
    });

    expect(result.config?.hashtagTargets).toEqual([
      { hashtag: "everest", destinationSlug: "mount-everest" },
      { hashtag: "pokhara", destinationSlug: "phewa-lake" },
    ]);
    expect(result.errors).toEqual([]);
  });

  it("refuses a configured API with no destination mapping", () => {
    const result = instagramGraphConfigFromEnv({
      INSTAGRAM_ACCESS_TOKEN: "token",
      INSTAGRAM_USER_ID: "123",
    });
    expect(result.config).toBeNull();
    expect(result.errors[0]).toMatch(/no destination mapping/);
  });
});

describe("fetchGraphCandidates", () => {
  it("maps authorized media to configured destinations", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/ig_hashtag_search")) {
        return new Response(JSON.stringify({ data: [{ id: "hashtag-1" }] }), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "media-1",
              permalink: "https://www.instagram.com/p/Graph12345/",
              caption: "Caption returned by the authorized API.",
              username: "creator",
              media_type: "IMAGE",
              media_url: "https://scontent.cdninstagram.com/example.jpg",
              timestamp: "2026-10-20T10:00:00Z",
            },
          ],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const result = await fetchGraphCandidates(CONFIG, fetchImpl);

    expect(result.errors).toEqual([]);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0]).toMatchObject({
      destinationSlug: "phewa-lake",
      shortcode: "Graph12345",
      creatorUsername: "creator",
      sourceMethod: "GRAPH_API",
      rightsStatus: "PERMITTED",
    });
  });

  it("returns API errors without throwing or logging the token", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(JSON.stringify({ error: { message: "permission denied" } }), {
        status: 403,
      });
    }) as unknown as typeof fetch;

    const result = await fetchGraphCandidates(CONFIG, fetchImpl);

    expect(result.candidates).toEqual([]);
    expect(result.errors[0]).toMatch(/permission denied/);
    expect(result.errors.join(" ")).not.toContain(CONFIG.accessToken);
  });
});
