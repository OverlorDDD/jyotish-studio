# G-P1: Natalia-first landing + developer portfolio

## Contract
- The domain root `/` is an HTTP 200 EN Jyotish calculator (Google domain-home WebSite schema retained).
- Language home aliases `/en`, `/uk` permanently redirect to `/{locale}/astrology/jyotish`. The existing canonical natal routes remain public.
- The leftmost header item is About Me / Про мене. The Galaxiora brand links to the localized natal tool, not to the portfolio.
- `/{locale}/about-me` is the public developer portfolio. `/{locale}/about` remains the official Galaxiora company/team description.
- `apps/web/lib/portfolio-profile.json` is the editorial source for the website and four bilingual, ATS-oriented resume downloads.
- The four binary files under `apps/web/public/resume` are generated with `python tools/generate-portfolio-resumes.py`; GitHub Actions builds, validates and commits them to the feature branch/main. No PDF-in-browser print hacks.

## Deployment and validation
1. `npm run build` and `node --test tools/gp1-portfolio.test.mjs tools/portal-stage1.test.mjs`.
2. `python -m pip install reportlab python-docx pypdf` and install system package `fonts-dejavu-core` if necessary.
3. `python tools/generate-portfolio-resumes.py && python tools/generate-portfolio-resumes.py --check`.
4. Run `npx playwright test e2e/gp1-portfolio.spec.mjs` on a production-like local web/API environment.
5. Deploy through the established no-Docker, guarded production release workflow; test `/`, `/en/about-me`, `/uk/about-me` and four `/resume/*.pdf/.docx` URLs.

## SEO, attribution and safety
- Domain root stays crawled as `/`, self-canonical with hreflang pointing to localized natal pages.
- /en and /uk are excluded from sitemap because they are redirects, not canonical content.
- ProfilePage/Person structured data is attached only to About Me; WebSite/Organization remains Galaxiora.
- No personally identifying birth-chart data is transferred into CV pages or analytics.
- User-facing claims derive from existing resumes, repo capabilities and public deployment; benchmarks are stated as local tests, never commercial usage.
