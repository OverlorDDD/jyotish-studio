# Galaxiora Tarot v2 — human-style reading, 78 classic images, admin testing
October 18, 2026

## Delivered
- **Classic Rider–Waite–Smith pictures:** exact mapping for all 22 Major + 56 Minor Arcana. Each revealed card uses a genuine illustrated image (not a typographic placeholder), with the artwork rotated 180° for reversed cards. Images are attempted locally first (`/tarot/rws/<file>`), and fall back to a pinned remote archive URL if not downloaded.
- **Locally cached artwork:** `npm run dev:full` now runs an automatic pre-start preparation step: checks all 78 JPEG files for complete JPEG headers/trailers, downloads missing or corrupted images to `apps/web/public/tarot/rws/`, and reports verified counts. `npm run tarot:assets` can be run manually if needed. The binary images are .gitignored and not distributed through Git; the pinned remote URL remains a fallback when offline. Images are written atomically and verified before the full app launches. Do not use vague image-search placeholders.
- **Reader-style interpretation:** hand-authored specific scenario cues for 78 distinct cards, in both direct and reversed position and both EN/UK. The offline synthesis responds immediately to the question with a potential sequence of concrete events, explains each card in its spread position, offers cautions and advice. For example a short-term evening question gets a short-term reading about plausible invitations, conversations, news, changes of plan — not the old "symbolic reflection" preamble.
- **Optional generative AI:** explicit user checkbox consent. Server-side flag `TAROT_AI_ENABLED=true` plus provider/key required. Model receives ONLY the question and verified drawn card details, no raw birth data, no session secrets. Separate strict JSON response fields: directAnswer, development, cardExplanations (exact count), caution, advice. Failed provider or invalid result falls back to the vivid offline version without losing the saved draw.
- **Usage metering:** provider/model, result and provider-reported tokens/cost (if any) in AiUsage, operation `tarot_reading`. Raw prompts and personal questions never enter AiUsage.
- **AI rate caps:** 12 requests per hour per API process, successful AI generations per user: MEMBER max 2/day, ADMIN max 10/day, regardless of card draw allowance. Costs are only incurred if user checks AI consent, provider is enabled and key exists. `TAROT_AI_ENABLED=false` default.
- **Card draw quota:** MEMBER and EXPERT/SUPPORT remain 3 free readings/UTC day. ADMIN increases to 100/UTC day, resolved from the database role inside the locked transaction — never from the browser or client-requested role. Reloads and simultaneous draws do not bypass limits.
- **Saved AI text:** additive Prisma fields `narrative`, `narrativeLang`, `narrativeModel`; old readings remain valid and automatically use the newer offline reader text when opened from history. AI text appears in its original generated language, with offline EN/UK fallback when the site locale differs.
- **Customer conversion:** "Personal video from a human reader" under every opened full spread links to the existing `#human-readings` block; the real payment gateway stays OFF.

## Important art source and licensing
Classic 1909 Rider–Waite–Smith artwork by Pamela Colman Smith, designed with Arthur E. Waite; 78 scans via [mixvlad/TarotCards](https://github.com/mixvlad/TarotCards), specifically **commit 840b84d012c6b74dc1634fa2d00d1b21f5b28093**, folder `tarot/rider-waite/720px/`. Upstream metadata describes historic public-domain deck and third-party restored scans from Steve-P.org. Credit original artist prominently. Historic illustrations have public-domain status in many jurisdictions, but digitally restored scans, modern recolorings, trademarks and local rules must be separately cleared before revenue/commercial distribution. If commercial clearance fails, replace URLs/images with explicitly licensed Wikimedia Commons scans. Do not copy modern card illustrations or vendor reprints.

## Full local setup (Windows PowerShell)
Start Docker Desktop **Engine running**. Keep PostgreSQL data volume (never `docker compose down -v`).
```powershell
cd C:\Users\Note\jyotish-studio-git
git status --short
git pull --ff-only origin main
npm install
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run test:all
npm run test:swagger
npm run build
npm run dev:full
```
Tarot v2 originally added an additive database migration. The latest automatic-image-preparation patch adds **no further database migration**.

On first `npm run dev:full` the terminal may print `Tarot art preparation` and attempt the one-time download of the 78 classic JPGs. Subsequent starts reuse valid copies. To explicitly prepare offline-deploy assets ahead of build, run `npm run tarot:verify-art`. Set `TAROT_ART_REQUIRE_LOCAL=true` when running this in a deployment pipeline to fail if any local assets are unavailable. If offline, the normal developer launcher shows a warning but continues, using the remote fallback.
If already running `dev:full`, restart the servers after migration.

### If you decide to test an AI provider
By default, no paid AI requests are made. Use the offline reading before enabling AI. For an OpenAI-compatible API, after setting your real key in **local uncommitted** `.env`:
```dotenv
TAROT_AI_ENABLED=true
TAROT_AI_PROVIDER=openai
TAROT_AI_MODEL=gpt-4.1-mini
OPENAI_API_KEY=YOUR_PRIVATE_API_KEY
```
Alternatively choose `openrouter` and configure `OPENROUTER_API_KEY`, or select a local Ollama model. Restart the backend and refresh the browser. A consent checkbox will appear on `/uk/tarot`. The API key must NEVER be in browser code or GitHub. This feature may incur external API cost, which should be budgeted. If you do not want AI calls, leave `TAROT_AI_ENABLED=false`.

### Verify roles and daily quotas
`GET /api/v1/tarot/readings` returns actual `limit` and `remaining` from the signed account:
- ADMIN: 100 per UTC day.
- MEMBER: 3 per UTC day.
If you see 3, you are not signed in with an effective ADMIN role in that database. In your local setup first promote your account via `npm run admin:setup` (only if no admin exists), and sign out/back in.
The backend checks role inside transaction; manually changing account role in client cannot bypass cap.

## Manual acceptance
1. On initial `npm run dev:full` startup, check for `Tarot art verified: 78/78 classic cards.` If not complete, run `npm run tarot:assets` when internet access is available.
2. `/uk/tarot`: sign in, ask "Що мене чекає сьогодні ввечері?", draw 3 cards, verify 3 real classical illustrations; open cards, including any reversed card (180°).
3. Reveal all: direct question-specific narrative, imagined event progression, 3 individual card explanations, warning and advice. It should no longer begin with "Сприймай ці образи..." or list abstract journaling steps.
3. Repeat for one card and 10-card Celtic Cross; verify card name matches picture and no duplicates in one draw.
4. Switch between EN/UK and inspect saved history; new offline text is in correct language.
5. Check ADMIN shows **100** initially (minus already-used readings today); MEMBER still **3**, fourth normal-user draw 429.
6. If AI intentionally configured, check consent, real usage counts from provider and preserved AI reading in history. Uncheck consent: no AI call should occur. If provider fails, user still gets the rule-based reading. No real payment.
7. No account can see someone else's Tarot history. Check normal Jyotish charts and admin overview continue to work.
