ALTER TABLE "WatchEventDetails" ADD COLUMN "fanHubId" TEXT;

CREATE INDEX "WatchEventDetails_fanHubId_idx" ON "WatchEventDetails"("fanHubId");

ALTER TABLE "WatchEventDetails"
ADD CONSTRAINT "WatchEventDetails_fanHubId_fkey"
FOREIGN KEY ("fanHubId") REFERENCES "FanHub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "WatchEventDetails" AS wed
SET "fanHubId" = fh."id"
FROM "Event" AS e
JOIN "FanHub" AS fh
  ON fh."deletedAt" IS NULL
 AND fh."communityId" = e."communityId"
 AND fh."venueName" = e."venueName"
WHERE wed."eventId" = e."id"
  AND e."type" = 'WATCH'
  AND wed."fanHubId" IS NULL;

UPDATE "Event" AS e
SET
  "latitude" = COALESCE(e."latitude", fh."latitude"),
  "longitude" = COALESCE(e."longitude", fh."longitude"),
  "venueName" = COALESCE(e."venueName", fh."venueName"),
  "address" = COALESCE(e."address", fh."address")
FROM "WatchEventDetails" AS wed
JOIN "FanHub" AS fh
  ON fh."id" = wed."fanHubId"
WHERE e."id" = wed."eventId"
  AND e."type" = 'WATCH';
