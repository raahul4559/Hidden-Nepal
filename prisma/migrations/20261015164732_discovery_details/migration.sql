-- AlterTable
ALTER TABLE "Destination" ADD COLUMN     "accessInfo" TEXT,
ADD COLUMN     "safetyInfo" TEXT;

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationActivity" (
    "destinationId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DestinationActivity_pkey" PRIMARY KEY ("destinationId","activityId")
);

-- CreateTable
CREATE TABLE "DestinationSource" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publisher" TEXT,
    "accessedAt" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DestinationSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Activity_slug_key" ON "Activity"("slug");

-- CreateIndex
CREATE INDEX "DestinationActivity_activityId_idx" ON "DestinationActivity"("activityId");

-- CreateIndex
CREATE INDEX "DestinationSource_destinationId_position_idx" ON "DestinationSource"("destinationId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "DestinationSource_destinationId_url_key" ON "DestinationSource"("destinationId", "url");

-- CreateIndex
CREATE INDEX "Destination_status_name_idx" ON "Destination"("status", "name");

-- CreateIndex
CREATE INDEX "Destination_regionId_district_idx" ON "Destination"("regionId", "district");

-- CreateIndex
CREATE INDEX "Destination_status_practicalInfoStatus_estimatedCostMin_idx" ON "Destination"("status", "practicalInfoStatus", "estimatedCostMin");

-- AddForeignKey
ALTER TABLE "DestinationActivity" ADD CONSTRAINT "DestinationActivity_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationActivity" ADD CONSTRAINT "DestinationActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationSource" ADD CONSTRAINT "DestinationSource_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Hand-written CHECK constraints ──────────────────────────────────────────

ALTER TABLE "Activity" ADD CONSTRAINT "Activity_slug_format"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "DestinationSource" ADD CONSTRAINT "DestinationSource_url_https"
  CHECK ("url" ~ '^https://');
ALTER TABLE "DestinationActivity" ADD CONSTRAINT "DestinationActivity_position_nonnegative"
  CHECK ("position" >= 0);
