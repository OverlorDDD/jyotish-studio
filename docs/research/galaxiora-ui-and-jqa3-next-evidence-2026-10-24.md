# Galaxiora — visual/editorial acceptance and remaining JQA-3 evidence
Date: 2026-10-24. Branch: `fix/jqa3-windows-and-llm-recovery`; PR #52 remains a draft until all regression jobs are green.

## The JQA-3 blockers, one at a time

1. **Sign domain:** 20 original JHora 8.0 charts, 600/600 D1/D9/D10 sign positions, 12 Lagna signs. Source-specific PASS preserved. Do not confuse with coordinate verification.
2. **Lagna angle:** original modern Swiss true/nutated ayanamsa produced 0/20 within 1 arcsec, max 18.5704″. Comparing a distinct Swiss-documented mean Lahiri convention for Lagna (without changing geocentric graha) produced 19/20 within 1 arcsec and max 1.0191374″. Case `jqa3-12` still fails strict 1″. Full certification cannot pass.
3. **Moon angle:** 18/20 within 1″, two miss `jqa3-03` (+1.0588″) and `jqa3-04` (−1.0609″). Numeric source DLL/version, time rounding or inputs must be matched independently; no 1.1″ tolerance relaxation.
4. **Calendar:** `YearDefinition=0 3` is an observed JHora code, **not** an independently documented physical duration. Stored `YearLength=0 365.242500` does not prove the selected algorithm. The original Mahadasha/Antardasha order is consistent, but dates are not: 38/180, 286/1620 versus production on the previously attested audit. Keep full exact-date gate failed.
5. **Fresh bounded candidate test:** with *original JHora Moon coordinates*, UTC and unchanged Moon fraction, each of three candidate **fixed** year lengths (365.2425, 365.25, 365.25636 days) still misses many original date boundaries across the 20 original charts. In particular `jqa3-04` stays approximately 2–3 calendar days off and `jqa3-10` approximately 3–4 days off; a global fixed-year substitution alone cannot close the mismatch. This is diagnostic, not JHora-mode attestation.
6. **Source hint, not proof of the option index:** P. V. R. Narasimha Rao's *Redefining Tajaka Varshaphal Charts* describes historic JHora defaults using a true sidereal solar year (~365.256 days) as opposed to a mean tropical (~365.242 days) option. This does **not** establish that the archived integer `3` is one specific mode, nor that a variable solar-return-based model is identical to any fixed count of days. Never label this inferred mapping CERTIFIED.

**Finite closure:** obtain a controlled original JHora 8.0 year-definition sweep on one pinned chart (explicit GUI label, original ini before/after, UTC input, local timezone, raw 9+81 date output) and one numeric calculation using the actual old JHora Swiss DLL / house computation for case 12 and Moon cases 03 and 04. Check numeric instants **before** converting to YYYY-MM-DD. Change production only for a demonstrated defect; rerun full corpus, CI, and version dependent saved results. If original source binaries cannot provide this evidence, retain an explicitly different-calendar profile with separate validated contemporary Swiss reference and keep cross-version high-precision parity NOT_CERTIFIED.

## Implemented visual scope

- Public module titles `GalaxiAstro`, `GalaxiTarot`, `GalaxiYoga`, `GalaxiLearn`, `GalaxiNews`, `GalaxiCom`, with `Galaxiora` retained as primary masthead. Technical package names and URLs unchanged.
- The standard `PortalShell` header and navigation surround Jyotish; direct navigation to the Jyotish tool from Astrology.
- The homepage hero has CSS orbits, twinkling stars and small planet glows, with compositor-friendly opacity/transforms and `prefers-reduced-motion` disabled decorative motion. No new third-party package or runtime rendering service.
- The cramped North Indian diamond drawing was replaced visually with a South Indian fixed-sign 4×4 perimeter Rashi grid matching the supplied reference: every sign and its house number, all planets with degree and retrograde marker, Lagna in its sign; large central label, ivory/gold style and mobile-breakpoint CSS. Existing independent calculation inputs/signs and D1/D9/D10 selection untouched.
- AI-generated Jyotish interpretation renders directly after the AI launch controls; data and dasha detail blocks are below, `#interpretation` targets the text container.
- Yoga landing opens with the animated square breathing player, then the remaining practices. Tarot opens directly to the reading studio without a placeholder or feature explainer.
- Tarot card reading has more specific Queen/Tower/reversal-linked advice instead of boilerplate catastrophe disclaimers; high-stakes medical fact checks remain in place. The homepage, Academy and Tarot intro have revised expressive UK/EN copy without fabricated certainty.
- The personal journal is anchored and styled within the account dashboard; its loading/authorization/error/retry state is explicit. The runtime origin of a previously reported journal fetch error **cannot be verified without a running updated site**, so never claim backend connectivity has been conclusively repaired based on UI tests alone.
- Human tarot submissions continue through authenticated owner-only draft API, and the saved question is visible in the account. This is NOT an accepted reading order: current retention is **7 days**; no practitioner access, automatic expert dispatch, reply, checkout or commercial promise is enabled. Post-save copy now clearly separates optional future project support from any reading or payment. **No donation URL, card or bank details exist in the repository:** do not invent a link; add only after the owner supplies the verified bank link and legal/compliance review.

## Documentation studied / engineering choices

- [MDN: CSS prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion) — respect motion-sensitive user settings.
- [Google web.dev: animations overview](https://web.dev/articles/animations-overview) — animate `transform` and `opacity` to reduce layout/paint work.
- [Swiss Ephemeris programmer documentation](https://www.astro.com/swisseph/swephprg.htm) — mean/true nutation flag conventions and house calculations.
- [JHoraKit reverse-engineering notes (pinned)](https://github.com/normalmystic/JHoraKit/blob/f63826b501eabe69c6b08c5365875e1e2f74c24a/JHoraInternals.md) — reference profile and source linkage.
- Repo editorial guide: `docs/galaxiora-editorial-voice.md`. Original texts not copied from copyrighted practice manuals; UK/EN phrasing authored afresh. Safety notices for physical exercises and critical medical/legal questions are retained, written as natural practice boundaries.

## Acceptance

Passes that must remain separate: `npm run jqa3:certify-signs` — PASS; `npm run jqa3:certify` — must still FAIL absent equivalent high-resolution and calendar provenance. Site CI needs green unit, build, PostgreSQL, Windows-original fixture and Chromium for the visual patch, and ideally visual screenshot acceptance by owner later. Existing stored Jyotish cards are not rewritten.
