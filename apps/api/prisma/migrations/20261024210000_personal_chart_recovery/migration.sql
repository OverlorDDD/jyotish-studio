-- Keep historical Chart.result and savedReport untouched.
-- Recovered internal verification is a separate versioned, source-bound projection.
CREATE TABLE "PersonalChartRecovery" (
  "chartId" TEXT NOT NULL,
  "sourceHash" VARCHAR(64) NOT NULL,
  "methodVersion" VARCHAR(128) NOT NULL,
  "verifiedResult" JSONB NOT NULL,
  "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PersonalChartRecovery_pkey" PRIMARY KEY ("chartId")
);
ALTER TABLE "PersonalChartRecovery"
 ADD CONSTRAINT "PersonalChartRecovery_chartId_fkey"
 FOREIGN KEY ("chartId") REFERENCES "Chart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
