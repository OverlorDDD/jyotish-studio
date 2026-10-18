-- Additive schema: store an opt-in generated Tarot narrative per saved reading.
-- Old Tarot readings remain valid and receive local reader-style interpretations on read.
ALTER TABLE "TarotReading" ADD COLUMN "narrative" JSONB;
ALTER TABLE "TarotReading" ADD COLUMN "narrativeLang" TEXT;
ALTER TABLE "TarotReading" ADD COLUMN "narrativeModel" TEXT;
