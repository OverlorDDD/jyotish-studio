# GalaxiCom usability pass after C1–C5 — 2026-10-27

## Decision / UX principles
Owner screenshots show the old inbox, profile name, safety, saved topics and moderation as competing large boxes, delaying the main discussions. This change uses progressive disclosure as described by Nielsen Norman Group, and accessible labels, status messages and keyboard focus described by W3C WAI. Keep essential actions discoverable and put secondary actions behind explicit controls.

Reference manuals:
- https://www.nngroup.com/articles/progressive-disclosure/
- https://www.nngroup.com/articles/accordions-on-desktop/
- https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
- https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html

## UX behavior
1. Header remains distinct; one compact responsive utility rail now groups inline display-name form, inbox, privacy/safety, optional PREMIUM badge, bookmarked topics and profile options, plus trending discussions. All tools only expand on demand; primary thread listing follows quickly.
2. New topic button opens the actual form (no navigation), moves the viewport to the form heading and focuses it. Respects reduced-motion preferences, labels aria-expanded and aria-controls. Main thread/reply editor length limits remain 1–160/1–8000/1–5000.
3. "Корисно" is highlighted under each **reply**, not thread body; topic screen now explains where and why. The same idempotent server-side helpful-vote implementation is retained. FREE can vote.
4. On published Academy/Yoga lesson pages, ADMIN searches public discussions by human-readable TITLE (minimum 2 characters), selects a result and confirms approval. The underlying IDs remain private implementation identifiers in requests. The existing server authorization, public-only validation, audit and linkage remain unchanged; ordinary visitors just see discussion titles.
5. Appeals for hidden own contributions now use the existing eligible-content dropdown rather than asking authors for raw UUID. Non-eligible user sees a helpful empty state. Server author/moderator verification unchanged.
6. Moderator queue is an explanatory on-demand panel near the top, not an empty standalone text box at the bottom. Clear difference between resolve/dismiss/hide, reason only when needed, links to the actual thread for reports of a reply, and a useful empty state.
7. Personal cards for daily/weekly horoscope and GalaxiNews are placed immediately under Natal / Vimshottari / Gochara foundation. The former news placeholder now links to the EXISTING News section and shows selected topic names (not an invented new personalized feed). Existing Tarot, yoga, journal and lunar calendar remain below.
8. Five topic categories + general conversation: `npm run com:seed -- --email YOUR_ADMIN_EMAIL`. Adds up to 6 explicit ADMIN-authored **starter prompts** in eligible categories: free-form welcome/chat, Jyotish, Tarot, Yoga, Vedic books, and product feedback. No fake members, historical replies, votes or claims of user-generated conversation. Script is idempotent by title; existing posts are not overwritten; missing categories are reported and skipped. With exactly one ADMIN, `npm run com:seed` auto-selects them; multiple ADMINS require explicit email. The assistant has GitHub access but not the user's local PostgreSQL, so this command is the actual data insertion step in that environment.

### Tradeoffs
- Secondary tools need one click to expand, in exchange for shorter initial page.
- Thread search for linking depends on forum-search availability; does not leak drafts, private charts or unreviewed content.
- Original IDs continue in server persistence/logs and may be present in URLs for routing, but are no longer required as user inputs.
- Editorial seed messages come from a real ADMIN; they are genuinely prompts from the site team, not pretend community engagement. Do not seed production without the owner approving the text.
- Changes do NOT loosen roles, forum quotas, paid subscriptions, moderation audit or precise JHora certification.

## Windows execution
```powershell
cd C:\Users\Note\jyotish-studio-git
git status --short
git fetch origin
git switch fix/jqa3-windows-and-llm-recovery
git pull --ff-only origin fix/jqa3-windows-and-llm-recovery
npm install
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run test:com
npm run dev:full
```
Open http://localhost:3000/uk/community and http://localhost:3000/uk/personal.
In a second PowerShell shell, only after choosing the intended ADMIN: `npm run com:seed -- --email YOUR_ADMIN_EMAIL` (or `npm run com:seed` when precisely one ADMIN exists). Refresh the forum. Rerunning is safe: it skips previously inserted titles. It never generates fake member replies.

## Manual acceptance
1. As MEMBER, observe short compact toolbar; change display name directly, open/close inbox, bookmarks, profile, and safety independently; mobile width has no horizontal overflow.
2. Press Create Topic; viewport moves and heading takes keyboard focus; post a short new topic and reply. Verify original maxima and full-width editor.
3. As another MEMBER reply, find highlighted "Корисно" below the response. Vote twice and make sure the count is unchanged after the first vote.
4. As ADMIN, visit published Academy or Yoga lesson, open "Прив’язати обговорення до матеріалу", search by a word in a public topic title, select it, confirm. Check bidirectional link, hidden topic exclusion and audit; ordinary members cannot approve.
5. As user with a hidden own post, open Safety and select from eligible contributions without UUID; submit appeal. Without any hidden contributions, see empty state.
6. As SUPPORT/ADMIN, open moderation queue. Check description, valid reported-topic link, action reason, decision result and meaningful empty state. Do not delete real forum content for demonstration.
7. In My Universe, verify horoscope and news appear above lunar calendar, Tarot and yoga. GalaxiNews link works, and no personal chart data appears in public URLs.
8. With explicit ADMIN-owned seed script, see general/free-talk thread and topic-specific starter threads. No fake testimonials. Change or remove starter topics through existing moderation.
9. Execute Playwright C0–C5/mobile regression and production build. CI success must be based on exact commit SHA, not an earlier run.

## Release caveats
Owner still needs C1–C5 acceptance. Production scheduling/backup, privacy/legal and moderation staffing remain separate. Remaining launch goals: daily-weekly horoscope editorial QA, 20/20 Lagna and Moon ±1 arcsec, full Vimshottari date and jqa3:certify parity, verified lawful Ukrainian personal-consultation payment, then public launch.
