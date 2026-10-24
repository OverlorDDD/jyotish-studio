# JQA-3 precision postmortem — 2026-10-24

## Settled conclusion

**D1/D9/D10 sign parity IS independently CERTIFIED across 20 original JHora 8 charts, spanning all 12 ascendant signs.** The nine Vimshottari mahadasha lords and their 81 antardasha lords for each source chart match in order. This is a scoped certificate, NOT the same as asserting high-precision ascendant and exact calendar dates match.

Evidence: GitHub Actions run [40083090429](https://github.com/OverlorDDD/jyotish-studio/actions/runs/40083090429), `npm run jqa3:certify-signs` passed and full four-job CI passed. Raw JHora export, original JHora INI, binary hash and evidence hashes are pinned in `tests/fixtures/jhora-corpus/`.

## Why the original all-or-nothing gate caused repeated apparent failure

The first test implementation *gated even sign comparisons on attested Vimshottari year mode*. Those are separate propositions; this was incorrect. Fixed by independent sign-vs-longitude-vs-dasha statuses, with a source missing INI retained as diagnostic and excluded from the required comparable twenty.

All 20 real captures have compatible explicitly recorded astronomical INI profiles and recorded D10 (1–9). All pass D1, D9, D10 sign tests, nakshatra, pada, seven classical-planet retrograde states and twelve Parashari house-lord checks. Sign parity and dasha-lord sequence must not be blocked by an unrelated UTC-calendar year choice.

## Measured precision residuals (do NOT round away or weaken <=1 arcsecond threshold)

These are counted directly from original independent JHora values compared to independently executed Galaxiora/Swiss calculations in run 40083090429.

| Body | Within 1 arcsec | Largest absolute residual |
|---|---:|---:|
| Lagna | 0/20 | 18.5704 arcsec |
| Sun | 20/20 | 0.1704 arcsec |
| Moon | 18/20 | 1.0609 arcsec |
| Mars | 20/20 | 0.3330 arcsec |
| Mercury | 20/20 | 0.2483 arcsec |
| Jupiter | 20/20 | 0.5559 arcsec |
| Venus | 20/20 | 0.3643 arcsec |
| Saturn | 20/20 | 0.6395 arcsec |
| Rahu | 20/20 | 0.1432 arcsec |
| Ketu | 20/20 | 0.1432 arcsec |

Planets: **178/180 within 1 arcsec**, with two Moon cases up to 1.0609 arcsec, versus **0/20 ascendant** within 1 arcsec. The 20 real observed charts have **200/200 D1, 200/200 D9 and 200/200 D10 sign agreements** (10 bodies each), not the misleading pre-fix 0/20 profile-attested matches.

These lagna residuals are too systematic to dismiss as occasional rounding errors. Investigation should isolate *which ascendant convention or sidereal time/nutation definition JHora actually uses*. Swiss Ephemeris manuals distinguish house/ascendant calculations, sidereal time formulae, and sidereal algorithms. A true precision certificate must compare equivalent calculations, not merely loosen the threshold to 20 arcsec. This divergence does not by itself disprove the sign-level validity of the charts.

## Vimshottari calendar blockers: method, not lord sequence

All 20 original JHora INIs have `YearDefinition=0 3` and `YearLength=0 365.242500`. The INI field listing a numerical year length alone **does not attest** that selected year definition 3 uses that precise fixed-day calendar duration. Historical JHora calendar dates were compared as YYYY-MM-DD in UTC, whereas the external programme may use a year-definition/civil-calendar mode. In the 20 charts only **38/180 mahadasha starts** and **286/1620 antardasha starts** match the production calendar dates; that is strong evidence the date calculation conventions differ, not evidence the lord sequence is wrong. Do not label precise dates certified.

## Acceptance gates and finite next investigation

1. Existing sign-level gate, `npm run jqa3:certify-signs`, remains an independent PASS backed by 20 source charts. Full `npm run jqa3:certify` must remain strict.
2. Determine actual JHora `YearDefinition=3` mapping from its source/help or one controlled *actual JHora* experiment with independently recorded settings; test several first major/antardasha boundaries and align local date/UTC. Do not guess the code means 365.2425.
3. Determine physical ascendant convention by comparing two separate external algorithms under identical epoch, sidereal time, obliquity/nutation, and JHora configuration. Keep both raw observations and source formula. Do not modify production ascendant without proof.
4. Check 2 residual Moon cases at 1.0609 arcsec: likely extraction/rounding or library-version differences, but must confirm numerically; never simply adjust tolerance to force a PASS.
5. Only after exact-comparable high-precision and date checks pass, allow the full CERTIFIED status. Avoid reworking already certified sign logic.

A visual/navigation release is safe to pursue independently: sign parity and operational CI already pass; exact-arcsecond/date certificate is a separate optional claim that should not be implied by UI or marketing.
