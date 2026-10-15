/**
 * `npm run db:seed` (prisma db seed). Safe to run repeatedly.
 *
 * - Always: Nepal's seven provinces and the experience categories.
 * - Unless SEED_SAMPLE_DATA=false: four DEVELOPMENT SAMPLE destinations whose
 *   practical details are placeholders (see prisma/seed/sample-destinations.ts).
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

import { resolveSeedOptions, seedDatabase } from "./seed/index";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

seedDatabase(prisma, resolveSeedOptions(process.env))
  .then((result) => {
    console.log(
      `Seeded ${result.regions} provinces, ${result.categories} categories, ${result.activities} activities, ` +
        `${result.sampleDestinations} sample destinations (placeholder practical info).`,
    );
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
