"""JQA-3 precision forensics. Diagnostic hypotheses, never fixture edits or a certificate.
All comparisons use original SHA-pinned JHora 8.0 longitudes. Run:
  python3 tools/jqa3-precision-doctor.py
"""
import json
import math
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
import swisseph as swe

ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / 'tests/fixtures/jhora-corpus'
EPHE = ROOT / 'node_modules/@swisseph/node/ephemeris'
for _source_file in ('sepl_18.se1','semo_18.se1'):
    if not (EPHE / _source_file).is_file():
        raise RuntimeError('JQA3 precision reference requires bundled SWIEPH data: '+_source_file)
swe.set_ephe_path(str(EPHE))
FLAGS = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL
ONE = 1.0

def delta_arcseconds(found, expected):
    return ((found - expected + 540) % 360 - 180) * 3600

def utc_julian(iso):
    t = datetime.fromisoformat(iso.replace('Z', '+00:00')).astimezone(timezone.utc)
    return swe.julday(t.year, t.month, t.day,
                      t.hour + t.minute / 60 + t.second / 3600 + t.microsecond / 3600000000)

def moon(jd, flags=FLAGS):
    data, returned_flags = swe.calc_ut(jd, swe.MOON, flags)
    return data[0] % 360, returned_flags

def asc_variants(jd, lat, lon):
    tropical_asc = swe.houses(jd, lat, lon, b'P')[1][0]
    mean = swe.get_ayanamsa_ex_ut(jd, swe.FLG_SWIEPH | swe.FLG_NONUT)[1]
    apparent = swe.get_ayanamsa_ex_ut(jd, swe.FLG_SWIEPH)[1]
    variants = {
        'production_tropical_asc_minus_mean_lahiri': (tropical_asc - (mean-0.13823494055031915/3600)) % 360,
        'modern_uncorrected_tropical_asc_minus_mean_lahiri': (tropical_asc - mean) % 360,
        'tropical_asc_minus_nutated_lahiri': (tropical_asc - apparent) % 360,
    }
    for name, house_flags in [
        ('native_swiss_sidereal_house', swe.FLG_SIDEREAL),
        ('native_swiss_sidereal_house_nonut', swe.FLG_SIDEREAL | swe.FLG_NONUT),
    ]:
        try:
            variants[name] = swe.houses_ex(jd, lat, lon, b'P', flags=house_flags)[1][0] % 360
        except (TypeError, ValueError, swe.Error):
            variants[name] = None
    return variants

