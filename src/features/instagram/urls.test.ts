import { describe, expect, it } from "vitest";

import { parseInstagramPostUrl } from "./urls";

describe("parseInstagramPostUrl", () => {
  it("canonicalizes post, reel and TV links", () => {
    expect(
      parseInstagramPostUrl("https://www.instagram.com/p/AbC123_xYz/?utm_source=test"),
    ).toEqual({
      shortcode: "AbC123_xYz",
      kind: "p",
      canonicalUrl: "https://www.instagram.com/p/AbC123_xYz/",
    });

    expect(parseInstagramPostUrl("https://instagram.com/reel/Reel12345/")).toEqual({
      shortcode: "Reel12345",
      kind: "reel",
      canonicalUrl: "https://www.instagram.com/reel/Reel12345/",
    });

    expect(parseInstagramPostUrl("https://m.instagram.com/reels/More12345/")).toEqual({
      shortcode: "More12345",
      kind: "reel",
      canonicalUrl: "https://www.instagram.com/reel/More12345/",
    });

    expect(parseInstagramPostUrl("http://www.instagram.com/tv/Tv123456/")).toEqual({
      shortcode: "Tv123456",
      kind: "tv",
      canonicalUrl: "https://www.instagram.com/tv/Tv123456/",
    });
  });

  it("rejects profiles, other hosts and CDN URLs", () => {
    expect(parseInstagramPostUrl("https://www.instagram.com/somecreator/")).toBeNull();
    expect(
      parseInstagramPostUrl("https://scontent.cdninstagram.com/v/t51/post.jpg"),
    ).toBeNull();
    expect(parseInstagramPostUrl("https://example.com/p/AbC123_xYz/")).toBeNull();
    expect(parseInstagramPostUrl("instagram.com/p/AbC123_xYz/")).toBeNull();
    expect(parseInstagramPostUrl("not a url")).toBeNull();
  });

  it("rejects invalid shortcodes", () => {
    expect(parseInstagramPostUrl("https://www.instagram.com/p/abc/")).toBeNull();
    expect(parseInstagramPostUrl("https://www.instagram.com/p/bad!code/")).toBeNull();
  });
});
