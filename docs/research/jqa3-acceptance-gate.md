# JQA-3 final acceptance lock

**Current decision (27 October 2026): FULL SCOPED JQA-3 `CERTIFIED` for the 20 original JHora 8.0 charts: 600/600 D1/D9/D10 signs, 200/200 longitudes within 1 arcsecond, 180/180 Mahadasha printed civil dates and 1620/1620 Antardasha printed civil dates.** The strict full certifier and separate native SWIEPH calendar gate both PASS in the `test` GitHub Actions job of [run 40548240052](https://github.com/OverlorDDD/jyotish-studio/actions/runs/40548240052). That run's **overall** conclusion was FAILURE from four outdated mocked browser fixtures, not any JQA-3 failure. The original JHora source exports only printed civil dates; exact UTC boundary seconds, original GUI label for year mode 3 and every possible birth epoch are **not** certified. Browser UI and deployment acceptance remain separate.

**Visual design, navigation and content placement MAY be accepted independently** of numerical ephemeris certification. User acceptance of the *full Jyotish high-resolution/date parity claim* is enabled only after:
1. `npm run jqa3:certify-signs` and `npm run jqa3:certify` pass on the 20 original signed/pinned JHora 8.0 sources with captured INI, executable provenance and all twelve lagna signs. The latter requires subarcsecond numerical and printed date gates, not just D1/D9/D10 signs.
2. Same-method D1, D9, D10 and all ten raw longitudes match on every chart, including lagna and nodes, within the documented one-arcsecond tolerance.
3. Ten independent nakshatras and padas, seven classical-planet retrograde states, twelve house lords, nine Mahadashas and 81 Antardashas per case have explicit PASS with recorded source evidence.
4. Core and Python/Node Swiss adapter parity are independently checked, and existing persisted charts/interpretations are versioned or invalidated after any production calculation change.
5. `npm run test:all`, full Nest/Next build, PostgreSQL authorization/integration, API and real Chromium E2E are all green.
6. The full source records and run IDs are pinned on a reviewed pull request and a release sign-off.

A green application CI alone must never remove `NOT_CERTIFIED` from the numerical result. Missing externally published house-lord values are not a reason to silently synthesize them from Galaxiora itself.

**After ALL these pass** (and not earlier), the owner should:
- Pull the signed-off release commit, launch the full stack using the repo runbook, open the Ukrainian/English Jyotish form and enter one known test case.
- Compare displayed D1, D9, D10, graha degrees and Moon nakshatra to the published signed-off example; inspect source/provenance in the UI.
- Verify deterministic Reader v6 text does not contradict source facts in Ukrainian or English.
- Verify anonymous access, authenticated save/reload, invalid birth time and DST-gap/fold errors, and responsive mobile layout.
- Accept only if exact observed output matches the signed-off acceptance snapshot; report differences with the request ID and no sensitive personal birth information.

The original printed-date and ±1 arcsecond comparison is **certified for the stated 20-record corpus**. Do not overstate it as certification of exact UTC boundary seconds, all epochs, unrelated JHora calculation modes, arbitrary user input or production deployment. If any new core method changes, rerun the independent full certifier and all browser gates before release. This does **not** prevent the owner from reviewing an independent visual UX update, nor prevent non-Jyotish feature development.
