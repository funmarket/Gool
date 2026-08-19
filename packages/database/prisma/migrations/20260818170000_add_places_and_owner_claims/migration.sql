CREATE TYPE "PlaceStatus" AS ENUM ('COMMUNITY_SUGGESTED', 'OWNER_CLAIMED', 'VERIFIED');

CREATE TYPE "PlaceOwnerClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "communityId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "description" VARCHAR(800),
    "address" VARCHAR(240) NOT NULL,
    "city" VARCHAR(100),
    "houma" VARCHAR(100),
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "phone" VARCHAR(40),
    "email" VARCHAR(160),
    "websiteUrl" TEXT,
    "photoUrl" TEXT,
    "status" "PlaceStatus" NOT NULL DEFAULT 'COMMUNITY_SUGGESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlaceOwnerClaim" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PlaceOwnerClaimStatus" NOT NULL DEFAULT 'PENDING',
    "businessName" VARCHAR(120),
    "contactName" VARCHAR(120),
    "contactPhone" VARCHAR(40),
    "contactEmail" VARCHAR(160),
    "note" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaceOwnerClaim_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlaceMenuItem" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "priceLabel" VARCHAR(40),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PlaceMenuItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FanHub" ADD COLUMN "placeId" TEXT;

CREATE UNIQUE INDEX "PlaceOwnerClaim_placeId_userId_key" ON "PlaceOwnerClaim"("placeId", "userId");
CREATE INDEX "Place_communityId_status_createdAt_idx" ON "Place"("communityId", "status", "createdAt");
CREATE INDEX "Place_createdByUserId_idx" ON "Place"("createdByUserId");
CREATE INDEX "Place_city_houma_idx" ON "Place"("city", "houma");
CREATE INDEX "Place_deletedAt_idx" ON "Place"("deletedAt");
CREATE INDEX "PlaceOwnerClaim_userId_status_idx" ON "PlaceOwnerClaim"("userId", "status");
CREATE INDEX "PlaceOwnerClaim_placeId_status_idx" ON "PlaceOwnerClaim"("placeId", "status");
CREATE INDEX "PlaceMenuItem_placeId_sortOrder_idx" ON "PlaceMenuItem"("placeId", "sortOrder");
CREATE INDEX "PlaceMenuItem_deletedAt_idx" ON "PlaceMenuItem"("deletedAt");
CREATE INDEX "FanHub_placeId_idx" ON "FanHub"("placeId");

ALTER TABLE "Place" ADD CONSTRAINT "Place_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Place" ADD CONSTRAINT "Place_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlaceOwnerClaim" ADD CONSTRAINT "PlaceOwnerClaim_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaceOwnerClaim" ADD CONSTRAINT "PlaceOwnerClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaceMenuItem" ADD CONSTRAINT "PlaceMenuItem_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FanHub" ADD CONSTRAINT "FanHub_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;
