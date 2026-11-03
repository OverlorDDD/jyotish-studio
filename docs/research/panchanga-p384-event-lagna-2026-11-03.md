# P3.8.4 — Swiss Event Lagna, Event D9, Owner Natal Gate, Classical Panchaka

## Status — preproduction engineering
Implemented separately from live P3.7 site in `feat/panchanga-p384-event-lagna-20261103`.
No frontend changed; this is an **authenticated, no-store, POST-only calculation endpoint** for later P3.8.5/6.
Do not deploy until CI, source review and regression signoff.

## Audit results

1. `apps/api/src/ephemeris.ts` already calculates Swiss (UT) **tropical** ascendant using `@swisseph/node.calculateHouses(jd,lat,lon,Placidus)`. Natal **sidereal** Lagna = tropical ASC minus JQA-3 mean Lahiri convention. The convention is measured with historical JHora8 and the precise versioned 0.13823494055031915-arcsecond Swiss v2.02.01/v2.10.03 difference. **Do not invent a second approximate ascendant.**
2. `apps/api/src/panchanga.ts` already provides Swiss-verified five limbs and seven sidereal Grahas at the exact UT time. Planetary `calculatePosition` results must pass `assertSwissReturnFlags`, rejecting Moshier fallback. Houses themselves are Swiss native mathematical calculations, not derived from planetary `SWIEPH` return flags.
3. `apps/api/src/personal.ts` already has a protected primary-chart owner and recovery pipeline. **Birth Lagna ≠ elected event Lagna**; **chosen event city's coordinates ≠ saved birth city's coordinates**.
4. Panchanga's **Vedic sunrise day** can start before the event's ordinary civil date: for a local 03:00 event before sunrise, re-evaluate the **previous sunrise day's** Tithi/Nakshatra/Karana/Yoga/Vara. The event's Julian Day is always UTC; never reinterpret this local time during DST.
5. The old P3.8.3 engine had classical Panchaka as a pure formula; **it was not using a calculated event Lagna**. The P3.8.4 integration now supplies it with the actual sign of the event ascendant, never a birth sign.

## Authoritative method references

