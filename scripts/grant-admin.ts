/**
 * Usage:
 *   npm run admin:grant -- you@example.com            # make an existing account ADMIN
 *   npm run admin:grant -- you@example.com --revoke   # back to USER, signed out everywhere
 *
 * Uses DATABASE_URL from the environment or .env.
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

import { setAdminByEmail } from "./admin-role";

const args = process.argv.slice(2);
const revoke = args.includes("--revoke");
const email = args.find((a) => !a.startsWith("--"));

if (!email) {
  console.error("Usage: npm run admin:grant -- <email> [--revoke]");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

setAdminByEmail(prisma, email, !revoke)
  .then(({ email, previous, role }) => console.log(`${email}: ${previous} → ${role}`))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
