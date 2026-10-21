import { type NextRequest, NextResponse } from "next/server";

/**
 * Optimistic redirect only: sends visitors with no session cookie straight to
 * /login with a real 307, before any rendering. It never decides access.
 * Pages, Server Actions and Route Handlers each verify the session against the
 * database themselves (src/features/auth/session.ts).
 */

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some(
    (name) =>
      request.cookies.has(name) ||
      // Large tokens are chunked: name.0, name.1, …
      request.cookies.has(`${name}.0`),
  );
  if (hasSession) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const login = new URL("/login", request.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/trips/:path*"],
};
