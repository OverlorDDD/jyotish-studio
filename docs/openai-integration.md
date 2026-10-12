> **Update, October 2026:** Jyotish Studio now defaults to `AI_MODE=free` and free OpenRouter routing. Follow [Free AI setup](./free-ai.md). Existing OPENAI_ENABLED alone NEVER enables paid OpenAI requests.

# Stage 5: OpenAI interpretation, intentionally opt-in

This prototype separates **astronomical calculation** from **language-model interpretation**.

## Data flow

1. The API calculates and stores D1, D9, D10 and Vimshottari using Swiss Ephemeris and the deterministic Jyotish Core.
2. The API extracts **six precise, labelled facts**: D1 lagna, D1 Sun, D1 Moon/nakshatra, D9 lagna, D10 lagna, current Mahadasha/Antardasha.
3. The OpenAI request contains only those facts plus relevant calculation conventions. It excludes raw birth date, location, coordinates, timezone, name and chart ID. The facts are still private derived data; do not use without the person's agreement.
4. Chat Completions uses a strict JSON schema with `factId` references. The server rejects unknown IDs, duplicate IDs, malformed JSON, empty/oversized text, and absent provider responses. Deterministic calculated facts are inserted by the server into the final interpretation so the displayed placements cannot be replaced by the model.
5. The generated symbolic explanations **may still be mistaken**; schema checks cannot prove their truth. The text is framed as a tradition, never as scientifically established prediction.

## Local configuration (root `.env`, never commit)

```
OPENAI_ENABLED=0
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_MAX_CALLS_PER_HOUR=5
```

The **default is `OPENAI_ENABLED=0`** and local rule-based explanations are used. To try a real provider call, get an OpenAI Platform API key with billing and model access. Only then set `OPENAI_API_KEY` and change `OPENAI_ENABLED=1`, restart NestJS, calculate a **fictional demo chart** and click AI Interpretation. This may incur charges. Do not share a key in chat, git, logs or screenshots. ChatGPT Plus is separate from API billing.

When OpenAI is enabled and returns 401/429/500, times out, or sends malformed content, the API returns a descriptive 429 or 503; it **does not silently claim** a local interpretation is OpenAI. For private demonstrations, turn OpenAI **back off** when not actively testing it. The rate limit is a simple process-local global ceiling, not an account-aware security boundary or spending cap. Set a budget/limits in your OpenAI Platform project as well.

`POST /api/v1/interpretations` accepts `{ "id": "...", "lang": "uk", "preferred": "local" }` to explicitly force the free rule-based interpretation even if the provider is configured. Smoke tests always use this safe option.

## Verification

Run in repository root:

```
npm run test:ai
npm run test:all
npm run test:swagger
npm run build
```

`test:ai` uses a fake provider response and makes **zero** real OpenAI requests; it checks omitted birth metadata, provider credentials, schema, rate limiting and failure cases.

With NestJS and PostgreSQL running, `npm run test:full` creates/fetches a fictional chart, checks D1/D9/D10, requests *local* interpretation, verifies invalid coordinates, and confirms the database connection. Real OpenAI success requires your local key; it cannot be certified by mock tests.

## Paid budget initialization and internet demo

`OPENAI_MAX_CALLS_PER_HOUR` is now loaded lazily on the **first paid request after root `.env` is loaded** (not at module import time). It remains a per-process demo budget, not a billing guarantee; set project limits in OpenAI Platform.

Before running `ngrok http 3000`, set `OPENAI_ENABLED=0`, restart the API and Next.js, and run `npm run demo:check`. The check now **blocks** a public demo if paid AI is enabled; use local-only test sessions for paid OpenAI integration.

## Diagnose real OpenAI failures without revealing the API key

If `OPENAI_ENABLED=1` and the key is set but the site shows an AI provider error:

```powershell
cd C:\Users\Note\jyotish-studio-git
git pull --ff-only origin main
npm run test:ai
npm run test:swagger
npm run build
npm run openai:check
```

The `openai:check` command fetches **only model metadata** from OpenAI. It makes no paid chat generation request; it prints only the configured model, HTTP status, a machine-readable provider error code, and safe guidance. It never prints the key or upstream response text. HTTP 200 on this check **does not prove credits or successful chat generation**. The site now displays a sanitized diagnosis with the upstream HTTP status on a failed interpretation, including `429 insufficient_quota` when returned by OpenAI.

Keep the web/API running on localhost for diagnosis and share only the safe status text, not your key or `.env`.
