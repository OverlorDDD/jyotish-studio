-- Keep existing private Tarot questions private.
-- Only new, explicitly submitted requests are visible to the administrator.
ALTER TABLE "TarotQuestion"
 ADD COLUMN "expertSubmittedAt" TIMESTAMP(3),
 ADD COLUMN "expertReviewedAt" TIMESTAMP(3);
CREATE INDEX "TarotQuestion_expertSubmittedAt_expertReviewedAt_idx"
 ON "TarotQuestion"("expertSubmittedAt","expertReviewedAt");
