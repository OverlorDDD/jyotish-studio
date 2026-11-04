-- GalaxiCom C2. Additive; preserve all existing forum data, private records and reports.
ALTER TABLE "ComThread" ALTER COLUMN "title" TYPE TEXT;
CREATE TABLE "ComHelpfulReaction" (
 "userId" TEXT NOT NULL,"postId" UUID NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ComHelpfulReaction_pkey" PRIMARY KEY ("userId","postId")
);
CREATE TABLE "ComFollow" (
 "userId" TEXT NOT NULL,"threadId" UUID NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ComFollow_pkey" PRIMARY KEY ("userId","threadId")
);
CREATE TABLE "ComNotification" (
 "id" UUID NOT NULL,"userId" TEXT NOT NULL,"threadId" UUID NOT NULL,"postId" UUID NOT NULL,
 "kind" VARCHAR(16) NOT NULL DEFAULT 'REPLY', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "readAt" TIMESTAMP(3),
 CONSTRAINT "ComNotification_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ComThreadRevision" (
 "id" UUID NOT NULL,"threadId" UUID NOT NULL,"title" TEXT NOT NULL,"body" TEXT NOT NULL,
 "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ComThreadRevision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ComPostRevision" (
 "id" UUID NOT NULL,"postId" UUID NOT NULL,"body" TEXT NOT NULL,
 "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ComPostRevision_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ComHelpfulReaction_postId_idx" ON "ComHelpfulReaction"("postId");
CREATE INDEX "ComFollow_threadId_idx" ON "ComFollow"("threadId");
CREATE UNIQUE INDEX "ComNotification_userId_postId_kind_key" ON "ComNotification"("userId","postId","kind");
CREATE INDEX "ComNotification_userId_readAt_createdAt_idx" ON "ComNotification"("userId","readAt","createdAt");
CREATE INDEX "ComThreadRevision_threadId_editedAt_idx" ON "ComThreadRevision"("threadId","editedAt");
CREATE INDEX "ComPostRevision_postId_editedAt_idx" ON "ComPostRevision"("postId","editedAt");
ALTER TABLE "ComHelpfulReaction" ADD CONSTRAINT "ComHelpfulReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComHelpfulReaction" ADD CONSTRAINT "ComHelpfulReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ComPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComFollow" ADD CONSTRAINT "ComFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComFollow" ADD CONSTRAINT "ComFollow_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ComThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComNotification" ADD CONSTRAINT "ComNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComNotification" ADD CONSTRAINT "ComNotification_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ComThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComNotification" ADD CONSTRAINT "ComNotification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ComPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComThreadRevision" ADD CONSTRAINT "ComThreadRevision_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ComThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComPostRevision" ADD CONSTRAINT "ComPostRevision_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ComPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
