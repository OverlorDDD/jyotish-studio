# N4.12: Windows PowerShell 5.1 encoding failure and mitigation
Date: 2026-11-06. Draft PR #120. No production changes.

The owner attempted Galaxiora_N412_JHora_Auto50_v1.zip on a Russian-locale Windows PowerShell 5.1 host. The script failed at parse-time, before any JHora process was run. The line `if($yes -notmatch '^(?i:y|yes|tak)$'){` in the developer source had the Cyrillic word for yes instead of ASCII `tak`.
Because the original .ps1 was UTF-8 without BOM, Windows PowerShell 5.1 interpreted its non-ASCII bytes in a legacy code page. The token became mojibake, followed by a cascade of missing closing quote and brace ParserError messages.

Fix supplied as Galaxiora_N412_JHora_Auto50_v2.zip (SHA256 6acc54f3e1563b5c3ee2222499588de1f80cfe0826b302a0360fd04c4b8d3a44).
- Main and wrapper PowerShell scripts as well as native AHK and Node sources consist only of ASCII bytes; UI instructions remain in a separate UTF-8 README.
- Confirmation is Y/Yes only. Non-confirmation stops after successfully validated synthetic #002, preserving data for resume.
- The bundled `run_auto50_checked.ps1` first parses the ENTIRE main `.ps1` with Windows PowerShell's own `System.Management.Automation.Language.Parser::ParseFile` before launching JHora or AHK. It also rejects any non-ASCII byte in executable source. A parse failure cannot trigger a JHora execution.
- Source INI discovery includes original official `jhcore/jhora.ini` path, with per-case calculation preference fingerprint checks.
- No destructive changes to JHora, original source evidence or production. The source author GUI is still required for genuine original JHora reference data; normalmystic/JHoraKit is a wrapper/strict parser, not original JHora math source code; PyJHora is independent implementation.

Windows GitHub Actions runs tools/n4-windows-powershell-parse-check.ps1 as a real Windows PowerShell 5.1 syntax and ASCII regression gate, also against an explicit ASCII-only Y/Yes code sample.
The exact full v2 batch script remains an owner-facing download artifact and is parsed by the owner's Windows interpreter via the bundled checked launcher. Until owner runs it, AutoHotkey/JHora GUI compatibility is unverified. The original mathematical certification remains 0/50, original source #001 and legacy geometry #002 available.

Other open blockers: original JHora8 correct decimal-minute geometry for corrected #002, 003–050 original raw capture, strict 50×16×10 source math and independent sidereal D1 ephemeris comparisons, exact Vimshottari, D60 temporal uncertainty. Do not merge N4 nor flip release flags.
