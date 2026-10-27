"""JQA-3.7 independent original JHora 8 Vimshottari calendar mode investigation.
Never auto-select the closest model or change original JHora fixtures.
Search true solar-year phase lengths (sidereal and tropical) vs mean-year variants.
"""
import datetime as dt
import json
import math
from pathlib import Path
import swisseph as swe

ROOT=Path(__file__).resolve().parent.parent
C=ROOT/'tests/fixtures/jhora-corpus'
DAY=86400.0
LORDS=['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury']
YEARS=[7,20,6,10,7,18,16,19,17]
NAK=360/27
swe.set_sid_mode(swe.SIDM_LAHIRI)
FL= swe.FLG_SWIEPH|swe.FLG_SPEED
SUN=swe.SUN

def jd_from_utc(utc):
 t=dt.datetime.fromisoformat(utc.replace('Z','+00:00'))
 return swe.julday(t.year,t.month,t.day,t.hour+t.minute/60+t.second/3600)

def to_utc_date(jd,offset_seconds):
 stamp=(jd-2440587.5)*DAY+offset_seconds
 return dt.datetime.fromtimestamp(stamp,tz=dt.timezone.utc).strftime('%Y-%m-%d')

def angular_diff(a,b):
 return ((a-b+180)%360)-180

def sun_at(jd,sidereal):
 flags=FL|(swe.FLG_SIDEREAL if sidereal else 0)
 xx,ret=swe.calc_ut(jd,SUN,flags)
 return xx[0]%360,xx[3],ret

def phase_inverse(birth_jd,birth_sun,relative_years,sidereal):
 guess=birth_jd+relative_years*(365.256364 if sidereal else 365.242190)
 target=(birth_sun+(relative_years%1)*360)%360
 for _ in range(7):
  current,speed,flags=sun_at(guess,sidereal)
  if speed<=0 or not math.isfinite(speed):raise ValueError('Solar speed invalid')
  error=angular_diff(current,target)
  guess-=error/speed
  if abs(error)<1e-10:break
 return guess

def truth_table(case,model):
 offset=case['offset'] if model['calendar']=='LOCAL_CAPTURED' else 0
 birth_jd=jd_from_utc(case['utc'])
 moon=case['moon']
 nak_index=int((moon%360)/NAK)
 frac=((moon%NAK)/NAK)
 first=nak_index%9
 birth_sun=sun_at(birth_jd,model['sidereal'])[0] if model['kind']=='TRUE_SOLAR' else None
 cursor=-(YEARS[first]*frac)
 result={}
 for idx in range(9):
  k=(first+idx)%9
  major_lord=LORDS[k]
  t0=phase_inverse(birth_jd,birth_sun,cursor,model['sidereal']) if model['kind']=='TRUE_SOLAR' else birth_jd+cursor*model['days']
  sub={};sub_cursor=cursor
  for sub_index in range(9):
   s=(k+sub_index)%9
   jd=phase_inverse(birth_jd,birth_sun,sub_cursor,model['sidereal']) if model['kind']=='TRUE_SOLAR' else birth_jd+sub_cursor*model['days']
   sub[LORDS[s]]=to_utc_date(jd,offset)
   sub_cursor+=YEARS[k]*YEARS[s]/120.0
  result[major_lord]={'start':to_utc_date(t0,offset),'sub':sub}
  cursor+=YEARS[k]
 return result

records=[]
for i in range(1,21):
 path=C/f'jqa3-{i:02d}.json'
 data=json.loads(path.read_text('utf8'))
 metadata=json.loads((C/'captures'/f'jqa3-{i:02d}'/'capture.json').read_text('utf8'))
 assert data['independentSource']['capture']['profile']['dashaYearVerified'] is False
 records.append({'id':data['title'],'moon':data['expected']['positions']['Moon']['longitude'],
  'utc':data['civilTime']['birthUtc'],'offset':metadata['utcOffsetSeconds'],
  'expected':data['expected']['vimshottari']})
models=[]
for calendar in ['UTC','LOCAL_CAPTURED']:
 for kind in ['TROPICAL','SIDEREAL']:
  models.append({'kind':'TRUE_SOLAR','sidereal':kind=='SIDEREAL','name':'TRUE_'+kind+'_SOLAR','calendar':calendar})
 for days in [360,365,365.24219,365.2425,365.25,365.256364]:
  models.append({'kind':'MEAN','days':days,'sidereal':False,'name':'MEAN_'+str(days),'calendar':calendar})
results=[]
for model in models:
 maha=0;antar=0;major_deltas=[];sub_deltas=[];details=[]
 for record in records:
  found=truth_table(record,model)
  cm=ca=0
  for original in record['expected']:
   actual=found[original['lord']]
   diff=(dt.date.fromisoformat(actual['start'])-dt.date.fromisoformat(original['start'])).days
   major_deltas.append(diff)
   if diff==0:maha+=1;cm+=1
   for lord,date in original['antardashas'].items():
    sd=(dt.date.fromisoformat(actual['sub'][lord])-dt.date.fromisoformat(date)).days
    sub_deltas.append(sd)
    if sd==0:antar+=1;ca+=1
  details.append({'id':record['id'],'mahaMatches':cm,'antarMatches':ca})
 results.append({'model':model['name'],'calendar':model['calendar'],'mahaMatches':maha,'mahaTotal':180,
   'antarMatches':antar,'antarTotal':1620,'maxAbsMajorDays':max(map(abs,major_deltas)),
   'maxAbsAntarDays':max(map(abs,sub_deltas)),
   'allExact':maha==180 and antar==1620,'byChart':details})
results.sort(key=lambda x:(x['antarMatches'],x['mahaMatches']),reverse=True)
print(json.dumps({'status':'DIAGNOSTIC_ONLY_NOT_CERTIFIED','reference':'20 source-original JHora 8.0 YYYY-MM-DD exports',
 'yearDefinitionCode':3,'noJHoraGUIOptionMapping':True,'versions':{'pyswisseph':swe.version},
 'candidates':results,
 'warning':'Same-date scores are observational clues, not attestation of source year definition. Never change production year mode just to maximize scores.'},ensure_ascii=False,indent=2))
