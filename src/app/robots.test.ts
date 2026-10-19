import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("robots.txt", () => {
  it("blocks API crawling and advertises the sitemap", () => {
    const config = robots();
    const rule = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    const disallowed = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];

    expect(rule.userAgent).toBe("*");
    expect(rule.allow).toBe("/");
    expect(disallowed).toEqual(["/api/"]);
    expect(config.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
