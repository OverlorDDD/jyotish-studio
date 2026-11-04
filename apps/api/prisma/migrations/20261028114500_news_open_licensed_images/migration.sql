-- Original or appropriately licensed illustrative photos with explicit provenance.
-- Keep publisher images restricted to permitted reuse; do not treat RSS metadata as a license.
ALTER TABLE "NewsArticle"
 ADD COLUMN "imageLicense" VARCHAR(80),
 ADD COLUMN "imageLicenseUrl" VARCHAR(500),
 ADD COLUMN "imagePageUrl" VARCHAR(1000),
 ADD COLUMN "imageLookupAt" TIMESTAMP(3);
CREATE INDEX "NewsArticle_imageLookupAt_idx" ON "NewsArticle"("imageLookupAt");
