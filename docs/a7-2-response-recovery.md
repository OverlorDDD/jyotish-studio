# A7.2 — why free AI returned `invalid_response`

- Current `openrouter/free` can return completed text without the JSON object our report previously demanded, or it can fail strict factual checks.
- **For long reports only**, request developed plain-language paragraphs first; validate each paragraph with the unchanged deterministic rule gate; if insufficient, retry exactly once using the fact-linked JSON prompt. Short legacy endpoint remains schema-first.
- Safe diagnostics now distinguish `unsafe_or_short_prose`, `malformed_json`, `missing_sections`, `unsafe_or_short_sections` and `empty_completion` without revealing prompts, provider bodies or keys.
- An accepted LLM commentary appears directly below the title (not behind closed `<details>`). The eight deterministic, verifiable chapters follow, and a failure is explicitly labeled offline.
- Correct the Cancer ascendant ambiguity: Jupiter is ruler of house 9, Mars of house 10; only claim dharma/career linkage where natal evidence warrants it.

## Important release limitations

`npm run ai:verify-live` calls the real configured API; CI uses mocks and cannot prove that a personal OpenRouter account currently has a compatible free model. We must see a real `PASS` from that command with the user's private `.env` before saying the connection is working. No paid models, new taxes or checkout changes.

QA: `npm run test:free-ai-retry`, `npm run test:report`, `npm run test:all`, `npm run build`, `npm run test:integration`, `npm run test:e2e` where configured. Preserve current core astronomical calculations and all historical reports.

## Next after live PASS

Build an 8-chapter AI editor that drafts each chapter from typed findings; use a deterministic validator for every concrete value, improve active dashas/nakshatra synthesis, add content-quality regression on distinct real-world charts and a human Jyotish review. The current step improves real LLM delivery but does NOT substitute a complete professional human consultation.