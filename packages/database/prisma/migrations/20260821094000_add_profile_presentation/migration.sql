CREATE TABLE "UserProfilePresentation" (
    "userId" TEXT NOT NULL,
    "displayName" VARCHAR(120),
    "username" VARCHAR(64),
    "displayUsername" VARCHAR(64),
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfilePresentation_pkey" PRIMARY KEY ("userId")
);

CREATE UNIQUE INDEX "UserProfilePresentation_username_key"
ON "UserProfilePresentation"("username");

CREATE INDEX "UserProfilePresentation_username_idx"
ON "UserProfilePresentation"("username");

ALTER TABLE "UserProfilePresentation"
ADD CONSTRAINT "UserProfilePresentation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
