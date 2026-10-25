-- Additive News v1.1; originals/other module data preserved.
ALTER TABLE "NewsArticle" ADD COLUMN "summary" VARCHAR(500);
ALTER TABLE "NewsArticle" ADD COLUMN "summaryKind" VARCHAR(32) NOT NULL DEFAULT 'title_context';
ALTER TABLE "NewsArticle" ADD COLUMN "summaryUk" VARCHAR(700);
ALTER TABLE "NewsArticle" ADD COLUMN "summaryEn" VARCHAR(700);
ALTER TABLE "NewsArticle" ADD COLUMN "publishedAccuracy" VARCHAR(16) NOT NULL DEFAULT 'published';
CREATE TABLE "NewsSourceScan" (
 "id" TEXT NOT NULL, "sourceKey" VARCHAR(128) NOT NULL,
 "scanToken" VARCHAR(64) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "status" VARCHAR(24) NOT NULL, "candidates" INTEGER NOT NULL DEFAULT 0,
 "accepted" INTEGER NOT NULL DEFAULT 0, "duplicates" INTEGER NOT NULL DEFAULT 0,
 "rejected" INTEGER NOT NULL DEFAULT 0, "errors" INTEGER NOT NULL DEFAULT 0,
 "rejectionReasons" JSONB, "failure" VARCHAR(300), "durationMs" INTEGER NOT NULL DEFAULT 0,
 CONSTRAINT "NewsSourceScan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NewsSourceScan_createdAt_idx" ON "NewsSourceScan"("createdAt");
CREATE INDEX "NewsSourceScan_sourceKey_createdAt_idx" ON "NewsSourceScan"("sourceKey","createdAt");
