# N4.12 — Original JHora 8 coordinate input encoding repair (2026-11-06)

## Real author Windows binary evidence
Owner synthetic source #002 was generated with intended W 143°55′48″ and S 46°05′24″ (decimal -143.9300, -46.0900).
Old input JHD stored longitude 143.554800 and latitude -46.052400; genuine JHora8 exported 143 W 55'29" and 46 S 05'14".
Therefore older third-party JHoraKit D.MMSS00 coordinate packing was not interpreted by original app as intended degrees/minutes/seconds.
The original app behaved as if using DECIMAL arcminutes: 143.554800 means 55.4800 arcminutes -> 55'28.8".

## Correction
The new generator emits D.MMmmmm decimal minutes: 143.558000 for 143°55′48″, -46.054000 for 46°05′24″.
Inputs for #002–050 must be recreated in a FRESH isolated workspace; old outputs are untouched. Source #001 uses integer coordinates and is unchanged.
Tests assert corrected source #002 exact packed fields. Verify predicted original JHora interpretation on corrected #002 in original Win32 GUI before automatic bulk.

## Owner batch architecture
A stand-alone Galaxiora_N412_JHora_Auto50_v1.zip created in conversation provides Windows PowerShell supervisor, pinned official portable AHK v1.1 driver and pure Node source verifier.
The automation verifies original app SHA, outputs per-case original GUI main and divisional clipboard, source date/time/tz and TRUE original printed geometry within 1.1 arcsecond.
It checks 160 method-aware symbolic D signs per case using JHora own exact D1 positions, no synthetic oracle values, and rejects every mismatch. D2 GUI method US means Uma-Shambhu Hora, D60 uses original Trd.
First corrected #002 must pass, user approves continuing unattended #003–050. No manual 48-chart copying, no overwritten user data, no forced termination of existing JHora.
Exactly 49 corrected raw case captures would combine with pre-existing original #001 into 50 original sources. Arithmetic release gate is STILL OFF pending complete independent Galaxiora-vs-JHora ephemeris/time/ayanamsa and D60 uncertainty verification.

Observations are based on owner-supplied original JHora 8.0 output, not external site descriptions. Production not touched.
