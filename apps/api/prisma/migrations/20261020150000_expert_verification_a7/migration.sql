CREATE TYPE "ExpertReviewStatus" AS ENUM ('SUBMITTED','VERIFIED','REJECTED','SUSPENDED');
CREATE TABLE "ExpertProfile"(
 "id" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "displayName" VARCHAR(100) NOT NULL,
 "bioUk" TEXT NOT NULL,
 "bioEn" TEXT NOT NULL,
 "specialties" TEXT[] NOT NULL,
 "reviewStatus" "ExpertReviewStatus" NOT NULL DEFAULT 'SUBMITTED',
 "consentAt" TIMESTAMP(3) NOT NULL,
 "reviewedAt" TIMESTAMP(3),
 "reviewerId" TEXT,
 "revision" INTEGER NOT NULL DEFAULT 1,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "ExpertProfile_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "ExpertProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ExpertProfile_userId_key" ON "ExpertProfile"("userId");
CREATE INDEX "ExpertProfile_reviewStatus_updatedAt_idx" ON "ExpertProfile"("reviewStatus","updatedAt");
