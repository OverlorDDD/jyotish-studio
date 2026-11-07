#!/usr/bin/env python3
"""Independent PyJHora 4.8.7 oracle for the TWELVE NEW N4 charts only.
Never import/copy PyJHora into Galaxiora production or distribute its code.
No birth dates or user data: synthetic fixed longitudes, one child process.
"""
import json
import sys
import math
from importlib.metadata import version as package_version
from contextlib import redirect_stdout

with redirect_stdout(sys.stderr):
    from jhora.horoscope.chart import charts

NAMES = ("Ascendant", "Sun", "Moon", "Mars", "Mercury", "Jupiter",
         "Venus", "Saturn", "Rahu", "Ketu")
# Python oracle chart_method 2 for Sun/Moon Hora (not original JHora US).
METHODS = {2: 2, 3: 1, 4: 1, 7: 1, 12: 1, 16: 1,
           20: 1, 24: 1, 27: 1, 30: 1, 40: 1, 45: 1}

def main():
    if package_version("PyJHora") != "4.8.7":
        raise RuntimeError("N4_NEW12_WRONG_PYJHORA_VERSION")
    data = json.load(sys.stdin)
    cases = data.get("cases")
    if not isinstance(cases, list) or len(cases) != 50:
        raise RuntimeError("N4_NEW12_EXPECT_50_SYNTHETIC_CASES")
    output = []
    seen = set()
    for index, case in enumerate(cases):
        case_id = "N4-SYNTH-%03d" % (index + 1)
        if case.get("id") != case_id or case_id in seen:
            raise RuntimeError("N4_NEW12_UNEXPECTED_OR_DUPLICATE_CASE")
        seen.add(case_id)
        longitudes = case.get("longitudes")
        if not isinstance(longitudes, dict) or set(longitudes) != set(NAMES):
            raise RuntimeError("N4_NEW12_INVALID_OR_MISSING_GRAHA")
        d1 = []
        for name in NAMES:
            longitude = longitudes[name]
            if not isinstance(longitude, (int, float)) or not math.isfinite(longitude) or not 0 <= longitude < 360:
                raise RuntimeError("N4_NEW12_INVALID_LONGITUDE")
            d1.append([name, [int(longitude // 30), longitude % 30]])
        signs = {}
        with redirect_stdout(sys.stderr):
            for division, method in METHODS.items():
                positions = charts.divisional_positions_from_rasi_positions(
                    d1, divisional_chart_factor=division, chart_method=method)
                if len(positions) != 10 or set(str(name) for name, _ in positions) != set(NAMES):
                    raise RuntimeError("N4_NEW12_INCOMPLETE_ORACLE_POSITION_SET")
                signs["D" + str(division)] = {
                    str(name): int(sign) + 1 for name, (sign, _position) in positions
                }
        if any(not all(isinstance(s, int) and 1 <= s <= 12 for s in val.values()) for val in signs.values()):
            raise RuntimeError("N4_NEW12_ORACLE_SIGN_OUT_OF_RANGE")
        output.append({"id": case_id, "signs": signs})
    json.dump({
        "provider": "PyJHora", "version": "4.8.7",
        "profile": "production-sun-moon-hora", "methods": METHODS, "cases": output,
        "certifiesPhysics": False, "certifiesIndividualBirth": False
    }, sys.stdout)

if __name__ == "__main__":
    main()
