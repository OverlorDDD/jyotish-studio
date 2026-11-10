# N500: production cloud AI timeout and provider diagnostics

Scope: optional external natal prose only. Local deterministic Reader remains unchanged.

## Confirmed from owner's AWS transcript
- `N499_PROVIDER_CONFIG_READY=3`: all three keys/free-plan opt-ins present.
- `N499_RUNTIME_MODE_FREE`: API is in free mode and Reader-only is off.
- `N499_LIVE_LLM_NOT_VERIFIED reason=timeout`: no accepted long-form response.
- The former direct path kept a **single 38-second AbortController** across a request and a corrective retry.

These facts do **not** establish whether the upstream Google, Groq or OpenRouter endpoint
is healthy or whether a token/connection delay is the dominant problem.

## Diagnosis (no credential entry)
On the existing AWS host, from `/opt/galaxiora/app`, run:
`node --env-file=.env tools/n500-ai-provider-probe.mjs`.
The test sends one harmless word request to each free-plan enabled provider, logs
only provider name, numeric HTTP code, response validity and elapsed milliseconds.
It never logs the key or returned text. `READY` means configured, not reachable.

## Scoped repair
- Gemini stays first, then Groq, then OpenRouter.
- Each retry has its own timeout. Global request budget is 185 seconds, with
  per-attempt limits of 65 / 42 / 42 seconds respectively.
- Output target reduced from 650-950 to 450-650 words and max generation tokens
  capped at 2600 (Groq 2200; corrective retry 1800).
- The returned text still passes grounded N4/Jyotish reference and editorial checks.
- Failures preserve the deterministic, source-bound Reader and do not call paid OpenAI.

## Acceptance
1. PR CI includes mocked timeout + failover tests and production API build.
2. No real user birth details are used in diagnostics or synthetic smoke.
3. A successful quick probe is **not** the same as verified full AI.
4. After deployment, `node --env-file=.env --experimental-strip-types tools/jyotish-direct-live-check.mjs`
   must complete a validated external consultation for a synthetic chart.
5. If upstream connectivity fails, record per-provider statuses without ever
   re-entering keys or forcing paid inference.
