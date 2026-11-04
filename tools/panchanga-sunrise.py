"""Local rise/set candidates for AE-P1, using the EXISTING pyswisseph adapter.
No timezone database required in Python; Node applies the authoritative IANA zone.
Sunrise: apparent upper limb, standard refraction, sea-level horizon.
No Moshier/JPL substitution: require bundled official compressed Swiss files.
"""
import json, sys, os
from datetime import datetime, timezone, timedelta
from pathlib import Path
import swisseph as swe

ROOT=Path(__file__).resolve().parent.parent

def main():
    payload=json.load(sys.stdin)
    noon=datetime.fromisoformat(payload['noonUtc'].replace('Z','+00:00'))
    if noon.tzinfo is None:
        raise ValueError('UTC noon missing timezone')
    lat=float(payload['latitude']);lon=float(payload['longitude'])
    if not -90<lat<90 or not -180<=lon<=180:
        raise ValueError('Invalid coordinate range')
    explicit=os.environ.get('GALAXIORA_SWISS_EPHE_PATH')
    bundled=ROOT/'node_modules/@swisseph/node/ephemeris'
    ephe=Path(explicit) if explicit else bundled
    if not ephe.is_dir() or not all((ephe/f).is_file() for f in ('sepl_18.se1','semo_18.se1')):
        raise RuntimeError('Official Swiss Ephemeris planet and Moon files required')
    swe.set_ephe_path(str(ephe))
    def jd(dt):
        utc=dt.astimezone(timezone.utc)
        hour=utc.hour+utc.minute/60+utc.second/3600+utc.microsecond/3600000000
        return swe.julday(utc.year,utc.month,utc.day,hour)
    # An actual SWIEPH return assertion, not just a requested FLG_SWIEPH flag.
    _,returned=swe.calc_ut(jd(noon),swe.SUN,swe.FLG_SWIEPH)
    if (returned & 7)!=swe.FLG_SWIEPH:
        raise RuntimeError('Astronomical sunrise source fell back from Swiss files')
    location=(lon,lat,0)
    result={}
    for key,rsmi in [('rise',swe.CALC_RISE),('set',swe.CALC_SET)]:
        cursor=jd(noon-timedelta(hours=42))
        events=[]
        for _ in range(7):
            code,times=swe.rise_trans(cursor,swe.SUN,rsmi,location,0,15,swe.FLG_SWIEPH)
            if code!=0:raise RuntimeError('Sunrise/sunset not available at this location')
            event=datetime.fromtimestamp((times[0]-2440587.5)*86400,tz=timezone.utc)
            events.append(event.isoformat(timespec='milliseconds').replace('+00:00','Z'))
            cursor=times[0]+2/86400
        result[key]=events
    result['method']='Swiss Ephemeris swe_rise_trans / apparent upper limb / refraction / sea level'
    print(json.dumps(result))

if __name__=='__main__':
    try:main()
    except Exception as error:
        print(type(error).__name__+': '+str(error),file=sys.stderr)
        sys.exit(1)
