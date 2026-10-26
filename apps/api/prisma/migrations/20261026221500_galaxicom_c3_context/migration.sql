-- GalaxiCom C3: only approved connections from already-public Academy/Practice content to public forum topics.
CREATE TABLE "ComContextLink" (
 "id" UUID NOT NULL,
 "sourceKind" VARCHAR(16) NOT NULL,
 "sourceSlug" VARCHAR(80) NOT NULL,
 "threadId" UUID NOT NULL,
 "approvedById" TEXT,
 "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ComContextLink_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "ComContextLink_allowed_public_source" CHECK ("sourceKind" IN ('ACADEMY','YOGA'))
);
CREATE UNIQUE INDEX "ComContextLink_sourceKind_sourceSlug_threadId_key"
 ON "ComContextLink"("sourceKind","sourceSlug","threadId");
CREATE INDEX "ComContextLink_sourceKind_sourceSlug_approvedAt_idx"
 ON "ComContextLink"("sourceKind","sourceSlug","approvedAt");
CREATE INDEX "ComContextLink_threadId_idx" ON "ComContextLink"("threadId");
ALTER TABLE "ComContextLink" ADD CONSTRAINT "ComContextLink_threadId_fkey"
 FOREIGN KEY ("threadId") REFERENCES "ComThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComContextLink" ADD CONSTRAINT "ComContextLink_approvedById_fkey"
 FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
