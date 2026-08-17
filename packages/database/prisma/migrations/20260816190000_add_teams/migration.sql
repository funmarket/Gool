-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TeamChallengeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TeamGameStatus" AS ENUM ('SCHEDULING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TeamMatchFormat" AS ENUM ('FIVE_V_FIVE', 'SIX_V_SIX', 'SEVEN_V_SEVEN', 'EIGHT_V_EIGHT', 'NINE_V_NINE', 'ELEVEN_V_ELEVEN');

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "city" VARCHAR(100),
    "houma" VARCHAR(100),
    "badgeUrl" TEXT,
    "status" "TeamStatus" NOT NULL DEFAULT 'ACTIVE',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "acceptingChallenges" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPlayer" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" VARCHAR(120) NOT NULL,
    "shirtNumber" INTEGER,
    "position" "PlayerPosition",
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamLineup" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "formation" VARCHAR(32) NOT NULL,
    "matchFormat" "TeamMatchFormat" NOT NULL DEFAULT 'ELEVEN_V_ELEVEN',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TeamLineup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamLineupSlot" (
    "id" TEXT NOT NULL,
    "lineupId" TEXT NOT NULL,
    "playerId" TEXT,
    "role" "PlayerPosition" NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "isStarter" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeamLineupSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamChallenge" (
    "id" TEXT NOT NULL,
    "challengerTeamId" TEXT NOT NULL,
    "challengedTeamId" TEXT NOT NULL,
    "proposedByCommunityId" TEXT NOT NULL,
    "challengedCommunityId" TEXT NOT NULL,
    "status" "TeamChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "proposedStartsAt" TIMESTAMP(3),
    "proposedVenue" VARCHAR(160),
    "proposedFormat" "TeamMatchFormat",
    "message" VARCHAR(500),
    "acceptedByUserId" TEXT,
    "declinedByUserId" TEXT,
    "cancelledByUserId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamChallengeMessage" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TeamChallengeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamGame" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "status" "TeamGameStatus" NOT NULL DEFAULT 'SCHEDULING',
    "scheduledAt" TIMESTAMP(3),
    "venueName" VARCHAR(160),
    "matchFormat" "TeamMatchFormat",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_communityId_key" ON "Team"("communityId");

-- CreateIndex
CREATE INDEX "Team_status_isPublic_acceptingChallenges_createdAt_idx" ON "Team"("status", "isPublic", "acceptingChallenges", "createdAt");

-- CreateIndex
CREATE INDEX "Team_city_houma_idx" ON "Team"("city", "houma");

-- CreateIndex
CREATE INDEX "Team_createdByUserId_idx" ON "Team"("createdByUserId");

-- CreateIndex
CREATE INDEX "Team_deletedAt_idx" ON "Team"("deletedAt");

-- CreateIndex
CREATE INDEX "TeamPlayer_teamId_isActive_idx" ON "TeamPlayer"("teamId", "isActive");

-- CreateIndex
CREATE INDEX "TeamPlayer_userId_idx" ON "TeamPlayer"("userId");

-- CreateIndex
CREATE INDEX "TeamLineup_teamId_isCurrent_isPublished_idx" ON "TeamLineup"("teamId", "isCurrent", "isPublished");

-- CreateIndex
CREATE INDEX "TeamLineup_createdByUserId_idx" ON "TeamLineup"("createdByUserId");

-- CreateIndex
CREATE INDEX "TeamLineup_deletedAt_idx" ON "TeamLineup"("deletedAt");

-- CreateIndex
CREATE INDEX "TeamLineupSlot_lineupId_isStarter_sortOrder_idx" ON "TeamLineupSlot"("lineupId", "isStarter", "sortOrder");

-- CreateIndex
CREATE INDEX "TeamLineupSlot_playerId_idx" ON "TeamLineupSlot"("playerId");

-- CreateIndex
CREATE INDEX "TeamChallenge_challengerTeamId_status_createdAt_idx" ON "TeamChallenge"("challengerTeamId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TeamChallenge_challengedTeamId_status_createdAt_idx" ON "TeamChallenge"("challengedTeamId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TeamChallenge_proposedByCommunityId_status_createdAt_idx" ON "TeamChallenge"("proposedByCommunityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TeamChallenge_challengedCommunityId_status_createdAt_idx" ON "TeamChallenge"("challengedCommunityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TeamChallenge_expiresAt_idx" ON "TeamChallenge"("expiresAt");

-- CreateIndex
-- Prisma cannot express a partial expression index; this enforces one pending
-- challenge per unordered team pair at the database boundary.
CREATE UNIQUE INDEX "TeamChallenge_pending_pair_key" ON "TeamChallenge"(
  LEAST("challengerTeamId", "challengedTeamId"),
  GREATEST("challengerTeamId", "challengedTeamId")
) WHERE "status" = 'PENDING';

-- CreateIndex
CREATE INDEX "TeamChallengeMessage_challengeId_createdAt_id_idx" ON "TeamChallengeMessage"("challengeId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "TeamChallengeMessage_teamId_createdAt_idx" ON "TeamChallengeMessage"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "TeamChallengeMessage_userId_idx" ON "TeamChallengeMessage"("userId");

-- CreateIndex
CREATE INDEX "TeamChallengeMessage_deletedAt_idx" ON "TeamChallengeMessage"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamGame_challengeId_key" ON "TeamGame"("challengeId");

-- CreateIndex
CREATE INDEX "TeamGame_status_scheduledAt_id_idx" ON "TeamGame"("status", "scheduledAt", "id");

-- CreateIndex
CREATE INDEX "TeamGame_homeTeamId_scheduledAt_idx" ON "TeamGame"("homeTeamId", "scheduledAt");

-- CreateIndex
CREATE INDEX "TeamGame_awayTeamId_scheduledAt_idx" ON "TeamGame"("awayTeamId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLineup" ADD CONSTRAINT "TeamLineup_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLineup" ADD CONSTRAINT "TeamLineup_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLineupSlot" ADD CONSTRAINT "TeamLineupSlot_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "TeamLineup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLineupSlot" ADD CONSTRAINT "TeamLineupSlot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "TeamPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChallenge" ADD CONSTRAINT "TeamChallenge_challengerTeamId_fkey" FOREIGN KEY ("challengerTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChallenge" ADD CONSTRAINT "TeamChallenge_challengedTeamId_fkey" FOREIGN KEY ("challengedTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChallenge" ADD CONSTRAINT "TeamChallenge_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChallenge" ADD CONSTRAINT "TeamChallenge_declinedByUserId_fkey" FOREIGN KEY ("declinedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChallenge" ADD CONSTRAINT "TeamChallenge_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChallenge" ADD CONSTRAINT "TeamChallenge_proposedByCommunityId_fkey" FOREIGN KEY ("proposedByCommunityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChallenge" ADD CONSTRAINT "TeamChallenge_challengedCommunityId_fkey" FOREIGN KEY ("challengedCommunityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChallengeMessage" ADD CONSTRAINT "TeamChallengeMessage_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "TeamChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChallengeMessage" ADD CONSTRAINT "TeamChallengeMessage_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChallengeMessage" ADD CONSTRAINT "TeamChallengeMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGame" ADD CONSTRAINT "TeamGame_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "TeamChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGame" ADD CONSTRAINT "TeamGame_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGame" ADD CONSTRAINT "TeamGame_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

