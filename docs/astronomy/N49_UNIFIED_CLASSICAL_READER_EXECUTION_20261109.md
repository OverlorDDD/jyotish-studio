# Galaxiora N4.9 — Source-linked natal synthesis and interpretive reliability
**Date:** 2026-11-09. **Baseline:** deployed N4.8 `0d0cda1471b7c242f50fc1902d4faf843ed80ce1`.
**Release policy:** separate PR, no automatic merge, no AWS deployment, no changes to Swiss/JHora, D1/D9/D10 or D60 formulas.

## User intent and acceptance model
The birth timestamp/time zone/coordinates produce Swiss-Lahiri planetary longitudes and D1. The same verified D1 positions feed the *same* 15 Dn charts, not independent generic prompts. The output should have a whole-life opening, a coherent causal/conditional path (D1 → D9/D10 → other divisions), explicit supporting and contradictory facts, and a traceable proof for every material statement. UK/EN prose must read as real paragraphs, never as a random inventory of charts or fake categorical life predictions.

**Key distinction:** accurate chart arithmetic, provenance to a historical *rule*, and the truth of an autobiographical life reading are three independent questions. Do not claim scientific proof of astrology, a historic quote where only a modern extension exists, full Shadbala, or external 50-case certification based on synthetic tests.

## Research and authority levels
1. **Primary original-text check:** Varahamihira, *Brihat Jataka*, X.1 (Sanskrit and English at https://www.siva.sh/brihat-jataka/10 ; alternative public-domain edition in repository research-library). Read the 10th from Lagna and Moon first. If there is no classical planet in either, evaluate navamsa dispositors of 10th lords counted from **Lagna, Moon and Sun**. Do not silently omit the Moon/Sun branches or apply a fallback without its condition. X.2–3 discusses occupational symbolism, not modern job-title guarantees.
2. **Varga scope:** *Brihat Parashara Hora Shastra*, chapter 7 verses 6–10, https://www.siva.sh/brihat-parashara-hora-shastra/7/6-10 , distinguishes a chart placement from Vimsopaka strength and further evaluation. A sign dignity (own/exalt/debilitation) is **not** a complete planetary strength certification; absence of a positive marker is not a negative.
3. **Our source evidence:** `apps/api/src/reader-classical-n44.ts` historical OCR excerpt register has exact local line anchors, but the scan and Hindi/Sanskrit translations are not all independently validated. Mark direct D1 rule vs modern Dn extrapolation and keep these statuses visible.
4. **Engineering oracle:** D1/D9/D10 physical JHora corpus and PyJHora math checks remain method-scoped. Internal Dn source-digest verification is not a birth-time certificate. Do not promote provisional D60 to an individual life-event claim.

## Implementation phases and gates

### N49.1 — Input/provenance contract (implemented)
- Preserve exact `jyotish-integrity-v3` and `verifiedVargaSource` validation.
- Construct `N49Link` from **the same** D1 house lord in D1 and each of 15 checked Dn maps; record verified sign/house evidence, direct versus extension rule IDs.
- Never expose birth date/time/place/coordinates in this new output. No raw longitudes or private birth identifiers in prompts or analytics.
- Exclude D60 from unified conclusions; retain old guarded D60 panel independently.

### N49.2 — Classical vocation correction (implemented, needs CI verification)
- Use occupied 10th house from Lagna or Moon as primary, count from each origin as whole signs.
- If unoccupied by seven classical planets, calculate three exact navamsa dispositor alternatives for the 10th lords from Lagna, Moon and Sun. No fabricated occupation or deterministic employment claim.
- Regression: cover occupied and unoccupied variants and exact underlying D1/D9 evidence.

### N49.3 — Contradiction-safe cross-chart reasoning (implemented, needs CI verification)
- Each link classifies ONLY sign dignity as `reinforced`, `contradictory`, `cautious` or `unresolved`.
- Do not invent points, percentages, auspicious conclusions from missing data, or declare one good Dn enough to override a counter-indicator.
- This is a bounded, transparent **modern thematic reading**, not a new ancient mathematical scoring system.

### N49.4 — Final reading UX (implemented, needs manual editorial acceptance)
- A contiguous five-part path: D1 rising ruler/Moon → professional D1/D9/D10 and 10th-from-Moon/Sun → D1 seventh lord/D9/Venus → source-linked opportunity → source-linked tension.
- The text includes actual per-chart planets, signs, houses, and guarded contradictions; a single concluding paragraph explains remaining limits.
- Each section has disclosure for machine facts and historical-source IDs, including explicit distinctions between direct natal methods and modern Dn extension.
- Original 15 detailed theme stories remain below, along with current D60 restrictions.
- Edition marker `n49-unified-evidence-v1` prevents old saved reports being accepted as new, and the API version prevents mixed web/API releases.

### N49.5 — Automated release safety (implemented, must PASS on exact head)
- `tools/n49-unified-synthesis.test.mjs`: 18 synthetic longitudes × UK/EN, 15 exact D1→Dn links, conservative polarity, distinct full stories, professional X.1 fallback, no birth metadata, no D60 leakage, forged-digest rejection.
- In PR CI: N44 classical, N47 D60 synthesis, N48 editorial, live synthetic Swiss HTTP, D1/D9/D10 and D60 contracts, full Nest/Next production build. Any failure blocks merge/deploy.
- Use *one* PR and review its exact-head CI; do not replace historical checks or silently use test mocks as independent source certification.

### N49.6 — Human and external release acceptance (OPEN, explicitly NOT certified)
- Read **12 distinct real-method synthetic** reports in Ukrainian and English with a qualified human Jyotish reviewer; manually verify at least 10 significant statements per report against raw facts, classical rule/verse, and modern-extension labels. Also review contradictory career/relationship cases and 320px/360px mobile.
- A real user's actual report remains private; owner can opt in to checking its exported evidence. No assumption that user's personal reading has been verified.
- Full Shadbala/Vimsopaka, combustion, aspects, yoga prioritization and whole-life probabilistic claims are **not** implemented by this PR. They need separately pinned methods, independent source comparisons, named assumptions and tests before use. Dasha time-model certification remains separate.
- The 50 same-method authenticated original-JHora external cases are a distinct unresolved mathematical release gate. Do not say N49 passes them because synthetic N49 tests pass.
- **Merge / AWS:** no automatic deployment. Require passing exact-head CI, human review, resolved external mathematical gate where applicable, owner decision, and a safe backup/rollback plan.

## Reviewer test matrix
| Property | Mechanism | Stop condition |
|---|---|---|
| Every N49 planet/house stated in text | Compute from same verified D1 and Dn | mismatch or unverifiable fact |
| Cross-chart contradiction | `n49Polarity` from two calculated sign dignities | contradiction hidden or invented full strength |
| Historical profession rule | three-origin BJ X.1 fallback with occupation gate | fallback on occupied tenth; Moon/Sun missing |
| Birth confidentiality | serialized N49 graph contains only derived sign/house metadata | birth coordinates/date/name present |
| Old reports | `n49-unified-evidence-v1` in client accept/reload | stale N48 text accepted as N49 |
| Browser/mobile | existing N4.8 layout plus new five-thread presentation | clipped text, duplicate synthesis, lost accessibility |
| Production safety | PR only, no apply on running EC2 | AWS mutated without verified release |

**N49 is not a reason to make categorical life predictions.** Precise astronomical calculation is measurable; tradition-specific interpretive confidence depends on explicit validated assumptions.
