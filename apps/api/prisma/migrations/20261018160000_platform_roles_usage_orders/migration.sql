-- Additive upgrade: existing user accounts and saved charts are preserved.
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'EXPERT', 'SUPPORT', 'ADMIN');
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'MEMBER';

CREATE TYPE "ReadingOrderStatus" AS ENUM ('AWAITING_PAYMENT','PAID','BRIEF_SUBMITTED','ASSIGNED','IN_PROGRESS','VIDEO_READY','COMPLETED','CANCELLED','REFUNDED');
CREATE TABLE "ReadingOrder" (
 "id" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 "customerId" TEXT NOT NULL,
 "expertId" TEXT,
 "status" "ReadingOrderStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
 "offerCode" TEXT NOT NULL,
 "currency" TEXT NOT NULL,
 "amountMinor" INTEGER NOT NULL,
 "paymentProvider" TEXT,
 "providerPaymentId" TEXT,
 "paymentVerifiedAt" TIMESTAMP(3),
 "question" TEXT,
 "context" TEXT,
 "deliveryFileKey" TEXT,
 "completedAt" TIMESTAMP(3),
 CONSTRAINT "ReadingOrder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReadingOrder_providerPaymentId_key" ON "ReadingOrder"("providerPaymentId");
CREATE INDEX "ReadingOrder_customerId_createdAt_idx" ON "ReadingOrder"("customerId","createdAt");
CREATE INDEX "ReadingOrder_expertId_status_idx" ON "ReadingOrder"("expertId","status");
CREATE INDEX "ReadingOrder_status_createdAt_idx" ON "ReadingOrder"("status","createdAt");
ALTER TABLE "ReadingOrder" ADD CONSTRAINT "ReadingOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReadingOrder" ADD CONSTRAINT "ReadingOrder_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE "AiUsage" (
 "id" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "provider" TEXT NOT NULL,
 "model" TEXT NOT NULL,
 "operation" TEXT NOT NULL,
 "outcome" TEXT NOT NULL,
 "promptTokens" INTEGER,
 "completionTokens" INTEGER,
 "totalTokens" INTEGER,
 "costUsd" DOUBLE PRECISION,
 CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AiUsage_createdAt_idx" ON "AiUsage"("createdAt");
CREATE INDEX "AiUsage_provider_model_createdAt_idx" ON "AiUsage"("provider","model","createdAt");
