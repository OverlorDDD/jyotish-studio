# N6.3.1 — Full Varga Intelligence / release plan

Baseline: production N6.2, merged SHA bc778256c4063ebb52077faeb5a42421efa63413. Extend PR #236 rather than deploy two overlapping releases.

## Execution and gates

1. Preserve N6.3 evidence-only input and anti-copy validation; do not replace ephemeris, D1/N4 or source integrity.
2. Enumerate every verified varga and every graha; select two topic-relevant factors per division using natal lord, natural indicator, thematic house/ruler, dignity contrast and sign repetition. Rank is an editorial selection rule, not full planetary strength. D2 is Sun/Moon Hora only. No node dignity. No newly invented divisional aspects, combustion, Shadbala, cancellation or event rules.
3. Compare D1 to ordinary vargas, retain at most two repeated/contrasting patterns. D9/D10 and at most two other relevant vargas for the actual major/minor rulers, using the same date as the Reader. Keep exact/approximate D60 separated: all nine signs inspected when eligible, near-boundary signs excluded from interpretation, at most three conditional sign comparisons. No D60 houses/ascendant, no independent birth-time proof, no D60 mandatory AI gate.
4. Send compact localized evidence, not classical prose. Preserve per-chapter evidence allowlists and recovery; add a required primary comparison for thematic chapters while secondary evidence remains optional. The LLM cannot prove semantic correctness merely by citing an ID; manual editorial review remains required.
5. Invalidate cached/saved reports (n6-quality-4); keep reader wire version. All 16 calculation tables; D1/D9/D10 detailed original columns, other vargas actual supplied sign/house/boundary, D60 provisional.
6. Regression: 60 synthetic fixtures × two languages, full chart coverage, 9-body selection, exact data mapping, tampered source rejection, no approximate D60 even if full chart supplied to brief, bounded context. CI for API/Web, browser all 16, independent arithmetic comparisons.
7. Preview both actual configured free providers individually with synthetic charts on isolated Oracle API (news ingestion off); inspect eight chapters, provenance, originality, no invented placements, no D60 leaks, timing and full browser table. Do not merge/deploy on unit tests alone. Editorial review on at least three different chart patterns, including the user's real private chart only in their browser. No raw private chart logs.
8. Merge exact green candidate, verify merged tree and actual active API/Web paths, release API+Web once, bounded systemd operations, preserve static Web unit and expected dependencies, rollback on real version/health failure. No Docker, migration, provider quota increases, news changes or OpenRouter enablement. Production smoke both languages and both precision modes. User acceptance of real output separate from mechanical acceptance.

## Blockers

- Input token/rate budget: select compact facts, avoid dumping 144 placements or requiring every optional fact. Actual Groq and Gemini acceptance is a blocking check, not inferred from mocks.
- False certainty: D1/Dn derived from same inputs, not independent observations. D40/D45 thematic interpretations remain editorial extensions. Near-boundary high vargas are not proof of stability.
- Concurrent releases: verify exact main ancestry and active releases; never overwrite unrelated changes.
- Legacy reader phrases: source comparison rejects near copy; no claim automated semantic or historical certification.
- D60: fixed sign arithmetic only, not birth-time rectification. Approximate request must not send D60 evidence, even if charts remain visible as provisional calculations.
