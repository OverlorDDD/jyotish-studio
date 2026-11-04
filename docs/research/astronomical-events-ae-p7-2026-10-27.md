# AE-P7 — Vedic Festival & Muhurta Intelligence v1 (2026-10-27)

## Goal and decisions

Implement an accessible, low-latency, bilingual **seven-day Vedic observance preview**
using the pre-existing verified Swiss/Lahiri ephemeris, with no new external API,
private birth data, migrations, background process or user-input requirements.

A scientifically calculated tithi, an astronomical instant, a **candidate observance
date**, and an **authoritatively adjudicated festival/fasting date** are **four
different classes of information**. Do not conflate these; this version intentionally
does not claim a complete pan-Indian religious calendar.

## Delivered data and contracts

`GET /api/v1/vedic-calendar/week?start=2026-10-27&days=7&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234&monthSystem=amanta`

- `days`: 1..7, valid IANA zone, finite coordinates, civil dates 1900–2099.
- User-selectable `amanta` (month ends New Moon) or `purnimanta`
  (month ends Full Moon) metadata. These change lunar *month labels*, not
  geocentric Sky positions or sunrise tithis.
- Source: geocentric verified-SWIEPH sidereal Lahiri Sun/Moon, historically
  JHora-compatible Delta-T. Each civil day anchored to **local Swiss sunrise**
  and Swiss sunset; one Python process batches rise/set for all seven days
  rather than triggering seven separate Python workers.
- 1-second-bracketed real New Moon conjunctions, computed from repeated
  geocentric Sun/Moon samples; solar rashi at each boundary determines
  the new lunar month. Zero sidereal solar ingresses between consecutive
  New Moons -> `adhika`; two -> `kshaya_review_required`, with month name
  deliberately withheld pending explicit rare-year rules. Regular waning
  fortnight adopts following month label in `purnimanta`, not in `amanta`.
- Sidereal **Sankranti** event as true Sun crossing a 30-degree rashi
  boundary, not a hardcoded Gregorian date.
- Candidate **Ekadashi** if the relevant tithi is present at sunrise;
  additional arunodaya marker if Ekadashi is already present 96 minutes
  before sunrise. **No Vaishnava/Smarta complete vedha adjudication and
  no Parana timing claimed.**
- Candidate **Pradosha** if Trayodashi overlaps the first 90 minutes
  after the actual observer-local sunset.
- Sunrise **Purnima** and **Amavasya** indicators.
- Eight **named festival indicators** in regular months:
  - Chaitra/Shārada Navaratri starts: respective month Shukla Pratipadā
    at local sunrise.
  - Rāma Navamī: Chaitra Shukla Navamī at midpoint of local daytime;
    no full Madhyahna precedence adjudication.
  - Gaṇeśa Chaturthī: Bhadrapada Shukla Chaturthī at local daytime midpoint.
  - Guru Pūrṇimā: Ashadha Shukla 15 at local sunrise.
  - Kṛṣṇa Janmāṣṭamī: Shravana Krishna Aṣṭamī at local night midpoint;
    Rohiṇī/nakshatra precedence not yet adjudicated.
  - Mahā Śivarātri: Magha Krishna Chaturdaśī at local night midpoint;
    Nishita/duplicate-tithi precedence not yet adjudicated.
  - Dīvālī Amāvasyā: Ashwina Krishna Amāvasyā at local sunset;
    Lakshmi-puja Pradosha and precedence not yet adjudicated.
  - **Adhika/Kshaya named festival candidates are withheld** until
    tradition-specific intercalation tests are complete; monthly
    tithi indicators remain visible.
- **Abhijit Muhurta:** the 8th of 15 equal parts of actual
  observer-local daylight, with Wednesday caution. Complementary prior
  AE-P6 8-octant Rahu Kalam/Yamaganda/Gulika stays accessible on the page.
- API returns `observanceDayCertifiedByTradition:false` and
  `astronomicalTimeCertifiedByIndependentReference:false`; fail-closed
  on missing genuine Swiss source, and HTTP 400 on invalid inputs.
