# N4.9 TokenLean v2: metering and evidence
Date: 2026-11-05. Draft PR #120 only, no merge or production deploy.

## User's actual result
First real gpt-oss-20b TokenLean call: provider returned a non-truncated response, which failed N4 automatic check:
- n4_missing_two_evidenced_lenses
- n4_insufficient_two_verified_placement_claims
- n4_missing_grounded_placement_in_two_selected_lenses

No raw returned prose was preserved in the old failure record. **Do not claim to know whether the natural-language interpretation was meaningful or accurate.** Accepted 0/48.
Static benchmark measured avg prompt characters 16,741 before vs 2,221 after; 87% characters saved, NOT an 87% provider-token reduction.

## Fixes and rationale
- The pure local \`buildN4TokenLeanPrompt\` now includes **two explicit and mathematically computed, machine-verifiable citations** corresponding to the top two selected supplemental vargas. The model is instructed to repeat both citations in natural prose and interpret the evidence, without recalculating planets or guessing house numbers.
- No automatic retry: TokenLean still makes exactly one provider request. Failed content stays rejected rather than being shown to the user.
- A new callback privately stores **synthetic-only rejected model prose** in \`responses.jsonl.editorial-rejections.jsonl\` for actual editorial inspection, separate from accepted rows and diagnostic logs. Do not publish prose to Github/CI. Real-user birth data are absent from the synthetic corpus.
- Existing Direct Jyotish now emits actual \`AiUsageEvent\` for each successful upstream HTTP response, **even if its prose is rejected locally**; uses provider-reported prompt/completion/total tokens. HTTP errors preserve unknown token counts. The existing NestJS \`recordAiUsage\` writes to Prisma \`AiUsage\` on production only after owner-approved deployment. No database migrations.
- \`tools/n4-ai-usage-summary.mjs /absolute/private/responses.jsonl\` prints only safe numeric statistics from both accepted and failed lab records (including cached tokens). Local lab records are NEVER silently inserted into production.
- Existing admin already aggregates \`AiUsage\` over last 30 days in \`apps/api/src/admin.ts\` endpoint \`/api/v1/admin/overview\`. \`apps/web/app/components/AdminDashboard.tsx\` shows counts, provider/model, Input, Output, Total and provider-reported USD cost. The last user's one-call Windows experiment did not use NestJS, so the admin never received that row. Previously Direct v2's success-only \`onUsage\` emitted no numeric tokens; the branch fix corrects that pending deployment.

## Next controlled gates
1. Focused N4 + existing Direct regression suite + canonical integration PASS; do not spend API tokens before local tests.
2. Owner shares **updated local** \`responses.jsonl.failures.jsonl\` from the previous TokenLean v3 to inspect actual provider usage, or executes the safe local meter on it.
3. Only then do **one** next opt-in Groq call using the updated branch and a pinned script, preserving the failed model's original prose for human error analysis.
4. Achieve 1/1 one-call complete with correct D1+D9+D10+two selected vargas and materially useful synthesis; do not call “quality certified” from regex assertions.
5. Compare A and B under identical model/facts, then 48 accepted responses and two independent human reviewers. Hard-stop on cost/rate limits.
6. Original publisher JHora 8.0 same-method 50-case/8000-point matrix remains an entirely separate hard release gate. No N4 feature flags on live site until original JHora and editorial approvals.

## Provider limits (owner screenshot)
Groq gpt-oss-20b: RPM 30, RPD 1000, TPM 8000, TPD 200000; actual response usage and caching must determine scheduling.
