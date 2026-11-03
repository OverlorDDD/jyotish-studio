# Galaxiora P3.8.8 — Independent QA, source signoff and controlled production

**Prepared 2026-11-03.** Source branch:
`release/panchanga-p388-independent-qa-20261103`.
**Target: merged integration commit on `main`, not a detached/old draft PR.**
**No AWS deployment is performed by GitHub Actions or this document.**

## 1. Reality check and verified scope

P3.8.1–P3.8.7 are stacked unmerged draft PRs #92–96. Their feature
branch is **not a substitute for a reviewed production merge**: `main`
also contains approved round Galaxy #6, GA4/SEO and multilingual News
changes. The final P3.8.8 release must include **all** relevant ancestors
in one non-squashed merge commit so the running server can fast-forward
without resetting any approved production changes.

### Sources and exact numerical model

| Authority | Used for | Do NOT claim |
|---|---|---|
| [Swiss Ephemeris 2.10 programming manual](https://www.astro.com/swisseph/swephprg.pdf), `swe_calc_ut`, `swe_houses`, `swe_rise_trans` | True UTC Julian date, planets, selected city's event ascendant, horizon crossing. Real `SWIEPH` files + returned flag required; no `MOSEPH` fallback | A chart by itself guarantees any human outcome |
| Independently implemented **PySwissEph 2.10.03** + Python `zoneinfo` | 30 pinned ASC locations / 17+ IANA zones (real values, <1" tolerance); 28 independently sampled local sunrise days across Kyiv DST, London, Sydney and Nepal | Absolute independence of planetary ephemeris theory (native Node and Python both wrap Swiss C astronomy) |
| [IANA TZDB](https://www.iana.org/time-zones) (latest at audit: **2026f** published 2026-10-27) | Local date / ambiguous autumn folds / nonexistent spring civil times, historical/future UTC offset | Fixed +02/+03 local conversions, or safe inference of UTC from an ambiguous local time |
| [Raman, *Muhurtha*](https://ved.bz/_jyotish/books/muhurtha.html), marriage **chapter 9 of this HTML transcription**, special adverse yogas Ch 5, house-building Ch 12 | Source-scoped classical election and exclusion/review gates | Full wedding/ceremonial certificate while mandatory 21 Mahadoshas and Kutas incomplete |
| Original independently archived JHora natal exports, historical DLL/Delta-T provenance | JQA3 source profile (mean Lahiri historical 0.13823494055031915" correction and monthly Delta-T) for exact event ASC, consistent with prior JQA3 vectors | Complete JHora Vimshottari date-mode certification: several alternative year definitions remain unresolved |

**Source edition note:** some Raman PDF reprints label Marriage as
“CHAPTER XI” in the contents, whereas the cited HTML transcription names
it Chapter 9. Verify rule **text and section heading**, not an assumed
universal chapter number. This mismatch is a documentary labeling
difference, not an astrological computation.

The **30-row pinned independent table** is
`tests/fixtures/p388-independent-asc-30.tsv`, with PySwissEph 2.10.03
`houses(JD_UT)`, mean Lahiri and explicit JHora8 convention offset.
The independently authored Python script recomputes and checks every
value plus its local time; Node checks 30 native event-Lagna positions at
the same UTC and coordinates against those frozen results.

The **28 sunrise-day** matrix uses official `sepl_18.se1` and
`semo_18.se1`, rejects non-SWIEPH returned flags, calculates exact
Swiss sunrise, compares UTC within 2 s and Sun/Moon within 2 angular
seconds. Its independent five-anga indices use:
- `Tithi = floor(((Moon−Sun) mod 360)/12)+1`.
- `Nakshatra = floor(Moon/(360/27))+1`.
- `NityaYoga = floor(((Moon+Sun) mod 360)/(360/27))+1`.
- `Karana slot = floor(((Moon−Sun) mod 360)/6)+1`.
- `Vara = local civil weekday, Sunday=1, Monday=2, …, Saturday=7`.

All longitudes are under the same versioned sidereal Lahiri reference.
Angular precision is a numerical property of the astronomical calculation.
No 0–100% success probabilities are inferred from traditional signals;
P3.8.6's small share-of-supported-signals circle remains a **transparent
observed-evidence ratio only**, never a calibrated outcome probability.

**P3.8.7 temporal invariants:** A personal event belongs to the
half-open verified local sunrise interval `[sunriseUTC,nextSunriseUTC)`,
not the civil date from its UTC string. 7/28/29/30/31-day personal
calendars must reconcile public/private sunrise, 5 limbs, city, IANA
zone, astronomy profile and verified JQA3 natal owner. Time Finder
remains 7/30 actual sunrise days, only the first candidate and first
review window per day, not a catalogue of all passing minutes.

## 2. Blockers that were explicitly removed

- **P3.8.7 browser QA red:** both UA/EN scenarios selected a travel
  activity before changing category from Work to Travel; test
  `e2e/panchanga-p387.spec.mjs` fixed in upstream PR #96 and inherited
  in P3.8.8. Upstream P3.8.7 quality and Playwright now green.
- **No independent 30-case source corpus:** P388 table + Python
  cross-check + native JQA3 event ASC test added.
- **No real independent local-sunrise oracle:** Python SWIEPH-only
  28 sunrise-day fixtures sampled live in CI, refusing Moshier fallback.
- **Parallel CPU-heavy Swiss searches:** P388 single-flight API guard
  lets one 7/30-day Time Finder run per API process. Other users get
  explicit busy rather than unbounded queue. This is **not** a
  distributed multi-instance lock.
- **No operator-controlled same-SHA deploy:** New P388 release script
  only admits a pinned reviewed `main` SHA, checking `RELEASE_ROOT`
  ancestry and that live checkout is ancestor of the candidate. It
  never uses `git reset --hard` or changes Cloudflare, Caddy, indexing,
  Azure News configuration, saved charts or round Galaxy #6 logo.
- **No guest production verification for full month:** New read-only
  smoke checks 31-day range and month against the exact day and all
  five sunrise limbs, source profile, 401 private endpoints,
  bilingual News/Panchanga and robots/sitemap.
- **No isolated database restoration:** P388 CI performs a custom
  PostgreSQL dump and restore into a separate disposable CI DB, checks
  tables. Live backup during deploy is owner-private and TOC checked;
  never auto-restore over real user data.

## 3. Remaining NO-GO checks and what success actually means

1. All GitHub workflows **on the exact reviewed release SHA** green:
   P388 Independent Astronomy + Protected Browser + CI backup-restore,
   Panchanga 2.0 Quality, R4.3 brand/SEO, and focused authorizer tests.
   First run failure is a blocker until fixed on a later SHA.
2. **Performance on real EC2**: sample one owner-authorized 7-day and
   one 30-day Swiss Time Finder search in the site UI, observe CPU
   credit/load, memory, 503 busy feedback, API and web response latency;
   record metrics and retry behavior without logging personal chart
   contents. P388 serializes expensive scans but does not prove a
   30-day latency SLA or an independent exhaustive window certificate.
3. **Full wedding**: 21/21 applicable classical Mahadoshas,
   exceptions, full two-person Kutas and D1/D9 house rules remain
   OPEN per P3.8.6 certification plan. Result must remain
   `screened_requires_review`; no certification wording.
4. **Vimshottari**: independent JHora8 year-mode and full major/minor
   period date agreement remain OPEN in the JQA3 research corpus.
   Internal timeline calculations use the declared convention; do
   not market them as fully JHora-certified dates.
5. **External operations**: actual EC2 HEAD, disk/swap and database
   recoverability, live HTTPS/sitemap/canonical/hreflang, saved Galaxy #6
   icon, access controls, and two-device UI testing require operator
   evidence after deployment. No production secrets in GitHub/ChatGPT.
6. **IANA timezone changes**: future civil schedules may change.
   Snapshot version/provenance; rerun reference tests after OS tzdata
   or PHP/Node upgrades if expected local offsets change.

## 4. GitHub, from review to main

1. Review the historical stacked PRs **#92 → #93 → #94 → #95 → #96**.
   The P388 child PR is based on P387. Also review the P388 integration
   PR targeting `main`: this carries the entire chain together.
2. Wait for P388 `independent-astronomy`, `protected-browser` and
   `release-candidate` on the same head commit to pass, including
   30 independent Swiss ASC and 28 local sunrise days.
3. Merge the reviewed P388 **integration** PR to `main` using
   **“Create a merge commit”**, **NOT “Squash and merge”** or force push.
   This is required by the release script's explicit ancestry proof.
   Merge ancestors/branches through this one integration PR; do not
   separately duplicate the older PRs if already included.
4. Run/inspect P388 Release Gate for the **new main SHA**. Only the new
   `main` merged SHA, not the earlier feature SHA, goes to EC2.

## 5. Windows PowerShell — connect to existing AWS

Use your **current** EC2 public IP from AWS console (do not assume
historical IP is unchanged); keep existing SSH key private:
```powershell
ssh -i "$env:USERPROFILE\.ssh\galaxiora-aws-key.pem" ubuntu@<YOUR_CURRENT_EC2_IP>
```
Below all commands are **inside the Ubuntu SSH session**, NOT PowerShell.
The first part is non-mutating:
```bash
cd /opt/galaxiora/app
git status --short
git fetch --no-tags origin main
git log -1 --format='%H %s' origin/main
git show origin/main:tools/panchanga-p388-release.sh > /tmp/galaxiora-p388-release.sh
bash -n /tmp/galaxiora-p388-release.sh
bash /tmp/galaxiora-p388-release.sh diagnose
export P388_TARGET_SHA="$(git rev-parse origin/main)"
bash /tmp/galaxiora-p388-release.sh preflight
```
`P388_PREFLIGHT_PASS` means verified main SHA, correct 30-vector
release ancestry, existing HTTPS/indexing policy, active services,
approved icon, disk and DB, and safe fast-forward from LIVE SHA. It does
**not** by itself mean live independent astrology/ceremony approval.

If `P388_STOP: Live checkout diverges` appears, DO NOT force-reset.
Do not overwrite locally deployed logo/news fixes. Compare actual
server SHA and integrate them safely via a reviewed GitHub PR; rerun CI
and pin a **new** exact `main` SHA. If `SITE_NOINDEX` differs,
review existing SEO production policy rather than flipping it silently.

## 6. Deploy only after all same-SHA checks are GREEN

Still inside Ubuntu SSH, after explicitly reviewing CI and deciding
to deploy:
```bash
export P388_CI_ATTESTED_SHA="$P388_TARGET_SHA"
export P388_APPROVAL='I_APPROVE_P388_PRODUCTION'
bash /tmp/galaxiora-p388-release.sh deploy
```
This runs fresh private PostgreSQL backup, verifies its TOC, retains
`.env`, updates **only reviewed main source**, runs all Node/Swiss
regressions and production build, applies only existing Prisma
migrations, restarts existing API + web services (does not stop Caddy),
checks `site:check`, `launch:verify`, R3 SEO audit, new
7/31-day/source/provenance guest smoke on loopback + HTTPS, and
approved Galaxy #6 binary icon checks. Success has **only one valid
marker**: `P388_PRODUCTION_RELEASE_VERIFIED sha=<exact_SHA>`.

If the marker is absent, do not consider the release complete.
The guarded failure trap attempts a **code-only** rollback. Never
automatically overwrite the production database with an old snapshot.

### Optional, additional read-only verification
```bash
cd /opt/galaxiora/app
P388_SITE_ORIGIN=https://galaxiora.com P388_PUBLIC=1 node tools/panchanga-p388-production-smoke.mjs
P25_SITE_ORIGIN=https://galaxiora.com P25_EXPECT_PUBLIC=1 P25_VERIFY_BRAND=1 node tools/panchanga-p25-smoke.mjs
npm run site:check
npm run launch:verify
sudo systemctl --no-pager --full status caddy galaxiora-api galaxiora-web
sudo journalctl -u galaxiora-api -u galaxiora-web -n 80 --no-pager
```

### Roll back source-only on a regression
```bash
export P388_ROLLBACK_APPROVAL='I_APPROVE_P388_ROLLBACK'
bash /tmp/galaxiora-p388-release.sh rollback
```
The script reverts **code** to previously backed up SHA and restores
the protected `.env`, then rebuilds/restarts. It does **not** restore
the database. If a data incident occurs, take a separate new incident
snapshot before controlled DBA recovery. Keep encrypted off-host
backups; a single EC2-local backup will not survive instance loss.

## 7. Visible live acceptance (actual owner performs)

1. Open `https://galaxiora.com/uk/panchanga?date=2026-11-03`;
   confirm full Day and five exact angas, city change + Save/Restore.
   Repeat `/en/panchanga?date=2026-11-03`: no untranslated
   instructions, header/body fits at **320px and 390px**.
2. Switch **Day → 7 days → Month**: verify shared selected activity,
   actual 30 November days, 31 October days, leap February 2028 has
   29. Month must not attach a whole-day verdict to sunrise-only facts.
3. Sign in with your own verified primary natal chart, choose
   **“Show personal events”**, verify 28–31 sunrise indicators,
   exact Moon/Dasha transitions and no dates missing at DST.
4. Choose a real specific activity; explicitly select
   **“Find verified time windows”** for 7 and 30 days. Candidate vs
   Requires Review must be distinct; click “Open this exact moment”.
   Wedding/foundation must **not** display FULL CEREMONIAL CERTIFIED.
5. Guest and a second signed-in user must never see the owner's natal
   data. Do not share another person's natal inputs or session cookie.
6. Visit `/uk/news` and `/en/news`, verify approved round spiral
   icon in tab and header; check SEO canonical/hreflang/robots/sitemap.
7. Observe CPU, EC2 memory/credits and per-owner Time Finder budget.
   Confirm 503-busy after concurrency >1 is shown as a temporary
   unavailable calculation rather than as “no favorable time.”
   Document timing and any failed source checks before declaring GO.

**Scope of user-facing claim:** astronomy and documented source-scope
rule implementation are independently tested. Classical interpretations
are traditional counsel, not scientifically established forecasts.
Incomplete wedding/foundation rules and JHora full dasha date parity
remain explicitly un-certified.
