# P3.5 — Personal Calendar 7/30 · approved stacked design and acceptance (2026-11-02)

## Dependency contract
**Approved sequence**: P3.1 My Day UX → P3.2 Interpretation Engine → P3.3 verified Personal Resonance → P3.4 exact Time Guidance → **P3.5 Personal Calendar 7/30** → P3.6 release acceptance/deploy. Branch stacks **only** on P3.4 commit `5513c260`, no unreviewed main merge. P3.4 Playwright was still in progress when P3.5 began; carry this open gate into P3.6. No AWS deployment, marketing production flags, new database migration, GA4/SEO/icon/News/brand edits.

**Output**: explicit `7` or `30` consecutive observer-local civil dates from exact verified local sunrise. Cards are **sunrise-only** natal Moon indicators. They **do not** claim a whole-day seven-factor/P3.4 electional ranking. For exact hours, press the day to open the P3.4 full sunrise-to-sunrise timeline and select a topic. Never call noon observations 'exact ingress time'.

## Source manuals / integration notes (no added packages)
- Existing official Swiss Ephemeris documentation: https://www.astro.com/swisseph/swephprg.htm — Swiss/Lahiri angular samples/flags, Julian day boundary and 1-second root-finding. Existing locked ephemeris + JHora8 settings only. The P3.5 service reuses P2.1 `panchangaRange` and P3.3 `createVerifiedSiderealPlanetAt`, no second astronomical source or new license.
- IANA time-zone guidance: https://www.iana.org/time-zones ; ECMAScript `Intl.DateTimeFormat`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat — input instant remains UTC and presentation applies selected IANA zone, including DST. Calendar dates are consecutive **civil dates**, not fabricated `+24h` sunrise timestamps.
- RFC 5545 canonical calendar spec: https://www.rfc-editor.org/rfc/rfc5545.html — consulted for future export interoperability, **no .ics export in this stage**, since exporting undetermined "good all day" events would be inaccurate. Only exact timestamps would be exportable in a separately approved stage.
- P3.2 tradition rules & cited Drik/IMD sources: `docs/research/panchanga-p32-rules-2026-11-02.md`.
- P3.3 Moon strength Tarabala/Chandrabala and selected chart policy: `docs/research/panchanga-p33-resonance-2026-11-02.md`. No unsupported full natal interpretation.

These links, calculation conventions, validation rules and regression tests are the required *technical instruction set kept in-repo*. Do not vendor complete externally copyrighted reference manuals or download unrelated astrology libraries.

## Architecture
1. **Batched public source**: `panchangaRange({start,days:7|30,timeZone,latitude,longitude})` reuses shared nonblocking Swiss rise/set batch, bounded cache, validated sunrises, local Tithi/Nakshatra/Vara/Nitya Yoga/Karana. This is a *sunrise snapshot*; its `range.scope` is validated.
2. **Private verified overlay**: `GET /api/v1/personal/panchanga/calendar` requires auth, selected chart owned by user, current recovered JQA3 internally verified natal data, strict IANA/lat/lon/date range. Eight owner-rate-limited calls/hour, `private, no-store`, `Vary: Cookie`; do not return birth coordinates/time, chart id, owner id or session. Missing chart = explicit status and a separate general public range, never another user's recent chart.
3. **30-day scaling**: one shared observer sunrise batch, one in-memory Swiss planet accessor, one sunrise sample/day for personal lunar/5 gochar + active Vimshottari Maha/Antar. **No eager 30 × P3.4 private hourly API requests**, no AI/LMM, no extra worker, no new DB migration, no natal calculations in the browser.
4. **Exact events**: Moon *sign* and *nakshatra* transitions found with actual Swiss longitude, 3-hour bracket (Moon cannot cross two adjacent lunar sectors in 3h in this supported model) + <=1-second bisection; Mahadasha/Antardasha boundaries from verified chart timestamps. All events are UTC timestamped; UI shows local IANA time and attaches an event to `[sunrise,nextSunrise)` even when local civil midnight occurs in between. Never label an adjacent-morning entry a whole day.
5. **Pure browser validation**: `validateP35Range` and `validateP35Private` enforce 7/30 count, strict consecutive dates, source profile/timezone/coordinates/sunrise continuity, matched exact natal sunrise and sign/nak, independently recomputed Tara cycle/quality, Chandra house and Ashtama, gochar houses, active dasha/antar intervals, UTC event bounds and nonduplication. Invalid private payload fails closed.
6. **Five concrete topics**: work, money, relationships, travel and personal produce short *morning-specific* actions. Ashtama Moon is a strong traditional avoid-at-sunrise even if Tara is favorable, contrary lunar strengths are caution, supportive BOTH lunar strengths mean only a **morning indicator** pending full P3.2/P3.4 review. Do not present two incompatible main headings.
7. **Visible experience**: distinct fourth Panchanga navigation tab `My 7/30 calendar`; locale-specific small text and 320px responsive grid, keyboard buttons, 7/30 switch, five topics without extra network, exact transition list, guest/unverified CTA, click on date transitions to the canonical P3.4 detailed day. Preserve public week/month festival calendar unchanged.

