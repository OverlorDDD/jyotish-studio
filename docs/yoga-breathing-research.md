# Corrective Yoga v2 — research and engineering choices

## Problem
A5 UI treated 30/90/90/30 seconds as reading prompts, not timed breathing. It allowed skipping to a congratulatory completion without actually breathing. The control model confused users and the displayed “inhale 90 seconds” could be interpreted dangerously.

## Benchmarks reviewed, 19 October 2026
- Headspace box breathing: visual box guides equal duration four-part cycle; https://www.headspace.com/content/mindful-activity/box-breathing/5647
- Breathwrk: phase-based visual cues and adjustable session structure; https://www.breathwrk.com/ and https://play.google.com/store/apps/details?id=com.breathwrk.android
- Awesome Breathing: visible pacing, predefined techniques and optional holds; https://awesomebreathing.com/
- NHS Guy's and St Thomas' abdominal breathing: hand on chest/abdomen, diaphragm moves as abdomen gently expands; https://www.guysandstthomas.nhs.uk/health-information/abdominal-breathing
- Cambridge University Hospitals breathing explanations: belly expansion under a resting hand and relaxed upper chest; https://www.cuh.nhs.uk/patient-information/breathing-techniques-to-ease-breathlessness/
- Cleveland Clinic box breathing / diaphragmatic breathing: https://health.clevelandclinic.org/box-breathing-benefits and https://my.clevelandclinic.org/health/treatments/9445-diaphragmatic-breathing

These references inspired principles, **not copied code or illustrations**. Current implementation uses original CSS/SVG and text. No external trackers, media, microphones or paid APIs.

## Architecture decisions
- Pure `apps/web/lib/breathing-patterns.ts` defines phase order, duration/round math and immutable presets; UI controller owns start/pause/stop and animation-frame display.
- Box: inhale 4s, hold with full lungs 4s, exhale 4s, hold after exhale 4s, fifteen cycles (4min). Alternatives: 4s inhale/4s exhale and 3s inhale/5s exhale with **no holds**, each 4min.
- SVG marker travels each square edge during the associated phase. On holds, the center orb expands proportionally to the hold elapsed fraction. Textual labels and seconds remain visible for reduced-motion needs; no rapid flashing or sound.
- Session does **not** start until a user clicks `Поїхали!`; only actual elapsed time reaching all cycles displays completion. Early stop says **session stopped**. Background tab changes automatically pause; paused time does not count.
- Mindfulness and evening reflection prompts have no countdowns, no automatic completion claim; desk mobility is guided manual instructions.
- Content steps under gentle-breath remain brief editorial descriptions (4s phase references), not independent 90s inhale/exhale timers.
- Safety: breathing is gently diaphragmatic, not forced. Breath holds are optional, stop when dizzy or uncomfortable; avoid practice while driving and seek clinical guidance when needed. This is education, not treatment.

## Jyotish loading investigation
Static inspection shows the legacy Jyotish route imports a roughly 21K-character detailed-report component during initial calculator navigation and AccountPortal immediately fetches both session and potentially a large saved-chart history. Next.js dev cold compilation can add first-visit latency. We now defer report rendering with `next/dynamic`, defer saved-history fetch until the account panel is opened, and add a locale-route `loading.tsx` transition fallback.
This is **a code-based hypothesis**, not proof of the sole root cause. Validate using production build plus Playwright navigation metrics, compare cold/warm and dev/prod; if the initial route or POST /api/v1/reports is still slow, profile route JS and Swiss Ephemeris/API separately.

## Manual acceptance
From repo root on Windows PowerShell:
```powershell
npm run test:breathing
npm run test:all
npm run build
npm run dev:full
```
Open `http://localhost:3000/uk/yoga/gentle-breath`: choose box, click `Поїхали!`, verify the 4s 4-phase loop, circle during both holds, real pause/resume, early-stop not completed, and reset. Test equal/extended no holds. Other Yoga sessions have guidance steps without timers. Check the Jyotish cold first load and second load in F12 Network on local development; production performance must be assessed separately.
