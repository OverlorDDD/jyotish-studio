# N4.9.3 — Quality-focused Jyotish Reader: substantive evidence before prose

**Owner feedback:** prior N4.9.2 version was independently rated 4/10. It listed correct planetary locations, yet failed to tell a new visitor what was distinctive about their chart. A mechanically longer or "green tests" response does not solve this.

## Source-backed analysis (November 2026)
1. BPHS, chapters 6–7: vargas refine a distinct domain and sign/house derived positions alone do not certify a human life event. See https://vedpuran.net/wp-content/uploads/2021/04/brihat_parashara_hora_shastra_english_v.pdf and https://epandit.in/en/learn/varga/shodashvarga.
2. *Brihat Jataka* X.1 explicitly considers the tenth from ascendant, Moon and Sun and navamsa lords for occupational reasoning. Source: https://karmasakha.com/texts/brihat-jataka; traditional print (public-domain historical document): https://www.wilbourhall.org/pdfs/brihatjataka00varaiala.pdf. Our N493 implementation tests *tenth SIGN* from Moon and Sun. It does **not** claim a complete BJ X.1 profession certificate or provide a specific job prediction.
3. Existing verified Galaxiora D1 rules include classical sign rulers, whole-sign houses, sign dignity, kendra/trikona yogakaraka and sign/house Pancha Mahapurusha conditions (`packages/jyotish-core/src/rules.ts`, `apps/api/src/reader-classical.ts`). Avoid claims about degree-specific Shadbala, combustion, retrogression effects, cancellation or aspects until implemented and independently cross-checked.
4. Same planet and sign across D1/D9 (vargottama) is a real equality of two derived positions, **not an independent second source** or proof of future benefit.
5. D60: nine input-longitude-derived planetary signs are exposed, *not* person-specific birth-time-stability or house/lagna certification; no karmic-event claims. A recorded time to the minute is not time rectification.

## Why the previous engine failed
- N492 used one fixed natal house lord per thematic division, plus universal filler. It omitted or ignored important independent indicators.
- N493 first revision correctly selected richer source facts but still repeated the sentence equivalent of "two different contexts" 620 times across 80 full sample reports. This was discovered by reading the **real saved QA text artifact**, not an isolated source-code style check.
- The new `reader-prose-n493.ts` removes that phrase entirely and authors separate D2/D3/D4/D7/D9/D10/D12/D16/D20/D24/D27/D30/D40/D45 readings in both languages; D1 describes the primary chart (not D1 versus D1), D60 remains a conditional final card. Further proof is stored separately, not dumped into front-facing prose.

## Evidence engine
`apps/api/src/reader-evidence-n493.ts`: choose 3–5 ranked chart-specific patterns from verified source facts. Priority is editorial relevance, **never a probability or percentage**. Candidate classes:
- rising-sign lord, Moon and lived-domain distinction;
- D1 tenth-house ruler, conditional yogakaraka and verified D10 sign/house;
- natal seventh/eighth lordship and D9 relationship role;
- natal debilitation with explicit unresolved cancellation/degree-strength checks;
- multiple classical grahas in one whole-sign house, not fabricated degree conjunction;
- native Vimshottari major period (as-of time, not prophecy);
- high-confidence own/exalted natal sign, explicit actual lordship;
- matching D1/D9 sign (vargottama), one sensitive same-planet phenomenon;
- Pancha Mahapurusha **sign/house condition only**, not full strength.

No generic "everything is favorable" score; no automatic conversion of absence of positive support into a negative claim. Source validation is fail-closed and the main published text may not invent biographical details.

## UX
- First: 3–5 high-salience personal patterns, short why/meaning and collapsible evidence.
- Then: exactly sixteen topic-specific D-cards from D1 to D60, with actual second **different** graha. Legacy hidden verbose editorial appendix stays hidden in the new Reader.
- End: one restrained synthesis of career capacities, personal rhythm and partnership, plus a concrete uncertain factor when actually computed.
- D60: same card UI, nine visible signs, near-boundary warnings and no D60 individual houses.
- Saved/browser/API edition gate `n493-ranked-evidence-16-varga-v1` prevents cross-version mixing.

## Acceptance gates
1. Unit and 80 complete synthetic bilingual outputs: 16 cards, 3–5 patterns, fact evidence for each, no repeated empty comparator, two distinct grahas on D1–D45, no phantom D60.
2. 12 true native Swiss control charts in UK/EN through real HTTP; CI Linux and Windows; full Next/Nest build and no SQLite/DB state.
3. Real Chromium UA/EN screenshots at 320/430/1440 and no overflow at 320–1440 px; same D60 at last position, short conclusion after.
4. Preflight before any AWS release; pinned exact SHA, no Docker, fail on dirty tracked server state, rollback attempts and public API smoke. Production remains unchanged until user executes deployment.

## 9/10 is a human quality goal, NOT a test label
The tests prove reproducibility, evidence integrity and that known boilerplate defects do not recur. They do not prove the text is 9/10 or scientifically predictive. Final quality needs independent professional Jyotish review, verified classical reading rules (including cancellations, drishti and full varga strength), and user comprehension trials. If any draft still looks like a technical ledger, it is not accepted as a 9/10 reading merely because CI is green.
