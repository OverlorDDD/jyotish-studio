# Galaxiora — R2 Production Audit and R3 Search / AI Discovery Preparation

Date: 2026-10-28. Branch: `fix/jqa3-windows-and-llm-recovery`.

**Honest evidence policy:** repository code and GitHub CI are inspectable here. A developer's localhost PostgreSQL cannot be read or changed from a GitHub commit. Local `news:quality` and release verification must be executed again after pulling; never claim live `CONTENT_READY`, a verified domain, external TLS availability, or search-engine indexing without actual evidence.

## R1 GalaxiNews — the 14 missing Ukrainian previews

Observed user report (2026-10-28): 133 published, 0 unlocalized titles, 14 missing `summaryUk`, a fresh 15-minute scheduler, 15 OK / 1 empty / 7 errors / 12 cooldown. `news:repair` found `queue_empty`.

**Root cause:** old editorial queue ignored previous `summaryKind='no_context'` even when new publisher metadata later became available. The old release gate treated every null teaser as an actionable translation failure. Our new `editorialSourceFacts`, `hasEditorialEvidence`, `editorialPreviewState` classify:
- `ready`: a nonempty Ukrainian, fact-grounded preview already exists.
- `translation_pending`: Ukrainian preview is missing but published source metadata supplies at least 45 useful characters. This **remains a launch blocker**; the AI backfill is allowed to retry once the provider is available. Formerly excluded `no_context` items with new source facts rejoin the queue.
- `missing_source_facts`: no publisher description or usable source excerpt. Do **not** infer a news story's details merely from its headline. Display its accurately translated title, publisher and external source link; record the limitation openly. This is a permitted, visibly different title-only news card, not a fabricated 1–2 sentence summary.

The `news:quality` gate now prints all three counts and stable ID/source examples (no private information). It issues `CONTENT_READY` only if there are no missing Ukrainian titles, no *evidence-backed* missing Ukrainian previews, the scan is fresh and at least one source is OK. It explicitly **does not mean 100% of cards have source-grounded teasers**. If 14 records all lack evidence, a truthful `CONTENT_READY` can coexist with `missing_source_facts:14`; this is not hiding omissions. If even one has usable source facts and no Ukrainian summary, gate stays `BLOCKED`.

### Local R1 acceptance

With Docker and `npm run dev:full` running in another console:

```powershell
npm run news:doctor
npm run news:quality
npm run news:repair
npm run news:quality
npm run news:verify-ui
```

`news:repair` is non-destructive but can spend LLM calls and may be rate-limited; run once, not in a busy loop. Examine `previewCoverage.translation_pending` separately from `missing_source_facts`. If pending remains, verify provider connectivity/quotas and the individual record's `summaryKind`, `feedDescription`, next attempt timestamp and source provenance. Never auto-publish a misleading AI-generated paraphrase.

### Source inventory and decisions

The previous scan does **not** prove permanent failure, and search results for public RSS landing pages do not verify the URLs are usable as feeds from the user's deployment.

| Source key | Observed error | Conservative decision |
| --- | --- | --- |
| `gdelt-vedic-jyotish` | HTTP 429 | Keep the shared GDELT circuit breaker and cool down; do not retry aggressively or rotate identities to evade rate limits |
| `elephant-journal` | HTTP 500 | Temporary upstream error; monitor and quarantine only after repeated failures |
| `hinduism-today` | `fetch failed` | Check DNS/TLS and official RSS endpoint before a replacement |
| `astroved` | `fetch failed` | Official AstroVed website has an RSS information page, but its blog-icon link was not evidence of a working feed; do not invent a new endpoint |
| `astrosage` | `fetch failed` | AstroSage officially advertises separate RSS horoscope feeds; verify the actual feed and its freshness before replacing the magazine endpoint |
| `yoga-journal` | `fetch failed` | RSS catalogs list the existing feed address; verify from deployment host, and do not assume a permanently broken URL |

The ingestion service already applies per-source cooldown and a shared GDELT breaker. We added `NEWS_SOURCE_DISABLED_KEYS` for **reversible operator quarantine** only. Example `NEWS_SOURCE_DISABLED_KEYS=elephant-journal,astroved` in the private root `.env`; restart API to apply. Do not disable all feeds, and document why and when each source is re-enabled. No source URL was silently substituted with an unverified competitor. The alternate publisher information can be reviewed at:
- https://www.astroved.com/corporate-info/rss-feed
- https://astrosage.com/rssfeeds/feed.asp
- https://www.rsscatalog.com/Yoga

