/*
  Warnings:

  - You are about to drop the column `category` on the `Destination` table. All the data in the column will be lost.
  - You are about to drop the column `coverImageAlt` on the `Destination` table. All the data in the column will be lost.
  - You are about to drop the column `coverImageCredit` on the `Destination` table. All the data in the column will be lost.
  - You are about to drop the column `coverImageLicense` on the `Destination` table. All the data in the column will be lost.
  - You are about to drop the column `coverImageSourceUrl` on the `Destination` table. All the data in the column will be lost.
  - You are about to drop the column `coverImageUrl` on the `Destination` table. All the data in the column will be lost.

*/
-- Hand-written guard: this migration replaces Destination.category and the
-- cover-image columns with relational tables without copying data. No
-- environment held destinations when it was written; refuse to run rather
-- than silently drop data if one does.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Destination") THEN
    RAISE EXCEPTION 'catalog_relations: "Destination" has rows. Migrate category and cover-image data to the new tables before applying.';
  END IF;
END $$;


-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TRAVELER', 'EDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MODERATE', 'CHALLENGING', 'STRENUOUS');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('NPR', 'USD');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('SPRING', 'MONSOON', 'AUTUMN', 'WINTER');

-- CreateEnum
CREATE TYPE "InfoStatus" AS ENUM ('PLACEHOLDER', 'UNVERIFIED', 'VERIFIED');

-- DropIndex
DROP INDEX "Destination_category_idx";

-- DropIndex
DROP INDEX "Destination_regionId_idx";

-- DropIndex
DROP INDEX "Destination_status_isFeatured_idx";

-- AlterTable
ALTER TABLE "Destination" DROP COLUMN "category",
DROP COLUMN "coverImageAlt",
DROP COLUMN "coverImageCredit",
DROP COLUMN "coverImageLicense",
DROP COLUMN "coverImageSourceUrl",
DROP COLUMN "coverImageUrl",
ADD COLUMN     "bestSeasonNotes" TEXT,
ADD COLUMN     "costNotes" TEXT,
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'NPR',
ADD COLUMN     "difficulty" "Difficulty",
ADD COLUMN     "estimatedCostMax" INTEGER,
ADD COLUMN     "estimatedCostMin" INTEGER,
ADD COLUMN     "isSample" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "practicalInfoStatus" "InfoStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "practicalInfoVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "suggestedDays" INTEGER;

-- DropEnum
DROP TYPE "ExperienceCategory";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TRAVELER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationCategory" (
    "destinationId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DestinationCategory_pkey" PRIMARY KEY ("destinationId","categoryId")
);

-- CreateTable
CREATE TABLE "DestinationImage" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "caption" TEXT,
    "credit" TEXT,
    "license" TEXT,
    "sourceUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DestinationImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationSeason" (
    "destinationId" TEXT NOT NULL,
    "season" "Season" NOT NULL,

    CONSTRAINT "DestinationSeason_pkey" PRIMARY KEY ("destinationId","season")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "DestinationCategory_categoryId_idx" ON "DestinationCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "DestinationImage_destinationId_position_key" ON "DestinationImage"("destinationId", "position");

-- CreateIndex
CREATE INDEX "DestinationSeason_season_idx" ON "DestinationSeason"("season");

-- CreateIndex
CREATE INDEX "Destination_status_isFeatured_publishedAt_idx" ON "Destination"("status", "isFeatured", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Destination_regionId_status_idx" ON "Destination"("regionId", "status");

-- CreateIndex
CREATE INDEX "Destination_difficulty_idx" ON "Destination"("difficulty");

-- AddForeignKey
ALTER TABLE "DestinationCategory" ADD CONSTRAINT "DestinationCategory_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationCategory" ADD CONSTRAINT "DestinationCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationImage" ADD CONSTRAINT "DestinationImage_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationSeason" ADD CONSTRAINT "DestinationSeason_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Hand-written CHECK constraints (not expressible in Prisma schema) ─────

-- URL slugs: lowercase words separated by single hyphens.
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_slug_format"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "Category" ADD CONSTRAINT "Category_slug_format"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "Region" ADD CONSTRAINT "Region_slug_format"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Coordinates are both present or both absent, and within valid ranges.
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_coordinates_valid"
  CHECK (
    ("latitude" IS NULL AND "longitude" IS NULL)
    -- Explicit NOT NULLs: a NULL comparison would make the CHECK pass.
    OR ("latitude" IS NOT NULL AND "longitude" IS NOT NULL
        AND "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)
  );

-- Nepal spans roughly 59 m to 8,849 m.
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_elevation_range"
  CHECK ("elevationM" IS NULL OR "elevationM" BETWEEN 0 AND 8849);

ALTER TABLE "Destination" ADD CONSTRAINT "Destination_cost_range"
  CHECK (
    ("estimatedCostMin" IS NULL OR "estimatedCostMin" >= 0)
    AND ("estimatedCostMax" IS NULL OR "estimatedCostMax" >= 0)
    AND ("estimatedCostMin" IS NULL OR "estimatedCostMax" IS NULL
         OR "estimatedCostMax" >= "estimatedCostMin")
  );

ALTER TABLE "Destination" ADD CONSTRAINT "Destination_suggested_days_positive"
  CHECK ("suggestedDays" IS NULL OR "suggestedDays" > 0);

-- A destination marked verified must record when.
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_verified_has_timestamp"
  CHECK ("practicalInfoStatus" <> 'VERIFIED' OR "practicalInfoVerifiedAt" IS NOT NULL);

-- Published destinations carry a publication date.
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_published_has_timestamp"
  CHECK ("status" <> 'PUBLISHED' OR "publishedAt" IS NOT NULL);

ALTER TABLE "DestinationImage" ADD CONSTRAINT "DestinationImage_position_nonnegative"
  CHECK ("position" >= 0);
ALTER TABLE "DestinationCategory" ADD CONSTRAINT "DestinationCategory_position_nonnegative"
  CHECK ("position" >= 0);

-- Emails are stored lowercase so the unique index is case-insensitive.
ALTER TABLE "User" ADD CONSTRAINT "User_email_lowercase"
  CHECK ("email" = lower("email"));
