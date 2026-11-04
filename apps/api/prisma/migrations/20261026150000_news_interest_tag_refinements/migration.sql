-- Backfill optional interest chips from existing titles and short publisher metadata.
-- Keep the existing 8 news categories unchanged.
UPDATE "NewsArticle" SET tags = array_append(tags,'natal-charts')
WHERE NOT ('natal-charts'=ANY(tags)) AND
 (title || ' ' || COALESCE("titleUk",'') || ' ' || COALESCE("feedDescription",'')) ~* '(natal chart|birth chart|натальн.{0,10}карт|карта народження)';
UPDATE "NewsArticle" SET tags = array_append(tags,'nakshatras')
WHERE NOT ('nakshatras'=ANY(tags)) AND
 (title || ' ' || COALESCE("titleUk",'') || ' ' || COALESCE("feedDescription",'')) ~* '(nakshatra|накшатр)';
UPDATE "NewsArticle" SET tags = array_append(tags,'mantras')
WHERE NOT ('mantras'=ANY(tags)) AND
 (title || ' ' || COALESCE("titleUk",'') || ' ' || COALESCE("feedDescription",'')) ~* '(mantra|мантр)';
UPDATE "NewsArticle" SET tags = array_append(tags,'pranayama')
WHERE NOT ('pranayama'=ANY(tags)) AND
 (title || ' ' || COALESCE("titleUk",'') || ' ' || COALESCE("feedDescription",'')) ~* '(pranayama|breathwork|пранаям|дихальн.{0,15}практик)';
