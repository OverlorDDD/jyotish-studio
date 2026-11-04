# N4 · Direct JHora 8.0 export: verified convention differences

This is a real direct JHora 8.0 export made available by the independently maintained [JHoraKit project](https://github.com/normalmystic/JHoraKit), **not** a Galaxiora-generated reference. Its [sample-data README](https://github.com/normalmystic/JHoraKit/blob/main/sample-data/README.md) documents the JHora clipboard capture and the full machine-readable `chart.json` output.

*Examined on 2026-11-04.* Source: `normalmystic/JHoraKit/sample-data/Mahatma_Gandhi/chart.json` (one historical published example, not included or copied into Galaxiora). The source record uses its **own** JHora calculations/preferences and ayanamsa; our comparison remaps its original JHora-exported D1 sidereal longitudes using the N4 Galaxiora pinned Parashari definitions. The outputs are compared on **1 Lagna + 9 named grahas** per varga. This is a source-vs-method comparison and **does not measure sidereal ephemeris or birth-time errors**.

| Varga | JHora signs different from Galaxiora pinned profile (out of 10) |
|---|---:|
| D1 | 0 |
| D2 | **10** |
| D3 | **9** |
| D4 | 0 |
| D7 | **4** |
| D9 | 0 |
| D10 | **3** |
| D12 | 0 |
| D16 | **5** |
| D20 | 0 |
| D24 | **5** |
| D27 | 0 |
| D30 | 0 |
| D40 | 0 |
| D45 | 0 |
| D60 | **8** |
| **All 16 × 10** | **44 different / 116 matching** |

**Do not present 116/160 as a certification score or as evidence the astrology calculations are wrong.** This JHora example did not record a machine-verifiable proof that its selected divisional options match N4. JHora offers multiple variants for Hora, Drekkana, Dashamsha, Shodasamsha and other vargas. The [JHoraKit internal preference analysis](https://github.com/normalmystic/JHoraKit/blob/main/JHoraInternals.md) documents how JHora 8.0's author-recommended settings can differ from traditional forward-counted Parasara, including D2, D10 and D60.

The 44 disagreements are **unexplained until explicit profile alignment is independently validated**. A suspected conventions mismatch must not become a self-certified resolution. The N4 gate remains **fail-closed**, especially for D60; a second comparison using independent PyJHora explicitly selected methods is useful but is NOT a direct JHora 8 certification.

## Preferred certification protocol

1. Prepare 50 **synthetic** complete birth-date/time/location profiles with a documented offset, DST reference and intentionally diverse boundary positions.
2. Run JHora 8.0 under a pinned calculation INI. For each varga, record the selected divisional option, ayanamsa, physical node type, and full exported D1 longitudes. The same physical D1 input must be compared to Galaxiora; do not mix two ephemerides.
3. Capture the original `divisionals.txt` or equivalent via an extraction path such as JHoraKit. Keep provenance + source hash and the outputs per 10 bodies. Different body-name or format conventions require explicit conversion.
4. Compare every `D1,D2,D3,D4,D7,D9,D10,D12,D16,D20,D24,D27,D30,D40,D45,D60` sign for each profile: 50 × 16 × 10 = **8,000**. Tolerate no unexplained sign mismatch. If a method option differs, resolve it explicitly before counting a case as certified.
5. Distinguish **varga rules certification** from absolute physical longitude precision and Vimshottari year-mode/day certification. Those are separate JQA3 gates.

Until this protocol completes: labels such as `internal_rules_only_external_reference_pending` must remain accurate, the N4 AI extension must stay default-off, the existing D1/D9/D10 and Reader v6 results must remain unchanged.

## 2026-11-04 additional automated evidence

- Authenticated single public original JHora 8.0 chart export `normalmystic/JHoraKit@f63826b501eabe69c6b08c5365875e1e2f74c24a` / `sample-data/Mahatma_Gandhi/chart.json`. Git blob SHA-1 pinned to `abf3afd4cab0f11f8431ff193543d2ec18ec7cc3`. New test `tools/n4-jhora-public-sample.test.mjs` asserts the complete 16 × 10 convention-drift matrix stays at 44 out of 160 mismatches, not that this single case certifies any rules.
- New independent PyJHora 4.8.7 50-profile/8,000-position job tests **separately selected matching methods**, verifies the installed package release using Python distribution metadata, and keeps the package out of Galaxiora production. Earlier failures were (1) undeclared Python `dateutil` dependency and (2) upstream import-time stdout diagnostics before machine-readable JSON; both instrument defects have been corrected. Final run confirmation remains separate.
- An actual original 50-case JHora 8.0/AHK/JHoraKit capture workflow exists and was **executed**. GitHub Actions runner reached Wine initialization successfully but the publisher's official download domains repeatedly returned **HTTP 406**, before installation or any 50-case calculation. A retry including the publisher-owned alternate host also returned 406. Consequently **zero** original same-profile 50-case certifications have been earned. Do NOT count these runs as mathematical mismatches or successful independent certification.
- JHoraKit source author preset is visibly different: for example `HoraPreference=6`, `D3Preference=4`, `D7Preference=1`, `D10Preference=4`, `D16Preference=1`, `D24Preference=0`, and `D60Preference=2`. Never compare these as identical to Galaxiora's pinned Sun/Moon-Hora and forward variants.
- The original 50-profile gate remains fail-closed. **Do not use unverified third-party installer mirrors**, invent JHora expected signs, mark the JHora test green, or enable N4 neural/personal features pending method-aligned evidence. Prefer genuine publisher-signed or provenance-verified JHora installation in an isolated environment when distribution access is restored.
