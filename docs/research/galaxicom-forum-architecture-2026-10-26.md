# GalaxiCom — Forum architecture and competitor research, 26 October 2026
Status: RESEARCH AND ROADMAP ONLY. Do not claim forum implementation or activate unmoderated posting.

## Goal
GalaxiCom becomes a native public thematic community for Jyotish, Tarot, Yoga/Practices, Vedic philosophy, personal experiences, questions to verified experts and Galaxiora support. Bilingual UK/EN, one Galaxiora account. Anonymous readers permitted; publishing requires signed-in account. Real members, never invented activity or automatic AI replies.

## Competitor insights and official manuals
- Discourse: categories, trust levels, flags and review queue. Trust 0-4 is a *forum reputation*, not Galaxiora MEMBER/ADMIN role. https://meta.discourse.org/t/discourse-trust-levels-a-detailed-explanation/396792 and https://meta.discourse.org/t/discourse-moderation-guide-part-3-managing-content/406266 ; API/OpenAPI https://docs.discourse.org/
- Reddit: topical communities, flair, pin/lock, moderation permissions/queues. https://support.reddithelp.com/hc/en-us/articles/15484498369428-User-Management-moderators-and-permissions and https://support.reddithelp.com/hc/en-us/articles/15484284113172-What-mods-can-do
- NodeBB: realtime, notifications, REST, plugins; realtime is optional and adds operations. https://docs.nodebb.org/
- Flarum: lightweight discussion UX, group permissions and separate audit controls. https://docs.flarum.org/extend/permissions/ ; https://docs.flarum.org/extensions/audit/
- Security implementation manuals: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html ; https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html ; https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html ; https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
- Technologies: https://docs.nestjs.com/security/authentication ; https://www.prisma.io/docs/orm/prisma-client/queries/transactions ; https://nextjs.org/docs/app
These official documents are source references, not licensed for wholesale republishing. No separate Discourse/NodeBB server or duplicate login.

## Key differentiators
- User-generated spiritual discussions never become sources of scientific/astronomical facts or automatically enter GalaxiNews.
- Expert badges require existing independently verified EXPERT role, not PREMIUM subscription.
- Private natal charts, Tarot questions, journal content and birth details never flow into public posts by default.
- Contextual *opt-in* links from Academy lessons and published Biblioteca articles into relevant Com threads; never create a discussion in someone's name.
- Open meaningful debates with respectful community moderation, not fabricated engagement/streaks.

## MVP user experience
Hub /{locale}/com with category chips, newest / active / unanswered, transparent rules, search and New Topic button. Category pages with pinned topics. Threads with original post, paginated replies, author display, edit/delete for author (with edit history), report action, follow/unfollow. Public profile shows only user-chosen pseudonym and contributions. SUPPORT triages reports, ADMIN resolves/locks/hides/pins; human-readable reasons and immutable audit.
Recommended first categories: Джйотіш, Таро, Практики, Ведична традиція, Запитання до експертів, Досвід спільноти, Підтримка Galaxiora. Configuration in CMS/admin without schema changes for every new category. Guest read, member writes. New account's initial contribution may go to review to prevent spam; moderators should not be overwhelmed.

## Native implementation (modular monolith)
Frontend Next.js 15 + React 19 under /uk/com and /en/com; NestJS API /api/v1/com; existing Prisma/Postgres, shared session. Extract domain/application/repository boundaries incrementally.
Schema: ComCategory(id,slug,translations,status,order), ComThread(id,categoryId,authorId,slug,title,body,status,pinned,locked,createdAt,updatedAt,lastActivityAt), ComPost(id,threadId,parentId?,authorId,body,status,createdAt,updatedAt,deletedAt), ComPostRevision, ComReaction(unique userId+postId), ComFollow(unique userId+threadId), ComReport(unique reporter+target+reason, status, timestamps), ComModerationAction(immutable actor/target/action/reason), ComUserRestriction.
Use unique FKs, transactional thread+first-post creation, cursor pagination by createdAt/id, server-side owner checks, safe text/restricted Markdown without raw HTML, 401/403/404 correct semantics. Render user links rel=nofollow ugc noopener. No file uploads/iframes/injected embeds in MVP.
Bans/mutes never depend only on UI. Server validates session, same-origin, size, spam URL patterns, duplicates and rate limits (single-instance MVP; PostgreSQL/Redis limiter before scale). No automatic birth chart extraction; warn about exposing personal information.
Discoverability via SSR, canonical slugs, hreflang, noindex hidden/deleted; follow updates as in-app notifications only. Realtime websockets, direct messages, paid expert marketplace and media upload deferred.

## Roadmap / verifiable gates
C0 Foundations: community rules UA/EN; permissions/privacy & retention contract; schema, migrations, seed categories, admin policy, threat model. PASS: no migration/data loss, 2-user owner isolation and role matrix tests.
C1 Forum MVP: public categories/threads/replies, search/pagination, posting/edit, reports and admin moderation, responsive accessible UA/EN UI. PASS: guest reads but cannot post, member A cannot edit B, queued/hidden threads invisible, XSS/CSRF tests, DB persistence/restart, 360px+Chromium.
C2 Participation: helpful votes, follow notifications, pseudonymous profiles, author edit history, duplicate-post warnings and limits. PASS: idempotent votes and concurrency, private notices and account isolation.
C3 Cross-module connections: editorial approval for Academy/Biblioteca links, transparent provenance for discussions, expert answer labels, search tuning. PASS: no private natal/journal spill or fake expert badges.
C4 Hardening: mod queue/audit/appeals/restrictions, shared-rate limiting, export/delete/retention, backup/restore, anti-spam, verified load+SEO, publisher/legal/community rules. PASS: measured performance, complete access control tests + real browser acceptance.
C5 Optional: images after security/licensing review, realtime notifications if demand, private groups and chat.

## Concrete API sketch
GET /api/v1/com/categories; GET /threads?category=&sort=&cursor=; GET /threads/:id; GET /threads/:id/posts; GET /search?q=
POST /threads; POST /threads/:id/posts; PATCH /threads/:id; PATCH /posts/:id; POST /posts/:id/report; POST /threads/:id/follow; DELETE /threads/:id/follow
GET /com/mod/queue; POST /com/mod/reports/:id/decision; PATCH /com/mod/threads/:id/status
Every write authenticated, ownership checked on backend, DTO limits, CSRF and audit.

## Product signoff requested after roadmap
Choose initial categories, whether guest posting is forbidden (recommended), new-user review threshold, pseudonym/profile rules, expert verification process and moderators. No payment dependency. Definition of DONE: one real account can post/reply/follow; another can report; moderator resolves; all survive restart and are isolated, accessible and tested.
