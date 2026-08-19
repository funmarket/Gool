-- Platform moderation and publication approval foundation.
-- Watch Place and PitchListing remain separate business domains.

CREATE TYPE "AdminNotificationType" AS ENUM ('WATCH_PLACE_REVIEW', 'PITCH_LISTING_REVIEW', 'USER_MODERATION', 'COMMUNITY_MODERATION');
CREATE TYPE "AdminNotificationStatus" AS ENUM ('UNREAD', 'READ', 'RESOLVED');
CREATE TYPE "ModerationTargetType" AS ENUM ('USER', 'COMMUNITY');
CREATE TYPE "DisciplinaryCard" AS ENUM ('YELLOW', 'RED');
CREATE TYPE "ListingReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Watch approval is additive: Place remains the canonical Watch-place record and only
-- VERIFIED places are public. Every publication decision is represented by PlaceReview.
CREATE TABLE "PlaceReview" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "status" "ListingReviewStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "rejectionReason" VARCHAR(500),
    CONSTRAINT "PlaceReview_pkey" PRIMARY KEY ("id")
);

-- Required real-world Watch information is enforced before a Place can be VERIFIED.
ALTER TABLE "Place" ADD CONSTRAINT "Place_verified_fields_required_check" CHECK (
  "status" <> 'VERIFIED' OR (
    length(btrim("name")) > 0
    AND length(btrim("category")) > 0
    AND length(btrim("address")) > 0
    AND "city" IS NOT NULL AND length(btrim("city")) > 0
    AND "houma" IS NOT NULL AND length(btrim("houma")) > 0
    AND "phone" IS NOT NULL AND length(btrim("phone")) > 0
    AND "photoUrl" IS NOT NULL AND length(btrim("photoUrl")) > 0
  )
);

ALTER TABLE "PitchListing" ADD CONSTRAINT "PitchListing_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PitchListing" ADD CONSTRAINT "PitchListing_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Pitch drafts may be incomplete. Review/publication requires the mandatory real listing data.
ALTER TABLE "PitchListing" ADD CONSTRAINT "PitchListing_publishable_fields_required_check" CHECK (
  "status" NOT IN ('PENDING_REVIEW', 'PUBLISHED') OR (
    length(btrim("name")) > 0
    AND "photoUrl" IS NOT NULL AND length(btrim("photoUrl")) > 0
    AND "venueType" IS NOT NULL
    AND "city" IS NOT NULL AND length(btrim("city")) > 0
    AND "houma" IS NOT NULL AND length(btrim("houma")) > 0
    AND "fullAddress" IS NOT NULL AND length(btrim("fullAddress")) > 0
    AND "publicPhone" IS NOT NULL AND length(btrim("publicPhone")) > 0
    AND "hourlyRateMinor" IS NOT NULL AND "hourlyRateMinor" >= 0
    AND "currency" IS NOT NULL AND length(btrim("currency")) = 3
  )
);

CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "type" "AdminNotificationType" NOT NULL,
    "status" "AdminNotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "entityType" VARCHAR(64) NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "targetType" "ModerationTargetType" NOT NULL,
    "targetUserId" TEXT,
    "targetCommunityId" TEXT,
    "card" "DisciplinaryCard" NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "issuedByUserId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "escalatedFromActionId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,
    "revocationReason" VARCHAR(500),
    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ModerationAction_target_check" CHECK (
      ("targetType" = 'USER' AND "targetUserId" IS NOT NULL AND "targetCommunityId" IS NULL)
      OR ("targetType" = 'COMMUNITY' AND "targetCommunityId" IS NOT NULL AND "targetUserId" IS NULL)
    ),
    CONSTRAINT "ModerationAction_expiry_check" CHECK ("expiresAt" > "issuedAt")
);

CREATE INDEX "PlaceReview_placeId_status_submittedAt_idx" ON "PlaceReview"("placeId", "status", "submittedAt");
CREATE INDEX "PlaceReview_status_submittedAt_idx" ON "PlaceReview"("status", "submittedAt");
CREATE INDEX "PlaceReview_reviewedByUserId_idx" ON "PlaceReview"("reviewedByUserId");
CREATE UNIQUE INDEX "PlaceReview_one_pending_per_place_idx" ON "PlaceReview"("placeId") WHERE "status" = 'PENDING';
CREATE INDEX "AdminNotification_status_createdAt_idx" ON "AdminNotification"("status", "createdAt");
CREATE INDEX "AdminNotification_type_status_createdAt_idx" ON "AdminNotification"("type", "status", "createdAt");
CREATE INDEX "AdminNotification_entityType_entityId_idx" ON "AdminNotification"("entityType", "entityId");
CREATE INDEX "ModerationAction_targetUserId_issuedAt_idx" ON "ModerationAction"("targetUserId", "issuedAt");
CREATE INDEX "ModerationAction_targetCommunityId_issuedAt_idx" ON "ModerationAction"("targetCommunityId", "issuedAt");
CREATE INDEX "ModerationAction_card_expiresAt_revokedAt_idx" ON "ModerationAction"("card", "expiresAt", "revokedAt");
CREATE INDEX "ModerationAction_issuedByUserId_issuedAt_idx" ON "ModerationAction"("issuedByUserId", "issuedAt");

ALTER TABLE "PlaceReview" ADD CONSTRAINT "PlaceReview_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaceReview" ADD CONSTRAINT "PlaceReview_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlaceReview" ADD CONSTRAINT "PlaceReview_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminNotification" ADD CONSTRAINT "AdminNotification_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_targetCommunityId_fkey" FOREIGN KEY ("targetCommunityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_escalatedFromActionId_fkey" FOREIGN KEY ("escalatedFromActionId") REFERENCES "ModerationAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_revokedByUserId_fkey" FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Service invariants: Yellow = 7 days; second active Yellow for the same target escalates
-- atomically to Red; Red = 3-day suspension. AuditLog records every admin decision.
