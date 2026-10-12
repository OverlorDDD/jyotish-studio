# Stage 6 — $0 AI routing for Jyotish Studio (Windows)

## Goal and billing guarantee

**Default `AI_MODE=free` never calls OpenAI paid endpoints.** The only remote inference model hard-coded in the default path is **`openrouter/free`**, whose prompt/completion token prices are advertised by OpenRouter as $0. OpenRouter automatically chooses from its currently available free model pool. There are account and rate limits, so availability is not guaranteed. Optional **Ollama** runs on your own PC; it uses computer resources and downloads a model, but has no API token bill. With no available model, return the existing **local interpretation** so the site still works.

The separate legacy paid OpenAI path is accessible **only** with `AI_MODE=paid_openai` AND `OPENAI_ENABLED=1`. Do not use that mode for zero-cost demos. Old `OPENAI_API_KEY` and `OPENAI_ENABLED=1` alone do not trigger billing under the default `AI_MODE=free`.

## Free OpenRouter setup (recommended first)

1. Open https://openrouter.ai/keys, create an account and API key. For this route, you do not need to buy token credits; however, verify the terms and limits shown for your account. Configure a $0 spend cap if supported by your account. **Never enter a payment method or upgrade to a paid tier solely for this demo.**
2. In PowerShell `cd C:\Users\Note\jyotish-studio-git`; update the repository: `git pull --ff-only origin main`.
3. Open the EXISTING root `.env` with `notepad .env`, keeping the working `DATABASE_URL=...localhost:5433...` unchanged. Add or update these lines (one per key):

```dotenv
AI_MODE=free
OPENROUTER_API_KEY=YOUR_NEW_OPENROUTER_KEY
FREE_AI_ORDER=openrouter,ollama
FREE_AI_MAX_CALLS_PER_HOUR=10
OLLAMA_ENABLED=0
# Legacy paid integration stays disabled:
OPENAI_ENABLED=0
```

4. Save; stop the old `npm run dev:full` via Ctrl+C. Run `npm run test:free-ai`, `npm run test:swagger`, `npm run build`, then `npm run free-ai:check`. This GET check is metadata-only, no paid generation.
5. Run `npm run dev:full`. At http://localhost:3000 calculate a **fictional** Delhi chart, click “Створити інтерпретацію”. The result should be labeled “Безкоштовна AI-модель (OpenRouter)”. If free routing is rate-limited or returns invalid JSON, the API tries the next enabled provider and ultimately returns a local text. Browser still functions.
6. Test EN and UK languages. Run `npm run test:full` in a second terminal: it intentionally forces the local, no-cost interpretation regardless of provider configuration.

**Privacy:** Even though birth metadata is not sent to the remote model, derived positions, nakshatras and dasha periods are sent. Third-party free model providers may handle and retain prompts according to their policies. **Do not use real personal birth information** in the online demo without appropriate permission and privacy disclosures.

## Optional Ollama fallback (no cloud credits)

To have a fallback when OpenRouter is limited/offline, install [Ollama for Windows](https://ollama.com/download) and pull a compact free model in PowerShell:

```powershell
ollama pull gemma3:1b
ollama list
```

The `gemma3:1b` download is approximately 806 MB, with additional working RAM needed. Its Ukrainian and strict-JSON quality can be weaker than cloud models, so the server verifies every AI response before showing it. Ollama exposes a local API at `127.0.0.1:11434`. It is **not** proxied to visitors.

Set in root `.env`:

```dotenv
OLLAMA_ENABLED=1
OLLAMA_MODEL=gemma3:1b
FREE_AI_ORDER=openrouter,ollama
```

Save, restart the backend, rerun `npm run free-ai:check`. To prioritize your own PC over cloud access, set `FREE_AI_ORDER=ollama,openrouter`. The app tries the next provider when the previous one fails, but it cannot promise instant responses or a successful result from every small local model.

## Free model errors & checks

- `429` on OpenRouter: the free account/model rate limit is probably exhausted; fallback attempts Ollama if installed, otherwise local interpretation.
- `401` on OpenRouter: wrong/missing key; fix `OPENROUTER_API_KEY`.
- No OpenRouter key: local fallback always works; you can configure Ollama.
- If cloud free model generates malformed JSON or unsupported schema, the server rejects it and tries Ollama/local. Tests check schema and the preservation of facts.
- Use `npm run free-ai:check` to diagnose free keys; it **never prints secrets or sends birth chart data**.

## Temporary private ngrok demo

Default `AI_MODE=free` is permitted through password-protected demo checks, and `AI_MODE=local` is a more robust no-network option. Keep the private username/password, `docker compose up -d --wait db`, `npm run build`, `npm run start:full`, and `npm run demo:check`. The preflight blocks `AI_MODE=paid_openai`. **Only then** run `ngrok http 3000`.

Free tier limits can be consumed by visitors; never claim the preview is an always-on public product. Do not expose the PostgreSQL database or NestJS port directly to the internet.

## Why might the preview display “Локальне пояснення”?

`npm run demo:check` verifies authentication, Next.js proxy and NestJS/PostgreSQL health, **not** cloud AI generation. A remote AI provider can still fail even when this check passes.

With the updated free AI flow:
- The web panel shows a short, non-sensitive reason when OpenRouter and other enabled free models are unavailable: `rate_limited`, `invalid_response`, `timeout`, `provider_rejected`, `provider_unavailable`, `network`, `no_provider`, or `hourly_limit`.
- OpenRouter has **45 seconds**, not 15, to respond. Ollama still has 60 seconds.
- The built-in offline reading includes the complete calculated D1, D9 and D10 planetary placements plus current Mahadasha/Antardasha, with separate sections in Ukrainian or English. These deterministic summaries are not a substitute for a generated AI interpretation.
- The NestJS terminal reports a sanitized line `Free AI fallback: openrouter <reason>; trying next provider`; it does not print API keys, prompt bodies, or provider response text.

When you see local fallback: stop production preview, run `git pull --ff-only origin main`, `npm run test:all`, `npm run build`, and `npm run start:full`. Then click Interpret on a fictional chart **once**, wait for the response, and report the shown fallback reason. Do not repeatedly refresh if a provider has exhausted its free limit.

You can check key metadata without generating text via `npm run free-ai:check`; a PASS does **not** guarantee free inference quota. `demo:check` must still pass before opening ngrok.
