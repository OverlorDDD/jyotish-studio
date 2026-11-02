# P3.6 · Panchanga Production Release & Acceptance — operator runbook

**State**: code + guarded release candidate only; **NOT** deployed to galaxiora.com. Repository branch `release/panchanga-p36-production-acceptance-20261102` stacks on P3.5 tested `e13b5fe80f48fea382b5cec44f3704b264bec6aa`. Do not silently merge main, enable indexing, rotate provider keys, modify brand or AWS billing, or replace live data.

## Approved stage order
P3.1 My Day UX → P3.2 deterministic traditional interpretation → P3.3 verified owned-natal resonance → P3.4 sunrise-to-next-sunrise exact time windows → P3.5 7/30 sunrise-snapshot Personal Calendar → **P3.6 safety, independently reviewed evidence, QA, rollback and operator approval**. This stage does not introduce another horoscope engine, unsourced rules, LLM usage, or background paid external service.

## Official operating and calculation instructions reviewed / integrated
Reference the upstream documentation; proprietary manuals are **not mirrored** into the public repo.
- Swiss Ephemeris programming manual: https://www.astro.com/swisseph/swephprg.htm — UTC to Julian Day, returned SWIEPH flags, longitude **and speed** and sidereal mode. P3.6 requires the existing `@swisseph/node` JQA-3 profile; no additional ephemeris binary or license is bundled. Its speed-aware adaptive sign-ingress verification uses `longitudeSpeed` and boundary-distance envelopes, including a retrograde cross-and-return missed by endpoint scans.
- Swiss Ephemeris library and license information: https://www.astro.com/swisseph/ — **license check remains an independent commercial release requirement**; code tests cannot resolve license obligations.
- PostgreSQL 16 `pg_dump`: https://www.postgresql.org/docs/16/app-pgdump.html ; `pg_restore`: https://www.postgresql.org/docs/16/app-pgrestore.html — online consistent `--format=custom` snapshot, `pg_restore --list` archive TOC, **actual isolated restore into a new database** in CI, no automatic production DB destructive downgrade. Restoring an arbitrary untrusted archive is not safe; use only own verified CI/production backup.
- Git `git merge-base --is-ancestor`: https://git-scm.com/docs/git-merge-base — pin an exact verified SHA and prevent the live divergent tree from being reset/overwritten.
- systemd `systemctl restart`: https://www.freedesktop.org/software/systemd/man/latest/systemctl.html — targeted API then Web restart, health tested after each; **do not restart Caddy**.
- Caddy reverse proxy operations: https://caddyserver.com/docs/caddyfile/directives/reverse_proxy — preserve existing DNS, TLS/Caddyfile and reverse proxy settings.
- GitHub Actions protection environments: https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments — no production credentials in CI, GitHub Actions jobs are read-only to live AWS, explicit operator checkpoint.
- IANA zones https://www.iana.org/time-zones and JavaScript Intl https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat — exact UTC vs observer time (local civil midnight/DST).
- P3.2 traditions and P3.3 personal limitations: `docs/research/panchanga-p32-rules-2026-11-02.md`, `docs/research/panchanga-p33-resonance-2026-11-02.md`. Classifications are Vedic traditional guidance rather than guaranteed or experimentally proven life outcomes.
These URLs, tests, software interfaces and guarded shell instructions are the versioned instruction set implemented in this repository. No unapproved downloads or new dependency versions have been deployed to AWS.

## Audit: real blockers and dispositions
| Severity | Blocker | Resolution / release gate |
|---|---|---|
| CRITICAL | **Main and P3.5/P3.6 history diverged** (GitHub compare on 2026-11-02 reports ahead 1569, behind 15 against main; merge base `2500242...`) | **OPEN integration gate**. The P3.6 release script uses `git merge-base --is-ancestor LIVE_SHA CANDIDATE_SHA` and aborts on divergent histories. Reconcile current production SHA, main changes, website icon pipeline, News and GA4 **in a dedicated reviewed integration PR**. No `git reset --hard`, force-push or destructive checkout on EC2. The P3.6 draft PR must stack on P3.5 until then. |
| HIGH | 30-min planet ingress scan missed retrograde double crossing | Implemented `apps/api/src/panchanga-ingress.ts`: adaptive Swiss `longitude+speed` edge checks, 1-second subdivision, cap 16 ingress events / body / sunrise day, bounded source samples, fail closed on ambiguous data; regression includes forward, reverse, 0° wrap and hidden twice-in-bin. The envelope is conservative **not formally independent certified exhaustive** across all dates. |
| HIGH | A next-supported P3.4 interval may be active and printed with a past start | UI now shows `max(interval.start, availableFrom)`, never a recommended start before the user-selected instant. |
| HIGH | Real birth records, session secrets and production DB | 401 unauthenticated endpoints, `private,no-store`, `Vary: Cookie`, selected primary chart belongs to owner, synthetic dual-account Chromium tests, no private user data in public sitemap or GitHub Actions. |
| HIGH | Backups existed without proof of restoration | P3.6 CI makes custom PostgreSQL 16 dump and actually restores to **disposable** `p36_isolated_restore` database; EC2 script separately creates private `0600` production archive and verifies its TOC. **Production restore drill and off-host retention still require operator sign-off.** |
| HIGH | One EC2 server, 4GiB-class memory, 30-day heavy batch | P3.5 bounded 7/30 sunrise batch, lazy P3.4 selected day, P3.3 owner rate limits; inspect actual server disk/CPU/memory and backup archive size before cutover. Fail preflight with <3GiB free; 30-day 100s timeout in read-only post-deploy smoke. |
| HIGH | Risk of overwriting approved spiral #6/SEO/news configs | Script checks canonical icon source and forbidden old icon.svg, reuses production `.env`, does not edit Caddy, Google indexing, News translation, GA4 or branding; runs P2.5 brand byte check and R4.3 regression. |
| MEDIUM | Older Personal Dashboard local-noon 7/30 vs P3.5 sunrise 7/30 | Keep explicit sampling provenance and separate Personal navigation link; never call a sunrise Moon support a whole-day guarantee. |
| MEDIUM | Polar regions/no sunrise, missing ephemerides or DST transitions | Fail closed instead of fabricating a day, preserve IANA zone and verified Sunrise UTC continuity, use existing full browser test corpus. |
| MEDIUM | Existing separate weather/eclipse visibility/JQA-3 natal corpus limitations | Do not claim JQA-3 natal accuracy automatically certifies *all* Panchanga/muhurta timings. Independent Drik Panchanga/date/city sample comparisons and near-station cases still required before marketing "fully certified exact Muhurta" claims. |

