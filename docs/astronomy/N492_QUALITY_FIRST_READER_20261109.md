# Galaxiora N4.9.2 — meaningful 16-chart interpretation, authorial QA and release guide

Date: 2026-11-09. Objective: **meaning rather than word count**. The user explicitly rejected the N4.9 essay and N4.9.1 near-empty 15-card template. Do not add a duplicate global essay.

## Implemented — in requested order

1. Audit actual code behind the former hidden **«Поглиблене астрологічне пояснення — за бажанням»**: `apps/api/src/reader-narrative-v6.ts`, `interpretation-v3.ts`, `reader-classical.ts` already support verified natal house rulership, yogakaraka, basic Pancha Mahapurusha sign+house conditions, D1/D9/D10 and Mahadasha. Reuse these existing mechanisms instead of new bulk prose.
2. `reader-meaning-n492.ts` composes **exactly 16 thematic cards** in the fixed sequence D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60. Each uses actual D1 ruler, actual relevant varga, classical sign-dignity *where verified*, true functional yogakaraka, and topic-specific concise meaning. **D1 is never presented as a separate comparison with itself.**
3. A second D chart is referenced only when its sign evidence supports or contradicts a specific same-planet indicator. An empty crossover is omitted — no mandatory irrelevant cross-references.
4. D60 is last **in the same card grid, same heading/evidence disclosure**, showing all nine original calculated planetary signs with boundary indicators. Individual D60 ascendant and houses are NOT birth-time-certified; HH:MM entry alone is not a certificate. Missing or approximate time avoids personal high-varga conclusions without blocking D1–D45.
5. One short whole-chart conclusion immediately **after** D60: most salient traditional support (when present), one concrete concern or conditional limit, and a cohesive statement linking lagna, career and partner indicators. It MUST not become a duplicate essay.
6. Previous hidden editorial panel is not rendered when N492 is available; its stronger authored rules remain a source of deterministic text.
7. API `presentationEdition=n492-evidence-prioritized-16-varga-v1` and runtime/cache version gate prevent stale saved reports from masquerading as the new edition.
8. QA: 30 invented synthetic horoscopes × Ukrainian and English (60 complete full reports) are preserved in the `n49-24-full-readings-and-evidence` GitHub Actions artifact under `n492-60-complete-synthetic-readings.md`. Their outputs are manually examined with targeted examples (Cancer lagna, Virgo lagna, Aries lagna, Pisces lagna). CI additionally tests 12 real-native Swiss *invented birth inputs* × UK/EN, Windows, Linux, prod Next/Nest, 16-card Chromium real API UA/EN at 320–1440 pixels and SEO/D60 old regressions.
9. Safe AWS operation: `tools/n492-aws-release.sh` with pinned SHA, check exact remote ref, clean tracked repo, ancestor validation, restricted .env backup, tests, npm build, restart, site:check, launch:verify, public UA/EN POST /reports checks for 16 ordered cards and 9 D60 signs; rollback attempts to previous Git commit upon failure; **no Docker, no migrations, no reset --hard, no git clean**. Validate `bash -n` plus `n492-aws-release-contract.test.mjs`.

## Independent editorial acceptance rubric (not merely green CI)
- **Factual faithfulness:** no invented planetary sign, ruler, house, exact life event or unsupported historical quotation.
- **Classical differentiation:** proper special status (e.g. Cancer ascendant ⇒ Mars lord of 5 and 10); own / exalted / debilitated sign assessment recognized but not mistaken for full strength or neechabhanga.
- **Personal meaning:** text says why the particular configuration matters for the named topic, rather than merely listing D1 and Dn codes. Avoid forced 1:1 matching of different divisional house numbers.
- **Relevance:** only meaningful cross-chart comparison is shown; title matches traditional Dn focus (D12 parents, D40 maternal lineage, D45 paternal lineage).
- **Ukrainian language:** correct planet-name cases, zodiac locative forms, punctuation, no unidiomatic filler or developer jargon.
- **Clarity/length:** one substantial compact card per D, one short coherent takeaway after D60; calculations and reading limitations behind disclosure.
- **D60 honesty:** visible real signs and uncertainty, never personal D60 houses or confident karmic claims.
- **Distinctness:** many different birth sources yield materially different outputs, including not just different names/numbers, but special ruler/dignity outcomes.
- **Visual and access:** no horizontal overflow at 320, 360, 390, 430, 768, 1024, 1440 px, keyboard accessible source details.
- **Release:** exact SHA all CI success, public runtime edition and real sample report contract verified.

## Limits / non-claims
No independent complete classical human Jyotish certification, Shadbala/Vimsopaka, combustion/cancellation and all historical yogas. Synthetic test charts and native Swiss parity prove certain mathematical and mechanical facts, not predictive truth or subjective 10/10 quality. Review of generated text identifies and corrects obvious editorial errors, but cultural and practitioner-level validation is still necessary.

This is a separate **draft** PR (N492); the previous N491 production may remain active until the owner manually executes its verified pinned-SHA AWS release. Never claim GitHub success equals production success.