def report():
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    rows = []
    for n in range(1, 21):
        chart_id = f'jqa3-{n:02d}'
        source = json.loads((CORPUS / (chart_id + '.json')).read_text(encoding='utf-8'))
        capture = source['independentSource']['capture']
        assert source['title'] == chart_id
        assert capture['jhoraVersion'] == '8.0.0.0'
        assert capture['profile']['ayanamsa'] == 'SWISS_TRADITIONAL_LAHIRI'
        assert capture['profile']['positions'] == 'APPARENT'
        assert capture['profile']['observer'] == 'GEOCENTRIC'
        assert capture['profile']['nutation'] == 'ON'
        assert capture['profile']['nodes'] == 'MEAN'
        civil = source['civilTime']
        jd = utc_julian(civil['birthUtc'])
        lat, lon = civil['latitude'], civil['longitude']
        reference = source['expected']['positions']
        base = asc_variants(jd, lat, lon)
        lagna = {
            k: (None if v is None else delta_arcseconds(v, reference['Lagna']['longitude']))
            for k, v in base.items()
        }
        current_moon, flags = moon(jd)
        if (flags & 7) != swe.FLG_SWIEPH:
            raise RuntimeError('SWIEPH unavailable in JQA3 precision replay for '+chart_id)
        # Match the same versioned historical Lahiri convention as Node/Python
        # production adapters; retain the uncorrected current-Swiss candidate
        # to show the exact independent library-version impact.
        jhora8_version_delta=0.13823494055031915/3600
        moon_residuals = {
            'production_geocentric_apparent_sidereal': delta_arcseconds(
                (current_moon+jhora8_version_delta)%360, reference['Moon']['longitude']),
            'modern_uncorrected_geocentric_apparent_sidereal': delta_arcseconds(
                current_moon, reference['Moon']['longitude'])
        }
        for mode, additional_flags in [
            ('without_nutation', swe.FLG_NONUT),
            ('true_geometric', swe.FLG_TRUEPOS),
            ('no_aberration', swe.FLG_NOABERR),
            ('no_deflection', swe.FLG_NOGDEFL),
        ]:
            try:
                candidate, returned = moon(jd, FLAGS | additional_flags)
                moon_residuals[mode] = delta_arcseconds(candidate, reference['Moon']['longitude'])
            except (TypeError, ValueError, swe.Error):
                moon_residuals[mode] = None
        time_sensitivity = {}
        for seconds in (-1, 1):
            shifted_jd = utc_julian((datetime.fromisoformat(civil['birthUtc'].replace('Z', '+00:00'))
                                     + timedelta(seconds=seconds)).isoformat())
            shifted_asc = asc_variants(shifted_jd, lat, lon)['production_tropical_asc_minus_mean_lahiri']
            shifted_moon = moon(shifted_jd)[0]
            time_sensitivity[str(seconds)] = {
                'lagnaChangeArcseconds': delta_arcseconds(shifted_asc, base['production_tropical_asc_minus_mean_lahiri']),
                'moonChangeArcseconds': delta_arcseconds(shifted_moon, current_moon)
            }
        rows.append({
            'id': chart_id, 'birthUtc': civil['birthUtc'],
            'latitude': lat, 'longitude': lon,
            'jhoraExeSha256': capture['jhoraExeSha256'],
            'sourceAyanamsa': capture.get('originalAyanamsaDegrees'),
            'sourceClockResolution': 'second',
            'sourceLongitudeResolutionArcseconds': 0.01,
            'productionMoonSwissFlags': flags,
            'requestedFlags': FLAGS,
            'ephemerisFallbackDetected': (flags & (swe.FLG_SWIEPH | swe.FLG_MOSEPH | swe.FLG_JPLEPH)) != swe.FLG_SWIEPH,
            'lagnaResidualArcseconds': lagna,
            'moonResidualArcseconds': moon_residuals,
            'timeSensitivityForOneSecond': time_sensitivity
        })
    def summary(key, variant):
        available = [(x['id'], x[key][variant]) for x in rows if x[key][variant] is not None]
        failed = [{'id': k, 'signedArcseconds': v} for k, v in available if abs(v) > ONE]
        return {'passing': len(available) - len(failed), 'total': len(available),
                'maxAbsArcseconds': max((abs(v) for _, v in available), default=None),
                'failingCases': failed}
    return {
        'stage': 'JQA-3.5',
        'status': 'DIAGNOSTIC_ONLY_NOT_CERTIFIED',
        'source': 'twenty independent immutable JHora 8.0 captures, not synthetic labels',
        'swissLibraryVersion': swe.version,
        'mode': 'geocentric apparent positions, JHora8 versioned Lahiri, SWIEPH verified; uncorrected candidates kept',
        'ascendantCandidates': {
            k: summary('lagnaResidualArcseconds', k)
            for k in rows[0]['lagnaResidualArcseconds']
        },
        'moonCandidates': {
            k: summary('moonResidualArcseconds', k)
            for k in rows[0]['moonResidualArcseconds']
        },
        'fallbackCases': [row['id'] for row in rows if row['ephemerisFallbackDetected']],
        'caveat': 'A candidate with a higher count is not evidence of matching JHora 8 DLL/house method. No method auto-selected.',
        'rows': rows
    }

if __name__ == '__main__':
    print(json.dumps(report(), indent=2, ensure_ascii=False, allow_nan=False))
