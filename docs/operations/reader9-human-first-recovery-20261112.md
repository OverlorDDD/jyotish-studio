# Reader 9 — Human-first restoration and editorial release

**Scope:** deterministic chart interpretation. The approved five-chapter / sixteen-varga N4.9.7 UX is the reference, with N4.9.8 D7/D9 fixes retained. N4.9.7 reference commit: `0fa118d081251785b5449dd5d4613baca2be00f1`.

## Root cause

`reader-human-n495.ts` reuses a universal `LIVED` sentence for multiple subjects and mechanically appends `ARENA` house examples to unrelated topics. A generic dignity sentence and two sign-style clauses in D60 add filler. The old final summary repeats the same work-project and relationship-agreement advice regardless of chart.

This stage changes **prose only**, not Swiss ephemeris, birth-time resolution, D1/D9/D10, N4 varga maths, JHora fixtures, D60 bounds, SQL schema, AI provider configuration, SEO, analytics or authentication.

## Fixed sequence

1. Retain N4.9.7 and N4.9.8 as immutable comparison points; keep the existing five sections / complete sixteen-chart guide.
2. Supply house-specific, subject-specific UA/EN sentences for D2 (resources), D4 (home), D9 (partnership) and D10 (career); use natal-house evidence, not a generic psychological claim.
3. Supply subject-specific varga-house scenarios for D2, D10 and D24; retain N4.9.8 D7/D9 12-house scenes. Remove non-domain `ARENA` injection from all supporting cards.
4. Reduce the D60 visible explanation to one clear symbolic contrast. Keep both selected planet comparisons in the hidden basis and nine computed planetary sign positions behind the existing disclosure. Do not imply certified D60 houses or individual karmic predictions.
5. Make the end-of-report synthesis depend on actual D1 ascendant/career/partnership ruler houses, including shared focus and a bounded action, not a repeated catchall call to do a project and have a conversation.
6. Label deterministic reading **Reader 9** in both languages, while deliberately preserving the `reader-v8.0.0-n44` and `n492-evidence-prioritized-16-varga-v1` API ABIs so existing clients, tests and saved reports are compatible.
7. Run `npm run test:reader9`, full N4.4 CI, real Swiss → API → Next E2E at UA/EN and 320–1440 px, plus existing Core/SEO/GA4 CI. Keep at least one screenshot per locale and mobile/desktop.
8. Merge to `main` only after exact PR head CI is green. Deploy **exact merged SHA** with the existing guarded `tools/n496-aws-release.sh` (non-Docker) and check actual public `/api/v1/reports` with **invented** coordinates and birth data. Never release a Draft or pending CI.
9. Verify public locale pages, 5 life subjects, 16 options, full sources under disclosures, domain-specific output, D60 boundaries, and `reader_only` provenance. Roll back using the private release backup ref if any runtime acceptance check fails.

## Manual owner acceptance

At https://galaxiora.com/uk/astrology/jyotish create a *new* report (not restored from history) and choose `Читати без AI — Reader 9`. Repeat in /en. Each reading should contain:

- `READER 9`, five life areas, a contextual `Що можна спробувати` / `A practical step` for each;
- `Детальніше про цю сферу` / `Explore this area` and `Як ми дійшли цього висновку` / `Why this interpretation`;
- sixteen distinct D-card entries in a properly laid out list (not pasted Markdown);
- no `перевірте Венеру чи D9` TODO for the user, no D9-learning / D7-office sentence splice, no identical generic teaching/life-principle paragraph across money, relationships and work;
- a readable end summary with a different next step on **different** fictional charts.

Run the same fictional natal data before/after release when comparing text; log chart verification digest and varga D1/D9/D10 positions only in a private QA record. Never put real personal birth details or private readings in public issues/logs.

## Rollback and limits

The N496 release script saves a private ref and the previous SHA *before* switching, performs guarded install/build/service restart, checks public routes and both language reports and attempts a rollback if it fails. Do not force-reset production or overwrite unknown dirty tracked files. Reader 9 is a traditional *interpretation* of computed placements, not independent proof of real-life events. AI consultations remain separately labeled and may differ in wording.
