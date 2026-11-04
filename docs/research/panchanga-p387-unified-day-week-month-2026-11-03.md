# Galaxiora — P3.8.7: Unified Day / Week / Month, personal events and exact time windows

**Date:** 2026-11-03. **Base:** P3.8.6 PR #95, stacked on #94–#92.
**Branch:** `feat/panchanga-p387-unified-personal-calendar-20261103`.
**Status:** source-backed implementation for CI/QA, **NOT production acceptance**.
No new ephemeris provider, no database migration, no birth input leakage, no
automatic 30-day Time Finder scan, no changes to public/SEO/brand icons.

## 1. Audit and existing validated calculations

| Module | Real data / reference scope | Safe interpretation |
|---|---|---|
| `panchangaRange`, `vedicCalendarWindow` | Shared Swiss Ephemeris rise/set worker, geocentric sidereal Sun and Moon, current JQA3 Lahiri profile, five limbs at each observer-local sunrise | A **sunrise snapshot**, not a guaranteed whole-day auspicious judgment |
| `buildP35Calendar` | Owner-verified natal D1 Moon / Lagna; Swiss Moon and Mercury–Saturn at sunrise; Tarabala, Chandrabala, houses from natal Moon/Lagna; exact UTC Moon sign/nakshatra ingresses and verified Vimshottari major/minor boundaries | Lunar *personal evidence* only. A transition after civil midnight belongs to its actual local **sunrise-to-sunrise interval**. A natal D10 indicator cannot silently be promoted to a wedding rule |
| `searchP385Time` / `findP385Windows` | Verified event-city ASC, Swiss grahas/mean nodes, real five-anga/planet/pada/Lagna/Rahu/dasha boundaries, same-instant natal resonance and documented activity-specific Raman rules | `candidate` means a source-screened start **not scientifically predicted success**. `requires_review` is NOT a certified wedding/foundation Muhurta; `excluded` means a documented tested disqualifier, not a bad day for all activities |
| Public `vedic-calendar` | Astronomical phases and Sankranti, provisional religious observances from documented conventions | Exact phase instant may be computed; festival day **not** certified for all regions, fasting schools and cities |

**Primary technical references**
- Swiss Ephemeris API, Julian UT, planetary longitudes, rise/set:
  https://www.astro.com/swisseph/swephprg.htm
- Existing mean Lahiri, JHora matching, independent Python test vector and JQA3 policy:
  `docs/research/panchanga-p384-event-lagna-2026-11-03.md`,
  `docs/research/panchanga-p385-classical-time-finder-2026-11-03.md`.
- Time zone and daylight-saving rule database: https://www.iana.org/time-zones ;
  JS date presentation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat .
- Civil-date calendar interoperability and future exact-time exports:
  https://www.rfc-editor.org/rfc/rfc5545.html ; no speculative .ics export added.
- B.V. Raman, *Muhurtha (Electional Astrology)*, wedding Chapter 9 and house building Chapter 12:
  https://ved.bz/_jyotish/books/muhurtha.html .
  Specific-rule inventory, 21 Mahadoshas and missing partner Kutas:
  `docs/research/panchanga-p386-clean-ux-and-wedding-certification-plan.md`.
- Panchanga traditional interpretations in repository:
  `docs/research/panchanga-p32-rules-2026-11-02.md`,
  `docs/research/panchanga-p33-resonance-2026-11-02.md`,
  `docs/research/panchanga-p38-activity-muhurta-plan.md`.

Astronomical longitudes and time-zone conversion can be tested independently;
historical astrological rules are an interpretive tradition, not scientifically
validated outcome-prediction probabilities.

## 2. Confirmed integration blockers and remediations

1. **Retired P3.5 duplicate tab disconnected personal facts from three clean tabs.**
   Reuse P3.5's *verified* private output in the existing Week / Month view
   without restoring duplicate navigation. A shared controlled P38 activity
   now persists across Day, Week, and Month.
2. **Full civil months are not always 30 days.** Private P3.5 now accepts
   **7/28/29/30/31** consecutive civil dates. Week uses 7; Month uses its actual
   calendar length (including leap Feb 29). The Time Finder remains **7 or 30
   consecutive sunrise days**, not falsely “the entire 31-day month”.
3. **Independent endpoints could disagree on source or sunrise** (latitude,
   longitude, IANA zone, DST, Swiss profile, source method, UTC sunrise, five
   limbs). `panchanga-p387-unified.ts` refuses to join a personalized report
   unless *all* 7–31 exact days/limbs match. If natal data is unavailable or
   inconsistent, only public astronomy survives.
