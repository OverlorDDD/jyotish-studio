# N4.9.1 — Restore short, meaningful D cards; show calculated D60
**Date:** 2026-11-09 | **Release basis:** N4.9 production commit `f248bfdd85f89261031591ce15118b42aa2b82a0`.

## Owner feedback that controls acceptance
The former "one portrait / five narrative threads / global conclusion" creates a lot of text without meaning. **Remove it from the reader UI, not replace it with another essay.** Return to fifteen topic-specific D cards. In each card, say only what that card's actual natal ruler and divisional positions justify; use a carefully chosen related D chart to refine the same planet's reading. Make hard evidence optional, not a wall of technical IDs.
D60 must show **the actual results of entered birth parameters**, not only a cautious boilerplate statement. Show all nine computed sign positions, including any near a boundary, while clearly indicating what cannot be certified.

## Changes and scope
1. Render no `reader-v8-synthesis`, five N49 threads, or three redundant lead cards. Preserve existing D1–D45 topic categories, concise intro, and original div-chart explorer.
2. Calculate fifteen compact card details in `apps/api/src/reader-compact-n491.ts`. Every detail has its D1 natal ruler, D1 location, same-planet Dn location, fixed topic-appropriate cross-varga and exactly enumerable evidence facts. Degree/method/strength not proven => no categorical forecast. Unknown dignity => no made-up negative claim.
3. D60: `buildD60Preview` requires original `jyotish-integrity-v3` and matching D60 source digest/algorithm flags. Expose nine named sign pairs. Do not drop a computed planet merely because its sign is near a D60 30-arcminute sector boundary; label as near boundary instead. Highlight three roles selected by the **actual D1 ascendant, tenth and seventh house lords** when their D60 placements are away from the boundary. No D60 natal Lagna/house claims: HH:MM alone is not a time-stability certificate.
4. Keep transparent source-rule IDs and D1/Dn proof behind a single `details` disclosure per card; do not send the lengthy old integrated narrative to the cloud prompt.
5. Add `presentationEdition=n491-compact-cross-varga-v1` to public API and local preview; an old saved report must never be re-used as a new visual report.
6. Build API/web, 24 synthetic seeds x UK/EN, twelve full real-native-Swiss input vectors x two languages, real Chromium UK/EN browser screenshots and responsive 320–1440 px, D60 near-edge/missing-verified flags and existing regression jobs. No AWS deploy without exact-head green CI and owner review.

## One concrete example of required output (pattern only, not a birth claim)
If the D1 tenth-house ruler is Mars in the ninth house and D10 puts it in the sixth, the career card can connect **learning/worldview** to **daily practical work**. D24 should then show what the same Mars actually does in the education chart, rather than claiming a profession without evidence. A particular sign dignity is a conditional traditional indicator, not full Shadbala.
Likewise D9 can cross-check the same seventh ruler in D7; D27 relates to D30; D4 to D12. Do not emit a duplicate general portrait above the cards.

## Source/method boundaries
- *Brihat Parashara Hora Shastra*, ch. 6, 33–41 (D60 parts of 0°30′, as cited in historical editions): https://www.horasad.com/download/ebooks/BRIHAT_PARASHARA_HORA_SHASTRA_1.pdf
- BPHS ch. 6–7 divisional source/method and high-varga accuracy: https://epandit.in/en/learn/varga/shodashvarga
- Source-matched internal D60 JHora/PyJHora test cases cover mapping of **given physical longitudes**, not individual's exact birth-time stability. D60 lagna/house reading remains disabled.
- Never replace incomplete classical source verification with invented "99% accurate" scores or guarantee birth-event/personality truth.

## QA gates (must be exact-head)
| Check | Required |
|---|---|
| Reader UI no N49 essay | 0 old synthesis, 0 old leading highlights, 15 short personal D cards |
| Cross-varga correctness | Every Dn connection linked to same natal planet in D1 and the selected companion chart |
| D60 completeness | Exactly 9 computed graha sign pairs including ones near D60 boundary; mark sensitivity |
| D60 uncertainty | No false interpretation if approximate minutes were explicitly marked |
| Existing feature safety | 16-chart explorer and D60 method gate, UK/EN SEO, responsive layout, no horizontal scroll |
| Build and release | API/Next prod build PASS, no bypass of GitHub CI, no database migrations or Docker |

**No claim of external human astrologer certification** is made by these automatic tests. An owner may supply an anonymized actual reading for qualitative review after deploy.
