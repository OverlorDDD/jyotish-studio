-- Additive audit and Tarot tables; does not modify existing accounts or charts.
CREATE TABLE "RoleChange" (
 "id" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "actorId" TEXT NOT NULL,
 "targetId" TEXT NOT NULL,
 "previousRole" "UserRole" NOT NULL,
 "newRole" "UserRole" NOT NULL,
 CONSTRAINT "RoleChange_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RoleChange_createdAt_idx" ON "RoleChange"("createdAt");
CREATE INDEX "RoleChange_targetId_createdAt_idx" ON "RoleChange"("targetId","createdAt");
ALTER TABLE "RoleChange" ADD CONSTRAINT "RoleChange_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RoleChange" ADD CONSTRAINT "RoleChange_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "TarotReading" (
 "id" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "userId" TEXT NOT NULL,
 "spread" TEXT NOT NULL,
 "question" VARCHAR(600),
 "cards" JSONB NOT NULL,
 "deckVersion" TEXT NOT NULL DEFAULT 'rws-v1',
 CONSTRAINT "TarotReading_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TarotReading_userId_createdAt_idx" ON "TarotReading"("userId","createdAt");
ALTER TABLE "TarotReading" ADD CONSTRAINT "TarotReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
