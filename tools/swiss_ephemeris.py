"""Optional fallback adapter for development only: pip install pyswisseph."""
import json, sys
from datetime import datetime, timezone
import swisseph as swe

def main():
    data=json.load(sys.stdin)
    dt=datetime.fromisoformat(data['utc'].replace('Z','+00:00')).astimezone(timezone.utc)
    hour=dt.hour+(dt.minute+(dt.second+dt.microsecond/1e6)/60)/60
    jd=swe.julday(dt.year,dt.month,dt.day,hour)
    import os
    from pathlib import Path
    # The native @swisseph/node package ships the official compressed planet and Moon
    # files. Reuse exactly those for a Python fallback/forensic comparison.
    # Do not silently substitute MOSEPH if neither install nor an explicit path exists.
    explicit=os.environ.get('GALAXIORA_SWISS_EPHE_PATH')
    bundled=Path(__file__).resolve().parent.parent/'node_modules/@swisseph/node/ephemeris'
    ephe=Path(explicit) if explicit else bundled
    required=('sepl_18.se1','semo_18.se1')
    if not ephe.is_dir() or any(not (ephe/f).is_file() for f in required):
        raise RuntimeError('Missing Swiss Ephemeris data files; set GALAXIORA_SWISS_EPHE_PATH to official ephe directory or install @swisseph/node bundled data.')
    swe.set_ephe_path(str(ephe))
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    flags=swe.FLG_SWIEPH|swe.FLG_SIDEREAL|swe.FLG_SPEED
    # The historical official JHora8 DLL Delta-T profile is stored in the
    # canonical static TypeScript grid. Parse the data array only, never run
    # JavaScript from Python; verify sample count to avoid silent divergence.
    import re
    grid_source=(Path(__file__).resolve().parent.parent/'packages/jyotish-core/src/jhora8-delta-t-grid.ts').read_text('utf-8')
    grid_match=re.search(r'const DELTA_T_SECONDS=\[([\s\S]*?)\];',grid_source)
    if not grid_match:
        raise RuntimeError('Missing independently attested historical Swiss Delta-T grid')
    grid=[float(x) for x in re.findall(r'-?\d+(?:\.\d+)?',grid_match.group(1))]
    if len(grid)!=3612:
        raise RuntimeError('Unexpected JHora8 Delta-T grid length')
    source_dt=dt
    if 1900<=source_dt.year<=2200:
        i=(source_dt.year-1900)*12+source_dt.month-1
        month_start=datetime(source_dt.year,source_dt.month,1,tzinfo=timezone.utc)
        next_month=datetime(source_dt.year+(source_dt.month==12),source_dt.month%12+1,1,tzinfo=timezone.utc)
        ratio=(source_dt-month_start).total_seconds()/(next_month-month_start).total_seconds()
        historical_jd=jd+(grid[i]+(grid[min(i+1,len(grid)-1)]-grid[i])*ratio)/86400
        history='jhora8-swiss20201-vs-21003-monthly-1900-2200-v1'
    else:
        historical_jd=jd
        history='modern-Swiss-DeltaT-outside-validated-JHora8-era'
    # Versioned historical v2.02.01 Lahiri convention for every sidereal
    # planet and the apparent ayanamsa metadata. Mean variant for Lagna.
    _,ayan=swe.get_ayanamsa_ex_ut(jd,swe.FLG_SWIEPH)
    ayan-=0.13823494055031915/3600
    _,lagna_ayan=swe.get_ayanamsa_ex_ut(jd,swe.FLG_SWIEPH|swe.FLG_NONUT)
    _,angles=swe.houses(jd,float(data['latitude']),float(data['longitude']),b'P')
    # Historical JHora 8 mean-Lahiri convention anchored to Swiss 2.02.01.
    # Single independent library-pair anchor, held out from 19 chart labels.
    jhora8_version_diff_arcsec=0.13823494055031915
    ascendant=(angles[0]-(lagna_ayan-jhora8_version_diff_arcsec/3600))%360
    body=[('Sun',swe.SUN),('Moon',swe.MOON),('Mars',swe.MARS),('Mercury',swe.MERCURY),('Jupiter',swe.JUPITER),('Venus',swe.VENUS),('Saturn',swe.SATURN),('Rahu',swe.MEAN_NODE)]
    positions=[]
    for name,planet in body:
       xx,ret=swe.calc_ut(historical_jd,planet,flags)
       if (ret & 7)!=swe.FLG_SWIEPH:
           raise RuntimeError('Swiss Ephemeris files unavailable for '+name+
                              '; refused silent Moshier/JPL fallback; returned flags='+str(ret))
       positions.append({'name':name,'longitude':(xx[0]+jhora8_version_diff_arcsec/3600)%360,'speed':xx[3]})
    rahu=positions[-1]
    positions.append({'name':'Ketu','longitude':(rahu['longitude']+180)%360,'speed':rahu['speed']})
    print(json.dumps({'ayanamsa':ayan,'ascendant':ascendant,'positions':positions,'julianDay':jd,'backend':'Swiss Ephemeris / pyswisseph / verified-SWIEPH (fallback) / '+history}))

if __name__=='__main__':main()
