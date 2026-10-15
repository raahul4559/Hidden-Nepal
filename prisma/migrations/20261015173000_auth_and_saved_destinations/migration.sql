-- Rename the default role. Hand-written: Prisma's generated recreate-and-cast
-- would fail on existing TRAVELER rows, while RENAME VALUE keeps them.
ALTER TYPE "UserRole" RENAME VALUE 'TRAVELER' TO 'USER';
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SavedDestination" (
    "userId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedDestination_pkey" PRIMARY KEY ("userId","destinationId")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "SavedDestination_userId_createdAt_idx" ON "SavedDestination"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SavedDestination_destinationId_idx" ON "SavedDestination"("destinationId");

-- CreateIndex
CREATE INDEX "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");

-- AddForeignKey
ALTER TABLE "SavedDestination" ADD CONSTRAINT "SavedDestination_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedDestination" ADD CONSTRAINT "SavedDestination_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Hand-written CHECK constraints ─────────────────────────────────────────

ALTER TABLE "User" ADD CONSTRAINT "User_session_version_non_negative"
  CHECK ("sessionVersion" >= 0);

-- Only scrypt hashes in our own format may be stored, never a raw password.
ALTER TABLE "User" ADD CONSTRAINT "User_password_hash_format"
  CHECK ("passwordHash" IS NULL OR "passwordHash" LIKE 'scrypt$%');
