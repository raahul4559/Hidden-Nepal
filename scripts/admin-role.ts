import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Grants or revokes ADMIN for an existing account, by email. This is the only
 * way to create the first administrator: it needs direct database
 * credentials, which no web visitor has. Later admins can be promoted from
 * /admin by an existing admin.
 *
 * Revoking also bumps sessionVersion, signing the account out everywhere.
 */
export async function setAdminByEmail(prisma: PrismaClient, rawEmail: string, grant: boolean) {
  const email = rawEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!user) {
    throw new Error(`No account for ${email}. Register at /register first, then re-run this command.`);
  }
  const role = grant ? "ADMIN" : "USER";
  await prisma.user.update({
    where: { id: user.id },
    data: { role, ...(grant ? {} : { sessionVersion: { increment: 1 } }) },
  });
  return { email, previous: user.role, role };
}
