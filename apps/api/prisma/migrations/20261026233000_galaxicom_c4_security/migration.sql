-- GalaxiCom C4: additive, cross-replica rate budgets, durable notification outbox, appeals and privacy requests.
CREATE TABLE "ComRateBucket" (
 "key" VARCHAR(100) NOT NULL, "windowStart" TIMESTAMP(3) NOT NULL,
 "count" INTEGER NOT NULL DEFAULT 0, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ComRateBucket_pkey" PRIMARY KEY("key"));
CREATE INDEX "ComRateBucket_windowStart_idx" ON "ComRateBucket"("windowStart");
CREATE TABLE "ComNotificationFanout" (
 "postId" UUID NOT NULL, "threadId" UUID NOT NULL, "cursorUserId" TEXT,
 "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING', "lockedUntil" TIMESTAMP(3),
 "attempts" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ComNotificationFanout_pkey" PRIMARY KEY("postId"));
CREATE INDEX "ComNotificationFanout_status_lockedUntil_createdAt_idx" ON "ComNotificationFanout"("status","lockedUntil","createdAt");
ALTER TABLE "ComNotificationFanout" ADD CONSTRAINT "ComNotificationFanout_postId_fkey" FOREIGN KEY("postId") REFERENCES "ComPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComNotificationFanout" ADD CONSTRAINT "ComNotificationFanout_threadId_fkey" FOREIGN KEY("threadId") REFERENCES "ComThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "ComAppeal" (
 "id" UUID NOT NULL,"authorId" TEXT NOT NULL, "moderationActionId" UUID NOT NULL,
 "targetType" VARCHAR(12) NOT NULL,"targetId" UUID NOT NULL,"reason" VARCHAR(1000) NOT NULL,
 "status" VARCHAR(16) NOT NULL DEFAULT 'OPEN',"decisionReason" VARCHAR(1000),
 "reviewerId" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "reviewedAt" TIMESTAMP(3),CONSTRAINT "ComAppeal_pkey" PRIMARY KEY("id"));
CREATE UNIQUE INDEX "ComAppeal_authorId_moderationActionId_key" ON "ComAppeal"("authorId","moderationActionId");
CREATE INDEX "ComAppeal_status_createdAt_idx" ON "ComAppeal"("status","createdAt");
CREATE INDEX "ComAppeal_authorId_createdAt_idx" ON "ComAppeal"("authorId","createdAt");
ALTER TABLE "ComAppeal" ADD CONSTRAINT "ComAppeal_authorId_fkey" FOREIGN KEY("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComAppeal" ADD CONSTRAINT "ComAppeal_reviewerId_fkey" FOREIGN KEY("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComAppeal" ADD CONSTRAINT "ComAppeal_moderationActionId_fkey" FOREIGN KEY("moderationActionId") REFERENCES "ComModerationAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "ComPrivacyRequest" (
 "id" UUID NOT NULL, "userId" TEXT NOT NULL, "kind" VARCHAR(20) NOT NULL DEFAULT 'ERASE_FORUM',
 "status" VARCHAR(16) NOT NULL DEFAULT 'OPEN',"reason" VARCHAR(500), "reviewerId" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"reviewedAt" TIMESTAMP(3),
 CONSTRAINT "ComPrivacyRequest_pkey" PRIMARY KEY("id"));
CREATE INDEX "ComPrivacyRequest_status_createdAt_idx" ON "ComPrivacyRequest"("status","createdAt");
CREATE INDEX "ComPrivacyRequest_userId_createdAt_idx" ON "ComPrivacyRequest"("userId","createdAt");
ALTER TABLE "ComPrivacyRequest" ADD CONSTRAINT "ComPrivacyRequest_userId_fkey" FOREIGN KEY("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComPrivacyRequest" ADD CONSTRAINT "ComPrivacyRequest_reviewerId_fkey" FOREIGN KEY("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
