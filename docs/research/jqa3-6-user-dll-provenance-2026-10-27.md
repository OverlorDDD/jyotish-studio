# JQA-3.6 — User-supplied Swiss DLL: source and provenance audit

Date: 2026-10-27. This report records what is **actually verified**, not the hoped-for 20/20 outcome.

## User-supplied DLL
- Filename: `swedll32.dll`
- SHA-256: `915c9d66188d192dfc417b251fc5da591214aa1bdf793645b6881ba0e3ec8bc8`
- Size: 495616 bytes
- File type: 32-bit Windows Intel i386 PE DLL, timestamp 2012-09-11 12:36:32 UTC.
- Export symbols observed: `_swe_calc_ut@24`, `_swe_calc@24`, `_swe_houses@36`, `_swe_houses_ex@40`, `_swe_get_ayanamsa@8`, `_swe_version@4`.
- No runtime `swe_version()` result established; 2012 compile timestamp **does not determine** numeric Swiss engine version.
- This uploaded executable is **not** included in repository; do not commit, load, invoke, or install an untrusted downloaded binary to execute JHora production.
- Original JHora 8.0 release notes identify Swiss Ephemeris **2.02.01**, JPL DE431: https://vedicastrologer.org/jh/update_8.0.htm. Therefore matching source **DLL hash** from the JHora installation is required; a same-name DLL from ZET / forum is not authoritative.

## External research triage
- https://github.com/aloistr/perl-sweph is a Perl binding to Swiss Ephemeris and at its README reports 2.10.03. It is useful as an independent language ABI consumer, **not an independent ephemeris oracle** nor a copy of JHora's historical DLL.
- https://astrozet.net/forum/viewtopic.php?t=565 discusses ZET 8 updates, including replacement of `swedll32.dll` from 2008. This is for **ZET**, not JHora 8, and does not attest exact JHora method/version.
- https://github.com/normalmystic/JHoraKit/blob/main/JHoraInternals.md documents JHora's Win32 DLL imports and INI settings; a source for investigating provenance, not proof of mathematical identity.

## Remaining precise blockers
- Case JQA3-12 Lagna -1.0191374 arcsec, 19/20 within strict 1 arcsec.
- Case JQA3-03 Moon +1.05882798 arcsec, JQA3-04 Moon -1.06090515 arcsec, 18/20.
- Vimshottari source selected `YearDefinition=0 3` remains unmapped to documented source-year algorithm; exact UTC instants are unavailable in YYYY-MM-DD captures. Best 12-candidate historical scan only 43/180 major and 340/1620 minor date matches.
- The candidate 2012 `swedll32.dll` was inspected **statically**; no calculation comparison has yet demonstrated a corrected production algorithm. Consequently full `jqa3:certify` remains NOT_CERTIFIED.

## Controlled next test on trusted original JHora installation
1. Run `powershell -ExecutionPolicy Bypass -File tools/jqa3-inspect-user-dll.ps1 -DllPath 'C:\path\to\swedll32.dll'` on the user's Windows machine (metadata only, safe, no DLL execution). It checks PE headers, hash, Win32 version resources and compares with original installed `Jagannatha Hora\bin\swedll32.dll`.
2. If hashes differ, **do not overwrite** JHora DLL. Use the authentic application's own signed/pinned DLL within a controlled Windows VM, calculate JQA3-03, 04, 12, and preserve raw output.
3. For actual old-versus-new numerical comparison, write a small 32-bit Windows harness invoking the **trusted installed** DLL `swe_version`, `swe_calc_ut`, `swe_houses` plus historical flags, with pinned test vectors and files; compare across 20 independently exported original JHora fixtures. If not the same executable provenance, classify as third-party diagnostic, not source oracle.
4. Identify JHora YearDefinition=3 by named GUI option + held-out capture. Reconcile exact local civil days and astronomical instants separately. Do not assume YearLength field selects the active definition.
5. After independent source-method convergence, update production engine, version historical user snapshots, rerun `npm run jqa3:doctor`, `npm run jqa3:certify-signs`, strict `npm run jqa3:certify` and all CI.

## Acceptance
Do not change the 20 raw JHora exports, 1.0000 arcsec threshold, or undocumented year mode status to force PASS.
A healthy engineering CI is not the same as exact-precision certification.
