# Galaxiora — Priority 2: Astronomy × Horoscopes × Personal × Yoga × GalaxiNews
Date: 2026-10-27. Branch: `fix/jqa3-windows-and-llm-recovery`.
Scope is integration of **existing AE-P1–P7**, not new AE-P8.

## Changes and their sources

1. **Worldwide city search:** `GET /api/v1/panchanga/cities?q=Kremenchuk&lang=uk` uses
   Open-Meteo Geocoding, returns named city, region, country, real coordinates **and IANA zone
   together**. 380ms client debounce, abort stale results, bounded 24h server cache,
   server-side query bounds, manual coordinate/timezone form remains available.
   Open-Meteo free API is **non-commercial**: use an appropriate paid/self-hosted
   geocoder before commercial launch. No user street-level geolocation is requested.
   Reference: https://open-meteo.com/en/docs/geocoding-api

2. **Useful astronomy explanations:** every AE-P5 event now explains the computed
   astronomical phenomenon, **separately** explains a traditional Jyotish reading,
   suggests a finite, relevant optional practice and states causal/predictive limits.
   Shared copy: `packages/jyotish-core/src/astro-education.ts`.
   UI: expand the event row in Panchanga.

3. **Cross-module verified context:** `apps/api/src/sky-context.ts` combines
   real AE-P5 7-day events and AE-P7 observance *candidates*; every date/instant
   and observer-reference provenance stays explicit. Public 12-sign horoscope
   day/week API includes a `sky` object and reading page highlights events.
   Personal overview includes the context in its **canonical one daily
   reading** (no second conflicting headline), plus verified natal-Moon
   `Tarabala/Chandrabala` comparisons sampled at **local noon**. Sunrise
   assessment remains in Personal Panchanga; the two instants are NOT conflated.
   Authenticated Personal displays lunar strength and explicitly labelled
   Kyiv-reference festival candidates in its main daily panel. Natal report
   appends a *current-date* calendar section to deterministic sections, not a
   fictional historic birth-time festival.

4. **Yoga × lunar phases:** bilingual 30-day phase-specific practice calendar
   in Yoga hub, derived from `GET /api/v1/astronomy/events`.
   Uses existing practice routes (`five-senses`, `desk-mobility`,
   `evening-unwind`, `gentle-breath`); astronomical timing vs symbolic
   reflection is distinguished. No purported physiological lunar effects.

5. **News recovery:** the original code ran scheduled scans only when
   `NEWS_INGESTION_ENABLED=1`. The real local API's `src/main.ts` can now
   start discovery even when the old .env omitted the flag, while tests and
   production are explicit and `NEWS_INGESTION_ENABLED=0` always disables.
   Updated sample .env and consistent `/news/status` and admin-health
   reporting. 15-minute RSS/GDELT cadence and independent source cooldowns
   remain. Publisher 404/429/500 still prevent fetching *those publishers*;
   no fabricated external stories are generated.
   Unlicensed publisher photos are **not** re-enabled. Instead, GalaxiNews
   cards and Personal News have new owned per-topic celestial graphic
   treatments, with publisher photos only where reuse is explicitly authorized.
   Original astronomy event/eclipses news are generated from Swiss, persisted
   without duplicate titles using deterministic event hashes, and linked to
   the correct Panchanga event day **only when NEXT_PUBLIC_SITE_URL is a real
   HTTPS hostname**. This avoids storing public `localhost` links.
   The scheduled astronomical digest runs no more than once per 24 hours per
   API process, even if external news sources are failing.

### What is *not* claimed

- External RSS updates are subject to independent upstream access and
  licensing. Green code CI alone does not prove external publishers are
  currently responding from the owner's machine.
- A publisher RSS thumbnail without licensed reuse may not be re-published.
  Original Galaxiora graphics replace missing photos; they are not passed
  off as photographs taken by the publisher.
- Geocoding demo's free terms do not cover future paid/commercial workloads.
- Personal noon-based lunar strength is a **different sampling convention**
  from sunrise-derived personal Panchanga. The API labels it explicitly.
- Public 12-sign advice uses a common Kyiv-local astronomical context;
  only verified natal accounts receive personal natal derived facts.
- AE-P7 festive dates remain candidate observances; do not promise complete
  Smarta/Vaishnava parana/fasting priority certification.

## Windows fetch, startup and tests

```powershell
$project="$HOME\jyotish-studio-git"
Set-Location $project
Test-Path .\package.json
git status --short
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm install
py -m pip install pyswisseph
npm run test:astro-integration
npm run test:panchanga
npm run test:astronomy
npm run test:lunar-strength
npm run test:vedic-calendar
npm run test:astronomy:nasa
npm run jqa3:certify
npm run test:all
npm run build
npm run dev:full
```

Ensure `.env` has `NEWS_INGESTION_ENABLED=1` for **production**. The
dev API's automatic default does not apply to managed production deployment.
If the old .env explicitly has `NEWS_INGESTION_ENABLED=0`, change it
to 1 before launching. Do **not** show or commit .env secrets.

Site:
- `http://localhost:3000/uk/panchanga`: type any city, select a result,
  inspect *both* coordinates and timezone, press Calculate; expand event
  explanations. Check EN route.
- `http://localhost:3000/uk/horoscope`: public sky event context and
  candidate observances, full seven-day forecast.
- `http://localhost:3000/uk/personal`: sign in, select verified chart,
  inspect daily advice, Tara/Chandra noon markers, and reference city.
- `http://localhost:3000/uk/yoga`: genuine phases and linked breathing,
  mobility and meditation practice cards.
- `http://localhost:3000/uk/news`: new first-party illustrated artwork,
  latest stories, image rights respected.

Second terminal:
```powershell
Invoke-RestMethod 'http://localhost:4000/api/v1/panchanga/cities?q=London&lang=en'
Invoke-RestMethod 'http://localhost:4000/api/v1/news/status'
Invoke-RestMethod 'http://localhost:4000/api/v1/horoscope/today'
npm run news:doctor
```
Inspect `/api/v1/news/admin/health` as an admin for source 429/404/500
and `lastScan`, backoff and images. Optional admin-triggered scan:
POST `/api/v1/news/admin/refresh` with current authenticated session and
same-origin protection; do not spam GDELT. First scan typically begins
around 15 seconds after API init; no guarantee of a new licensed publisher
article every 15 minutes.

## Final acceptance criteria before broad launch

- Real city search: Kyiv, Kremenchuk, London, Tokyo, New Delhi; accurate
  coordinates + IANA timezone; optional manual entry and validation.
- Moon phases and planetary events contain all three explanations, do not
  turn traditional advice into medical assertions.
- 12-sign, natal report and Personal use shared factual event source.
  No fabricated ingress time or different planetary coordinate profile.
- Lunar Tara/Chandra on Personal clearly indicates noon; Panchanga at sunrise.
- Yoga 30-day cards link to real, present practice pages.
- News ingestion running in owner dev and intended production process;
  independent original artwork visible; image permission honored;
  external health/lastScan checked from live owner deployment.
- First-party astronomy news appear after real HTTPS domain configured;
  duplicates excluded; original chronological events exact.
- All JQA-3/JHora and NASA tests remain green; responsive UA/EN Chromium
  test suite passes, with no personal-data leakage or DB reset.
