# A8: verified classical Jyotish source catalog (2026-10-21)

Research for Galaxiora's **professional practitioner voice**, not an automatic grant to redistribute modern copyrighted translations. All school-specific interpretations must be traceable to their edition and calculation preconditions.

## Verified reading priorities

| Work / resource | Purpose | Edition / access | Rights and usage |
|---|---|---|---|
| **Brihat Jataka**, Varahamihira, trans. N. Chidambaram Iyer | classical grahas, signs, bhavas and interpretive configurations | **1885**, https://wellcomecollection.org/works/afmgm695 ; PDF https://upload.wikimedia.org/wikipedia/commons/a/a9/The_Brihat_jataka_of_Varaha_Mihira_%28IA_b2488442x%29.pdf | Wellcome Collection and Wikimedia Commons: Public Domain Mark for THIS translation/edition, check applicable jurisdiction |
| **Brihat Samhita**, Varahamihira, Iyer | broader historical Jyotish background, not a substitute for a natal reading manual | **1884–85**, https://wellcomecollection.org/works/hzaaf9ak | Public Domain Mark |
| **Laghu Parashari**, Sitaram Jha edition | functional house-lord roles, karakas, yoga/dasha basics | **1900**, catalog https://github.com/maximally0/jyotisha-corpus and archive ID `LaghuParashariSRJha` | Third-party registry marks US public domain; review scan and jurisdiction before redistribution |
| **Saravali**, Kalyana Varma | comparative classical claims about grahas and combinations | **1907** historical edition in https://github.com/maximally0/jyotisha-corpus ; Archive.org ID `saravali00kalyuoft` | Third-party US PD claim; text quality limited; verify manually |
| **Brihat Parashara Hora Shastra**, traditional Sanskrit source | lordships, dharma/karma/yogas, Vimshottari, vargas | https://sanskritdocuments.org/sanskrit/jyotisha/ | Sanskrit Documents volunteer digitization is PERSONAL STUDY ONLY without commercial republication permission; modern translated/commented editions are not public domain by default |
| **Phaladeepika**, Mantreshwara | strengths, yogas and timing | V. Subrahmanya Sastri 1937, https://openlibrary.org/books/OL2696088M/Phaladi%CC%84pika%CC%84 | Rights of translation uncertain: cite/access; do not mirror or fine-tune without clearance |
| **Vedic Astrology: An Integrated Approach**, P.V.R. Narasimha Rao | systematic modern beginner-to-advanced textbook and worked cases | Author provides download: https://www.vedicastrologer.org/articles/astro_books.htm | Personal study; do not redistribute or train on entire book without permission |
| **Jagannatha Hora v8**, P.V.R. Narasimha Rao | independently cross-check chart calculations and Vargas | https://vedicastrologer.org/jh/index.htm | Free software from author's site, not permission to redistribute installer |
| **Swiss Ephemeris** official programming manual | validate sidereal Lahiri calculations and licensing | https://www.astro.com/swisseph/swephprg.htm ; https://www.astro.com/swisseph/swephinfo_e.htm | Must honor AGPL or commercial Professional License before public operation; current open-source repo AGPL requires license audit |

## Existing structured classical corpus (not independently certified)

https://github.com/maximally0/jyotisha-corpus includes a source ledger, public-domain edition texts/chunks, and cited rule records. Its `LEGAL.md` differentiates US public-domain scans, CC BY 4.0 datasets, volunteers' Sanskrit texts, and in-copyright titles. This is a **candidate dataset** subject to manual review of edition, source_quote, OCR quality, and jurisdiction. Download full public subset: https://github.com/maximally0/jyotisha-corpus/archive/refs/heads/main.zip .

**Do not** blindly ingest its `data/rules.json`: some claims are unreviewed extractive metadata, and the traditions/schools differ.

## Provenance schema required for all production rules

`{sourceId,work,edition,translator,year,chapter,verseOrPage,school,licenseStatus,verbatimSourceAnchor,reviewStatus,calculationPreconditions,conditions,conclusion,exceptions,conflictingSources}`.

Rule executions carry `ruleId`, version, chart facts consumed and boolean proof. LLM only receives the activated, verified rule facts, not whole books or unverified textual predictions.

## Research access

Use `tools/research/download-classics.ps1` on your Windows machine to fetch one verified PD PDF and the PD text corpus ZIP. Never check third-party binaries or scans into `apps/web/public` until legal/usage audit. Retain upstream URLs and credits.
