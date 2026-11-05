-- External identity is opt-in; all existing password accounts remain unchanged.
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
CREATE TABLE "ExternalIdentity" (
  "id" TEXT NOT NULL,
  "provider" VARCHAR(12) NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExternalIdentity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExternalIdentity_provider_subject_key" ON "ExternalIdentity"("provider","subject");
CREATE INDEX "ExternalIdentity_userId_idx" ON "ExternalIdentity"("userId");
ALTER TABLE "ExternalIdentity" ADD CONSTRAINT "ExternalIdentity_userId_fkey" FOREIGN KEY ("userId")
  REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
