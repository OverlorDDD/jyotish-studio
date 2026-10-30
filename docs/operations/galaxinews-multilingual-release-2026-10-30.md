# GalaxiNews multilingual RSS and localized headlines — release 2026-10-30

## Root cause (verified against code and the user's screenshot)

The feed had one original `title` (often Hindi/Devanagari mixed with Romanized Hindi), and one `titleUk`; the /en/news UI always displayed the raw original `title`, and the /uk/news UI could display contaminated old `titleUk` with embedded Hindi. Azure requests forced `from=en`, and the old scheduler skipped source languages not labelled `en` or `uk`.

New architecture:
- **Preserve** publisher title/link/source attribution and date.
- Add optional **`titleEn`** PostgreSQL field (additive migration), keep `titleUk` and original `title`.
- Azure NMT `Translate?api-version=3.0&to=uk` / `&to=en` deliberately omits `from` so Azure autodetects original language. For mixed Devanagari + Latin spans, each segment is handled separately to avoid untranslated Hindi islands.
- The scripts are not proof of Hindi (Devanagari may represent Marathi or Sanskrit): Azure is responsible for actual language detection, no source-language bluffing or generative LLM.
- Store both headlines in PostgreSQL and reuse them for pageviews. We do not translate in the browser or consume Azure quota per visitor.
- `/api/v1/news/feed?lang=uk` returns only cards with a usable Ukrainian title; `lang=en` only usable English. Native English originals can be reused when they contain no foreign script/known romanized Hindi indicators.
- Hide summaries that contain Devanagari or mismatched script; **full machine summary localization remains unapproved** (`NEWS_TRANSLATION_QUALITY_APPROVED=0`) and cannot be silently enabled by the headline switch. We do not invent article content.
- New `news:localize:repair` processes archived articles in bounded batches and honors the durable Azure character budget / 3h/24h retry backoff. No news, users, images or reactions are deleted.

Official Microsoft references:
- [Translator REST Translate — source auto-detection by omitting from; multiple target languages](https://learn.microsoft.com/en-us/rest/api/translator/translator/translate)
- [Supported languages including Hindi, Ukrainian and English](https://learn.microsoft.com/en-us/azure/ai-services/translator/language-support)
- [Azure Translator Detect endpoint](https://learn.microsoft.com/en-us/rest/api/translator/translator/detect)

## Windows QA first (no production changes yet)

Stop local `dev:full` (CTRL+C):
```powershell
cd "C:\Users\Note\jyotish-studio-git"
git status --short
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run test:news
npm run build
```

For current PRIVATE `.env`:
```dotenv
NEWS_TRANSLATION_ENABLED=1
NEWS_TRANSLATION_PROVIDER=azure
NEWS_TRANSLATION_CONTENT_SCOPE=headlines
NEWS_TRANSLATION_HEADLINES_APPROVED=1
NEWS_TRANSLATION_QUALITY_APPROVED=0
NEWS_AZURE_MONTHLY_CHAR_LIMIT=100000
AZURE_TRANSLATOR_REGION=eastus
```
Preserve `AZURE_TRANSLATOR_KEY` in .env; never paste/share its value. No local LibreTranslate Docker is needed.

```powershell
# These make small genuine Azure calls but NEVER edit news articles
npm run news:translate:multilingual
npm run news:azure:budget
```

Read both languages: no Hindi fragments, proper Jyotish names, correct facts/numbers and no invented claims. If Azure is weak on Romanized Hindi, pause; don't automatically publish an unacceptable translation. Request a human editorial fix or improve the source segment rules. Always respect copyright.

Only after the QA reads well, start site and archive:
```powershell
npm run dev:full
```
Second PowerShell, same project root:
```powershell
npm run news:localize:repair
npm run news:quality:headlines
npm run news:quality
npm run news:azure:budget
npm run news:verify-ui
```

The **limited** gate should show `HEADLINES_READY_WITH_EDITORIAL_DEBT` if the 14 source-backed previews remain pending. `news:quality` should stay `BLOCKED` until full editorial coverage is resolved; do not misreport a limited launch as `CONTENT_READY`.

## AWS deployment

`titleEn` is a Prisma schema change: **run `npm run db:generate && npm run db:migrate` on the actual production instance before restarting services**. Always back up the real database before the migration.

Use `deploy/aws/README.md` for SSH, protected postgres, Caddy HTTPS, DNS, and restart procedure. On EC2:
```bash
cd /opt/galaxiora/app
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm ci --no-audit --no-fund
npm run db:generate && npm run db:migrate && npm run build
sudo systemctl restart galaxiora-api galaxiora-web
npm run news:translate:multilingual
npm run news:localize:repair
npm run news:quality:headlines
npm run news:azure:budget
```
`news:localize:repair` needs the private approved Azure key in EC2 .env, DATABASE_URL and a healthy PostgreSQL. If `translation_quality_not_approved`, do not force it; verify settings. If `azure_monthly_budget_exhausted`, stop, inspect the Azure Portal resource usage; do not simply lift the cap.

## Check the website

1. Browse `https://galaxiora.com/uk/news` in a fresh private tab: titles must be Ukrainian, no Devanagari. Some cards may disappear *temporarily* until localization is finished.
2. Browse `https://galaxiora.com/en/news`: titles must be English, not original Hindi and not Ukrainian.
3. Test filters, search, personalization, recent and older news. Open some direct source links.
4. Verify feed API: `/api/v1/news/feed?lang=uk&limit=24` and `?lang=en&limit=24`. Inspect `titleUk` and `titleEn` via browser developer tools; original `title` remains untouched.
5. An existing item may still have no localized teaser; do not synthesize content from title. Publisher metadata and full summary translation can be reviewed separately.

If a translation is not acceptable, set `NEWS_TRANSLATION_ENABLED=0` in EC2 private .env and restart the API; existing titles remain and affected unlocalized cards remain hidden until corrected.

## Limitations and privacy

Script checks reject Devanagari fragments, but do not guarantee transliterated Latin Hindi becomes idiomatic English or Ukrainian. Mixed-language segmentation can lose syntactic context. The real 5-example bilingual preview and a sampled 20 published titles require **human QA**. Azure character reservations are internal accounting for scheduled news calls only; manual sample calls and other services using the same Azure key are not included in this DB ledger. Azure Metrics remains authoritative for total resource consumption.

Live HTTPS, full SEO indexing, archive coverage, translation quality and 100% rollout cannot be certified from GitHub CI; actual EC2 and browser validation required.