## Automated release evidence
The following **must be green on the identical HEAD SHA**:
- `npm run test:panchanga` P2.1–P3.6, including P3.6 double-crossing ingress tests; `npm run test:vedic-calendar`, `npm run test:p36:release`.
- Full NestJS + Next.js `npm run build`, approved Galaxy #6 brand, R4.3 SEO and bilingual smoke.
- Playwright `Panchanga P2.1–P3.6 Browser Integration` UA/EN desktop/mobile, location and DST, P3.3 chart owner, P3.4 precision, P3.5 7/30 owner and guest. `Panchanga P3.5 Focused Browser Acceptance` was green on `e13b5fe`; rerun on P3.6 final SHA if relevant files change.
- `.github/workflows/panchanga-p36-acceptance.yml` creates and restores PostgreSQL 16 archive in CI; **does not have SSH/AWS production secrets and does not deploy**.
- Only after the actual cutover: `npm run site:check`, `npm run launch:verify`, `npm run r32:seo:audit`, `node tools/panchanga-p36-smoke.mjs` on loopback and HTTPS, `node tools/panchanga-p25-smoke.mjs` exact icon #6, 401 guest/30-day, plus manual authenticated proof on real device.

## On Windows, safe code/QA inspection (does not touch AWS)
```powershell
git fetch origin
git switch --track origin/release/panchanga-p36-production-acceptance-20261102
npm install --no-audit --no-fund
npm run test:panchanga
npm run test:p36:release
npm run build
```
If the local branch already exists, use `git switch release/panchanga-p36-production-acceptance-20261102`. Use an isolated local checkout if you have uncommitted work, **do not run destructive clean/reset**.

## EC2 checklist: first run is read-only
**Only when all GitHub checks are green, live code has a reviewed fast-forward reconciliation and the owner explicitly authorizes deployment.** SSH to the *existing* host with its already configured key; do not send a password or `.env` into chat.
```bash
cd /opt/galaxiora/app
bash tools/panchanga-p36-release.sh diagnose
```
This reports SHA, tracked-change count, disk and service health; it changes nothing on AWS.

After reviewed integration PR and SHA selection, **replace the SHA value below with the precise 40-character HEAD of the fully green integrated candidate**:
```bash
export P36_TARGET_SHA='<exact green integrated commit SHA>'
bash tools/panchanga-p36-release.sh preflight
```
The preflight **must fail** if the live checkout diverges. Do not change this guard or force reset to "make it pass". Reconcile upstream instead.

Only with a reviewed same-SHA tested candidate, intact private production DB backup policy and owner approval:
```bash
export P36_ATTESTED_SHA="$P36_TARGET_SHA"
export P36_APPROVAL='I_APPROVE_P36_PRODUCTION'
bash tools/panchanga-p36-release.sh deploy
```
The deploy copies the existing private `.env`, saves custom-format database snapshot outside webroot in `~/.galaxiora-p36`, checks the archive, builds and migrates, then restarts API/Web and runs read-only public and private safety checks. It does **not** claim an actual release happened until `P36_PRODUCTION_RELEASE_VERIFIED` is printed with the exact commit.

If code has to be returned to the previous SHA, use the explicit guarded rollback **only after assessing whether the failure is code or database and protecting any tracked changes**:
```bash
export P36_ROLLBACK_APPROVAL='I_APPROVE_P36_ROLLBACK'
bash tools/panchanga-p36-release.sh rollback
```
Rollback restores prior *code + private environment* and rebuilds, **not the database**. In a DB-corruption situation do not overwrite a live data set automatically; first take a new incident snapshot and follow PostgreSQL recovery with the owner. Track the production backup archive retention (encrypted/off-host); a local copy alone does not protect against full-instance loss.

## Operator acceptance / GO or NO-GO
**NO-GO** while any of these remain:
- [ ] Final green CI SHA and all parent stacked PRs reviewed (P3.1→P3.5).
- [ ] Current main and actual EC2 SHA reconciled without lost approved visual/News/SEO/GA4 work.
- [ ] Independent Panchanga comparison sampled at transitions across regions/seasons, including near station. No unsupported precision claims.
- [ ] AWS memory/disk/backup retention, security groups, TLS, secure cookies, privacy policies and owner-specific endpoints verified.
- [ ] Production custom-format archive checked; separate recoverability/retention plan recorded.
- [ ] Explicit release authorization, approved maintenance window and acceptance criteria supplied by owner.
- [ ] After deployment, two-browser/device UA/EN + personal owner checks, known dates, 7/30 calendar, Rahu/tithi/anga change and rollback readiness.

**Release closure requires positive evidence, not merely writing code to GitHub.**
