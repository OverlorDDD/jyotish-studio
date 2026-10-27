"""AE-P7 batched sunrise/sunset for 7-day read-only Vedic indicators.
Only official compressed Swiss Ephemeris, without fallback. Returns UTC event
candidates; Node chooses civil dates under a single IANA time-zone authority.
"""
import json,sys,os
from datetime import datetime,timezone,timedelta
from pathlib import Path
import swisseph as swe
ROOT=Path(__file__).resolve().parent.parent

def main():
    input=json.load(sys.stdin)
    noon=datetime.fromisoformat(input['localStartNoonUtc'].replace('Z','+00:00'))
    if noon.tzinfo is None:raise ValueError('Noon must have UTC offset')
    lon,lat=float(input['longitude']),float(input['latitude'])
    days=input['days']
    if not isinstance(days,int) or days<1 or days>7:raise ValueError('Maximum seven local days')
    if not -90<lat<90 or not -180<=lon<=180:raise ValueError('Invalid observer coordinates')
    ephe=Path(os.environ['GALAXIORA_SWISS_EPHE_PATH']) if os.environ.get('GALAXIORA_SWISS_EPHE_PATH') else ROOT/'node_modules/@swisseph/node/ephemeris'
    if not all((ephe/f).is_file() for f in ('sepl_18.se1','semo_18.se1')):
        raise RuntimeError('Verified planet and Moon Swiss files required')
    swe.set_ephe_path(str(ephe))
    def julian(dt):
        utc=dt.astimezone(timezone.utc)
        return swe.julday(utc.year,utc.month,utc.day,
            utc.hour+utc.minute/60+utc.second/3600+utc.microsecond/3600000000)
    start=julian(noon-timedelta(hours=42))
    _,returned=swe.calc_ut(start,swe.SUN,swe.FLG_SWIEPH)
    if (returned&7)!=swe.FLG_SWIEPH:raise RuntimeError('Swiss ephemeris backend downgraded')
    geopos=(lon,lat,0)
    events={}
    for kind,flag in [('sunrise',swe.CALC_RISE),('sunset',swe.CALC_SET)]:
        time=start;matches=[]
        for _ in range(days+5):
            code,values=swe.rise_trans(time,swe.SUN,flag,geopos,0,15,swe.FLG_SWIEPH)
            if code!=0:raise RuntimeError('Local sunrise/sunset unavailable: polar or invalid horizon')
            jd=values[0]
            iso=(datetime(1970,1,1,tzinfo=timezone.utc)+
                 timedelta(seconds=(jd-2440587.5)*86400)).isoformat(timespec='milliseconds').replace('+00:00','Z')
            matches.append(iso)
            time=jd+2/86400
        events[kind]=matches
    print(json.dumps({'events':events,'method':'Swiss rise_trans, apparent upper limb, standard refraction, flat sea-level horizon'}))
if __name__=='__main__':
    try:main()
    except Exception as err:
        print(type(err).__name__+': '+str(err),file=sys.stderr)
        sys.exit(1)
