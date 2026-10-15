-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SPAM');

-- AlterTable
ALTER TABLE "Destination" ADD COLUMN     "isHiddenGem" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PlaceSubmission" (
    "id" TEXT NOT NULL,
    "placeName" TEXT NOT NULL,
    "regionId" TEXT,
    "categoryId" TEXT,
    "locationDetails" TEXT,
    "description" TEXT NOT NULL,
    "submitterName" TEXT,
    "submitterEmail" TEXT,
    "submitterId" TEXT,
    "consentToShare" BOOLEAN NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaceSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaceSubmission_status_createdAt_idx" ON "PlaceSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Destination_status_isHiddenGem_publishedAt_idx" ON "Destination"("status", "isHiddenGem", "publishedAt" DESC);

-- AddForeignKey
ALTER TABLE "PlaceSubmission" ADD CONSTRAINT "PlaceSubmission_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceSubmission" ADD CONSTRAINT "PlaceSubmission_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceSubmission" ADD CONSTRAINT "PlaceSubmission_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Hand-written CHECK constraints ──────────────────────────────────────────

ALTER TABLE "PlaceSubmission" ADD CONSTRAINT "PlaceSubmission_consent_required"
  CHECK ("consentToShare" = true);
ALTER TABLE "PlaceSubmission" ADD CONSTRAINT "PlaceSubmission_email_lowercase"
  CHECK ("submitterEmail" IS NULL OR "submitterEmail" = lower("submitterEmail"));
ALTER TABLE "PlaceSubmission" ADD CONSTRAINT "PlaceSubmission_text_lengths"
  CHECK (
    char_length("placeName") BETWEEN 2 AND 120
    AND char_length("description") BETWEEN 30 AND 3000
  );
ALTER TABLE "PlaceSubmission" ADD CONSTRAINT "PlaceSubmission_reviewed_has_timestamp"
  CHECK ("status" = 'PENDING' OR "reviewedAt" IS NOT NULL);
