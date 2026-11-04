-- Additive, nullable. No existing chart, Personal timezone or user records are modified.
ALTER TABLE "PersonalProfile"
 ADD COLUMN "panchangaPlace" VARCHAR(120),
 ADD COLUMN "panchangaTimeZone" VARCHAR(64),
 ADD COLUMN "panchangaLatitude" DOUBLE PRECISION,
 ADD COLUMN "panchangaLongitude" DOUBLE PRECISION;
