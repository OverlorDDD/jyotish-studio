# N4.10 — Full-life Jyotish synthesis: source methodology, competitor audit, release gates
Date: 2026-11-05. Draft PR #120 only. **NO production deploy / merge / feature flags**.

## 0. Owner's acceptance contract
For one birth date/time/city, compute D1 plus 15 divisional charts locally. Deliver a single coherent, detailed, personalized traditional interpretation with:
1. Natal baseline: D1 Lagna, Moon, 12 house rulers, planetary placements, supported sign dignities and verified yogas.
2. Opportunities and constraints *per evidenced life area*: D9 relationships/dharma; D10 vocation; D2 resources; D3 courage; D4 home; D7 caregiving/creative legacy; D12 parents; D16 comforts; D20 spiritual practice; D24 learning; D27 resilience; D30 challenges; D40/D45 ancestral themes. A topical varga never independently overrides D1.
3. The actual D1 ruler of the topical house, its own D1 placement, the corresponding placement in that Dn, Dn Lagna and its ruler, and the relevant thematic significator. Distinguish SIGN from HOUSE and don't assert actual biography.
4. Contradictory factors interpreted as qualified competing indications; no global good/bad verdict from one factor.
5. Verified Vimshottari major/minor only, separate **timing** from permanent natal structure, no event date promised without independent date verification.
6. Detailed strengths/limits, conditional realistic scenarios, specific actions and an integrated conclusion.
7. D60 visible as a mathematical/research chart but explicitly **WITHHELD** from narrative until exact original JHora formula variant + birth-time stability/certification.

An **800-word** single report does not replace the site's 16 directly computed charts and source tables. The user's experience should be **ONE readable consultation** plus clickable, zero-LLM original fact/evidence panels, not 16 unrelated generated essays.

## 1. Authoritative reading and explicit limitations
- The original Jagannatha Hora author P.V.R. Narasimha Rao's free \`Vedic Astrology: An Integrated Approach\` (first published 2000, author's 2010 revision note):
  https://vedicastrologer.org/articles/vedic_astro_textbook.pdf
  Chapter 6, esp. §6.5: choose the relevant D chart for the life domain; D10 for career, D16 for comfort. §6.6: Shadvarga, Dasavarga, Shodashavarga and dignity/amshabala. Chapter 11: yoga combinations, warning that software-listed yogas may be erroneous; Chapter 15: differing kinds of planetary strength. The author explicitly states in his 2010 introduction that some earlier calculations/methods were refined afterward. This PDF is a methodological starting point, **not** guaranteed last-known JHora8 variant configuration or a precise original-JHora oracle.
- Original software publisher: https://vedicastrologer.org/jh/index.htm
- Vedastram practitioner documentation: https://www.vedastram.app/en/docs/divisional-charts — **D1 first**, topical Varga Lagna and lord, compare D1 and the varga, then Dasha.
- AstroSage: https://t.astrosage.com/freechart/ and https://m.astrosage.com/ — separate Shodashavarga, classic planetary dignity/strength, yogas, Ashtakavarga, Dasha and personalized reports.
- Drik Panchang: https://www.drikpanchang.com/jyotisha/kundali/kundali.html — multiple distinct tabs for grahas, yogas, periods, ashtakavarga, Shadbala/Bhavabala and ayanamsha/nodes.
- PanchangBodh: https://panchangbodh.com/kundali-databank/method — separate calculations of Moon and Lagna; historical time zone and provenance checks.
- https://jagannathhora.com/ is a DIFFERENT independent business, **not original P.V.R. Narasimha Rao software**. Can research its explanatory site, but never use its outputs as original JHora8 mathematical evidence.

The classical domain correspondences are a **declared interpretive convention**, not 16 independent verified predictions. Scientific predictive validity does not follow from precise astronomy; our engineering grade is faithful calculation + traceable traditional reasoning + honest limitations.

## 2. Our current actual engine audit (not a marketing claim)

| Component | Repository evidence | Verified status |
|---|---|---|
| Sidereal D1 grahas + whole signs | packages/jyotish-core/src/index.ts; Swiss adapter and JQA3 | internally checked; separate original JHora birth-time/ephemeris acceptance needed |
| 16 D signs/houses (D1..D60) | packages/jyotish-core/src/vargas.ts | 8,000/8,000 independent **PyJHora** synthetic sign parity PASS previously; **original JHora8 0/50** |
| D1 12 lords and sign dignity | packages/jyotish-core/src/rules.ts; apps/api/src/reader-classical.ts | deterministic; own/exalted/debilitated is a SINGLE factor, not full strength |
| Drishti | apps/api/src/ashtakavarga.ts + consultation-fact-graph.ts | calculations exist; not added to full N4 token packet until specific QA |
| Ashtakavarga | apps/api/src/ashtakavarga.ts | **unreduced** BAV/SAV 337-point invariant exists; no shodhana/pinda and not full Shadbala |
| Verified yoga subset | packages/jyotish-core/src/rules.ts | limited Pancha Mahapurusha findings; not general Raj/Dhana/other yoga catalog |
| Full Shadbala, Bhavabala, Vimshopaka Bala | no complete certified engine in reviewed scope | **NOT READY**. Do not claim high/low overall strength or fabricate a percentage |
| Mahadasha + Antardasha | packages/jyotish-core/src/index.ts; JQA3 diagnostics | computed; independent original JHora date certification STILL REQUIRED |
| Personal story + value of every D | apps/api/src/n4-offline-reading.ts; VargaExplorer | five original deterministic chapters, 16 visual charts; now expanded by complete **internal-only** evidence blueprint |
| Groq TokenLean 1-shot | apps/api/src/n4-token-lean.ts | owner measured 775 input+1239 completion=2014 tokens; 1/1 old automatic pass contained wrong D9 Venus house (12 vs 7), **not editorially certified** |
| UK/EN native prose semantic certification | two independent reviewers + 48 real A/B texts | **NOT COMPLETE**, do not trust regex PASS |

