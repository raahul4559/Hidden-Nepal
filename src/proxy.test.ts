import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, proxy } from "./proxy";

function request(path: string, cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, { headers: cookie ? { cookie } : {} });
}

describe("proxy (optimistic redirect)", () => {
  it("only runs on protected areas", () => {
    expect(config.matcher).toEqual(["/account/:path*", "/admin/:path*"]);
  });

  it("redirects visitors without a session cookie to sign in, keeping the path", () => {
    const res = proxy(request("/admin?tab=users"));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/admin?tab=users");
  });

  it("lets requests with a session cookie through for the page to verify", () => {
    expect(proxy(request("/account", "authjs.session-token=abc")).headers.get("location")).toBeNull();
    expect(proxy(request("/account", "__Secure-authjs.session-token.0=abc")).headers.get("location")).toBeNull();
    expect(proxy(request("/account", "other=1")).status).toBe(307);
  });
});
