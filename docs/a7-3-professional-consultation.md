# A7.3 — Full Jyotish AI consultation and live provider diagnosis

## What changed
OpenRouter earlier failed with invalid_response (malformed_provider_response). That indicates a malformed HTTP body before astrological validation. We cannot prove whether the local account gets HTML, empty content or truncated JSON without a live diagnostic; changing prompts was never enough.

Astrology remains deterministic (Swiss Ephemeris, Lahiri, whole-sign D1/D9/D10, rule-verified house lords, Vimshottari). Each of the eight Jyotish chapters now receives only its relevant verified finding evidence. The model writes prose after chapter delimiters: portrait, configuration, tensions, relationships, career, resources, timing, conclusion.

An AI response is accepted only when at least four chapters pass factual checks and each chapter has valid IDs and substantial content. Every successfully generated chapter is labeled LLM, any missing chapter visibly retains the deterministic original. A mixed answer is never labeled all-AI. Technical evidence and previous report versions remain intact.

Provider response bodies are bounded and classified without printing upstream content: empty_provider_body, provider_returned_html, malformed_provider_json, malformed_sse_payload, empty_sse_completion, unexpected_provider_shape. Compatible chat JSON and unexpected SSE text deltas are decoded. Transport failure skips useless same-provider prompt retries and moves to a separately configured provider.

## Recommended free providers
1. Google Gemini 2.5 Flash-Lite via Google AI Studio, only when the project's free tier and NO paid billing have been verified. Enable GEMINI_FREE_TIER_CONFIRMED=1 only then; otherwise 0. See https://ai.google.dev/gemini-api/docs/pricing and https://ai.google.dev/gemini-api/docs/billing.
2. OpenRouter with a named free model rather than the rotating openrouter/free router: OPENROUTER_FREE_MODEL=qwen/qwen3-32b:free. Check current availability and $0 pricing at https://openrouter.ai/qwen/qwen3-32b:free before choosing it. Only a model suffix :free can be configured; an invalid or paid slug is ignored.
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
