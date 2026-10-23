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
    ayan=swe.get_ayanamsa_ut(jd)
    # sidereal houses_ex returns sidereal ascendant (as opposed to tropical-minus-offset approximation)
    cusps,angles=swe.houses_ex(jd, float(data['latitude']), float(data['longitude']), b'P', flags=swe.FLG_SIDEREAL)
    # Benchmark-only override. Production sends no nodeMode and always keeps MEAN_NODE.
    # Never change client chart settings merely to satisfy a JHora comparison.
    node_mode=data.get('nodeMode','mean')
    if node_mode not in ('mean','true'):
        raise ValueError('Invalid ephemeris nodeMode')
    node_planet=swe.TRUE_NODE if node_mode=='true' else swe.MEAN_NODE
    body=[('Sun',swe.SUN),('Moon',swe.MOON),('Mars',swe.MARS),('Mercury',swe.MERCURY),('Jupiter',swe.JUPITER),('Venus',swe.VENUS),('Saturn',swe.SATURN),('Rahu',node_planet)]
    positions=[]
    for name,planet in body:
       xx,ret=swe.calc_ut(jd,planet,flags)
       positions.append({'name':name,'longitude':xx[0]%360,'speed':xx[3]})
    rahu=positions[-1]
    positions.append({'name':'Ketu','longitude':(rahu['longitude']+180)%360,'speed':rahu['speed']})
    print(json.dumps({'ayanamsa':ayan,'ascendant':angles[0]%360,'positions':positions,'julianDay':jd,'backend':'Swiss Ephemeris / pyswisseph (fallback)'}))

if __name__=='__main__':main()
