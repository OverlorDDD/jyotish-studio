#!/usr/bin/env python3
"""Independent N4 sign oracle through separately authored PyJHora 4.8.7.
Used only in isolated CI; PyJHora (upstream GPL) is NOT copied into Galaxiora or production.
No person/birthdate/location data: synthetic sidereal longitudes only.
"""
import json, sys
from importlib.metadata import version as installed_version
from contextlib import redirect_stdout
# PyJHora writes an import-time diagnostic to stdout. It is NOT reference JSON.
with redirect_stdout(sys.stderr):
    from jhora.horoscope.chart import charts

METHODS = {1:None,2:2,3:1,4:1,7:1,9:1,10:1,12:1,16:1,20:1,24:1,27:1,30:1,40:1,45:1,60:1}
NAMES = ("Ascendant","Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu")

def main():
    actual_version = installed_version('PyJHora')
    if actual_version != '4.8.7':
        raise RuntimeError('Expected exactly PyJHora 4.8.7, got '+actual_version)
    payload = json.load(sys.stdin)
    results = []
    for item in payload["cases"]:
        d1 = []
        for name in NAMES:
            longitude = float(item["longitudes"][name]) % 360.0
            d1.append([name, [int(longitude//30), longitude%30]])
        expected = {}
        # PyJHora library routines can print diagnostics. They belong in stderr,
        # never in the JSON transport that carries independently computed signs.
        with redirect_stdout(sys.stderr):
            for division, method in METHODS.items():
                if division == 1:
                    mapped = d1
                else:
                    mapped = charts.divisional_positions_from_rasi_positions(
                        d1,divisional_chart_factor=division,chart_method=method)
                expected["D"+str(division)] = {
                    str(name): int(sign)+1 for name,(sign, _deg) in mapped
                }
        results.append({"id":item["id"],"signs":expected})
    json.dump({"provider":"PyJHora","version":actual_version,"methods":METHODS,"cases":results},sys.stdout)

if __name__ == "__main__":
    main()