- Five-minute bounded in-flight cache; at most two concurrent asynchronous
  local sunrise worker processes; no private data or database writes.
- Web view: new UA/EN responsive `VedicFestivalPanel` at
  `/uk/panchanga#vedic-festivals` and
  `/en/panchanga#vedic-festivals`. Toggle month-system labels; 7 local days,
  sunrise tithi, event evidence time, month status and Abhijit.

## Method/reference provenance

1. Official Swiss Ephemeris API and backend flag rules:
   https://www.astro.com/swisseph/swephprg.htm
2. Drik Panchang, Ekadashi fasting/parana and second-day rules:
   https://www.drikpanchang.com/faq/ekadashi/about-ekadashi-timings.html
3. Drik Panchang, Pradosha after actual location-dependent sunset:
   https://www.drikpanchang.com/vrats/pradoshdates.html
4. Drik Panchang, Abhijit is the 8th of 15 daylight Muhurtas,
   Wednesday traditional exception:
   https://www.drikpanchang.com/muhurat/daily/abhijit-muhurat.html
5. Amanta and Purnimanta regional definitions and adhika:
   https://www.mypanchang.com/newsite/chaitramasa.php
   https://openpanchanga.org/learn/amanta
6. **Independent reference examples, not copied algorithms**:
   Rāma Navamī 2026-03-26, New Delhi:
   https://www.drikpanchang.com/hindu-festivals/rama-navami/rama-navami.html
   Mahā Śivarātri 2026-02-15, New Delhi:
   https://www.drikpanchang.com/festivals/maha-shivaratri/maha-shivaratri-date-time.html?year=2026
   Both dates are independently compared in `e2e/vedic-calendar.spec.mjs`;
   result is still not a full festival-date certification.

## Windows launch and acceptance (defer owner manual test until all stages complete)

```powershell
cd C:\Users\Note\jyotish-studio-git
git status --short
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm install
py -m pip install pyswisseph
npm run test:vedic-calendar
npm run jqa3:certify
npm run test:all
npm run build
npm run dev:full
```

Second PowerShell:

```powershell
$u = 'http://localhost:4000/api/v1/vedic-calendar/week?start=2026-10-27&days=7&zone=Europe%2FKyiv&latitude=50.4501&longitude=30.5234&monthSystem=amanta'
$week = Invoke-RestMethod $u
$week.version
$week.days | Select-Object date,tithi,moonMonth,observances,windows | Format-List
```

Check: `/uk/panchanga#vedic-festivals` and English route;
changing amanta→purnimanta must not change sunrise instants or tithis;
changing user coordinates must change actual local rise/set and Abhijit;
compare festival indicators for Rama Navami (2026-03-26) and
Maha Shivaratri (2026-02-15), New Delhi, against Drik Panchang;
invalid `days=8`, `start=2026-02-30`,
`monthSystem=foo`, latitude=91 → 400;
missing Swiss source→503 without fake festival dates.
JQA-3 natal and AE-P6 NASA benchmarks must remain green.

## AE-P8 remaining reference gates

- Full Smarta/Vaishnava Ekadashi selection (Dashami Vedha, arunodaya,
  consecutive sunrise/vriddhi/kshaya Ekadashi) and verified Parana
  with Hari Vasara/Dvadashi constraints.
- Tradition/location-specific festival exact-day priority (Madhyahna,
  Nishita, Rohini overlap, Pradosha, repeated/omitted tithis).
- Amanta/Purnimanta advanced adhika/nija/kshaya rare-case naming and
  published multi-region independent gold dates, pinned provenance.
- Expand beyond seven-day preview with asynchronous precomputed
  astronomical timelines and bounded worker pools; local/elevation
  horizon policy, calendar subscription/export after user acceptance.
- Dedicated independent Drik cross-reference grid; do **not**
  rebrand JQA-3's 20 natal cards as festival certification.
