# GalaxiNews Personal Interests and Relevance Engine v2 — delivery plan

**Date:** 26 October 2026. **Branch:** fix/jqa3-windows-and-llm-recovery, PR #52 (Draft).

## Product policy
- World remains a public editorial magazine for all. The main World headline is chosen by relevance and may legitimately remain stable for hours; Latest is sorted strictly by publishedAt, and background source checks (~15 minutes) may add zero or many articles. Do not rotate editorial leads randomly.
- Personal Interests has progressive opt-in layers: P1 selected topics saved by user; P2 explicit reactions; P3 explainable ranking; P4 user controls and history; P5 comprehensive acceptance.
- No raw birth data, natal charts, Tarot questions, journal texts or demographic profiling. AI is used only in the separate publisher-grounded translation pipeline. Scoring is deterministic, inspectable, cheap to run.

## Research and architecture
Google's published recommendations architecture uses **candidate generation → scoring → re-ranking**, including fresher and more diverse content at final stage:
- https://developers.google.com/machine-learning/recommendation/overview/types
- https://developers.google.com/machine-learning/recommendation/dnn/re-ranking
OWASP recommends protecting state-changing cookie-authenticated endpoints against CSRF with source Origin / Fetch Metadata verification and authorization checks:
- https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en (transparent personal-data processing, user control)

## P1 — explicit topic interest profile [implemented in previous phase]
- Browser-only guest tags stay local; account-owned tags use existing PersonalProfile.newsTopics with explicit save. Explicit guest import, no silent upload.
- Authenticate, same-origin writes, preserve older Personal topics, isolate account A/B.
- 12 explicit interest chips with Ukrainian and English labels; international magazine and search unaffected.

## P2 — persisted feedback [implemented in this branch; subject to CI and host acceptance]
- Data: additive NewsReaction(userId,articleId,vote,createdAt,updatedAt); composite primary key; cascade user/article deletion, CHECK vote YES|NO, index by user+time.
- API GET /api/v1/news/reactions (recent 1000), PUT /api/v1/news/reactions/:articleId (YES|NO, idempotent upsert), DELETE single (undo), DELETE collection (erase history). Owner validated on every call, valid published article, session required, same-origin mutations, bounded requests. JSON never includes someone else's reactions.
- UI: cards periodically ask "Вам цікава ця публікація?" Each click persists as explicit feedback for members; clicking same answer again removes it, clicking opposite switches. Guests retain local-only feedback. An error rolls back optimistic UI. Member votes cannot be loaded from guest localStorage.
- Negative feedback hides **that article** from the member's "Для мене" feed; it does NOT ban the topic, delete publisher data or suppress the World feed.

## P3 — Relevance Engine v2 [baseline implemented; tune after QA]
1. Candidate generation: up to 600 currently published and topical source-grounded articles; preserve RSS, GDELT, moderation and image/rights gates. No invented material and no extra source scraping.
2. Scoring: stable World freshness/quality baseline + selected topic/tag boost + capped positive history for similar article tags + capped negative history. One article can have at most one active reaction; repeated clicks are not fabricated as independent engagement.
3. Re-ranking: prioritize source diversity (initial first pass max three from each publisher); reserve at most one in five personal slots for credible relevant World discoveries outside the selected tag cloud. Exact negative vote suppresses item only from owner Personal feed. Explain reason: selected topic, related to likes, freshness/exploration or world highlight.
4. Cold start: without selected tags/reactions, Personal returns a diverse World feed, never empty. Guests can still use tag-filtered local "Для мене".
5. Privacy and quality: No third-party LLM scoring. No collection of passive browsing, dwell time, reading history or private spiritual/health characteristics. Never overstate why a story was chosen.
6. Serving: server-side personal sort returns cache-control private,no-store; public World remains unauthenticated. Read costs bounded by 600 candidates and 1000 recent reactions. Under large load move to indexed candidate retrieval and materialized user feature summaries only after measurement.
7. Config values are currently an explainable baseline, not experimentally proven optimal weights; no claim that offline pass equals human-perceived relevance.

## P4 — user rights and settings [partial backend done, UI upcoming]
- Show one tidy News Interests preferences screen: selected topics, vote history with undo, clear all reactions, remove/sync settings across devices, export decisions and delete data.
- DELETE /api/v1/news/reactions already available for explicit clear; it must require in-product confirmation before UI bulk erase.
- Future: 30/90-day feedback retention policy determined by user choice, transparent opt-out, preference reset that does not remove natal charts/other Personal content; rate-limit abusive clients robustly on multi-instance backend.

## P5 — acceptance, scaling and editorial QA [planned]
- API: anonymous World, guest voting local only, owner A/B isolation, logout/login, session expiry, malformed article IDs, invalid vote, 403 CSRF, 404 hidden article, idempotent writes, undo, erase; no birth data in any news request.
- UI: first load automatic, multilingual, viewport/mobile, keyboard and screen reader labeling, cards after switching tabs, manual reactions do not block reading or corrupt pagination.
- Ranking: exact negative excludes disliked only, weights test, cold start diversity, exploration at 20% slots, repeated executions deterministic, reason parity, no filter bubble; avoid publisher monopoly.
- Operations: inspect 24h accepted item counts, GDELT 429 and RSS source cooldowns separately. Multiple imports per scan possible; do not turn a stable World lead into synthetic news.
- Practical metrics (targets, not achieved claims): p95 personal-feed API <500ms with ~100-600 candidates on local DB; <1% failed authenticated votes, 0 cross-owner access, 100% reversible votes and accurate explanations; unique source share and fresh-article presence checked on real data.
- Before merge: full unit/build/PostgreSQL/Windows-JHora/Chromium GitHub CI and host manual tests on Windows. PR stays Draft until user accepts.

## Follow-on optional Jyotish relevance [separate stage]
- Explicit user enable switch. Deterministic verified chart, Vimshottari/transit-derived topical suggestions, no raw birth data shared with any news AI. Respect existing JQA-3 600/600 sign parity but do not claim longitudes and Vimshottari dates have complete JHora numeric certification.
