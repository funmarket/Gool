CREATE TYPE "PitchVenueType" AS ENUM ('FOOTBALL_PITCH', 'MINI_PITCH', 'FUTSAL', 'PRIVATE_STADIUM', 'INDOOR_FOOTBALL', 'OUTDOOR_FOOTBALL', 'OTHER_FOOTBALL');

CREATE TYPE "PitchListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'INACTIVE');

CREATE TABLE "PitchListing" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(1200),
    "photoUrl" TEXT,
    "venueType" "PitchVenueType",
    "city" VARCHAR(100),
    "houma" VARCHAR(100),
    "fullAddress" VARCHAR(240),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "hourlyRateMinor" BIGINT,
    "currency" VARCHAR(3),
    "publicPhone" VARCHAR(40),
    "publicEmail" VARCHAR(160),
    "status" "PitchListingStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "rejectionReason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PitchListing_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PitchListing_status_publishedAt_id_idx" ON "PitchListing"("status", "publishedAt", "id");
CREATE INDEX "PitchListing_ownerUserId_status_createdAt_idx" ON "PitchListing"("ownerUserId", "status", "createdAt");
CREATE INDEX "PitchListing_city_houma_status_idx" ON "PitchListing"("city", "houma", "status");
CREATE INDEX "PitchListing_venueType_status_idx" ON "PitchListing"("venueType", "status");
CREATE INDEX "PitchListing_reviewedByUserId_idx" ON "PitchListing"("reviewedByUserId");
CREATE INDEX "PitchListing_deletedAt_idx" ON "PitchListing"("deletedAt");
