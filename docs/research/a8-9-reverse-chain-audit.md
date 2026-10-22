# A8.9 reverse-chain audit — 2026-10-22

Status: **engineering fix pending real-provider and human acceptance**. This document does not certify literary or classical accuracy.

## Observed failure (user's local run)
- Free providers eligible: Groq, Gemini Flash Lite, OpenRouter.
- Groq returned a partial/format-invalid chapter group and later HTTP 429.
- Gemini returned HTTP 503 (temporary service failure).
- Prior implementation then ran a mandatory second eight-chapter editorial *rewrite*, split into bounded groups, which returned fewer than all eight and caused the entire complete author document to be discarded (`A8.9 editor rejected: incomplete_document`).

## Verified backwards dependency chain
1. `DetailedReport.tsx`: only renders unified model sections when AI provider returns a valid document. When no AI result, it renders Reader v5 as designed; it cannot reconstruct missing chapters.
2. `nest.ts`: feature flag `GALAXIORA_A89_PREVIEW=1` uses A8.9 and a separate cache partition. Failures are not cached. AI keys remain only on server.
3. `consultation-intelligence.ts`: the final destructive second authoring pass was the most reliable way to destroy a complete author result; removed. The server now publishes an eight-chapter author result ONLY after `verifyUnifiedConsultation`, a deterministic whole-document gate. No partial LLM/V5 splice.
4. `resilient-consultation.ts`: A8.9 uses four bounded two-chapter calls, strict per-group completeness, free-provider failover, same global plan. Legacy A8.8 behavior not altered.
5. `free-ai.ts`: strictCompleteness flags reject partial chapter output at the provider boundary, retrying other permitted FREE providers; user account rate limits are not bypassed.
6. `ai.ts` /`consultation-ai.ts`: the old compact prompt said *Edit ONLY* even during first-pass writing, banned actual detailed data from prose, constrained text length and enforced fixed two-paragraph markers. Updated A8.9 two-chapter prompt to prioritize an individual practitioner's narrative, narrative connection, and strong natural Ukrainian/English, with a slightly larger output allowance, keeping the legacy four-chapter limit.
7. `jyotish-core` fact graph, reviewed-math inputs and `research-library`: unchanged; historical OCR claims remain not scan-verified. No planetary calculations were patched to fix a writing problem.

## Document-gate limitations
The present gate checks explicit calculated claims in a limited set of forms, disallowed western-specific concepts, erroneous dates/dasha, duplicates, required chapter coverage and minimum volume. It **cannot certify implied claims, a professional human narrative, source-edition validity or real client resonance**. No amount of synthetic PASS can substitute review of a real report.

## External constraints (not local syntax errors)
Gemini HTTP 503 means temporarily unavailable. Groq HTTP 429 is rate limit or capacity throttle. Both should have bounded retries/backoff or alternative eligible provider on the next run; **do not force paid API use**. A free account cannot guarantee a completion on every attempt.

## What user should provide (without secrets)
- Run `git pull --ff-only origin main` once this PR has merged.
- Set `$env:GALAXIORA_A89_PREVIEW='1'`, `$env:AI_MODE='free'`, `$env:A89_DIAGNOSTICS='1'`.
- Optionally set `$env:FREE_AI_ORDER='gemini,openrouter,groq'` for an independent diagnostic (not guaranteed faster).
- Run `npm run ai:verify-live`. Send the full console output with **all key values, birth data and auth cookies omitted**.
- If PASS, run the site and send the eight rendered consultation chapters (no personal identifiers needed) for side-by-side editorial critique versus Reader v5. If FAIL, give errors and any request latency as shown in console.
- Also send `git log -1 --oneline` and `git status --short`; local Next-generated `apps/web/next-env.d.ts` and untracked `package-lock.json` do not by themselves prevent runtime.
- **Never send API keys, full `.env`, browser cookies or tokens.**

## Quality acceptance
A8.9 remains OPEN. Judge a consented real chart for individual thematic thesis, interdependent houses/planets and counterweights, readable vivid narrative, native UA and EN, lack of repetition, complete 8-chapter rendering and no invented Jyotish facts. Compare to JHora and, ultimately, a traditional practitioner. PR CI tests only prove transport, shape and known regression cases.
