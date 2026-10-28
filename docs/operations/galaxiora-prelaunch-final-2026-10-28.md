# Galaxiora 2026-10-28 final prelaunch QA: GalaxiNews / Panchanga / Glossary / human Tarot

Working branch: `fix/jqa3-windows-and-llm-recovery`. This document records implemented changes; **GitHub commits are not a substitute for a successful local Windows production build and browser acceptance.**

## Implemented

- Article-specific original vector editorial covers, rather than one topic-wide placeholder; visible first while remote photo loads. Repeated licensed photo URLs on the same news page are suppressed in favor of unique original art. Personal News preview uses the same progressive method.
- Wikimedia Commons queries vary per article and skip photos already assigned to other articles. Reusable media requires explicit author/source and CC0, CC BY or CC BY-SA rights with a canonical license URL. No unlicensed publisher images, no false claims that a topic illustration depicts an event. Remote access and number of real photos remain a **live dependency**. Do not run the `--retry` forced batch repeatedly.
- Panchanga event descriptions for measured sidereal sign ingresses and stations use actual planet and sign; no generic same paragraph for all events. The numerical event engine remains untouched. When the *same* astronomical event appears in overlapping 7-day windows its details correctly remain identical.
- "Місячний місяць" renamed "Місяць за ведичним календарем".
- Shared glossary expanded by 35 UA/EN entries and applied to dynamically displayed text in Panchanga, Vedic Calendar, Astronomical Events, Personal Panchanga, News and Horoscope; existing Tarot and editorial articles already use the same `GlossaryText`. Hover, keyboard focus and tap/focus tooltips. Future content routed through these renderers inherits automatic recognition; do not claim support for every arbitrary unwrapped React node.
- Logged-in users can submit a private Tarot question to the Galaxiora administrator without payment using an explicit share consent checkbox. Existing owner-only private question drafts remain private. The new submission is persisted with `TarotQuestion.expertSubmittedAt`; admin can review it and mark it read, with unread count polled every 45s in the header and admin dashboard. Link to `https://t.me/Galaxiora` is shown only **after** confirmed successful saving. No Telegram bot, transmission to channel, expert acceptance, guaranteed reply or payment is connected.

## Safe Windows setup and validation

1. Stop both Nest and Next terminals with Ctrl+C. Keep Docker volumes and existing root `.env`.
2. Run from PowerShell:

```powershell
cd "C:\Users\Note\jyotish-studio-git"
git status --short
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm install --no-audit --no-fund
npm run test:prelaunch-experts
npm run test:glossary
npm run test:news-open-media
npm run test:vedic-calendar
npm run test:bootstrap
npm run build
```

3. Start Docker Desktop, verify `docker info`, and in the first terminal run:

```powershell
npm run dev:full
```

The safe bootstrap keeps the existing PostgreSQL volume; `db:generate` and `db:migrate` run automatically. Verify the new migration `20261028165000_tarot_expert_inquiries` is applied before testing the inquiry flow. Never use `docker compose down -v`, `prisma migrate reset` or `db push --force-reset`.

4. In a second terminal:

```powershell
npm run site:check
npm run launch:verify
npm run news:doctor
npm run news:verify-ui
```

A local preview without a production domain should remain `SITE_NOINDEX=1` with `PRIVATE/NOINDEX PREVIEW` and no real domain. `site:check` must PASS independently; 13 PASS from `launch:verify` does not certify private route access.

5. Browser: `http://127.0.0.1:3000/uk/news` in a clean private window. Confirm every visible article card displays a loaded, distinct cover (either a licensed photograph with author/license or a Galaxiora editorial illustration); do not count unique illustrations as real source photographs. Inspect the Personal News preview and the Ukrainian/English pages. Validate hover/focus on "Тітхі", "Санкранті", "Накшатра", "Чандрабала", "Ретроградність" in Panchanga and related pages. On `/uk/panchanga`, select dates/places with distinct planetary ingress and check planet/sign-specific wording, month label and computed times.
6. Tarot acceptance with **two separate accounts**:
   - As normal signed-in user open `/uk/tarot#human-readings`. Check no Telegram link is shown before submission. Complete topic, question 12-600 characters, context 20-2000, optional timeframe and explicit consent. Submit and confirm success and the new `https://t.me/Galaxiora` link.
   - As ADMIN, verify header notification shows a count (allow up to 45 seconds), open `/uk/admin`, read only opt-in submitted questions, mark reviewed, count drops. Verify an unrelated account gets HTTP 403 or 401 for `/api/v1/admin/expert-requests`. Review saved private questions from before this feature: they must **not** appear in the admin inbox.
   - Check `/uk/account` lists the saved question and permits owner deletion; after deletion admin must not see it. No payment or Telegram auto-forward occurs.
7. Run complete suite `npm run test:all` and numeric gate `npm run jqa3:certify` before claiming final release certified.

## Still required before a **real public** launch

- Production HTTPS domain, environment secrets, CORS / proxy / noindex switching, real external access tests and backups / restore test.
- RSS source reliability, translation coverage and visual quality of the licensed-photo corpus: Wikimedia may be inaccessible or rate-limited, and a first-party illustration is a distinct content type, not a real photo.
- Human response operations: clear service expectations, privacy notice, abuse/moderation rules, handling of emails/questions, and deletion. No financial or bot integrations are active.
- Full independent longitude/date quality certification (JQA3); numeric and historical reference checks must be green. Never claim sub-arcsecond 20/20 precision from 600/600 D1/D9/D10 sign parity alone.
