#!/usr/bin/env python3
"""Independent PyJHora v4.8.7 D60 Traditional chart_method=1 only.
Synthetic positions, not people, not Swiss ephemeris validation.
"""
import json,sys,math
from contextlib import redirect_stdout
from importlib.metadata import version
with redirect_stdout(sys.stderr):
 from jhora.horoscope.chart import charts
NAMES=("Ascendant","Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu")
def run():
 if version('PyJHora')!='4.8.7': raise RuntimeError('N4_D60_PYJHORA_VERSION_MISMATCH')
 cases=json.load(sys.stdin)['cases']
 if len(cases)!=50: raise RuntimeError('N4_D60_REQUIRE_50_CASES')
 out=[]
 for i,item in enumerate(cases):
  if item.get('id')!=f'N4-D60-{i+1:03d}' or set(item['longitudes'])!=set(NAMES):
   raise RuntimeError('N4_D60_INVALID_CASE')
  d1=[]
  for name in NAMES:
   lon=item['longitudes'][name]
   if not isinstance(lon,(int,float)) or not math.isfinite(lon) or not 0<=lon<360: raise RuntimeError('N4_D60_INVALID_LONGITUDE')
   d1.append([name,[int(lon//30),lon%30]])
  with redirect_stdout(sys.stderr):
   r=charts.divisional_positions_from_rasi_positions(d1,divisional_chart_factor=60,chart_method=1)
  if len(r)!=10: raise RuntimeError('N4_D60_MISSING_RESULTS')
  out.append({'id':item['id'],'signs':{str(name):int(s)+1 for name,(s,_) in r}})
 json.dump({'oracle':'PyJHora','version':'4.8.7','division':60,'method':1,
  'claimsContinuousTimeCert':False,'cases':out},sys.stdout)
if __name__=='__main__':run()
