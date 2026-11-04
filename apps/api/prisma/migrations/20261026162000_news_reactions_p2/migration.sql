-- P2 Personal Interests: optional owner-scoped article reactions, additive and reversible.
CREATE TABLE "NewsReaction" (
  "userId" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "vote" VARCHAR(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NewsReaction_pkey" PRIMARY KEY ("userId","articleId"),
  CONSTRAINT "NewsReaction_vote_check" CHECK ("vote" IN ('YES','NO'))
);
CREATE INDEX "NewsReaction_userId_updatedAt_idx" ON "NewsReaction"("userId","updatedAt");
CREATE INDEX "NewsReaction_articleId_idx" ON "NewsReaction"("articleId");
ALTER TABLE "NewsReaction" ADD CONSTRAINT "NewsReaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsReaction" ADD CONSTRAINT "NewsReaction_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "NewsArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
