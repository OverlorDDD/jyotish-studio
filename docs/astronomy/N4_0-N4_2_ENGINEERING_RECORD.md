# N4.0–N4.2 · Galaxiora Shodashavarga foundation

**2026-11-04 · Draft engineering work, NOT production.** Canonical integration base: `main` at `2ebd254d877e0369afe5c26a96271b0ff7ccd3e0`. Current EC2 SHA is not attested here; never assume GitHub = live deployment.

## Scope and safety (N4.0)

- Snapshot/read current `packages/jyotish-core/src/index.ts`, `rules.ts`, `apps/web/app/astrology/jyotish/page.tsx`, `DetailedReport.tsx`, `PROJECT_STATUS.md` and `AGENTS.md`.
- Add `vargas.ts` behind isolated, opt-in exported functions; NO modification to existing `divisionalLongitude`, `calculateChart`, `CalculatedChart`, `ruleFingerprint`, `jyotish-integrity-v3`, `Reader v6`, database, API or UI.
- Preserve approved galaxy spiral #6, privacy-safe GA4, Panchanga and all bilingual routes.
- Existing `test:all` on the owner's local N4 staging branch reached `test:brand`, then failed because `tools/galaxiora-branding.test.mjs` expected old module suffix `Academy` while current `apps/web/lib/brand.ts` uses `Pedia`. This PR corrects only the stale test assertion; the site brand is unchanged. The full suite/build must be re-run before release.
- The supplied JQA3 audit reports `VIMSHOTTARI_YEAR_MODE_OR_DATE_MISMATCH`; the matched planet/varga signs do not certify JHora calendar-day/year settings. Preserve this as an OPEN separate pre-release issue.

## N4.1 · Mathematical contract

Source: all 16 canonical `D1,D2,D3,D4,D7,D9,D10,D12,D16,D20,D24,D27,D30,D40,D45,D60`. Input is nine sidereal natal graha longitudes and a separately computed sidereal ascendant. Output per chart: sign, sign counted from the chart's OWN Lagna (whole-sign house), original longitude, sector index, distance from nearest sector boundary, retrograde metadata, rules version.

| D | Partition / sign rule |
| --- | --- |
| 1 | D1 original zodiac sign |
| 2 | 2 × 15°; odd: Sun Leo then Moon Cancer; even reverse |
| 3 | thirds begin at natal sign, 5th, 9th |
| 4 | quarters begin at natal sign, 4th, 7th, 10th |
| 7 | odd natal sign; even seventh, then advance each sector |
| 9 | exact legacy Galaxiora `mod(sign0*9 + sector, 12)` |
| 10 | exact legacy Galaxiora odd/even Dashamsha |
| 12 | natal sign then advance |
| 16 | movable Aries, fixed Leo, dual Sagittarius |
| 20 | movable Aries, fixed Sagittarius, dual Leo |
| 24 | odd Leo, even Cancer, *forward count*; alternate schools explicitly out-of-scope |
| 27 | positional cycle Aries/Cancer/Libra/Capricorn repeating every four natal signs |
| 30 | unequal five sectors: odd 5/5/8/7/5°, even 5/7/8/5/5° with distinct sign mapping |
| 40 | odd Aries, even Libra |
| 45 | movable Aries, fixed Leo, dual Sagittarius |
| 60 | 60 × 0°30′, inclusive advance from natal sign (JHora-style), distinct from literal-BPHS alternative |

`vargaSign` returns a SYMBOLIC sign index, not a physical ephemeris longitude. No fabricated nakshatras or physical longitudes are attached to a derived varga.

### Methodological references

- Official Jagannatha Hora publisher: https://www.vedicastrologer.org/jh/
- P. V. R. Narasimha Rao Hora methods: https://www.vedicastrologer.org/articles/hora.pdf
- P. V. R. Narasimha Rao D24 methods: https://www.vedicastrologer.org/articles/para_d24.pdf
- Open technical descriptions including method caveats: https://jyotipy.readthedocs.io/en/latest/api/varga.html
- Secondary D27 positional start discussion: https://desiutils.in/astrology/saptavimsamsa-d27
- PyJHora upstream (independent comparator with multiple selectable varga methods): https://github.com/naturalstupid/PyJHora
- Primary classical source: Brihat Parashara Hora Shastra, chapter 6, edition/translation distinctions recorded rather than silently merged.

## N4.2 · Gates and current evidence

