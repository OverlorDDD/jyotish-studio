# GalaxiPedia — GalaxiLearn + Cosmic Encyclopedia release contract
**Prepared:** 2026-11-04  
**State:** feature branch and PR only; AWS not changed by this release.
**Base:** `529fa198946d2a96e394d624ae5c78f3a3968502` (GROWTH-1 release #109; based on live Panchanga 2.0/GA4 branch `21e8b3d5...`). Not outdated `main`.

## 1. Read-only Academy audit (source files)
- `apps/web/lib/academy-content.ts`: eight existing EN/UK tutorials, three topics (Jyotish, Tarot, yoga/practice), three sections and one multiple-choice quiz each; *IDs/slugs and lesson texts must remain stable*.
- `apps/web/app/[locale]/learn/[slug]/page.tsx`: old lessons, published CMS articles, meta, one-source Article JSON-LD, GalaxiCom contextual links, tool links and locale-switch logic.
- `apps/web/app/components/AcademyQuiz.tsx`: prior quiz choice and feedback were local React state only, **no server persistence**. This release adds browser-local successful completion keyed by lesson slug (independent of locale); do not claim old account-level progress was migrated.
- `apps/web/app/components/PublishedAcademyQuiz.tsx`: bilingual CMS quiz remains; successful completion recorded browser-locally.
- `apps/web/lib/editorial-public.ts`: published-only API boundary; `EditorialArticle` and `EditorialPublishedCards` are reused, with no schema/role changes. Unpublished/archived content stays non-public.
- `apps/web/lib/glossary.ts` and `GlossaryText`: existing bilingual term definitions and in-text help reused rather than duplicated.
- `apps/web/app/[locale]/[section]/page.tsx`, `PortalShell`, `brand.ts`: current GalaxiLearn is the existing learn navigation position; no new header item.
- `apps/web/app/sitemap.ts`, `site-indexing.ts`: previous static and dynamic Academy lesson URLs included in bilingual sitemap; migrate URLs and canonical carefully.

## 2. New public information architecture
- `/en/pedia`, `/uk/pedia`: a single index showing **8 preserved lessons + 3 original editorially authored reference guides** in six themes. Search/filter client-side, no public query string or user profiling. Published CMS articles also appear through the same existing public API, without altering drafts or moderator workflow.
- `/:locale/pedia/:slug`: existing 8 static lessons, 3 new guides and published-only CMS Academy entries. Old quizzes, GalaxiCom context bridge and practical tool CTAs remain. Guides have in-article links and human-readable source attribution.
- `/:locale/pedia/glossary`: filterable dictionary made from the existing bilingual term definitions, with related learning links.
- New original EN-first / UK-complete guides: Five Panchanga limbs, Moon phases and synodic cycle, Sun/Moon/Rising signs across Western/Jyotish systems. **No bulk auto-generated SEO pages.**
- `/en/learn`, `/uk/learn`, and `/:locale/learn/:slug`: **permanent 308** to matching `pedia` URLs with unchanged locale and slug. Original lesson and CMS DB slugs unchanged.
- SEO: individual title/description, per-locale canonical, EN/UK hreflang and x-default, sitemap for only final 200 pages, existing Article structured data reused. Root `SITE_NOINDEX` policy remains unchanged.

## 3. Explicit limitations and gating risks
1. **Production ancestry is not proven live from this tool session.** Owner must inspect exact EC2 HEAD, worktree and current production URLs. GROWTH-1 release #109 is the selected verified ancestor, but other parallel changes (GROWTH-3/Panchanga) can land at any time. Do not deploy an outdated branch over them.
2. Legacy quizzes did not persist to an account; newly completed quizzes now persist **only in this browser/localStorage**, not across devices or authenticated accounts. Old live React-only choices cannot be reconstructed.
3. The new three curated slugs must **not collide** with existing production CMS article slugs. Check `/api/v1/content?kind=ACADEMY` before rollout. A collision blocks release until renamed; do not shadow existing publications.
4. The CMS public API must be reachable for the CMS article search and live detail pages; the eight built-in lessons and three guide pages remain static.
5. Redirect validity must be checked for 200, 308, canonical, hreflang, locale-switch and absence of redirect chains; SEO recrawl/reindex timing is controlled by search engines, not the release.
6. Verify visual responsiveness on Chrome Android around 360px, and that logo #6 is still present (including favicon and site-name JSON-LD).
7. No modified `.env`, GA4 consent, Panchanga engine, migrations, news jobs or payments permitted. No paid tools/LLMs/automated SEO generation.

## 4. Tests and acceptance
```bash
npm run test:pedia
npm run test:content:a5
npm run test:growth1:seo
npm run test:r32:seo
npm run build
npx playwright test e2e/galaxipedia.spec.mjs e2e/a5-yoga-academy.spec.mjs e2e/a6-editorial.spec.mjs e2e/a4-portal.spec.mjs
```
The browser suite requires a **disposable** PostgreSQL environment, API, web server and Chromium, as provisioned in `.github/workflows/galaxipedia-validation.yml`. It must never run authentication fixtures against the live production database.

Required checklist:
- [ ] Both old hub URLs and two existing lesson deep links respond 308 and land at correct locale+slug
- [ ] 8 original lessons, all original knowledge checks, existing CMS publication and archive still work
- [ ] Correct-only quiz completion survives reload and EN/UK switch; incomplete state does not look passed
- [ ] 3 substantial bilingual guides show sources, related terms and relevant functional links
- [ ] Dictionary searches, topic filters, mobile (360px), focus labels and locale switches pass
- [ ] Sitemap contains only new canonical Pedia URL set, new glossary and translated alternates
- [ ] Every new 200 URL has indexable canonical, hreflang, and eligible Article schema
- [ ] GA4 consent and collection, logo #6, original main nav count, Panchanga 2.0, Jyotish, Tarot and News intact

## 5. Safe AWS deployment (operator-controlled, **not** done by PR)
On the operator's Windows PowerShell, read the live AWS state first:

```powershell
$key = "$env:USERPROFILE\.ssh\galaxiora-aws-key.pem"
$hostName = "ubuntu@13.50.218.38"
ssh -i $key $hostName "cd /opt/galaxiora/app && echo LIVE_HEAD && git rev-parse HEAD && echo TRACKED_STATUS && git status --porcelain --untracked-files=no && echo ALL_STATUS && git status --short && echo WEB && systemctl is-active galaxiora-web && echo API && systemctl is-active galaxiora-api"
```
Do not put `.env`, personal credentials or natal data in GitHub. Inspect the output. On the same AWS shell, after the PR is reviewed and all checks green, read-only preflight:

```bash
cd /opt/galaxiora/app
git fetch origin feat/galaxipedia-unified-20261104
LIVE=$(git rev-parse HEAD)
CANDIDATE=$(git rev-parse FETCH_HEAD)
printf 'LIVE=%s CANDIDATE=%s\n' "$LIVE" "$CANDIDATE"
git merge-base --is-ancestor "$LIVE" "$CANDIDATE" || { echo 'BLOCK: concurrent production changes; integrate, do not overwrite'; exit 1; }
test -z "$(git status --porcelain --untracked-files=no)" || { echo 'BLOCK: tracked changes on AWS; inspect and back up first'; exit 1; }
```
If the ancestry or worktree gate blocks, do **not** `git reset --hard`, `git clean`, force-push, or delete untracked icon assets. Rebuild an integration PR from the current AWS SHA and rerun CI. If green, preserve backup of server/app configuration, obtain successful recovery-tested database backup through the existing privileged backup procedure, record old SHA, and only then update using an operator-reviewed release procedure. This release needs **no Prisma migration**. Only Next.js web needs rebuilding/restarting; do not restart unrelated services by default.

After authorized deploy, check:
```bash
curl -sI https://galaxiora.com/en/learn
curl -sI https://galaxiora.com/uk/learn/sidereal-and-tropical
curl -sI https://galaxiora.com/en/pedia
curl -fsS https://galaxiora.com/sitemap.xml | grep '/en/pedia'
```
In the browser: `/en/pedia`, `/uk/pedia`, `/en/pedia/glossary`, `/uk/pedia/panchanga-five-limbs-explained`; revisit GA4 Realtime, Panchanga, homepage icon and account navigation. Submit the new sitemap in GSC **only after** verifying 308s and canonical live URLs; avoid repeated indexing requests. Record old HEAD for a controlled code rollback if needed. Never claim production acceptance until those real checks pass.

## 6. Primary reading
- [Google: Move a site with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- [Google: Localized versions and hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google: Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [India Meteorological Department: Panchanga explanations](https://packolkata.imd.gov.in/panchang/en/explanation)
- [NASA: Moon phases](https://science.nasa.gov/moon/moon-phases/)
