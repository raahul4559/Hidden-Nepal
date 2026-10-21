-- CreateEnum
CREATE TYPE "TripVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- AlterEnum
ALTER TYPE "SubmissionStatus" ADD VALUE 'CHANGES_REQUESTED';

-- AlterTable
ALTER TABLE "PlaceSubmission" ADD COLUMN     "district" TEXT,
ADD COLUMN     "imageAlt" TEXT,
ADD COLUMN     "imagePublicId" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "latitude" DECIMAL(9,6),
ADD COLUMN     "longitude" DECIMAL(9,6),
ADD COLUMN     "reviewerId" TEXT;

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "visibility" "TripVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripStop" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "destinationId" TEXT,
    "destinationName" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "day" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trip_userId_updatedAt_idx" ON "Trip"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "TripStop_tripId_idx" ON "TripStop"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "TripStop_tripId_position_key" ON "TripStop"("tripId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "TripStop_tripId_destinationId_key" ON "TripStop"("tripId", "destinationId");

-- AddForeignKey
ALTER TABLE "PlaceSubmission" ADD CONSTRAINT "PlaceSubmission_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ─── Hand-written CHECK constraints ──────────────────────────────────────────
-- Prisma cannot express these. They keep review decisions attributable and
-- coordinates plausible even if a future code path skips validation.

-- Coordinates are supplied as a pair, in decimal degrees.
ALTER TABLE "PlaceSubmission" ADD CONSTRAINT "PlaceSubmission_coordinates_together"
  CHECK (
    ("latitude" IS NULL AND "longitude" IS NULL)
    OR ("latitude" IS NOT NULL AND "longitude" IS NOT NULL)
  );
ALTER TABLE "PlaceSubmission" ADD CONSTRAINT "PlaceSubmission_latitude_range"
  CHECK ("latitude" IS NULL OR ("latitude" >= -90 AND "latitude" <= 90));
ALTER TABLE "PlaceSubmission" ADD CONSTRAINT "PlaceSubmission_longitude_range"
  CHECK ("longitude" IS NULL OR ("longitude" >= -180 AND "longitude" <= 180));
ALTER TABLE "PlaceSubmission" ADD CONSTRAINT "PlaceSubmission_district_length"
  CHECK ("district" IS NULL OR char_length("district") BETWEEN 2 AND 80);
ALTER TABLE "PlaceSubmission" ADD CONSTRAINT "PlaceSubmission_image_fields"
  CHECK (
    ("imageUrl" IS NULL OR char_length("imageUrl") <= 500)
    AND ("imagePublicId" IS NULL OR char_length("imagePublicId") <= 255)
    AND ("imageAlt" IS NULL OR char_length("imageAlt") <= 200)
  );

-- A decision always names who made it, when, and why it was refused.
ALTER TABLE "PlaceSubmission" ADD CONSTRAINT "PlaceSubmission_refusal_explained"
  CHECK ("status" NOT IN ('REJECTED', 'CHANGES_REQUESTED') OR "reviewNotes" IS NOT NULL);
ALTER TABLE "PlaceSubmission" ADD CONSTRAINT "PlaceSubmission_review_attributed"
  CHECK ("status" = 'PENDING' OR ("reviewedAt" IS NOT NULL AND "reviewerId" IS NOT NULL));

ALTER TABLE "Trip" ADD CONSTRAINT "Trip_title_length"
  CHECK (char_length("title") BETWEEN 2 AND 120);
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_notes_length"
  CHECK ("notes" IS NULL OR char_length("notes") <= 4000);

ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_position_start"
  CHECK ("position" >= 0);
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_day_range"
  CHECK ("day" IS NULL OR ("day" BETWEEN 1 AND 60));
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_name_length"
  CHECK (char_length("destinationName") BETWEEN 1 AND 120);
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_notes_length"
  CHECK ("notes" IS NULL OR char_length("notes") <= 2000);
