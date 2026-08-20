CREATE TYPE "ProfileIdentityType" AS ENUM ('PLAYER', 'FAN', 'GAMER', 'GHOST_RIDER');

ALTER TABLE "PlayerProfile"
ADD COLUMN "profileIdentityTypes" "ProfileIdentityType"[] NOT NULL DEFAULT ARRAY['GHOST_RIDER']::"ProfileIdentityType"[],
ADD COLUMN "footballPersonaKey" VARCHAR(80);

UPDATE "PlayerProfile"
SET "profileIdentityTypes" = CASE
  WHEN "profileAudience" = 'FAN'::"ProfileAudience"
    THEN ARRAY['FAN']::"ProfileIdentityType"[]
  ELSE ARRAY['GHOST_RIDER']::"ProfileIdentityType"[]
END;

ALTER TABLE "PlayerProfile"
DROP COLUMN "profileAudience";

DROP TYPE "ProfileAudience";
