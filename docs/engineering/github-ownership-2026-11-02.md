# GitHub ownership and release discipline — Galaxiora (2026-11-02)

The user designated the **Panchanga / main engineering conversation as the sole committer** to `OverlorDDD/jyotish-studio`. SEO conversations produce **research, audits, drafts and specifications only**, without creating branches, commits, PRs, merges or deploys. This is a collaboration process, not an enforced GitHub permission policy: another authorized tool or teammate may still push, so always recheck branch SHAs before each write.

Working rules:
1. Any changes to GitHub originate from the main engineering conversation after inspecting the latest branches, open PRs and dependencies. Use an isolated feature branch and protected expected-SHA updates. No force pushes, no resets.
2. SEO findings must be handed off as text or reviewed specs; incorporate them here as small commits. The existing SEO PRs #79/#81 are legacy parallel work requiring deliberate reconciliation, not instructions to continue two independent committer streams.
3. Preserve approved spiral logo #6, GA4 consent settings, news, verified natal/JQA-3 mathematics and other work. Avoid whole-tree replacements of concurrently edited files (especially `package.json`, `PanchangaHub.tsx`, CI workflows).
4. All staged Panchanga features depend on the PR chain: P2.1 #78 → P2.2 #80 → P2.3 #82 → P2.4 (new PR). Reconcile SEO siblings #79/#81 before a single integrated production release.
5. Require unit, Prisma, production build, isolated browser E2E and production smoke checks. Keep PRs Draft and **do not deploy** until explicit coordinated release after user review.
