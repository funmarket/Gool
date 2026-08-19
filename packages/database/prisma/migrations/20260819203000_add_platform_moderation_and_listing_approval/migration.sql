-- Platform moderation and publication approval foundation.
-- Watch Place and PitchListing remain separate business domains.
-- Platform Admin is the only authority expected to transition listings to public states.

CREATE TYPE "AdminNotificationType" AS ENUM (
    'WATCH_PLACE_REVIEW',
    'PITCH_LISTING_REVIEW',
    'USER_MODERATION',
    'COMMUNITY_MODERATION'
);

CREATE TYPE "AdminNotificationStatus" AS ENUM ('UNREAD', 'READ', 'RESOLVED');

CREATE TYPE "ModerationTargetType" AS ENUM ('USER', 'COMMUNITY');

CREATE TYPE "DisciplinaryCard" AS ENUM ('YELLOW', 'RED');

ALTER TYPE "PlaceStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';
ALTER TYPE "PlaceStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "Place"
    ADD COLUMN "submittedAt" TIMESTAMP(3),
    ADD COLUMN "reviewedAt" TIMESTAMP(3),
    ADD COLUMN "reviewedByUserId" TEXT,
    ADD COLUMN "rejectionReason" VARCHAR(500),
    ADD COLUMN "publishedAt" TIMESTAMP(3);

ALTER TABLE "Place" ALTER COLUMN "status" SET DEFAULT 'PENDING_REVIEW';

ALTER TABLE "Place"
    ADD CONSTRAINT "Place_reviewedByUserId_fkey"
    FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- A Watch Place may exist as a draft/rejected record while incomplete, but it may not
-- enter review or become public without the required real-world listing information.
ALTER TABLE "Place"
    ADD CONSTRAINT "Place_publishable_fields_required_check"
    CHECK (
      "status" NOT IN ('PENDING_REVIEW', 'VERIFIED')
      OR (
        length(btrim("name")) > 0
        AND length(btrim("category")) > 0
        AND length(btrim("address")) > 0
        AND "city" IS NOT NULL AND length(btrim("city")) > 0
        AND "houma" IS NOT NULL AND length(btrim("houma")) > 0
        AND "phone" IS NOT NULL AND length(btrim("phone")) > 0
        AND "photoUrl" IS NOT NULL AND length(btrim("photoUrl")) > 0
        AND "latitude" IS NOT NULL
        AND "longitude" IS NOT NULL
      )
    );

ALTER TABLE "PitchListing"
    ADD CONSTRAINT "PitchListing_ownerUserId_fkey"
    FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PitchListing"
    ADD CONSTRAINT "PitchListing_reviewedByUserId_fkey"
    FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Pitch drafts may be incomplete. Submission for review and publication require the
-- real venue identity, photo, location/address, phone, venue type and price.
ALTER TABLE "PitchListing"
    ADD CONSTRAINT "PitchListing_publishable_fields_required_check"
    CHECK (
      "status" NOT IN ('PENDING_REVIEW', 'PUBLISHED')
      OR (
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
      OR
      ("targetType" = 'COMMUNITY' AND "targetCommunityId" IS NOT NULL AND "targetUserId" IS NULL)
    ),
    CONSTRAINT "ModerationAction_expiry_check" CHECK ("expiresAt" > "issuedAt")
);

CREATE INDEX "Place_status_submittedAt_idx" ON "Place"("status", "submittedAt");
CREATE INDEX "Place_reviewedByUserId_idx" ON "Place"("reviewedByUserId");

CREATE INDEX "AdminNotification_status_createdAt_idx"
    ON "AdminNotification"("status", "createdAt");
CREATE INDEX "AdminNotification_type_status_createdAt_idx"
    ON "AdminNotification"("type", "status", "createdAt");
CREATE INDEX "AdminNotification_entityType_entityId_idx"
    ON "AdminNotification"("entityType", "entityId");

CREATE INDEX "ModerationAction_targetUserId_issuedAt_idx"
    ON "ModerationAction"("targetUserId", "issuedAt");
CREATE INDEX "ModerationAction_targetCommunityId_issuedAt_idx"
    ON "ModerationAction"("targetCommunityId", "issuedAt");
CREATE INDEX "ModerationAction_card_expiresAt_revokedAt_idx"
    ON "ModerationAction"("card", "expiresAt", "revokedAt");
CREATE INDEX "ModerationAction_issuedByUserId_issuedAt_idx"
    ON "ModerationAction"("issuedByUserId", "issuedAt");

ALTER TABLE "AdminNotification"
    ADD CONSTRAINT "AdminNotification_resolvedByUserId_fkey"
    FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ModerationAction"
    ADD CONSTRAINT "ModerationAction_targetUserId_fkey"
    FOREIGN KEY ("targetUserId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModerationAction"
    ADD CONSTRAINT "ModerationAction_targetCommunityId_fkey"
    FOREIGN KEY ("targetCommunityId") REFERENCES "Community"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModerationAction"
    ADD CONSTRAINT "ModerationAction_issuedByUserId_fkey"
    FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ModerationAction"
    ADD CONSTRAINT "ModerationAction_escalatedFromActionId_fkey"
    FOREIGN KEY ("escalatedFromActionId") REFERENCES "ModerationAction"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ModerationAction"
    ADD CONSTRAINT "ModerationAction_revokedByUserId_fkey"
    FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Application invariants enforced by the moderation service:
-- * Yellow card expires exactly 7 days after issuance.
-- * A second active Yellow for the same target escalates atomically to Red.
-- * Red card expires exactly 3 days after issuance and is the active suspension window.
-- These time calculations require transactional application logic; the DB stores and
-- indexes the authoritative history and active expiry state.
