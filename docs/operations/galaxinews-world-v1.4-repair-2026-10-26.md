# GalaxiNews World v1.4 — legacy article recovery and discoverable search

## Confirmed code defects and UI confusion
1. News search existed **after** hero, view buttons, and interest cloud. Users did not see it on first screen. v1.4 puts a high-contrast, keyboard-accessible **Пошук новин** input INSIDE the GalaxiNews masthead, before interests and article list.
2. The editorial batch was small and chosen newest-first; older English articles could remain untranslated. The ingestion cycle could also take much longer than expected and translations were not tied to an explicit one-time catch-up command.
3. Current source data is incomplete: GDELT DOC artlist often exposes the source/title/URL/time but not a real article paragraph. RSS descriptions and certain publishers' Open Graph descriptions are useful, but can be absent, blocked, low-quality, or protected by terms. Do not manufacture "what the author wrote" from a headline.
4. Image fallbacks are intentional when a publisher provides no RSS image, the image is broken or image display permissions have not been confirmed. We must NOT silently copy unlicensed third-party images to our CDN or bypass copyright.
5. An earlier metadata attempt could mark an article as checked, even if no description was retrieved. One-time repair can re-attempt only controlled publisher-domain metadata requests using \`--retry-metadata\`.

## Implementation
- Search is visible in hero. Data marker: \`data-release="world-v1.4"\`. Checking this marker distinguishes old running Next instances / wrong branches from a missing feature.
- Added per-article \`editorialAttemptedAt\`, \`editorialNextAttemptAt\`, \`editorialAttempts\` through an additive Prisma migration. Oldest-first bounded editorial batches, backoff after errors, and resetting retry state only when a NEW source description is discovered. No infinite regeneration of previously successful summaries.
- Safe archive utility: \`npm run news:doctor\` (read-only counts, provider readiness, running frontend revision); \`npm run news:repair\` (bounded source metadata + legacy title/summary translation); \`npm run news:repair -- --retry-metadata\` for older approved-source articles already marked checked.
- No article bodies are scraped, no user natal information or passwords sent to editorial providers, no database resets.
- UI tests explicitly verify visible search is inside the masthead and ABOVE the tag cloud; mock editorial tests verify English legacy titles get natural Ukrainian titles without synthetic missing-source teasers.

## Safest local usage (Windows / PowerShell)
1. Launch Docker Desktop. Stop all previous Next/Nest terminals via Ctrl+C.
2. \`cd C:\Users\Note\jyotish-studio-git\`
3. \`git switch fix/jqa3-windows-and-llm-recovery\`
4. \`git pull --ff-only origin fix/jqa3-windows-and-llm-recovery\`
5. \`npm run dev:full\` (preflight checks Docker/PostgreSQL/migrations).
6. In another terminal within the SAME directory: \`npm run news:doctor\`. It should say \`CURRENT v1.4\` and show provider readiness & number of missing translations/descriptions/images.
7. If AI provider is configured and ready, run \`npm run news:repair\` ONCE to backfill older articles. A zero figure is diagnostically meaningful. For checked old approved domains without usable metadata, \`npm run news:repair -- --retry-metadata\` can recheck safely. A source description may still not exist; not every news story can truthfully have a paragraph.
8. Load \`http://localhost:3000/uk/news\`, Ctrl+Shift+R. Search title is directly in the header, visible without scrolling down past tags.
9. Admin GalaxiNews diagnostics displays counts of untranslated, unsummarized and unillustrated articles and the publisher status list.

## Acceptance
- Current frontend identified as v1.4.
- Browser-visible search above tag cloud, search input uses full-feed \`q\` and no arbitrary external URLs.
- Archived real titles get Ukrainian translation when a configured provider supplies a valid result; no fact-free synthetic abstract.
- Available source-derived descriptions yield factual UA micro-summaries; no rights-forbidden article republishing.
- Curated RSS feed thumbnails shown when publisher-supplied; OG and GDELT media require publisher-specific rights. Stale/missing/broken images get the existing excellent Galaxiora ornamentation.
- Retry fairness, migrations, all core modules, desktop/mobile browser E2E and CI green.
- Real provider availability and actual photo rights cannot be certified from CI alone.

## Planned next phase — Personal Interests
Phase P1: optional personal interests profile scoped to signed-in user. Preserves local interests of guest until explicit consent to sync at login. Account has reusable interest weights and explanations; no natal data is required.
Phase P2: record interest reactions on user-controlled items (yes/no), support "not relevant"/undo and deletion, enforce auth/session CSRF, rate limits, no cross-user leakage.
Phase P3: deterministic ranking blending chosen topics, feedback and worldwide importance/freshness/diversity. Cold start = useful World feed plus optional tag selection. Avoid filter bubbles, ensure source and topical diversity. Why-this-story explanation reflects actual ranking features.
Phase P4: UX and acceptance: account synchronization across browser sessions, transparent interest controls with reset/export/delete, optional interest check-in after enough activity, privacy-safe experiments/tests. Local-to-account merge must never silently overwrite existing preferences.
Phase P5 (separate): opt-in natal chart/period/transit interests without sharing raw birth details with LLM and with deterministic astrology facts separated from interpretation.

Risks: feedback signal sparsity, bots/spam, personal-data retention/consent, cold-start relevance, recommendation feedback loops, multilingual topic normalization, account/device merge races and growth to millions of articles. Acceptance should include auth, negative/positive/manual tests, no private-data leaks, reversible votes and international source diversity.
