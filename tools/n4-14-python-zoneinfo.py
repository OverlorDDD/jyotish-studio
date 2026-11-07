#!/usr/bin/env python3
"""N4.14: isolated Python/IANA timezone differential, NEVER legal-time certification.

Windows usually has no system IANA zone database. Require the pinned CPython
maintained tzdata wheel and ignore OS search locations to keep test provenance
the same on Windows and Linux. Install via tools/n4-14-python-requirements.txt.
"""
import datetime as dt
import json
import sys
import importlib.metadata
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError, reset_tzpath

PINNED_TZDATA = "2026.6"
UTC = dt.timezone.utc
CORPUS = [
    ("Etc/UTC", 0), ("Europe/Kyiv", 120), ("Europe/London", 0),
    ("Europe/Paris", 60), ("Asia/Kolkata", 330), ("Asia/Kathmandu", 345),
    ("Asia/Tokyo", 540), ("Asia/Dubai", 240), ("Asia/Tehran", 210),
    ("Africa/Johannesburg", 120), ("America/New_York", -300),
    ("America/Los_Angeles", -480), ("America/Phoenix", -420),
    ("America/St_Johns", -210), ("Pacific/Honolulu", -600),
    ("Pacific/Auckland", 780), ("Pacific/Chatham", 825),
    ("Pacific/Apia", 780), ("Australia/Adelaide", 630),
    ("Australia/Eucla", 525),
]

def candidates(local, zone):
    tz = ZoneInfo(zone)
    found = {}
    for fold in (0, 1):
        aware = local.replace(tzinfo=tz, fold=fold)
        utc = aware.astimezone(UTC)
        if utc.astimezone(tz).replace(tzinfo=None) == local:
            found[utc.isoformat()] = utc
    return sorted(found.values())

def main():
    try:
        version = importlib.metadata.version("tzdata")
    except importlib.metadata.PackageNotFoundError:
        raise RuntimeError(
            "N414_TZDATA_MISSING: run python -m pip install "
            "-r tools/n4-14-python-requirements.txt"
        ) from None
    if version != PINNED_TZDATA:
        raise RuntimeError(
            f"N414_TZDATA_VERSION_MISMATCH: expected {PINNED_TZDATA}; "
            f"found {version}; install tools/n4-14-python-requirements.txt"
        )
    reset_tzpath([])  # require the pinned Python tzdata wheel on every OS
    local = dt.datetime(2024, 1, 15, 12)
    try:
        for zone, offset in CORPUS:
            matches = candidates(local, zone)
            expected = (local - dt.timedelta(minutes=offset)).replace(tzinfo=UTC)
            assert matches == [expected], (zone, matches, expected)
        for d, t, expected in [
            ("2024-03-31", "03:30", 0),
            ("2024-10-27", "03:30", 2),
            ("2024-01-15", "12:00", 1),
        ]:
            when = dt.datetime.fromisoformat(d + "T" + t)
            assert len(candidates(when, "Europe/Kyiv")) == expected, (d, t)
    except ZoneInfoNotFoundError as exc:
        raise RuntimeError("N414_TZDATA_CORRUPT_OR_UNAVAILABLE") from exc
    transitions = json.loads(
        Path(__file__).with_name('n4-14-transition-fixtures.json').read_text('utf-8')
    )
    if transitions.get('authority') != 'IANA_DIAGNOSTIC_ONLY_NOT_LEGAL_TIME_CERTIFICATION':
        raise RuntimeError('N414_HISTORICAL_EVIDENCE_PROVENANCE_INVALID')
    if len(transitions.get('fixtures', [])) != 25:
        raise RuntimeError('N414_TRANSITION_FIXTURES_INCOMPLETE')
    expected_counts = {'GAP':0,'UNIQUE':1,'FOLD':2}
    for case in transitions['fixtures']:
        when = dt.datetime.fromisoformat(case['date'] + 'T' + case['time'])
        matches = candidates(when, case['zone'])
        assert len(matches) == expected_counts[case['expected']], case
    print(json.dumps({
        "status": "N414_PYTHON_ZONEINFO_DIFFERENTIAL_DIAGNOSTIC_PASS",
        "zones": len(CORPUS),
        "kyivGapFoldUniqueChecks": 3,
        "transitionFixturesChecked": len(transitions['fixtures']),
        "timeZoneLawIndependentlyCertified": False,
        "implementation": "Python zoneinfo with pinned tzdata wheel",
        "tzdataVersion": version,
        "python": sys.version.split()[0]
    }))

if __name__ == "__main__":
    main()