4. **Single global Time Finder answer does not make a usable calendar.**
   P385 still evaluates each exact interval and returns existing nearest
   candidate/review, but also returns **at most the first candidate and first
   review for each actual sunrise day** (maximum 60 results across 30 days).
   This is *not* a claim of exhaustive display of all possible windows.
   Each result has exact `startUtc`, `endUtc`, `sampleUtc`, `sunriseDate`,
   explicit `status` and reason IDs. A user clicks to inspect that
   exact instant in the canonical Day screen.
5. **Unknown traditional rules are not bad days.** No fake positive,
   negative or probability score is created at Week/Month level.
   `requires_review` remains separate from `candidate`. No
   ceremony receives full Muhurta certification.
6. **Private natal data and EC2 CPU risk.** Owner-only cookies and existing
   access control maintained, city and dates are only user-chosen query
   coordinates, chart inputs never sent to public month calendar,
   no private endpoint auto-fetch on every navigation. Personal overlay
   explicitly requires a button; expensive 7/30-day Swiss scan explicitly
   requires a different button. Partner selection uses another
   user-owned saved chart; no role/sex assumptions.
7. **Observer-local midnight and DST.** The temporal ownership of a personal
   transition is `sunriseUtc <= atUtc < nextSunriseUtc`, not a string match
   on `YYYY-MM-DD`. 20–28 h verified solar-day interval accepted to support
   DST, but IANA display uses the city of the **event**.
8. **Stale results on changed activity/partner/city** are never reused.
   Epoch request identity and per-activity keyed results protect display.
   Busy, unauthenticated, unverified-chart, budget and source-mismatch
   states have explicit UI, not fallback hallucinations.

## 3. User-facing design and scopes

One observer/city field, date, and the existing **Day / 7 days / Month** tabs.
The same chosen specific activity persists across tabs. Week/Month show
public phases/observances and, only after request/validation, subtle
**personal Tarabala/Chandrabala at sunrise** and personal ingress counts.
A separate user-triggered Time Finder shows 7- or 30-day verified screen
windows (first candidate/review per sunrise day), clearly labeling
`review`. Expand exact event/window lists. Click a window to view its
precise Swiss-evaluated UTC sample in **Day**, not the approximate calendar
cell start. All times are rendered in the selected event city's IANA zone.

The heading “verified window” means **the calculation and the currently
implemented documented screening are source-based**. It must not claim
that all 21 Raman wedding doshas, Kutas, Vastu or ritual traditions were checked.

No logos, approved Galaxiora spiral icon or existing SEO settings changed.

## 4. Deterministic consistency and regression calculations

The P387 suite constructs **synthetic invariant fixtures** (NOT invented
actual planetary observations) and asserts that only **matching** verified
sources may be joined. It checks:
- Exact 7, 28, 29, 30, 31-day civil coverage and 29 February in leap year;
- 25-hour DST transition accepted, no naïve `sunrise+24h` interval;
- Event at 01:00 UTC belongs to prior source sunrise date when appropriate;
- Corrupt observer coordinates, missing day, mismatched UTC sunrise, different
  Karana and contradictory Swiss method are all rejected;
- Review-only wedding candidates never silently become good windows;
- Forged status, window bounds, duplicates and forged observer are rejected;
- Existing P385 bounded evaluator returns 2 distinct sampled windows per
  eligible source day (one candidate + one review), no fake results elsewhere;
- UA/EN public guest, 320px overflow and Day/Week/Month activity
  persistence in Playwright.

Run:
```bash
npm install --no-audit --no-fund
npm run db:generate
npm run test:p387
npm run test:panchanga
npm run test:vedic-calendar
npm run build
npx playwright test e2e/panchanga-p387.spec.mjs --config=playwright.config.mjs
```
All runnable tests and build **must pass on final PR SHA** before promotion.
A PR or merged source code alone does NOT mean a production deployment was made.

## 5. Open gates, deliberately NOT papered over

- P3.8.5 still needs measured **AWS EC2 7/30-day CPU, latency and memory**
  budget against real sunrise and Swiss phase inputs. 30 days can be expensive.
- P3.8.8 should independently re-check astronomical examples with JHora8 and
  PySwissEph including DST, UTC boundary sign/pada and house cusp cases;
  full marriage certification requires separately resolved Raman 21/21
  doshas, exceptions, two-party verified Kutas and D1/D9 and actual event
  bhava conventions.
- CI, Playwright guest + disposable authenticated two-owner privacy tests,
  no mobile overflow, and the stacked integration with PR #92–95 still
  require acceptance.
- Final migration-free controlled AWS deploy with backup, rollback and
  monitor only after the integrated PR stack is green and release-approved.
  Live galaxiora.com currently does not reflect draft P3.8.6/7 changes.
