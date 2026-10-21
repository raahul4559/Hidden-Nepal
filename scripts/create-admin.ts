import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

import { PrismaClient } from "../src/generated/prisma/client";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const PARAMS = { N: 2 ** 17, r: 8, p: 1 } as const;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

function maxmemFor(N: number, r: number) {
  return 256 * N * r;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const { N, r, p } = PARAMS;
  const key = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N,
    r,
    p,
    maxmem: maxmemFor(N, r),
  });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

const email = (process.env.ADMIN_EMAIL || "admin@hiddennepal.com").toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
const name = process.env.ADMIN_NAME || "Admin";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const passwordHash = await hashPassword(password);

    const user = await db.user.upsert({
      where: { email },
      create: {
        email,
        name,
        role: "ADMIN",
        passwordHash,
      },
      update: {
        role: "ADMIN",
        passwordHash,
        name,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    console.log("Admin user created/updated:");
    console.log(user);
    console.log("\nLogin at /login with:");
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log("\nChange the password after first login.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
