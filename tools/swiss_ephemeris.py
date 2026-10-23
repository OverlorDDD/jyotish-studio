"""Optional fallback adapter for development only: pip install pyswisseph."""
import json, sys, os
from pathlib import Path
from datetime import datetime, timezone
import swisseph as swe

def main():
    data=json.load(sys.stdin)
    dt=datetime.fromisoformat(data['utc'].replace('Z','+00:00')).astimezone(timezone.utc)
    hour=dt.hour+(dt.minute+(dt.second+dt.microsecond/1e6)/60)/60
    jd=swe.julday(dt.year,dt.month,dt.day,hour)
    # Prefer the same official .se1 planetary data bundled with @swisseph/node.
    # swe.calc_ut silently falls back to Moshier when these files are missing;
    # never mislabel that fallback as verified Swiss-file numerical parity.
    bundled=Path(__file__).resolve().parent.parent / 'node_modules' / '@swisseph' / 'node' / 'ephemeris'
    configured=os.environ.get('SWISSEPH_EPHE_PATH')
    ephe=Path(configured) if configured else bundled
    if ephe.is_dir():
        swe.set_ephe_path(str(ephe))
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
    source_by_body={}
    for name,planet in body:
       xx,ret=swe.calc_ut(jd,planet,flags)
       positions.append({'name':name,'longitude':xx[0]%360,'speed':xx[3]})
       source_by_body[name]='SWIEPH' if ret&swe.FLG_SWIEPH else ('MOSEPH' if ret&swe.FLG_MOSEPH else 'OTHER')
    rahu=positions[-1]
    positions.append({'name':'Ketu','longitude':(rahu['longitude']+180)%360,'speed':rahu['speed']})
    source_by_body['Ketu']=source_by_body['Rahu']
    source_complete=all(source=='SWIEPH' for source in source_by_body.values())
    print(json.dumps({'ayanamsa':ayan,'ascendant':ascendant,'positions':positions,'julianDay':jd,
     'backend':'Swiss Ephemeris / pyswisseph ('+('SWIEPH source files' if source_complete else 'Moshier/other fallback')+')',
     'effectiveEphemerisSource':'SWIEPH' if source_complete else 'MIXED_OR_FALLBACK',
     'ephemerisSourcesByBody':source_by_body,
     'ephemerisDataDir':str(ephe) if ephe.is_dir() else None,
     'allSwissEphemerisFilesUsed':source_complete}))

if __name__=='__main__':main()
