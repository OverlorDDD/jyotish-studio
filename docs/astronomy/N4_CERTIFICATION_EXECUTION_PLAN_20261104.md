# N4 independent verification & regression acceptance — execution plan, 2026-11-04

**Branch** `feat/n4-shodashavarga-foundation`; **PR** #120 (draft). **Never merge or AWS-deploy without explicit owner approval.**

## Acceptance gates, in order

**G1 — Mathematical integrity (internal).** Run pure N4 engine on 50 deterministic synthetic sidereal-longitude profiles × 16 vargas × 10 positions. Each varga sign is 1…12 and each equal-house position is 1…12; legacy D9/D10 mapping must agree with the current production formula across ≥20,000 positions. An internal PASS is **not** an external certification.

**G2 — Independently executed PyJHora 4.8.7.** `N4 Independent PyJHora 16-Varga Parity` installs externally maintained pinned PyJHora with the explicitly chosen algorithms. `tools/n4-pyjhora-oracle.py` computes **8,000** target signs from the **same original sidereal D1 longitudes** as Galaxiora; `tools/n4-pyjhora-compare.mjs` compares all signs, logs method and failing chart/bodies, and refuses an incomplete or mismatched corpus. Fail on **any** unexplained mismatch or Python/tool failure. The result must be a real GitHub Actions run with `N4_PYJHORA_PARITY_PASS`. PyJHora is GPL and kept solely in the isolated CI process, never bundled into Galaxiora.

**G3 — Real JHora 8.0 (distinct from G2).** Use an installer from P.V.R. Narasimha Rao's publisher-owned `vedicastrologer.org` domain only, not unauthenticated third-party reuploads. Capture 50 *synthetic* birth profiles in genuine JHora 8.0 under a pinned `jhora.ini`, original JHoraKit clipboard export, SHA-256 provenance and complete 16×10 mapping; then `tools/n4-jhorakit-import.mjs` plus `tools/n4-external-varga-gate.mjs` must PASS with zero unexplained sign disagreement. A JHoraKit public example **alone** is only **one** legitimate source example with different profile settings, not this gate.

**G4 — Regression and browser acceptance.** Full `Jyotish Core CI`, `test:all`, `npm run test:n4`, canonical Next.js/NestJS production build, SEO indexability/hreflang, public/private isolation, mobile 360px chart explorer, accessibility and Reader v6 report/digest parity. Re-check current HEAD SHA rather than a cancelled or older run.

**G5 — Human release acceptance.** Request **one** final Windows user-local E2E only when G1–G4 are green. Merge and deploy only on explicit owner approval.

## Actual executed evidence (do not inflate into a PASS)

- **G1 internal**: local Node v22 `calculateAllVargas` synthetic 50×16×10 test completed **8,000/8,000, zero failures** on the N4.0 varga engine snapshot. A separate independently *transcribed* set of PyJHora documented method equations matched **8,000/8,000**, but **the external PyJHora executable was not invoked in that local study**. This is a source-method review, **not** G2.
- **G2 external**: initial GitHub run installed PyJHora 4.8.7 but failed on upstream stdout diagnostic contamination (and earlier python-dateutil dependency). Code now redirects both import- and execution-time diagnostics to stderr and checks installed version. **No completed passing 8,000-position G2 run yet**. GitHub has a large queue of historical PR workflows; N4 jobs now have cancel-in-progress concurrency to avoid adding redundant future jobs.
- **G3 original**: Publisher's official `jh_short_install.zip` returned HTTP **406** from **three** publisher hostnames on real GitHub-hosted Ubuntu/Wine runners; the official site browser fetch also returned 406. Therefore **0/50 original same-profile cases available**. Do not install an unverified binary, generate pretend expected signs, or label the public single-case JHoraKit export as certification. The original workflow now **preflights publisher access before installing Swift/Wine**.
- **Public single-case evidence**: authenticated independent JHoraKit original binary-exported chart was compared to pinned N4 method selection: 116 of 160 signs equal and 44 differ in D2, D3, D7, D10, D16, D24, D60 because underlying JHora method-option alignment is unproven. See `N4_JHORA_VARIANT_EVIDENCE.md`.
- **G4**: Prior `Canonical main integration` succeeded for N4 PR commit; latest HEAD full Jyotish CI and independent run are **NOT YET GREEN**. Stale Academy/Pedia, redirecting /learn and old chart ownership test assertions corrected in branch.
- **G5**: Not started. No owner local test, PR merge or production deploy authorized.

