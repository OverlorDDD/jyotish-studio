# Galaxiora hotfix: build blocker, Windows bootstrap, daily horoscope repetition and real licensed news photos

**Date:** 2026-10-28. Branch: `fix/jqa3-windows-and-llm-recovery`.

## Root causes established from owner's 334-line local PowerShell log

1. **Fatal Next/SWC parse error:** `apps/web/app/components/VedicFestivalPanel.tsx` English `warning` string used a bare apostrophe in `community's`. That terminated a single-quoted JS string and caused every Next route requesting the module to return HTTP 500. Fixed by using a double-quoted literal with a typographic apostrophe. `webpack.cache.PackFileCacheStrategy ... ENOENT rename ...` is a secondary generated-cache warning after compilation failure; it is not a database problem.
2. **Windows privilege issue:** `tools/news-dev-cache.test.mjs` attempted `symlinkSync(...,'dir')`, which fails `EPERM` on standard non-admin Windows systems. Use a Windows junction, and record a diagnostic if local policy also prohibits junctions. The actual anti-linked-cache guard stays intact and is exercised by Linux CI.
3. **GalaxiNews original photos absent:** RSS media and OG thumbnails are publisher metadata, not an automatic reuse licence. `safeImageUrl` correctly rejected those without a grant, but the old site displayed no *real* alternative photographs. Additionally some legacy image URLs were persisted in DB yet hidden again by the public feed filter, which did not pass the license URL.
4. **RSS source connectivity:** the user's machine logged `TypeError: fetch failed` for several external publishers, Elephant Journal 500, GDELT 429. No application can honestly guarantee incoming articles or images from a remote source during that source's outage/429. Do not report RSS recovery complete until live admin source health confirms fresh external articles.
5. **Horoscope text repeats:** the Moon can legitimately occupy the same whole-sign natal house at successive daily noon snapshots for 2–3 days. Unchanged house heading was therefore **astronomically consistent** but looked like static copied advice. House interpretation remains unchanged. Added a distinct, deterministic date-indexed four-way editorial focus to daily headline and already date-specific action. Do NOT fake Moon sign changes to make headlines look different.

## Image recovery implementation (actual photos, not only gradients)

- `apps/api/src/news-open-media.ts`: Wikimedia Commons Action API queries for *topic-related illustrative photographs* (not claimed as original publisher photos). Accept image only when actual Commons metadata declares creator, one supported CC0 / CC BY / CC BY-SA licence with an official Creative Commons licence URL, valid Commons file-page URL, HTTPS upload.wikimedia.org thumbnail and expected raster MIME/size. Reject NC, ND, unknown, missing author, malicious host and unexpected source. Bounded three concurrent searches, twelve articles per scan; 48h retry on no-image result.
- New fields on `NewsArticle`: `imageLicense`, `imageLicenseUrl`, `imagePageUrl`, `imageLookupAt`. Prisma migration `20261028114500_news_open_licensed_images`. No article deletions or changes to private records.
- `apps/api/src/news-ingestion.ts`: scheduled scans first backfill alternative licensed photos for old archive, including legacy hidden unlicensed RSS images. Existing approved publisher images remain untouched. Explicit publisher image licences are now persisted and checked when served.
- `apps/api/src/news.ts`: rechecks the stored actual CC licence URL and returns image/source/license to frontend; unauthorized thumbnails remain hidden.
- `apps/web/app/components/NewsWorld.tsx` and Personal News: render real photos alongside visible photographer credit, image source link and CC licence link. Existing first-party topic art remains a fallback when Commons/API/browser/network fails.
- `npm run news:images:repair`: non-destructive batch for existing local archive; after `npm run dev:full` and migrations, run from project root in **another** PowerShell. Up to 72 articles checked per manual invocation, individual queries capped at 5.5s, no broad publisher scraping. `NEWS_OPEN_MEDIA_ENABLED=0` disables lookups.
- Sources: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia, https://www.mediawiki.org/wiki/API:Imageinfo/en. File authors/licence must be attributed; publisher photo fallback still cannot bypass rights.

## npm ci EUSAGE — Windows installation correction (2026-10-28)

The repo does **not** commit a root `package-lock.json`, so `npm ci` fails with `EUSAGE` even when `git fetch` and `git pull` succeed. This is an installation-instruction error, **not** a failed update or Docker error. Both README and the current GitHub Actions workflow install using `npm install`.

Run this from `C:\\Users\\Note\\jyotish-studio-git`:

```powershell
git status --short
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm install --no-audit --no-fund
```

