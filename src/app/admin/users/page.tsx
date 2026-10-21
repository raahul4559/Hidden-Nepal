import type { Metadata } from "next";

import { AdminHeading } from "@/features/admin/components/admin-heading";
import { RoleForm } from "@/features/admin/components/role-form";
import { listUsers } from "@/features/admin/users";
import { requireAdminPage } from "@/features/auth/session";

export const metadata: Metadata = { title: "Users & roles" };

export default async function AdminUsersPage() {
  const actor = await requireAdminPage("/admin/users");
  const users = await listUsers(actor);

  return (
    <>
      <AdminHeading
        eyebrow="Access"
        title="Users & roles"
        intro="Roles can only be changed here by an administrator. You cannot change your own role."
      />

      {users.length === 0 ? (
        <p className="rounded-md border border-border bg-white p-6 text-sm text-ink-muted">
          No accounts have been created yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-ivory">
              <tr>
                <th scope="col" className="p-3 font-semibold">
                  Email
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Name
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.name ?? "—"}</td>
                  <td className="p-3">
                    {user.id === actor.id ? (
                      <span>{user.role} (you)</span>
                    ) : (
                      <RoleForm userId={user.id} role={user.role} email={user.email} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
