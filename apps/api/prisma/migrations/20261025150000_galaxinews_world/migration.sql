-- Additive News World storage; existing accounts, charts and reports remain untouched.
CREATE TABLE "NewsArticle" (
 "id" TEXT NOT NULL,"urlHash" TEXT NOT NULL,"url" TEXT NOT NULL,"title" TEXT NOT NULL,
 "source" TEXT NOT NULL,"language" TEXT NOT NULL,"topic" TEXT NOT NULL,
 "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],"score" DOUBLE PRECISION NOT NULL DEFAULT 0,
 "status" TEXT NOT NULL DEFAULT 'PUBLISHED',"publishedAt" TIMESTAMP(3) NOT NULL,
 "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NewsArticle_urlHash_key" ON "NewsArticle"("urlHash");
CREATE INDEX "NewsArticle_status_publishedAt_idx" ON "NewsArticle"("status","publishedAt");
CREATE INDEX "NewsArticle_topic_publishedAt_idx" ON "NewsArticle"("topic","publishedAt");
CREATE TABLE "NewsScan" (
 "id" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "sources" INTEGER NOT NULL,"accepted" INTEGER NOT NULL,"errors" INTEGER NOT NULL,
 CONSTRAINT "NewsScan_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NewsIngestionLease" (
 "id" TEXT NOT NULL,"token" TEXT NOT NULL,"expiresAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "NewsIngestionLease_pkey" PRIMARY KEY ("id")
);