## Nonnegotiable safeguards

1. Different divisional methods are not algorithm bugs unless profiles are equal; compare D1 original sidereal longitudes, reference ayanamsa, nodes, physical methods and synthetic birth-offset proof.
2. Original JHora provenance must include source URL, version, original SHA-256, INI exact bytes and per-varga settings. Do not claim certification from secondary reference without the original.
3. Never enable `N4_VARGA_AI_ENABLED`, `N4_VARGA_PERSONAL_ENABLED` or `N4_VARGA_INDEPENDENT_REFERENCE_APPROVED` on production until independently certified; unknown method or missing evidence is *not* false unfavorable advice.
4. Preserve existing Vedic natal D1/D9/D10, Reader v6 and Panchanga calculation interfaces.
5. Keep original JHora and PyJHora evaluations separate from full CI so a known external download block cannot erase proof of unrelated passing tests.

## Evidence update — independently confirmed on GitHub

**G2 independent PyJHora 4.8.7 is PASSED** on commit `c0f0ced597fcabb7389621dbb39126f821482419`: [GitHub Actions run 41845004488](https://github.com/OverlorDDD/jyotish-studio/actions/runs/41845004488), job `126626101250`. CI log contains exactly `N4_PYJHORA_PARITY_PASS: 8000/8000 independent PyJHora sign comparisons (50 synthetic profiles)`. The same run successfully validated the independently captured JHoraKit public single sample and recorded the 44 known convention differences. These are not original-JHora 50-case certification.

**G4 original full CI diagnosis** on `c0f0ced`: JHora Windows/CRLF job PASS, PostgreSQL concurrency PASS, canonical SEO/Panchanga/production Next/Nest build PASS. The long `Jyotish Core CI` test job FAILED on `tools/r4-growth.test.mjs` because the new P3 Panchanga day UX had removed `<EclipsePanel>` and the adjacent NASA 2027 calendar CTA. This is a real user-facing regression (not a test to weaken). Restored both in `PanchangaHub.tsx` with bilingual text and responsive styles at commit `f8f2c3e`. Final current-head rerun still required.

**CI availability:** hundreds of historic PR workflow runs created a large queue. Added concurrency cancellation for future N4 runs and temporarily enabled **read-only push-to-branch gates** for full Jyotish CI, N4-specific parity/integration and canonical production build to certify the actual HEAD. No workflows on this branch run AWS deployments or index submissions.


## 2026-11-07 chronological correction — N4.13 / N4.14 evidence and calculator profile
This older execution plan described original JHora 0/50 and an unsuccessful publisher download on hosted GitHub runners. Those historical facts remain true **at the time of the old tests**, but later owner-private genuine JHora8 source exports produced method-aligned **50/50 original sources / 8,000 of 8,000 signs**. N4.13 independently ran the file-backed native Swiss True Citra/geometric research comparison, also 8,000/8,000 with zero reported angular threshold violations. N4.14 later ran 50 synthetic source cases with 30,050 epochs / 300,500 positions and refined 253/253 *observed* one-second D60 transition brackets to <=125ms. These are private research diagnostic passes, **NOT** an all-N4 production certificate.

IMPORTANT profile discrepancy discovered during math-first SEO product integration: the original 50-case JHora benchmark used **Uma-Shambhu D2 Hora** and **True Citra/geometric** source positions, while the current Galaxiora calculator uses **Sun/Moon D2 Hora** and **Lahiri**. Passing one method cannot certify a different method. See N4_15_NATAL_MATH_FIRST_UI_AI_HANDOFF_20261107.md and tools/n4-d2-original-profile-crosswalk.mjs. Also still pending: original JHora Vimshottari year definition/calendar-date equivalence; legally confirmed historical UTC for personal localities; independently justified continuous D60 bounds; current-head full CI and independent human English/Ukrainian AI editorial checks. Keep production feature flags OFF and DO NOT begin newcomer homepage redesign until these gates are resolved.
