# Galaxiora: approved galaxy spiral #6 — production brand lock

Status: prepared 2026-11-02. Base production commit confirmed by owner: 058c2451835b27a766cc0bf1404b90101b0bbe9d.

## What happened
Owner approved the circular galaxy spiral #6 rather than the letter G. The approved circular version was finished in GitHub commit b0f3f16b8652b861dab242a65f7e0f81fbaafc56. However, subsequent SEO/GA4 and admin dashboard releases continued on a separate code lineage containing the rejected G SVG. On every Next production build, tools/brand-icons-build.mjs regenerated browser and header PNGs from that SVG. Hence G reappeared. This was a release-branch reconciliation regression, not a Google index issue.

## Permanent resolution
- Source of truth: apps/web/brand-assets/galaxiora-approved-spiral-6.png. This is the exact final circular transparent PNG, Git blob c6a467d3ddfd2848181203382f16f60d9030b139, taken from the approved galaxy-round-v4 release. The earlier PNG before transparent-circle treatment has SHA e6cf1437d0d48c6851093d21c1873fd64f3d03fe and is NOT the final browser favicon.
- Reject outdated apps/web/app/icon.svg. The generator checks the original Git blob hash and refuses to generate icons if the approved source is changed.
- Generate app/icon.png, public/galaxiora-favicon.png (64) byte-identical to approved circular source, favicon.ico 16/32/48/64, Google Organization logo 128, Apple icon 180, PWA 192/512 from one source.
- Metadata and header now use the approved-galaxy-6-20261102 revision and new icons, without altering GA4 or PostgreSQL.
- Dedicated tests and CI verify real PNG format, correct 64px bytes, two-language browser icon, PWA manifest, and absence of G SVG.
- Old reusable release scripts no longer require the G SVG.

## How to install from AWS (Ubuntu SSH, not Windows PowerShell)
1. Confirm the AWS Git HEAD is the previously deployed 058c2451835b27a766cc0bf1404b90101b0bbe9d; if different, stop and check ancestry.
2. Fetch and fast-forward fix/restore-approved-galaxy-spiral-6-20261102 at the CI-validated SHA given in the release message.
3. Execute bash tools/deploy-approved-galaxy-6.sh. It verifies Git source integrity, approved image hash, all icon formats, builds only Next web, restarts only web, checks main site and SEO; downloads production /icon.png and /galaxiora-favicon.png to a backup directory and compares both byte-for-byte with selected artwork.
4. Accept only when APPROVED_GALAXY_6_LIVE_BYTES_VERIFIED and APPROVED_SPIRAL_6_PRODUCTION_VERIFIED appear.
5. Check UA/EN header, favicon, Apple/PWA icons and admin GA4. Google's search result favicon may update later and cannot be forced.

## R4.2 status
Owner confirmed the GA4 JSON and an active-visitors indicator in the admin panel. This completes server integration of GA4 Data API and the admin traffic widget, but the broader R4.2 conversion engine (full instrumented funnel and performance dashboard) remains ongoing. The brand restore must not touch the server-only Google service-account key, GA4 environment settings or backend.
