# P3.3 · Personal Resonance Engine — implementation, risk controls, acceptance · 2026-11-02

## Product contract
A registered person with **a personally selected, currently verified primary natal chart** sees **ONE** coherent recommendation for Work/Money/Relationships/Travel/Personal — combining P3.2's seven traditional calendar signals with private natal Moon (Tara + Chandra Bala), verified Lagna, current sidereal Moon, explicitly sampled Jupiter/Saturn/Mars/Mercury/Venus gochar and **active** Vimshottari Maha/Antar Dasha. Every signal is inspectable in a closed-by-default *Why does this apply to me?* panel. The top card is short, direct, action-oriented. **Never** show two opposing final scores ("supportive" and "challenging") without reconciling them. Astrological statements describe a documented tradition; an actual life outcome is not guaranteed.

No primary chart / guest / unverifiable natal / unavailable Swiss => do not invent a personal result. Keep general P3.2 intact, show a **specific** create/select/verify chart CTA. Source detail charts no longer present opposite final headings; they are independent evidence only.

## Audit findings and resolved architectural blockers
- **Existing API**: `/api/v1/personal/panchanga` only evaluates Tara/Chandra *at sunrise*. Other Personal transits sample local noon. Combining them as though one UTC moment would be incorrect. P3.3 adds a dedicated **authenticated, never-cached** `/api/v1/personal/panchanga/resonance` that samples Moon and five planets **at one verified UTC instant** using the existing JHora/Lahiri Swiss backend and shared sunrise-based day. The returned timestamp must agree with the public calendar's true nakshatra interval.
- **Ownership/tenant isolation**: primary chart ID comes ONLY from authenticated `PersonalProfile.primaryChartId` and is read with `chart.findFirst({where:{id,ownerId:uid}})`. Never silently take the newest saved chart, accept chart IDs from URL or expose private birth time, birth city, natal longitude, birth coordinates or cookies in the response. JQA3 recovery has to return a current internally verified chart; otherwise `requires_verified_chart`.
- **No source conflation**: valid IANA zone + observer coords + dates + sunrise/next-sunrise must agree exactly between public and authenticated endpoints before client issues any personal reading. UTC transit sample must fall within the selected sunrise day; live evaluation is explicitly different from selected sunrise snapshot.
- **No false future 'now'**: `interpretPanchanga` gained a strict optional `sunrise-snapshot` mode, retaining the previous default API for old callers. A selected past/future day samples its sunrise and labels that **snapshot**, rather than claiming the person's current moment.
- **No contradictory verdicts**: priority: P3.2 hard avoid > natal Ashtama Chandra (Moon eighth from own birth Moon) > P3.2 caution and adverse natal lunar signs / sensitive gochar > weak/neutral combinations. Even many positive factors cannot cancel a hard restriction. A supportive recommendation needs positive general calendar and **both** favorable lunar indicators. Explain mixed Moon strengths explicitly rather than displaying 'favorable' and 'unfavorable' without a conclusion.
- **Dasha is contextual**: verify major/minor start/end precisely; report the actual period in effect but do not claim the period lord alone proves success/failure. If absent, explain instead of inventing. No unsupported graha-drishti/aspects, natal planet strength or western chart predictions.
- **Gochar is exact to sampled instant**: calculate houses from verified natal Lagna/Moon using whole-sign counting. Jupiter's traditional support houses, Saturn 12/1/2 Sade-Sati and Mars eighth from natal Moon are reported, never extrapolated to a guaranteed real-world event. No noon approximations in P3.3.
- **Bounded cost and privacy**: new private per-user rate limiter, explicit user-auth/HTTP no-store/Vary Cookie, aborted on date/observer changes, no public cache or saving birth parameters to the frontend. No LLM and no new commercial Swiss installation.
- **UI reuse**: first-screen P3.1/P3.2 has only one headline/action. Personalized mode is a verified client-side overlay; otherwise general content remains. Existing astronomy/eclipses remains independent and available. An explicit refresh updates stale personal sample instead of silently treating an old moment as current.
- **Existing detailed Moon strength block** renamed to raw *Natal Moon indicators* and made subordinate; no second giant pair of contradictory conclusions.

