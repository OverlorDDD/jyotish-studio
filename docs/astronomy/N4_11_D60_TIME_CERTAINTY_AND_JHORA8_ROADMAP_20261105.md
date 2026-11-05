# N4.11 — D60 birth-time policy and original-JHora 8.0 release roadmap
Date 2026-11-05. Internal only, Draft PR #120. No merge, production changes, AI calls, flags or price exposure.

## Decision
Unknown birth time -> conditional 12:00 LOCAL for preliminary chart visualisation, with uncertainty over the *entire local civil day*. Noon is a chosen reference, **not a historical birth observation**. Never trust a D60 Lagna or house from an unknown-time chart. An approximate or recorded HH:MM must retain its stated ± uncertainty and any interval crossing midnight. Resolve through city IANA time zone/history (including 23/25-hour civil days, ambiguous and nonexistent DST times), not a guessed fixed UTC offset. The existing production form is unchanged in N4.11.

## D60 geometry and rules
Each of 12 natal signs (30 degrees) has 60 sectors of exactly 0.5 degrees. The pinned Galaxiora version counts D60 signs forward from the occupied D1 sign, though classical references and original JHora offer alternative start/method settings. A varga sign can repeat every 12 sectors (6 degrees), so comparing only the endpoint D60 **sign** is NOT enough to prove stability. Require a *continuously enclosing, independently derived* sidereal-longitude min/max for Lagna and all nine grahas over the full UTC time uncertainty interval. Equal 0.5-degree absolute-sector indices over that entire enclosure prove a stable D60 part; include ephemeris error margin and reject near boundaries. Matching sampled endpoints or an assumption of 2 minutes/sector is not such a proof.

- Full D60 houses and interpretation: original JHora8 mathematical method certified, historical timezone checked, trusted continuous bounds, all 10 bodies in one stable sector across the input uncertainty, and the time genuinely supplied (not assumed noon).
- Partial: if a graha sign is stable while Lagna changes, show sign-only evidence with uncertainty; NO house claim or decisive personal reading.
- Unknown: reference calculation may use 12:00; actual birth time remains unknown; full D60 not eligible even if someone feeds the engine a fictitious stable envelope.
- If JHora or continuous interval proof missing, D60 stays visible as unverified research math, never a certified LLM fact.

New code: apps/api/src/n4-birth-time-certainty.ts pure input status and fail-closed D60 eligibility. It does not pretend to compute Swiss continuous interval bounds or actual historical timezone, and does not yet allow D60 inside the N4 full-life model prompt. This is a gate FOUNDATION, not a final certification.

## Original JHora availability / blockers
The owner's uploaded files were inspected, NOT executed. All 3 ZIPs open and contain expected Windows installers:
- short 3,836,195 bytes SHA256 10a291f8f69fbb9ab8c4ec88f8d804fd227fb23e0f4375706c30ba0043b72339
- full 107,105,550 bytes SHA256 cd60ac99f82423a42cbfe95040cd07f9f659ab81467d1460542efa4ca5acc6c8
- update 2,709,621 bytes SHA256 fd0e439a9cfaaf8be3b481d4f99ff388d05f909bd11359f58c01a415c4b2a5a0
Their ZIP structure does not independently prove publisher signatures. The analysis runtime has Swift and Xvfb but NO Wine, so 50 real original executable exports have not been generated.

The owner's private jhora-n4-original.ini says JHoraVersion=8.0.0.0. Compared with the current pinned JHora8 runner it differs in four settings: HoraPreference=6 vs 0, D24Preference=1 vs 0, DivLongFromEndToo=1 vs 0, UserSelectedAyanamsa=17 vs 0. The INI has personal default-chart/location data; do NOT upload the full INI into GitHub or modify the owner's installed profile. JHoraKit warns that author-recommended variants can differ and enum numbers do not equal visible menu order. The new read-only tools/n4-jhora8-ini-preflight.mjs prints only method differences, INI SHA256 and status; a matching profile is necessary but not sufficient for parity.

Original author/publisher source https://www.vedicastrologer.org/jh/index.htm and 8.0 changes https://mail.vedicastrologer.org/jh/update_8.0.htm ; JHoraKit INI study https://github.com/normalmystic/JHoraKit/blob/main/JHoraInternals.md . The similarly named independent jagannathhora.com is NOT the original JHora author.

## Exact acceptance gates
G11.1 (this commit): explicit time-confidence model, read-only INI profile audit, 0.5-degree interval-part correctness with test cases, no server/production integration, N4 CI.
G11.2: timezone-resolved real local birth-day/approximate UTC intervals, original ephemeris positions, certified conservative *continuous* sidereal longitude bounds for each graha and Lagna; handle historical DST, latitude, retrograde and precision near crossings. Sample-only tests are diagnostic, never a continuity certificate.
G11.3: authentic ORIGINAL JHora8 owner Windows extraction of 50 synthetic profiles; proof of original executable/source, independent actual charts with 16*10 = 8,000 sign comparisons, pinned same-method GUI preferences + exact source INI hashes. Need separate D1 physical longitude, nodes, DST, Vimshottari date validation. Prior independent PyJHora 8000/8000 PASS cannot substitute.
G11.4: conditionally inject SOURCE-CERTIFIED D60 evidence into full-life report and shared editorial proof gate. Partial signs only if rigorously stable; exact D60 Lagna/house only after all gates. Do not permit client or LLM to provide the attestation flags. Revise Ukrainian/English editorial review and re-test real model outputs (currently 0/48 fully human approved).
G11.5: owner signoff, release N4 with original 16-varga explorer, then Natal-first homepage issue #126 separately.

No false confidence: a noon approximation never fixes missing data. Original JHora8 still 0/50 source exports and not certified. All production N4 approval flags stay OFF.
