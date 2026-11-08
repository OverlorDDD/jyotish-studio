# N4.8 — Natal Reader editorial overhaul and quiet celestial atlas

## Scope
Feedback (8 Nov 2026): arbitrary mid-sentence endings in the synthesis, duplicate and generic lead cards, cold coaching tasks, warning-dominated D60 section, aggressively moving glossy planets and an unnecessary hero caption. Preserve 15 verified natal themes, the local Reader autopilot, opt-in AI, the verified D1 input, and all accuracy safeguards.

## Research and original editorial standards

- **Astrodienst / Liz Greene psychological portrait:** https://www.astro.com/prod/pr_ph_e.htm — holistic portrait of gifts and difficult patterns in accessible language rather than a fragmented inventory. We borrow only the editorial principle, **no prose or report is copied**.
- **The Pattern:** https://www.thepattern.com/app-features — plain-language insights organized by personal traits, relationships, and recurring tensions; this is a UX reference, not a source for classical rules.
- **Barnum effect / personal-validation bias:** https://dictionary.apa.org/barnum-effect and https://doi.org/10.1002/9780470479216.corpsy0108 — vague universally flattering or ominous statements cannot be treated as personal evidence.
- **Visual reference:** refined illustrated astronomical atlas, navy/cream/antique-gold lettering, subtle orbit engravings and a tiny parallax; no stock graphics, no distracting shiny 3D spheres and no copying third-party artwork.

### Binding narrative to data
- Opening uses **verified D1 rising sign, its actual chart ruler and house, and Moon**; when Moon is also the rising ruler, do not artificially count it as a separate supporting factor.
- Theme source facts are extracted from `D1.house-lord.N` and `D<N>.<graha>.house` in the existing validated evidence set. An actual, source-checked rule activation is required before calling a specific pattern strongly supportive or challenging. Source IDs and historical edition metadata remain accessible in the disclosure.
- A complete, original, human paragraph is selected for each of the 15 topics in UA and EN. No text gets cut at a character limit. The three lead cards show exact ruling planet and topic area; do not duplicate their source facts verbatim inside the broader synthesis.
- Use imagery to make a **specific** configuration understandable, not to claim real life events, unusual genius, guaranteed happiness or medical diagnoses. Inferences remain conditional as tradition-based symbolic readings.
- Replace generic productivity and relationship scripts with domain-specific consequences: how a house-ruler pattern tends to be useful, where the same ability turns against a person, and what in real relationships or work that trade-off might mean.

### D60
- D60 is the **16th visual card** in the same grid as the other 15 charts. Its heading is a real topic rather than an alarming instruction to "verify".
- Existing D60 method certificate is valid for **fixed input longitudes** only. It does not certify an individual's seconds of birth, D60 lagna, houses, karmic history or fixed life event. Only source-bound planetary sign contrasts D1 ↔ D60 are present, in the subdued narrative. The exact signs, sector-boundary distance and methodological limits appear under an accessible disclosure.
- Existing `minutesUncertain` control hides all individual D60 sign assertions from Reader and AI; the standard D1/D9/D10 and 15 thematic cards remain available.

### Hero v6
- Sun always at the focus of every elliptical solar orbit, Moon follows Earth.
- Illustrative (NOT real-time planetary positions); periods deliberately stretched from tens of seconds to **many minutes** so planets remain almost stationary while reading.
- 2D mineral-colored engraving with thin gold strokes, faint celestial rings, subdued palette and a quiet hover highlight; stars shift on a different parallax layer to the entire orbital map. Accessible names and reduced-motion support stay.
- Remove the visible bottom caption entirely. Keep accurate alternative text describing the schematic and its not-to-scale status.

## Verification
- Existing N4.7/N4.6/legacy Reader gates, Swiss Ephemeris live preview and N4-D60 comparator must pass.
- `tools/n48-editorial-prose.test.mjs`: 18 synthetic natal variants × 2 languages: individual, nontruncated paragraph endings; no banned coaching sentences; complete three factual highlights and single D60 card, reduced-speed Hero design contract.
- Playwright: local Natal page, orbit hover/motion, 15 core life cards + D60 card, response for approximate birth-time flag, seven viewport widths.
- Windows no-Docker preview: close previous 3000/4000 windows, fetch the feature branch, launch `tools/n44-preview.ps1 -SkipGitPull -ReaderOnly`; expected marker `N48_POETIC_READER_VERIFIED`.

## Notification noise
This batch is prepared as a **single GitHub tree commit** so that a full CI gate runs once per workflow rather than once per edited file. To disable GitHub-generated workflow-run emails, use https://github.com/settings/notifications → System → Actions → **Don't notify**; change the repository Watch state from All Activity to Participating and @mentions if appropriate. These account settings are controlled by the user; repository code cannot disable email for an account.

**Release gate:** draft PR only, no merge and no EC2 deploy until latest-HEAD CI and personal editorial acceptance.
