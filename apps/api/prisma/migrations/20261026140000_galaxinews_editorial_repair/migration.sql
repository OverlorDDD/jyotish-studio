-- Additive recovery bookkeeping for earlier articles; no user content removed.
ALTER TABLE "NewsArticle" ADD COLUMN "editorialAttemptedAt" TIMESTAMP(3);
ALTER TABLE "NewsArticle" ADD COLUMN "editorialNextAttemptAt" TIMESTAMP(3);
ALTER TABLE "NewsArticle" ADD COLUMN "editorialAttempts" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "NewsArticle_editorialNextAttemptAt_idx" ON "NewsArticle"("editorialNextAttemptAt");
