-- A9.2: two independent private tables. No changes to existing users, charts,
-- Tarot readings or editorial material; all related data cascades on account deletion.
CREATE TABLE "PersonalJournalEntry" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "kind" VARCHAR(16) NOT NULL,
  "referenceId" VARCHAR(120) NOT NULL,
  "note" VARCHAR(2000) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonalJournalEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PersonalJournalEntry_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PersonalJournalEntry_kind_check" CHECK ("kind" IN ('TAROT','CHART','PRACTICE')),
  CONSTRAINT "PersonalJournalEntry_nonempty_note" CHECK (length(btrim("note")) > 0)
);
CREATE UNIQUE INDEX "PersonalJournalEntry_ownerId_kind_referenceId_key"
  ON "PersonalJournalEntry"("ownerId","kind","referenceId");
CREATE INDEX "PersonalJournalEntry_ownerId_updatedAt_idx"
  ON "PersonalJournalEntry"("ownerId","updatedAt");

CREATE TABLE "PracticeCompletion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "practiceSlug" VARCHAR(80) NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PracticeCompletion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PracticeCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PracticeCompletion_known_slug" CHECK ("practiceSlug" IN ('gentle-breath','desk-mobility','five-senses','evening-unwind'))
);
CREATE INDEX "PracticeCompletion_userId_completedAt_idx"
  ON "PracticeCompletion"("userId","completedAt");
