# Galaxiora JQA-3.2 — Genuine Jagannatha Hora 8.0 source corpus recovered (2026-10-23)

## Verified scope: **JQA-3.2 ORIGINAL EVIDENCE COMPLETE — not numeric certification**

On 2026-10-23, CI run [39983675743](https://github.com/OverlorDDD/jyotish-studio/actions/runs/39983675743)
replayed the archive of the **actual JHora 8.0 Wine/AutoHotkey run**
[39962145837](https://github.com/OverlorDDD/jyotish-studio/actions/runs/39962145837).
The pinned artifact is `jqa3-real-jhora-8-raw-evidence` (ID 12505264277,
GitHub SHA-256 b937a0d9d7ccffda36cc3079fc608d8471b87855626cc588111e4b50d7924c0f).
The original JHora executable SHA-256, retained for evidence without distributing the proprietary binary, is
`3ddbe5fb0458ad1f0ad91b002c7efb8bba9f08891d3f46190aba97d570b17908`.

- **20 unique authentic JHora clipboard exports** `jqa3-01` through `jqa3-20` are now committed in `tests/fixtures/jhora-corpus/captures/<id>/`.
- Each has `chart_data.txt`, `divisionals.txt`, `input.jhd`, `jhora.ini`, `capture.json`. The original short JHora distribution emits 56 rather than the upstream JHoraKit full-parser's expected 71 planet records. The narrow original-data parser accepts the genuine ten required planets without inventing any others; `chart.json` is absent when the third-party full parser fails, and the manifest does not claim the missing file.
- 20 independently recorded `chart_data.txt` SHA-256 digests are distinct. **All 12 signs of lagna** are represented by originals jqa3-01 ... jqa3-12, with eight additional independent cases.
- Each recovered original has real JHora D1, D9, D10 tables; 9 recorded mahadashas and 81 recorded antardashas.
- Original source files are never newline-normalized or stripped of trailing spaces. The imported JSON manifests are Git SHA-pinned and verify raw SHA-256 on every read.
- The manifest now contains **21 external source records**: 20 with saved INI plus one earlier public Gandhi source **without** its original INI (not counted as attested).
- `docs/research/jqa3-2-recovered-evidence.json` contains machine-readable original-source identifiers, checksums, covered lagna signs, and limitations.

### Previously hidden importer defects resolved
1. JHora writes hours as `0:20:00` whereas the capture metadata uses `00:20:00`: validated field-wise equality replaces erroneous string equality. This does **not** loosen a different-hour/date rejection.
2. JHora records GMT zero as `0:00:00 (West of GMT)`: JavaScript's `-0` and `+0` are mathematically the same offset. Other offset differences still fail.
3. Text tables contain intentional trailing spaces (ASCII diagrams); these bytes must remain unchanged, and therefore are excluded from Git's JSON whitespace check.
4. Corpus regression tests now support expansion beyond the original one-record placeholder, without erasing the historical Gandhi reference.

### Explicit limitations: **JQA-3 CERTIFIED remains false**
- A saved INI is original evidence of settings, but the archive does **not** separately attest the exact Vimshottari dasha-year selection inside JHora's settings UI. We preserve `dashaYearVerified:false` and do not turn `YearLength=0 365.242500` alone into a certified year mode.
- Exactly matching ayanamsa identity, mean nodes, D10 variant, sidereal ascendant convention, ephemeris backend, and all numeric results for each chart is **the subsequent JQA-3.3 task**. Source provenance alone does not prove Galaxiora/JHora numerical equality.
- Some requested decimal coordinates are quantized/encoded by the third-party JHoraKit JHD builder. For each record we compare against the coordinates actually read back from JHora, not the originally requested decimal coordinate. The chart's numerical comparison must use its actual source coordinates.
- `npm run jqa3:certify` is intentionally fail-closed. This is a feature, not an acceptance failure for JQA-3.2.

### How to check
```powershell
git pull --ff-only
npm run test:jqa3:corpus
npm run jqa3:audit
```

For original provenance use the committed `capture.json` and `jhora.ini` under each capture, and the pinned `manifest.json`. **Do not rerun the one-time artifact re-import on a nonempty corpus**; original evidence is immutable.