## Sources and documented school variations
- Previously implemented canonical `packages/jyotish-core/src/lunar-strength.ts` policy: Tara categories 2/4/6/8/9 supportive; Janma 1 cautious; 3/5/7 challenging. <https://www.mypanchang.com/newsite/tarabalamchakra.php> and <https://globalpanchang.com/tarabalam/hyderabad> describe traditional count and different Janma/Navakam exceptions.
- Chandra Bala measured from natal Moon: favorable sign counts 1/3/6/7/10/11; eighth is Ashtama Chandra in this version. <https://panchangtime.com/about/chandrabala> and <https://www.mypanchang.com/newsite/learn.php>. Schools differ on bright/dark Moon exceptions: don't claim universal rule without versioning/approval.
- Vimshottari's planetary periods from birth Moon's nakshatra, not from generic sign: <https://learn.acharyajyotish.com/learn/dashas/vimshottari-dasha/>. Use the chart's **existing verified period dates**, no new speculative recomputation.
- Swiss Ephemeris / Lahiri/JHora usage **unchanged** from previously approved licensing model.

## Implementation
- `apps/api/src/personal.ts`: new owner-only `GET /panchanga/resonance`, input `date, zone, latitude, longitude, at?`. Returns `status:'available'` minimal source facts, or `requires_primary_chart` / `requires_verified_chart`. All authorized data private, no-store; profile not implicitly changed.
- `apps/web/lib/panchanga-p33-resonance.ts`: pure typed strict validator + synthesis; prevents mismatched location/source/timestamp/period, fake quality, inconsistent gochar houses and nakshatra. Evidence-coded individual explanations in UA/EN.
- `apps/web/app/components/PanchangaMyDay.tsx`: use one personal merged verdict when available and one general fallback when not; seven P3.2 sources at **the same moment** as natal report. Refresh, user-readable info/CTA and compact lunar comparison explanation.
- `apps/web/app/components/PersonalPanchanga.tsx`: source-only details, not an alternative personal verdict.
- Tests and branch-specific GitHub Actions added (P3.3 unit + actual authenticated two-user Playwright test).

## Strict stage acceptance
- Verified primary owned chart, no stale/legacy unverified chart; guest 401; second user cannot adopt first user's chart. Missing primary => clean CTA, never another user's newest chart.
- UTC exact backend sunrise, selected observer/timezone/lat-lon and active nakshatra match; impossible sign/house/period rejected. No private caching, no birth inputs in response.
- Contradictory Tara and Chandra Bala => **one caution**, explicitly explains which supports and which challenges; Ashtama/hard calendar avoid override other supportive evidence; normal paired supports permit limited favorable assessment.
- Five topic-specific, practical UA/EN actions, no empty motivation, unsupported real-world event predictions or '99% luck'. No borrowed LLM/ephemeris libraries.
- 320px mobile and pre-sunrise, DST, selected historical/future dates. No existing P2.1–P3.2 regression, approved spiral #6, GA4, SEO or translation changes.
- Before declaring stage complete: latest-SHA unit, full build, two-user/guest browser suite and all existing Playwright/SEO gates SUCCESS. Keep Draft stacked PR; **no AWS production deploy until P3.6 user approval**.

## Next phases: NOT done in P3.3
- P3.4 finds **verified favorable/negative hour windows** by re-evaluating every change point and natal effects per candidate interval. P3.3 reports a sampled exact instant, not claims valid until a future eclipse or ingress.
- P3.5 personal 7/30 calendar (verified event timeline).
- P3.6 complete release, backup, rollback, production browser and privacy/security acceptance.