## Blockers and mitigations
| Issue | Resolution / remaining limitation |
|---|---|
| Personal legacy 7/30 currently shows **local-noon** planetary snapshot | Keep old Personal dashboard scope explicit; new P3.5 is separate sunrise-verified module. Do not merge incompatible time bases. |
| 30 complete P3.4 daily transit sweeps would overload small AWS | One sunrise batch + bounded exact lunar crossing search, no 30-fold P3.4 calls; selected day gets detail only on user request. |
| False whole-day guarantees from sunrise strength | UI/data contract labels `SUNRISE_SNAPSHOTS...`; no day-wide favorable color/promise; P3.4 detail needed for decisions. |
| Natal ownership/privacy leak | Auth + owner-controlled selected chart only, no-store/Vary Cookie, second-user E2E, no birth inputs or IDs returned. |
| Pre-sunrise/midnight and DST ambiguity | UTC interval `[local sunrise,next local sunrise)`, 20–28h safeguards, exact observer IANA local display, local civil date only for navigation. |
| Unsupported astronomy / solar latitude / polar sunrise | Entire calculation fails closed; no guessed moments, dates or positive recommendations. |
| Very long client payload or unbounded CPU | 7/30 fixed count, max 140 exact events, Swiss rise-set bounded worker, per-user request budget. |
| Personal Dasha may be missing | Missing period displayed as absent/context, no invented active period. |
| Different teaching schools for Tara/Chandra | Preserve P3.3 fixed/versioned policy; no secret new scoring. |
| Dependency P3.4 browser not yet accepted | Keep P3.5 stacked draft PR and P3.6 production release blocked on all inherited gates. |
| .ics export, calendar notifications, saving favorites | Deferred. Do not create fake appointments or extra automatic personal-data stores. |

## Acceptance gates
- [ ] P2.1–P3.5 strict Node tests, 7 and 30 sunrise samples, comparisons, lunar roots, Dasha, observer tampering and no invented data are green on final SHA.
- [ ] Production Next.js/NestJS compile, no unrelated translation/SEO/icon regression.
- [ ] Live disposable database/browser authenticated two-owner privacy, guest 401, missing primary selected, UA/EN, mobile/desktop, 30-day coverage and drilldown to P3.4 green.
- [ ] Performance/time limit under official P3.5 request budget, memory and sunrise worker queue on AWS-equivalent CI.
- [ ] Stage does not deploy to AWS until P3.6 final release backup, rollback, data-protection and explicit user acceptance.

**Next**: P3.6 integrates P3.1→P3.5, audits the lingering 30-minute P3.4 stationary-planet ingress risk, completes independent astronomical comparison, performance/security/browser regression, and deploys only after release approval.
