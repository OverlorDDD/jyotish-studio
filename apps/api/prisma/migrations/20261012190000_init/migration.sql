-- Create reproducible tables for the Jyotish Studio interview prototype.
CREATE TABLE "Chart" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "input" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    CONSTRAINT "Chart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Interpretation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chartId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "Interpretation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Interpretation_chartId_idx" ON "Interpretation"("chartId");
ALTER TABLE "Interpretation" ADD CONSTRAINT "Interpretation_chartId_fkey"
  FOREIGN KEY ("chartId") REFERENCES "Chart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
