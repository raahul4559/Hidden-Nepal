import { describe, expect, it } from "vitest";

import { parseServerEnv } from "./env";

describe("parseServerEnv", () => {
  it("treats a missing or empty DATABASE_URL as unconfigured", () => {
    expect(parseServerEnv({}).DATABASE_URL).toBeUndefined();
    expect(parseServerEnv({ DATABASE_URL: "" }).DATABASE_URL).toBeUndefined();
  });

  it("accepts postgres URLs", () => {
    const url = "postgresql://user:pass@localhost:5432/hidden_nepal";
    expect(parseServerEnv({ DATABASE_URL: url }).DATABASE_URL).toBe(url);
  });

  it("explains SQLAlchemy-style driver suffixes", () => {
    expect(() =>
      parseServerEnv({ DATABASE_URL: "postgresql+psycopg://u:p@host/db" }),
    ).toThrow(/\+driver/);
  });

  it("does not echo the URL (and its password) in errors", () => {
    let message = "";
    try {
      parseServerEnv({ DATABASE_URL: "mysql://user:s3cret@host/db" });
    } catch (error) {
      message = String(error);
    }
    expect(message).toMatch(/postgres/);
    expect(message).not.toContain("s3cret");
  });

  it("rejects non-postgres URLs loudly", () => {
    expect(() => parseServerEnv({ DATABASE_URL: "mysql://localhost/db" })).toThrow(
      /postgres/,
    );
  });
});
