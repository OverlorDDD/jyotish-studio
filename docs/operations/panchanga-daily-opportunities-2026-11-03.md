# P4.10 — What to do today and when? · one-release implementation

**Base:** vetted Panchanga release branch `release/panchanga-p36-production-acceptance-20261102` at commit `130af372225bf7543f4117fcb34c7947a49cb0cb`, which already includes P3.8.8 / P3.8.9 / P3.9. This change is intentionally **not based on `main`**, which has a divergent history and fewer files.

## Visitor contract

The Day screen opens with **"Що краще робити сьогодні й коли? / What is good to do today — and when?"**, not a 25-item list or an unsourced 53% indicator.

- Top 1–3 distinct actionable opportunities, UTC-backed start and end expressed in the selected city's **IANA** timezone and offset; each has an explicit classical explanation and .ics download. All public suggestions are available without signing in.
- Tomorrow changes the selected **civil date**; 7 days opens the existing 7-day calendar (with date drilldown back to the guide). Date / city / Today and the 5-limb technical details remain intact.
- Personal-owned natal context is fetched only through `/api/v1/personal/panchanga/resonance` with same-origin credentials, `no-store` and P3.3 identity validation. It is an **additional lunar accent**, not a hidden hard prerequisite for public advice. A failed private check does not block the public guide. Birth details are never embedded in public guide data.
- The 25-activity personal Time Finder and incomplete special ceremonies are preserved in a **collapsed, explicitly named advanced section**. P3.9's internal screening heuristic is left available to its existing private ranking backend but **percentage rings / scores are removed from both user-facing Day and specialist screens**.
- No automatic claims of complete wedding/foundation muhurta or of guaranteed personal outcomes. Exactly selected activity-specific P3.8 exclusions remain active.

## Calculation choices

The guide reuses the existing verified Swiss/Lahiri `/api/v1/panchanga/day` response — no second astronomy stack, no separate current-vs-natal calculation.

