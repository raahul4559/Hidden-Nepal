-- CreateEnum
CREATE TYPE "InstagramSourceMethod" AS ENUM ('GRAPH_API', 'MANUAL');

-- CreateEnum
CREATE TYPE "InstagramRightsStatus" AS ENUM ('PERMITTED', 'UNVERIFIED');

-- CreateTable
CREATE TABLE "DestinationInstagramPost" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "shortcode" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "creatorUsername" TEXT,
    "caption" TEXT,
    "locationTag" TEXT,
    "imageUrl" TEXT,
    "sourceMethod" "InstagramSourceMethod" NOT NULL,
    "rightsStatus" "InstagramRightsStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "rightsNote" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DestinationInstagramPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DestinationInstagramPost_shortcode_key" ON "DestinationInstagramPost"("shortcode");

-- CreateIndex
CREATE UNIQUE INDEX "DestinationInstagramPost_url_key" ON "DestinationInstagramPost"("url");

-- CreateIndex
CREATE INDEX "DestinationInstagramPost_destinationId_collectedAt_idx" ON "DestinationInstagramPost"("destinationId", "collectedAt" DESC);

-- CreateIndex
CREATE INDEX "DestinationInstagramPost_rightsStatus_idx" ON "DestinationInstagramPost"("rightsStatus");

-- AddForeignKey
ALTER TABLE "DestinationInstagramPost" ADD CONSTRAINT "DestinationInstagramPost_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