1. New pure mathematical test suite checks all 16, legacy D9/D10 parity over **20,000** points, examples of D2/D24/D27/D30/D60, boundaries, modulo periodicity, invalid and duplicate grahas, immutability and **50 synthetic × 16 × 10 = 8,000** INTERNAL validations.
2. `compareSampledVargaStability` compares **actual recalculated** ephemeris samples at user-supplied time offsets. It must not imply that unobserved minutes are stable. A time-sampling/rectification user experience is future N4.3.
3. Full existing tests: `npm test`; `npm run test:jqa3:corpus`; `npm run test:jqa3:ephemeris`; `npm run jqa3:audit`; `npm run test:jyotish:integrity`; `npm run test:report`; `npm run test:all`; `npm run test:swagger`; `npm run build`. Record actual results, do not infer CI success.
4. Independent 16-varga certification is **OPEN / BLOCKED** until ≥50 authentic same-profile synthetic Jagannatha Hora 8.0 exports supply all 16×10 expected signs, settings and provenance. `tools/n4-external-varga-gate.mjs` must fail closed with incomplete/missing data. Do NOT compute `expectedSigns` with Galaxiora's own engine and call that external evidence.
5. JQA3 Vimshottari year-mode disagreement remains OPEN; no automatic claims of a certified time schedule.
6. Production deploy, API field exposure, frontend Varga Explorer and Reader changes are **out-of-scope N4.0–N4.2**; they belong to later stages after this mathematical gate, and require separate user approval.

### External fixture format

Use a synthetic public reference file (no real birth records):
```json
{
  "profile": "parashari-sunmoon-hora-unequal-trimsamsa-jhora-style-d60-v1",
  "cases": [
    {
      "id": "jhora8-synthetic-01",
      "referenceTool": "Jagannatha Hora 8.0",
      "referenceSettings": "complete exact same-profile settings + reference evidence location",
      "isRealPerson": false,
      "natalLongitudes": {
        "Ascendant": 0, "Sun": 0, "Moon": 0, "Mars": 0, "Mercury": 0,
        "Jupiter": 0, "Venus": 0, "Saturn": 0, "Rahu": 0, "Ketu": 0
      },
      "expectedSigns": {
        "D1": {
          "Ascendant": 1, "Sun": 1, "Moon": 1, "Mars": 1, "Mercury": 1,
          "Jupiter": 1, "Venus": 1, "Saturn": 1, "Rahu": 1, "Ketu": 1
        }
      }
    }
  ]
}
```
Above is intentionally INCOMPLETE sample schema, **not a genuine JHora case**; every case needs all sixteen D entries.

## Acceptance and release order

- Current PR is a code staging area, NOT permission to deploy.
- CI + direct local user check are required **after** engineering changes are consolidated. Owner requested no premature testing.
- Only independent reference evidence can close N4.2, and only owner approval allows merge/deployment.

## Extended requested scope: N4.3–N4.5 before owner local acceptance

**Added in this draft PR on 2026-11-04; not production-verified:**

- `apps/web/app/components/VargaExplorer.tsx` provides one D1 and one user-selected chart side-by-side with 16 themed navigation entries and an optional comparison matrix, immediately after the birth form and BEFORE AI/Reader. It reuses server-verified D1 input longitudes and existing D1/D9/D10 for legacy display. N4 mappings are kept separate from original integrity digest.
- `NorthIndianChart.tsx` supports explicitly labeled D1–D60. For supplemental vargas it suppresses pseudo-longitude text when such values were not supplied independently; the sign/house facts remain exact for the selected method.
- Original bilingual, crawlable `VargaSeoGuide.tsx` explains all 16 charts and FAQs; `/[locale]/astrology/jyotish` metadata preserves existing high-intent birth chart/Kundli terms, indexRobots(), canonical and UK/EN alternates. No thin search-doorway pages and no private natal fields in metadata.
- `apps/api/src/n4-varga-evidence.ts` adds VERSIONED, server-derived, bounded source facts for a later neural reading. `direct-jyotish.ts` can consume them ONLY with BOTH `N4_VARGA_AI_ENABLED=1` and `N4_VARGA_INDEPENDENT_REFERENCE_APPROVED=1`. The default is OFF, so ordinary Reader v6 and Direct v2 output remain backward-compatible and the LLM cannot use new unverified vargas. No raw birth input is sent to the LLM.
- `npm run test:n4` includes math, LLM evidence privacy/feature gating, and UX/SEO source contracts. Update title/readability checks if design changes legitimately.

**Remaining gates:** no independent JHora 16-varga parity corpus as of this PR; do NOT set the two AI flags, advertise 16-varga certification, or deploy this draft as-is. Verify all CI jobs including Next build, existing SEO and Galaxy #6 tests, genuine mobile rendering (Chrome/OnePlus 11R viewport), no chart-state regression, identical Reader v6 fingerprint/report output, and performance against production baseline. The original JQA3 dasha year-mode discrepancy is still open.

**User delivery order:** finish math + UI + SEO + AI evidence together; one final owner-local verification; only then owner-authorized GitHub merge and pinned, safe AWS release.
