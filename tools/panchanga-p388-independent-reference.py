#!/usr/bin/env python3
"""P3.8.8 independent Python reference: pinned Swiss event ASC, plus astronomy
sampling using PySwissEph C bindings, NOT the Galaxiora TypeScript code.

No fallback to Moshier: real apparent planetary longitudes and sunrise checks
require actual sepl_18.se1/semo_18.se1 files and SWIEPH return flags.
Uses versioned 0.13823494055031915" historical mean-Lahiri offset ONLY to
make ASC match the explicitly documented JHora8 historical convention.
"""
from __future__ import annotations
import argparse
import csv
from datetime import datetime, timezone, timedelta, date, time
import json
import math
import os
from pathlib import Path
import sys
from zoneinfo import ZoneInfo
import swisseph as swe

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / "tests/fixtures/p388-independent-asc-30.tsv"
JHORA8_MEAN_SHIFT = 0.13823494055031915 / 3600
DAY = timedelta(days=1)

def angular_arcsec(a: float, b: float) -> float:
    return abs((a - b + 540) % 360 - 180) * 3600

def julian(dt: datetime) -> float:
    utc = dt.astimezone(timezone.utc)
    hours = utc.hour + utc.minute / 60 + utc.second / 3600 + utc.microsecond / 3600000000
    return swe.julday(utc.year, utc.month, utc.day, hours)

def sidereal_asc(dt: datetime, lat: float, lon: float) -> float:
    jd = julian(dt)
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    tropical = swe.houses(jd, lat, lon, b"P")[1][0]
    mean = swe.get_ayanamsa_ex_ut(jd, swe.FLG_SWIEPH | swe.FLG_NONUT)[1]
    return (tropical - mean + JHORA8_MEAN_SHIFT) % 360

def verify_pinned() -> int:
    rows = []
    for line in BASE.read_text(encoding="utf-8").splitlines():
        if line and not line.lstrip().startswith("#"):
            cells = next(csv.reader([line], delimiter="|"))
            if len(cells) != 7:
                raise ValueError("Malformed P388 reference row")
            rows.append(cells)
    if len(rows) != 30:
        raise ValueError("P388 independent 30-city reference is incomplete")
    for i, (instant, lat, lon, zone, asc, sign, local) in enumerate(rows, 1):
        dt = datetime.fromisoformat(instant.replace("Z", "+00:00"))
        calculated = sidereal_asc(dt, float(lat), float(lon))
        if angular_arcsec(calculated, float(asc)) > 0.0005:
            raise ValueError(f"Independent PySwissEph ASC mismatch on pinned row {i}")
        if math.floor(calculated / 30) + 1 != int(sign):
            raise ValueError(f"Independent pinned sign mismatch on row {i}")
        if dt.astimezone(ZoneInfo(zone)).strftime("%Y-%m-%dT%H:%M:%S") != local:
            raise ValueError(f"IANA reference timezone mismatch on row {i}")
    print(f"P388_PYTHON_REFERENCE_PASS rows={len(rows)} Swiss={swe.version}")
    return 0

def require_official_files():
    path = Path(os.environ.get("GALAXIORA_SWISS_EPHE_PATH") or
                ROOT / "node_modules/@swisseph/node/ephemeris")
    for required in ("sepl_18.se1", "semo_18.se1"):
        if not (path / required).is_file():
            raise RuntimeError("Official Swiss ephemeris unavailable: " + required)
    swe.set_ephe_path(str(path))
    return path

def calc_position(jd: float, body: int) -> float:
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    result, returned = swe.calc_ut(jd, body, swe.FLG_SIDEREAL | swe.FLG_SWIEPH | swe.FLG_SPEED)
    if returned & 7 != swe.FLG_SWIEPH:
        raise RuntimeError("Independent reference rejected SWIEPH -> Moshier/JPL fallback")
    return (result[0] + JHORA8_MEAN_SHIFT) % 360

def local_sunrise(day: date, zone: str, lat: float, lon: float) -> datetime:
    z = ZoneInfo(zone)
    midnight = datetime.combine(day, time(0, 0), z)
    search = julian(midnight - timedelta(hours=6))
    for _ in range(4):
        result, values = swe.rise_trans(search, swe.SUN, swe.CALC_RISE,
                                        (lon, lat, 0), 0, 15, swe.FLG_SWIEPH)
        if result != 0:
            raise RuntimeError("Independent Swiss local sunrise unavailable")
        instant = datetime.fromtimestamp((values[0] - 2440587.5) * 86400, timezone.utc)
        if instant.astimezone(z).date() == day:
            return instant
        search = values[0] + 2 / 86400
    raise RuntimeError("Verified sunrise not found for local IANA date")

