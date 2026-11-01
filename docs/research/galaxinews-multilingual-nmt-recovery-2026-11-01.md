# GalaxiNews NMT mixed-language incident — root cause and release plan
Date: 2026-11-01. Candidate: fix/news-nmt-hindi-headlines-20261101.

## Evidence from production sample (owner, AWS)
- `NEWS_TRANSLATION_ENABLED=1`, `NEWS_TRANSLATION_HEADLINES_APPROVED=1` now confirmed by `node --env-file-if-exists=.env`. This is **not** a configuration failure.
- `news:translate:multilingual` previously BLOCKED Ukrainian for 'Kal Ka Rashifal 26 अक्टूबर: कल इन 5 राशियों के दिन रहेंगे रोमांचक'; English produced a plausible sentence. A second Hindi title was BLOCKED in UK and EN. The three English source titles passed both locales.
- The CLI interleaves stdout/stderr with concurrent shell output in the pasted text. The log does not reveal the full Azure raw response or the exact lost token. Avoid attributing every rejection to Azure alone; some came from deterministic segment/numeric guards.
- Tests cannot fully prove live Azure behavior: the production Azure resource is available only from the user's configured AWS host. All new CI NMT tests use deterministic fake Azure responses.

## Root causes found in source
1. `headlineScriptSegments` split Latin/Roman Hindi and Devanagari but passed each as a tiny unknown-language string. Microsoft's own documentation says automatic language identification is more reliable on longer inputs. Latin-script Hindi ('Kal Ka Rashifal') is ambiguous.
2. The old per-span `preserveSourceNumbers` rejected numeral loss correctly, but there was no explicit numeric preservation in Azure requests. A month/date split can cause a model to omit a date or a count.
3. Existing source-level lexical errors such as literal 'full fruit of the Moon' require contextual, source-verifiable corrections. An arbitrary transliteration or generalized regex would be unsafe.
4. Azure character reservation was calculated from original headlines only. When HTML no-translate markup is added, the reservation should conservatively include the exact per-part payload characters.
5. Failures were retried every 3/24 hours without a finite cap, potentially spending character budget again on the same publisher title.

## Why this design
- Microsoft Translator REST v3: https://learn.microsoft.com/en-us/rest/api/translator/translator/translate?view=rest-translator-v3.0 (optional from=, language detection, response and limits).
- Microsoft's guidance for **textType=html** and **span class=notranslate**: https://learn.microsoft.com/en-gb/azure/ai-services/translator/text-translation/how-to/prevent-translation . We use it ONLY to protect exact source numeric tokens inside known Latin/Devanagari mixed titles; HTML is escaped before NMT and strictly removed on response.
- Romanian/Hindi/other mixed terms are not automatically 'assumed Hindi'. Only fragments with independently recognized Hindi source words get `from=hi`; other languages continue through Azure detection. Known romanized editorial phrases are normalized narrowly to natural English without changing dates or named facts.
- Ukrainian 1-31 day + month nominative case is deterministically converted to the appropriate genitive month form without changing the month or numeral.
- Both locale variants remain **strictly** tested: no remaining Devanagari, no lost/doubled numbers, no HTML or known literal errors. Bad outputs are withheld, not published as verified.
- The budget planner counts the planned Azure request body characters including escaped text and protected spans, conservatively across missing locale variants. No retries or hidden fallback inside a single translation call. Six unsuccessful scheduled attempts then quarantine a record until explicit operator requeue.

## Source and privacy contract
Only public publisher headlines leave the server for Azure NMT, no original private user data. No LLM/Groq/Gemini/OpenRouter calls. No story content, publisher URL, licenses, images, metadata, personal interests or user reactions are modified by this release. Only validated titleUk/titleEn and retry counters change during live translation.

## CI and Windows tests
```powershell
git fetch origin
git switch fix/news-nmt-hindi-headlines-20261101
git pull --ff-only
npm install
node --test tools/news-nmt-reliability.test.mjs tools/news-multilingual.test.mjs tools/news-headlines.test.mjs
npm run build
```
GitHub release gate also runs auth, all news tests, operational health tests, astrology and multilingual browser regressions. Do not deploy a branch head without checking exact full green SHA.

## Production staged release (uses existing AWS, no Docker)
1. Save database backup/snapshot. Review Azure resource metrics and internal budget; never print translator key.
2. From AWS authorized SSH:
```bash
cd /opt/galaxiora/app
git fetch origin fix/news-nmt-hindi-headlines-20261101
git show FETCH_HEAD:tools/galaxiora-nmt-production-update.sh > /tmp/galaxiora-nmt-production-update.sh
bash -n /tmp/galaxiora-nmt-production-update.sh
bash /tmp/galaxiora-nmt-production-update.sh EXACT_40_CHARACTER_CI_GREEN_SHA
```
3. The release script tests ancestry/services/flags, builds API, performs the REAL Azure multilingual preview **before** switching users to the candidate, checks internal budget, then runs isolated canary API on port 4001 with NEWS_INGESTION_ENABLED=0 and NEWS_TRANSLATION_ENABLED=0. A failed real multilingual preview stops before cutover and restores prior commit. Passing tests permit web/API restart and general health checks.
4. After success: inspect Admin > GalaxiNews for translation ready / recent failures / quarantine. Compare 10 real UK and 10 EN headlines to source, especially dates, numbers, astrology terms and mixed Hindi. Validate that old articles, reactions and images are unchanged.
5. If source answers are still ungrammatical, production must NOT claim verified quality even if technical tests PASS. Leave the rejected records queued/quarantined and log representative source/output (without keys) for a targeted follow-up. Human review is a required release gate.
6. Only after a successful bilingual live sample and a current database backup:
```bash
npm run news:localize:requeue               # dry run, no mutations
npm run news:localize:requeue -- --apply    # explicit capped retry reset, only if needed
npm run news:localize:repair                # bounded repair, writes localized titles
npm run news:quality:headlines              # coverage and source health
npm run news:azure:budget
npm run site:check
```
Requeue is an explicit mutation and requires intentional operator action. If production use grows or the monthly Azure limit is almost exhausted, do not run the archive repair.

## Acceptance and remaining non-goals
- PASS: UK/EN samples contain no Devanagari, romanized stock Hindi phrases or changed numeric facts; editor reviews literal phrases and month grammar; no untrusted HTML; bilingual title readiness is measured separately from publisher-description coverage.
- A headline-only approved scope does not translate full descriptions or articles. A full NMT content mode requires a **separate, explicitly approved** rollout and rights/quality review.
- Some unusual Indic languages written in Devanagari (e.g. Marathi/Nepali) are not automatically forced to Hindi without lexical evidence; they can still fail closed and need further language-specific QA. This is a supported guardrail, not a hidden fallback.
- Existing news scheduler source errors, HTTP 429s and external RSS failures remain independent of the translator.

## Incident rollback
The updater stores previous SHA and original .env and rebuilds after a failed cutover. Never use git reset --hard or destroy live PostgreSQL data. If CI fails or the live Azure preview fails, keep production unchanged and send the sanitized error stage, not API keys.