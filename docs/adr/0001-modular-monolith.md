# ADR 0001 — Evolve Galaxiora into a modular monolith

- **Decision:** accepted as architecture direction, 2026-10-19.
- **Scope:** future changes and gradual refactoring; not a completed code migration.
- **Context:** Next.js web, NestJS API, one PostgreSQL/Prisma schema and deterministic TypeScript Jyotish core. Tarot v2, accounts, roles and paid-reading drafts already share a runtime, while controllers often combine transport, policy and persistence.

## Decision
Keep one deployable NestJS backend, one Next.js frontend and PostgreSQL. Organize by bounded contexts: Identity/Access, Jyotish, Tarot, Experts, Subscriptions/Billing, AI/Usage; add Content, Community and Calendar as functionality actually arrives.

Use **strategic DDD** for module names, ownership and integration contracts. Apply **hexagonal ports/adapters** only where external dependencies need isolation (Prisma, Swiss Ephemeris, AI providers, future payment, storage). Keep application use cases free from NestJS HTTP objects and framework decorators. Domain rules must not depend on Prisma or Next.js. Apply Clean Architecture's inward dependency rule pragmatically. Onion and Clean are compatible mental models, not two extra folder hierarchies.

First extraction candidate: `DrawTarotReading` (HTTP controller -> use case -> deck/quota/narrative policies -> repository/provider ports). Preserve transaction and row lock semantics. No automatic migrations or endpoint changes solely for layering.

## Consequences
**Advantages:** clearer module ownership, cheap unit tests, single deploy/debug workflow, ability to replace AI/DB interfaces, a reusable server API for mobile. **Costs:** modest interfaces and composition wiring; potential overhead if applied to trivial screens. Avoid generic repositories, abstract factories and event buses without a concrete use case.

## Alternatives considered
- No architectural changes: fastest now but continued controller coupling.
- Big-bang Clean/Onion conversion: high regression cost for existing working Jyotish/Tarot.
- Microservices: unsupported operational, consistency and deployment complexity at current scale.

## Guardrails
- One PostgreSQL database until a measured need changes this; explicit ownership of tables and transactions.
- Cross-module calls through named application APIs, not imports of another module's Prisma queries.
- Tests lock current contracts/ownership/quota behavior before refactor.
- Web/API and API/database separation; no paid checkout until verified webhook, idempotency and access review.
- Every significant deviation gets a new ADR; `PROJECT_MAP.yaml` remains the short current-state index.

## Reference decisions
Hexagonal architecture: https://alistair.cockburn.us/hexagonal-architecture
DDD bounded contexts: https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis
NestJS modules: https://docs.nestjs.com/modules