- [Swiss Ephemeris Programming Manual, house functions, UT and geolon](https://www.astro.com/ftp/swisseph/doc/swephprg.2.10.htm): `swe_houses()` computes ASC in tropical of date at **UT Julian Day** and event **latitude/longitude** (east +). `swe_houses_ex()` supports sidereal; we intentionally retain the **existing**, independently tested JQA-3 mean-Lahiri **tropical ASC – ayanamsa** convention. `SEFLG_NONUT=64` yields the required mean variant.
- [B. V. Raman, *Muhurtha*, Chapter III](https://ved.bz/_jyotish/books/muhurtha.html): elected-time Panchaka = (Tithi ordinal 1–30 + weekday ordinal Sunday=1 + Nakshatra 1–27 + **election Lagna** 1–12) mod 9. Remainder 1 Mrityu, 2 Agni, 4 Raja, 6 Chora, 8 Roga, with different application for marriage, travel, house building and occupation. A favourable remainder alone does not certify a complete muhurta.
- [JHora 8.0 / Swiss parity internal JQA-3](../jqa3-6-jhora202-vs-swiss210-2026-10-27.md): mean Lahiri historical convention and 20 natal cases, independent Swiss dataset and delta-T.
- The canonical navamsa projection is `divisionalLongitude(sid,9)` from `packages/jyotish-core/src/index.ts`. It is **the event's D9 Lagna**, not the birth D9 Lagna.

## Exact mathematics and input contract

```text
UTC event timestamp (strict ISO Z) + event city coordinates / IANA zone
JD_UT = JulianDay(UTC Gregorian year/month/day + fractional UT hour)
ASC_TROPICAL = Swiss.calculateHouses(JD_UT, eventLatitude, eventLongitude, Placidus).ascendant
AYANAMSA_MEAN_JQA3 = Swiss.getAyanamsaExUt(JD_UT, SWIEPH|NONUT) - 0.13823494055031915/3600
ASC_SID = modulo(ASC_TROPICAL - AYANAMSA_MEAN_JQA3, 360)
EVENT_LAGNA_SIGN = floor(ASC_SID / 30) + 1
EVENT_NAVAMSA_SIGN = floor(divisionalLongitude(ASC_SID,9) / 30) + 1
event graha sign = floor(SWIEPH sidereal longitude at identical UT /30)+1
event graha house = (grahaSign - EVENT_LAGNA_SIGN + 12) mod 12 + 1
Raman Panchaka = (Tithi + Vara + Nakshatra + EVENT_LAGNA_SIGN) mod 9
```

The browser/URL never submits a natal birth time/date. For personal election the backend reads the **owner-verified primary chart**; for a partner-required wedding/engagement it reads **a second verified chart owned/controlled by the same account**. Other users' charts cannot be queried by arbitrary chart ID.

**Strict bounds:** calendar year 1900–2099, latitude magnitude under 66.5° due possible polar Placidus house-system fallback, finite longitude ±180, valid IANA zone, UTC string seconds/milliseconds, and explicit 1-arcsecond sign-boundary refusal. These are intentionally transparent **unsupported** inputs, not substitute data. The preview endpoint requires a **future event within five years**; the pure mathematical function can compute historical audit vectors.

**Sunrise day:** compute civil local day, obtain verified Swiss sunrise at event location; if event moment precedes local sunrise recalculate the previous day; accept only a matching interval `[sunriseUtc,nextSunriseUtc)`.

## Independent PySwissEph numerical vectors

`tests/fixtures/p384-pyswisseph-event-lagna.json` is pinned from **independent Python Swiss Ephemeris 2.10.03**:
- 2026-11-03 09:00Z, Kryvyi Rih (47.9105,33.3918): ASC sidereal **247.948242821°**, Sagittarius (sign 9).
- Identical UT, New Delhi (28.6139,77.209): **314.418134426°**, Aquarius (sign 11).
- 2027-05-10 15:00Z London: **157.920376434°**, Virgo (sign 6).
- 2027-06-01 12:30Z Sydney: **300.964482007°**, Aquarius (sign 11).
- Kyiv DST jump 2026-03-29: 00:30Z→02:30 local, 01:30Z→04:30 local; **no fabricated 03:30**.
- New York and Tokyo cases complete longitude-hemisphere and midnight crossing.

A ninth independent PySwissEph bisection targets the sidereal Sagittarius ingress at Kryvyi Rih on **2026-11-03 08:24:48.985198 UTC**; the 1-arcsecond boundary safeguard must refuse a stable sign rather than guess.

Native Swiss output must agree to **within one arcsecond** and match the 1″ JQA-3 natal-angle pipeline for the **same instant and observer**. Pinned values are independent of the TypeScript code under test; no runtime image/network/LLM.

## Secure private API contract

`POST /api/v1/personal/panchanga/event-lagna`
authenticated session cookie + existing `sameOrigin()` CSRF guard.
Body (example input **not** a complete selected ceremony):

```json
{"activityId":"foundation","atUtc":"2027-05-10T15:00:00.000Z",
 "timeZone":"Europe/London","latitude":51.5074,"longitude":-0.1278}
```

Optional `partnerChartId` is accepted **only** for partner-required activities and must resolve to a **different, owned, verified chart**; a second person's sensitive birth input is not returned or put into URL, stored, or logged. If primary is missing → `requires_primary_chart`, if partner is missing → `requires_partner_chart`.

On success the endpoint returns:
- source-verified **event ASC**, local date/time, D9 event sign, planet D1 sign and whole-sign house;
- P3.8.3 calendar and natal screening at that identical UT;
- documented Raman `Panchaka` **only for an activity with explicit applicable scope**, using the actual event Lagna;
- `guidanceScope: PARTIAL_EVENT_ELECTION_REQUIRES_SPECIAL_DOSHAS` and remaining classical gate names. No blanket "favourable" claim for weddings or foundations.

**Privacy:** `Cache-Control: private,no-store`, `Vary: Cookie`, no birth inputs in URL, owner-scoped Prisma queries, own second chart only, same-origin check, 8 requests/user/hour, and no database schema/migration.

## Tests and stage-gate blockers

`npm run test:p384`: eight PySwissEph reference vectors, independent native/natal cross-check, time-zone DST hole, same-time/different-location sign, valid UTC parsing, latitudes, exact event sign and 7 planet houses, distinct Raman activity conclusions, wedding partner gate, cross-source Moon and private gochar consistency, reject forged sign and missing data.

`npm run test:panchanga`: now includes P3.8.4; CI also compiles API+Next.js and runs old P3.1–P3.8 regression.

**Still outside P3.8.4 (do not claim full wedding Muhurta):**
- Special event-specific graha-drishti, functional benefics/malefics, 7th lord, D9/Rashi dosha, planets' angular proximity, Chandrashtama exceptions, selected school ritual constraints, and full **both-partner** compatibility beyond verifying the partner's chart;
- Sunrise-to-sunrise multi-day event Lagna sign ingress solver and fully attested window selection across 7/30 days (P3.8.5);
- Unified Day/Week/Month UX and city-choice form (P3.8.6/7).
- Polar (>66.5° latitude) event Asc: no false Placidus fallback; future use alternative verified Swiss house projection with independent vectors.

No visible changes are expected on Galaxiora.com from this PR. Do **not** run production deployment until P3.8.5/6/7 and signoff.
