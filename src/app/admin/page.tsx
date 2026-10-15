import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { RoleForm } from "@/features/admin/components/role-form";
import { listUsers } from "@/features/admin/users";
import { requireAdminPage } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

/**
 * Minimal admin area: role management only, to prove the authorization
 * model. Moderation and content editing arrive in the admin chunk.
 */
export default function AdminPage() {
  // Everything, including the heading, waits for the check, so the static
  // shell says nothing about the admin area.
  return (
    <Suspense fallback={<PageHeader eyebrow="Hidden Nepal" title="Loading…" />}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  // Non-admins get a 404. Every admin mutation re-checks on its own.
  const actor = await requireAdminPage("/admin");
  const users = await listUsers(actor);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Users and roles" />
      <div className="container-page py-14 sm:py-20">
        <div className="overflow-x-auto rounded-md border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-ivory">
              <tr>
                <th scope="col" className="p-3 font-semibold">Email</th>
                <th scope="col" className="p-3 font-semibold">Name</th>
                <th scope="col" className="p-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.name ?? "—"}</td>
                  <td className="p-3">
                    {u.id === actor.id ? (
                      <span>{u.role} (you)</span>
                    ) : (
                      <RoleForm userId={u.id} role={u.role} email={u.email} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
