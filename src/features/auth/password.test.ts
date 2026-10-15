import { describe, expect, it } from "vitest";

import { hashPassword, needsRehash, verifyAgainstDummy, verifyPassword } from "./password";

describe("password hashing", () => {
  it("hashes with a random salt and verifies", async () => {
    const [a, b] = await Promise.all([hashPassword("correct horse battery"), hashPassword("correct horse battery")]);
    expect(a).toMatch(/^scrypt\$131072\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(a).not.toBe(b);
    expect(a).not.toContain("correct horse battery");
    expect(await verifyPassword("correct horse battery", a)).toBe(true);
    expect(await verifyPassword("correct horse batterY", a)).toBe(false);
    expect(needsRehash(a)).toBe(false);
  });

  it("normalises Unicode so the same password typed differently still matches", async () => {
    const hash = await hashPassword("café au lait!");
    expect(await verifyPassword("café au lait!", hash)).toBe(true);
  });

  it("never verifies malformed or tampered hashes", async () => {
    const hash = await hashPassword("password one two");
    const parts = hash.split("$");
    for (const bad of [
      "",
      "plaintext",
      "bcrypt$whatever",
      [...parts.slice(0, 5), Buffer.alloc(32).toString("base64")].join("$"),
      ["scrypt", 2 ** 30, 8, 1, parts[4], parts[5]].join("$"), // memory bomb
      ["scrypt", 2 ** 10, 8, 1, parts[4], parts[5]].join("$"), // too weak
    ]) {
      expect(await verifyPassword("password one two", bad)).toBe(false);
    }
    expect(needsRehash("plaintext")).toBe(true);
  });

  it("dummy verification always fails", async () => {
    expect(await verifyAgainstDummy("anything at all")).toBe(false);
  });
});
