> **SUPERSEDED 2026-11-07:** This is the archived initial separate-D60 design draft. The approved implementation moves D60 into the SAME 16-card Explorer, uses only an inline missing-minute warning next to the birth-time field, and closes D60 method-scoped mathematical certification. The current authoritative report is [N4_D60_CLOSED_AND_NATAL_SEO_UX_RC_20261107.md](./N4_D60_CLOSED_AND_NATAL_SEO_UX_RC_20261107.md). Do not revive the separate D60 panel or claim individual time accuracy from HH:MM alone.

# Galaxiora D60 (Shashtiamsa) — method-scoped mathematical certification + release roadmap
**2026-11-07 · Draft PR #143 targeting draft RC #142 · NO AWS / production deploy**

## What is mathematically in scope?

D60 (Shashtiamsa) divides each D1 rashi into **60 sections of 0.5°**. The selected method is `JHora8-Traditional-own-rashi-inclusive-D60`: count the selected segment inclusively from its occupied D1 sign. The different Aries-first/literal BPHS sign convention exists; it MUST NOT be mixed with the method shown in Galaxiora. We don't use AI to calculate signs.

Prior independent original JHora8 50-case original GUI source has **500/500 D60 sign matches** on pinned birth longitudes, `D60='Trd'` under original True Citra/true-position profiles. This independently certifies the selected **symbolic transformation of a given longitude**, *not* a real birth's civil time or Lahiri sky positions. A separate `tools/n4-d60-pyjhora-parity.mjs` drives **PyJHora==4.8.7 chart_method=1** with 50 synthetic D1-input cases, 500 symbolic D60 sign and 450 independently checked houses, including inputs near sector boundaries. Its actual success must be confirmed by GitHub Actions before counting it.

Production-path `runCalculation` first verifies current Swiss-derived D1 using `jyotish-integrity-v3`, then attaches `n4D60` separately. `n4D60` is **not** part of the existing 15-varge verified annex, leaving the previous contract and Reader v6 untouched. The client validates source digest, 60 parts, all 10 positions, exact method and prohibitions before display.

## Critical distinction: birth time known to minute vs birth time accurate to minute

A `HH:MM` input is just a text representation. Even a document stamped to the nearest minute does not prove seconds, absence of hospital rounding, location accuracy, DST legal provenance or stability of the **D60 Lagna**. The UI asks for source quality:
- `unknown`: D60 hidden; explain missing or unverified birth-minute precision.
- `approximate`: display nominal D60 **planetary signs only**, no Lagna/houses or confidence flag.
- `recorded_minute`: show the **provisional nominal D60 chart** and planetary signs, with an explicit warning that Lagna and houses are **not stability-certified for even ±30 seconds**.

This is stricter than merely checking whether a two-digit minute field exists, because that field always exists in the current browser time control. Do not infer a documented exact minute from field formatting. No global accuracy badge or AI karmic interpretations from this annex.

### Why this matters: real original 50-case native Swiss diagnostic

In N4.14 user-private 50 original synthetic JHora-aligned cases, native SWIEPH reported D60 Lagna sign changes in:
- **11/50 at ±15 seconds**;
- **25/50 at ±30 seconds**;
- **46/50 at ±60 seconds**;
- **50/50 at ±120 seconds**.

These are **sampled observations, not population probabilities**. Dense second-by-second samples, even 125ms refined crossing brackets, cannot alone prove **continuous no-crossing guarantees**, and this research used fixed offsets, not legal birth records.

## Strict certification result matrix

| Layer | Target | Result / gate |
|---|---|---|
| D60 symbolic Traditional method | Original JHora8 50-case sign reference | **500/500 scoped research PASS** |
| D60 symbolic independent PyJHora | 50 fresh synthetic cases, 500 signs and 450 houses | **Mandatory CI; PASS only after observed job** |
| Source geometry for active birth | Current verified Swiss Lahiri D1 source | **Internally verified, not same-case JHora individual proof** |
| User's birth moment accurate to ±30 sec | Independently attested clock/tz/coordinates | **NOT CERTIFIED** |
| D60 Lagna/houses stable throughout uncertainty window | Independently verified continuous Swiss longitudes, including all stationary points, wrap and Lagna | **NOT CERTIFIED** |
| D60 named amsa/deity interpretive rules | Per-source and method review | **NOT PART OF THIS PR** |
| Public AI/new deterministic text | Verified 16-varge rules + 48 bilingual reviewed readings before enabling | **OFF** |
| Production merge/AWS deployment | Full green CI + user approval + release-specific restrictions | **NOT AUTHORIZED BY THIS PR** |

### Security/privacy

Do not log raw birth moments and coordinates in analytics. Never commit private JHora raw data, owner birth details or Swiss assets. The source-derived D60 candidate explicitly sets `continuousTimeStabilityCertified:false` and `d60HouseInterpretationEligible:false` and the browser rejects any response trying to claim `true`. The drawn nominal North Indian chart is visibly **provisional**, not an accepted house-based reading.

## Confirmed next steps — do not lose these stages

1. **Current: D60 method/UX release candidate.** Confirm exact HEAD GitHub CI and browser pass for UA/EN, 320–1440 px, negative digest / unsupported method. Mathematical symbolic certificate is distinct from birth-time conditional confidence. PR #143 stays draft and has no automatic merge.
2. **Next (OWNER REVIEW): SEO-friendly and beautiful natal UX concept**, bilingual user-first navigation for all **16** cards, D1 foundation, grouped D-cards and D60's explicit confidence state. Include natural-language keyword research, structured data, mobile navigation, readability and useful personal guidance; do not stuff keywords or change root canonicals without a reviewed plan. Present a design/SEO proposal **before** its production implementation.
3. **After design approval: deterministic local Reader v6** integrates the verified method-specific D2–D60 symbolic chart facts, with chapter structure, traditional source mapping, boundary confidence and no D60 houses when birth time uncertain. Deterministic logic, not an unreviewed random reading.
4. **Last: optional AI interpretation** only from the server-attested exact natal snapshot and allowed confidence flags. Human review of **at least 48 bilingual outputs** with invalid D60-source tests, no fabricated positions, no unverifiable exact event outcomes. Enable only by separate approval.

**This PR neither releases D60 nor silently expands Reader v6 / AI.** The user-defined sequence remains D60 → UX/SEO approval → Reader v6 → AI.
