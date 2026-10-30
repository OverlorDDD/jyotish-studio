ALTER TABLE "NewsArticle" ADD COLUMN "titleUk" VARCHAR(300);
ALTER TABLE "NewsArticle" ADD COLUMN "feedDescription" VARCHAR(1200);
ALTER TABLE "NewsArticle" ADD COLUMN "imageUrl" VARCHAR(1000);
ALTER TABLE "NewsArticle" ADD COLUMN "imageCredit" VARCHAR(160);
UPDATE "NewsArticle" SET "summary"=NULL,"summaryUk"=NULL,"summaryEn"=NULL,"summaryKind"='needs_editorial'
WHERE "summaryKind"='title_context' OR "summaryUk" LIKE '%Це орієнтир за назвою матеріалу%';
