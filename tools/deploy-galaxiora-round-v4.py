#!/usr/bin/env python3
"""Install approved round Galaxiora galaxy #6, rebuild and verify."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import sys
import time
import urllib.request

ROOT = Path(os.environ.get('GALAXIORA_ROOT', '/opt/galaxiora/app'))
VERSION = 'galaxy-round-v4'
ASSET = os.environ.get('GALAXIORA_ASSET_URL', 'https://raw.githubusercontent.com/OverlorDDD/jyotish-studio/0fd62eb2a01e22583fae65887d49df4c045c0ede/apps/web/app/icon.png')
header = ROOT / 'apps/web/app/components/PortalShell.tsx'
layout = ROOT / 'apps/web/app/layout.tsx'
package = ROOT / 'apps/web/package.json'
if not all(x.is_file() for x in (header, layout, package)):
    sys.exit('ERROR: Expected Galaxiora files missing. Nothing changed.')

print('[1/5] Downloading approved circle #6 from GitHub...', flush=True)
try:
    with urllib.request.urlopen(ASSET, timeout=25) as r:
        png = r.read()
except Exception as exc:
    sys.exit(f'ERROR: Cannot fetch approved PNG: {exc}. Nothing changed.')
if hashlib.sha256(png).hexdigest() != '32f8ddf33f1004c8c215bde3aa5b7098b4a3d6ff6e444a5a2c2fec32ada3c37d':
    sys.exit('ERROR: Downloaded favicon checksum mismatch. No files changed.')
if not (png.startswith(b'\x89PNG\r\n\x1a\n') and struct.unpack('>II', png[16:24]) == (64,64) and (png[25] in (4,6) or b'tRNS' in png)):
    sys.exit('ERROR: Downloaded PNG is not a transparent 64×64 image. Nothing changed.')

shell = header.read_text(encoding='utf-8')
metadata = layout.read_text(encoding='utf-8')
pkg = json.loads(package.read_text(encoding='utf-8'))
mark = re.search(r'<span className="as-brand-icon"[^>]*>.*?</span>', shell, flags=re.S)
if not mark:
    sys.exit('ERROR: Header layout is different; no files changed.')
replacement = ('<span className="as-brand-icon" aria-hidden="true">'
               '<img src="/galaxiora-favicon.png?v='+VERSION+'" alt="" width={48} height={48} '
               'style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover",display:"block"}}/>'
               '</span>')
shell = shell[:mark.start()] + replacement + shell[mark.end():]
if shell.count('MoonStar') == 1:
    shell = shell.replace(', MoonStar', '').replace('MoonStar, ', '')
shell = shell.replace("import Image from 'next/image';\n", '')
icons = (" icons:{icon:[{url:'/icon.png?v="+VERSION+"',type:'image/png',sizes:'64x64'}],"
         "shortcut:'/favicon.ico?v="+VERSION+"',apple:'/galaxiora-favicon.png?v="+VERSION+"'},")
if re.search(r'^\s*icons:\{[^\n]+$', metadata, flags=re.M):
    metadata = re.sub(r'^\s*icons:\{[^\n]+$', icons, metadata, count=1, flags=re.M)
elif ' applicationName:BRAND.name,' in metadata:
    metadata = metadata.replace(' applicationName:BRAND.name,', ' applicationName:BRAND.name,\n'+icons, 1)
else:
    sys.exit('ERROR: Metadata layout is different; no files changed.')

overlay = ROOT / 'tools/galaxiora-round-overlay.mjs'
overlay_text = """import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const src=join(root,'apps/web/brand-assets/galaxiora-circle-64.png');
const png=readFileSync(src);
for (const rel of ['apps/web/app/icon.png','apps/web/public/galaxiora-favicon.png','apps/web/public/apple-touch-icon.png']) copyFileSync(src,join(root,rel));
const head=Buffer.from([0,0,1,0,1,0]);
const ent=Buffer.alloc(16);ent[0]=64;ent[1]=64;ent.writeUInt16LE(1,4);ent.writeUInt16LE(32,6);ent.writeUInt32LE(png.length,8);ent.writeUInt32LE(22,12);
writeFileSync(join(root,'apps/web/public/favicon.ico'),Buffer.concat([head,ent,png]));
console.log('[round-galaxy] approved round icon retained');
"""
command = 'node ../../tools/galaxiora-round-overlay.mjs'
scripts = pkg.setdefault('scripts', {})
scripts['prebuild'] = command  # Never run legacy brand-icons-build.mjs: it requires deleted icon.svg.

backup = Path('/tmp/galaxiora-backup-' + datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S'))
paths = [header,layout,package,overlay,ROOT/'apps/web/app/icon.svg',ROOT/'apps/web/app/icon.png',ROOT/'apps/web/public/galaxiora-favicon.png',ROOT/'apps/web/public/favicon.ico',ROOT/'apps/web/public/apple-touch-icon.png']
for path in paths:
    if path.is_file():
        dest = backup/path.relative_to(ROOT)
        dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(path,dest)
header.write_text(shell, encoding='utf-8')
layout.write_text(metadata, encoding='utf-8')
package.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
overlay.write_text(overlay_text,encoding='utf-8')
asset_file = ROOT/'apps/web/brand-assets/galaxiora-circle-64.png'
asset_file.parent.mkdir(parents=True, exist_ok=True)
asset_file.write_bytes(png)
(ROOT/'apps/web/app/icon.svg').unlink(missing_ok=True)
subprocess.run(['node',str(overlay)], cwd=ROOT, check=True)
print('[2/5] Round favicon, header and Google metadata installed. Backup:',backup,flush=True)

if os.environ.get('GALAXIORA_TEST_ONLY') == '1':
    print('TEST PASS. Skipped Next build and service restart.')
    sys.exit(0)

print('[3/5] Building Next.js (round PNG overlay only; no legacy SVG generator)...',flush=True)
subprocess.run(['npm','run','build','-w','@jyotish/web'],cwd=ROOT,check=True)
if (ROOT/'apps/web/app/icon.png').read_bytes() != png:
    sys.exit('ERROR: legacy generator overwrote the icon after build. Service not restarted.')
print('[4/5] Restarting service...',flush=True)
subprocess.run(['sudo','systemctl','restart','galaxiora-web'],check=True)
for n in range(20):
    status=subprocess.run(['curl','-fsS','--max-time','3','-o','/dev/null','http://127.0.0.1:3000/uk'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    if status.returncode==0:break
    time.sleep(2)
else:
    sys.exit('ERROR: Site did not become healthy. Check: sudo journalctl -u galaxiora-web -n 60 --no-pager')
print('[5/5] Checking site...',flush=True)
check = subprocess.run(['npm','run','site:check'],cwd=ROOT)
if check.returncode:
    print('WARNING: site:check did not pass; inspect public API/health separately.',flush=True)
else:
    print('PASS: site:check',flush=True)
try:
    with urllib.request.urlopen('https://galaxiora.com/icon.png?v='+VERSION,timeout=15) as r: live=r.read()
    if live==png: print('SUCCESS: Live Galaxiora delivers the approved ROUND galaxy #6 icon.',flush=True)
    else: print('WARNING: Public icon differs from the approved PNG (possibly cache).',flush=True)
except Exception as exc:
    print('WARNING: Could not verify live icon:',exc,flush=True)
print('Open https://galaxiora.com/icon.png?v='+VERSION,flush=True)
