# N4.9.2 — Meaning-first natal interpretation: implementation and QA
Date: 2026-11-09 | Source branch: `feat/n492-meaning-first-reader-20261109` | Parent: N4.9.1

## Why this refactor exists
The previous visible N4.9.1 used a single D1 lord per card, mandatory largely arbitrary cross-division references and did not explain why important Cancer/Mars yogakaraka, D1 Mercury debilitation, D10 exaltation, functional house ownership, or the actual Moon/Ascendant pattern matter to the recipient. It repeated technical sign/house coordinates and called them a personalized interpretation. The user found the buried `Поглиблене астрологічне пояснення — за бажанням` substantially better; the source is `interpretation-v3.ts` plus `reader-narrative-v6.ts`, which already analyze chart patterns, yogakarakas, D1 houses, Moon, Venus, D9, D10, Vimshottari and conflict. This engine is **reused**, rather than duplicating the hidden spoiler below a weak new report.

## The eleven concrete repair steps
1. Preserve the internally verified Swiss/Lahiri input, historical BPHS varga arithmetic, 15 original Dn topics and D60 source digest.
2. For each topic select actual functional D1 lords, NOT a fixed archetypal sign paragraph.
3. Check yogakaraka using real lagna-specific kendra + trikona ownership; for Cancer explicitly check Mars 5th/10th. Contrast D1 and thematic Dn dignities without treating them as complete Shadbala.
4. D2 analyzes 2nd **and** 11th; D9 seventh lord, natal Moon and Venus plus D9 Venus; D10 tenth lord, yogakaraka and D10; D12 fourth **and** ninth. Remaining vargas have their declared traditional scope. No D7-as-universal-marriage rule.
5. Build **conditional house-combination interpretation**, not simply echo house numbers. For D2/D9/D10 all twelve house destinations have domain-specific grounded readings; other Dn prefer distinct evidenced combinations and only then concise subject explanations.
6. Apply additional cross-varga confirmation **only** for actual sign dignity agreement, sign repetition or contradiction on the SAME planet, plus tightly bounded topic-specific direct links. Never fabricate a link just to populate a field.
7. Render D1 first, D60 last as **the same type of life-area card** in one continuous 16-card grid. D60 lists all nine computed sign positions, flags boundary sensitivity and does not personalize unverified D60 lagna/houses. Approximate birth minute masks D60 narrative.
8. Add one **three-line personalized conclusion** after D60, emphasizing ascendant/Moon, profession/career yoga, and significant natal Mercury debilitation or active dasha when applicable. Never score irrelevant areas equally.
9. Remove the old N49 unified essay and **the entire "Optional detailed traditional interpretation" hidden spoiler** for the active Reader, while retaining V6 as the authoritative narrative development layer internally.
10. Cache/receipt contracts use `presentationEdition=n492-meaning-first-16-v1`; stale reports cannot masquerade as current.
11. Audit automatic claims and manually read exported examples: 96 independently generated synthetic test input/language combinations (48×2), 12 native Swiss birth test cases×2, full Linux/Windows build and Chromium tests in UK/EN 320–1440px. CI must fail on incorrect sources, repeated one-size-fits-all texts, missing D60/16 cards, generic old essay, malformed UA/EN prose or horizontal overflow.

## Independent quality rubric — aspirational 10/10, not an automatic award
| Dimension | What an excellent reading must show | Automated evidence |
|---|---|---|
| Correctness | Source graha/sign/house and varga evidence match verified chart | 16 exact cards, source proofs |
| Relevance | Correct Dn topic, not category swapped | Fixed subject-specific classical map |
| Meaning | At least one concrete traditionally interpretable link | Conditional house meaning |
| Personalization | Different astronomical charts yield different implications | 96 seed / two-locale uniqueness |
| Priority | Exact yogakaraka, dignity, competing indicators ranked ahead of boilerplate | Functional role/gates |
| Cross-varga | Only actual shared planet/lord or independent meaningful corroboration | Same-graha proof + conditional |
| Brevity | No giant redundant prologue/long hidden repeat | 16-card-only UI + short conclusion |
| Readability | Ukrainian cases and English natural, 320px responsive | Automated and human sample review |
| D60 honesty | Nine signs but no invented birth-time certainty or D60 houses | Digest + boundary contract |
| User value | Clear main resource, caution and current priority | Three dynamic conclusions |

These are testable design criteria, **not proof that astrology predicts personality or events**. Literal 10/10 expert approval is a subjective review requiring a qualified practitioner, multiple independently timed charts and feedback from actual users. Do not replace this caveat with a CI badge.

## Original-source boundaries
- `Brihat Parashara Hora Shastra` chapter 6 varga scope and chapter 34 functional lordship (edition numbering varies): https://www.horasad.com/download/ebooks/BRIHAT_PARASHARA_HORA_SHASTRA_1.pdf
- `Brihat Jataka` chapter X professional interpretation, with translation/commentary differences: https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/doc1501718.html
- D60 recorded birth-time stability and limitations: https://epandit.in/en/learn/varga/shodashvarga
- `reader-classical-n44.ts` has OCR metadata, but not all book scans were independently re-read: do not quote a rule as certified by page/verse without the separate editorial source audit.

## Deployment safety
Use exact green PR head, **not floating main**. `tools/n492-aws-release.sh --preflight <SHA>` checks ancestry/clean state/target, then `--deploy <SHA>` backs up current SHA and config, runs tests and Next/Nest builds, restarts services, verifies UA/EN and live 16-card report, attempts rebuild/restart rollback on failure. No Docker, no migrations, no force reset. Report GitHub CI separately from AWS actual deployed state.
