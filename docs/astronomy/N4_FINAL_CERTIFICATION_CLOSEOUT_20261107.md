# N4 — final mathematical research closeout and restricted acceptance (2026-11-07)

**Decision:** \`N4_RESEARCH_CYCLE_CLOSED_SCOPED_PRODUCTION_NOT_CERTIFIED\`.
This is a final decision for the completed **research** cycle, not a claim that all birth-chart mathematics is independently certified. Production N4 release **REJECTED / gated**. This is an auditable acceptance document with exact release exclusions, not a new indefinite research plan.

## Ground truth, not extrapolation

| Subject | Source-backed result | Final verdict |
| --- | --- | --- |
| 16 symbolic D-chart mapping, production Sun/Moon D2 on pinned D1 inputs | Independent PyJHora 4.8.7, 8000/8000, source blob \`3a4f2dec84a0ed13cb692f52a76612e0de1306e6\` | **ACCEPTED, method-scoped** |
| Original JHora8 True Citra geometric D2 Uma-Shambhu source method | 50 genuine original synthetic GUI cases, 8000/8000 symbolic matches; strict native SWIEPH research profile, 50 samples / 8000 signs | **ACCEPTED, different method-scoped profile** |
| Exact production Lahiri + apparent + Sun/Moon D2 absolute birth positions, all boundary cases | Original research source used different True Citra + Uma-Shambhu settings; real production JQA3 agreement remains partial | **NOT CERTIFIED** |
| Native Swiss true-sidereal solar-longitude year, original JHora fixed-local printed dates | 180/180 majors; 1619/1620 minors; independent holdout 810/810 | **ACCEPTED as research calendar-day reproduction, NOT production Vimshottari** |
| Sole Jupiter/Ketu JQA3-02 calendar-day mismatch | Original 2018-11-15 vs nominal native 2018-11-14 23:59:45.618. Strict native SWIEPH ±0.005" Moon original print resolution gives 2018-11-15 00:00:17.503, center 2018-11-14 23:59:45.618, +0.005" 2018-11-14 23:59:13.734; 6,150 Sun calls, source interval width 63.7686064453125 seconds | **PRINTED-SOURCE RESOLUTION AMBIGUITY EXPLAINS POSSIBLE CALENDAR DATE, NOT PROOF OF EXACT ORIGINAL INSTANT** |
| Current production Vimshottari | Constant 365.2425 days/year; actual original JHora20 matching only 294/1620 minor printed days in UTC; original \`YearDefinition=0 3\` menu semantics unverified | **NOT CERTIFIED against original JHora dates; do not auto-switch** |
| Historical civil UTC | IANA, Node Intl and Python tzdata transitions checked; only two partial historical legal source records, no site-specific original birth-time legal proof | **REQUIRE source-by-source provenance / safe ambiguity handling** |
| D60 physical continuity | 50 synthetic cases, 30,050 actual SWIEPH timestamps / 300,500 positions; 253 observed crossings refined to ≤125 ms; at ±15s 11/50 D60 Lagna charts already show sign changes | **NOT CERTIFIED for user-facing stable D60/house/event claims** |
| Full PR #120 CI + Next/Nest builds + mobile/browser + UA/EN human AI review | Latest head has no externally attested full green CI in available connector evidence; PR remains **draft/unmerged** | **NOT CERTIFIED / NO DEPLOYMENT** |

### Original owner evidence provenance

Public source-linked evidence summary: \`tools/n4-final-evidence-ledger.json\`; exact owner-uploaded SHA256 hashes:
- N413: \`c8c7acc9dd7153260b52b29717ac76483a497c6ab50bba31752387d8d8696a0a\`
- N414 refined: \`5dcf016927c82b8e05a1b35e36c17d697d9db90334dab7f1fee7f7514a907881\`
- N417: \`f735986849bd709fdf04374f34f51c0c5ab68e90f6e94514e2209702cabe20c7\`
- N418: \`a10240fdafc22a39646fbd4b3d36d6911cd2096813bd7d8f64962e321453adff\`

These are SHA256 **fingerprints of owner-provided reports**, NOT signatures independently authenticating the JHora executable or proof that native JHora was re-run in this commit. Original JHora raw corpus and capture hashes have separate source pins. No private raw birth material is checked into this closeout commit.

## Enforced automatic decision

- \`tools/n4-final-certification.mjs\` reads the public sanitized evidence ledger, verifies exact input report hashes, per-method ratios, original-only flags and actual current calculator readiness.
- \`tools/n4-final-certification.test.mjs\` rejects forged 1620/1620, invented rounding causality, modified evidence SHA, falsely interchanged D2 methods, changed production year mode, fabricated historical/D60/CI certification and falsely enabled N4 production flags.
- \`.github/workflows/n4-14-time-d60.yml\` runs the eight fail-closed decision tests and CLI on both this branch and N4 PR changes, in addition to existing N414/N416 regressions. CI success is **not claimed before actual HEAD workflow passes**.
- Correct expected output is \`N4_RESEARCH_CYCLE_CLOSED_SCOPED_PRODUCTION_NOT_CERTIFIED\`. A script returning \`N4_FULL_PRODUCTION_CERTIFIED\`, \`productionN4ReleasePermitted:true\`, or a fake green status is a regression/failure, never a goal.

## Final N4 product decision, no more rotating micro-stages

1. **Close source-precision single-date investigation.** Do NOT fudge lunar longitude, invent one extra JHora day match or continue sweeping fixed year-length optimizers. Original JHora internal unrounded Moon and exact year menu must remain "not independently attested."
2. **Keep existing live D1/D9/D10 untouched.** New public 16 D-chart display, new dasha year switch, public N4 AI reading and PR merge remain OFF for this cycle. This prevents method-mismatch and homepage/SEO regressions while other releases continue.
3. **Treat D60 as optional and explicitly unverified** for general customers. No D60 predictions, stable D60 Lagna claims, dating of personal events or D60-derived health/finance assertions until user-specific reliable time and continuous bounds are independently established. The existing \`n4-birth-time-certainty.ts\` fail-closed policy is the relevant baseline, not a release certificate.
4. **Allow a future separate owner-approved narrowed release only after** exact production Lahiri+Sun/Moon same-profile physical validation (especially boundaries), explicit traditional year convention and reliable local/UTC handling for each supported birth-time class, full green current-HEAD CI/build/browser, UA/EN editorial tests and approval. One may exclude uncertifiable historical inputs and D60 entirely instead of pretending globally perfect legal-time histories/continuity. Any narrower certification must name its supported period and accuracy. These are finite, explicit entry criteria for a **different release**, not unfinished N4.18 microsteps.
5. Do NOT alter root SEO canonical, sitemap, company branding, homepage CTA or existing Reader v6 in the math-only cycle. The owner explicitly rejected earlier proposed sky-first headlines in N4.15. UI/SEO may be designed separately, not made live under this mathematical record.

### Acceptance statement

**N4 independent symbolic Shodashavarga research and the true-sidereal solar-year calendar reconciliation are closed with explicit limitations. N4 full production mathematical certification is NOT attained and no automatic release is authorized.** This is the complete, reproducible and conservative decision from currently available evidence. No more owner commands are required to recognize this decision; further work is a separately scoped product release with new independent evidence and explicit approval.
