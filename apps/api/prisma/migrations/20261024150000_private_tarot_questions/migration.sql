-- Durable, owner-controlled Tarot questions, never a payment/order or expert inbox.
CREATE TABLE "TarotQuestion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "timeframe" VARCHAR(140),
    "consentAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TarotQuestion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TarotQuestion_userId_createdAt_idx" ON "TarotQuestion"("userId", "createdAt");
ALTER TABLE "TarotQuestion" ADD CONSTRAINT "TarotQuestion_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
