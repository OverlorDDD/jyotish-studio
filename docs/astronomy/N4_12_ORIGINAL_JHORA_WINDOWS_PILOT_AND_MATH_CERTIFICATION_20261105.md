# N4.12 — Original JHora 8.0 pilot and full mathematical certification
Date: 2026-11-05. Draft PR #120; NOT merged or deployed. No production feature flags.

## What is implemented
- tools/n4-jhora8-windows-prepare.mjs: creates EXACTLY 50 synthetic JHD inputs mirroring the existing n4-jhora8-batch.mjs coordinates, dates, fixed timezone offsets and synthetic IDs. It never produces or invents JHora output. Matches pinned MIT JHoraKit JHDBuilder.swift structure. Determinism, first-case bytes, ID count, no-overwrite and fake-only tests are in npm test:n4.
- User-facing single PowerShell script galaxiora_n412_jhora_windows.ps1 (conversation download), pinned to Git commit a0e74bb51452f8497fc56de6fb947d5bf0e1d619. Actions: Prepare (no live calculations), Inspect (EXE SHA256, redacted INI method diagnostics), PackPilot (ONE genuine raw clipboard source ZIP with hashes, no private INI).
- N4.11 already has D60 source-time policy and 720 half-degree internal geometry tests; neither is original mathematical certification.

## Owner's ONE-case pilot on Windows 10 (manual intervention REQUIRED)
1. Save galaxiora_n412_jhora_windows.ps1 to E:\Downloads. PowerShell command: powershell.exe -NoProfile -ExecutionPolicy Bypass -File "E:\Downloads\galaxiora_n412_jhora_windows.ps1" -Action Prepare
2. Expected: N4_12_PREPARE_SUCCESS; 50 fake *.jhd files at C:\Users\<currentuser>\galaxiora-n412-jhora\inputs\cases. If original JHora is installed at a nonstandard path, pass -JHoraRoot "C:\path\Jagannatha Hora"; for other INI use -IniPath "C:\path\jhora.ini". NO preference writes.
3. Open ORIGINAL P.V.R. Narasimha Rao JHora 8.0 application with FIRST synthetic chart N4-SYNTH-001.jhd. Verify date 1990-01-05, local 05:11, 48° South, 150° West and UTC-09:00. All inputs fake.
4. On JHora chart press Ctrl+C to copy chart data. Dismiss "Copied", paste into Notepad, Save As UTF-8:
   C:\Users\<currentuser>\galaxiora-n412-jhora\raw\N4-SYNTH-001\chart_data.txt
5. JHoraKit pinned original GUI automation uses Shift+F10, a, Shift+F10, Up, Enter to copy all divisional positions. These keys depend on correct JHora window/menu: if unexpected, STOP and send an anonymous screenshot, don't guess. Dismiss "Copied", paste into new Notepad UTF-8:
   C:\Users\<currentuser>\galaxiora-n412-jhora\raw\N4-SYNTH-001\divisionals.txt
   Its header should contain D-1, D-9, D-10, D-60 and data rows for Lagna plus 9 grahas.
6. After JHora closes run: powershell.exe -NoProfile -ExecutionPolicy Bypass -File "E:\Downloads\galaxiora_n412_jhora_windows.ps1" -Action PackPilot
   Attach C:\Users\<currentuser>\galaxiora-n412-jhora\N4-SYNTH-001-ORIGINAL-JHORA-PILOT.zip to ChatGPT.
   Contains synthetic JHD, two actual clipboard texts and hashes for original EXE/INI/source; never full INI contents or real birth records. A first source capture is NOT a 50-profile certificate.

## Serious blocker: JHora ayanamsa and method numbers
Owner original INI JHoraVersion=8.0.0.0 has UserSelectedAyanamsa=17, HoraPreference=6, D24Preference=1 and DivLongFromEndToo=1.
Earlier Linux runner pinned UserSelectedAyanamsa=0, HoraPreference=0, D24Preference=0 and DivLongFromEndToo=0.
Pinned normalmystic/JHoraKit JHoraInternals.md experimentally found **17 = True Lahiri / Chitrapaksha** and **0 = Traditional Lahiri**, different sky zeroes. GUI dropdown index and INI integer differ. Never change 17 to 0 blindly; do not overwrite the owner's JHora preferences. First inspect original D1 ayanamsa and raw longitude and compare method by method to Galaxiora's Swiss standard.
An earlier single JHoraKit public chart had **44 mismatches of 160** due not-yet-aligned methods; not a valid failed arithmetic certificate and not a PASS.

## Next automation after the pilot is parsed
- Parse the TWO genuine raw clipboard dumps with independent pinned JHoraKit Swift 6.2 (parse-only; Windows owner need not install Swift or Wine). The CLI's full extractor launches Wine and is NOT a native-Windows drop-in.
- Confirm original GUI method mapping, actual ephemeris/ayanamsa, D1 angles, D24 and D60 options. Pin an isolated dedicated profile, protect/restorable user INI, and build native Windows AutoHotkey v1 (not v2) GUI capture with fresh outputs per case.
- Capture remaining 49 JHD inputs automatically, generating 50 genuine original chart.json records with independent source hashes and same-method INI hash. Existing n4-jhorakit-import.mjs and fail-closed n4-external-varga-gate.mjs require 50 sources and 8000 original sign placements.
- Original reference gate **8000/8000** (50 x16 x10) with zero unexplained mismatches. Distinguish varga sign parity from separately measured exact D1 ephemeris/ascendant/node/DST and dasha date parity. Never fake missing original results.

## Full N4.12 milestone acceptance matrix
1. Genuine original publisher software provenance, executable SHA, version, isolated GUI preferences, 50 source exports and 8000 same-method signs.
2. Separate astronomy layer: real UTC resolution, IANA historical TZ/DST including ambiguous/nonexistent local times and midnight crossings, Lahiri version, node mode, Swiss/JHora absolute sidereal precision.
3. D60: continuous conservative sidereal longitude enclosure across the full declared birth-time interval, including numeric error margin; D60 sector width 0.5°; do NOT treat two equal endpoint D60 signs as stable when sectors could have changed in between. Unknown birth time: default reference noon for display only, full 00:00–24:00 local uncertainty, never a verified D60 Lagna/house.
4. Full life reading: inject D60 selectively only if original source and interval proof support it; otherwise provisional sign-only evidence or withhold conclusions. Do not invent Shadbala, yogas, aspect strength, dasha dates.
5. Editorial: real source-grounded UA/EN one-call texts, no sign/house errors, independent human review. Exact-head full CI, mobile, SEO/privacy and separate owner's production approval. Natal-first homepage issue #126 remains post-certification.

Primary original source: https://www.vedicastrologer.org/jh/index.htm
Original version 8 notes: https://www.vedicastrologer.org/jh/update_8.0.htm
Independent exporter/parser: https://github.com/normalmystic/JHoraKit commit f63826b501eabe69c6b08c5365875e1e2f74c24a
Current remaining blocker: no **original author 50-case** corpus yet (0/50), no mathematical JHora certification. No Docker, no API token spending, no production change.