## R2 Production Audit

### Verified in repository or historic CI

- JQA-3 on an earlier green CI and later last audited branch (2026-10-28): **CERTIFIED**, 200/200 longitudes to ≤1 arcsecond, Moon and Lagna 20/20; 180/180 printed mahadasha and 1620/1620 printed antardasha dates. Scope excludes independent second-level UTC boundaries and all historic timezone combinations.
- HTTPS-only domain plus `SITE_NOINDEX=0` gates sitemap and search robots; preview remains blocked. The updated rule also refuses temporary ngrok / trycloudflare hosts.
- NestJS listens on loopback with same-origin Next proxy, 2 MB request-body cap, session access and CSRF checks; runtime preflight covers private history 401, health 200 and hidden public Swagger 404.
- GalaxiNews uses source links and license-gated Commons imagery; first-party illustrations are never represented as source photos. News previews are metadata-based and never copy full article bodies.
- Already-available safe PowerShell backup tool: `tools/backup-db.ps1`. **Presence is not a successful recovery drill.**
- Original Academy pages are server-rendered and provide substantial text useful to traditional and AI search. Avoid indexing empty, personalized or paywalled views.

### R2 acceptance gates

1. Run `npm run build`, `npm run test:all` and `npm run jqa3:certify`. Check full GitHub CI for the *same final SHA*.
2. Run `npm run r2:audit` (non-mutating preview/production configuration inventory) and `npm run site:check`; `npm run launch:verify` probes public routes. No `BLOCKED` gates.
3. Run `npm run news:quality` against the actual production-equivalent DB; resolve remaining `translation_pending`.
4. With a production-equivalent HTTPS environment, test registration, email validation, admin-only inquiries, session revocation/logout, CSRF, rate limiting, REST/private route access, 404 Swagger, backup **and restore to a separate scratch database**. Do not run `migrate reset` or erase volumes.
5. Review licensed photos attribution and Tarot deck licensing separately. The source image URL alone is not proof of permission. Preserve author, canonical image page, reuse license and attribution. Human Tarot questions contain personal information; publish a truthful privacy notice, deletion/retention procedure and a real contact method before inviting public requests.
6. Test API/Next response time at expected traffic on the actual hosting hardware, browser Core Web Vitals (LCP, INP, CLS), provider limits, editor AI quotas, error rates, 429 handling, memory and DB pool. Local CI functional PASS is not a measured production performance SLA.
7. Commercial release: check rights to *every* external API / geocoder in use. In particular, the existing Open-Meteo geocoding free tier is marked noncommercial in `.env.example`; commercial terms/provider must be settled before monetized operation. Payment service is not yet connected.
8. Infrastructure deployment: separate secrets, stable VPS/cloud service and managed HTTPS, restrictive inbound firewall (expose 443 only; DB and Nest private), database backup retention, restore check, alerting, staging/prod separation and domain redirects. These cannot be completed until the owner selects hosting/domain and provides credentials.

`npm run r2:audit` intentionally labels local preview as `PREVIEW_CONFIG_READY` rather than claiming public readiness.

## R3 SEO and citations in AI results — established principles

