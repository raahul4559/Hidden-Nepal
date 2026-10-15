import { describe, expect, it } from "vitest";

import { loginSchema, profileSchema, registerSchema, safeNextPath } from "./validation";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/destinations/rara-lake")).toBe("/destinations/rara-lake");
    expect(safeNextPath("/explore?q=lake")).toBe("/explore?q=lake");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "/login",
    "/register?next=/x",
    "/x\n/y",
    "",
    undefined,
    ["/account"],
  ])("falls back for %j", (value) => {
    expect(safeNextPath(value)).toBe("/account");
  });
});

describe("auth schemas", () => {
  it("normalises email and drops unknown fields such as role", () => {
    const parsed = registerSchema.parse({
      email: "  Traveller@Example.COM ",
      password: "a long enough password",
      confirmPassword: "a long enough password",
      role: "ADMIN",
      id: "someone-else",
    });
    expect(parsed).toEqual({
      email: "traveller@example.com",
      password: "a long enough password",
      confirmPassword: "a long enough password",
    });
    expect(profileSchema.parse({ name: "  ", role: "ADMIN" })).toEqual({ name: null });
  });

  it("enforces password length on registration only", () => {
    const short = registerSchema.safeParse({ email: "a@b.co", password: "short", confirmPassword: "short" });
    expect(short.success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x".repeat(129) }).success).toBe(false);
  });

  it("rejects non-string and malformed credentials", () => {
    for (const input of [{}, { email: 1, password: 2 }, { email: "no-at-sign", password: "x" }, { email: "a@b.co", password: "" }]) {
      expect(loginSchema.safeParse(input).success).toBe(false);
    }
  });
});
