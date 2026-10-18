-- Additive migration; no tables or existing accounts dropped.
ALTER TABLE "TarotReading" ADD COLUMN "aiTextUk" TEXT;
ALTER TABLE "TarotReading" ADD COLUMN "aiTextEn" TEXT;
CREATE TABLE "ExpertProfile" (
 "id" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "displayName" VARCHAR(90) NOT NULL,
 "bioUk" TEXT NOT NULL,
 "bioEn" TEXT NOT NULL,
 "isPublished" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ExpertProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExpertProfile_userId_key" ON "ExpertProfile"("userId");
CREATE INDEX "ExpertProfile_isPublished_idx" ON "ExpertProfile"("isPublished");
ALTER TABLE "ExpertProfile" ADD CONSTRAINT "ExpertProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "ExpertOffering" (
 "id" TEXT NOT NULL,
 "expertId" TEXT NOT NULL,
 "titleUk" VARCHAR(130) NOT NULL,
 "titleEn" VARCHAR(130) NOT NULL,
 "descriptionUk" TEXT NOT NULL,
 "descriptionEn" TEXT NOT NULL,
 "priceMinor" INTEGER NOT NULL,
 "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
 "deliveryDays" INTEGER NOT NULL DEFAULT 5,
 "isPublished" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ExpertOffering_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ExpertOffering_expertId_isPublished_idx" ON "ExpertOffering"("expertId","isPublished");
ALTER TABLE "ExpertOffering" ADD CONSTRAINT "ExpertOffering_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "ExpertProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
