-- Additive, non-destructive verification staging. Never touches existing User records.
CREATE TABLE "PendingRegistration" (
  "email" VARCHAR(150) NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "codeDigest" VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PendingRegistration_pkey" PRIMARY KEY ("email")
);
CREATE INDEX "PendingRegistration_expiresAt_idx" ON "PendingRegistration"("expiresAt");
