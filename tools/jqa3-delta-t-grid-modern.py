"""Build dense, impartial time-grid of historical Swiss2.02.01 minus modern
Swiss2.10 Delta-T; the old monthly values are produced by SHA-verified JHora DLL,
not derived from, or fitted to, any natal chart reference results.
"""
import json,os
from pathlib import Path
import swisseph as swe
source=Path('jqa3-legacy-delta-t-grid.json')
entries=json.loads(source.read_text(encoding='utf-8-sig'))
if len(entries)!=3612:raise RuntimeError('Unexpected genuine historical Delta-T grid length')
ephe=os.environ.get('JQA3_EPHE')
if not ephe or not (Path(ephe)/'sepl_18.se1').exists():raise RuntimeError('Strict original ephemeris path required')
swe.set_ephe_path(ephe)
out=[]
for entry in entries:
 y,m=int(entry['year']),int(entry['month'])
 jd=swe.julday(y,m,1,0)
 modern=swe.deltat_ex(jd,swe.FLG_SWIEPH)*86400
 difference=float(entry['seconds'])-modern
 if not -1000<difference<1000:raise RuntimeError('Historical Delta-T out of physical bounds')
 out.append(round(difference,8))
print(json.dumps({'status':'INDEPENDENT_OLD_DLL_VS_MODERN_LIBRARY_GRID',
 'legacyVersion':'2.02.01','modernVersion':swe.version,'firstYear':1900,'lastYear':2200,
 'step':'calendar-month-first-00:00UT','sourceDllSha256':'d56ba3a6158fcec3921774b5c9fcc533374413d7b77cdbc6b83ffa082d260a69',
 'samples':out},separators=(',',':')))
