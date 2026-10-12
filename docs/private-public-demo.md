# Stage 5: Private internet demo over ngrok (Windows)

**This is a temporary preview running on your computer, not always-on hosting.** Keep your computer, Docker, both app processes and ngrok running. No new ZIP files; use `git pull` in your existing checkout. Do not publish real birth profiles; the API has no per-user accounts or record-level access control.

## What changed

- Next.js now calls `/api/...` on the **same origin** instead of hardcoding `localhost:4000` in browser JavaScript. A Next.js rewrite proxies `/api/:path*` to NestJS bound to `127.0.0.1:4000` on the hosting PC. An external visitor does not need local port 4000.
- Next.js middleware prompts for HTTP Basic authentication when `DEMO_ACCESS_USER` and `DEMO_ACCESS_PASSWORD` are present. For non-local hostnames without credentials, it returns 503 (fail closed). The password protects a *shared private demo*, not production multi-user data. Use HTTPS ngrok only. Do not set `--host-header=localhost` to disguise incoming hostnames.
- `npm run demo:check` checks an unauthenticated page returns **401** and an authenticated `/api/health` through the Next proxy returns **200, database connected**. It refuses to recommend a tunnel until these checks pass.
- The default AI_MODE=free uses only $0 OpenRouter free routing, optional localhost Ollama and a deterministic local fallback. `demo:check` blocks AI_MODE=paid_openai. See docs/free-ai.md; free provider quotas may still be exhausted.

## Steps

1. In PowerShell: `cd C:\Users\Note\jyotish-studio-git`, `git pull --ff-only origin main`, `npm install`.
2. Open the private **root `.env`** in VS Code. Set `DEMO_ACCESS_USER=viewer` and a **unique, random 14+ character ASCII** password in `DEMO_ACCESS_PASSWORD`. Set `AI_MODE=free` (or `AI_MODE=local` for an entirely offline demo) and `OPENAI_ENABLED=0`. Keep existing `DATABASE_URL` pointing at `localhost:5433`. Do not send the password or `.env` to ChatGPT or GitHub.
3. Ensure Docker Desktop is running and `docker compose up -d --wait db` completes.
4. Build and launch **production-preview mode** (not a development server):

```powershell
npm run test:ai
npm run test:demo
npm run build
npm run start:full
```

5. From a **second** PowerShell in the same folder: `npm run demo:check`. It should report `PASS: Private demo is password-protected...`.
6. Once that succeeds, open a **third** PowerShell and run `ngrok http 3000` (assuming the ngrok CLI is installed and authenticated). Use the HTTPS URL supplied by the program. Do **not** tunnel 4000 or 5433.
7. In a guest browser or phone not on your Wi-Fi, open the ngrok HTTPS URL and enter your demo username/password. Calculate the **fictional 2000-01-01, New Delhi** chart, switch D1/D9/D10 and request the local reading. Test a wrong password gets 401. The browser developer tools should show relative `/api/v1/charts/calculate`, not `localhost:4000`.
8. Stop ngrok when finished. Consider disabling the shared password or changing it after the interview.

## Limits before public production

HTTP Basic over ngrok is acceptable for a **short private demo**, but **not** full user authentication. Public launch requires a real account system, server-side per-record authorization, request throttling at the edge, HTTPS on the deployed origin, policy/retention for birth data, paid-provider quotas, operational monitoring and a permanent backend/database host. There is no guarantee of a permanent ngrok URL or that a PC-hosted preview will be up after the PC sleeps.

If `npm run demo:check` fails, **do not start ngrok**. Send the exact error for diagnosis without including passwords.

## Slow free AI interpretation may outlast the original Next.js rewrite timeout

In Next.js 15, rewrites to the local NestJS API normally time out around 30 seconds. The free OpenRouter model can take up to 45 seconds. This project now sets `experimental.proxyTimeout=90000` in `apps/web/next.config.mjs`, so Next.js waits longer than the OpenRouter request. **Restart and rebuild Next.js** after updating it.

The client now checks whether an API response is valid JSON. An HTTP 500 with a plaintext `Internal Server Error` body displays a safe `API HTTP 500` hint instead of the unhelpful `Unexpected token 'I'` message.

Diagnosis on Windows:
1. Stop the previous `npm run start:full` with Ctrl+C.
2. `git pull --ff-only origin main`, `npm run test:all`, `npm run build`, `npm run start:full`.
3. On a second PowerShell: `npm run test:full` to verify NestJS + PostgreSQL interpretation directly without any paid provider.
4. Click Interpret once on a fictional chart and wait for an OpenRouter response (or a clear fallback reason).
5. If `API HTTP 500` persists, inspect the *first terminal* for the NestJS or Next.js error and report only the sanitized status and stack **without passwords, API keys or personal birth data**.

The `demo:check` preflight checks auth, proxy health and database; it cannot guarantee the remote AI provider is responding.
