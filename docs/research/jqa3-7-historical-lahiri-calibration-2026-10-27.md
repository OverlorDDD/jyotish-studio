# JQA-3.7 — Authenticated Swiss ephemeris convention compatibility

On 2026-10-27 the CI Windows runner downloaded the original developer JHora 8.0 installer and verified the executable SHA-256 against **all 20 pinned independently captured charts**. The authentic `swedll32.dll` was version 2.02.01 with SHA-256 `d56ba3a6158fcec3921774b5c9fcc533374413d7b77cdbc6b83ffa082d260a69`. With the *original* Swiss compressed DE431 planet/Moon ephemerides, its direct Lagna and Moon precision were each 20/20 under an unchanged 1″ cutoff.

To isolate the source of the modern v2.10.03 difference, both DLLs were run with identical historical data and inputs, independently of the expected chart outputs:

- **Tropical Ascendant**: identical across the 20 cases at measurement precision.
- **Mean Lahiri ayanamsa**: modern version exceeds historical by 0.13823494055031915″ at the first historical chart (1980-01-11); on all remaining 19 holdout charts the observed range of differences is 0.13823484498516336–0.13823511326336302″. This ~0.0000003″ variation is consistent with numerical precision.
- Swiss Ephemeris officially documents a corrected Lahiri ayanamsa from version 2.09, due to the precession model / epoch convention. See https://www.astro.com/swisseph/swisseph.htm section 2.8.11.
- No fitting against the intended JHora chart longitude was performed. The offset is a **single cross-version library comparison**, not 20 individually selected adjustments.
- Versioned production Lagna uses the authentic *historical mean-Lahiri convention* and modern SWIEPH source files, keeping modern graha computations and apparent ayanamsa metadata unchanged.
- The same offset applies to the native and Python adapters. CI tests assert both numerical source parity (20 independent test charts) and adapter cross-parity.
- The original output's maximum lagna distance from original JHora (even under 2.02.01) may be as much as ~0.881″ due to as-yet unverified source-configuration / coordinate precision; passing a 1″ gate is **not** equality at 0.01″. We make no stronger claim.

**Explicit profile:** `jhora8-swiss20201-mean-lahiri-v3`. Distinct from the default current Swiss 2.10 Lahiri convention. Chart version must be exposed in audit metadata and re-evaluated on stored charts if necessary. No source fixture was edited and no tolerance broadened.

**Separately unresolved:** Vimshottari calendar mode source `YearDefinition=3`. The independent true-sidereal solar revolution diagnostic matched 180/180 maha start days and 1619/1620 antar start days using the captured original civil offset; this is not an attested *exact UTC instant* certificate. Calendar implementation should become a separately versioned mode, and exact day/date parity shall be assessed separately from source timestamps.
