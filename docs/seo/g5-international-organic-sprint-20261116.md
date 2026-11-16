# G5 — International Organic Acquisition Sprint

**Audit date:** 2026-11-16. **Scope:** bilingual Galaxiora flagship; no paid ads; no LLM-generated public content; no changes to natal calculation engine, personal records, logo, authentication, GA4 or AWS production.

## Diagnosis: the problem is discovery and ranking, not global deindexing

First-party Search Console finalized 2026-10-17..2026-11-13: **524 impressions and 7 clicks** (CTR ≈1.34%). Daily impressions Nov 10–13: 65,31,39,47, with zero clicks those four days. Site has impressions in **61 countries**, but no proof of visitor sessions in each. Country samples: Ukraine 148 impressions/5 clicks/average position 14.5; US 89/1/59.7; India 70/0/31.5; Brazil 26/0/54.8; UK 10/0/72.6. Averages aggregate heterogeneous queries and are not fixed keyword positions.

Important GSC page inventory: historic /en/astrology URL 111 impressions at avg position 45 (legacy redirect to /en/astrology/jyotish), generic Moon-phases article 80 at avg 65.8, /uk 79 at avg 3.6, / 52 at avg 1.9. This period spans changes; historic alias rankings are not current final canonical rankings. GSC disclosed query rows are incomplete/anonymized; examples: 'free d10 chart calculator' 4 impressions avg 91.8, 'd60 chart calculator' 3 avg 72.3, 'vedic d1 chart' 5 avg 83.6, 'jyotish zone' 18 avg 10 (unrelated site name; do not target it). **Never claim Galaxiora has a D11 calculator:** D11 is not among our 16 Shodashavarga charts.

GA4 through Windsor.ai, Nov 1–15: 39 sessions, 4 active users, all Ukraine; 38 direct and 1 unassigned. 8 public_tool_completed events were reported, but QA versus independent users is unknown. GSC records US and DE search clicks but GA4 attributes no organic sessions, so attribution/coverage requires diagnosis before drawing conversion conclusions. Do not alter analytics consent or collect private birth-chart values.

SEO tools: OpenSEO US monthly estimated demand, 2026-11-16: 'vedic birth chart calculator' ≈4,400 (KD 11), 'free vedic birth chart' ≈1,900 (KD 11), 'd10 chart calculator' ≈480, 'd60 chart calculator' ≈170. **Modeled US demand, overlapping variants, NOT guaranteed traffic**. Live US Google SERP sample (three reads): Galaxiora not seen in first 20 results for the first two queries. Competitors include Zodiacal, DashaClub, Vedaansh and Astro-Seek. No claim that these current positions are stable. OpenSEO backlinks: 18 backlinks from 13 referrer domains in provider snapshot; many appear to predate the project and may be historical, so this is not a Google penalty finding or a reliable census of high-quality links.

Canonical and indexing were separately audited Nov 16: Google selected the correct self-canonical for EN/UK natal and main tool pages; an earlier PR restored legacy redirects. Live sitemap contained **960 unique URLs** with no structural issues. Do not expand with mass pages or remove working indexed ones.

## Implemented in this branch
1. Make the H1, meta title, description, and first paragraph of the **actual calculator** clearly state free Vedic birth chart/Kundli, D1, D9, D10, 16 Shodashavarga charts and D60 precision limits (EN/UK). Preserve actual chart workflow and design.
2. Describe the public free tool with factual schema.org WebApplication JSON-LD using the exact canonical localized URL and a USD 0 Offer. Gate with public indexing, omit aggregateRating and fake reviews.
3. Improve existing divisional charts guide for searchers wanting D9, D10 and D60; keep JQA-3's narrower independent-reference coverage and provisional D60.
4. Add G5 regression test to the existing SEO CI script.

## Growth mechanism outside the site (not shipped by code)
- **The missing input is real editorial discovery:** Ask five individually chosen teachers/developers for feedback on our reproducible fictional D10/D60 chart test and methodology, without purchasing links, demanding backlinks, mass email or pretending neutrality.
- One useful tutorial or reply for each of three communities over ~14 days (only where rules allow), using real values from our existing test corpus, never generated charts of real people.
- Show one short screen recording of an actual guest chart calculation, with correct location/time-zone inputs and a clear note about D60; no real personal data. Link to the canonical calculator.
- Prefer relevant partner mentions/citations to link farms. A publisher's feedback can be valuable even without a link.

## Two individual outreach drafts (manual review/send only)
**To a Jyotish educator:** "I'm the main developer at Galaxiora, a small-team Vedic chart project. We're exposing the calculation assumptions behind 16 Shodashavarga charts, including the limits of birth-time-sensitive D60. Would you be open to checking one fictional D10/D60 example against your preferred method? I can share the exact inputs, conventions and output, and I'd be glad to correct anything you find."
**To an astrology-tool reviewer:** "I work on a free Vedic birth chart calculator with D1/D9/D10 and an explorer for all 16 traditional divisions. Rather than asking for a review, I'd value a sanity check on whether our guest workflow clearly exposes Lahiri settings, the time-zone handling and the provisional D60 warning. Is there a specific example you use when comparing calculators?"

Do **not** send outreach automatically or fabricate recipient lists. The text is useful independent of clicking a link; add one only when permitted and relevant.

## Acceptance / measurement
- Before release: CI core/SEO/build pass; confirm HTML H1, one self-canonical, EN/UK hreflang, JSON-LD free WebApplication, favicon #6 retained, GA4 still sending and private information not logged.
- 14 days **after actual verified AWS deployment**: review target-cluster Google impressions, positions and non-branded queries, plus external referral sessions and true completed guest charts. Compare GSC finalized dates only; exclude QA when reliably possible.
- 28 days after release: decide whether educational outreach yielded real referrals; do not attribute a Google ranking gain solely to this title change without evidence.
- Experiment targets, not forecasts: 5 legitimate invitations, 1 educational case available for citation, 2–3 useful permitted community publications, at least 5 unaffiliated user feedback observations.
- Stop/pivot if the target queries and independent visits show no improvement with sufficient finalized observation and real outreach; re-evaluate competing result pages and public tool value.

**Sources:** https://developers.google.com/search/docs/fundamentals/creating-helpful-content ; https://developers.google.com/search/docs/fundamentals/seo-starter-guide ; https://developers.google.com/search/docs/essentials/spam-policies ; https://developers.google.com/search/docs/appearance/structured-data/software-app .

**Release status:** a GitHub PR is not an AWS deployment; check production's pinned SHA and dirty files first. No background posting, social activity, ad spend, indexing requests or AWS mutations are part of this branch.
