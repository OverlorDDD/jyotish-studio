# N4 Next: Narrow Natal Release Candidate — one integrated engineering cycle

**Prepared 2026-11-07; PLAN ONLY. No code deployment, branch merge, AI activation, or claim of full N4 certification.**

## Problem and outcome

Existing real Galaxiora users see D1/D9/D10, have an unsafe default of Delhi / 2000-01-01 / 12:00, do not have an intuitive chart-by-chart exploration, and could be misled by the precision of D60 or exact dasha day claims. Meanwhile the research branch has 16-card exploratory UI and 169 changes relative to main, with unrelated homepage, SEO and style edits. Mathematics is independently accepted only **within methods**; physical production Lahiri and continuous D60 are not approved.

**Target this cycle:** one production-*candidate*, not an invented universal certificate: a clear UK/EN birth chart form and 15 non-D60 traditional divisional charts, source-bound physical validation, full data provenance and safe confidence labels, no regressions to live D1/D9/D10/Reader v6/SEO. An actual public release requires source-matched evidence, current-head CI and explicit owner approval. If either is absent, finish the cycle with a useful verified candidate and clear fail-closed no-deploy decision.

## Exact product scope (candidate)

1. No anonymous prefilled birth date/time/Delhi. Exactly three primary inputs: date, locally recorded time, verified chosen city. Require explicit user selection; manually entered IANA time zone + coordinates remain an advanced option with clear source/ambiguity warnings, no silent defaults. If time unknown, do not falsely construct houses, D60 or exact event dates; provide only time-insensitive information if separately supported.
2. Single D1 foundation chart; adjacent selectable D9/D10 and 12 further classical vargas: D2,D3,D4,D7,D12,D16,D20,D24,D27,D30,D40,D45. D60 is **not selectable, in the matrix, AI facts, or public claims** in the candidate. Explain why and retain the D60 research code separately. A notice may say D60 requires independently authenticated birth-time uncertainty and continuous physical bounds.
3. Keep D2 named **Sun/Moon Hora**, not JHora original Uma-Shambhu, unless an independent verified and explicit source-method selection changes this. No silent method switch, no copied JHora certification badge.
4. Compute the N4 additional charts in the **API** from the verified same physical D1 positions, attach a versioned explicit profile and tamper-evident binding to the same birth-chart verification digest; consume only server output and fail closed on mismatched digest/profile or missing data. Never present a client-only calculation under a false external certificate label. Public/Guest data exposure and analytics must not add raw birth data to logs.
5. UX: no repeated D1 panel when D1 tab selected, correct D1/D9/D10 before interpretive text, then user-friendly grouped charts by theme and actual placements; UK/EN polished, keyboard city picker, mobile 320/360/390/430 and OnePlus-class, no overflow, readable explanations and exact methodology/confidence label. No new homepage headlines, SEO canonicals, logos or metadata changes.
6. Vimshottari: **do not change production 365.2425-day duration in this candidate**, since JHora's `YearDefinition=0 3` and its exact subday boundary have not been attested. Keep existing period view explicitly marked as the **fixed-year convention**, NOT JHora-certified, and never call 1619/1620 evidence proof of current production. New true-sidereal algorithm remains research/opt-in shadow only until its exact method is independently attested. No unsupported day-specific life predictions.
7. AI: preserve Reader v6 exactly and N4 AI disabled in production. Deterministic chart explanation can use only verified body/sign/house facts and a finite traditional interpretation mapping; no fabricated events, medical/finance guarantees or D60. Any LLM N4 extension requires a **separate explicit** 48-output bilingual human editorial acceptance and feature flag approval, not automatic activation.
8. Supported civil-time scope: recorded, unambiguous clock inputs with verified IANA city lookup; gaps/folds reject or require explicit disambiguation with certified evidence. Before 1970 and other legal-history disputes: source-confidence warning or restrict exact time-sensitive features; IANA is not independent legal-time proof (https://www.iana.org/time-zones/theory). `verified_internal` never means `externally certified`.

## One engineering request: implementation and validation

Run as **one coherent engineering delivery** (not a sequence of escalating N4.19, N4.20 microsteps):

A. **Safe integration baseline:** fetch fresh main and PR #120. Work on a new isolated release-candidate branch based on main; selectively port only N4 core, API, verified UX and associated tests. The PR #120's 169-file diff is NOT to be merged wholesale. Preserve SEO/homepage/indexing, GA4, current favicon, Panchanga and Reader v6. No Docker, force push, broad rewrite or destructive prod clean.
B. **Independent actual production astronomy crosswalk:** use same method in the real `apps/api/src/ephemeris.ts`: Lahiri, apparent, mean node, SWIEPH flags, exact Swiss/ΔT correction profile. Compare source-authenticated **50 original JHora Lahiri-profile charts** (20 pinned JQA3 + 30 new generated *only if* automated genuine JHora GUI export is available; never replace with synthetic self-oracle). Demand 50 × 10 × 16 **8,000/8,000** sign checks on the *same* profile and physically precise Moon/Lagna within **1 arcsecond** on each case, with no silent D2 convention mismatch. Check D1 angular boundaries specially. If this genuine original-source collection is not available or discrepancies remain unresolved, do not label public N4 15 charts externally certified or authorize release. Older True Citra original50 cannot stand in for Lahiri.
C. **Implement a bounded server-side N4 contract:** immutable derivation, strong validation and server verification/traceability; old D1/D9/D10 digest and public API contract remain backward compatible. Exclude D60; hold dasha model and show method clarity.
D. **Implement the focused interface** without changing the root page's rejected branding/SEO copy or introducing 16th unlocked D60. Basic use first; technical method/source details accessible but not repeated. Preserve the local city after selection, optional explicit profile override when permitted.
E. **Automated acceptance:** exact method/profile source tests; 15 chart server/client parity; fail-closed tampered digest, boundary, historical gap/fold, unknown-time, unsupported profiles and AI-disabled tests; Next + Nest type/build, current main regression suites, UK/EN browser and 7 widths incl OnePlus, 12 synthetic reading fixtures for deterministic guidance, SEO canonical/robots/favicon spot-check, privacy/no DOB in telemetry. Check CI on the **exact release-candidate HEAD**, not an older branch commit.
F. **Output:** one clear release candidate SHA + PR diff only N4, method & confidence manifest, result matrix, blocked items, **one grouped Windows PowerShell verifier/deploy helper**, never a dozen manual commands. No AWS changes until independently green and owner explicitly permits that release.

## One-cycle fallback that still delivers visible progress

If the authentic **50-case Lahiri** M1 oracle or current-head CI is blocked by an external JHoraKit/JHora 8.0 GUI dependency, do not open N4.19 and keep changing arbitrary numbers. Instead deliver the **independent UX-only release candidate**: remove Delhi/2000 defaults, fix verified city controlled state and DST gap/fold error messages, improve existing D1/D9/D10 ordering, mobile overflow/accessibility, and make the real fixed-year Vimshottari method transparent. Keep the new 12 additional vargas, D60, experimental true-solar year and N4 AI off. This fallback modifies no astronomy or existing API digest and can proceed only with normal end-to-end/current-head CI and explicit owner approval. Its value is real user onboarding even without a fabricated mathematical certificate.

## Acceptance matrix (fail-closed)

| Gate | Required evidence to ship | If missing |
|---|---|---|
| M1 exact production Lahiri physical/profile parity | Authentic 50 original same-method cases, 8,000/8,000 mapped signs and Moon/Lagna <=1 arcsecond each; SHA pinned | **No public 15-card feature**; retain D1/D9/D10 and the verified UI shell in branch only |
| M2 time and D60 | Valid modern IANA unique case or individually proven historical UTC; D60 fully absent from public features | Reject ambiguous exact-time results, suppress D60 and uncertifiable claims |
| M3 dasha | No auto year switch; display explicit actual fixed-year convention and uncertainty | No claims of exact JHora transition dates |
| M4 product | Birth form no silent prefill; D1 no duplicates; grouped 15 chart UI, UK/EN and accessible mobile | No merge |
| M5 release | Tests, typecheck, Next/Nest builds, E2E mobile, privacy, SEO, actual green CI on exact SHA, owner approval | No AWS deployment |
| M6 AI | Reader v6 regression PASS; new N4 AI OFF pending separate 48-output editorial review | No new N4 LLM public responses |

**One request now:** user asks to implement this integrated N4 release-candidate work, including code+tests+checks+GitHub PR, without asking for tiny stage approvals. **Second request, only if needed:** user provides complete verifier output and explicitly authorizes production deployment *after* observed green gates. An independent JHora-50 source/CI blocker is a legitimate STOP condition, not permission to fabricate results. No guarantee that inaccessible third-party GUI evidence can be manufactured within two requests.

## Explicit out of scope

Universal historical legal time certificate; fully accurate D60 on arbitrary minute-precision birth; unlimited original JHora GUI collection; undeclared changes to production Vimshottari; new homepage design or SEO redistribution; unrelated SEO/Growth PRs; monetization and AI provider billing; claim astrology predicts scientifically verified outcomes.
