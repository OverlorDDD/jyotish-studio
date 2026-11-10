#!/usr/bin/env bash
# N499: restore previously configured FREE AI eligibility on existing AWS server.
# No Docker, no paid OpenAI, no secrets printed, no schema or Git manipulation.
set -Eeuo pipefail
umask 077
MODE="${1:---diagnose}"
APP=/opt/galaxiora/app
cd "$APP"
[[ -f .env ]] || { echo 'N499_STOP: production .env missing; restore privately before proceeding' >&2; exit 2; }
[[ "$(stat -c %u .env)" == "$(id -u)" ]] || { echo 'N499_STOP: .env must be owned by the service user' >&2; exit 2; }
[[ -f tools/ai-production-status.mjs ]] || { echo 'N499_STOP: deploy N499 code before running recovery' >&2; exit 2; }
if [[ "$MODE" == '--diagnose' ]]; then
 node tools/ai-production-status.mjs
 exit $?
fi
[[ "$MODE" == '--recover' ]] || { echo 'Usage: tools/n499-ai-aws-recover.sh --diagnose|--recover' >&2; exit 2; }
sudo -n systemctl is-active --quiet galaxiora-api || { echo 'N499_STOP: API service not active' >&2; exit 2; }
base="$HOME/.galaxiora-release-backups"
mkdir -p -m 700 "$base"
backup="$(mktemp -d "$base/n499-ai-XXXXXXXX")"
chmod 700 "$backup"
cp -p .env "$backup/previous.env"
chmod 600 "$backup/previous.env"
echo "N499_PRIVATE_ENV_BACKUP=$backup"
# Only recover previously configured *free* cloud keys from private release backups.
# Never overwrite a nonempty current key or a confirmation explicitly set to 0.
# An absent confirmation may only be recovered from an earlier explicit 1.
python3 - "$backup/previous.env" <<'PY'
from pathlib import Path
import glob,os,re,stat,sys,tempfile
current=Path('.env')
text=current.read_text(encoding='utf-8')
def parse(s):
 out={}
 for line in s.splitlines():
  m=re.match(r'^\s*(?:export\s+)?([A-Za-z_][A-Za-z_0-9]*)\s*=\s*(.*)$',line)
  if m:
   value=m.group(2).strip()
   if len(value)>1 and value[0] in ('"',"'") and value[-1]==value[0]:value=value[1:-1]
   out[m.group(1)]=value
 return out
values=parse(text)
keys=('GEMINI_API_KEY','GROQ_API_KEY','OPENROUTER_API_KEY')
flags=('GEMINI_FREE_TIER_CONFIRMED','GROQ_FREE_TIER_CONFIRMED')
candidates=sorted(glob.glob(os.path.expanduser('~/.galaxiora-release-backups/*/production.env')),reverse=True)
def value_from_backups(name):
 for filename in candidates:
  p=Path(filename)
  try:
   st=p.stat()
   if not stat.S_ISREG(st.st_mode) or st.st_uid!=os.getuid():continue
   val=parse(p.read_text(encoding='utf-8')).get(name,'')
   if val:return val
  except (OSError,UnicodeDecodeError):continue
 return ''
changes={}
for name in keys:
 if not values.get(name,'').strip():
  value=value_from_backups(name)
  if value:changes[name]=value
for name in flags:
 if name not in values or not values[name].strip():
  if value_from_backups(name)=='1':changes[name]='1'
values.update(changes)
def eligible(name,flag=None):
 return bool(values.get(name,'').strip()) and (flag is None or values.get(flag)=='1')
ready=eligible('GEMINI_API_KEY','GEMINI_FREE_TIER_CONFIRMED') or eligible('GROQ_API_KEY','GROQ_FREE_TIER_CONFIRMED') or eligible('OPENROUTER_API_KEY')
if not ready:
 print('N499_STOP: no eligible free provider in current .env or private backups (no change made)')
 sys.exit(2)
changes.update({'AI_MODE':'free','GALAXIORA_READER_ONLY':'0','FREE_AI_ORDER':'gemini,groq,openrouter'})
for name,value in changes.items():
 pattern=re.compile(r'^(?:export\s+)?'+re.escape(name)+r'\s*=.*$',re.M)
 entry=name+'='+value
 if pattern.search(text):text=pattern.sub(lambda _:entry,text)
 else:text=text.rstrip('\n')+'\n'+entry+'\n'
fd,tmp=tempfile.mkstemp(prefix='.env.n499-',dir='.')
try:
 os.fchmod(fd,0o600)
 with os.fdopen(fd,'w',encoding='utf-8') as out:out.write(text)
 os.replace(tmp,current)
finally:
 if os.path.exists(tmp):os.unlink(tmp)
print('N499_CONFIG_RECOVERY_APPLIED; recovered_keys='+str(sum(k in changes for k in keys)))
PY
chmod 600 .env
node tools/ai-production-status.mjs
sudo -n systemctl restart galaxiora-api
sudo -n systemctl is-active --quiet galaxiora-api
# Local-only, no personal chart data. Check effective mode, not just .env text.
curl --fail --silent --show-error --max-time 30 http://127.0.0.1:4000/api/v1/jyotish/runtime |
 node -e 'let s="";process.stdin.on("data",x=>s+=x);process.stdin.on("end",()=>{const j=JSON.parse(s);if(j.mode!=="free")process.exit(2);console.log("N499_RUNTIME_MODE_FREE")})'
# One invented fictional chart. This may consume the free provider request quota.
qa='{"date":"2000-01-01","time":"12:00","latitude":50.45,"longitude":30.52,"timeZone":"Etc/UTC","lang":"uk","preferred":"auto","asOf":"2026-11-10"}'
curl --fail --silent --show-error --max-time 240 -H 'Content-Type: application/json' --data-binary "$qa" \
 http://127.0.0.1:4000/api/v1/reports |
 node -e 'let s="";process.stdin.on("data",x=>s+=x);process.stdin.on("end",()=>{const j=JSON.parse(s);if(j.ai?.source!=="llm"){console.error("N499_LIVE_LLM_NOT_VERIFIED reason="+(j.ai?.fallbackReason||"unknown"));process.exitCode=3;return;}console.log("N499_LIVE_LLM_VERIFIED provider="+j.ai.provider+" model="+j.ai.model)})'
echo 'N499_AI_PRODUCTION_RECOVERY_VERIFIED'
