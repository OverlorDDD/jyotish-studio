# Galaxiora — Tarot interpretation research and next platform milestone
Updated: 2026-10-18

## Sources researched
1. **Primary historical reference:** Arthur Edward Waite (1910/1911), *The Pictorial Key to the Tarot*. Public-domain scans: https://commons.wikimedia.org/wiki/File:The_Pictorial_Key_to_the_Tarot.pdf and https://sacred-texts.com/tarot/pkt/pkttp.htm . The text organizes symbolism and divinatory readings of the 22 Major and 56 Minor Arcana. Public-domain STATUS of historical illustrations and any modern reprint must be confirmed for the jurisdiction and exact files before using images on the commercial site.
2. **Contemporary card-keyword comparison:** Labyrinthos, all 78 card meanings https://labyrinthos.co/blogs/tarot-card-meanings-list . Used to cross-check modern conventions for card polarity, court-card meanings and thematic suits. Its prose/art is NOT copied or licensed into the product.
3. **Contemporary interpretive perspective:** Biddy Tarot https://www.biddytarot.com/tarot-card-meanings/ and example guides https://biddytarot.com/tarot-card-meanings/major-arcana/death/ and https://biddytarot.com/tarot-card-meanings/major-arcana/temperance/ . Used to compare nuance on reversal and change, not to copy prose.
4. **Cross spread interpretation:** Celtic Cross spread rationale and position comparisons https://arcanarealm.com/readings/celtic-cross-reading/ ; https://www.themystica.com/tarot/spreads/celtic-cross/ . Reading positions vary by tradition: Galaxiora explicitly labels its own consistent chosen order.

It is not feasible to review literally every source ever published. This set balances a classical primary work and modern cross-checks. Card texts in this repository are newly authored bilingual interpretive educational content, not sourced verbatim or claims of factual prediction.

## Implemented this stage
- **78 / 78** card IDs have unique full paragraphs for *upright and reversed* in UK and EN: `apps/api/src/tarot-depth.ts`. Majors 22, Minors 56; Minor Arcana are now individually described rather than a generic "rank + suit" template.
- Original concise meaning remains available, followed by `detail` and contextual `positionInsight` for all new and saved draws.
- `synthesizeTarot` produces bilingual answer to the exact written question, explains how opening/final/center cards relate, dominant suit and reversal balance, offers 3 concrete reflection steps, and warns that meanings are conditional rather than future facts.
- The synthesis is deterministic, uses only saved card IDs/orientations/positions and user question; it does NOT call an AI provider and does not incur API cost. Avoid calling it an actual intuitive human reading or predictive certainty.
- After all cards are revealed, the unified result becomes visible. Saved readings receive the new expanded meanings on fetch without changing the database schema or consuming a draw.
- Real tarot experts now live **inside the Tarot module** under `/{locale}/tarot#human-readings`; the legacy `/{locale}/experts` redirects to that section; account CTA and Tarot buttons no longer incorrectly point to Jyotish natal chart.
- Future modules `/{locale}/news` (daily editorial news, astronomy, culture, verified sources) and `/{locale}/community` (forum/community) appear in nav and homepage with explicit prelaunch notice. No false "live news" or unmoderated user posting. Both will share accounts and moderation.

## Design and safety
- Treat the Tarot themes as cultural/symbolic prompts. A definitive prediction about other people's private thoughts, medical prognosis, pregnancy or financial returns is not warranted.
- Since the card summaries are template-based and grounded in symbols, they cannot fully reason like a trained person. Later AI-assisted synthesis should be carefully scoped to cards, user context/consent, per-user budgets, prompt injection defenses, no unneeded identity details, and offline fallback.
- Tarot text licensing: do not paste contemporary Biddy/Labyrinthos copy, or assume that a modern scanned colored deck or branded design is available for commercial use.
- Paid human videos remain draft → payment unavailable → future verified order; no payout or delivery workflow is activated.

## Next implementation (proposed, no fake completeness)
1. **Reader marketplace without real payment:** expert profiles, admin approvals, products and prices, order status workflow for sandbox/admin testing only, assignment, protected private upload, expiration and cancellation. Do NOT create a "paid" status via the public client; reserve conversion to a verified gateway webhook later.
2. **News CMS:** author/editor roles and reviewed publication workflow; source URLs, correction history, language tags, RSS and SEO; no automatic unverified news.
3. **Forum:** threads, replies, categories, report/moderation, privacy and spam controls; require a protected backend permission model; community guidelines, queue and appeals.
4. **Tarot improvements:** visual card assets only after exact commercial license checks, responsive Celtic Cross layout, contextual AI synthesis with metered token budgets and user disclosure, optionally guest daily draw with anti-abuse.

## Acceptance checklist (Windows)
- After git pull and Docker Engine running, run `npm run db:generate`, `npm run db:migrate`, `npm run test:all`, `npm run test:swagger`, `npm run build`, `npm run dev:full`.
- On `/uk/tarot`, write a specific question, draw 3 cards, turn them over one by one. Verify at least two paragraphs per card plus position relevance, then a final full answer and 3 steps after all cards open.
- For a 10-card reading, read the "Connections" section and check the first/last/central card labels; revisit from history and confirm identical card choices and full text.
- Check both direct and reversed examples (random); all 78 cards have distinct explanations in both locales.
- On `/uk/tarot`, press Personal video reading: URL stays `/uk/tarot#human-readings`. Open old `/uk/experts`: redirects to same block, not `/astrology/jyotish`.
- Open `/uk/news` and `/uk/community` and EN alternatives; confirm no fake stories, no user forum forms yet.
- Sign out: drawing requires login. Repeat until 3 daily draws used, fourth is refused; history is account-specific.
- Admin setup: run `npm run admin:setup`, choose your email number and type the **entire** `PROMOTE <your email>` string. A partial `PROMOTE` or email alone does nothing. It only works if no admin exists.