def month_reference(input: dict) -> dict:
    require_official_files()
    start = date.fromisoformat(input["start"])
    count = input["days"]
    zone = input["timeZone"]
    lat, lon = float(input["latitude"]), float(input["longitude"])
    if not isinstance(count, int) or not 1 <= count <= 31 or not -66.49 <= lat <= 66.49:
        raise ValueError("Unsupported independently verified month/observer")
    _ = ZoneInfo(zone)
    corrections = input.get("historicalDeltaTSeconds")
    if corrections is not None:
        if not isinstance(corrections, list) or len(corrections) != count or not all(
                isinstance(x, (int, float)) and math.isfinite(x) and abs(x) < 60
                for x in corrections):
            raise ValueError("Historical JHora8 independent Swiss epoch correction must be a bounded day-scoped list")
    samples = []
    for i in range(count):
        d = start + i * DAY
        rise = local_sunrise(d, zone, lat, lon)
        next_rise = local_sunrise(d + DAY, zone, lat, lon)
        jd = julian(rise)
        # The pinned JHora8 2.02.01 Delta-T grid (independently attested
        # against old DLL) intentionally changes the physical Swiss epoch.
        # Python computes actual planetary ephemeris independently at that
        # explicitly supplied epoch; standard modern-UT Moon remains visible
        # separately, not mislabeled as same-profile precision.
        modern_moon = calc_position(jd, swe.MOON)
        adjusted_jd = jd + (corrections[i] / 86400 if corrections is not None else 0)
        sun = calc_position(adjusted_jd, swe.SUN)
        moon = calc_position(adjusted_jd, swe.MOON)
        elong = (moon - sun) % 360
        tithi = math.floor(elong / 12) + 1
        nakshatra = math.floor(moon / (360 / 27)) + 1
        yoga = math.floor((moon + sun) % 360 / (360 / 27)) + 1
        karana = math.floor(elong / 6) + 1
        vara = ((d.weekday() + 1) % 7) + 1
        distances = [abs(elong / 12 - round(elong / 12)),
                     abs(moon / (360 / 27) - round(moon / (360 / 27))),
                     abs(((sun + moon) % 360) / (360 / 27) -
                         round(((sun + moon) % 360) / (360 / 27))),
                     abs(elong / 6 - round(elong / 6))]
        samples.append(dict(date=d.isoformat(), sunriseUtc=rise.isoformat(timespec="milliseconds").replace("+00:00", "Z"),
            nextSunriseUtc=next_rise.isoformat(timespec="milliseconds").replace("+00:00", "Z"),
            tithi=tithi, nakshatra=nakshatra, vara=vara, yoga=yoga, karana=karana,
            moonSign=math.floor(moon / 30) + 1,
            sunLongitude=sun, moonLongitude=moon, modernMoonLongitude=modern_moon,
            historicalDeltaTSeconds=corrections[i] if corrections is not None else None,
            # False if any 5-limb is <1" from its boundary (cannot certify sign from rounding).
            safelyAwayFromAngaBoundary=all(x > 1 / 3600 for x in distances)))
    return dict(source="independent-pyswisseph-2.10.03-SWIEPH-only",
        astronomyEpoch="JHORA8_HISTORICAL_DELTA_T" if corrections is not None else "MODERN_SWISS_UT",
        timeZone=zone, latitude=lat, longitude=lon, days=samples)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify-asc", action="store_true")
    parser.add_argument("--sunrise-samples", action="store_true")
    args = parser.parse_args()
    try:
        if args.verify_asc:
            sys.exit(verify_pinned())
        if args.sunrise_samples:
            print(json.dumps(month_reference(json.load(sys.stdin)), separators=(",", ":")))
            sys.exit(0)
        parser.error("Choose --verify-asc or --sunrise-samples")
    except Exception as exc:
        print("P388_REFERENCE_FAIL: " + type(exc).__name__ + ": " + str(exc), file=sys.stderr)
        sys.exit(1)
