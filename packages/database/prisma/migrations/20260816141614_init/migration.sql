-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CommunityVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "CommunityRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'BANNED', 'LEFT');

-- CreateEnum
CREATE TYPE "ThemeOverride" AS ENUM ('TELEGRAM', 'LIGHT', 'DARK');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MIXED');

-- CreateEnum
CREATE TYPE "PlayerPosition" AS ENUM ('GK', 'CB', 'FB', 'WB', 'DM', 'CM', 'AM', 'W', 'ST', 'ANY');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PLAY', 'WATCH');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PitchType" AS ENUM ('FIVE_A_SIDE', 'SEVEN_A_SIDE', 'ELEVEN_A_SIDE', 'FUTSAL', 'STREET', 'OTHER');

-- CreateEnum
CREATE TYPE "MatchFormat" AS ENUM ('FIVE_V_FIVE', 'SEVEN_V_SEVEN', 'ELEVEN_V_ELEVEN');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'WAITLISTED', 'CANCELLED', 'ATTENDED', 'NO_SHOW', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CashRsvpPolicy" AS ENUM ('CONFIRM_IMMEDIATELY', 'REQUIRE_CASH_CONFIRMATION');

-- CreateEnum
CREATE TYPE "RequestKind" AS ENUM ('PLAYER', 'POSITION', 'EQUIPMENT', 'HELP', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'PARTIAL', 'CLAIMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestClaimStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'FULFILLED');

-- CreateEnum
CREATE TYPE "RideOfferStatus" AS ENUM ('OPEN', 'FULL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RideRequestStatus" AS ENUM ('OPEN', 'MATCHED', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RideMatchStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CostSplitMode" AS ENUM ('FREE', 'FIXED');

-- CreateEnum
CREATE TYPE "FundPurpose" AS ENUM ('PITCH_FEES', 'EQUIPMENT', 'TRAVEL', 'TIFO', 'COMMUNITY', 'OTHER');

-- CreateEnum
CREATE TYPE "FundStatus" AS ENUM ('OPEN', 'FUNDED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('PLEDGED', 'AWAITING_PAYMENT', 'PAID', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TELEGRAM_STARS');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('EVENT_FEE', 'RIDE_SHARE', 'FUND_CONTRIBUTION', 'DIGITAL_PRODUCT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'AWAITING_PAYMENT', 'AWAITING_CASH', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('TELEGRAM');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');

-- CreateEnum
CREATE TYPE "DigitalProductSku" AS ENUM ('SUPPORTER_BADGE');

-- CreateEnum
CREATE TYPE "TeamSide" AS ENUM ('A', 'B');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramUserId" VARCHAR(32) NOT NULL,
    "username" VARCHAR(64),
    "firstName" VARCHAR(120),
    "lastName" VARCHAR(120),
    "photoUrl" TEXT,
    "languageCode" VARCHAR(16),
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerProfile" (
    "userId" TEXT NOT NULL,
    "skillLevel" "SkillLevel" NOT NULL DEFAULT 'MIXED',
    "skillRating" INTEGER NOT NULL DEFAULT 50,
    "preferredPositions" "PlayerPosition"[] DEFAULT ARRAY[]::"PlayerPosition"[],
    "favoriteClubId" TEXT,
    "bio" VARCHAR(280),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "userId" TEXT NOT NULL,
    "activeCommunityId" TEXT,
    "themeOverride" "ThemeOverride" NOT NULL DEFAULT 'TELEGRAM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "FootballClub" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "countryCode" VARCHAR(2),
    "logoUrl" TEXT,
    "externalReference" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FootballClub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(48) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" VARCHAR(280),
    "avatarUrl" TEXT,
    "coverUrl" TEXT,
    "city" VARCHAR(100),
    "visibility" "CommunityVisibility" NOT NULL DEFAULT 'PUBLIC',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CommunityRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityInvite" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "codeHash" VARCHAR(128) NOT NULL,
    "codePrefix" VARCHAR(12) NOT NULL,
    "role" "CommunityRole" NOT NULL DEFAULT 'MEMBER',
    "maxUses" INTEGER,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PUBLISHED',
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(1200),
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "timezone" VARCHAR(80) NOT NULL DEFAULT 'UTC',
    "venueName" VARCHAR(120),
    "address" VARCHAR(240),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "geoCell" VARCHAR(32),
    "capacity" INTEGER,
    "waitlistEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cashRsvpPolicy" "CashRsvpPolicy" NOT NULL DEFAULT 'CONFIRM_IMMEDIATELY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayEventDetails" (
    "eventId" TEXT NOT NULL,
    "pitchType" "PitchType" NOT NULL,
    "skillLevel" "SkillLevel" NOT NULL DEFAULT 'MIXED',
    "format" "MatchFormat" NOT NULL,
    "entryFeeMinor" BIGINT NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TND',
    "paymentRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayEventDetails_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "WatchEventDetails" (
    "eventId" TEXT NOT NULL,
    "homeClubId" TEXT,
    "awayClubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchEventDetails_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "EventRsvp" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RsvpStatus" NOT NULL DEFAULT 'CONFIRMED',
    "preferredPaymentMethod" "PaymentMethod",
    "waitlistSequence" BIGINT,
    "seatHoldExpiresAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "paymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "eventId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "kind" "RequestKind" NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "details" VARCHAR(800),
    "position" "PlayerPosition",
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestClaim" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "RequestClaimStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideOffer" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "eventId" TEXT,
    "driverUserId" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "originLabel" VARCHAR(180) NOT NULL,
    "originLatitude" DECIMAL(10,7) NOT NULL,
    "originLongitude" DECIMAL(10,7) NOT NULL,
    "originGeoCell" VARCHAR(32),
    "destinationLabel" VARCHAR(180) NOT NULL,
    "destinationLatitude" DECIMAL(10,7) NOT NULL,
    "destinationLongitude" DECIMAL(10,7) NOT NULL,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "seatsTotal" INTEGER NOT NULL,
    "costSplitMode" "CostSplitMode" NOT NULL DEFAULT 'FREE',
    "seatPriceMinor" BIGINT NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TND',
    "status" "RideOfferStatus" NOT NULL DEFAULT 'OPEN',
    "liveTrackingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "note" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RideOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideRequest" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "eventId" TEXT,
    "requesterUserId" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "pickupLabel" VARCHAR(180) NOT NULL,
    "pickupLatitude" DECIMAL(10,7) NOT NULL,
    "pickupLongitude" DECIMAL(10,7) NOT NULL,
    "pickupGeoCell" VARCHAR(32),
    "seatsNeeded" INTEGER NOT NULL,
    "desiredDepartureAt" TIMESTAMP(3) NOT NULL,
    "status" "RideRequestStatus" NOT NULL DEFAULT 'OPEN',
    "note" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RideRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideMatch" (
    "id" TEXT NOT NULL,
    "rideOfferId" TEXT NOT NULL,
    "rideRequestId" TEXT,
    "riderUserId" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "status" "RideMatchStatus" NOT NULL DEFAULT 'REQUESTED',
    "quotedShareMinor" BIGINT NOT NULL DEFAULT 0,
    "paymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RideMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideLocationPing" (
    "id" TEXT NOT NULL,
    "rideOfferId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "accuracyMeters" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "speedMetersPerSecond" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RideLocationPing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideRating" (
    "id" TEXT NOT NULL,
    "rideOfferId" TEXT NOT NULL,
    "raterUserId" TEXT NOT NULL,
    "rateeUserId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RideRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fundraiser" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "eventId" TEXT,
    "organizerUserId" TEXT NOT NULL,
    "purpose" "FundPurpose" NOT NULL,
    "status" "FundStatus" NOT NULL DEFAULT 'OPEN',
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(1000),
    "goalMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TND',
    "deadline" TIMESTAMP(3),
    "allowAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Fundraiser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundContribution" (
    "id" TEXT NOT NULL,
    "fundraiserId" TEXT NOT NULL,
    "contributorUserId" TEXT NOT NULL,
    "paymentIntentId" TEXT,
    "idempotencyKey" VARCHAR(180) NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "status" "ContributionStatus" NOT NULL DEFAULT 'PLEDGED',
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "message" VARCHAR(280),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "FundContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "communityId" TEXT,
    "purpose" "PaymentPurpose" NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(8) NOT NULL,
    "selectedMethod" "PaymentMethod",
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'CREATED',
    "idempotencyKey" VARCHAR(180) NOT NULL,
    "providerCheckoutId" VARCHAR(200),
    "providerPaymentId" VARCHAR(200),
    "providerAmountAtomic" VARCHAR(120),
    "providerCurrency" VARCHAR(16),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashSettlement" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "receivedByUserId" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(8) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voidedAt" TIMESTAMP(3),
    "voidedByUserId" TEXT,

    CONSTRAINT "CashSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramStarPayment" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "telegramPaymentChargeId" VARCHAR(200) NOT NULL,
    "providerPaymentChargeId" VARCHAR(200),
    "invoicePayload" VARCHAR(200) NOT NULL,
    "starsAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "TelegramStarPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerEventId" VARCHAR(200) NOT NULL,
    "payloadHash" VARCHAR(128) NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "failureReason" VARCHAR(500),

    CONSTRAINT "ProviderWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPaymentDefault" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPaymentDefault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPaymentMethod" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideOfferPaymentMethod" (
    "id" TEXT NOT NULL,
    "rideOfferId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RideOfferPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundraiserPaymentMethod" (
    "id" TEXT NOT NULL,
    "fundraiserId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundraiserPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalProduct" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "sku" "DigitalProductSku" NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "starsAmount" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalEntitlement" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "sku" "DigitalProductSku" NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "DigitalEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formation" (
    "id" TEXT NOT NULL,
    "playEventId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "format" "MatchFormat" NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormationSlot" (
    "id" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "userId" TEXT,
    "team" "TeamSide" NOT NULL,
    "position" "PlayerPosition" NOT NULL,
    "label" VARCHAR(32) NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "FormationSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FanHub" (
    "id" TEXT NOT NULL,
    "communityId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "venueName" VARCHAR(120) NOT NULL,
    "address" VARCHAR(240),
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "geoCell" VARCHAR(32),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FanHub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FanHubClub" (
    "fanHubId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,

    CONSTRAINT "FanHubClub_pkey" PRIMARY KEY ("fanHubId","clubId")
);

-- CreateTable
CREATE TABLE "VenueDeal" (
    "id" TEXT NOT NULL,
    "fanHubId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "eventId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "redemptionCode" VARCHAR(80),
    "requiresCheckIn" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VenueDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fanHubId" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventChatRoom" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventChatMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" VARCHAR(1200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EventChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "communityId" TEXT,
    "action" VARCHAR(80) NOT NULL,
    "entityType" VARCHAR(80) NOT NULL,
    "entityId" VARCHAR(120) NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "requestId" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "eventType" VARCHAR(120) NOT NULL,
    "aggregateType" VARCHAR(80) NOT NULL,
    "aggregateId" VARCHAR(120) NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" VARCHAR(1000),

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" VARCHAR(120) NOT NULL,
    "key" VARCHAR(180) NOT NULL,
    "requestHash" VARCHAR(128) NOT NULL,
    "responseCode" INTEGER,
    "responseJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramUserId_key" ON "User"("telegramUserId");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "PlayerProfile_skillLevel_skillRating_idx" ON "PlayerProfile"("skillLevel", "skillRating");

-- CreateIndex
CREATE INDEX "PlayerProfile_favoriteClubId_idx" ON "PlayerProfile"("favoriteClubId");

-- CreateIndex
CREATE INDEX "UserPreference_activeCommunityId_idx" ON "UserPreference"("activeCommunityId");

-- CreateIndex
CREATE UNIQUE INDEX "FootballClub_slug_key" ON "FootballClub"("slug");

-- CreateIndex
CREATE INDEX "FootballClub_countryCode_name_idx" ON "FootballClub"("countryCode", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Community_slug_key" ON "Community"("slug");

-- CreateIndex
CREATE INDEX "Community_createdByUserId_idx" ON "Community"("createdByUserId");

-- CreateIndex
CREATE INDEX "Community_visibility_createdAt_idx" ON "Community"("visibility", "createdAt");

-- CreateIndex
CREATE INDEX "Community_deletedAt_idx" ON "Community"("deletedAt");

-- CreateIndex
CREATE INDEX "Membership_userId_status_idx" ON "Membership"("userId", "status");

-- CreateIndex
CREATE INDEX "Membership_communityId_role_status_idx" ON "Membership"("communityId", "role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_communityId_userId_key" ON "Membership"("communityId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityInvite_codeHash_key" ON "CommunityInvite"("codeHash");

-- CreateIndex
CREATE INDEX "CommunityInvite_communityId_expiresAt_idx" ON "CommunityInvite"("communityId", "expiresAt");

-- CreateIndex
CREATE INDEX "CommunityInvite_createdByUserId_idx" ON "CommunityInvite"("createdByUserId");

-- CreateIndex
CREATE INDEX "Event_communityId_startsAt_id_idx" ON "Event"("communityId", "startsAt", "id");

-- CreateIndex
CREATE INDEX "Event_communityId_type_status_startsAt_idx" ON "Event"("communityId", "type", "status", "startsAt");

-- CreateIndex
CREATE INDEX "Event_createdByUserId_idx" ON "Event"("createdByUserId");

-- CreateIndex
CREATE INDEX "Event_geoCell_startsAt_idx" ON "Event"("geoCell", "startsAt");

-- CreateIndex
CREATE INDEX "Event_deletedAt_idx" ON "Event"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Event_id_communityId_key" ON "Event"("id", "communityId");

-- CreateIndex
CREATE INDEX "WatchEventDetails_homeClubId_idx" ON "WatchEventDetails"("homeClubId");

-- CreateIndex
CREATE INDEX "WatchEventDetails_awayClubId_idx" ON "WatchEventDetails"("awayClubId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRsvp_paymentIntentId_key" ON "EventRsvp"("paymentIntentId");

-- CreateIndex
CREATE INDEX "EventRsvp_eventId_status_waitlistSequence_idx" ON "EventRsvp"("eventId", "status", "waitlistSequence");

-- CreateIndex
CREATE INDEX "EventRsvp_userId_status_idx" ON "EventRsvp"("userId", "status");

-- CreateIndex
CREATE INDEX "EventRsvp_seatHoldExpiresAt_idx" ON "EventRsvp"("seatHoldExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventRsvp_eventId_userId_key" ON "EventRsvp"("eventId", "userId");

-- CreateIndex
CREATE INDEX "Request_communityId_status_expiresAt_idx" ON "Request"("communityId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "Request_eventId_status_expiresAt_idx" ON "Request"("eventId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "Request_createdByUserId_idx" ON "Request"("createdByUserId");

-- CreateIndex
CREATE INDEX "Request_kind_position_status_idx" ON "Request"("kind", "position", "status");

-- CreateIndex
CREATE INDEX "Request_deletedAt_idx" ON "Request"("deletedAt");

-- CreateIndex
CREATE INDEX "RequestClaim_requestId_status_idx" ON "RequestClaim"("requestId", "status");

-- CreateIndex
CREATE INDEX "RequestClaim_userId_status_idx" ON "RequestClaim"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RequestClaim_requestId_userId_key" ON "RequestClaim"("requestId", "userId");

-- CreateIndex
CREATE INDEX "RideOffer_communityId_status_departureAt_idx" ON "RideOffer"("communityId", "status", "departureAt");

-- CreateIndex
CREATE INDEX "RideOffer_eventId_status_departureAt_idx" ON "RideOffer"("eventId", "status", "departureAt");

-- CreateIndex
CREATE INDEX "RideOffer_driverUserId_idx" ON "RideOffer"("driverUserId");

-- CreateIndex
CREATE INDEX "RideOffer_originGeoCell_departureAt_idx" ON "RideOffer"("originGeoCell", "departureAt");

-- CreateIndex
CREATE INDEX "RideOffer_deletedAt_idx" ON "RideOffer"("deletedAt");

-- CreateIndex
CREATE INDEX "RideRequest_communityId_status_desiredDepartureAt_idx" ON "RideRequest"("communityId", "status", "desiredDepartureAt");

-- CreateIndex
CREATE INDEX "RideRequest_eventId_status_desiredDepartureAt_idx" ON "RideRequest"("eventId", "status", "desiredDepartureAt");

-- CreateIndex
CREATE INDEX "RideRequest_requesterUserId_idx" ON "RideRequest"("requesterUserId");

-- CreateIndex
CREATE INDEX "RideRequest_pickupGeoCell_desiredDepartureAt_idx" ON "RideRequest"("pickupGeoCell", "desiredDepartureAt");

-- CreateIndex
CREATE INDEX "RideRequest_deletedAt_idx" ON "RideRequest"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RideMatch_paymentIntentId_key" ON "RideMatch"("paymentIntentId");

-- CreateIndex
CREATE INDEX "RideMatch_rideOfferId_status_idx" ON "RideMatch"("rideOfferId", "status");

-- CreateIndex
CREATE INDEX "RideMatch_rideRequestId_status_idx" ON "RideMatch"("rideRequestId", "status");

-- CreateIndex
CREATE INDEX "RideMatch_riderUserId_idx" ON "RideMatch"("riderUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RideMatch_rideOfferId_riderUserId_key" ON "RideMatch"("rideOfferId", "riderUserId");

-- CreateIndex
CREATE INDEX "RideLocationPing_rideOfferId_capturedAt_idx" ON "RideLocationPing"("rideOfferId", "capturedAt");

-- CreateIndex
CREATE INDEX "RideLocationPing_userId_idx" ON "RideLocationPing"("userId");

-- CreateIndex
CREATE INDEX "RideLocationPing_expiresAt_idx" ON "RideLocationPing"("expiresAt");

-- CreateIndex
CREATE INDEX "RideRating_raterUserId_idx" ON "RideRating"("raterUserId");

-- CreateIndex
CREATE INDEX "RideRating_rateeUserId_createdAt_idx" ON "RideRating"("rateeUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RideRating_rideOfferId_raterUserId_rateeUserId_key" ON "RideRating"("rideOfferId", "raterUserId", "rateeUserId");

-- CreateIndex
CREATE INDEX "Fundraiser_communityId_status_createdAt_idx" ON "Fundraiser"("communityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Fundraiser_eventId_status_idx" ON "Fundraiser"("eventId", "status");

-- CreateIndex
CREATE INDEX "Fundraiser_organizerUserId_idx" ON "Fundraiser"("organizerUserId");

-- CreateIndex
CREATE INDEX "Fundraiser_deletedAt_idx" ON "Fundraiser"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FundContribution_paymentIntentId_key" ON "FundContribution"("paymentIntentId");

-- CreateIndex
CREATE INDEX "FundContribution_fundraiserId_status_createdAt_idx" ON "FundContribution"("fundraiserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "FundContribution_contributorUserId_createdAt_idx" ON "FundContribution"("contributorUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FundContribution_fundraiserId_contributorUserId_idempotency_key" ON "FundContribution"("fundraiserId", "contributorUserId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentIntent_userId_status_createdAt_idx" ON "PaymentIntent"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentIntent_communityId_purpose_status_createdAt_idx" ON "PaymentIntent"("communityId", "purpose", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentIntent_selectedMethod_status_createdAt_idx" ON "PaymentIntent"("selectedMethod", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_idempotencyKey_key" ON "PaymentAttempt"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentAttempt_paymentIntentId_status_createdAt_idx" ON "PaymentAttempt"("paymentIntentId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentAttempt_provider_providerPaymentId_idx" ON "PaymentAttempt"("provider", "providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "CashSettlement_paymentIntentId_key" ON "CashSettlement"("paymentIntentId");

-- CreateIndex
CREATE INDEX "CashSettlement_receivedByUserId_receivedAt_idx" ON "CashSettlement"("receivedByUserId", "receivedAt");

-- CreateIndex
CREATE INDEX "CashSettlement_voidedByUserId_idx" ON "CashSettlement"("voidedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramStarPayment_paymentIntentId_key" ON "TelegramStarPayment"("paymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramStarPayment_telegramPaymentChargeId_key" ON "TelegramStarPayment"("telegramPaymentChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramStarPayment_invoicePayload_key" ON "TelegramStarPayment"("invoicePayload");

-- CreateIndex
CREATE INDEX "ProviderWebhookEvent_provider_status_receivedAt_idx" ON "ProviderWebhookEvent"("provider", "status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderWebhookEvent_provider_providerEventId_key" ON "ProviderWebhookEvent"("provider", "providerEventId");

-- CreateIndex
CREATE INDEX "CommunityPaymentDefault_communityId_enabled_sortOrder_idx" ON "CommunityPaymentDefault"("communityId", "enabled", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityPaymentDefault_communityId_method_key" ON "CommunityPaymentDefault"("communityId", "method");

-- CreateIndex
CREATE INDEX "EventPaymentMethod_eventId_enabled_sortOrder_idx" ON "EventPaymentMethod"("eventId", "enabled", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "EventPaymentMethod_eventId_method_key" ON "EventPaymentMethod"("eventId", "method");

-- CreateIndex
CREATE INDEX "RideOfferPaymentMethod_rideOfferId_enabled_sortOrder_idx" ON "RideOfferPaymentMethod"("rideOfferId", "enabled", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "RideOfferPaymentMethod_rideOfferId_method_key" ON "RideOfferPaymentMethod"("rideOfferId", "method");

-- CreateIndex
CREATE INDEX "FundraiserPaymentMethod_fundraiserId_enabled_sortOrder_idx" ON "FundraiserPaymentMethod"("fundraiserId", "enabled", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "FundraiserPaymentMethod_fundraiserId_method_key" ON "FundraiserPaymentMethod"("fundraiserId", "method");

-- CreateIndex
CREATE INDEX "DigitalProduct_active_sku_idx" ON "DigitalProduct"("active", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalProduct_communityId_sku_key" ON "DigitalProduct"("communityId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalEntitlement_paymentIntentId_key" ON "DigitalEntitlement"("paymentIntentId");

-- CreateIndex
CREATE INDEX "DigitalEntitlement_userId_revokedAt_idx" ON "DigitalEntitlement"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "DigitalEntitlement_productId_idx" ON "DigitalEntitlement"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalEntitlement_communityId_userId_sku_key" ON "DigitalEntitlement"("communityId", "userId", "sku");

-- CreateIndex
CREATE INDEX "Formation_playEventId_updatedAt_idx" ON "Formation"("playEventId", "updatedAt");

-- CreateIndex
CREATE INDEX "Formation_createdByUserId_idx" ON "Formation"("createdByUserId");

-- CreateIndex
CREATE INDEX "Formation_deletedAt_idx" ON "Formation"("deletedAt");

-- CreateIndex
CREATE INDEX "FormationSlot_formationId_team_idx" ON "FormationSlot"("formationId", "team");

-- CreateIndex
CREATE INDEX "FormationSlot_userId_idx" ON "FormationSlot"("userId");

-- CreateIndex
CREATE INDEX "FanHub_communityId_verified_idx" ON "FanHub"("communityId", "verified");

-- CreateIndex
CREATE INDEX "FanHub_createdByUserId_idx" ON "FanHub"("createdByUserId");

-- CreateIndex
CREATE INDEX "FanHub_geoCell_idx" ON "FanHub"("geoCell");

-- CreateIndex
CREATE INDEX "FanHub_deletedAt_idx" ON "FanHub"("deletedAt");

-- CreateIndex
CREATE INDEX "FanHubClub_clubId_fanHubId_idx" ON "FanHubClub"("clubId", "fanHubId");

-- CreateIndex
CREATE INDEX "VenueDeal_fanHubId_startsAt_endsAt_idx" ON "VenueDeal"("fanHubId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "VenueDeal_communityId_eventId_idx" ON "VenueDeal"("communityId", "eventId");

-- CreateIndex
CREATE INDEX "VenueDeal_eventId_idx" ON "VenueDeal"("eventId");

-- CreateIndex
CREATE INDEX "VenueDeal_createdByUserId_idx" ON "VenueDeal"("createdByUserId");

-- CreateIndex
CREATE INDEX "VenueDeal_deletedAt_idx" ON "VenueDeal"("deletedAt");

-- CreateIndex
CREATE INDEX "CheckIn_eventId_createdAt_idx" ON "CheckIn"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "CheckIn_userId_idx" ON "CheckIn"("userId");

-- CreateIndex
CREATE INDEX "CheckIn_fanHubId_idx" ON "CheckIn"("fanHubId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_eventId_userId_key" ON "CheckIn"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventChatRoom_eventId_key" ON "EventChatRoom"("eventId");

-- CreateIndex
CREATE INDEX "EventChatRoom_closesAt_idx" ON "EventChatRoom"("closesAt");

-- CreateIndex
CREATE INDEX "EventChatMessage_roomId_createdAt_id_idx" ON "EventChatMessage"("roomId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "EventChatMessage_userId_idx" ON "EventChatMessage"("userId");

-- CreateIndex
CREATE INDEX "EventChatMessage_deletedAt_idx" ON "EventChatMessage"("deletedAt");

-- CreateIndex
CREATE INDEX "AuditLog_communityId_createdAt_id_idx" ON "AuditLog"("communityId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_publishedAt_createdAt_idx" ON "OutboxEvent"("publishedAt", "createdAt");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_userId_scope_key_key" ON "IdempotencyRecord"("userId", "scope", "key");

-- AddForeignKey
ALTER TABLE "PlayerProfile" ADD CONSTRAINT "PlayerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerProfile" ADD CONSTRAINT "PlayerProfile_favoriteClubId_fkey" FOREIGN KEY ("favoriteClubId") REFERENCES "FootballClub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_activeCommunityId_fkey" FOREIGN KEY ("activeCommunityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityInvite" ADD CONSTRAINT "CommunityInvite_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityInvite" ADD CONSTRAINT "CommunityInvite_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayEventDetails" ADD CONSTRAINT "PlayEventDetails_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchEventDetails" ADD CONSTRAINT "WatchEventDetails_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchEventDetails" ADD CONSTRAINT "WatchEventDetails_homeClubId_fkey" FOREIGN KEY ("homeClubId") REFERENCES "FootballClub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchEventDetails" ADD CONSTRAINT "WatchEventDetails_awayClubId_fkey" FOREIGN KEY ("awayClubId") REFERENCES "FootballClub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestClaim" ADD CONSTRAINT "RequestClaim_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestClaim" ADD CONSTRAINT "RequestClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideOffer" ADD CONSTRAINT "RideOffer_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideOffer" ADD CONSTRAINT "RideOffer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideOffer" ADD CONSTRAINT "RideOffer_driverUserId_fkey" FOREIGN KEY ("driverUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideRequest" ADD CONSTRAINT "RideRequest_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideRequest" ADD CONSTRAINT "RideRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideRequest" ADD CONSTRAINT "RideRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideMatch" ADD CONSTRAINT "RideMatch_rideOfferId_fkey" FOREIGN KEY ("rideOfferId") REFERENCES "RideOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideMatch" ADD CONSTRAINT "RideMatch_rideRequestId_fkey" FOREIGN KEY ("rideRequestId") REFERENCES "RideRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideMatch" ADD CONSTRAINT "RideMatch_riderUserId_fkey" FOREIGN KEY ("riderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideMatch" ADD CONSTRAINT "RideMatch_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideLocationPing" ADD CONSTRAINT "RideLocationPing_rideOfferId_fkey" FOREIGN KEY ("rideOfferId") REFERENCES "RideOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideLocationPing" ADD CONSTRAINT "RideLocationPing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideRating" ADD CONSTRAINT "RideRating_rideOfferId_fkey" FOREIGN KEY ("rideOfferId") REFERENCES "RideOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideRating" ADD CONSTRAINT "RideRating_raterUserId_fkey" FOREIGN KEY ("raterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideRating" ADD CONSTRAINT "RideRating_rateeUserId_fkey" FOREIGN KEY ("rateeUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fundraiser" ADD CONSTRAINT "Fundraiser_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fundraiser" ADD CONSTRAINT "Fundraiser_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fundraiser" ADD CONSTRAINT "Fundraiser_organizerUserId_fkey" FOREIGN KEY ("organizerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundContribution" ADD CONSTRAINT "FundContribution_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundContribution" ADD CONSTRAINT "FundContribution_contributorUserId_fkey" FOREIGN KEY ("contributorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundContribution" ADD CONSTRAINT "FundContribution_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashSettlement" ADD CONSTRAINT "CashSettlement_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashSettlement" ADD CONSTRAINT "CashSettlement_receivedByUserId_fkey" FOREIGN KEY ("receivedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashSettlement" ADD CONSTRAINT "CashSettlement_voidedByUserId_fkey" FOREIGN KEY ("voidedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramStarPayment" ADD CONSTRAINT "TelegramStarPayment_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPaymentDefault" ADD CONSTRAINT "CommunityPaymentDefault_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPaymentMethod" ADD CONSTRAINT "EventPaymentMethod_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideOfferPaymentMethod" ADD CONSTRAINT "RideOfferPaymentMethod_rideOfferId_fkey" FOREIGN KEY ("rideOfferId") REFERENCES "RideOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundraiserPaymentMethod" ADD CONSTRAINT "FundraiserPaymentMethod_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalProduct" ADD CONSTRAINT "DigitalProduct_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalEntitlement" ADD CONSTRAINT "DigitalEntitlement_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalEntitlement" ADD CONSTRAINT "DigitalEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalEntitlement" ADD CONSTRAINT "DigitalEntitlement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DigitalProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalEntitlement" ADD CONSTRAINT "DigitalEntitlement_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formation" ADD CONSTRAINT "Formation_playEventId_fkey" FOREIGN KEY ("playEventId") REFERENCES "PlayEventDetails"("eventId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formation" ADD CONSTRAINT "Formation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationSlot" ADD CONSTRAINT "FormationSlot_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormationSlot" ADD CONSTRAINT "FormationSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FanHub" ADD CONSTRAINT "FanHub_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FanHub" ADD CONSTRAINT "FanHub_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FanHubClub" ADD CONSTRAINT "FanHubClub_fanHubId_fkey" FOREIGN KEY ("fanHubId") REFERENCES "FanHub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FanHubClub" ADD CONSTRAINT "FanHubClub_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "FootballClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueDeal" ADD CONSTRAINT "VenueDeal_fanHubId_fkey" FOREIGN KEY ("fanHubId") REFERENCES "FanHub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueDeal" ADD CONSTRAINT "VenueDeal_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueDeal" ADD CONSTRAINT "VenueDeal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueDeal" ADD CONSTRAINT "VenueDeal_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_fanHubId_fkey" FOREIGN KEY ("fanHubId") REFERENCES "FanHub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventChatRoom" ADD CONSTRAINT "EventChatRoom_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventChatMessage" ADD CONSTRAINT "EventChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "EventChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventChatMessage" ADD CONSTRAINT "EventChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
