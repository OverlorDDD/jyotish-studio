# A7.3 — Full Jyotish AI consultation and live provider diagnosis

## What changed
OpenRouter earlier failed with invalid_response (malformed_provider_response). That indicates a malformed HTTP body before astrological validation. We cannot prove whether the local account gets HTML, empty content or truncated JSON without a live diagnostic; changing prompts was never enough.

Astrology remains deterministic (Swiss Ephemeris, Lahiri, whole-sign D1/D9/D10, rule-verified house lords, Vimshottari). Each of the eight Jyotish chapters now receives only its relevant verified finding evidence. The model writes prose after chapter delimiters: portrait, configuration, tensions, relationships, career, resources, timing, conclusion.

An AI response is accepted only when at least four chapters pass factual checks and each chapter has valid IDs and substantial content. Every successfully generated chapter is labeled LLM, any missing chapter visibly retains the deterministic original. A mixed answer is never labeled all-AI. Technical evidence and previous report versions remain intact.

Provider response bodies are bounded and classified without printing upstream content: empty_provider_body, provider_returned_html, malformed_provider_json, malformed_sse_payload, empty_sse_completion, unexpected_provider_shape. Compatible chat JSON and unexpected SSE text deltas are decoded. Transport failure skips useless same-provider prompt retries and moves to a separately configured provider.

## Recommended free providers
1. Google Gemini 2.5 Flash-Lite via Google AI Studio, only when the project's free tier and NO paid billing have been verified. Enable GEMINI_FREE_TIER_CONFIRMED=1 only then; otherwise 0. See https://ai.google.dev/gemini-api/docs/pricing and https://ai.google.dev/gemini-api/docs/billing.
2. OpenRouter with a named free model rather than the rotating openrouter/free router: OPENROUTER_FREE_MODEL=   # first leave unset/empty; use the doctor to find an active :free model. Check current availability and $0 pricing at https://openrouter.ai/qwen/qwen3-32b:free before choosing it. Only a model suffix :free can be configured; an invalid or paid slug is ignored.
3. Ollama local model if installed. Small models can struggle to author eight well-developed Ukrainian sections.

## Windows PowerShell
From C:\Users\Note\jyotish-studio-git run:
git pull --ff-only origin main
npm install
notepad .env

Preserve working DATABASE_URL (Postgres 5433), AUTH_SECRET and other existing secrets; never share the private .env. Suggested values:
AI_MODE=free
FREE_AI_ORDER=gemini,openrouter,ollama
OPENROUTER_API_KEY=<private_key>
OPENROUTER_FREE_MODEL=qwen/qwen3-32b:free
GEMINI_API_KEY=<private_key_only_after_free_tier_confirmed>
GEMINI_FREE_TIER_CONFIRMED=0   # change to 1 ONLY when verified free with paid billing disabled
OLLAMA_ENABLED=0
FREE_AI_MAX_CALLS_PER_HOUR=10
OPENAI_ENABLED=0

Run: npm run test:a7:consultation
Then: npm run ai:verify-live
A real PASS prints the provider, model and accepted chapter count/8; FAIL gives sanitized diagnostics and is not confirmation of inference.

If the database is stopped, run docker compose up -d db, npm run db:generate, npm run db:migrate. Then npm run dev:full and open http://localhost:3000/uk/astrology/jyotish.
Test with fictional birth details first. Review the provenance label on every generated chapter, including missing chapters that intentionally fall back to deterministic text.

## Guardrails
No paid OpenAI fallback in AI_MODE=free, no self-invented numeric astrology claims, no raw birth dates/names/coordinates in LLM input. The derived chart findings still go to external providers; obtain consent and disclose provider data handling. The per-process free hourly limiter is not production-grade distributed billing enforcement. GitHub CI cannot verify the user's real key or live free-model availability; a manual PASS is mandatory before promising this feature works remotely.

## A7 provider troubleshooting after a PC restart

Docker Desktop being open is NOT proof that the project PostgreSQL container is running. Use `docker compose up -d db` then `docker compose ps`; no reset or volume deletion is required. The live model check does not depend on Docker, and `FREE_AI_ORDER` does not turn on Gemini without a key or Ollama without a local model.

Run `npm run ai:doctor` (key, free catalogue, actual model endpoints, no inference), then `npm run ai:doctor -- --probe` (one tiny external request) before running the expensive eight-chapter `npm run ai:verify-live`. A 401 means key failure; 403 permission/guardrail; 404 removed model or no endpoints; 429 rate limited. Never paste `.env`, keys or complete request bodies into chat.

## 2026-10-21 A7 Cloud-only stability update
The owner expressly disallows local AI. Default FREE_AI_ORDER=gemini,groq,openrouter and OLLAMA_ENABLED=0.
An old .env containing openrouter,gemini,ollama overrides defaults; update it manually. The FREE order only checks enabled providers with keys. Do not expect Gemini/Groq to activate from a comma-separated list alone.
The prior OpenRouter key is valid and its catalogue shows 17 free text models. But openrouter/free hung during even a one-word probe, and the long reading timed out. A valid key does not guarantee provider responsiveness.
Recommended independent cloud backends: Gemini 2.5 Flash-Lite Free Tier (not billed) and GroqCloud FREE plan using openai/gpt-oss-120b; OpenRouter as last resort. Groq on free tier is limited (official: https://console.groq.com/docs/rate-limits); only set GROQ_FREE_TIER_CONFIRMED=1 if your own account is FREE and not attached to paid billing. No paid fallthrough occurs from AI_MODE=free.
For a later paid product, switch to a distinct admin-approved paid mode with budgets, billing safeguards and merchant validation. ChatGPT Plus is not a generic API token for a custom site; OpenAI API billing is separate. Participating partner apps can use ChatGPT plan usage only through the supported Sign in with ChatGPT integration, not by taking a Plus subscription credential.
Local diagnostics: npm run ai:doctor; npm run ai:doctor -- --probe (OpenRouter only), npm run ai:verify-live (enabled cloud providers; reports model and accepted chapters). Do not disclose keys in screenshots or paste .env.
