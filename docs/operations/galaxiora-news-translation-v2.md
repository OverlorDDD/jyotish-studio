# GalaxiNews Translation Engine v2 — self-hosted NMT, zero generative LLM calls

Updated October 2026. Work branch: `fix/jqa3-windows-and-llm-recovery`.

## Sources reviewed / operator manuals

- [LibreTranslate official documentation](https://docs.libretranslate.com/): self-hosted translation API and `POST /translate`.
- [LibreTranslate official installation](https://docs.libretranslate.com/guides/installation/): Docker, CLI `--load-only`, model installs and memory guidance.
- [LibreTranslate upstream Compose example](https://github.com/LibreTranslate/LibreTranslate/blob/main/docker-compose.yml): Docker image, model volumes and environment variables.
- [Argos Translate documented Python API](https://argos-translate.readthedocs.io/en/latest/source/examples.html): independent package index, local model installation, offline inference.
- [Argos package index](https://www.argosopentech.com/argospm/index/): inspect which EN→UK models are downloadable at installation time. Do not assume a model is installed until `news:translate:check` passes.

The implementation uses the official LibreTranslate HTTP API powered by Argos. It is **not** a generative LLM. No paid AI account, ChatGPT Plus API, Gemini, Groq or OpenRouter is used by the GalaxiNews editorial path. Other modules (natal interpretation, optional Tarot, etc.) are unchanged.

## Architecture and security

```
Source RSS/Atom metadata (title + optional publisher description)
  -> NewsIngestionService (existing 15-minute scan)
  -> database: newsArticle (published source facts + original title)
  -> enrichPendingNews (max 6 records per scan, configurable up to 12)
  -> local LibreTranslate Docker container: http://127.0.0.1:5100/translate
  -> finite validation / terminology normalization
  -> titleUk / summaryUk (+ existing summaryEn)
  -> PostgreSQL storage: reuse on every visit, no retranslation
  -> public GalaxiNews / Personal News
```

The local adapter accepts only loopback or internal Docker hosts, plain HTTP and the `/translate` API; it refuses arbitrary URLs (SSRF hardening). The Docker port binds ONLY to `127.0.0.1` and must never be exposed at AWS public ingress. Do not put personal natal-chart data into this translation service. Input text is public publisher RSS metadata only (at most 1,000 cleaned characters/request).

If the NMT service or EN→UK model is offline, the readiness check skips the batch without modifying records or consuming their retry quota. Individual translation errors after readiness may still use bounded 3-hour/24-hour backoff. There is **NO fallback to LLM**. Existing published translations are preserved; title-only stories remain title-only without hallucinating what a whole article says. Translation output is checked for Ukrainian letters, safe text and preservation of digits/years. Personal names and nuanced grammar still need editorial QA.

A publisher-supplied description is shortened (up to 280 source characters) before translation. The translated excerpt is derivative material, so check feed terms and permission; display an attributed link to the original publisher. Respect copyright and never scrape complete article bodies without permission.

## Windows 10 / Docker Desktop — step by step

### A. Update

```powershell
cd "C:\Users\Note\jyotish-studio-git"
git status --short
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm install --no-audit --no-fund
docker info
```

Keep the existing `.env` and PostgreSQL Docker volume. Add or adjust the following keys only:

```dotenv
NEWS_TRANSLATION_ENABLED=1
NEWS_TRANSLATION_URL=http://127.0.0.1:5100
NEWS_TRANSLATION_BATCH_LIMIT=6
NEWS_EDITORIAL_AI_ENABLED=0
```

The retired `NEWS_EDITORIAL_AI_ENABLED` switch no longer controls the news translator, even if old local `.env` still says `1`. Your existing Gemini/Groq API keys remain configured for **Jyotish**; they are never used by GalaxiNews.

### B. Start the offline NMT service (first start downloads an image and model)

```powershell
docker compose --profile translation up -d translator
docker compose --profile translation logs --tail=80 translator
npm run news:translate:check
```

The first startup may download language model packages and compile/warm the translator. The six-sample translation QA command helps compare real Ukrainian output for Jyotish, Tarot, yoga, astronomy and dates; human sign-off is required before publication. A successful check must print `PASS EN -> UK local machine translation` and a Ukrainian translation of a controlled sentence. If it reports `English to Ukrainian package not installed`, inspect:

```powershell
Invoke-RestMethod http://127.0.0.1:5100/languages
docker compose --profile translation logs --tail=100 translator
```

Use the official Argos model index/LibreTranslate `--update-models` instructions to install missing EN→UK language support. Do not claim production readiness until `/languages` includes `en` with `uk` as a target. If the installed model offers no direct or pivot route, translation is blocked by design. Do not manually fabricate previews or silently turn on an external API.

If `docker compose` gives port conflict, inspect port 5100; do not change PostgreSQL port 5433. On a small VPS, measure RAM and CPU before keeping translator resident: cap in the optional compose service is approximately 1.5 GiB memory and 1.5 vCPU. On under-provisioned hosts, use a separate private translation worker rather than reducing capacity of Next/Nest/PostgreSQL.

### C. Run Galaxiora and process the archive

In a first PowerShell, keep running:

```powershell
npm run dev:full
```

In a second PowerShell:

```powershell
cd "C:\Users\Note\jyotish-studio-git"
npm run news:translate:check
npm run news:translate:sample
npm run news:doctor
npm run news:repair
npm run news:quality
npm run news:verify-ui
```

`news:repair` processes at most six passes with bounded batches. The regular news scheduler automatically localizes further incoming items at its existing cadence. You may repeat the repair after an archive backoff interval, but do not loop it continuously.

**Quality gate:** `news:quality` distinguishes `translation_pending` (blocking) from `missing_source_facts` (publisher provides no basis for a preview; title-only is allowed). A correct `CONTENT_READY` requires `translation_pending=0`; a complete database excerpt count may still be smaller than the article count without fabricating summaries.

### D. Code and CI regression checks

```powershell
npm run test:news
npm run test:r2-r3
npm run build
npm run site:check
npm run launch:verify
```

The new `tools/news-nmt.test.mjs` uses a fake LOCAL HTTP translator and verifies no request reaches any generative AI provider even when all three API keys are set. `tools/news-legacy.test.mjs` tests delayed retries and correct migrated older news. CI **does not contain the Argos model** and cannot certify real EN→UK translation quality: operator must run `news:translate:check` on the local Docker service and review 10–20 real previews in UA.

### E. Operational monitoring

- Check `news:doctor` for articles untranslated and the local translator health message.
- Check `news:quality` for `translation_pending` before launching publicly.
- Monitor logs/CPU/RAM; NMT takes CPU time but uses no per-request LLM token quota. Keep a list of poorly translated astrological terms to improve the deterministic glossary.
- Do not retranslate approved human-edited Ukrainian titles or summaries automatically. Existing saved translations are intentionally preserved.
- When `NEWS_TRANSLATION_ENABLED=0`, the localization queue pauses; this affects only new translations, not published cards.
- A later paid NMT option would require a new explicit provider switch, privacy review and budget. No such automatic fallback exists.

## Licensing / production note

LibreTranslate is distributed under AGPL-3.0; Argos Translate software is MIT-licensed. Review any separately downloaded model files and source feed reuse conditions before distributing the Docker image or operating an altered LibreTranslate service publicly. Galaxiora's existing repository already states AGPL-3.0-only. An unmodified internal translator accessed only over loopback is different from a publicly exposed translation service; keep the container private and honor applicable license obligations. Pin a reviewed Docker image digest before public production deployment rather than relying indefinitely on `latest`.
