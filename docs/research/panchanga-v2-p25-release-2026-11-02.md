# Panchanga 2.0 — P2.5 release and verification (2026-11-02)

## Integration
P2.5 release candidate: release/panchanga-v2-p25-integrated-20261102. Built on P2.4 PR #83, including P2.3 #82, P2.2 #80, P2.1 #78 and approved spiral #6/GA4 ancestors. Selected R4.3 deliverables from SEO siblings #79 and #81 were integrated individually: IndexNow core, strict tests, workflows, English/UK Moon-versus-Sun article and links, SEO index paths and documentation. Older P2.2 UI/core from the SEO sibling were deliberately NOT copied over the later P2.4 implementations. package.json retains BOTH full Panchanga tests and R4.3 SEO scripts.

## Editorial quality
The public UI in Ukrainian and English must identify the measured item, its time basis and its meaning. Tithi is each 12 degrees of Sun–Moon elongation; Karana is each 6 degrees; Nakshatra is one of 27 sectors of 13°20′; Nitya Yoga divides summed longitudes into 13°20′ sectors; Vara runs sunrise to sunrise. Exact astronomical phases are not eclipses. Festival markers are provisional traditional indicators, not fully certified fasting, puja or Parana dates. Remove vague marketing, technical Python/Prisma error text and generic advice. Text was revised in Hub, Live Day, day events, week/month, Personal, additional calculators, astronomy and eclipses.

## CI acceptance
Require tests passing against the exact final branch SHA:
- Panchanga 2.0 Quality: full build, Prisma generation, P2.1–P2.5 tests, Vedic.
- Panchanga P2.1–P2.5 Browser Integration: isolated PostgreSQL, genuine Swiss/Python and desktop/mobile Chromium.
- R4.3 SEO + IndexNow safety workflows and branch scripts: npm run test:r43:seo, npm run test:r43:visitors, npm run test:r32:seo.
- Branding: npm run test:brand:icons.
- Shell safety: bash -n tools/panchanga-p25-release.sh.
- Post-deploy public checks: npm run site:check, npm run launch:verify, npm run r32:seo:audit, npm run p25:smoke.

## AWS release — PowerShell
Run from Windows PowerShell; the IP might change:

~~~powershell
ssh -i "$env:USERPROFILE\.ssh\galaxiora-aws-key.pem" ubuntu@13.50.218.38
~~~

Now inside Ubuntu. Replace EXACT_GREEN_SHA with the complete tested 40-character SHA of P2.5 GitHub PR #84:

~~~bash
cd /opt/galaxiora/app
git fetch origin release/panchanga-v2-p25-integrated-20261102
git show FETCH_HEAD:tools/panchanga-p25-release.sh > /tmp/p25-release.sh
P25_TARGET_SHA=EXACT_GREEN_SHA bash /tmp/p25-release.sh preflight
~~~

The preflight STOPS for a divergent live Git HEAD, uncommitted tracked changes, insufficient disk (<2GiB), missing services, outdated release commit, unexpected public indexing or GA4, missing auth secrets or DB backup unit. **Do not bypass with git reset --hard or switch to outdated main.** Send errors back to the main engineering chat for a safe reconciliation.

After PASS and the final user review/approval:

~~~bash
P25_TARGET_SHA=EXACT_GREEN_SHA P25_DEPLOY_CONFIRM=DEPLOY_P25 bash /tmp/p25-release.sh deploy
~~~

Script behavior: run existing DB backup service; retain private .env plus previous commit/build, test before switching service; use only approved pinned commit; npm install (repository has no tracked package-lock.json), Prisma generate, full build, unit/SEO/brand tests, additive P2.1 profile migration, restart API then Web, require local health, site checks and HTTPS smoke including approved spiral #6 byte check. No IndexNow submission, no DNS change, no rewriting env. On failure, attempt code-only rollback and preserve DB backup. Database migrations are additive and not reversed automatically.

Manual code rollback:

~~~bash
bash /tmp/p25-release.sh rollback
~~~

## Browser acceptance
1. Open https://galaxiora.com/uk/panchanga and /en/panchanga. Check 5 angas, readable 12°, 6°, 13°20′ definitions, exact labelled transition times, local sunrise. Switch Kyiv, London, Delhi and verify local timezone.
2. Switch 7 days / Month, Amanta / Purnimanta, festival/phase filters and click a date to return to exact daily timeline. Cover 28/29/30/31-day months and DST dates.
3. Open only one extra module: private Tarabala/Chandrabala (guest should be denied personal values), planetary transitions or eclipse visibility. Check no redundant festival-week API.
4. On 320, 360, 390, 430 px phones check tabs, calendar grid, form and absence of horizontal scrolling.
5. Open https://galaxiora.com/uk/astrology/moon-sign-vs-sun-sign and /en equivalent, robots.txt, sitemap.xml and verify favicon is the approved galaxy spiral #6, not plain G.
6. In browser network tools check public /api/v1/panchanga/day and /api/v1/vedic-calendar/overview. Check GA4 only after consent using Realtime/Tag Assistant. Google search indexing and icon display may lag.

## Completion gates
Source integration and editor copy can be complete with green GitHub CI; actual AWS rollout cannot be certified without live operator SSH and browser verification. Leave P2.5 Draft until live deployment checks and approval; there is no need for P2.6 features unless verification reveals concrete defects. Only this main engineering conversation writes to GitHub; SEO conversation prepares research and drafts.


## AWS blocked on dirty tracked files (observed 2026-11-02)
The operator reported `STOP: tracked local modifications detected` after fetching the P2.5 branch. This proves **only that Git sees tracked differences**, not their contents or whether they are safe to discard. The script did not deploy or mutate the DB. Production may additionally have a divergent HEAD; diagnose both *before* any cleanup.

Fetch the latest release script and run the read-only diagnostics:

~~~bash
cd /opt/galaxiora/app
git fetch origin release/panchanga-v2-p25-integrated-20261102
git show FETCH_HEAD:tools/panchanga-p25-release.sh > /tmp/p25-release.sh
bash /tmp/p25-release.sh diagnose
~~~

The diagnostic prints only changed filenames, status, diff statistics and release ancestry. It intentionally does **not** print confidential contents or reset files. If only generated `apps/web/next-env.d.ts` or `package.json` are modified, inspect and privately back them up before any targeted cleanup. If there is a real application edit or `GIT_ANCESTRY=DIVERGED`, reconcile it in the main engineering GitHub-writing conversation. Never use `git reset --hard`, `git clean -fd`, blanket stash or forced checkout on production. The branch SHA must match the *new* CI-tested HEAD after editorial fixes; do not use the prior P2.5 SHA.
