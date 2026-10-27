"""Compare current Swiss 2.10 vs genuine JHora 8 outputs with pinned pre-DE441 DE431 data.
Read-only diagnostic: environmental SE_EPHE_PATH is mandatory; reject MOSEPH fallback.
"""
import datetime as dt
import json, math, os
from pathlib import Path
import swisseph as swe

ephe=os.environ.get('JQA3_EPHE')
if not ephe or not Path(ephe).is_dir():raise SystemExit('JQA3_EPHE must point to downloaded historical sepl_18.se1 and semo_18.se1')
for name in ('sepl_18.se1','semo_18.se1'):
 if not (Path(ephe)/name).is_file():raise SystemExit('Missing original SWIEPH file: '+name)
swe.set_ephe_path(ephe)
swe.set_sid_mode(swe.SIDM_LAHIRI)
c=Path(__file__).resolve().parent.parent/'tests/fixtures/jhora-corpus'
FLAGS=swe.FLG_SWIEPH|swe.FLG_SPEED|swe.FLG_SIDEREAL
TARGETS=[('Sun',swe.SUN),('Moon',swe.MOON),('Mars',swe.MARS),('Mercury',swe.MERCURY),
 ('Jupiter',swe.JUPITER),('Venus',swe.VENUS),('Saturn',swe.SATURN),('Rahu',swe.MEAN_NODE)]
def diff(a,b):return ((a-b+540)%360-180)*3600
rows=[]
for n in range(1,21):
 fixture=json.loads((c/f'jqa3-{n:02d}.json').read_text('utf8'))
 t=dt.datetime.fromisoformat(fixture['civilTime']['birthUtc'].replace('Z','+00:00'))
 jd=swe.julday(t.year,t.month,t.day,t.hour+t.minute/60+t.second/3600)
 houses=swe.houses(jd,fixture['civilTime']['latitude'],fixture['civilTime']['longitude'],b'P')
 ay=swe.get_ayanamsa_ex_ut(jd,swe.FLG_SWIEPH|swe.FLG_NONUT)[1]
 asc=(houses[1][0]-ay)%360
 results={'Lagna':diff(asc,fixture['expected']['positions']['Lagna']['longitude'])}
 flags={}
 for name,body in TARGETS:
  values,ret=swe.calc_ut(jd,body,FLAGS)
  if (ret & 7)!=swe.FLG_SWIEPH:raise RuntimeError(f'Unexpected MOSEPH/JPLEPH backend for {name} {n}: {ret}')
  results[name]=diff(values[0],fixture['expected']['positions'][name]['longitude'])
  flags[name]=ret
 results['Ketu']=diff((swe.calc_ut(jd,swe.MEAN_NODE,FLAGS)[0][0]+180)%360,
                      fixture['expected']['positions']['Ketu']['longitude'])
 rows.append({'id':fixture['title'],'residualArcsec':results,'flags':flags})
bodies=['Lagna','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']
totals={k:{'passing':sum(abs(r['residualArcsec'][k])<=1.0 for r in rows),
           'maxAbsArcseconds':max(abs(r['residualArcsec'][k]) for r in rows)} for k in bodies}
print(json.dumps({'status':'READ_ONLY_DIAGNOSTIC_NOT_CERTIFIED',
 'swissVersion':swe.version,'ephemerisMode':'STRICT_SWIEPH_WITH_PRE_2026_DATA',
 'totals':totals,'rows':rows},ensure_ascii=False,indent=2))
