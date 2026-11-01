# GalaxiNews bilingual publisher-excerpt translation (2026-11-01)

## Goal and verified starting state
User requested completion of multilingual UK/EN article descriptions, including Hindi and mixed-script sources, while preserving the current production GalaxiNews. The previous `news:quality:headlines` showed 175 published articles, 41 publisher-backed teaser gaps and eight cases with insufficient source context. Title localization was already running; do not restart that incident.

## External provider research
- Microsoft Translator NMT v3 REST translate: https://learn.microsoft.com/en-us/rest/api/translator/translator/translate?view=rest-translator-v3.0 (source auto-detection; explicitly verified Hindi source language as needed, 2 target locales).
- Supported `textType=html` + `<span class="notranslate">` for preserving numbers: https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/how-to/prevent-translation
- Translator billing counts characters for **each target language** and limits per request; plan and reserve both UK and EN independently: https://learn.microsoft.com/en-us/azure/ai-services/translator/service-limits
- Azure's newer 2026-06-06 API is a breaking change supporting NMT/LLM; this release deliberately keeps its already-tested Azure **v3 NMT-only** endpoint, with no generative model fallback.

## Architecture and blocks resolved
1. Previous `full` path performed primarily English-to-Ukrainian translation and skipped Hindi/other languages, so it did not meet bilingual-source requirements.
2. Missing English teasers were not individually selected or persisted. New `teaserNeedsWork` checks both UK and EN, using a verified English publisher excerpt as a safe native fallback only when its language/script confirms English.
3. `excerptSource` pulls only already stored publisher RSS feedDescription or explicitly marked publisher `source_excerpt`; rejects missing/short/legacy title-derived boilerplate. Max 280 source characters; never fetches third-party article bodies and never generates summary from a headline.
4. `translateLocalizedTeaser` calls Azure NMT v3 fixed endpoint only; mixed Devanagari/Latin segments use prior source-aware translator plan. Strict no-Devanagari, no HTML, Ukrainian/English script and exact source numeral equality; corrects known Ukrainian grammatical/date forms without rewriting source facts.
5. Both target results are persisted independently in `summaryUk` and `summaryEn`; partial success survives if the other locale is rejected. Previously accepted translations are reused.
6. PostgreSQL-backed `news-translation` lease prevents simultaneous CLI backfill and automatic scheduler from selecting, charging and editing the same stories. Existing monthly reservation limit remains 100,000 by default; no migrations are needed.
7. Admin `teaserDebt` and strict `news:quality:full` measure actual source-backed content readiness across UK/EN and separately count title-only sources, without claiming unsupported summaries are ready. The approved `headlines` mode remains unchanged until explicit owner signoff.
8. The optional legacy local EN->UK NMT path is kept compatible for existing non-production tests; Azure remains the required provider for bilingual full-mode release.

## Two-stage release
**Stage A: deploy disabled full-mode code.** Do not edit production `.env` beforehand. Required safety gates are GitHub CI green, NMT UK/EN unit tests, live Azure 3-case source-excerpt preview, canary API, backup/readiness. From existing AWS SSH:
```bash
cd /opt/galaxiora/app
git fetch origin feat/news-bilingual-teasers-20261101
git show FETCH_HEAD:tools/galaxiora-news-teasers-production-update.sh > /tmp/galaxiora-news-teasers-production-update.sh
bash -n /tmp/galaxiora-news-teasers-production-update.sh
bash /tmp/galaxiora-news-teasers-production-update.sh FULL_GREEN_SHA
```
Script must pass the real `npm run news:translate:teasers` against the configured Azure resource before switching live API. No user data, .env flag or database schema is changed as part of stage A. Existing headlines mode continues on production.

**Stage B: explicitly approve excerpts after operator reads all real Azure UK/EN output and verifies Translator F0 and usage in Azure Portal.** Take a PostgreSQL backup/snapshot **before** turning on the full-scope worker. Do not blindly copy Windows `.env` onto AWS. Edit only:
```dotenv
NEWS_TRANSLATION_PROVIDER=azure
NEWS_TRANSLATION_ENABLED=1
NEWS_TRANSLATION_HEADLINES_APPROVED=1
NEWS_TRANSLATION_CONTENT_SCOPE=full
NEWS_TRANSLATION_QUALITY_APPROVED=1
NEWS_TRANSLATION_BATCH_LIMIT=2
```
Then `sudo systemctl restart galaxiora-api.service` and verify `systemctl is-active galaxiora-api.service` shows `active`. This leaves News ingestion active and enables approved bilingual excerpts with low batch count. Keep monthly NMT limit at 100,000 initially.

## Safe verification and archived material
Before enabling, `npm run news:teasers:backfill` is a DRY RUN and prints counts of source-backed UK/EN gaps, eligible items, examples by ID (no copyrighted text/keys). The script intentionally does not fake a description for eight or more title-only entries.
After enabling, check `sudo journalctl -u galaxiora-api.service --since '30 minutes ago' --no-pager | grep -Ei '\[news\]|translation|error' | tail -80`, `npm run news:azure:budget`, `npm run news:quality:full` (may remain BLOCKED during drain), and admin `/uk/admin`. Scheduler processes up to two per 5-minute cycle when `NEWS_TRANSLATION_BATCH_LIMIT=2`.
An optional *explicit* capped backfill command `npm run news:teasers:backfill -- --apply` performs four DB-leased batches (max 12 records each; lower if configured limit=2), no more than 8 records at the recommended value. The source counter, credit and original URL/image/reaction rows are unchanged.
Check `https://galaxiora.com/uk/news` and `/en/news` and spot check at least 10 real UK/EN stories against original English/Hindi publisher texts. If the Azure result contains mistranslation, do not count it accepted based solely on script/number guards; human review is required.
Completion for the current publishing corpus: strict headline failures zero; `teaserDebt.missingUk=0`, `teaserDebt.missingEn=0` for source-backed items; no forbidden HTML, Hindi fragments or source-number changes; no hidden Azure charges; no title-only hallucinations.

## Rollback
To stop automated full-mode translation independently of site operation, in AWS `.env` revert `NEWS_TRANSLATION_CONTENT_SCOPE=headlines` and `NEWS_TRANSLATION_QUALITY_APPROVED=0`, then restart only `galaxiora-api.service`. This does NOT delete already validated bilingual summaries or alter existing original sources. If a code deployment fails before cutover, the guarded installer restores prior code and .env, with no Prisma migration.

## Limitations
This is translation of **publisher-provided excerpts**, not ingestion/translation of arbitrary full copyrighted article bodies. Article pages are linked to the publisher; full-text republication requires explicit content rights/agreements. Automatic language/script checks catch gross failures but cannot guarantee nuanced interpretive accuracy without editorial review. The code is not live on AWS until the owner runs the guarded deploy.