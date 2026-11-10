# N4.5 — Reader 8.1: Natural-language editorial system and quality gate

Date: 2026-11-07. Draft PR #143. No production release.

## Problem verified in code and owner feedback

The earlier Reader 8 stitched `support + caution + methodology + practice` into a report. On the page this exposed phrases such as "Додатковий показник підтримує цю тему", "Класичне правило застосовано...", and generic copied actions. It was precise about data origins but failed to answer a human question. In some charts the same action repeated across unrelated life areas.

The owner wants warm, literary, engaging Ukrainian with **actual utility**, not invented fate and not dense astrological vocabulary.

## Editorial sources reviewed (public guidance, paraphrased rather than reproduced)

- Nielsen Norman Group, *UX Writing Study Guide*, May 8 2024, last reviewed Aug 20 2026: https://www.nngroup.com/articles/ux-writing-study-guide/ — write from user context, explain jargon and trim meaningless words. Do not substitute beautiful-sounding language for understandable information.
- GOV.UK Content Design, *Understand content design*: https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/understand-content-design/ — start with real user needs; reduce duplication.
- GOV.UK Content Design, *Create a clear structure for your content*: https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-structure/ — lead with the most important takeaway; use descriptive headings, scan-friendly paragraphs; remove repetition.
- ONS Service Manual, *Writing and editing: Plain language*: https://service-manual.ons.gov.uk/content/writing-for-users/plain-language — direct, comprehensible words; action-first calls to action.
- ONS Service Manual, *Writing for users: User needs*: https://service-manual.ons.gov.uk/content/writing-for-users/user-needs — content focused on real questions and choices, with explicit acceptance criteria.
- GOV.UK content design guidance is about communication, **not evidence that astrological predictions are scientifically validated**.

## New renderer and implementation

- `apps/api/src/reader-editorial-n45.ts` is entirely deterministic, no cloud AI: 15 professionally curated topic-specific literary leads, concrete questions, human dilemmas and **4 separate actionable paths per topic** in each of UA/EN. These paths are selected by the *actual calculated house of the topic lord in the verified Dn*, not a random phrase picker.
- The renderer uses the source-bound thematic lord and a **second distinct verified graha** as the two lenses. Classical evidence controls the broader interpretive qualification (support, friction and contrast) but is never quoted as a proven life event.
- The main Reader's 15 cards read **hook → possible strength → real-life situation → tension → one specific action**. Historical book citations, D1/Dn placements, rule IDs and "modern extension" qualifiers remain available under "Calculated evidence and historical sources", NOT as five repeated technical paragraphs in ordinary reading.
- Top three cards are based on the current chart's leading resource, challenge and vocation; they show a clear question and one action that changes with the verified context. Their headings mention the relevant life topic rather than "additional factor".
- `ReaderV8View.tsx` uses fewer mini-headings, larger story paragraphs and one highlighted doable next step. Galaxiora brand palette, hero and natal charts are unchanged.
- Reader 8 original mathematical/source contract remains `reader-v8.0.0-n44`, with explicit new `editorialVersion: n45-human-reading-1.0.0` to prevent stale cached, saved or mismatched frontend/API text; cloud AI success-cache key includes the editorial version.
- Reader v6/v7 remain available as legacy fallback without claiming to be the current edition.

## Editorial acceptance criteria

1. Every one of 15 categories starts with a distinctive **human meaning**, not a Sanskrit astrological term, unintroduced chart code, a procedural statement, or empty caveat.
2. The primary condition comes from a computed D1-to-Dn comparison; secondary tension comes from a second, distinct computed body; neither is invented.
3. A reader can identify a recognizable situation and a genuinely executable, low-risk action. Avoid advice about medical treatment, guaranteed wealth, criminality, death or irreversible relationship verdicts.
4. No repeated technical boilerplate or copy-paste actions across 15 categories. A finite, scenario-specific rule library is preferable to random prose or claiming a nonexistent AI interpretation.
5. Language must be idiomatic Ukrainian and English. Locales are authored separately, not machine-translated by a runtime provider.
6. No individual D60 phala, birth-time-sensitive claims without a precision note, no numeric trait scores.
7. `tools/n45-editorial-quality.test.mjs` tests 18 independent synthetic scenarios across 15 life categories and both languages, including phrase blacklists, actionable steps, provenance, distinct action selection and fake-source rejection.
8. Full Core/API/Next CI builds, real Swiss Ephemeris HTTP Reader tests, Windows PowerShell launch and Playwright UA/EN/mobile QA remain required. Human editorial acceptance on a **real private local chart** is separate from automated text QA.

## Preview and rollback

Local, no Docker/DB/AWS after fast-forward pull and stopping old preview ports:

```powershell
$ErrorActionPreference="Stop"
Set-Location "$env:USERPROFILE\galaxiora-n4-preview"
$branch="feat/n4-d60-certified-precision-20261107"
git config --local gc.auto 0
git config --local maintenance.auto false
git -c gc.auto=0 -c maintenance.auto=false fetch --no-auto-gc --no-tags origin $branch
if ($LASTEXITCODE -ne 0) { throw "Git fetch failed" }
git -c gc.auto=0 -c maintenance.auto=false merge --ff-only "origin/$branch"
if ($LASTEXITCODE -ne 0) { throw "Fast-forward failed" }
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\n44-preview.ps1" -SkipGitPull -ReaderOnly
if ($LASTEXITCODE -ne 0) { throw "Local preview failed" }
```

Expected `N44_CLASSICAL_READER_8_PREVIEW_READY`, plus `N44_REAL_SWISS_READER_8_REPORT_VERIFIED`. The page at http://localhost:3000/uk/astrology/jyotish displays the new literary editorial edition on fresh reports. Optional real Gemini comparison requires a private key and a separate launch without `-ReaderOnly`.

Do not merge the draft PR into main or deploy directly over production: integrate with the newest baseline, re-test and get explicit release approval.
