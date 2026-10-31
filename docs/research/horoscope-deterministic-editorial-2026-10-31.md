# Galaxiora — deterministic horoscope editorial release (2026-10-31)

## Diagnosis and plan
The public Western forecast used short Sun/Moon house templates, generic imperatives and the repeated warning 'not a guarantee'. The Vedic Moon-sign report rotated copy every fourth date regardless of whether the sky changed. Personal dasha guidance also chose a featured planet using day-number rotation. The ASE-3 deep reading required an unnecessary external AI call.

1. Replace Western copy with detailed original Ukrainian/English interpretation of computed tropical Sun, Moon and Mercury houses (public Sun-reference and verified personal Sun-reference). Keep exact ephemeris evidence in expandable details.
2. Replace Vedic date rotation with actual Moon house from Janma Rashi and actual lunar nakshatra. Stable observations yield stable text; changes are sourced to new lunar positions.
3. Prioritize active Vimshottari lords and verified observed grahas in personal guidance rather than date-indexed selection.
4. Explain actual transiting Western planet, natal target/aspect, Vedic gochara house and evidenced common or contrasting themes; retain ASE-1 and ASE-2 numerical proofs.
5. Replace the ASE-3 AI endpoint, provider module and consent button with automatically rendered bilingual deterministic source-linked reading. All horoscope inference now costs zero AI tokens. Other AI features outside the horoscope module remain unchanged.
6. Put numerical methodology and interpretative boundaries in source/evidence details rather than undermining every forecast with the same warning.

## Primary sources
- Swiss Ephemeris programmer manual: https://www.astro.com/swisseph/swephprg.htm
- Swiss Ephemeris dual licensing and public service terms: https://www.astro.com/swisseph/swisseph.htm
- Astrodienst transits: https://www.astro.com/astrowiki/en/Transits
- Astrodienst aspects: https://www.astro.com/astrowiki/en/Aspects
- Astrodienst applying and separating aspects: https://www.astro.com/astrowiki/en/Applying_Aspect and https://www.astro.com/astrowiki/en/Separating_Aspect
- Classical Jyotish reference: Phaladipika chapter 26, already cataloged in ASE-1 research; house/nakshatra topic associations are authored editorial mappings, not calculated physical laws.
No proprietary report text has been copied. A traditional interpretation is not a measured outcome; do not invent events, diagnoses, financial gains or personal biography.

## Windows verification (repository root)
```powershell
git fetch origin
git switch fix/horoscope-deterministic-editorial-20261031
git pull --ff-only
npm install
npm run db:generate
node --test tools/western-horoscope.test.mjs tools/horoscope-basis.test.mjs tools/horoscope-editorial.test.mjs tools/astrological-synthesis.test.mjs tools/astrological-synthesis-v2-v3.test.mjs
npm run build
docker compose up -d db
npm run dev:full
```
Open /uk/horoscope and /en/horoscope; compare twelve signs, Western/Vedic personal, chart synthesis, day/week and mobile/desktop. Test a real saved primary natal chart. No AI checkbox, no provider key or horoscope AI network request. Expand source details and verify that every planetary fact matches computed evidence. An unchanged lunar house+nakshatra must yield unchanged wording, while real transit changes affect the text.

## AWS production procedure (NOT an automatic GitHub deployment)
Production uses systemd and Caddy; it does not require Docker on the server. From an authorized SSH session on the existing server:
```bash
cd /opt/galaxiora/app
git fetch origin fix/horoscope-deterministic-editorial-20261031
git show FETCH_HEAD:tools/galaxiora-horoscope-editorial-production-update.sh > /tmp/galaxiora-horoscope-editorial-production-update.sh
bash -n /tmp/galaxiora-horoscope-editorial-production-update.sh
bash /tmp/galaxiora-horoscope-editorial-production-update.sh FULL_40_CHARACTER_CI_GREEN_SHA
```
The script checks Git ancestry, current services, production env/SEO, preserved database, old site, builds on the server, isolated API canary and 401 for private ASE endpoints, 404 for the retired AI endpoint, then performs service cutover and public UK/EN health checks. On failures it rolls back. If Git ancestry is not a fast-forward, stop rather than force-switch. Do not deploy an untested SHA, discard user data, or change secrets.

Remaining numerical release gate: independent 20+ birth-chart benchmarks, full JQA-3 precision/certification and public Swiss Ephemeris license compliance are separate responsibilities.