# N4.9: genuine model prose and original JHora 8.0 acceptance
Prepared 2026-11-05. Draft PR #120 only. No AWS deployment, no feature flags enabled.

## Authoritative sources (checked)
- Original Jagannatha Hora 8.0 by P. V. R. Narasimha Rao: https://vedicastrologer.org/jh/index.htm
- Original JHora 8.0 changes: https://mail.vedicastrologer.org/jh/update_8.0.htm
- Independently developed JHoraKit original clipboard extractor: https://github.com/normalmystic/JHoraKit (pinned commit `f63826b501eabe69c6b08c5365875e1e2f74c24a`).
- JHoraKit method-INI diagnostics: https://github.com/normalmystic/JHoraKit/blob/main/JHoraInternals.md
- **Not the original software:** https://jagannathahora.com/contact explicitly says its website is independent. Never use it as the JHora 8.0 oracle.
- Existing model provider documents: https://ai.google.dev/gemini-api/docs/billing ; https://console.groq.com/docs/rate-limits ; https://openrouter.ai/collections/free-models

## Real AI corpus: 48 accepted responses, not mocked
Our site ALREADY has Gemini, Groq and OpenRouter. No additional provider is necessary. The private API keys on AWS are NOT available through the ChatGPT/GitHub connector and must never be pasted into commits or logs.

The corpus is 12 **synthetic** natal profiles × Ukrainian/English × evidence-first A and scenario-first B = 48 responses. Run the collector in an isolated environment that already has an approved confirmed-free provider key. The `N4_VARGA_AI_ENABLED` flag is set in its single test process only, NOT in production.

Required environment: `N4_LIVE_EDITORIAL_EXPLICIT_OPT_IN=YES_SYNTHETIC_ONLY`, `N4_LIVE_EDITORIAL_PROVIDER=gemini|groq|openrouter`, `N4_LIVE_EDITORIAL_OUTPUT=/absolute/private/outside-repo/responses.jsonl`, `N4_LIVE_EDITORIAL_START=0..47`, `N4_LIVE_EDITORIAL_BATCH_SIZE=1|2`, plus that provider's existing API key and free-tier confirmation. Never enable paid model/billing. For OpenRouter use a pinned `:free` model; `openrouter/free` randomly routes and is invalid for controlled A/B comparison.

Execute `node --experimental-strip-types tools/n4-ai-capture-live.mjs`. Each run allows at most TWO actual provider calls INCLUDING retries. Accepted model text and model identity are preserved privately; failed attempts are written only to `.failures.jsonl` WITHOUT discarded prose, and do not consume an accepted sample ID. Stop if rate-limited; do not assume free quota.

Check progress safely using `node --experimental-strip-types tools/n4-ai-progress.mjs /absolute/private/responses.jsonl`; use `nextMissing.index` to select the next valid start index. For completed 48/48, run `node --experimental-strip-types tools/n4-ai-evaluate-live.mjs /absolute/private/responses.jsonl`. It uses the same verifiable two-selected-varga rule as live N4. This cannot prove semantic truth by itself.

Render the private human A/B page: `node --experimental-strip-types tools/n4-ai-blind-review.mjs /absolute/private/responses.jsonl /absolute/private/review.html`. Two distinct human reviewers must assess UK/EN fluency, D1/D9/D10 and two extra vargas, factual placements, non-repetition and practical guidance; run `node tools/n4-ai-human-review-check.mjs /absolute/reviewer1.json /absolute/reviewer2.json`. Edit actual defective examples and retest rather than trusting a regex pass.

**Status:** 0/48 genuine model responses have been collected by ChatGPT because the provider keys are private. All real-text certification and human signoff remain PENDING.

## Original JHora mathematical oracle
Official Windows 10 ZIP download helper (download-only, NO execution):
`powershell -ExecutionPolicy Bypass -File tools/n4-jhora8-author-preflight.ps1`

Only the publisher's three direct hosts are attempted. If they return 406/429 again, do not use untrusted mirrors. ZIP shape and SHA256 do not prove a publisher signature, so review source trust before manually running the author executable.

The isolated original-binary Wine/JHoraKit runner in `tools/n4-jhora8-run.sh` already pins method options and requires the author binary to be installed. It produces 50 fake-profile clipboard exports, imports original signs with `tools/n4-jhorakit-import.mjs` and can compare all **50×16×10=8000** varga sign assignments. The new `tools/n4-jhora8-diff-diagnostic.mjs` prints discrepancies per D-chart without publishing private metadata. The strict `tools/n4-external-varga-gate.mjs` cannot pass without 50 distinct, hash-tagged original records and exact settings. The earlier double-escaped ID and SHA regex bug is repaired. A shape check is **not** proof that the Windows binary was original; independently verify its acquisition and raw-source chain.

The public JHoraKit sample previously had 44 different signs among 160 due UNALIGNED method options; a mathematical disagreement cannot be waived as “probably just a convention.” Original identical-method 50-chart JHora oracle is still **0/50**, with publisher download blocking it. PyJHora's 8000/8000 synthetic parity is separate evidence, NOT an original JHora certificate.

## Release decisions
Pass must include full provider responses + human editorial acceptance; authentic original JHora 50 same-method profiles; exact-head regression/core/Chromium/SEO/privacy PASS; one final owner Windows QA; and explicit owner merge/AWS release consent. Production N4 flags stay OFF until then.
