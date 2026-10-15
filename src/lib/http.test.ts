import { describe, expect, it } from "vitest";

import { AuthorizationError } from "@/features/auth/session";

import { assertSameOrigin, errorResponse, HttpError } from "./http";

const req = (headers: Record<string, string>) => new Request("http://localhost:3000/api/x", { method: "POST", headers });

describe("assertSameOrigin", () => {
  it("accepts same-origin requests, including behind a proxy", () => {
    expect(() => assertSameOrigin(req({ host: "localhost:3000", origin: "http://localhost:3000" }))).not.toThrow();
    expect(() =>
      assertSameOrigin(req({ host: "internal:8080", "x-forwarded-host": "hiddennepal.example", origin: "https://hiddennepal.example" })),
    ).not.toThrow();
  });

  it.each<Record<string, string>>([
    { host: "localhost:3000" },
    { host: "localhost:3000", origin: "https://evil.example" },
    { host: "localhost:3000", origin: "null" },
    { host: "localhost:3000", origin: "http://localhost:3000.evil.example" },
  ])("rejects %j", (headers) => {
    expect(() => assertSameOrigin(req(headers))).toThrow(HttpError);
  });
});

describe("errorResponse", () => {
  it("maps authorization errors and hides unexpected ones", async () => {
    expect(errorResponse(new AuthorizationError(401)).status).toBe(401);
    expect(errorResponse(new AuthorizationError(403)).status).toBe(403);
    const original = console.error;
    console.error = () => {};
    const res = errorResponse(new Error("connection string postgres://user:secret@host"));
    console.error = original;
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain("secret");
  });
});
