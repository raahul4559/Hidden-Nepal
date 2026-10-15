import "server-only";

import { AuthorizationError } from "@/features/auth/session";

/**
 * Helpers for JSON Route Handlers.
 *
 * Route Handlers don't get the Origin check Next.js applies to Server
 * Actions, and session cookies are sent on cross-site requests for some
 * navigations, so mutating handlers call `assertSameOrigin` as their CSRF
 * defence (alongside SameSite=Lax cookies and JSON-only bodies).
 */

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) throw new HttpError(403, "Cross-site request rejected");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, "Cross-site request rejected");
  }
  if (originHost !== host) throw new HttpError(403, "Cross-site request rejected");
}

/** Parses a JSON body, requiring the JSON content type (blocks form-based CSRF). */
export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "Expected application/json");
  }
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Malformed JSON");
  }
}

const noStore = { "Cache-Control": "no-store" };

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: noStore });
}

/** Maps known errors to safe responses; anything else is a generic 500. */
export function errorResponse(error: unknown) {
  if (error instanceof AuthorizationError || error instanceof HttpError) {
    return json({ error: error.message }, error.status);
  }
  console.error("[api] unexpected error", error instanceof Error ? error.message : error);
  return json({ error: "Something went wrong" }, 500);
}
