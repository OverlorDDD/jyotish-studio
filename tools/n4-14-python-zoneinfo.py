#!/usr/bin/env python3
"""N4.14 second-runtime zoneinfo verification. Read-only diagnostic, not law-certified."""
import datetime as dt
import json
import sys
from zoneinfo import ZoneInfo

UTC = dt.timezone.utc
CORPUS = [
    ("Etc/UTC",0),("Europe/Kyiv",120),("Europe/London",0),
    ("Europe/Paris",60),("Asia/Kolkata",330),("Asia/Kathmandu",345),
    ("Asia/Tokyo",540),("Asia/Dubai",240),("Asia/Tehran",210),
    ("Africa/Johannesburg",120),("America/New_York",-300),
    ("America/Los_Angeles",-480),("America/Phoenix",-420),
    ("America/St_Johns",-210),("Pacific/Honolulu",-600),
    ("Pacific/Auckland",780),("Pacific/Chatham",825),
    ("Pacific/Apia",780),("Australia/Adelaide",630),
    ("Australia/Eucla",525),
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
    local = dt.datetime(2024, 1, 15, 12)
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
        assert len(candidates(when, "Europe/Kyiv")) == expected, (d,t)
    print(json.dumps({
        "status":"N414_PYTHON_ZONEINFO_DIFFERENTIAL_DIAGNOSTIC_PASS",
        "zones":len(CORPUS),
        "kyivGapFoldUniqueChecks":3,
        "timeZoneLawIndependentlyCertified":False,
        "implementation":"Python stdlib zoneinfo",
        "python":sys.version.split()[0]
    }))

if __name__ == "__main__":
    main()
