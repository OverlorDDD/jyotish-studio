# JQA-3 final acceptance lock

**Current decision: NO MANUAL SITE ACCEPTANCE.** The normal unit/build/DB/browser CI validates engineering integrity only; it is not independent numerical certification.

Manual Galaxiora user acceptance is enabled **only after**:
1. `npm run jqa3:certify` succeeds with a pinned corpus of at least twelve distinct authentic JHora 8.x exports, each with original JHora INI, raw clipboard results, exact UTC and executable provenance, covering all twelve lagna signs.
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

Until the independent release gate is green, **do not ask the owner to test manually**.
