Fonts for server-rendered share images (opengraph-image routes).

- `Inter-Bold.otf`, `Inter-Medium.otf`: subsets (Latin, Cyrillic, punctuation) of Inter by The Inter Project Authors, SIL Open Font License 1.1 — see `OFL-1.1-Inter.txt`. Copyright 2016-2023 The Inter Project Authors.
- `DejaVuSans-zodiac.ttf`: subset (zodiac signs U+2648–U+2653, digits, + and %) of DejaVu Sans, Bitstream Vera / DejaVu public license (free to use, modify and redistribute; see `LICENSE-DejaVu.txt`).

Subsets were made with fontTools `pyftsubset`; the default `next/og` font has no Cyrillic.
