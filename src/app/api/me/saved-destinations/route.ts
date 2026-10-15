import { z } from "zod";

import { assertUser } from "@/features/auth/session";
import { slugSchema } from "@/features/destinations/validation";
import { listSavedDestinations, removeSavedDestination, saveDestination } from "@/features/saved/service";
import { assertSameOrigin, errorResponse, HttpError, json, readJson } from "@/lib/http";

/**
 * The signed-in user's saved destinations. Always scoped to the session
 * user: there is no way to name another user here.
 */

const body = z.object({ slug: slugSchema });

async function parseSlug(request: Request) {
  const parsed = body.safeParse(await readJson(request));
  if (!parsed.success) throw new HttpError(400, "Expected { slug }");
  return parsed.data.slug;
}

export async function GET() {
  try {
    const user = await assertUser();
    const saved = await listSavedDestinations(user);
    return json({ saved: saved.map(({ slug, name, savedAt }) => ({ slug, name, savedAt })) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await assertUser();
    const result = await saveDestination(user, await parseSlug(request));
    if (result.status === "not_found") throw new HttpError(404, "Destination not found");
    return json({ saved: true }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await assertUser();
    await removeSavedDestination(user, await parseSlug(request));
    return json({ saved: false });
  } catch (error) {
    return errorResponse(error);
  }
}
