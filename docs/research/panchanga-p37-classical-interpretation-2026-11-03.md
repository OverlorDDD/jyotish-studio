# P3.7 — Classical Panchanga Interpretation (source and acceptance contract)

**Status:** implementation branch, not a live AWS deploy. Parent: tested P3.6 `46b00babaa3767ddfc26b0a4aa9f58a97715c234`.

## Scope and boundaries

**Panchanga has exactly five limbs:** Tithi, Vara, Nakshatra, Nitya Yoga, Karana. Sunrise-to-sunrise observer day and four continuous UTC limb-period series are already provided by verified Galaxiora Swiss Ephemeris code. **No new astronomical formula, ephemeris vendor, natal database field or AI-generated horoscope is introduced.** The interpreter uses the **same exact UTC** as the P3.2 decision and shows each limb's actual active period and expiration. Moon phase and Rahu Kalam remain clearly labeled **additional context**, NOT sixth/seventh limbs.

A **topic-specific Panchanga reading is not a full electional muhurta**. The latter may require a separate elected Lagna, planetary aspects, location-specific doshas, panchaka and tradition-/ritual-specific exclusions, none of which can be declared tested here.

### Evidentiary policy (NO invented scoring)

| Interpretive fact | Source / precision | Use |
|---|---|---|
| 27 Nakshatra seven-nature classes | Drik Panchang [Seven Nakshatra Groups](https://www.drikpanchang.com/panchang/nakshatra/classification/nakshatra-seven-category.html), 1–27 index; Muhurta Chintamani, Nakshatra Prakarana 2–8 per secondary reference | Dhruva: 4,12,21,26; Chara: 7,15,22,23,24; Ugra: 2,10,11,20,25; Mishra: 3,16; Kshipra: 1,8,13; Mridu: 5,14,17,27; Tikshna: 6,9,18,19. Abhijit not silently inserted as a 28th equal interval. |
| Tithi groups | Classical Nanda/Bhadra/Jaya/Rikta/Purna recurring every five lunar days; [Raman, Muhurtha](https://www.panchanga.lv/wp-content/uploads/2020/06/Muhurta_Raman.pdf), Ch II | Explain group name; use existing P3.2 Rikta (4,9,14) and Amavasya cautions, without granting blanket good outcomes. |
| Vara | Seven traditional planetary weekday rulers | Show which Graha rules weekday; weekday alone is not permission or a hard prohibition. |
| Nitya Yoga | P3.2's verified 27 names and existing limited conservative adverse rule (Vyatipata/Vaidhriti) | Do not invent 27 independent auspiciousness ratings or declare a new yoga-specific formula. |
| Karana | P3.2's verified 60 half-tithi slots/11 names; Vishti/Bhadra as limited caution | Other Karana are **not automatically good**, existing special exceptions are outside scope. |
| Natal Tarabala | B. V. Raman, *Muhurtha*, Ch III, Janma Nakshatra → current Nakshatra, inclusive 1–27 count modulo nine | Show computed 1–9 Tara **and** cycle; first/second/third cycle exceptions acknowledged, not fabricated. |
| Natal Chandrabala | Muhurta Chintamani Gochar Prakarana 4.1–4.4 as explained in [ePandit](https://epandit.in/learn/panchang/chandra-bala); also [Raman Ch III](https://www.panchanga.lv/wp-content/uploads/2020/06/Muhurta_Raman.pdf) | Explicit inclusive sign count from Janma Rashi. Existing implementation uses favourable 1,3,6,7,10,11; Ashtama (8) hard exclusion. Raman's electional simplification **differs on 6** (he recommends avoiding 6,8,12). Do not claim both are the same rule. Waxing 2,5,9 exception in Chintamani remains unimplemented. |
| Other transits, dashas | Existing verified natal ingress and Vimshottari output, not a fifth limb | Show as optional context only, never as made-up evidence that a salary negotiation will succeed. |

These are traditional astrological interpretive conventions; an accurate sky calculation does not independently verify their real-world predictive effects.

### Audited defect fixed

Previous P3.2 27-star index incorrectly set **Purva Phalguni (11) to gentle (Mridu)**. The documented grouping is **fierce (Ugra)**. P3.7 changes the source table and adds a complete 27-name uniqueness regression test. Testing only exemplar stars would have missed this.

## Activities (bounded interpretations, not a universal verdict)

Current five general categories remain for backward compatibility with P3.1–P3.6. Two strictly defined traditional actions are added:
- **Study** = starting a learning course; Kshipra Nakshatra applies to starting education. This is not a promise of examination performance.
- **Foundation** = **laying a foundation**, not automatically moving into an existing house; Dhruva Nakshatra is traditionally associated with foundations and permanent works. Building engineering and permits take precedence.

Work/pay negotiation, finance, relationship conversation, travel and personal undertaking are retained as existing prompts. The user interface must explain the specific class and topic context; don't force all different topics to have different overall statuses when an actual shared lunar caution applies. In particular, **Rahu, Vishti or Ashtama can legitimately remain the same across activities**.

When tests prove a source mismatch, **fail closed**, display no guessed traditional advice, and preserve raw astronomical five-limb values in the optional technical drawer.

## UI redesign and redundant sections

The primary 'My Day' viewport now has:
1. Chosen local day + sunrise/sunset/next sunrise;
2. Seven activity buttons, one actual subject and **one** verdict;
3. **Five illustrated source-linked limb cards**: exact verified name, documented class/meaning, activity-specific application, tone and UTC-boundary formatted in the observer IANA zone;
4. Separately marked lunar phase and Rahu Kalam (not counted in five);
5. Owner-only Tarabala and Chandrabala cards with plain-language inclusive counts, plus a collapsed technical natal evidence list;
6. P3.4 time windows and transparent limits, linked Personal page for chart setup.

Redundant legacy 'Selected day events / moon-calendar guide', parallel 'Related modules' and the separate My Day eclipse request panel are no longer rendered. Technical transition/raw 5-anga explorer under `p31-details` remains for audit and established P2.1/P2.5 functionality. Public eclipses continue elsewhere on the site.

Icons use **existing lucide-react local vector components** and dark gold/blue Galaxiora styles. No generated PNG, remote tracking, font download, Galaxy Spiral #6 change, DB migration or extra subscription.

## Known unresolved validation issues / release blockers

1. **Chandrabala school conflict:** 6th favourable in the chosen Muhurta Chintamani/Gochar convention, not accepted as favourable by Raman. UI and documentation must name the convention. Full source-language verse-by-verse independent review and Shukla exception require a separate specialist pass. **Do not claim fully certified muhurta**.
2. Existing P3.2/P3.3 status rules can remain restrictive across topics when global birth-Moon/Rahu/Vishti cautions dominate. P3.7 improves transparent explanations but **does not rewrite source material to force different coloured outcomes**.
3. Some generic category-to-event mappings (e.g. all relationship conversations vs wedding muhurta) are editorially broader than a specific classical election. They must not be presented as classical marriage rules.
4. 320px browser acceptance, UA/EN verified-chart privacy, P3.4 1-second transitions, 7/30 cards and full Nest/Next build **must pass CI on final branch SHA before deploy**.
5. P3.6 remains the approved production baseline. P3.7's deployment is optional and must preserve the AWS overlay approved Galaxy Spiral #6, untracked `package-lock.json`, current `.env`, and PostgreSQL data. No forced git reset or clean.

## Operator acceptance (Windows no local Docker)

1. Open the PR and confirm CI for the **latest** branch HEAD: Panchanga Quality and full Browser Integration green (not an earlier run).
2. On AWS, read-only: `cd /opt/galaxiora/app && git rev-parse HEAD && git status --short` and `git fetch --no-tags origin feat/panchanga-p37-classical-interpretation-20261103`.
3. Check `git merge-base --is-ancestor HEAD FETCH_HEAD && echo P37_FAST_FORWARD_OK || echo P37_STOP_DIVERGED`. Do not detach or update working tree on a divergent server.
4. Before building, take a **verified** PostgreSQL backup with the P3.6 approved runbook, save protected untracked branding overlay `tools/galaxiora-round-overlay.mjs`, `apps/web/brand-assets/galaxiora-circle-64.png` and working environment, and audit any conflicts. Reuse the P3.6 rollback method. The P3.6 release script is SHA-pinned to P3.6, **not a tool to deploy P3.7**.
5. Once the operator has a reviewed, clean, reconciled deployment tree and backup, `npm install --no-audit --no-fund`, `npm run test:panchanga`, `npm run build`, preserve approved icon after the prebuild icon generation, `npm run site:check`, `npm run launch:verify`, and reboot only `galaxiora-api`/`galaxiora-web` under operator control. Stop on any error; never use unverified systemd backup service assumptions.
6. Browser manual signoff: UA/EN day; 7 activities; 5 colored cards with verified classes, especially Purva Phalguni Ugra; personal Chandra 8th and Tara explanation; guest no chart data; 320px mobile; 7/30 and exact hours; absence of empty event panel; approved spiral #6; GalaxiNews and SEO unchanged.

No AWS production action is performed by this GitHub PR.
