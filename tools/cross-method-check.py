"""Independent computation PATHS in Swiss Ephemeris (not an independent ephemeris).
Checks direct Lahiri-sidereal positions vs tropical longitude minus Lahiri;
the few-arcsecond difference is a known ecliptic/nutation convention effect.
Run: py -3 tools/cross-method-check.py
"""
import json, pathlib, datetime, swisseph as swe
casefile=pathlib.Path(__file__).resolve().parents[1]/'tests/fixtures/swiss-reference.json'
cases=json.loads(casefile.read_text())['cases']
swe.set_sid_mode(swe.SIDM_LAHIRI)
planets=[('Sun',swe.SUN),('Moon',swe.MOON),('Mars',swe.MARS),('Mercury',swe.MERCURY),('Jupiter',swe.JUPITER),('Venus',swe.VENUS),('Saturn',swe.SATURN),('Rahu',swe.MEAN_NODE)]
for case in cases:
    dt=datetime.datetime.fromisoformat(case['utc'].replace('Z','+00:00'))
    jd=swe.julday(dt.year,dt.month,dt.day,dt.hour+dt.minute/60)
    ayan=swe.get_ayanamsa_ut(jd)
    for name,code in planets:
        direct,_=swe.calc_ut(jd,code,swe.FLG_SWIEPH|swe.FLG_SIDEREAL|swe.FLG_SPEED)
        tropical,_=swe.calc_ut(jd,code,swe.FLG_SWIEPH|swe.FLG_SPEED)
        difference=(direct[0]-(tropical[0]-ayan)+540)%360-180
        assert abs(difference)<0.006, (case['date'],name,difference)
        deviation=(direct[0]-case['positions'][name]+540)%360-180
        assert abs(deviation)<0.0001,(case['date'],name,'fixture mismatch')
    houses,angles=swe.houses_ex(jd,case['latitude'],case['longitude'],b'P',flags=swe.FLG_SIDEREAL)
    assert abs((angles[0]-case['ascendant']+540)%360-180)<0.0001
    print(f"PASS {case['date']} sidereal vs tropical correction; ayanamsha={ayan:.6f}")
print('PASS: Swiss cross-method checks; external JHora numeric comparison still required.')
