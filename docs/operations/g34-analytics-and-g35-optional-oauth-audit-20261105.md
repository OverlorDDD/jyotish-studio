# Galaxiora G3.4 audit + G3.5 optional social sign-in (2026-11-05)

## Current main audit — **do not duplicate the analytics dashboard**
- PR #127 already merged a single centered `AdminAnalyticsPanel` within `AdminDashboard` (not a second analytics page).
- This first-party dashboard uses the existing admin-only `GET /api/v1/admin/traffic/visitor-analytics?days=7|30` and admin GA4 realtime endpoint, and separates:
  - public HTML document request candidates, **not people or sessions**;
  - server-side successful Jyotish / Tarot / Panchanga API operations (includes automatic Panchanga requests);
  - approximate, coarse source-classified request counts, which do not increase total traffic;
  - Google Analytics 4 as an optional, consent-based **separate** signal.
- The admin overview retains distinct account, chart, subscription, order, and AI statistics. **Do not** repeat them as anonymous visitor metrics.
- UI: 1100px centered dark-galaxy container, 7/30-day toggle, four count cards, daily bar chart, top sections, coarse channels, compact GA4 status, bilingual and responsive styles.
- Privacy: no per-visitor records, persistent identifiers, birth details, raw referral URLs or full query strings in the aggregate table. Existing staff auth remains required.
- All users can still calculate public natal, Panchanga and Tarot data as a **guest**. `GlobalAccount` explicitly offers `Continue as guest` / `Продовжити без акаунта`. Do not add automatic login prompts, overlays, or authentication gates.
- Attribution caveat: channels are based on browser-provided Referer or a **fixed UTM allowlist**; they do not prove a real search click, successful human conversion, or unique visitor. Older request rows predate the classifier and are represented as unattributed historic traffic.
- The G3.4 main merge initially had a mobile-browser CI failure: the G3 funnel test assumed that **all** background analytics events stop while a synthetic public-tool event is delivered. Fixed in this PR by counting only the `public_tool_started` event and keeping checks against wrong-tool spoofing, leaked data, and extra matching starts.

## Optional social sign-in — product decision and security prerequisites

**First provider: Google OpenID Connect. Apple: second provider only after Apple Developer setup.** Do not display nonfunctional buttons. No auth provider changes or credentials are shipped in G3.4.

### Why no premature live social login

Current account storage is `User(email UNIQUE, passwordHash required, role, plan, user-owned charts and personal data)`. Current session is a short HMAC-signed first-party HttpOnly cookie. Adding a provider button without a verified OAuth/OIDC callback and dedicated provider-user mapping risks account takeover. The currently connected **Search Console service account is not** an OAuth login client; never reuse its private key.

### G3.5 Google implementation contract

1. Owner creates a **separate Google OAuth 2.0 Web application client** for Galaxiora and configures the exact HTTPS redirect URI, consent-screen brand and allowed scopes `openid email profile`. Keep client secret and OAuth state material exclusively in server environment; never in git or browser bundles.
2. Use a maintained, audited OpenID Connect client library. Implement **authorization-code + PKCE** with state, nonce, HTTPS callback, token and claim validation (`iss`, `aud`, `exp`, nonce, signature, email_verified). Bind the provider by stable **Google `sub`**, not email.
3. Schema: separate `ExternalIdentity(provider, providerSubject UNIQUE per provider, userId)`, encrypted/limited credentials only if needed, and explicit linking/recovery actions. Do not replace local password security with a fake hash that accidentally enables password login.
4. On an email match to an existing local Galaxiora user, **do not automatically link**. Require signing in with the existing password (or a verified existing-account recovery method) and then explicit account linking. Preserve owner-admin role, subscriptions, saved charts and journal records.
5. Existing verified Google identity may sign in directly, yielding the existing `jyotish_session` HttpOnly/Secure/SameSite cookie. New identity may create only a default MEMBER account. Never grant ADMIN or copy third-party roles.
6. Provider auth is **initiated only when a visitor presses the optional button** in the existing account dialog; no auto-popup/One Tap. Guest calculators, SEO pages, consent settings and anonymous analytics remain unchanged.
7. Test replayed/expired state, swapped tokens, forged email, incorrect audience, unverified email, callback CSRF, missing config, double accounts, linking, log redaction and guest navigation in desktop/mobile CI. Deploy only when verified production callback works end to end.
8. Failure/config-missing state must hide provider buttons and leave email + password/email verification and guest mode fully functional. No background account creation.

### Apple sign-in decision

Apple's web sign-in requires Apple Developer-account Services ID, association with an existing App ID, domain and return-URL registration, and private signing key. It also may provide a private relay address; account identity must bind on Apple `sub`, not relay email. Apple announced new `private.icloud.com` relay addresses beginning in 2026; mail-domain allowlists must be compatible. Without these owner-controlled resources, do not fabricate a working Apple button.

Official provider setup:
- Google: https://developers.google.com/identity/openid-connect/openid-connect
- Google ID token and linking security: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
- Apple: https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple
- Apple email relay 2026: https://developer.apple.com/news/?id=1ptvdtcm

## Release boundary
This PR is strictly a CI repair and documentation. PR #127's first-party dashboard itself is already in main; main had a failed mobile Chromium check and should **not** be treated as production-ready until fixed and same-SHA CI has passed. No AWS deployment, publishing, paid campaigns, database migrations or OAuth credentials are performed by this audit.
