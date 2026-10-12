# Architectural boundary

```text
Next.js UI (3000) ---> NestJS API (4000) ---> pure TS domain @jyotish/core
                              |                     ^
                              |                     | normalized astronomical facts
                              |                Ephemeris Adapter
                              |                |             |
                              |                @swisseph/node  pyswisseph (fallback)
                              |
                              +-- Prisma / PostgreSQL (saved charts + interpretations)
                              +-- OpenAI API (optional, invoked only on button click)
```

- `npm run dev` serves a **standalone zero-npm-dependency demonstration** on port 4000 with the same TS domain and astronomy adapters; its chart history is temporary in-process memory.
- `npm run dev:full` is the target Next.js + NestJS stack, requiring `npm install`, PostgreSQL and `npm run db:migrate`.
- All astro calculations are deterministic and unit-tested without LLM. No OpenAI key means an explicit local rule-based interpretation, not a fake OpenAI result.
- This repository is a learning MVP, not an authoritative astrology service. Domain conventions are versioned and must be independently verified.
