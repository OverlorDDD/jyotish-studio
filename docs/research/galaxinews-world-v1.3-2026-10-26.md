# GalaxiNews World v1.3 — editorial discovery, search, images and localization

## User intent
One centered bilingual news magazine covering Jyotish, Tarot, yoga, meditation and related spiritual practices. Guests can search, filter topics and mark interest. The top tag cloud is kept; the duplicate sidebar is removed. No public "sources checked approximately every 15 minutes" text remains. Internal scan scheduling is unchanged: each cycle processes **any number** of qualifying items, not a single story.

## Content pipeline
1. RSS candidate registry (25 publisher feeds) + GDELT DOC article lists (13 targeted and broad-topic queries) for any publisher in the global index. GDELT articles may belong to prominent mainstream newspapers or newly discovered publishers, and therefore do not depend on a hand-maintained RSS allowlist.
2. Validate URL, date, topic; reject clearly off-topic/sensational/hostile debunking headlines; ambiguous critique is excluded from automatic publication and requires editorial review. This is an editorial focus filter, not a claim that critiques are factually wrong.
3. Store accepted articles with source, title, original URL, observed/publication date, images and RSS descriptions where available. Duplicate canonical URLs do not produce extra articles.
4. Upsert publisher domains into NewsDiscoveredSource; seed earlier existing articles via additive migration. Admin /admin/health shows discovered domains and can mark them BLOCKED or TRUSTED. Blocking hides previously published items belonging to that domain and suppresses future imports. TRUSTED permits bounded metadata extraction; it does not authorize image republication.
5. RSS: read description/summary and optional media:thumbnail, media:content, image enclosure or image reference in publisher RSS description/content:encoded. Never store the article body. Publisher-provided RSS-linked image thumbnails are rendered as third-party linked previews with source credit; verify publishers' syndication terms before public monetization.
6. GDELT: capture socialimage where present. Metadata extractor only fetches HTML head metadata (description/OG image), no full article, on curated RSS publisher domains or admin-trusted domains or explicitly configured NEWS_METADATA_ALLOWED_HOSTS. HTTPS-only, DNS/private-address guard, response-size cap, redirect blocked, timeout. Images from OG/GDELT require explicit copyright authorization and NEWS_IMAGE_ALLOWED_HOSTS; otherwise Galaxiora artwork remains visible.
7. Separate editorial queue begins shortly after API startup and repeats every five minutes. Existing title-only entries and entries whose factual publisher description arrives later are eligible. Groq/Gemini/OpenRouter keys from normal environment are required; can disable via NEWS_EDITORIAL_AI_ENABLED=0. Limits model calls to small batches. Prompts request natural UA headline translation and factual, non-boilerplate UA/EN teasers, and prohibit unsupported statements. If source metadata is absent or publisher/model cannot be reached, keep original title and avoid fictional summaries.
8. Public endpoint /api/v1/news/feed supports q= (2–80 characters), topic, tags, sort=relevance|latest and pagination, searching title, translated title, summaries, publisher and metadata. Search/filter is server-side, limited to 600 most recent matches.
9. A publisher's image appearing in a source does not necessarily grant our website rights to copy or redistribute it. Document source-specific rights, attribute source, avoid downloading to Galaxiora CDN without permission. Broken/unpermitted images use native placeholder.

## Operations
- Run Docker Desktop first, then \`npm run dev:full\` after pulling branch. It automatically runs pending additive migrations.
- Open /uk/news. A full-width search with placeholder "Таро, ретроградна Венера, йога…" must be visible. The element has data-release="world-v1.3"; if absent, the browser is showing an old Next instance or cached bundle.
- Admin console: GalaxiNews diagnostics includes counters for untranslated, unsummarized and unillustrated articles; editorial AI readiness; dynamically discovered publishers; source scan errors; whitelist/blacklist controls.
- For configured providers, NEWS_EDITORIAL_AI_ENABLED=1 + at least one of GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY. Backend logs [news] localization: N updated, or safe error code. Check env values without exposing keys to UI.
- Optional publisher rights: NEWS_IMAGE_ALLOWED_HOSTS=exact.example.com (only after explicit permission). Optional metadata crawling list NEWS_METADATA_ALLOWED_HOSTS=exact.example.com. Never enter a wildcard or arbitrary user-supplied URL.

## Explicit blockers and acceptance
- Offline CI verifies code paths with fixed data, not real live source permission, coverage or successful provider calls on the Windows host. We cannot guarantee every article has a meaningful paragraph or image when no metadata/rights exist. Do not generate fabricated material to satisfy the visual layout.
- Legal rights and source availability are per publisher; admin must review before public monetization or rehosting.
- GDELT rate limits and RSS 403/404 may reduce actual counts. Inspect NewsSourceScan. Full backend must keep running to poll every 15 minutes.
- Confirm many articles can arrive per one cycle, visible worldwide publishers, 30+ articles/8+ independent publishers/5+ categories as editorial aspirational thresholds, no overtly polemical titles, meaningful UA headlines and paragraphs where evidence exists, licensed images when available, and functional search / mobile.
- Next phase: **GalaxiNews Personal Interests**, storing tags and "interesting" votes in the user's account and syncing across devices; followed separately by personalized natal/transit recommendations. This requires user consent, privacy safeguards, explainable relevance and cold-start fallback.

Research references: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/ and https://support.google.com/news/publisher-center/answer/9607104?hl=en
