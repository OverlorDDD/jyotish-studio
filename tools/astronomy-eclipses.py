"""AE-P6 observed solar/lunar eclipses from official Swiss Ephemeris.
Provides both global eclipse candidates and local observer visibility.
Global syzygy alone is NOT a solar/lunar eclipse; Swiss eclipse geometry used.
JSON-over-stdin, no network calls, no timezone guessing, no persistence.
"""
import json,os,sys
from pathlib import Path
from datetime import datetime,timezone
import swisseph as swe

ROOT=Path(__file__).resolve().parent.parent

def fromiso(s):
    v=datetime.fromisoformat(s.replace('Z','+00:00'))
    if v.tzinfo is None:raise ValueError('UTC offset required')
    return v.astimezone(timezone.utc)
def julian(v):
    u=fromiso(v)
    return swe.julday(u.year,u.month,u.day,u.hour+u.minute/60+u.second/3600+u.microsecond/3600000000)
def utc(jd):
    if not jd:return None
    # Convert JD to UTC without assuming a local system timezone.
    from datetime import timedelta
    return (datetime(1970,1,1,tzinfo=timezone.utc)+
      timedelta(seconds=(jd-2440587.5)*86400)).isoformat(timespec='milliseconds').replace('+00:00','Z')
def eclipse_kind(flags,solar):
    if solar and flags & swe.ECL_ANNULAR_TOTAL:return 'hybrid'
    if solar and flags & swe.ECL_ANNULAR:return 'annular'
    if flags & swe.ECL_TOTAL:return 'total'
    if flags & swe.ECL_PARTIAL:return 'partial'
    if not solar and flags & swe.ECL_PENUMBRAL:return 'penumbral'
    raise RuntimeError('Unclassified eclipse flags: '+str(flags))
def find_global(start,end,solar):
    events=[]
    cursor=start-.3
    for _ in range(12):
        if solar:flags,ts=swe.sol_eclipse_when_glob(cursor,swe.FLG_SWIEPH)
        else:flags,ts=swe.lun_eclipse_when(cursor,swe.FLG_SWIEPH)
        jd=ts[0]
        if not jd or jd>end+.01:break
        if jd>=start and jd<end:
            events.append({'jd':jd,'kind':eclipse_kind(flags,solar),
              'maximumUtc':utc(jd),'flags':flags})
        if jd<=cursor:raise RuntimeError('Non-progressing eclipse event source')
        cursor=jd+1
    else:raise RuntimeError('Global eclipse search exceeded 12 iterations')
    return events

def find_local(start,end,solar,loc):
    events=[]
    cursor=start-.3
    for _ in range(12):
        if solar:flags,tret,attr=swe.sol_eclipse_when_loc(cursor,loc,swe.FLG_SWIEPH)
        else:flags,tret,attr=swe.lun_eclipse_when_loc(cursor,loc,swe.FLG_SWIEPH)
        jd=tret[0]
        if not jd or jd>end+.6:break
        if jd>=start-.6 and jd<end+.6:
            events.append({'jd':jd,'flags':flags,'maximumUtc':utc(jd)})
        if jd<=cursor:raise RuntimeError('Non-progressing local eclipse search')
        cursor=jd+1
    else:raise RuntimeError('Local eclipse search exceeded 12 iterations')
    return events

def main():
    v=json.load(sys.stdin)
    start=julian(v['startUtc']);end=julian(v['endUtc'])
    lat=float(v['latitude']);lon=float(v['longitude']);alt=float(v.get('altitudeM',0))
    if not 1900<=fromiso(v['startUtc']).year<=2099 or end<=start or end-start>368:
        raise ValueError('Eclipse search limited to 1900-2099 and 1-366 days')
    if not -90<lat<90 or not -180<=lon<=180 or alt<0 or alt>5000:
        raise ValueError('Invalid observer coordinates or altitude')
    explicit=os.environ.get('GALAXIORA_SWISS_EPHE_PATH')
    ephe=Path(explicit) if explicit else ROOT/'node_modules/@swisseph/node/ephemeris'
    if not ephe.is_dir() or any(not (ephe/name).is_file() for name in ('sepl_18.se1','semo_18.se1')):
        raise RuntimeError('Official Swiss Ephemeris Sun/Moon files required for eclipse calculation')
    swe.set_ephe_path(str(ephe))
    for jd in (start,(start+end)/2):
        for planet in (swe.SUN,swe.MOON):
            _,ret=swe.calc_ut(jd,planet,swe.FLG_SWIEPH)
            if (ret&7)!=swe.FLG_SWIEPH:raise RuntimeError('Swiss eclipse ephemeris downgraded from SWIEPH')
    observer=(lon,lat,alt)
    events=[]
    for kind,solar in (('solar',True),('lunar',False)):
        global_list=find_global(start,end,solar)
        local=find_local(start,end,solar,observer)
        for g in global_list:
            match=next((x for x in local if abs(x['jd']-g['jd'])<0.5),None)
            events.append({'type':kind,'eclipseKind':g['kind'],
              'maximumUtc':g['maximumUtc'],'visibleHere':bool(match),
              'localMaximumUtc':match['maximumUtc'] if match else None,
              'observer':{'latitude':lat,'longitude':lon,'altitudeM':alt},
              'visibilityModel':'Swiss Ephemeris eclipse_when_loc; geometric horizon, nominal atmosphere',
              'globalMethod':'Swiss Ephemeris eclipse_when_glob/lun_eclipse_when verified SWIEPH'})
    events.sort(key=lambda item:item['maximumUtc'])
    print(json.dumps({'events':events,
      'source':'Swiss Ephemeris official solar/lunar eclipse geometry (not phase approximations)',
      'independentVisibilityCertified':False}))

if __name__=='__main__':
    try:main()
    except Exception as exc:
        print(type(exc).__name__+': '+str(exc),file=sys.stderr)
        sys.exit(1)
