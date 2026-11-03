"""Independent P3.8.8 QA oracle: Python binding, not the Node production adapter.

Every sample is recomputed from actual Swiss Ephemeris files and the IANA
zoneinfo database. Strictly disallow silent Moshier fallback. This is
binding/method independence, not independence from the Swiss theory itself.
Not shipped or used by the production API.
"""
import hashlib
import json
import math
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import swisseph as swe

ROOT = Path(__file__).resolve().parent.parent
EPHE = Path(os.environ.get("GALAXIORA_SWISS_EPHE_PATH", ROOT / "node_modules/@swisseph/node/ephemeris"))
SOURCES = ("sepl_18.se1", "semo_18.se1")
BODIES = {"Sun": swe.SUN, "Moon": swe.MOON, "Mercury": swe.MERCURY,
          "Venus": swe.VENUS, "Mars": swe.MARS, "Jupiter": swe.JUPITER,
          "Saturn": swe.SATURN}
# Independently attested JHora 8 Swiss-2.02.01 mean-Lahiri convention offset,
# not imported from the JavaScript code being tested.
JHORA8_AYANAMSA_SHIFT_ARCSEC = 0.13823494055031915

def required_flag(flag):
    if flag & 7 != swe.FLG_SWIEPH:
        raise RuntimeError("Independent oracle fell back from official SWIEPH data files")

def jd(date):
    u = date.astimezone(timezone.utc)
    h = u.hour + u.minute / 60 + u.second / 3600 + u.microsecond / 3600000000
    return swe.julday(u.year, u.month, u.day, h)

def iso_utc(instant):
    return instant.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")

def datetime_from_jd(j):
    return datetime.fromtimestamp((j - 2440587.5) * 86400, timezone.utc)

def planet(j, number):
    position, flag = swe.calc_ut(j, number, swe.FLG_SWIEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED)
    required_flag(flag)
    return {"longitude": (position[0] + JHORA8_AYANAMSA_SHIFT_ARCSEC / 3600) % 360,
            "speed": position[3]}

def sunrise_day(case):
    local_date = datetime.fromisoformat(case["localDay"]).date()
    zone = ZoneInfo(case["timeZone"])
    noon = datetime(local_date.year, local_date.month, local_date.day, 12, tzinfo=zone)
    cursor = jd(noon - timedelta(hours=42))
    observer = (case["longitude"], case["latitude"], 0)
    sky = {}
    for name,flag in (("sunrise",swe.CALC_RISE),("sunset",swe.CALC_SET)):
        events = []
        current = cursor
        for _ in range(6):
            rc,values = swe.rise_trans(current, swe.SUN, flag, observer, 0, 15, swe.FLG_SWIEPH)
            if rc != 0:
                raise RuntimeError("Solar horizon crossing unavailable at observer")
            time = datetime_from_jd(values[0])
            events.append(time)
            current = values[0] + 2 / 86400
        sky[name] = events
    rise = next(x for x in sky["sunrise"] if x.astimezone(zone).date() == local_date)
    tomorrow = local_date + timedelta(days=1)
    next_rise = next(x for x in sky["sunrise"] if x.astimezone(zone).date() == tomorrow)
    set_time = next(x for x in sky["sunset"] if x.astimezone(zone).date() == local_date)
    if not rise < set_time < next_rise:
        raise RuntimeError("Sunrise/sunset order invalid at this latitude")
    sun = planet(jd(rise), swe.SUN)["longitude"]
    moon = planet(jd(rise), swe.MOON)["longitude"]
    elongation = (moon - sun) % 360
    dayofweek = (local_date.weekday() + 1) % 7 + 1
    return {"localDay":case["localDay"],"sunriseUtc":iso_utc(rise),
            "sunsetUtc":iso_utc(set_time),"nextSunriseUtc":iso_utc(next_rise),
            "fiveAngas":{"tithi":int(elongation // 12) + 1,
                         "nakshatra":int(moon / (360 / 27)) + 1,
                         "vara":dayofweek,
                         "yoga":int((sun + moon) % 360 / (360 / 27)) + 1,
                         "karana":int(elongation // 6) + 1,
                         "moonSign":int(moon // 30) + 1}}

def event_case(case):
    at = datetime.fromisoformat(case["atUtc"].replace("Z","+00:00"))
    j = jd(at)
    ayan_flag,ayan = swe.get_ayanamsa_ex_ut(j,swe.FLG_SWIEPH | swe.FLG_NONUT)
    required_flag(ayan_flag)
    tropical_asc = swe.houses(j,case["latitude"],case["longitude"],b"P")[1][0]
    sid = (tropical_asc - ayan + JHORA8_AYANAMSA_SHIFT_ARCSEC / 3600) % 360
    local = at.astimezone(ZoneInfo(case["timeZone"]))
    return {"atUtc":case["atUtc"],"julianDayUt":j,
            "latitude":case["latitude"],"longitude":case["longitude"],
            "timeZone":case["timeZone"],
            "ayanamsaDegrees":(ayan - JHORA8_AYANAMSA_SHIFT_ARCSEC / 3600) % 360,
            "tropicalAscendantDegrees":tropical_asc,
            "siderealAscendantDegrees":sid,"lagnaSign":int(sid // 30) + 1,
            "localDate":local.strftime("%Y-%m-%d"),"localTime":local.strftime("%H:%M:%S"),
            "planets":{name:planet(j,code) for name,code in BODIES.items()}}

def main():
    if swe.version != "2.10.03":
        raise RuntimeError("Independent oracle must be PySwissEph/Swiss 2.10.03")
    if any(not (EPHE / f).is_file() for f in SOURCES):
        raise RuntimeError("Missing independent official Swiss data files; never use Moshier fallback")
    swe.set_ephe_path(str(EPHE))
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    spec = json.load(sys.stdin)
    events = spec.get("events",[])
    sunrises = spec.get("sunrises",[])
    if len(events) != 30 or len(sunrises) != 10:
        raise RuntimeError("QA coverage requires 30 event instants and 10 local sunrise days")
    print(json.dumps({"oracle":"PYSWISSEPH_2_10_03_OFFICIAL_SWIEPH",
        "epheSha256":{f:hashlib.sha256((EPHE/f).read_bytes()).hexdigest() for f in SOURCES},
        "events":[event_case(x) for x in events],
        "sunrises":[sunrise_day(x) for x in sunrises]}))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(type(e).__name__ + ": " + str(e),file=sys.stderr)
        sys.exit(1)
