# Galaxiora Cosmic G — all-icon release

**2026-11-01; Not yet deployed.** Based on Google brand visibility fix commit `df08c08280d9747490b33879b9ce82a0aae0b4d1`. Branch `feat/galaxiora-cosmic-g-brand-icons-20261101`.

## Design contract

One original SVG `apps/web/app/icon.svg` depicts **a gold orbital letter G with a small star on a dark navy circular disc**, no crescent. Main G stroke is intentionally thick at 16×16. Current preview verified at 16,32,48,64,128,180 px. No unrelated stock or copied logo.

## Canonical source → generated outputs

`tools/brand-icons-build.mjs` uses explicit `sharp` dependency to generate, from this SVG:
- `apps/web/public/favicon.ico`: four PNG-backed frames at 16, 32, 48, 64px
- `apps/web/public/galaxiora-favicon.png`: 64px Google/browser
- `apps/web/public/galaxiora-logo-128.png`: 128px Organization JSON-LD logo
- `apps/web/public/apple-touch-icon.png`: 180px mobile bookmark
- `apps/web/public/galaxiora-192.png` and `galaxiora-512.png`: PWA app icons
- `apps/web/app/icon.svg`: static Next.js icon, auto route `/icon.svg`

Generated PNG/ICO are **gitignored** and are rebuilt before Next web build, and before icon-dependent tests. No manual binary upload needed. New `site.webmanifest`, metadata icons, Apple and favicon paths; consistent header `as-brand-icon` uses the same G mark. No old MoonStar in header.

## Release safety

1. Owner connects via SSH to AWS as `ubuntu`. Navigate `/opt/galaxiora/app`. Run `git rev-parse HEAD` to confirm at least `df08c...`. If not, stop/reconcile.
2. Fetch the GitHub branch; verify target SHA against CI green head; `git merge-base --is-ancestor HEAD FETCH_HEAD` then `git merge --ff-only FETCH_HEAD`. Beware of existing local edits; never reset without inspecting.
3. Run `bash tools/brand-icons-release.sh`. It executes `npm install` (new sharp dev dep), source generator, icon/SEO tests, production build, restarts web **before** checking readiness, site:check, launch:verify, full sitemap audit and all icon URLs.
4. Confirm `GALAXIORA_COSMIC_G_VERIFIED`, deployed SHA, `/favicon.ico`, `/galaxiora-favicon.png`, `/apple-touch-icon.png`, `/site.webmanifest`, `/icon.svg`, user header on both locales. Check icon visually on OnePlus/Chrome 16/32px. Confirm `git status` only contains expected generated next-env and local package-lock; icons should remain gitignored.
5. Search Console `https://galaxiora.com/`: URL Inspection → test live URL and optional request indexing. Do not repeatedly submit whole sitemap. Google can take days/weeks to update favicon and brand; cannot force AI Overview definition, even if technical data is valid. Create real independent brand references later; never fake.

**No migrations, DNS change, Google verification reset, news pipelines or payment changes.**

### Failures
- If `npm install` fails, inspect network/Node version and sharp platform binary; do not restart.
- If `npm run brand:icons:build` fails, verify sharp is present in workspace and Node v22+.
- If `npm run build` fails, don't run check against old process; fix reported issue.
- If web restart returns too early, script waits up to 60s; on failure it reports systemd status/journal.
- If Google remains with a globe despite correct `favicon.ico` and PNG served 200, that may be stale index; neither Google search icon nor AI overview can be guaranteed by a brand metadata change alone.
