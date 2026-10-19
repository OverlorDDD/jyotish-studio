# Engineering references — verified starting points

Curated official/primary documentation checked on 2026-10-19. **Link to primary sources instead of vendoring external copyrighted manuals** or copying pages into this repo. Versions matter: the code currently uses Next.js 15, NestJS 10, Prisma 6.

## Architecture
- Hexagonal (Ports & Adapters), original article: https://alistair.cockburn.us/hexagonal-architecture
- Domain analysis / bounded contexts (Microsoft): https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis
- Architectural design principles (Microsoft): https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/
- NestJS modules and providers: https://docs.nestjs.com/modules ; https://docs.nestjs.com/providers
- NestJS tests: https://docs.nestjs.com/fundamentals/testing

## Frontend, discoverability and accessibility
- Next.js 15 App Router data security: https://nextjs.org/docs/15/app/guides/data-security
- Next.js 15 internationalization: https://nextjs.org/docs/15/app/guides/internationalization
- Next.js metadata and Open Graph: https://nextjs.org/docs/15/app/getting-started/metadata-and-og-images
- Next.js sitemap conventions: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- Web Content Accessibility Guidelines 2.2 (W3C): https://www.w3.org/TR/WCAG22/

## Security, persistence and operations
- OWASP ASVS v5: https://owasp.org/www-project-application-security-verification-standard/
- OWASP Top 10:2025: https://top10.owasp.org/2025/
- NestJS guards: https://docs.nestjs.com/guards
- Prisma 6 Client reference and concurrency: https://docs.prisma.io/docs/orm/v6/reference/prisma-client-reference
- GitHub Actions workflow syntax: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- GitHub custom agent instructions: https://docs.github.com/en/copilot/concepts/prompting-and-context/custom-instructions

## License and domain-specific references
- Swiss Ephemeris, licensing and technical documentation: https://www.astro.com/swisseph/sweph_e.htm
- Rider–Waite–Smith image provenance currently documented in `docs/tarot-v2.md`; upstream pinned file source: https://github.com/mixvlad/TarotCards/tree/840b84d012c6b74dc1634fa2d00d1b21f5b28093/tarot/rider-waite/720px

## Source-of-truth caveat
These resources inform design; they do not certify compliance. Review licenses, official upstream docs, and version-specific guidance whenever executing deployment/payment/security changes. Repo-specific behavior is indexed in `PROJECT_MAP.yaml`.
