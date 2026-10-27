"""Read-only solar-arc Vimshottari calendar diagnostic for original 20 JHora exports.
Tests true solar-year timing (same Sun longitude after full revolutions)
rather than fitting a single constant year length to calendar dates.
This is a hypothesis test, not a JHora year-option identification.
"""
from pathlib import Path
import datetime as dt
import json
import math
import swisseph as swe

ROOT=Path(__file__).resolve().parent.parent
EPHE=ROOT/'node_modules/@swisseph/node/ephemeris'
for filename in ('sepl_18.se1','semo_18.se1'):
    if not (EPHE/filename).is_file():
        raise RuntimeError('Missing official Swiss compressed ephemeris: '+filename)
swe.set_ephe_path(str(EPHE))
swe.set_sid_mode(swe.SIDM_LAHIRI)
DAY=86400000
LORDS=('Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury')
YEARS=(7,20,6,10,7,18,16,19,17)
MEAN={'true_sidereal_sun':365.25636,'true_tropical_sun':365.24219}

def jd_from_utc(iso):
    date=dt.datetime.fromisoformat(iso.replace('Z','+00:00')).astimezone(dt.timezone.utc)
    return swe.julday(date.year,date.month,date.day,
                      date.hour+date.minute/60+date.second/3600)

def date_at(jd,offset_seconds):
    return (dt.datetime(1970,1,1,tzinfo=dt.timezone.utc)+
            dt.timedelta(days=jd-2440587.5,seconds=offset_seconds)).strftime('%Y-%m-%d')

def from_date(iso):
    return dt.date.fromisoformat(iso)

def arc_delta(a,b):
    return (a-b+180)%360-180

def solar_longitude(jd,flags):
    coord,returned=swe.calc_ut(jd,swe.SUN,flags)
    if (returned&7)!=swe.FLG_SWIEPH:
        raise RuntimeError('SWIEPH only, returned fallback '+str(returned))
    return coord[0]

def next_solar_cross(jd,years,flags,mean):
    if years<1e-9:return jd
    start=solar_longitude(jd,flags)
    target=(start+360*(years%1))%360
    expected=jd+years*mean
    candidate=swe.solcross_ut(target,expected-12,flags)
    if abs(candidate-expected)>12:
        raise RuntimeError('Solar crossing outside expected cycle: '+str(candidate-expected))
    return candidate

def previous_solar_cross(jd,years,flags,mean):
    if years<1e-9:return jd
    natal=solar_longitude(jd,flags)
    target=(natal-360*(years%1))%360
    expected=jd-years*mean
    candidate=swe.solcross_ut(target,expected-12,flags)
    if abs(candidate-expected)>12:
        raise RuntimeError('Solar backward crossing outside expected cycle: '+str(candidate-expected))
    return candidate

def evaluate(mode,clock):
    flags=swe.FLG_SWIEPH | (swe.FLG_SIDEREAL if mode=='true_sidereal_sun' else 0)
    year=MEAN[mode]
    score={'majorExact':0,'minorExact':0,'majorTotal':0,'minorTotal':0,'offsets':[],'byChart':[],'mismatches':[]}
    for n in range(1,21):
        id=f'jqa3-{n:02d}'
        row=json.loads((ROOT/f'tests/fixtures/jhora-corpus/{id}.json').read_text('utf-8'))
        capture=json.loads((ROOT/f'tests/fixtures/jhora-corpus/captures/{id}/capture.json').read_text('utf-8'))
        offset=int(capture['utcOffsetSeconds']) if clock=='original_captured_local' else 0
        moon=row['expected']['positions']['Moon']['longitude']%360
        first=int(moon/(360/27))%9
        frac=(moon%(360/27))/(360/27)
        instant=previous_solar_cross(jd_from_utc(row['civilTime']['birthUtc']),frac*YEARS[first],flags,year)
        majors,minors=0,0
        for i in range(9):
            k=(first+i)%9
            source=row['expected']['vimshottari'][i]
            if source['lord']!=LORDS[k]:raise RuntimeError('JHora lord order mismatch for '+id)
            actual=date_at(instant,offset)
            diff=(from_date(actual)-from_date(source['start'])).days
            score['offsets'].append(diff)
            majors+=int(diff==0)
            score['majorTotal']+=1
            sub=instant
            for j in range(9):
                a=(k+j)%9
                subLord=LORDS[a]
                actual=date_at(sub,offset)
                diff=(from_date(actual)-from_date(source['antardashas'][subLord])).days
                if diff != 0:
                    local_time=dt.datetime(1970,1,1,tzinfo=dt.timezone.utc)+dt.timedelta(days=sub-2440587.5,seconds=offset)
                    score['mismatches'].append({'id':id,'mahadasha':LORDS[k],
                      'antardasha':subLord,'predictedDate':actual,
                      'sourceDate':source['antardashas'][subLord],
                      'localInstant':local_time.isoformat(),
                      'secondsIntoDay':local_time.hour*3600+local_time.minute*60+
                        local_time.second+local_time.microsecond/1000000,
                      'dayOffset':diff})
                minors+=int(diff==0)
                score['minorTotal']+=1
                sub=next_solar_cross(sub,YEARS[k]*YEARS[a]/120,flags,year)
            instant=next_solar_cross(instant,YEARS[k],flags,year)
        score['majorExact']+=majors
        score['minorExact']+=minors
        score['byChart'].append({'id':id,'mahadasaDayMatches':majors,'antarDayMatches':minors})
    score['largestAbsoluteMajorOffsetDays']=max(abs(x) for x in score['offsets'])
    return {'method':mode,'dateClock':clock,**score}

def main():
    out=[]
    for mode in MEAN:
        for clock in ('utc','original_captured_local'):
            out.append(evaluate(mode,clock))
    out.sort(key=lambda x:(x['minorExact'],x['majorExact']),reverse=True)
    print(json.dumps({'status':'DIAGNOSTIC_ONLY_NO_YEAR_SELECTOR_PROOF',
     'astrometry':'Swiss verified SWIEPH from bundled ephe files',
     'source':'20 original immutable JHora captures',
     'comparisonModes':out,
     'warning':'A candidate calendar match is not proof of JHora YearDefinition 3 or UTC instants. No production method automatically selected.'},indent=2))

if __name__=='__main__':
    main()
