# N4.9 TokenLean v1 — Evidence-first, one-call AI reading
Date: 2026-11-05. Implementation on Draft PR #120 only. No production rollout.

## User-confirmed Groq Free quotas
Model \`openai/gpt-oss-20b\`: 30 RPM; 1,000 RPD; 8,000 TPM; 200,000 TPD.
Limits are organization-wide. The token/minute allowance, not RPM, is the likely constraint on large natal prompts.
Prior baseline: ~900–1300 requested words, broad D1/D9/D10, full 12 extra D-charts × 7 classical grahas,
priority brief and multi-page writer instructions; observed one \`token_limit\` and one immediate \`429\`.

## New architecture
1. Deterministic Natal engine computes D1, D9, D10, dasha and 16 vargas. The server, not the model, selects the most relevant rule evidence.
2. Pure \`buildN4TokenLeanPrompt\` sends D1 9 body positions, selected primary house lords,
   D9 two placements, D10 two placements, exactly **two** top selected supplementary varga lenses,
   short rule limits, active period rulers, and nothing else. No date/time of birth, city, name, PII or full D60.
3. Short fixed system prefix teaches evidence discipline, primary-versus-derived chart distinction,
   conditional scenes, strengths/tradeoffs and safe boundaries. Dynamic facts are placed at the END to
   maximize Groq automatic prompt cache reuse. Cache hits are not guaranteed.
4. **One request, zero automatic corrective retries** in \`n4TokenLean\` mode. Output target ~320–450 words;
   \`max_tokens=2400\` in the exploratory path (includes hidden reasoning budget). Truncated/invalid
   output is REJECTED, not published. Never manufacture an editorial pass.
5. The trusted local code verifies source placements and selection before the call; the existing
   \`reviewN4EditorialGate\` validates explicit N4 claims afterwards. Quality still needs two human reviewers.
6. Response \`usage.prompt_tokens\`, \`usage.completion_tokens\`, \`usage.total_tokens\` and
   \`usage.prompt_tokens_details.cached_tokens\` are captured as numeric, secret-free telemetry in
   the private local synthetic-only audit file even when rejected.

The current experiment is NOT enabled automatically for the production Direct v2 API.
The synthetic lab must set \`N4_LIVE_EDITORIAL_TOKEN_LEAN=1\` explicitly. Full actual provider corpus
48/48 is still pending; no provider calls were made to implement this feature.

### Cost acceptance (actual provider stats, not guessed)
- Target mean prompt \`< 1,200 input tokens\`, mean entire response \`< 2,400 completion tokens\`
  including any reasoning; actual Groq response usage determines whether it passes.
- Each account request must obey available TPM/TPD, RPM/RPD and any split input/output TPM.
- At 8k TPM, do NOT batch 2 calls into one minute without measured remaining token headroom.
- Target 0 unneeded automatic retries, full 1-call acceptance in pilot, and no loss of factual validity.
- Cache verified only by \`cached_tokens\` from actual response; never claim savings just because
  system prompt text is stable. Structured-output JSON-schema is possible with GPT-OSS20B
  but not introduced until the textual quality gate is stable, as schema overhead also consumes tokens.
- Offline deterministic data panels should render full technical details for free; the LLM synthesizes
  original interpretation instead of restating all placement tables.

Provider references:
https://console.groq.com/docs/prompt-caching
https://console.groq.com/docs/structured-outputs
https://console.groq.com/docs/reasoning
https://console.groq.com/docs/rate-limits

## Private original JHora 8.0 INI method alignment (uploaded by owner; NOT copied)
The provided original author version: \`JHoraVersion=8.0.0.0\`.
Sanitized calculation-key evidence in the owner's profile:
\`HoraPreference=6\`, \`D24Preference=1\`, \`DivLongFromEndToo=1\`,
\`UserSelectedAyanamsa=17\`, \`D10Preference=0\`, \`D60Preference=0\`,
\`Siddhanta=0\`, \`TopocentricPositions=0\`, \`TruePositions=1\`, \`TrueNodes=0\`.
JHoraKit's JHoraInternals.md says internal ayanamsa enum \`17\` is True Lahiri/Chitrapaksha
in its tested JHora8 build, NOT simply the first graphical dropdown choice.
The existing isolated CI JHora runner requests \`HoraPreference=0\`,
\`D24Preference=0\`, \`DivLongFromEndToo=0\`, and explicitly sets
\`UserSelectedAyanamsa=0\` rather than the owner's values. These are
**UNALIGNED calculation settings, not failed mathematics**.
Never import the owner's entire INI: it also contains default location/current chart
and personal display data. Do not modify their installed JHora settings.
Before original 50-case parity, make a back-up profile in a separate instance, align
calculation variants to ONE recorded method, capture source INI SHA256,
then compare each D sign. No JHora 50-case certification exists yet.
