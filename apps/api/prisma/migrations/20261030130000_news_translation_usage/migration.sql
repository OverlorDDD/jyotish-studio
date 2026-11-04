-- Additive, non-destructive quota reservation ledger for Azure Translator.
-- Nothing in the existing news archive is modified.
CREATE TABLE "NewsTranslationUsage" (
  "period" VARCHAR(7) NOT NULL,
  "characters" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NewsTranslationUsage_pkey" PRIMARY KEY ("period")
);