`npm install` may create an untracked `package-lock.json` locally; this is expected. Do not commit the generated file as a verified lockfile without reviewing and testing its full dependency graph. For a reproducible future release, commit a generated workspace lockfile and switch CI/docs to `npm ci` together.

## TypeScript Prisma Client build recovery (2026-10-28, 13 TS errors)

Owner's `npm run test:bootstrap`, `test:news-open-media`, `test:horoscope-basis`, and `test:vedic-calendar` all passed (26/26), then `npm run build` failed in `apps/api` with `TS2353` and `TS2339` for `NewsArticle.imageLicense`, `imageLicenseUrl`, `imagePageUrl`, and `imageLookupAt`. This is **stale generated Prisma Client**, not a source-level TypeScript schema omission: the fields are in `apps/api/prisma/schema.prisma` and their migration exists. The actual database migration is distinct from regenerating client types.

Fix: `apps/api/package.json` now declares `prebuild` to run the Prisma generator from the canonical schema before `tsc`. npm runs `prebuild` automatically when the API workspace build is invoked, including the root `npm run build`. `tools/dev-full.test.mjs` guards the order and fields.

Resume locally after syncing:
```powershell
cd "C:\Users\Note\jyotish-studio-git"
git status --short
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm run db:generate       # optional explicit confirmation; now also automatic in API prebuild
npm run test:bootstrap
npm run build
```
Stop Next/Nest first before generating Prisma Client or rebuilding on Windows, to avoid locked DLL or generated files. If you see TypeScript errors referring to missing Prisma fields after `db:generate`, inspect the generator output and `npm ls prisma @prisma/client`; **do not** manually edit `node_modules/.prisma` or run destructive database resets.

`npm run build` does **not** apply SQL migrations. Later `npm run dev:full` starts Docker database safely and applies pending migrations via `prisma migrate deploy`.

## Windows acceptance

First **stop `npm run dev:full` with Ctrl+C**. Do not operate on `.next` while Next is running.

```powershell
cd "$HOME\jyotish-studio-git"
Test-Path .\package.json    # True
git status --short          # inspect local changes, do NOT discard your own work
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm install
py -m pip install pyswisseph
npm run test:bootstrap
npm run test:news-open-media
npm run test:horoscope-basis
npm run test:all
npm run build
npm run jqa3:certify
npm run dev:full
```

In a second PowerShell while API and PostgreSQL run:
```powershell
cd "$HOME\jyotish-studio-git"
npm run news:images:repair
npm run news:doctor
Invoke-RestMethod 'http://localhost:4000/api/v1/news/status' | Format-List
$feed=Invoke-RestMethod 'http://localhost:4000/api/v1/news/feed?sort=latest&limit=24'
$feed.items | Select-Object -First 10 title,imageUrl,imageCredit,imageLicense,imagePageUrl | Format-List
```

Open `http://localhost:3000/uk/news`, select Latest, confirm **photos** where licensed and the source/CC links, and original illustration where Commons not accessible. Revisit Personal News preview.

Check connection if `news:images:repair` reports zero photos:
```powershell
Test-NetConnection commons.wikimedia.org -Port 443
Invoke-WebRequest 'https://commons.wikimedia.org/w/api.php?action=query&meta=siteinfo&format=json' -TimeoutSec 12
```
Unreachable Commons means real open media cannot be downloaded on that machine. Keep first-party art and fix DNS/proxy/network rather than claim 100% real-image coverage.

Open `http://localhost:3000/uk/horoscope?sign=aries`, seven-day reading: two days can share the 12th-house **theme** but must now show different clear daily focus headings and actions. The underlying Swiss/Lahiri Moon positions and 12-sign personal-vs-public consistency must stay unchanged.

If after a successful fixed build you still see stale `webpack.cache` errors: **stop dev server**, run `Remove-Item .\apps\web\.next -Recurse -Force -ErrorAction SilentlyContinue`, then `npm run dev:full`. This removes *only generated Next.js output*, not database, user uploads or project code.

## Independent release checks

`tools/news-open-media.test.mjs`: provider fakes, licence grants and rejects, missing creator, host controls; `e2e/news-open-media.spec.mjs`: real browser displays CC-author attribution. `tools/horoscope-basis.test.mjs`: four different editorial days with unchanged true whole-sign house and full natal/public equivalence. All added to ordinary `npm run test:all`/Playwright.

### Release gate (do not overpromise)
Do not claim the owner's Windows network can reach RSS, Commons or paid providers on the basis of GitHub CI. Local `npm run news:images:repair` and admin RSS health reveal it. Do not claim professional content licensing for publisher images or present Commons generic illustrations as documentary photos of the article.