Official sources:
- Google Search Central [AI features and website](https://developers.google.com/search/docs/appearance/ai-features), [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization), [multilingual hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [article metadata](https://developers.google.com/search/docs/appearance/structured-data/article).
- OpenAI [publisher discovery](https://help.openai.com/en/articles/12627856) and [ChatGPT search](https://help.openai.com/en/articles/9237897-chatgpt-search). **Allow `OAI-SearchBot` and its documented IPs**, independent of the GPTBot model-training setting.
- Microsoft [Bing Webmaster IndexNow](https://www.bing.com/webmasters/help/indexnow-0z209wby) and [IndexNow key verification](https://www.indexnow.org/en_gb/documentation).

**No secret AI ranking lever exists.** Neither a `llms.txt` file nor stuffing pages with repeated terms grants ChatGPT/Copilot/Gemini visibility. Google explicitly says existing search requirements apply and there is no additional mandatory AI-specific markup. Success depends on original relevant content, independent references, crawl eligibility, technical correctness and changing provider ranking algorithms; no guarantee is possible.

### Implemented R3 work

- Original bilingual, server-rendered `/uk/methodology` and `/en/methodology`: explain Swiss Ephemeris/Lahiri, D1/D9/D10, exact source-matched JHora tests, interpretive limits and source links. Cross-linked from the footer; sitemap includes both only after public-index switch.
- Dedicated canonicals and `hreflang` alternates already exist for home, horoscope, Moon-sign guides, Academy and Yoga. The new methodology route uses the same pattern. One canonical path per locale: don't submit search/filter variants as separate pages.
- Add structured `WebPage` to methodology and factual `Article` to genuinely authored Academy lessons (including publication date only when actually displayed for published CMS articles). Do not mark up redistributed news excerpts as articles owned by Galaxiora, and do not publish fake reviews, author bios or FAQ rich-results.
- Public `robots.txt` explicitly permits `OAI-SearchBot` on the same public paths as ordinary crawlers. Account, admin, personal data and API routes are denied. Private-preview robots still block all crawlers.
- Bing and Google site verification meta token variables available; `npm run r3:indexnow` previews configuration without HTTP requests. An IndexNow `--submit` call is **explicitly opt-in** and verifies a public matching key file on the owned HTTPS domain before submitting own-site sitemap URLs.
- Public evergreen guides no longer receive unconditional `Cache-Control: no-store` from the middleware; private/account, forum/news and API routes still do.

### After buying and deploying your HTTPS domain

1. Pick ONE canonical hostname (`https://galaxiora.com` or `https://www.galaxiora.com`), enforce HTTPS and permanent 301 redirects from other hostnames/HTTP to the selected origin.
2. Configure `NEXT_PUBLIC_SITE_URL=https://YOUR-OWNED-DOMAIN`, `SESSION_COOKIE_SECURE=1`, strong `AUTH_SECRET`, a production PostgreSQL endpoint, restricted internal API origin and `SITE_NOINDEX=1` initially. Check `npm run site:check` and `npm run launch:verify`.
3. Confirm accessible public pages with two language versions, 200 statuses, unique canonical titles, one H1 and full readable body; no private data or Google search indexing on staging.
4. Only when ready, set `SITE_NOINDEX=0` in the production environment and rebuild/redeploy. Confirm the final HTTPS `/robots.txt`, `/sitemap.xml`, `/uk/methodology`, `/en/methodology`, canonical and alternate language tags with `npm run r3:seo:check`.
5. Register your domain property in [Google Search Console](https://search.google.com/search-console/about) and in [Bing Webmaster Tools](https://www.bing.com/webmasters/). Verify ownership by DNS (preferred for domain) or set `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION`; then submit the sitemap and inspect crawl/index coverage.
6. Optional IndexNow: generate a random 8–128 character key, set private `INDEXNOW_KEY`, create `apps/web/public/KEY.txt` with ONLY the key text, deploy and verify `https://YOUR-OWNED-DOMAIN/KEY.txt`. Run `npm run r3:indexnow` to preview, then `npm run r3:indexnow -- --submit` once for new/changed canonical URLs. Search engines may ignore submissions or take time; this is not a ranking guarantee.
7. Track in Search Console/Bing: discovered, crawled, indexed, excluded/canonical duplicate, web vitals, queries, queries in UA versus EN and growth of referring domains. ChatGPT search referrals may include `utm_source=chatgpt.com`. Publish original, source-linked articles explaining Jyotish methods, nakshatras, D9 and Panchanga, with real authorship and updates; prioritize non-generic tutorials over bulk daily horoscope duplicates.
8. Audit access for Googlebot, Bingbot, OAI-SearchBot at the **hosting firewall/CDN**. The robots rule alone does not guarantee reachability.

## Windows quick verification

```powershell
cd "C:\Users\Note\jyotish-studio-git"
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm install --no-audit --no-fund
npm run test:r2-r3
npm run test:news-open-media
npm run test:all
npm run jqa3:certify
npm run build
npm run r2:audit
npm run r3:indexnow
```

With Docker Desktop and `npm run dev:full` running, in a **second** PowerShell:

```powershell
npm run site:check
npm run launch:verify
npm run news:doctor
npm run news:quality
npm run news:verify-ui
npm run r3:seo:check
```

Inspect the JSON `previewCoverage`; `translation_pending=0` is the key news requirement, while `missing_source_facts>0` is an explicitly reported limitation. Staging should report `PRIVATE/NOINDEX PREVIEW`. The final public SEO test must run AGAIN on the real owned HTTPS domain after DNS, TLS and `SITE_NOINDEX=0` are configured.
