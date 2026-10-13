-- Preserve existing anonymous records but make them inaccessible through public chart routes.
-- New saved charts MUST have a User owner; old rows retain ownerId=NULL.
CREATE TABLE "User" (
 "id" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "email" TEXT NOT NULL,
 "passwordHash" TEXT NOT NULL,
 CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
ALTER TABLE "Chart" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Chart" ADD COLUMN "savedReport" JSONB;
CREATE INDEX "Chart_ownerId_idx" ON "Chart"("ownerId");
ALTER TABLE "Chart" ADD CONSTRAINT "Chart_ownerId_fkey"
 FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
