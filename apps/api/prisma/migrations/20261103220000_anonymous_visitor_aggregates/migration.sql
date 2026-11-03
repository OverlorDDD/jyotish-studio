-- No IP addresses, cookies, user IDs, referrers, or request URLs.
CREATE TABLE "VisitorAggregate" (
  "day" DATE NOT NULL,
  "section" VARCHAR(32) NOT NULL,
  "metric" VARCHAR(48) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "VisitorAggregate_pkey" PRIMARY KEY ("day","section","metric")
);
CREATE INDEX "VisitorAggregate_metric_day_idx" ON "VisitorAggregate" ("metric","day");
