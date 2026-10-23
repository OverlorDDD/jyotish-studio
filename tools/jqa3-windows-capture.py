"""Windows-native JQA-3 oracle runner.

Uses the real, separately installed JHora Win32 program plus *pinned*
JHoraKit's AutoHotkey-v1 clipboard script. This is NOT Swiss/PyJHora output.
No fake expected fixtures; strict raw capture + source hashes or failure.
"""
from __future__ import annotations
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'tests/fixtures/jhora-corpus/captures'
MATRIX=ROOT/'tests/fixtures/jhora-corpus/capture-matrix.psv'
COMMIT='f63826b501eabe69c6b08c5365875e1e2f74c24a'
def fail(message): raise SystemExit("JQA3 authentic JHora capture rejected: "+str(message))
def sha256(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def execute(argv, **kwargs):
    return subprocess.run(argv,check=True,timeout=180,text=True,**kwargs)
def encode_coordinate(value, east_inverted=False):
    absolute=abs(value);degrees=int(absolute);mm=(absolute-degrees)*60
    minutes=int(mm);seconds=round((mm-minutes)*60)
    if seconds==60:minutes+=1;seconds=0
    if minutes==60:degrees+=1;minutes=0
    sign='-' if (value<0)^east_inverted else ''
    return f'{sign}{degrees}.{minutes:02}{seconds:02}00'
def build_jhd(row):
    ident,date,time,lat,lon,tz,place=row
    y,m,d=map(int,date.split('-'));hh,minute=map(int,time.split(':'))
    east=float(tz)
    zone_abs=abs(east);zone_hours=int(zone_abs)
    zone_minutes=round((zone_abs-zone_hours)*60)
    zone=('-' if east>=0 else '')+f'{zone_hours}.{zone_minutes:02}0000'
    values=[m,d,y,f'{hh+minute/100:.6f}',zone,
     encode_coordinate(float(lon),True),encode_coordinate(float(lat)),
     '0.000000',zone,zone,'0','0',ident,place,'1','1013.250000','20.000000','0']
    return '\n'.join(map(str,values))+'\n'
def update_settings(ini_bytes):
    text=ini_bytes.decode('utf-8',errors='replace')
    changes={
      'Siddhanta':'0','UserSelectedAyanamsa':'0',
      'DeltaFromUserSelectedAyanamsa':'0.000000',
      'TrueNodes':'0','TruePositions':'0','TopocentricPositions':'0',
      'NoNutation':'0','NoAberration':'0','NoGravDeflection':'0',
      'D9Preference':'0','D10Preference':'0'
    }
    for key,value in changes.items():
        text,count=re.subn(r'(?m)^'+re.escape(key)+r'=.*$',key+'='+value,text)
        if count!=1:fail(f'Expected exactly one JHora preference {key}; found {count}')
    # JHora's explicit reference profile is recorded, not assumed equivalent to Swiss.
    return text.encode('utf-8'),changes
def main():
    if os.name!='nt':fail('must run on a native Windows desktop runner')
    src=Path(os.environ['JHORAKIT_DIR'])
    assert execute(['git','-C',str(src),'rev-parse','HEAD'],capture_output=True).stdout.strip()==COMMIT
    source_script=src/'Sources/JHoraKit/Resources/extract_param.ahk'
    assert source_script.is_file()
    installs=[Path(os.environ.get('PROGRAMFILES(X86)','C:/Program Files (x86)'))/'Jagannatha Hora',
       Path(os.environ.get('PROGRAMFILES','C:/Program Files'))/'Jagannatha Hora']
    home=next((p for p in installs if (p/'bin/jhora.exe').is_file()),None)
    if home is None:fail('official installed JHora executable missing')
    exe=home/'bin/jhora.exe'; ini=home/'jhcore/jhora.ini'
    if not ini.is_file():ini.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src/'scripts/jhora.ini',ini)
    ahkexe=Path(os.environ['JQA3_AHK_EXE'])
    if not ahkexe.is_file():fail('AutoHotkey v1 portable binary missing')
    # Patch only known JHora binary path, keeping the upstream GUI-copy logic unchanged.
    ahkscript=ROOT/'tests/fixtures/jhora-corpus/oracle-copy.ahk'
    ahktext=source_script.read_text(encoding='utf-8-sig')
    ahktext=ahktext.replace(r'C:\Program Files (x86)\Jagannatha Hora\bin\jhora.exe',str(exe))
    ahkscript.write_text(ahktext,encoding='utf-8')
    original=ini.read_bytes()
    rows=[line.strip().split('|') for line in MATRIX.read_text().splitlines() if line.strip() and not line.startswith('#')]
    if len(rows)<12:fail('Need at least twelve independent synthetic birth inputs')
    temp=Path(os.environ.get('WINDIR','C:/Windows'))/'temp'
    temp.mkdir(parents=True,exist_ok=True)
    OUT.mkdir(parents=True,exist_ok=True)
    try:
      for row in rows:
        if len(row)!=7:fail('invalid corpus matrix row')
        ident,date,clock,lat,lon,tz,place=row
        if not re.fullmatch(r'jqa3-[0-9]{2}',ident):fail('bad ID '+ident)
        directory=OUT/ident
        if directory.exists():fail('refuse overwrite '+ident)
        directory.mkdir(parents=True)
        configured,changes=update_settings(original)
        ini.write_bytes(configured)
        shutil.copy2(ini,directory/'jhora.ini')
        jhd=temp/(ident+'.jhd')
        jhd.write_text(build_jhd(row),encoding='utf-8')
        shutil.copy2(jhd,directory/'input.jhd')
        for artifact in ('chart_data.txt','divisionals.txt'):
            (temp/artifact).unlink(missing_ok=True)
        stamp=time.time()
        print('Capturing real JHora chart',ident,flush=True)
        execute([str(ahkexe),str(ahkscript),str(jhd)])
        for artifact in ('chart_data.txt','divisionals.txt'):
            f=temp/artifact
            if not f.is_file() or f.stat().st_size<1000 or f.stat().st_mtime<stamp-1:
                fail(f'{ident}: stale or absent original JHora clipboard: {artifact}')
            shutil.copy2(f,directory/artifact)
        raw=(directory/'chart_data.txt').read_text(encoding='utf-8')
        if 'Natal Chart' not in raw or 'Ayanamsa:' not in raw:fail('not real JHora natal text')
        wall=dt.datetime.fromisoformat(date+'T'+clock+':00')
        zone_seconds=round(float(tz)*3600)
        utc=wall-dt.timedelta(seconds=zone_seconds)
        capture={
         'id':ident,'birthLocal':wall.isoformat(),'utc':utc.strftime('%Y-%m-%dT%H:%M:%SZ'),
         'utcOffsetSeconds':zone_seconds,'latitude':float(lat),'longitude':float(lon),
         'jhoraExeSha256':sha256(exe),'jhoraVersion':os.environ['JHORA_VERSION'],
         'sourceRepo':'https://github.com/normalmystic/JHoraKit','sourceCommit':COMMIT,
         'jhoraConfigurationCapturedBeforeRun':True,'jhoraConfigurationRestoredAfterRun':True,
         'dashaYearDays':None,'dashaYearEvidence':'NOT_YET_ATTESTED',
         'settingsAppliedForMethodComparison':changes,
         'rawFileHashes':{n:sha256(directory/n) for n in ('jhora.ini','chart_data.txt','divisionals.txt','input.jhd')}
        }
        ini.write_bytes(original)
        (directory/'capture.json').write_text(json.dumps(capture,indent=2)+'\n',encoding='utf-8')
        for op in ('import','register'):
            cmd=['node','--experimental-strip-types',str(ROOT/'tools/jqa3-corpus.mjs'),op]
            cmd+=([str(directory),f'tests/fixtures/jhora-corpus/{ident}.json'] if op=='import'
             else [f'tests/fixtures/jhora-corpus/{ident}.json'])
            execute(cmd,cwd=ROOT)
        print('Authentic JHora raw output attested:',ident,flush=True)
    finally:
        ini.write_bytes(original)
        ahkscript.unlink(missing_ok=True)
    print(f'{len(rows)} raw JHora 8 outputs captured and registered. Numerical certification is SEPARATE.',flush=True)
if __name__=='__main__':main()
