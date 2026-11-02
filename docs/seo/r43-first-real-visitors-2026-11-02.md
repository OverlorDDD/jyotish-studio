# R4.3 — First Real Visitors (international-first)

**Status:** code-only PR; not deployed or submitted to any search engine by this PR. **Date:** 2026-11-02.
**Base:** `feat/panchanga-v2-p21-unified-location-and-range-20261102` (includes approved spiral #6 ancestry). **JQA-3:** completed/certified; out of scope. **GalaxiPedia:** separate parallel task after Panchanga 2.0; don't rename GalaxiLearn here.

## Objective and three compact workstreams

1. **Discovery infrastructure (now):** Bing import, verify sitemap, configure IndexNow ownership, safe explicit changed-URL submitter, offline CI gate. Do not submit on CI, every deployment, pageview or background timer.
2. **English-first search content (next):** prioritize 75% EN/international, 15% UK, 10% research for further languages; build genuinely helpful intent clusters linked to calculators. `docs/seo/r43-en-first-search-map.csv` is a hypothesis map, **not search-volume or ranking evidence**.
3. **Real audience & learning (ongoing):** distribute useful product demonstrations through relevant communities and creators, measure impressions/clicks via Bing/GSC and opt-in GA4, retain only formats that drive genuine calculator completions.

Core audience: English-speaking astrology and Tarot readers globally, plus Vedic/Jyotish and Panchanga searches particularly relevant to India and the diaspora. Existing `/en` and `/uk` locales stay independent and have reciprocal hreflang; don't create automatic low-quality machine translations or force redirects by IP. Google Translate can help individuals read the site but is **not equivalent** to native indexed localization.

### Audience experiments — not traffic promises

- EN demonstration #1: **"Why does my Vedic Moon sign differ from my Western Sun sign?"** Real example using a publicly safe demo chart; link to `/en/astrology/jyotish`.
- EN demonstration #2: **"Your Panchanga depends on your location"** — show city selector, real tithi/nakshatra and transitions without claiming universal identical timing; link to `/en/panchanga`.
- EN demonstration #3: **"One tarot question, three cards"** — show a live tool, not stock content; link to `/en/tarot`.
- Start with one short video channel and two relevant communities; check each community's rules, no spam or invented reviews/qualifications. UTM source/campaign can identify public posts but must never contain birth data, location, private Tarot questions, user IDs, emails or secrets.
- Weekly measure **GSC/Bing impressions → organic clicks**, and consent-limited **GA4 landing visits → real completions**; count direct/referral separately. Realtime zero means last ~30 min, not zero all day. First 10 genuine non-owner visits and 5 verified tool completions are milestone signals, not external-service guarantees.

## Bing Webmaster Tools — owner UI actions

On 2026-11-02 the owner imported and verified `galaxiora.com` through Google Search Console. The dashboard said reports can take **up to 48 hours**; this is normal.

1. **Sitemaps →** check whether `https://galaxiora.com/sitemap.xml` was imported. If it is absent, **Submit sitemap** once; if present, do not resubmit.
2. **URL Inspection →** sample `https://galaxiora.com/en`, `/en/panchanga`, `/en/astrology/jyotish`; record crawl/index status and errors, do not claim index success from URL submission.
3. **IndexNow →** after publishing the key and submitting changed URLs, inspect received submissions. 200 = received; first 202 = ownership validation pending. Neither means indexed.
4. **Site Scan / Keyword Research →** use EN location and relevant variants to refine actual opportunities; record observed data by country/language rather than inventing search volumes.

Docs: https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed ; https://www.indexnow.org/documentation

## IndexNow safe setup (AWS, after syncing PR and verifying production SHA)

**Important:** this PR does NOT change the live server. First coordinate with Panchanga and brand #6 chat, verify upstream commits, dirty tree and CI. Never blindly checkout old `main`. Ensure `.env` already has `SITE_NOINDEX=0` and `NEXT_PUBLIC_SITE_URL=https://galaxiora.com`. Before anything, check:

```bash
cd /opt/galaxiora/app
git rev-parse --short HEAD
git status --short
npm run test:r43:seo
npm run r3:indexnow -- --url /en/panchanga
```

**Generate a public ownership key only on the AWS host**, once, in the deployed web source tree (not in GitHub). The verification file is intentionally public; the env file should not be committed:

```bash
cd /opt/galaxiora/app
if grep -q '^INDEXNOW_KEY=' .env; then
  KEY="$(sed -n 's/^INDEXNOW_KEY=//p' .env | tail -1)"
else
  KEY="$(openssl rand -hex 16)"
  printf '\nINDEXNOW_KEY=%s\n' "$KEY" >> .env
fi
test -n "$KEY" || exit 1
mkdir -p apps/web/public
printf '%s\n' "$KEY" > "apps/web/public/$KEY.txt"
chmod 644 "apps/web/public/$KEY.txt"
# Build after the key file exists; Next.js public assets must be present at build time.
npm run build -w @jyotish/web
sudo systemctl restart galaxiora-web
curl -fsS "https://galaxiora.com/$KEY.txt" | grep -Fx "$KEY"
```

**First real notification, only if this URL has just been changed and is listed in live sitemap:**

```bash
npm run r3:indexnow -- --url /en/panchanga
npm run r3:indexnow -- --submit --url /en/panchanga
```

For a reviewed list of newly published/updated canonical URLs:

```bash
printf '/en/astrology/jyotish\n/uk/astrology/jyotish\n' > /tmp/galaxiora-changed-urls.txt
npm run r3:indexnow -- --file /tmp/galaxiora-changed-urls.txt
npm run r3:indexnow -- --submit --file /tmp/galaxiora-changed-urls.txt
```

**Exceptional one-time bootstrap** ONLY when the entire site has materially changed during a migration or relaunch, not on every deploy: `npm run r3:indexnow -- --submit --bootstrap`. Empty `--submit` fails closed. By default no HTTP request occurs. The submitter verifies published key **and** live sitemap; rejects noncanonical, private, query-containing, other-host URLs. It does not submit deleted pages (that needs a separately reviewed removal path). Avoid rerunning unchanged URLs: IndexNow can rate-limit with 429. It does not submit to Google.

**Post-deploy:** `npm run site:check`, `npm run launch:verify`, `npm run r32:seo:audit`, public `/en` and `/uk`, favicon #6, GA4 consent/Tag Assistant and Bing sitemap. A successful PR/CI is **not** proof of production deployment or real indexing.

## Scope boundaries and acceptance

- No mutations to Panchanga 2.0 logic, Jyotish JQA-3 calculations, GalaxiPedia, GA4 consent settings, database, translation provider, OAuth/credentials or brand #6 assets.
- No IndexNow key committed and no submission in GitHub Actions.
- `npm run test:r43:seo` passes and `npm run r3:indexnow -- --url /en/panchanga` is offline DRY RUN.
- Real Bing submission is verified only after owner executes AWS key setup and receives HTTP 200/202; Bing/Webmaster IndexNow status is inspected separately.
- Content and traffic work remain to be measured; do not mark "First Real Visitors" complete merely because technical code is merged.

### Parallel work and deployment note

Current base `feat/panchanga-v2-p21-unified-location-and-range-20261102` was **10 commits ahead** of approved icon #6 PR head when this branch was created. Panchanga may advance further: **recheck and fast-forward/rebase on its latest approved SHA before deploying**. No force-push and no deployment from stale default `main`. The proposed GalaxiPedia replacement for GalaxiLearn belongs in a separate PR after Panchanga is approved, with redirects from existing `/en/learn` and `/uk/learn`.
