CREATE TYPE "ProfileIdentityType" AS ENUM ('PLAYER', 'FAN', 'GAMER');

CREATE TABLE "UserProfileIdentity" (
    "userId" TEXT NOT NULL,
    "type" "ProfileIdentityType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfileIdentity_pkey" PRIMARY KEY ("userId", "type")
);

CREATE INDEX "UserProfileIdentity_type_userId_idx"
ON "UserProfileIdentity"("type", "userId");

ALTER TABLE "UserProfileIdentity"
ADD CONSTRAINT "UserProfileIdentity_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "UserProfileIdentity" ("userId", "type")
SELECT "userId", 'FAN'::"ProfileIdentityType"
FROM "PlayerProfile"
WHERE "profileAudience" = 'FAN'
ON CONFLICT ("userId", "type") DO NOTHING;
