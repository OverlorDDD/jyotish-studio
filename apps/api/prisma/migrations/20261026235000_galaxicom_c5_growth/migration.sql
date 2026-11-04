-- C5: private saved discussions and bounded public profile appearance.
ALTER TABLE "ComProfile" ADD COLUMN "signature" VARCHAR(280);
ALTER TABLE "ComProfile" ADD COLUMN "accent" VARCHAR(20) NOT NULL DEFAULT 'default';
CREATE TABLE "ComBookmark"(
 "userId" TEXT NOT NULL,"threadId" UUID NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ComBookmark_pkey" PRIMARY KEY ("userId","threadId")
);
CREATE INDEX "ComBookmark_userId_createdAt_idx" ON "ComBookmark"("userId","createdAt");
ALTER TABLE "ComBookmark" ADD CONSTRAINT "ComBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComBookmark" ADD CONSTRAINT "ComBookmark_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ComThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
