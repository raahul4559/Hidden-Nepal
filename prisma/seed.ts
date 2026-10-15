/**
 * Seeds reference data only: Nepal's seven provinces.
 * Destinations are intentionally not seeded; they must come from verified
 * research, not placeholders.
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PROVINCES } from "../src/features/regions/provinces";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  for (const [index, province] of PROVINCES.entries()) {
    await prisma.region.upsert({
      where: { slug: province.slug },
      update: { name: province.name, sortOrder: index },
      create: { slug: province.slug, name: province.name, sortOrder: index },
    });
  }
  console.log(`Seeded ${PROVINCES.length} provinces.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
