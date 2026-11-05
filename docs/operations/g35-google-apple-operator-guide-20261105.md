# G3.5 — Optional Google + Apple sign-in, operator setup, and guarded production release
2026-11-05 · bilingual Galaxiora · no guest auth gate

## What is already implemented in source
- First-party G3.4 Analytics panel is **already in main**: the single centered ADMIN view separates 7/30-day anonymous page requests, approximate source buckets, API operations, and consent-based GA4.
- Optional **Google** authorization code + PKCE/state/nonce, server-side OIDC ID-token signature/issuer/audience/expiry verification. Scope \`openid email profile\`. No Search Console service account used.
- Optional **Apple** authorization code with \`response_mode=form_post\`, CSRF state cookie \`SameSite=None; Secure\`, nonce, server-generated short-lived ES256 Apple client-secret JWT, and verified Apple RSA ID token. Scope \`email\`.
- New \`ExternalIdentity(provider, subject, userId)\` with DB unique constraint, optional \`User.passwordHash\` for social-only users. Existing passwords, email verification, session cookie, roles, subscriptions, charts, profiles and journals remain in place.
- No email-only account linking. Existing email owners must sign in with their password and choose **Link Google / Link Apple** inside their own account dialog. Conflicts return a safe message; a social ID can never be assigned to two users.
- Public Jyotish/Panchanga/Tarot are still fully usable as a guest. Provider buttons appear **only if the server is correctly configured**. No auto-login, One Tap, social tracker SDK, account-creation popup or marketing emails.
- OAuth error responses contain only allowlisted codes, never provider tokens or birth information.

## 1. Google Cloud owner configuration
Create a **new** OAuth 2.0 client, **not the existing Search Console service account**.
1. Google Cloud Console → Google Auth Platform → Branding/Audience. Choose appropriate external audience and publish according to Google requirements; add Galaxiora's domain and support/privacy URLs. Minimum scopes: \`openid email profile\`.
2. Clients → Create client → **Web application**. Use:
   - Authorized JavaScript origin: \`https://galaxiora.com\`
   - Authorized redirect URI **exactly**: \`https://galaxiora.com/api/v1/account/oauth/google/callback\`
3. Keep the new Client ID and Client secret private. Never put these in GitHub, a screenshot, or this chat.

## 2. Apple Developer owner configuration
Apple web sign-in is not the same as a free Apple ID. It requires developer program access and a primary Sign in with Apple-enabled App ID.
1. Apple Developer → Certificates, Identifiers & Profiles. Configure a primary App ID with Sign in with Apple capability.
2. Create a Services ID for Galaxiora, register the \`galaxiora.com\` domain and exact Return URL:
   \`https://galaxiora.com/api/v1/account/oauth/apple/callback\`
   Follow Apple's domain ownership verification process if requested.
3. Create a Sign in with Apple private key. Keep the downloaded **.p8** on the server in a private root/ubuntu-readable folder, permissions 600. Note your **Team ID**, **Key ID**, **Services ID**. The private key is used only on the API server to generate short-lived ES256 JWT client secrets.
4. Apple may provide a private-relay email; do not attempt to identify the person from email across providers. Login identity is based on verified Apple \`sub\`.

## 3. Server environment (never commit secrets)
On EC2, in \`/opt/galaxiora/app/.env\` (owned by the operator), add only the providers you have configured. Do not replace the existing \`AUTH_SECRET\`, \`DATABASE_URL\`, mail keys or other settings:

\`\`\`dotenv
OAUTH_PUBLIC_ORIGIN=https://galaxiora.com
GOOGLE_OAUTH_CLIENT_ID=<new Google Web OAuth Client ID>
GOOGLE_OAUTH_CLIENT_SECRET=<new Google Web OAuth Client secret>
# Optional Apple, only when developer setup is complete:
APPLE_OAUTH_SERVICE_ID=<your Services ID>
APPLE_OAUTH_TEAM_ID=<Apple Team ID>
APPLE_OAUTH_KEY_ID=<Apple Key ID>
APPLE_OAUTH_PRIVATE_KEY_FILE=/home/ubuntu/.galaxiora-private/AuthKey_XXXXXX.p8
\`\`\`

A provider without all settings remains **hidden**, not broken. The Apple signing file must not live under \`/opt/galaxiora/app\` or any publicly served directory.

## 4. Deployment gate and rollback
Release script: \`tools/g35-aws-release.sh\` on the **reviewed merged main SHA**.

Preflight must:
- reject changed remote main SHA, unreviewed Natal N4 or any other unrelated diff;
- reject unsafe tracked/untracked EC2 collisions;
- ensure all required exact-SHA GitHub jobs are successful;
- verify current production services, SEO env, auth secret, PG client and migration history;
- never execute Docker, destructive reset, stash or git clean.

Deploy only with \`G35_DEPLOY_APPROVAL=I_APPROVE_G35_PRODUCTION\`. It creates timestamped backup files (\`.env\`, untracked inventory, Next build, SQL custom-format database dump with mode 600); installs Node dependencies, generates Prisma client, runs **one preapproved additive migration** via \`npm run db:migrate\`, runs server/auth/privacy checks, builds, verifies approved galaxy icon #6, restarts \`galaxiora-api\` then \`galaxiora-web\`, checks pages and admin auth restriction.

On failure after code switch, attempts **code-only rollback** to saved SHA and Next build, restarting both services. The additive database migration is **not automatically reversed**; restoring an older database snapshot over later production writes could destroy data. Retain the backup and investigate. Manual rollback: \`G35_ROLLBACK_APPROVAL=I_APPROVE_CODE_ONLY_ROLLBACK bash tools/g35-aws-release.sh rollback TARGET_SHA BACKUP_DIR\`.

**Do not deploy from a PR SHA.** Use the exact reviewed and merged main SHA, after post-merge checks are green. No production credentials are available to the GitHub connector, so the operator executes via their SSH key.

## 5. Production acceptance
1. Open \`https://galaxiora.com/uk\` and \`/en\` in incognito: no analytics consent overlay and no forced account modal. Guest calculators must still work.
2. Open \`https://galaxiora.com/uk/admin\` as ADMIN: one centered 7/30d analytics view, daily totals, section ranking, coarse traffic channels and a separate GA4 area with no duplicate figures. Historical sources may be unknown.
3. Anonymous \`GET /api/v1/account/oauth/providers\` returns \`google\`/\`apple\` booleans; no client secret, key, personal data, tokens or user IDs.
4. With a Google Web client installed, the account dialog shows **Continue with Google**. Complete a real sign-in using a **new test email**, then verify \`/api/v1/account/me\` and saved-chart ownership. Verify email/password login still works for existing users.
5. For an **existing** email/password account, Google sign-in without linking must show \`existing_email\` and **never** silently merge; log in with password → Link Google, then Google sign-in should reach the same user ID.
6. With Apple Developer settings installed, test real Apple form_post login (including private relay email), link/unlink policy, cancellation, invalid nonce/state and UI on mobile. Apple button must remain hidden until configured.
7. No ID-token, OAuth code, provider secret or natal data in browser query logs, server HTTP-access logs or GA4 payloads.
8. Only after a live Google/Apple callback succeeds may the provider be described as **production verified**. CI alone cannot verify external provider configuration.

Official references:
- Google OIDC: https://developers.google.com/identity/openid-connect/openid-connect
- Apple setup: https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple
- Apple form_post: https://developer.apple.com/documentation/signinwithapple/incorporating-sign-in-with-apple-into-other-platforms
