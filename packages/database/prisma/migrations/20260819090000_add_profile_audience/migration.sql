CREATE TYPE "ProfileAudience" AS ENUM ('SPECTATOR', 'FAN');

ALTER TABLE "PlayerProfile"
ADD COLUMN "profileAudience" "ProfileAudience" NOT NULL DEFAULT 'SPECTATOR';
