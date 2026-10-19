import { afterEach, describe, expect, it, vi } from "vitest";

import { absoluteUrl, getSiteUrl } from "./site-url";

describe("site URL", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the configured public origin when provided", () => {
    vi.stubEnv("SITE_URL", "https://travel.example");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "preview.example");
    vi.stubEnv("NODE_ENV", "production");

    expect(absoluteUrl("/sitemap.xml")).toBe("https://travel.example/sitemap.xml");
  });

  it("uses Vercel's production domain when deployed there", () => {
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "hiddennepal-one.vercel.app");
    vi.stubEnv("NODE_ENV", "production");

    expect(getSiteUrl().origin).toBe("https://hiddennepal-one.vercel.app");
  });

  it("uses the production domain on self-hosted production deployments", () => {
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("NODE_ENV", "production");

    expect(getSiteUrl().origin).toBe("https://hiddennepal-one.vercel.app");
  });

  it("uses localhost during local development", () => {
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("NODE_ENV", "development");

    expect(getSiteUrl().origin).toBe("http://localhost:3000");
  });
});
