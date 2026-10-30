# GalaxiNews — approved Azure headlines pilot, separate from teasers
Date: 2026-10-30. Branch: `fix/jqa3-windows-and-llm-recovery`.

## Why only headlines?

The operator has tested a real Azure AI Translator (East US, F0 intended) with the six-sample dataset. Azure translated the astronomical and Jyotish passages substantially better than Argos, but produced **"розвороти Таро"**, an untranslated **"Mercury"**, and a rejected yoga phrase. This is NOT a full-editorial quality pass. User accepts headline translation as a staged pilot, not full summary translation.

Improvements:
- `NEWS_TRANSLATION_CONTENT_SCOPE=headlines` (safe default) translates **only missing Ukrainian titles**.
- `NEWS_TRANSLATION_HEADLINES_APPROVED=1` is a *separate*, explicit human acknowledgement for headlines only, independent of `NEWS_TRANSLATION_QUALITY_APPROVED`.
- Full RSS-description translation still requires `NEWS_TRANSLATION_CONTENT_SCOPE=full` AND `NEWS_TRANSLATION_QUALITY_APPROVED=1`. Do not enable it now.
- The input-driven glossary corrects **"розвороти Таро"** (only when source literally says `Tarot spreads`) and an untranslated **Mercury** only when the original establishes a planetary/zodiac context. It also patches the observed yoga instructor phrase. General editorial review is still important.
- Existing human/AI-approved Ukrainian titles and teasers are never overwritten. The original URL and publisher attribution remain.
- A scheduled headline-only batch reserves Azure input characters in the existing PostgreSQL ledger **before** sending network requests. Existing conservative default: 100,000 characters/month (UTC). Manual QA samples are outside this internal counter; monitor Azure Portal metrics separately.
- Translation does not call Groq/Gemini/OpenRouter, has no secret model fallback, and cannot generate new facts from article titles.

## Windows acceptance sequence

### 1. Update code and verify the migration

Stop `npm run dev:full`, then run in PowerShell:
```powershell
cd "C:\Users\Note\jyotish-studio-git"
git status --short
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
docker compose up -d db
npm run db:migrate
npm run db:generate
npm run test:news
npm run build
```

The existing additive `NewsTranslationUsage` migration is safe to rerun with `db:migrate`; do not reset Prisma or Docker volumes. A successful GitHub CI does not replace verifying your local Windows DB migration.

### 2. Preview 8 real Azure headline translations WITHOUT publishing

Set these values in root private `.env`; keep the existing Azure key/region:
```dotenv
NEWS_TRANSLATION_ENABLED=0
NEWS_TRANSLATION_PROVIDER=azure
NEWS_TRANSLATION_CONTENT_SCOPE=headlines
NEWS_TRANSLATION_HEADLINES_APPROVED=0
NEWS_TRANSLATION_QUALITY_APPROVED=0
NEWS_AZURE_MONTHLY_CHAR_LIMIT=100000
```

Then:
```powershell
npm run news:translate:check
npm run news:translate:headlines
```

The eight short samples spend a small amount of the Azure resource quota but **do not touch the news database**. Judge the Ukrainian titles for grammatical fluency, correct astronomy and tradition-specific vocabulary. The script checks basic safety and prints results; human judgment is required. Do NOT use `news:translate:sample` (six full sentences) to certify the headline-only scope: full-summary QA remains separately blocked.

### 3. Start headline-only automatic news translation

ONLY after step 2 passes by human review, set:
```dotenv
NEWS_TRANSLATION_ENABLED=1
NEWS_TRANSLATION_PROVIDER=azure
NEWS_TRANSLATION_CONTENT_SCOPE=headlines
NEWS_TRANSLATION_HEADLINES_APPROVED=1
NEWS_TRANSLATION_QUALITY_APPROVED=0
NEWS_AZURE_MONTHLY_CHAR_LIMIT=100000
```

Restart `npm run dev:full` to reload environment. In another PowerShell:
```powershell
npm run news:azure:budget
npm run news:doctor
npm run news:repair
npm run news:azure:budget
npm run news:quality
npm run news:quality:headlines
npm run news:verify-ui
```

`news:repair` also retries approved media metadata recovery. Headline translations process only records whose `titleUk` is missing; existing Ukrainian titles are kept. If the archive already has 133/133 Ukrainian titles, `queue_empty_headlines` is a **correct result**. The 14 missing teasers are NOT automatically fixed; `news:quality` may remain `BLOCKED` for `translation_pending`, and that is intentional until we separately solve summary quality.

After the owner explicitly approves and enables headline-only translation, `news:quality:headlines` checks a **separate limited-release policy**: fresh ingestion, a live source, and 100% Ukrainian headlines are required, but missing source-backed teasers are reported as `HEADLINES_READY_WITH_EDITORIAL_DEBT` and are not represented as full translations. This command has no effect on the strict `news:quality` gate. Do not interpret the limited result as `CONTENT_READY`.

Review new live incoming headlines. If errors appear, immediately set `NEWS_TRANSLATION_ENABLED=0` and restart API. No article or database rows are deleted. Do not expose Azure API key or `.env` in screenshots.

## Definition of done

1. All `test:news` and production `build` checks pass on the final commit.
2. `news:translate:headlines` prints acceptable, natural Ukrainian for the eight examples.
3. `NEWS_TRANSLATION_QUALITY_APPROVED=0` remains set while headlines are enabled.
4. `news:azure:budget` never exceeds configured internal cap, and Azure Portal confirms free-tier allocation.
5. No source-free synthetic teasers or incorrect translation overwrites.
6. Only after headline QA passes do we separately evaluate the full RSS preview issue and editorial launch gate.
