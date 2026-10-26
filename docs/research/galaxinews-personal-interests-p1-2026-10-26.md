# GalaxiNews Personal Interests P1 — 26 October 2026

## World acceptance and stable lead story
- Existing browser verification: 110 saved stories, 12 feed API items, 48 loaded initially, 12 interest chips and working Ukrainian headings.
- The "Головне" page is a relevance-ranked magazine, not a clock-based carousel. An unchanged top article for one hour is expected when no newly imported story outranks it. "Найсвіжіше" sorts by publication date.
- Separate source failures such as GDELT HTTP 429 may reduce new arrivals; check accepted counts rather than assuming a refresh means a new headline.
- Former browser verification returned PASS while reporting 0 article cards immediately after "Для мене" -> "Головне". Corrected to wait for resumed fetch and require cards if public feed is nonempty.
- The news:doctor command now displays the featured ranked article, newest published article and recent scan accepted totals.

## Account-scoped Personal Interests P1
- Private API GET and PUT /api/v1/news/interests require signed-in user and use private no-store headers. PUT requires same-origin, allows 0–12 unique supported tags, never mutates other accounts.
- Existing PersonalProfile.newsTopics persists selected tags; legacy unrelated Personal tags such as academy are preserved, without new database tables or destructive migrations.
- Guests keep browser preferences. Signed-in users display their server-side preferences. Any browser-only tags may be imported only via a direct action followed by a separate explicit save to account.
- No Tarot question, private journal, natal chart or birth data is read or sent to LLMs for news preferences.
- P1 tests cover guest 401, two-user isolation, invalid and duplicate tags, CSRF denial, legacy topic compatibility and save/reload.

## Acceptance and next steps
- World remains available anonymously, articles load without refresh, no changes to JHora or chart calculations.
- User A saves chosen topics and sees them after reload and on a second device; User B never receives A's server-side topics.
- P2: account-scoped reversible Interesting/Not interesting reactions.
- P3: explainable, deterministic scoring blending selected interests, reactions, news freshness and worldwide/source diversity.
- P4: transparent control to reset, delete and export preferences.
- P5: security and quality acceptance, rate limits, no cross-user leaks, cold-start and consent.
- Separate later step: optional verified natal/transit personalization without sending raw birth inputs to a model.
