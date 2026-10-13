# Stage 7 — Research and long-form Jyotish report

## Competitive study, using official site feature descriptions

1. AstroSage: https://www.astrosage.com/kundli/ and https://www.astrosage.com/free/
   The Kundli experience offers natal planetary placements, additional divisional charts, dashas and specialized reports. Lesson: a serious Vedic reading needs individual domains and detailed calculated positions.
2. Prokerala: https://www.prokerala.com/astrology/kundli/
   Describes twelve houses and their meanings. Lesson: offer an explanation of every house, including empty houses, not just occupied ones.
3. Astro.com AstroClick: https://www.astro.com/cgi/aclch.cgi
   Clicking chart elements reveals focused explanatory texts. Lesson: add a readable table of contents and, later, click-through connections from D1 to the relevant interpretation.
4. Astro-Seek: https://horoscopes.astro-seek.com/astrology-chart-free-interpretations
   Separate interpretations for planets in signs and houses and aspects. Lesson: group detailed sections and provide context. Western angular aspects should not be confused with Vedic graha drishti.

We adopted design patterns, not copyrighted text or unverified predictive claims.

## Functionality in Jyotish Studio

- POST /api/v1/reports accepts chart ID, language and optional local preference.
- apps/api/src/report.ts builds 29+ structured sections: portrait, Sun/Moon, nine grahas, twelve houses, classical Parashari drishti, D9/Navamsa, D10/Dashamsa, Vimshottari dasha.
- Drishti: Sun/Moon/Mercury/Venus aspect seventh; Mars aspects fourth, seventh, eighth; Jupiter fifth, seventh, ninth; Saturn third, seventh, tenth. Rahu/Ketu aspects omitted because traditions disagree. All aspects use whole signs, not Western orbs.
- AI receives seven verified clusters (identity, D1, houses, drishti, D9, D10, dasha), instead of only the older six fact snippets. It writes 3–6 thematic paragraphs anchored to known fact IDs; server rejects unknown IDs, duplicates and malformed responses.
- New endpoint will NEVER invoke paid OpenAI, even when older paid mode remains configured. Free OpenRouter router and optional localhost Ollama are used only when explicitly enabled; the entire computed report works without a language model.
- The original /api/v1/interpretations endpoint stays available for comparison or legacy users.
- Ukrainian terminology normalization prevents mistaken phonetic labels such as Піссіс, Сагітарий, Ліба, Сватьі.
- Frontend shows a long, sectioned, editorial interpretation UNDER the calculation panels with 8 table-of-contents links, illustrations, accessible heading structure and mobile styles.

## Illustrations: source and rights

These astronomical illustrations are editorial decoration, NOT images of a personalized natal chart. Every image links its NASA/Wikimedia original and names its source.

- V 372 Orionis (NASA/ESA/Hubble): https://commons.wikimedia.org/wiki/File:V_372_Orionis_Hubble.jpg
- Apollo 17 Earth photograph (NASA): https://commons.wikimedia.org/wiki/File:The_Earth_seen_from_Apollo_17.jpg
- Carina Nebula in visible and infrared (NASA): https://commons.wikimedia.org/wiki/File:Carina_Nebula_in_Visible_and_Infrared.jpg

The file pages identify public-domain terms and credit requirements. NASA media-use guidance: https://www.nasa.gov/nasa-brand-center/images-and-media/ . Do not imply NASA endorsement. The report uses Wikimedia Special:FilePath HTTPS redirects plus CSS backgrounds if remote imagery is unavailable.

## Data flow and privacy

Birth input is checked and calculated by deterministic Jyotish Core and Swiss Ephemeris, then saved in PostgreSQL through Prisma. Report sections derive from saved results. The LLM receives only derived chart facts and periods, NOT raw name, birth date, time, city, time zone or coordinates. Derived data can still indirectly reveal sensitive personal details. A public demonstration should use fictional charts only and is not ready for unrestricted real-user privacy.

There is no implementation of shadbala, planetary strength, verified yogas, precise muhurta selection or exhaustive timing forecasts yet. Never attribute these to the calculator. Existing public-mode process-local limits and access caveats still apply.

## Windows manual testing

1. Stop npm run start:full with Ctrl+C.
2. Run in project root: git pull --ff-only origin main
3. Run npm run test:report, then npm run test:terminology.
4. Run npm run test:all, npm run test:swagger and npm run build.
5. Run npm run start:full and leave it running.
6. In another PowerShell, run npm run test:full. The smoke test forces a local report to avoid cloud requests.
7. Run npm run demo:check before opening the public ngrok tunnel.
8. Enter fictional New Delhi chart data, calculate and click Створити повне трактування.
9. Confirm the report scrolls into view BELOW the chart, with all nine planets, twelve houses, D1, D9, D10, drishti, current dashas and free model commentary where available.
10. Check eight table-of-contents links, mobile phone layout, source credit links and photos.
11. Switch to English, recalculate/regenerate; ensure labels and paragraphs switch languages.
12. Simulate LLM-unavailable state using AI_MODE=local and a server restart; report chapters must still render, with no costly API call. Return to AI_MODE=free afterward.
13. Try an unknown chart ID against the new endpoint and verify HTTP 404. In public mode confirm endpoints remain limited and private stored charts are not exposed without explicit IDs.
14. On phone with mobile data, visit ngrok HTTPS URL and repeat fictional calculations; stop ngrok after demonstration.

For any failed command, report the FIRST error and do not share passwords, API keys, private .env values or a real person's birth information.

## Potential later stages

Verified classical yogas / dispositors and dignities; improved free-model quality controls and local Ollama; authentication and per-chart ownership; permanent hosting; PDF/print report export; clicking a D1 planet to scroll to its explanation.
