# Galaxiora A9 — Accuracy + Personal Space
**Decision: approved 2026-10-24.** Galaxiora Personal is the roadmap priority.
Do not ask the site owner to manually update/test the local project until there is a meaningful acceptance candidate.

## A9.0 — Independent astrology correctness and technical stability (P0)
- 20 original JHora 8.0 exports with raw INI/JHD/clipboard preserved: JQA-3.2 DONE.
- **JQA-3 same-method D1/D9/D10 SIGN PARITY CERTIFIED**: 20/20 charts, all 12 lagna signs, 600/600 matching signs with independent source; CLI `npm run jqa3:certify-signs` is a blocking CI release gate.
- **Still separate:** arcsecond longitudes and precise Vimshottari dates (original JHora `YearDefinition=0 3` is NOT the same proof as `YearLength=0 365.242500`). Details in `docs/research/jqa3-certification-review-2026-10-24.md`.
- Compare the same UTC, longitude/latitude, ayanamsa, true/mean nodes, D10 convention, and dasha-year setting; never silently reinterpret a different JHora configuration as a regression.
- Completed D1/D9/D10 requirement: 20 attested same-method original charts, 10 positions per chart and varga, 12 lagna signs, nakshatra/pada/retrograde and lord outcomes.
- Separate precision/dasha requirement: compare <=1 arcsecond only when ephemeris version and ascendant convention actually match; the existing differences must remain explicitly visible. Exact 9 Mahadasha and 81 Antardasha *date* parity requires JHora's selected year-definition mode to be attested, not inferred from its raw fixed-length field.
- Fail closed: any unknown original setting or missing external evidence remains NOT_CERTIFIED. Improve Windows CRLF preservation for SHA256-attested original `capture.json` without rewriting its bytes.
- All 4 CI checks (Windows fixtures, Node build/tests, PostgreSQL, browser) PASS on updated branch; release sign-off for subarcsecond/date parity is separate.
- Planned site visual arrangement and navigation review can proceed now without claiming the separately open precision/date gates are complete.
- Not in scope: changing production astro formula to game the reference score; merging unverified settings; UI forecasts while astronomical backend has no numerical certificate.

## A9.2 — Private Personal Journal (P1; initial implementation on current branch)
- New user-owned `PersonalJournalEntry` database table, an additive migration, independent of premium membership.
- Authenticated owner-only list/create/delete REST API; source linkage to Tarot or Jyotish validated against owner's original records; bounded title/body and private notes.
- Bilingual reusable component in account profile and after revealed Tarot cards.
- Next increments: linked Jyotish chart notes via chart screen, gentle optional practice completion status for Yoga, filter/search, edit/export/delete-all, pagination, ownership and DB integration tests.
- No external AI access to private notes and no generating user personal details from the journal.
- Acceptance: tests reject anonymous/cross-user access and cross-origin modification, and preserve entry through browser reload.

## A9.T — Small evidence-grounded Tarot interpreter review (P1)
- Keep existing RWS 78-card random draw, spread positions, reversed/upright and reader's natural vivid event scenarios.
- Existing structured reply shape and count validation remain.
- Add one deterministic, bounded post-LLM pass that rejects an **explicitly named card not in the spread**, directly contradicted card orientation, or limited unambiguous certainty in sensitive outcomes. Never regenerate randomly or multiply provider requests.
- If the AI response fails: never show fabricated reading; existing rule-based human-like Tarot reader is the available fallback.
- Evidence check is deliberately narrow, NOT a universal semantic truth detector. No false certification of the art of Tarot. UA/EN and card orientation regression suite required.
- Editorial direction: answer user's actual question in an expressive expert voice, card positions and reversal should matter, no generic corporate disclaimers filling the story.

## A9.1 — Galaxiora Personal (APPROVED, follow after A9.0 and A9.2)
- Personalized dashboard for signed-in users, natal chart + current Vimshottari period and verified transit timeline (7/30 days), daily Tarot, practice suggestion and private notes.
- Distinguish observed astronomical coordinates from traditional symbolic interpretation, preserve evidence graph.
- Vedic calculation must stay deterministic; LLM only describes verified facts; no unsupported future event guarantees.
- No payment/advertising or push notification dependency.
- Accept via bilingual responsive keyboard-accessible UX, privacy isolation, real browser runs and zero fake astronomical facts.

## A10 — Public beta and discoverability
Persistent HTTPS domain, security and rate limits, GDPR/local privacy controls, backups and restore rehearsal, responsible licensing (Swiss Ephemeris/RWS) and public SEO after launch gates.

## A11 — Commerce when compliant
Checkout/provider, refunds, video fulfilment and subscriptions only after compliant seller/Merchant-of-Record/legal and security model. No reliance on personal card transfer as proof of compliant checkout.
