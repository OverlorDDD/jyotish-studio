# Natal N4 — math-first reconciliation with SEO-N1/N2/N3/N4 specifications
Date: 2026-11-07. Source: two user-provided SEO specs, current GitHub main and draft PR #120.
Status: TECHNICAL HANDOFF ONLY. NO UI, AI prompt, root, metadata, production or AWS edits.

## Order approved by owner
1. Prove consistent methods and independently verify physical ephemeris, all 16 varga mappings, historical time, Vimshottari dates and D60 uncertainty.
2. Only then refactor the real natal calculator and beginner onboarding/verified demo/EN-UK responsive UX.
3. Then complete chart-grounded deterministic and AI synthesis review and obtain owner approval for a separate combined release.
4. SEO articles, distribution, backlinks, acquisition, analytics remain with the separate SEO project.

## Reconciliation with code as inspected
- Main dedicated calculator (apps/web/app/astrology/jyotish/page.tsx) STILL initializes CITY.delhi and 2000-01-01 at 12:00. PR #120 also leaves this. Required later: empty personal form and explicit validated Date/Time/selected City, no silent Delhi fallback.
- CitySearch already exposes a selectedPlace prop, but calculator DOES NOT pass it. Required later: controlled saved-city hydration, deliberate manual coordinates/timezone mode, ARIA combobox and GAP/FOLD feedback.
- Main has D1/D9/D10 view; draft PR contains VargaExplorer with 16 grouped D charts, primary D1/D9/D10 and D60 warning. Draft still duplicates D1 and does not dynamically gate each D chart on a real original-source release certificate. No redesign until math proof.
- Current main root / uses its own canonical /; draft N4 branch root has different canonical configuration. A merge without rebasing against live main risks undoing homepage/SEO work. Lock root/canonical/robots/hreflang until coordinated post-math stage.
- Original JHora private 50 has D2 (US) Uma-Shambhu while packages/jyotish-core/src/vargas.ts defaults to Sun/Moon Hora. The original 8000/8000 method-aligned signs DID NOT test the current D2 default. New tools/n4-d2-original-profile-crosswalk.mjs checks original JHora50 against BOTH explicitly labelled D2 methods, private corpus only; no automatic profile switch.
- N4.13 physical JHora comparison ran in True Citra/geometric native Swiss mode; production JQA3 and legacy D1/D9/D10 use Lahiri. Do not treat the two distinct source profiles as interchangeable.
- Production localToUTC rejects non-existent and repeated civil times; tools/n4-production-utc-transition-parity.test.mjs adds direct 25-transition regression with the N4.14 IANA diagnostic.
- Production Vimshottari uses 365.2425 days per year; original JHora YearDefinition=3 mapping remains unverified. New tools/n4-vimshottari-year-mode-audit.mjs validates 9 major and 81 minor period arithmetic and compares competing year lengths WITHOUT claiming original day-date equivalence.
- N4.14 private native case study: 50 synthetic original JHora cases, 30,050 UTC epochs and 300,500 positions; D60 Lagna changes in 11,25,46,50,50 cases at ±15s, ±30s, ±1m, ±2m and ±5m. 253 of 253 OBSERVED adjacent-second transitions narrowed to no more than 125ms. This is numerical root bracketing, NOT absence of unobserved subsecond crossings, legal historical UTC attestation or full D60 certainty.
- N4 AI machinery (n4-editorial-gate, n4-comprehensive-reading and offline synthesis) exists under draft. It withholds D60 and treats Vimshottari day precision as uncertified. Real two-language provider corpus and independent human reviews have NOT been established by static tests.

## Mandatory mathematical closing gates BEFORE ANY redesign
M1. Pin an owner-approved production methodology explicitly: Lahiri vs original True Citra, D2 Sun/Moon vs Uma-Shambhu, nodes/physical flags, JHora division methods. Obtain 50 same-input source-external physical + 16-varge sign comparisons for the EXACT intended calculator configuration. Original JHora50 research alone cannot substitute when profiles differ.
M2. Independent JHora period-date evidence: exact year definition, timezone/civil date conventions and first major/minor boundaries, not best-fit guess. Verify source cases and all calendar boundary errors against the actual core Vimshottari path.
M3. Historical timezone provenance with legally sourced UTC offsets/ambiguous folded hours for each applicable jurisdiction. IANA/Python equivalence alone is diagnostic, not law certification.
M4. Validated continuous Swiss ephemeris longitude enclosures including Lagna over each uncertainty window, or restrict D60 to explicitly provisional geometry-only and WITHHOLD full interpretation. A 125ms observed bracket is not a mathematical continuum proof.
M5. Actual HEAD CI (all tests, PyJHora/JHora as applicable, Next/Nest build, browser/mobile, privacy/SSR/SEO), then independently reviewed UA/EN deterministic and LLM output and separate owner approval.

Any missing requirement => N4_NATAL_MATH_INTEGRATION_BLOCKED. DO NOT modify homepage, dedicated natal UX or consumer-facing N4 AI while blocked.

## Locked post-math design / interpretation contract from the attached specs
- Root /: working beginner-first calculator with EN H1 "Discover the sky you were born under." / UK H1 "Дізнайся, яким було небо в момент твого народження." Dedicated /en/astrology/jyotish: "Free Vedic Birth Chart Calculator"; UK equivalent "Безкоштовний калькулятор ведичної натальної карти".
- First-screen benefit before specialist jargon; 3 visible inputs (birth date, local time, verified city), immediately visible free guest CTA; advanced IANA timezone/coordinates visible on demand. Never insert a nominal unknown birth time without explicit disclaimer and house/D60 restriction.
- Clearly labelled non-private synthetic demo from independently checked numeric fixture. No analytics completion event from demo.
- Results: one D1 visual + actual Lagna, Moon sign, nakshatra, then available approved D1/D9/D10 and grouped additional D charts from versioned method manifest. No duplicate D1 or unsupported D60 claims. Next: major/minor dates with evidence status, planetary table, optional no-AI/AI, method/verification disclosure.
- Fully responsive 320/360/390/430/768/1024/1440 px, no overflow, keyboard CitySearch, labels/focus/errors, prefers-reduced-motion, preserve Galaxy spiral #6 and mobile OnePlus 11R class behavior.
- AI (AFTER mathematics): D1 primary, actual D9/D10 required, at least 2 selected certified secondary D lenses, chart-specific sign/house evidence, clear conditional concrete guidance, no fabricated events/precise dates, no uncensored D60 if birth uncertainty unresolved; 48 real provider outputs across 12 synthetic charts × UK/EN × A/B, two independent human editorial reviews. Existing Reader v6 must not regress.
- Root vs dedicated canonical/SSR/hreflang must be coordinated with parallel SEO chat only AFTER math; do not create SEO articles or change analytics here.
- No force push, no AWS production release and no merge without explicit owner approval.

This record intentionally documents differences and acceptance criteria; it is NOT a mathematical certificate or UI implementation.
