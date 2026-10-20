-- A6 additive editorial CMS; existing charts, users and Tarot readings remain untouched.
CREATE TYPE "EditorialKind" AS ENUM ('ACADEMY','YOGA');
CREATE TYPE "EditorialStatus" AS ENUM ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED');
CREATE TABLE "EditorialEntry" (
 "id" TEXT NOT NULL,
 "kind" "EditorialKind" NOT NULL,
 "slug" VARCHAR(80) NOT NULL,
 "topic" VARCHAR(30) NOT NULL,
 "status" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
 "revision" INTEGER NOT NULL DEFAULT 1,
 "document" JSONB NOT NULL,
 "creatorId" TEXT NOT NULL,
 "publishedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "EditorialEntry_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "EditorialEntry_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "EditorialVersion" (
 "id" TEXT NOT NULL,
 "entryId" TEXT NOT NULL,
 "revision" INTEGER NOT NULL,
 "action" VARCHAR(30) NOT NULL,
 "actorId" TEXT NOT NULL,
 "snapshot" JSONB NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "EditorialVersion_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "EditorialVersion_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "EditorialEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EditorialEntry_kind_slug_key" ON "EditorialEntry"("kind","slug");
CREATE INDEX "EditorialEntry_kind_status_publishedAt_idx" ON "EditorialEntry"("kind","status","publishedAt");
CREATE INDEX "EditorialEntry_createdAt_idx" ON "EditorialEntry"("createdAt");
CREATE UNIQUE INDEX "EditorialVersion_entryId_revision_key" ON "EditorialVersion"("entryId","revision");
CREATE INDEX "EditorialVersion_entryId_createdAt_idx" ON "EditorialVersion"("entryId","createdAt");
