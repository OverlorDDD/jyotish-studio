-- Seed the dynamic publisher registry from existing validated HTTPS article records.
-- This is additive; existing articles and private user data remain untouched.
INSERT INTO "NewsDiscoveredSource"
 ("domain","firstSeenAt","lastSeenAt","lastTitle","articleCount","status")
SELECT domain, MIN("discoveredAt"), MAX("lastSeenAt"), MAX(title), COUNT(*)::int, 'DISCOVERED'
FROM (
 SELECT lower(regexp_replace(split_part(url,'/',3),'^www\.','')) AS domain,
        "discoveredAt","lastSeenAt",title
 FROM "NewsArticle"
 WHERE url LIKE 'https://%'
) AS records
WHERE domain ~ '^[a-z0-9][a-z0-9.-]{2,190}$'
GROUP BY domain
ON CONFLICT ("domain") DO NOTHING;

-- Prevent old excluded polemics from remaining on the public feed.
UPDATE "NewsArticle" SET status='HIDDEN'
WHERE status='PUBLISHED' AND (
 lower(title) ~ '(astrology|tarot|horoscope).{0,40}(pseudoscience|is fake|fraud|scam|debunked|nonsense)'
 OR lower(title) ~ '(астрологія|таро|гороскопи).{0,40}(псевдонаук|шахрайств|обман)'
);
