# Galaxiora A9 — verified astronomy, private continuity, Tarot integrity
Status: IN PROGRESS — 2026-10-24
Priority: A9.0 first; A9.2 and Tarot Quality in same integration release. A9.1 planned after source accuracy gate.

## Product direction
**Galaxiora Personal** is an approved future product: authenticated personal daily Jyotish space (current dasha, verified gochara, 7/30-day calendar), tied to saved natal chart, Tarot journal, mindful practices and bilingual Ukrainian/English narratives. No unverified or synthetic astrology may be labelled live personal forecast.

## A9.0 — JHora numerical acceptance and release reliability
Problem: Genuine independent original JHora exports exist (20 original saved INIs, 12 Lagna signs) but do not prove 20/20 Galaxiora numeric equality. Original evidence was mishandled by Windows Git line-ending conversion; dasha year mode was not separately attested.
- Lock original `capture.json` and raw clipboard bytes with Git `-text`; preserve pinned SHA-256.
- Run all JQA-3 fixture integrity checks on Windows and Linux; no special test skips.
- Audit same-profile (ayanamsa, mean nodes, D10 1-9, ephemeris, ascendant and dasha-year) numerical differences per recorded JHora chart.
- Report every planet's angular deviation, D1/D9/D10, nakshatra, pada, retrogrades, house lords and dasha dates separately, with method-difference vs true calculation error clearly distinguished.
- **Acceptance**: 12 chart/lagna coverage; all comparable original captures 10/10 on required categorical outputs and target <=1 arcsecond when independently reproducible. Dasha 9+81 only if JHora settings attested; otherwise flag `NOT_CERTIFIED` and do not make parity claims. All CI jobs PASS.
- **Blocked**: `CERTIFIED` is forbidden while JHora dasha year/ephemeris profile or per-chart numeric parity is unverified. Do not edit reference values to make CI green.

## A9.2 — private journal & practice history
Problem: the user receives a good reading but has no continuous private reflection and practice log.
- User-owned `PersonalJournalEntry` tied to authenticated account. Plain notes link to `TAROT` draw, `CHART` saved chart or `PRACTICE` catalogue slug; server checks ownership for every linked reading/chart.
- Create/upsert, list, remove; limit 2000 characters and bounded pagination. No AI provider receives journal text.
- Small practice-completion event record with explicit voluntary action, not automatically triggered merely by reading safety instructions. Only the four published practice slugs accepted.
- Private UI: note editor in Tarot results, diary and completed practice history in Account, optional completion button in yoga. UA/EN.
- **Acceptance**: ownership/cross-origin, invalid references, delete, rerun, quota and DB migration tested. No public PII or accidental guest persistence.

## A9-Tarot Quality v1 — light evidence audit
Problem: an opt-in LLM answer may sound polished but ignore the actual draw, positions, or reversal states.
- Retain deterministic Reader interpretation as reliable fallback.
- For every AI card paragraph, require an explicit anchor to its **actual card or position**, and detect unsupported added cards or contradictory orientation where reliably identifiable.
- Fail to local Reader on missing/verifiably wrong evidence; do not silently display an ungrounded LLM result.
- Test: one/three/Celtic Cross, mixed reversals, invented cards, wrong positions, missing paragraph, short answer and safe fallback; UA/EN voice preserved.
- **Acceptance**: zero accepted AI readings with proven invented card IDs or position mismatch; no extra paid API calls and no regression in validated output.

## A9.1 (NEXT — approved, not built in this release)
Personal dashboard based on a saved verified chart, computed natal/transit positions, selected date, Mahadasha/Antardasha, 7/30 day calendar. Integrate journal and yoga; local deterministic fallback. User should be able to return daily. No new cloud cost without explicit consent. Requires A9.0 sign-off before personalized time-dependent interpretations.

## Exclusions
Public payments, community/forum, subscription checkout, push notifications, paid cloud providers, guessed JHora certification, massive refactors and legal production launch work. Preserve existing Reader v6, original chart UX and Tarot classic pictures.
