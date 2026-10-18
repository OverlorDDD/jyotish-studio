-- Additive migration: preserve every existing account/chart/order.
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE','PREMIUM');
ALTER TABLE "User" ADD COLUMN "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE';
ALTER TABLE "User" ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3);

CREATE TABLE "ReadingDraft" (
 "id" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "expiresAt" TIMESTAMP(3) NOT NULL,
 "customerId" TEXT NOT NULL,
 "topic" TEXT NOT NULL,
 "question" TEXT NOT NULL,
 "context" TEXT NOT NULL,
 "timeframe" VARCHAR(140),
 "consentAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "ReadingDraft_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ReadingDraft_customerId_createdAt_idx" ON "ReadingDraft"("customerId","createdAt");
CREATE INDEX "ReadingDraft_expiresAt_idx" ON "ReadingDraft"("expiresAt");
ALTER TABLE "ReadingDraft" ADD CONSTRAINT "ReadingDraft_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