## 3. New evidence-first pipeline
Birth data (private; strictly local/authenticated) → timezone/DST normalization → sidereal ephemeris → validated D1 → versioned Shodashavarga → D1 houses and lords → domain-specific Dn Lagna, topical lord and anchor placements → rule registry/provenance flags → compact LLM evidence packet → **one** model call → shared hard mathematical postflight + linguistic editorial review → publish only if approved.

New \`apps/api/src/n4-comprehensive-reading.ts\`:
- Builds exactly 16 source charts and 15 topical records; each topical record includes D1 topical domain house, domain lord and its D1/Dn sign/house and sign-dignity, that Dn's Lagna and lord, topical anchor planet D1/Dn, source rule identifiers and original-JHora status.
- 14 topical records may be summarized as INTERNAL mathematical evidence; **D60 is withheld**.
- Explicitly includes limited implemented yogas and provisional major/minor rulers; marks full strengths/yogas/time certification absent.
- Does not serialize the person's name, date/time/place, geo-coordinates, birth-time or keys in the LLM packet.
- Offers one 750-950-word integrated bilingual full-life prompt with **all 14 permitted D topics** and safe house semantics. Static max prompt 8,500 characters (NOT 8,500 tokens).
- \`apps/api/src/n4-comprehensive-quality.ts\`: a stricter **syntactic minimum**, requiring all 14 permissible D names, D1/D9/D10, ≥8 independently grounded topical placements and enough substance. It still cannot replace semantic human review.
- Experimental \`n4FullLife\` option only after existing N4 double approval; **zero retry** even when text fails, max 4,400 completion tokens including reasoning, separate from existing \`n4TokenLean\` and ordinary Direct v2. No default production caller enables it.
- For genuine A/B trials, use only a separate private file with \`N4_LIVE_EDITORIAL_FULL_LIFE=1\` and existing pinned \`groq\` free key; never mix legacy and complete samples, and do not call providers merely to test code.

## 4. Two concrete non-generic synthetic examples
For the controlled synthetic seed0 used by the owner's prior Groq lab:
- D1 Lagna Aries (sign1), Venus **Libra sign7, house7** (own sign).
- D9 Lagna Virgo (sign6), Venus **Pisces sign12, house7** (exaltation sign). The real model erroneously wrote **house12**. The sign/house assertions and interpretation must remain distinct.
- D3 Mars **house7**, D24 Mercury **house1**; D10 Sun **house11**. THESE are illustrative TEST facts, not a real person's chart.
A responsible traditional paragraph may conclude: both D1 and D9 put Venus in the partnership domain, with own/exalted sign dignity as contributing indicators; the person may find explicit agreements and reciprocity worth exploring. It cannot declare an actual marriage, partner history, fertility, predetermined happiness or event date. Interpretation must still consider D1 7th lord, relevant D9 Lagna, other planetary factors and certified dasha.

## 5. Acceptance / release gates
- Numerics: method-aligned original author JHora 8.0, 50 genuine original synthetic captures ×16×10 = 8,000 EXACT signs, D1/D9/D10 angular boundaries/DST and nodes, separate Vimshottari dates. Published original JHora and licensed Swiss methods must be aligned; PyJHora alone is not a pass.
- Rule registry: every named strength/yoga/aspect must have its own coded formula, test fixtures and documented source or be excluded. No invented horoscope facts.
- Natural-language claims: validated exact planets, houses, signs and lords incl. Ukrainian inflected forms; critical errors always fail even if 14 machine proof labels were correct. Syntactic pass still requires human judgment.
- Actual writing: one coherent original report, **all relevant life areas addressed**, 3 specific actionable next steps, contrasting strengths and tensions, no assumptions about user's children/health/finances, no generic motivational boilerplate. Independent UA/EN reviewers score both A/B versions, each ≥3/4 across separate criteria, with no critical misses.
- Token metrics: true provider prompt/completion/cached/total; initial pilot 2014 tokens for shorter incomplete form, full-life budget must be empirically measured. Groq user quota 8k TPM, 200k TPD; no unbounded retries, no paid billing.
- Verify full PR/Windows Chromium/API/auth/SEO/integrity on exact commit, ensure Reader v6 unchanged and all N4 feature flags still OFF, get owner final approval. **Homepage natal-first issue #126 comes only after these gates.**

This dossier and prompt are a DESIGN + internally computed synthetic test basis, not human editorial signoff, JHora math parity, or a release statement.
