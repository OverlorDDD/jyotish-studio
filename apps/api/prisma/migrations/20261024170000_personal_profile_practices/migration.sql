-- Additive and reversible; no existing chart, note or member is rewritten.
CREATE TABLE "PersonalProfile" (
 "userId" TEXT NOT NULL,
 "primaryChartId" TEXT,
 "currentTimeZone" VARCHAR(64) NOT NULL DEFAULT 'UTC',
 "preferredLocale" VARCHAR(2) NOT NULL DEFAULT 'uk',
 "favoritePractice" VARCHAR(32),
 "newsTopics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "PersonalProfile_pkey" PRIMARY KEY ("userId")
);
CREATE UNIQUE INDEX "PersonalProfile_primaryChartId_key" ON "PersonalProfile"("primaryChartId");
ALTER TABLE "PersonalProfile" ADD CONSTRAINT "PersonalProfile_userId_fkey"
 FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonalProfile" ADD CONSTRAINT "PersonalProfile_primaryChartId_fkey"
 FOREIGN KEY ("primaryChartId") REFERENCES "Chart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PersonalPracticeSession" (
 "id" TEXT NOT NULL,
 "eventId" UUID NOT NULL,
 "userId" TEXT NOT NULL,
 "practiceId" VARCHAR(32) NOT NULL,
 "durationSeconds" INTEGER NOT NULL,
 "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "PersonalPracticeSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PersonalPracticeSession_eventId_key" ON "PersonalPracticeSession"("eventId");
CREATE INDEX "PersonalPracticeSession_userId_completedAt_idx" ON "PersonalPracticeSession"("userId","completedAt");
ALTER TABLE "PersonalPracticeSession" ADD CONSTRAINT "PersonalPracticeSession_userId_fkey"
 FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
