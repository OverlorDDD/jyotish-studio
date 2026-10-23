"""Optional fallback adapter for development only: pip install pyswisseph."""
import json, sys
from datetime import datetime, timezone
import swisseph as swe

def main():
    data=json.load(sys.stdin)
    dt=datetime.fromisoformat(data['utc'].replace('Z','+00:00')).astimezone(timezone.utc)
    hour=dt.hour+(dt.minute+(dt.second+dt.microsecond/1e6)/60)/60
    jd=swe.julday(dt.year,dt.month,dt.day,hour)
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    flags=swe.FLG_SWIEPH|swe.FLG_SIDEREAL|swe.FLG_SPEED
    # The native JS adapter uses getAyanamsaExUt (with nutation) and
    # tropical Placidus ascendant minus that *same* true ayanamsa.
    # get_ayanamsa_ut() returns MEAN ayanamsa, creating inconsistent
    # metadata and a different basis from native. Match the actual mode.
    _,ayan=swe.get_ayanamsa_ex_ut(jd,swe.FLG_SWIEPH)
    _,angles=swe.houses(jd,float(data['latitude']),float(data['longitude']),b'P')
    ascendant=(angles[0]-ayan)%360
    body=[('Sun',swe.SUN),('Moon',swe.MOON),('Mars',swe.MARS),('Mercury',swe.MERCURY),('Jupiter',swe.JUPITER),('Venus',swe.VENUS),('Saturn',swe.SATURN),('Rahu',swe.MEAN_NODE)]
    positions=[]
    for name,planet in body:
       xx,ret=swe.calc_ut(jd,planet,flags)
       positions.append({'name':name,'longitude':xx[0]%360,'speed':xx[3]})
    rahu=positions[-1]
    positions.append({'name':'Ketu','longitude':(rahu['longitude']+180)%360,'speed':rahu['speed']})
    print(json.dumps({'ayanamsa':ayan,'ascendant':ascendant,'positions':positions,'julianDay':jd,'backend':'Swiss Ephemeris / pyswisseph (fallback)'}))

if __name__=='__main__':main()
