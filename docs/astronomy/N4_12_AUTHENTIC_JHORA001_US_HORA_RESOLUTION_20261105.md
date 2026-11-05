# N4.12 authentic original Jagannatha Hora 8.0 pilot and Uma-Shambhu D2 resolution
2026-11-05. Draft PR #120 only; no release, AI calls, model flags, or production changes.

## Private real-original-source evidence — synthetic case #001
Owner supplied original Windows JHora 8.0 GUI exports for fake birth 1990-01-05 05:11 local, UTC−09:00, 48° South 150° West.
Private original zip SHA-256: a69f95b3613f18eddce79c7045da4df599371ad6c3744635fae79b1faaed9893.
Original Ctrl+C main: 49,367 bytes, SHA B105B22298C3245C48AF746EB5CDF9E2F4239F9649BAA92DD0A13B4061ECEA51.
Original 16×10 varga GUI: 13,567 bytes, SHA 96C888129178186DB4B325AD735DA799E721C1D4FC8D911BA9A0DC5B53903A48.
Synthetic JHD: 143 bytes, SHA 666F21A61FA4A573788AEB3543CDB179F7C5A757DBD36824506E7EE59CCFD65E.
Executable SHA reported by owner Windows: 3DDBE5FB0458AD1F0AD91B002C7EFB8BBA9F08891D3F46190ABA97D570B17908. Independent publisher signature is not verified.
Original JHora value: Ayanamsa 23°42′07.10″; sidereal Lagna 20°25′12.99″ Sagittarius. Other 9 raw graha positions preserved in private source, not committed.

## Precisely identified D2 variant mismatch
Original chart clearly labels D-2 (US) = UMA-SHAMBHU HORA. Primary author P.V.R. Narasimha Rao's 2012 source https://vedicastrologer.org/articles/us_hora.pdf supplies a full 24 half-sign table.
Method: zodiac D1 first/second 15-degree halves (one-based zodiac signs): Aries 1/2; Taurus 4/3; Gemini 5/6; Cancer 8/7; Leo 9/10; Virgo 12/11; Libra 1/2; Scorpio 4/3; Sagittarius 5/6; Capricorn 8/7; Aquarius 9/10; Pisces 12/11.
New source: packages/jyotish-core/src/hora-uma-shambhu.ts. It is an explicit ALTERNATIVE; original production Galaxiora Sun/Moon Hora remains unchanged.
Given original JHora D1 arcsecond precision values: existing Galaxiora pinned standard formulas agree with original GUI in 151/160, nine differences exclusively D2; author-specific US D2 agrees in 10/10, giving **160/160 same-source method-aware positions in ONE genuine original sample**.
Original JHora D60 (Trd) corresponds to pinned mapping for these ten source objects (10/10); this is NOT proof of D60 time stability or original 50-case parity.
Important: original-program D1 longitudes were reused as formula input. This does NOT compare independently calculated Galaxiora vs JHora physical sidereal longitudes, ayanamsa, nodes, ascendant or real date/time; no math gate was unlocked.

## New genuine reference vectors available in original main capture
- Shadbala 7 planets × 5 values (virupas, rupas, percent, IshtaPhala, KashtaPhala); no Galaxiora Shadbala formula parity yet.
- Ashtakavarga BAV eight rows × 12 signs, seven-graha BAV total 337; Sodhya/Rasi/Graha Pinda 8 rows.
- Vimsopaka Bala nine grahas × four varga score groups; no independent formula matching yet.
- Vimshottari nine Mahadasha and 81 Antardasha start dates; no independently verified Galaxiora dasha timing parity yet.
Source-derived sanitized local JSON and 160-line CSV created for owner inspection. RAW author clipboard and full INI are NOT committed.

## Why True Lahiri matters
JHora owner INI UserSelectedAyanamsa=17 = True Lahiri/Chitrapaksha per empirical pinned JHoraKit documentation; earlier automation wanted Traditional Lahiri=0, materially different.
Provisional Python pyswisseph 2.10.03 Moshier fallback, not the same original DE431 Swiss files: at UTC 1990-01-05 14:11, True-Citra ayanamsa differs from original JHora by ~−3.17 arcsec, traditional Lahiri by ~+56.2 arcsec. Not a formal original/Galaxiora astronomy acceptance and not a release-safe tolerance.

## Next engineering acceptance gates
1. Lock exact astronomy method (sidereal zero, original Swiss version/data, true vs mean nodes, speed/ascendant, historical time zones) using independently run original and Galaxiora calculation for same synthetic inputs.
2. Supervised fail-closed native Windows JHora8 GUI batch capture of the 49 remaining synthetic JHDs, first separately verify 002. Never kill other users' JHora sessions or overwrite personal INI; require correct captured date/time/UTC/place and new source hashes before accepting each.
3. Direct original raw source batch importer for 50 pairs (no missing or synthesized original positions), with profile evidence and per-case source hashes; compare 50×16×10, zero unexplained mismatches.
4. Separate certification of exact D1 longitudes/ayanamsa, Vimshottari date boundaries, Shadbala, Ashtakavarga, Vimsopaka Bala, D60 continuous time uncertainty envelopes (0.5-degree sectors).
5. Only after successful factual math and full independent bilingual human prose review enable N4 and later natal-first homepage #126.

**Status:** 1/50 genuine raw source case captured; 0/50 fully independently certified original-JHora cases. All N4 release flags OFF. Tests on prior code SHA a76ca4b passed N4, 8000/8000 PyJHora, integration/Windows/DB; Chromium running at last observed check.
