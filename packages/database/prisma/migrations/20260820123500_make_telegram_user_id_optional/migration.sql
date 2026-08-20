-- Existing Telegram users keep their current identifier.
-- New canonical HOOMA users may be created without Telegram and linked later.
ALTER TABLE "User" ALTER COLUMN "telegramUserId" DROP NOT NULL;
