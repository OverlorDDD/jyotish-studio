-- Non-destructive bilingual news headlines; originals and existing Ukrainian titles remain intact.
ALTER TABLE "NewsArticle" ADD COLUMN "titleEn" VARCHAR(300);
