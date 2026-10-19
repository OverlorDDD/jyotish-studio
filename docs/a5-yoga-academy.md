# A5 — Galaxiora Yoga + Academy (2026-10-19)

## Delivered behavior
- Yoga: four bilingual original sessions (4–7 minutes), each 4–6 individually timed instructional steps, alternatives and explicit safety precautions. Session player supports start/pause, step navigation, optional no-timer mode, repeat, finish and a simple progress indicator. It **never autoadvances** a step; no audio or external images required.
- Academy: seven full bilingual educational lessons, grouped into three topics (Jyotish ×3, Tarot ×2, Yoga/Mindfulness ×2). Each has 3 headings ×2 paragraphs, 3 key takeaways, one multiple-choice question with explanation/retry and related module link. Subject boundaries clearly separate calculations from symbolic interpretations.
- Frontend: real hubs `/{locale}/yoga` and `/{locale}/learn`, individual stable URLs `/{locale}/yoga/{slug}` and `/{locale}/learn/{slug}`, locale switch retains the current slug.
- SEO: sitemap enumerates only published lessons and sessions in both languages; indexable metadata and paired hreflang URLs when stable HTTPS site origin is set. News/Community and private pages remain noindex.
- Accessible interaction: keyboard-native buttons/inputs, visible focus, named progress/timer, optional time-free mode and non-autoadvancing step control. No mandatory registration.
- Architecture: read-only original editorial content in app library modules; interactive state isolated in client components, server components render hubs/static lesson text. No changes to Prisma schema, Nest API, Jyotish or Tarot quota.
- Tests: `npm run test:content:a5` for content integrity + Playwright desktop/mobile flows for hubs, steps, language, quizzes, SEO and 360px. Existing A1–A4 checks remain enabled.

## Safety and editorial policy
These exercises are educational and adaptable, not medical treatment or diagnosis. Instructions specifically avoid forceful breathing or advanced inversions; pause/stop if dizzy, in pain or distressed. Users with injuries, pregnancy or relevant limitations should seek individualized advice.

All lesson copy is authored for this project, without copied articles or unlicensed photography. Reference reading: NIH NCCIH https://www.nccih.nih.gov/health/yoga-effectiveness-and-safety ; MedlinePlus https://medlineplus.gov/ency/patientinstructions/000876.htm ; WCAG 2.2 https://www.w3.org/TR/WCAG22/

## Deferred (not claimed implemented)
CMS/editor roles/approval workflow, user completion persistence, video/audio classes, reminders, personalized yoga plans or medical recommendations, full WCAG conformance audit. Editorial updates are versioned in Git until a reviewed content CMS stage.

## Windows acceptance
Use `docs/galaxiora-windows-runbook.md`. Start Docker Desktop, `docker compose up -d db`, pull `main`, `npm install`, `npm run db:generate`, `npm run db:migrate`, `npm run test:all`, `npm run build`, `npm run dev:full`.
Then explore both hubs, all detail routes, Yoga step/pause/untimed/finish, Academy answer/retry, language retention and mobile viewport. Existing accounts and history must remain intact.
