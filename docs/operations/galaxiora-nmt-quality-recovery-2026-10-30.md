# GalaxiNews — failed Argos Ukrainian translation QA (30 October 2026)

## Decision: do NOT auto-publish this local model

The operator's six real EN→UK examples had severe semantic and grammatical errors:
- *Vedic astrology* → "Ведикська астрологія"
- *nakshatras* → "окшатра"
- *birth chart* → "графік народження"
- *Tarot spreads* → "Тато-розклади"
- *personal reflection* → "особисте відображення"
- *Scorpio* → "Скорпіо"
- *telescope captured images* → "Телескоп захопив зображення"

The previous `TECHNICAL: 6/6 validated` was ONLY an API response check, NOT an editorial quality certificate. Do not solve this with unscoped find-and-replace: such a patch cannot repair syntax, morphology or meaning reliably.

## Immediate action (safe / no data destruction)

In private local root `.env`:

```dotenv
NEWS_TRANSLATION_ENABLED=0
NEWS_TRANSLATION_QUALITY_APPROVED=0
```

Restart only the NestJS/Next processes after the edit. Existing translations and PostgreSQL data remain intact. **Do not run `npm run news:repair` to create more Argos translations.** The updated backend also enforces the quality approval check before any NMT batch writes, even when `NEWS_TRANSLATION_ENABLED=1` accidentally remains in an old `.env`.

The optional local LibreTranslate container can be stopped (no volumes deleted):

```powershell
docker compose --profile translation stop translator
```

Do not run `docker compose down -v` or reset Prisma. Natal-chart AI is unrelated; keep those API keys and settings.

## Safer alternate: Microsoft Azure AI Translator **standard NMT, not generative LLM**

Official references:
- [Azure Translator F0 free tier](https://azure.microsoft.com/en-us/pricing/details/translator/) — 2,000,000 characters/month under the F0 resource, subject to availability and applicable billing / terms. F0 is not the same as an unlimited free account; other tiers may charge.
- [Ukrainian translation support](https://learn.microsoft.com/en-us/azure/ai-services/translator/language-support).
- [Translator REST API](https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/v3/translate).
- [Translator authentication](https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/v3-0-reference#authentication).

This project now supports two **explicit** providers: `NEWS_TRANSLATION_PROVIDER=local` or `NEWS_TRANSLATION_PROVIDER=azure`, and does **not** fall back to Gemini, Groq, OpenRouter or an unauthorized paid API.

To evaluate Azure without publishing any translated text:
1. In the Azure portal create a **Translator** resource selecting **F0**, if that tier is available. Confirm pricing, quota, billing visibility and region before enabling any service. Do not create a paid S1 resource just to test.
2. Copy its key and region into the **private** root `.env` (never commit, paste in a chat, or use `NEXT_PUBLIC_` keys):

```dotenv
NEWS_TRANSLATION_ENABLED=0
NEWS_TRANSLATION_PROVIDER=azure
NEWS_TRANSLATION_QUALITY_APPROVED=0
AZURE_TRANSLATOR_KEY=<YOUR_PRIVATE_KEY>
AZURE_TRANSLATOR_REGION=<YOUR_RESOURCE_REGION>
```

3. With Node/npm installed, run:

```powershell
npm run news:translate:check
npm run news:translate:sample
```

The checks make **only the small six-sentence validation calls** to the explicitly chosen non-LLM Azure service, without modifying the PostgreSQL archive. Confirm that the Ukrainian output is fluent and factually faithful. The automated screen rejects common mistakes but is not a complete language evaluation. A key/region alone does not prove quality.

4. ONLY after all six examples are acceptable to a human and the Azure F0 quota/billing is configured, edit the private `.env`:

```dotenv
NEWS_TRANSLATION_ENABLED=1
NEWS_TRANSLATION_PROVIDER=azure
NEWS_TRANSLATION_QUALITY_APPROVED=1
```

Restart the API. Then run `npm run news:repair` **once** and `npm run news:quality`. Check actual news cards before approving public release. Azure uses only publisher-supplied title and short description, no private natal-chart data.

5. Configure account-side quotas, usage notifications and subscription budget monitoring. **This code has no durable billing hard-stop**; enabling a paid tier may incur charges. Do not exceed the F0 allocation and do not assume a cost alert automatically prevents spending.

## Current limitations

- Quality cannot be certified by mocked GitHub CI; tests only prove adapter wiring, flag gating, security and absence of generative fallback.
- Untranslated publisher titles remain in a pending state while automatic translation is disabled, but existing validated Ukrainian text is kept.
- A known-bad phrase filter cannot guarantee all Ukrainian grammar. Editorial review still needed for a representative live sample and higher-volume releases.
- Neither Argos nor Azure should invent an overview where an RSS publisher supplied only a headline. Copyright, attribution and valid source links still apply.
- If Azure is not desired, keep `NEWS_TRANSLATION_ENABLED=0` and continue exploring local NMT alternatives with explicit human assessment of Ukrainian quality, model licensing and CPU/RAM on the planned hosting.
