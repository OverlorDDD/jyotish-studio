"""JQA-2 diagnostic ONLY: replay pinned JHora longitudes with explicit Swiss comparison modes.

These modes are not automatically a certified copy of JHora's saved INI.
No production defaults are changed. One pinned external natal chart only.
"""
import json
import math
from pathlib import Path
import swisseph as swe

ROOT = Path(__file__).resolve().parent.parent
record = json.loads((ROOT / 'tests/fixtures/jhora-8-gandhi-public.json').read_text(encoding='utf-8'))
birth = record['civilTime']
from datetime import datetime
date = datetime.fromisoformat(birth['birthUtc'].replace('Z', '+00:00'))
jd = swe.julday(date.year, date.month, date.day, date.hour + date.minute / 60 + date.second / 3600)
external = record['expected']['positions']
bodies = [('Sun', swe.SUN), ('Moon', swe.MOON), ('Mars', swe.MARS),
          ('Mercury', swe.MERCURY), ('Jupiter', swe.JUPITER),
          ('Venus', swe.VENUS), ('Saturn', swe.SATURN)]

def delta_arcsec(observed, expected):
    return ((observed - expected + 540) % 360 - 180) * 3600

def compare(mode, flags):
    swe.set_sid_mode(mode)
    return {name: round(delta_arcsec(swe.calc_ut(jd, planet, flags)[0][0] % 360,
                                      external[name]['longitude']), 4)
            for name, planet in bodies}

baseline_flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED
baseline = compare(swe.SIDM_LAHIRI, baseline_flags)
true_citra_true = compare(swe.SIDM_TRUE_CITRA, baseline_flags | swe.FLG_TRUEPOS)
# The pinned JHora ayanamsa is an EXTERNAL number; using it to compute an
# ascendant is a geometric cross-check, not an independently generated ayanamsa.
ayan_dms = record['independentSource']['extractedAyanamsaText']
deg, arcmin, arcsec = (float(x) for x in ayan_dms.split('-'))
jhora_ayanamsa = deg + arcmin/60 + arcsec/3600
tropical_asc = swe.houses(jd, birth['latitude'], birth['longitude'], b'P')[1][0]
asc_geo_delta = delta_arcsec((tropical_asc-jhora_ayanamsa)%360,external['Lagna']['longitude'])
swe.set_sid_mode(swe.SIDM_TRUE_CITRA)
sidereal_asc = swe.houses_ex(jd,birth['latitude'],birth['longitude'],
                            b'P',flags=swe.FLG_SIDEREAL)[1][0]
asc_native_delta = delta_arcsec(sidereal_asc,external['Lagna']['longitude'])
# The Swiss SWIEPH true lunar node may be unavailable for historic dates
# without ephemeris files: diagnostic Moshier is explicitly labeled a fallback.
try:
    true_node = swe.calc_ut(jd,swe.TRUE_NODE,baseline_flags | swe.FLG_TRUEPOS)[0][0]
    node_backend='SWIEPH requested'
except swe.Error:
    true_node = swe.calc_ut(jd,swe.TRUE_NODE,
                swe.FLG_MOSEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED | swe.FLG_TRUEPOS)[0][0]
    node_backend='MOSEPH fallback: NOT identical source ephemeris'

result = {
  'independentJHoraCharts':1,
  'swissRecomputedCharts':1,
  'externalCaptureSha':record['independentSource']['captureCommit'],
  'profileCandidates':{
    'traditionalLahiriApparentArcsec':baseline,
    'SwissTrueCitraTruePositionArcsec':true_citra_true,
    'sevenClassicalBodiesWithinOneArcsec':sum(abs(v)<=1 for v in true_citra_true.values()),
    'trueNodeDeltaArcsec':round(delta_arcsec(true_node,external['Rahu']['longitude']),4),
    'trueNodeBackend':node_backend,
    'SwissTrueCitraSiderealAscDeltaArcsec':round(asc_native_delta,4),
    'tropicalAscMinusEXTERNALJHoraAyanDeltaArcsec':round(asc_geo_delta,4),
  },
  'numericalD1AllBodiesCertified':False,
  'completeD9D10Certified':False,
  'dashasCertified':False,
  'status':'PARTIAL_NUMERICAL_MATCH_WITH_UNVERIFIED_CONFIGURATION',
}
print(json.dumps(result,ensure_ascii=False))
if result['profileCandidates']['sevenClassicalBodiesWithinOneArcsec'] != 7:
    raise SystemExit('REGRESSION: 7 classical planets no longer within 1 arcsec for pinned JHora recording')
