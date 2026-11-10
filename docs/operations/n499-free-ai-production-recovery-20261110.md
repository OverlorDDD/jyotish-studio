# N4.9.9: Recovery of the three free natal AI providers (2026-11-10)

## Problem
The page's status "free model not configured" is the sanitized `no_provider` branch. The actual `POST /api/v1/reports` path uses `generateDirectJyotish` from `apps/api/src/nest.ts`. It is **not** the older A8.9 multi-chapter helper. Three providers remain available in code, but the deployed process only attempts providers whose credential is present and whose explicitly free tier is confirmed where applicable.

The return reason `no_provider` can result from `AI_MODE != free`, a legacy or malformed `FREE_AI_ORDER`, or all remote providers being skipped because of missing keys/unconfirmed free-tier access. `GALAXIORA_READER_ONLY=1` returns a different `reader_only` reason. A GitHub CI pass using synthetic keys cannot prove a production AWS account has active credentials.

## Intended order and free-tier safety
1. Gemini `gemini-3.1-flash-lite`, only with `GEMINI_API_KEY` plus `GEMINI_FREE_TIER_CONFIRMED=1`.
2. Groq `openai/gpt-oss-120b` or `openai/gpt-oss-20b`, only with `GROQ_API_KEY` plus `GROQ_FREE_TIER_CONFIRMED=1`.
3. OpenRouter `openrouter/free` or an explicitly `:free` model, only with `OPENROUTER_API_KEY`.

The production ordering enforces Gemini first and preserves both backups despite a stale `FREE_AI_ORDER`. No paid OpenAI path is activated. **Free availability is account-specific; credentials and free quotas are never guaranteed by a valid model ID.**

## Incident diagnosis and protected recovery

* Before changing anything, run `node tools/ai-production-status.mjs` on the AWS repo root: it prints only readiness states, safe flags and effective provider order, **never secret values**.
* After exact-SHA deployment, `bash tools/n499-ai-aws-recover.sh --recover` backs up the existing private `.env`, optionally recovers absent free credentials from private prior release backups, and ensures `AI_MODE=free`, `GALAXIORA_READER_ONLY=0` and `FREE_AI_ORDER=gemini,groq,openrouter`. Existing nonempty keys or an explicit `*_FREE_TIER_CONFIRMED=0` are not overwritten.
* A service restart must pass the local API health/mode check. One *invented* chart is sent through the live report endpoint. Only a validated `ai.source=llm` response prints `N499_AI_PRODUCTION_RECOVERY_VERIFIED`. A return of `ai.source=deterministic` is **not** a passing AI result.
* If neither existing `.env` nor private backups contain any eligible provider, the recovery stops; the owner must privately restore API keys or confirm accounts. Never paste keys into ChatGPT, CI logs, GitHub issues or a PR.
* Do not claim the user's own birth chart was used for testing; no user birth metadata is needed for recovery.

## Operator safeguards
- No Docker, database migration, paid calls, credentials in URLs or shell arguments.
- Existing Reader works without external AI.
- Inspect current free-tier billing status in each provider's own dashboard before updating a confirmation flag.
- Gemini's free tier may allow submitted content to be used to improve Google's products; product privacy notices should reflect that external inference sends derived chart factors.