| Component | Rule | Source / limitation |
|---|---|---|
| Choghadiya | 8 equal **solar-day** slots sunrise→sunset; 8 separate night slots sunset→**next sunrise**. Seven-day starts and rotating order explicitly pinned, including a distinct night cycle | [Drik Panchang Choghadiya](https://www.drikpanchang.com/tutorials/muhurat/daily/choghadiya-muhurat.html?lang=en) |
| Hora | 12 unequal daytime hours + 12 unequal night hours; weekday lord first, traditional Sun→Venus→Mercury→Moon→Saturn→Jupiter→Mars sequence | [Drik Panchang Hora](https://www.drikpanchang.com/muhurat/hora.html) |
| Adverse intervals | Exact Rahu Kalam, Yamaganda, Gulika, and Drik Vaar Vela, Kaal Vela, Kaal Ratri excluded from everyday **new-start recommendations** | [Drik guidance](https://www.drikpanchang.com/tutorials/muhurat/daily/choghadiya-muhurat.html?lang=en) |
| Five limbs | UTC segment boundaries at verified tithi / nakshatra / yoga / karana transitions, and P3.8 activity-specific exclusions | Existing Swiss five-limb engine + canonical P3.8 register |
| Abhijit | Eighth 1/15 of *daylight*, not fixed noon, with Wednesday excepted by chosen convention | [Drik Panchang](https://www.drikpanchang.com/muhurat/daily/abhijit-muhurat.html); presented as an informative traditional window, not blanket permission |
| Brahma Muhurta | Final two *variable* nighttime muhurtas: end is one night/15 before next sunrise, start two night/15 before; night is actual sunset→next sunrise, not fixed 96–48 min. Presented for meditation, not marriage or financial elections | [Drik Panchang Daily Panchang](https://www.drikpanchang.com/panchang/day-panchang.html) |

**Important boundaries:** A day can legitimately have no recommended start after the selected time; no score or fake 'good hours' is fabricated. Activity-to-Choghadiya mapping is source-backed for the *main suitability category*; matching Hora is supplementary context and never becomes a negative vote if unmatched. A general Choghadiya does not override a P3.8 hard activity-specific veto. Different traditional conventions exist; we pin one (Drik) and disclose it. No claim of independent Drik second-by-second Swiss parity without a captured city/date/coordinate/method control.

**After midnight:** A weekday's night ends at *the following sunrise*. If the selected observer's **today** is before sunrise, the browser obtains the prior local civil date's verified `/day` and joins its still-current night opportunities. The previous-day object is accepted only if its `nextSunriseUtc` equals today's `sunriseUtc` and zone matches. Missing/invalid data fails closed. IANA display distinguishes autumn DST repeated local wall-clock hours with offsets. A now-after-sunrise visitor sees only upcoming windows in the selected Vedic day; future dates show the day's full options.

**Limitations (not disguised as passing QA):**
- Full personalized ranking across every opportunity requires *individual, owner-scoped, same-instant* natal snapshots at each candidate; currently the guide displays a verified personal accent for **one selected sample**, while public windows remain non-personal. Private 7/30-day full-event certification stays the specialist Time Finder.
- Abhijit is not automatically merged with restricted weekday/election rules. The user sees it as an astronomy/tradition fact, with the Wednesday exception.
- The existing 7-day view is a calendar drilldown, **not yet a single batch-scored 7-day opportunity planner**. Users may open a day to receive exact advice.
- GA4 retained-visitor event instrumentation requires separate privacy/category audit; no fake conversion or invented retention improvement.
- At polar latitudes if verified sunrise/sunset is unavailable, the guide fails closed rather than computing 24-hour equal chunks.
- Public production's Swiss Ephemeris dual-license obligations must be checked against actual distribution/AGPL compliance or upstream professional license before making additional claims of licensing clearance. Repository `package.json` and `NOTICE` currently declare AGPL-3.0-only. See [Swiss Ephemeris](https://www.astro.com/swisseph/).

## Acceptance and regression gates

`npm run test:p410` exercises all seven weekday day/night table starts, 16 Choghadiya/24 Hora continuous boundaries, real Swiss Kyiv 7 days × activity distinctions, hard Rahu/Yama/Gulika veto, Choghadiya/Swiss-panchanga variation, unequal day/night lengths and DST at Kyiv, plus Delhi and New York, Brahma/Abhijit and fail-closed missing source inputs.

`npm run test:panchanga` preserves the fast self-contained P3.1–P3.9 suites. Separate `npm run test:p410` runs the real Swiss sunrise/daytime integration tests only in CI jobs that explicitly install PySwissEph 2.10.03 (and at operator deployment), rather than breaking fast CI jobs with no astronomy dependencies. The P3.8.8 independent CI additionally runs `npm run build` and source-crosscheck, the existing P3.8.6–P3.8.9 browser tests, and new `e2e/panchanga-daily-opportunities.spec.mjs` UA/EN on 320px and 390px, calendar export, next-day and week navigation, owner-private API guest 401, and specialist mode availability. It also checks galaxy logo #6, R4.3 SEO, isolated disposable DB backup/restore and start-up. **No CI job has AWS deploy credentials.** Status is determined by GitHub Actions on the exact eventual merged release commit — writing a test does not constitute a PASS.

## Operator-only guarded release from PowerShell / EC2

1. Review and **merge this feature PR into the vetted release branch by a merge commit** (not a squash/rebase). Do **not** merge it into divergent `main` or change live `.env`, Caddy, database or logo while doing this.
2. Confirm **all** GitHub Actions are green on the *exact merged SHA* on `release/panchanga-p36-production-acceptance-20261102`. If red, stop, amend via PR and rerun; never use an earlier feature SHA as proof of release safety. Do not change AWS if any P388 independent, protected-browser, brand or SEO check is red.
3. Connect to your *current* EC2 IP (AWS Console, not an old address): `ssh -i "$env:USERPROFILE\.ssh\galaxiora-aws-key.pem" ubuntu@<CURRENT_EC2_IP>`. Work inside the SSH Bash shell, not Windows PowerShell.
4. **Read-only inspect**, use `git -C /opt/galaxiora/app status --short` and `sudo systemctl status galaxiora-web galaxiora-api --no-pager`. Any tracked changes, unexpected local differences, insufficient disk/RAM or mismatched branch ancestry are a NO-GO; never `reset --hard`.
5. On EC2:
   ```bash
   cd /opt/galaxiora/app
   git fetch --no-tags origin refs/heads/release/panchanga-p36-production-acceptance-20261102
   TARGET_SHA=$(git rev-parse --verify 'FETCH_HEAD^{commit}')
   git cat-file -e "$TARGET_SHA:tools/panchanga-p388-release.sh"
   git show "$TARGET_SHA:tools/panchanga-p388-release.sh" > /tmp/galaxiora-p388-release.sh
   test -s /tmp/galaxiora-p388-release.sh
   grep -Fq P388_PRODUCTION_RELEASE_VERIFIED /tmp/galaxiora-p388-release.sh
   bash -n /tmp/galaxiora-p388-release.sh
   bash /tmp/galaxiora-p388-release.sh diagnose
   export P388_TARGET_SHA="$TARGET_SHA"
   bash /tmp/galaxiora-p388-release.sh preflight
   ```
6. The `preflight` makes the **independent live GitHub same-SHA CI decision**, verifies clean tracked checkout, ancestry, service health and working backups before any mutation. Only if all gates pass and the operator chooses the release:
   ```bash
   export P388_CI_ATTESTED_SHA="$P388_TARGET_SHA"
   export P388_APPROVAL=I_APPROVE_P388_PRODUCTION
   bash /tmp/galaxiora-p388-release.sh deploy
   ```
   The script backs up private live state, installs/builds the **pinned** code, runs tests, performs migrations as required, restarts only API/Web, and verifies HTTPS/health. It does not edit Caddy or production news/indexing configuration. It implements code-only rollback on failure.
7. Final manual acceptance: `https://galaxiora.com/uk/panchanga`, `https://galaxiora.com/en/panchanga` on 320/390px; confirm diverse activities + exact hours + no percentages; tomorrow, 7 days, .ics calendar, expanded 16+24 technical entries; observer Kyiv vs Delhi and DST. Verify personal verified natal in a signed-in session and a separate guest, with no cross-account cache. Ensure News/GA4/admin/auth/SEO/brand unaffected. Check server commands `npm run site:check`, `npm run launch:verify`, `npm run r32:seo:audit` as applicable to live env.

**Rollback:** The guarded script supports `bash /tmp/galaxiora-p388-release.sh rollback` only with required explicit rollback approval (read the script's header and exact env variable names); code revert does *not* restore/downgrade database. Do not try a blind DB restore or destructive git reset.

**Operational truth:** Until merged-SHA CI, guarded deploy and live mobile checks pass, feature state is **code delivered to GitHub, production not certified**.
