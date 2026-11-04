# GalaxiNews World v1.6: client/server revision mismatch recovery

## Reproduced evidence
- Screenshot: UI visibly includes old texts "Перевірка джерел приблизно кожні 15 хвилин", "Астрономічні матеріали не змішуються...", standalone Astronomy chip, and no search/count.
- User's Git log: branch fix/jqa3-windows-and-llm-recovery at 4eb910e; Next.js /uk/news GET 200; Nest API healthy; Prisma migrations applied.
- User's news:doctor: CURRENT v1.5; 110 published, 0 untranslated headlines, 11 missing UA teasers, 92 without image; source states ok 15/empty 1/error 11/cooldown 12.
- Actual GitHub NewsWorld.tsx v1.5 **does not contain** either unwanted string; it has a search input adjacent to "Для мене", twelve interest chips and a published article counter. Therefore the screenshot does NOT depict the current component's React UI, regardless of any "200 OK" HTML response. The exact browser-side cause is unproven (other origin, stale client chunk, tab/back-forward cache or previous JS state). A single positive marker in the server HTML did not establish client hydration.
- The backend has genuine separate source problems (GDELT HTTP 429; several RSS fetch errors); those affect feed freshness, not whether search and tags exist in the UI. Do not conflate.

## Remediation implemented
1. World v1.6: clearly marked current UI; compact search by "Для мене", live total, twelve unified chips, no operational 15-minute message, NO large browser-only text beside tag title. Original celestial design maintained.
2. Tests now inspect DOM *after browser hydration*, not just a marker in server HTML. Assert 12 grouped tags, no old text, visible search and count; server response includes X-Galaxiora-News-Revision world-v1.6.
3. On \`npm run dev:full\` after Git SHA changes, generated \`apps/web/.next\` cache is safely refreshed before starting Next (after confirming no old server occupies port 3000/4000). It only touches generated cache, never user accounts, Prisma tables, books, local storage, or \`.env\`. A revision marker inside \`.next\` avoids needless repeated cleanup.
4. \`npm run news:doctor\` probes local IPv4 Next first, then localhost; demands search/count/tags and absence of old strings; prints Git branch/SHA and detailed source scan health. **It still only verifies server HTML.**
5. \`npm run news:verify-ui\` opens an independent headless Chrome/Chromium context and examines actual visible DOM including search dimensions, tag count and obsolete text. If installed Chrome cannot be launched, follow CLI advice to install Chromium via Playwright. This independently confirms what the new local server renders, not the state of the user's prior existing browser tab.
6. No external RSS or publisher bypass is attempted. Source health diagnostics distinguish successful scans vs 429/network errors and cooldown.

## Safe local steps, in order (Windows / PowerShell)
First close old Next/Nest terminals using Ctrl+C. Ensure Docker Desktop is running.
\`\`\`powershell
cd C:\Users\Note\jyotish-studio-git
git status --short
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm run dev:full
\`\`\`
Wait for Next.js Ready and /uk/news 200.
In **a second PowerShell window**:
\`\`\`powershell
cd C:\Users\Note\jyotish-studio-git
npm run news:doctor
npm run news:verify-ui
\`\`\`
Then open this **exact URL in a NEW Chrome Incognito window** to isolate previously installed service workers and cached assets:
\`http://127.0.0.1:3000/uk/news?check=v1.6\`
It must have a search next to "Для мене", 12 chips in one cloud (Astronomy included), a published article total, and no older copy. Compare the FULL address with what was open before (localhost vs 127.0.0.1 vs an ngrok domain are distinct origins).
If browser verification PASS but an older already-open tab still displays the obsolete UI, inspect the tab in Chrome DevTools: Application > Service Workers and Cache Storage (do not indiscriminately clear user storage; guest interest selections may reside there). A hard refresh on the exact fresh-origin URL is safer first.

## Acceptance criteria
- 4/4 CI: unit/build, PostgreSQL, Windows JHora, Chromium E2E.
- Browser verifier PASS for World v1.6: search visible and in tabs; 12 tags; published count; no obsolete copy.
- User explicitly sees same changes on actual browser URL.
- 429 GDELT and publisher permissions tracked separately; do not claim live source recovery without source scan results.

References: Next.js 15 architecture/fast-refresh, Next.js 15 caching guide and React hydration troubleshooting.
