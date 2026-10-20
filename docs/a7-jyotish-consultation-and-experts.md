# Galaxiora — specialist Jyotish readings and A7 precheckout operational foundation

## Why the old reading felt generic
The former prompt explicitly prohibited the use of Jyotish terms, placements, dates and houses in narrative. It required one 'practical low-risk action this week' in every paragraph; the deterministic editorial report also ended with 'choose two practical ideas'. This architecture discarded most of the chart evidence and turned a classical consultation into a self-help worksheet.

## New specialist content principles
- Interpret in the classical Parashari tradition: lagna and ruler, grahas, houses/lordships, planetary conjunctions/drishti only when verified, Moon nakshatra, Navamsha D9, Dashamsha D10, Vimshottari mahadasha and antardasha.
- Explain the significance of a **specific verified conjunction or combination**; do not treat a general sign stereotype as a prediction.
- Each assertion in model interpretation is anchored to a provided deterministic chart fact. No model-invented yoga, dasha dates, aspects, strength scores, planetary placements or biographical facts.
- Speak authoritatively as an *interpreter within Jyotish's traditions*, not as if astrology had been empirically proven. Do not add compulsory disclaimers to every sentence, but differentiate astronomical calculation from spiritual interpretation and avoid certain predictions of health, death, pregnancy, finances or legal matters.
- Chapter-specific 'Interpretive key' replaces patronizing generic homework assignments. Maintain 10 existing chapter IDs/structural consistency for saved charts.
- Original references used for training/editorial style, not verbatim copied content:
  - Classical BPHS translation, traditional house lord and dasha passages: https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf
  - Parashari interpretation outlines: https://vedicreader.com/j/learn/methods/parashari
  - Dasas: https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-46
  - D1, D9, D10 consultation flow: https://www.astrodadi.com/blog/understanding-d1-d9-and-d10-charts-in-jyotish
- Never distribute copyrighted manuals or transplant third-party prose into source; references are linked only.

## A7 functionality delivered
- User-owned personal request drafts for human Tarot readings. Customer can list and delete drafts within seven days, sees pending/not paid status.
- Explicitly says there is no booking, payment or sharing with practitioners today. No payment system silently enabled.
- Reuses existing server-side ownership checks, expiresAt and consent fields, and same-origin protection for delete.
- No schema migration.

## Acceptance
1. Calculate two natal charts with different birth data and generate full report. Compare lagna, house lordship, dasha and resulting individual narrative; watch for false details or repeated coaching assignments.
2. Open expert Tarot module, sign in, save a private request. Refresh; private list should include it and show not paid.
3. Delete the request; it disappears and cannot be read by other accounts.
4. Existing Tarot v2, admin, Yoga and Academy remain unchanged.
5. CI: report tests, AI tests, full build, Swagger, PostgreSQL ownership and browser E2E.

## A7 features not yet approved/available
Payment gateway, price/terms, trusted real practitioner onboarding, client order placement, processing, video upload/delivery, refunds and receipts. These depend on external business/regulatory decisions. This milestone is the secure **operational preparation**, not a launched paid marketplace.
