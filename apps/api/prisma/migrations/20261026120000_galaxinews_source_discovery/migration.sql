CREATE TABLE "NewsDiscoveredSource" (
 "domain" VARCHAR(200) NOT NULL,
 "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "lastTitle" VARCHAR(240),
 "articleCount" INTEGER NOT NULL DEFAULT 0,
 "status" VARCHAR(24) NOT NULL DEFAULT 'DISCOVERED',
 CONSTRAINT "NewsDiscoveredSource_pkey" PRIMARY KEY ("domain")
);
CREATE INDEX "NewsDiscoveredSource_lastSeenAt_idx" ON "NewsDiscoveredSource"("lastSeenAt");
CREATE INDEX "NewsDiscoveredSource_status_articleCount_idx" ON "NewsDiscoveredSource"("status","articleCount");
