# AstraNira — Stage 1 (working brand, 2026-10-18)

## Delivered
- AstraNira is a provisional international brand with the descriptor “Astrology, Tarot & Mindful Living”.
- English homepage on / and /en, Ukrainian homepage on /uk. Root still returns HTTP 200 for existing smoke checks.
- Category pages: /{locale}/astrology, /tarot, /experts, /yoga, /learn.
- Existing functional Jyotish studio remains at /{locale}/astrology/jyotish, including the original calculations, detailed report, authentication and private chart history.
- Visuals are CSS-based celestial shapes; the new portal doesn't depend on third-party photos or image placeholders.
- Expert-reading question preparation works entirely in browser state; it previews/copies text but never sends it or accepts payments.

## Brand research and SEO
The name is NOT trademark-cleared or domain-reserved. Quick searches found direct overlap for proposed alternatives Astraloom, AuraLoom and Lunarcana. AstraNira needs formal brand/domain checks in WIPO, EUIPO, USPTO, national registries and domain registrars before confirmation.

Google recommends concise consistent site names and WebSite structured data, rather than stuffing a name with keywords:
https://developers.google.com/search/docs/appearance/site-names

We generate locale-specific page titles, meta descriptions, canonical and hreflang links. WebSite JSON-LD activates only with a real HTTPS NEXT_PUBLIC_SITE_URL; production launch must also configure sitemap, robots, Search Console, proper localized HTML lang, domain and assets. Do not configure a temporary tunnel URL as permanent site origin.

## Expert video reading criteria
The user sees good and bad question examples. Required fields: open-ended question (12+ chars), useful context (20+ chars). Optional: nickname, topic, timeframe, intended takeaway. Date of birth is NOT necessary for a tarot reading. No legal name, address, ID, payment card numbers or third-party private details should be requested.

Before real orders: authenticated order API, statuses and cancellation policy; expert vetting/roles, specific deadlines, moderation, review policy; payment eligibility verification for tarot services and registered business jurisdiction; webhooks and refunds; secure video storage with expiring links; consent/retention/deletion; fraud control; privacy and terms. Do not fake booking or payment availability.

## Manual regression checklist
1. Pull the branch (or main after merge), npm install, npm run test:all, npm run build and npm run test:swagger.
2. Start Docker + migrations + npm run dev:full with existing README instructions.
3. Open /, /en and /uk; verify navigation, working local language links, responsiveness at 375/768/1440px, no broken images or horizontal overflow.
4. Open /en/astrology/jyotish and /uk/astrology/jyotish; test D1/D9/D10, reports, account save/reopen/delete, anonymous chart-history restriction and API health.
5. Open /en/experts; try poor questions, empty context, valid question/context; test preview, copy and clear. Confirm browser network sends NO reading-brief text.
6. Open EN/UK tarot, yoga and learn; make sure features labeled in development do NOT pretend to generate readings or accept orders.
7. Verify guest root 200, private history API 401, docs endpoint 404 through public site, noindex preview header if SITE_NOINDEX=1.
8. Before public commercial launch, resolve Swiss Ephemeris license, domain rights and payment-provider policy approval.

## Compatibility
Repo name, package/workspace identifiers, API and PostgreSQL schema are unchanged. Legacy UI tests are retargeted to its relocated page. Existing opspilot shared-launch scripts/ports and API proxy are untouched.
