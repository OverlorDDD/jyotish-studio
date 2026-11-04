# Galaxiora Horoscope Editorial v3 — daily voice, lunar continuity and forum disclosure UX (2026-10-27)

## Incident root cause and permanent regression guard
`readPublicSign()` originally selected the entire reading solely by whole-sign house from the natal Moon. Because the Moon takes roughly 2–2.5 days per sidereal sign, adjacent days with the same lunar sign had byte-identical headlines, descriptions, actions and cautions. Moon nakshatra/pada data was present only in evidence, not in the editorial selection.

Fixed with separate layers:
- Astronomical facts remain exclusively computed from Swiss Ephemeris / Lahiri: natal Janma Rashi, transit sign and house, nakshatra, pada, sampled UTC instant.
- Twelve established house themes remain explicitly traditional general interpretations, not claims about a user's life.
- A deterministic, separately identified calendar-date editorial cycle selects among **48 UA/EN house-specific active suggestions**. A date-cycle does not signify a planetary event or interpret a pada. Description, focus and caution change on adjacent days; the underlying sky is not fabricated.
- `verifyLunarContinuity()` validates approximately plausible daily longitudinal movement (broad 5°–20° per day) for public-week and Personal-calendar data. A suspicious repeated celestial snapshot yields an unavailable response, never a fake new forecast.
- Regression test asserts no exact adjacent descriptions, focus or caution for all 12 reference signs across 32 dates; invalid date/pada is rejected.
- The natal daily orientation remains separate and fact-grounded. Its 12 conditional life-case texts are retained.

## GalaxiCom disclosure fix
All toolbar tools now share one `activePanel` state. Buttons remain fixed in their original two aligned CSS grid rows. Notifications and moderator queue display under the toolbar. Safety / Trending / Bookmarks / Profile use React portals to mount their forms and listings into the same panel container; clicking another button automatically unmounts the previous panel. Clicking the active tool again closes it. Accessibility: real buttons, aria-expanded, aria-controls, preserved focus order, clear panel boundaries.

## Browser identity
Galaxiora `app/icon.svg`: high-contrast geometric gold compass star, moon crescent and orbit on a navy rounded background. Metadata explicitly exposes SVG icon/shortcut at /icon.svg. Render vector artwork legibly at small tab sizes, no external fonts or licensing.

## Writing policy
Write UK/EN like a thoughtful, experienced guide: direct action verbs, a recognisable optional real-life situation, practical next step, gentle alternative when the problem doesn't apply. Never assert jobs, spouse, children, illness, financial trouble or a guaranteed event without facts. Keep classical meanings and editorial variation separate, and do not present the date-index as astrology. Proofread morphology, grammar and case agreement. Avoid abstracts such as "align your resources", "reflect on productivity" and ungrounded "you are overwhelmed". Do not churn copy merely to simulate a new celestial transit.

Research principles:
- Google style, voice and tone: https://developers.google.com/style/tone
- Material UX Writing: https://codelabs.developers.google.com/codelabs/material-communication-guidance
- Nielsen Norman Group: https://www.nngroup.com/articles/3-cs-microcopy/
- CHANI updates and separate astrological scales: https://chaninicholas.zendesk.com/hc/en-us/articles/4406728790419-When-CHANI-content-updates

## Acceptance
Run CI and verify desktop 1440, tablet 1024, mobile 375/320. Verify every day in Personal Horoscope Week has a distinct actionable focus, and Janma Rashi remains the same natal source. Open all forum tools successively: original buttons must not shift X/Y, only one detail visible in the shared panel below. Verify Ukrainian / English translations and keyboard focus. Check /icon.svg loads as an image and the browser tab shows it after cache refresh. Existing JHora 1-arcsecond and Vimshottari exact-date certification work is separate.
