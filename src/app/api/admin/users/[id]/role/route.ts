import { roleChangeSchema, setUserRole } from "@/features/admin/users";
import { assertAdmin } from "@/features/auth/session";
import { assertSameOrigin, errorResponse, HttpError, json, readJson } from "@/lib/http";

/** PATCH { role } — admin only, checked here independently of any page. */
export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/users/[id]/role">) {
  try {
    assertSameOrigin(request);
    const actor = await assertAdmin();
    const parsed = roleChangeSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, "Expected { role: USER | EDITOR | ADMIN }");

    const { id } = await params;
    const result = await setUserRole(actor, id, parsed.data.role);
    if (result.status === "self_change") throw new HttpError(409, "You can’t change your own role");
    if (result.status === "not_found") throw new HttpError(404, "User not found");
    return json({ id, role: parsed.data.role });
  } catch (error) {
    return errorResponse(error);
  }
}
