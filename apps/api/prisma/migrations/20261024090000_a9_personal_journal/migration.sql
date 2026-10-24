-- A9.2 user-owned entries; additive migration, no existing chart/tarot modifications.
CREATE TABLE "PersonalJournalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "sourceId" VARCHAR(60),
    "title" VARCHAR(120) NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PersonalJournalEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PersonalJournalEntry_userId_createdAt_idx" ON "PersonalJournalEntry"("userId","createdAt");
CREATE INDEX "PersonalJournalEntry_userId_kind_sourceId_idx" ON "PersonalJournalEntry"("userId","kind","sourceId");
ALTER TABLE "PersonalJournalEntry" ADD CONSTRAINT "PersonalJournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
