-- GalaxiCom C0-C1. Additive schema; no existing user, chart or News data touched.
CREATE TABLE "ComCategory" (
 "slug" VARCHAR(48) NOT NULL, "titleUk" VARCHAR(80) NOT NULL, "titleEn" VARCHAR(80) NOT NULL,
 "descriptionUk" VARCHAR(220) NOT NULL, "descriptionEn" VARCHAR(220) NOT NULL,
 "position" INTEGER NOT NULL DEFAULT 0, "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
 CONSTRAINT "ComCategory_pkey" PRIMARY KEY ("slug")
);
CREATE TABLE "ComProfile" (
 "userId" TEXT NOT NULL, "displayName" VARCHAR(40), "showPremiumBadge" BOOLEAN NOT NULL DEFAULT FALSE,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "ComProfile_pkey" PRIMARY KEY ("userId")
);
CREATE TABLE "ComThread" (
 "id" UUID NOT NULL, "categorySlug" VARCHAR(48) NOT NULL, "authorId" TEXT NOT NULL,
 "title" VARCHAR(160) NOT NULL, "body" TEXT NOT NULL,
 "status" VARCHAR(16) NOT NULL DEFAULT 'PUBLISHED',
 "pinned" BOOLEAN NOT NULL DEFAULT FALSE, "locked" BOOLEAN NOT NULL DEFAULT FALSE,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL, "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ComThread_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ComPost" (
 "id" UUID NOT NULL, "threadId" UUID NOT NULL, "authorId" TEXT NOT NULL,
 "body" TEXT NOT NULL, "status" VARCHAR(16) NOT NULL DEFAULT 'PUBLISHED',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "ComPost_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ComReport" (
 "id" UUID NOT NULL, "reporterId" TEXT NOT NULL, "threadId" UUID, "postId" UUID,
 "reason" VARCHAR(300) NOT NULL, "status" VARCHAR(16) NOT NULL DEFAULT 'OPEN',
 "reviewedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ComReport_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "ComReport_exactly_one_target" CHECK (("threadId" IS NOT NULL) <> ("postId" IS NOT NULL))
);
CREATE TABLE "ComModerationAction" (
 "id" UUID NOT NULL, "actorId" TEXT, "action" VARCHAR(28) NOT NULL,
 "targetType" VARCHAR(12) NOT NULL, "targetId" UUID NOT NULL,
 "reason" VARCHAR(300) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ComModerationAction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ComCategory_enabled_position_idx" ON "ComCategory"("enabled","position");
CREATE INDEX "ComThread_categorySlug_status_pinned_lastActivityAt_idx" ON "ComThread"("categorySlug","status","pinned","lastActivityAt");
CREATE INDEX "ComThread_status_lastActivityAt_idx" ON "ComThread"("status","lastActivityAt");
CREATE INDEX "ComThread_authorId_createdAt_idx" ON "ComThread"("authorId","createdAt");
CREATE INDEX "ComPost_threadId_status_createdAt_id_idx" ON "ComPost"("threadId","status","createdAt","id");
CREATE INDEX "ComPost_authorId_createdAt_idx" ON "ComPost"("authorId","createdAt");
CREATE UNIQUE INDEX "ComReport_reporterId_threadId_key" ON "ComReport"("reporterId","threadId");
CREATE UNIQUE INDEX "ComReport_reporterId_postId_key" ON "ComReport"("reporterId","postId");
CREATE INDEX "ComReport_status_createdAt_idx" ON "ComReport"("status","createdAt");
CREATE INDEX "ComModerationAction_targetType_targetId_createdAt_idx" ON "ComModerationAction"("targetType","targetId","createdAt");
CREATE INDEX "ComModerationAction_createdAt_idx" ON "ComModerationAction"("createdAt");
ALTER TABLE "ComProfile" ADD CONSTRAINT "ComProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComThread" ADD CONSTRAINT "ComThread_categorySlug_fkey" FOREIGN KEY ("categorySlug") REFERENCES "ComCategory"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComThread" ADD CONSTRAINT "ComThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComPost" ADD CONSTRAINT "ComPost_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ComThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComPost" ADD CONSTRAINT "ComPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComReport" ADD CONSTRAINT "ComReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComReport" ADD CONSTRAINT "ComReport_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ComThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComReport" ADD CONSTRAINT "ComReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ComPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComModerationAction" ADD CONSTRAINT "ComModerationAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
INSERT INTO "ComCategory" ("slug","titleUk","titleEn","descriptionUk","descriptionEn","position") VALUES
 ('jyotish','Джйотіш','Jyotish','Натальні карти, накшатри, даші та варги','Birth charts, nakshatras, dashas and vargas',1),
 ('tarot','Таро','Tarot','Розклади, аркани та символічні тлумачення','Spreads, arcana and symbolic readings',2),
 ('practices','Практики','Practices','Йога, медитація та дихальні практики','Yoga, meditation and breathing',3),
 ('vedic','Ведична традиція','Vedic tradition','Трактати, філософія та традиція','Texts, philosophy and tradition',4),
 ('experiences','Духовний досвід','Personal experiences','Особисті історії, запитання та спостереження','Personal stories, questions and reflections',5),
 ('experts','Запитання експертам','Ask the experts','Запитання перевіреним практикам','Questions to verified practitioners',6),
 ('help','Допомога Galaxiora','Galaxiora help','Побажання та технічні запитання','Feedback and technical questions',7);
