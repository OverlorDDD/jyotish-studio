#!/usr/bin/env bash
# Oracle-only paired Natal LLM recovery. Run via bash -s on galaxiora-primary-vnic.
# No Azure/news budget changes. Does not edit the active release worktrees.
set -Eeuo pipefail
umask 077
echo "=== ORACLE NATAL LLM — VERIFIED PAIRED RELEASE ==="
test "$(hostname)" = "galaxiora-primary-vnic"
API_OLD="$(systemctl show galaxiora-api -p WorkingDirectory --value)"
WEB_OLD="$(systemctl show galaxiora-web -p WorkingDirectory --value)"
API_DROP=/etc/systemd/system/galaxiora-api.service.d/zzzzzzzzzz-galaxiora-natal-llm.conf
WEB_DROP=/etc/systemd/system/galaxiora-web.service.d/zzzzzzzzzz-galaxiora-natal-llm.conf
TMP="$(mktemp -d)"
API_NEW=""
WEB_NEW=""
SWITCHED=0
API_PID=""
WEB_PID=""
stop_previews(){
 if [ -n "$API_PID" ]; then kill "$API_PID" 2>/dev/null || true; wait "$API_PID" 2>/dev/null || true; API_PID=""; fi
 if [ -n "$WEB_PID" ]; then kill "$WEB_PID" 2>/dev/null || true; wait "$WEB_PID" 2>/dev/null || true; WEB_PID=""; fi
}
rollback(){
 code=$?
 trap - ERR
 stop_previews
 if [ "$SWITCHED" = 1 ]; then
  echo "=== ROLLBACK API AND WEB TO PREVIOUS ORACLE WORKTREES ==="
  sudo rm -f "$API_DROP" "$WEB_DROP"
  sudo systemctl daemon-reload
  sudo systemctl restart galaxiora-api || true
  sudo systemctl restart galaxiora-web || true
  test "$(systemctl show galaxiora-api -p WorkingDirectory --value)" = "$API_OLD" &&
   test "$(systemctl show galaxiora-web -p WorkingDirectory --value)" = "$WEB_OLD" &&
   systemctl is-active --quiet galaxiora-api &&
   systemctl is-active --quiet galaxiora-web &&
   echo "PASS: ROLLBACK_PREVIOUS_RELEASES_RESTORED" ||
   echo "CRITICAL: ROLLBACK_NEEDS_MANUAL_ATTENTION"
 fi
 echo "=== SAFE DIAGNOSTICS ==="
 if [ -f "$TMP/api-preview.log" ]; then tail -20 "$TMP/api-preview.log" | sed -E 's/(sk-|AIza)[^ ]+/[REDACTED]/g' || true; fi
 echo "STOP: NATAL_LLM_RELEASE_NOT_VERIFIED"
 exit "$code"
}
cleanup(){ stop_previews; rm -rf "$TMP"; }
trap rollback ERR
trap cleanup EXIT
echo "=== 1. PRE-FLIGHT: EXACT TARGET AND HEALTH ==="
test -f "$API_OLD/.env" && test -d "$API_OLD/node_modules"
test -f "$WEB_OLD/.env" && test -d "$WEB_OLD/node_modules"
test ! -e "$API_DROP" && test ! -e "$WEB_DROP"
for service in galaxiora-api galaxiora-web postgresql caddy; do systemctl is-active --quiet "$service"; done
curl -fsS --max-time 15 http://127.0.0.1:4000/api/health >/dev/null
test "$(git hash-object "$API_OLD/apps/api/src/direct-jyotish.ts")" = "009803cd1fb49dbc5511dd3e110fbe3a5a8f43c0"
# Enforce preservation of the previous GalaxiNews pacing release.
grep -q "utcNewsAccruedCharCeiling" "$API_OLD/apps/api/src/news-translation-budget.ts"
grep -qx "NEWS_TRANSLATION_CONTENT_SCOPE=headlines" "$API_OLD/.env"
grep -qx "NEWS_AZURE_MONTHLY_CHAR_LIMIT=100000" "$API_OLD/.env"
echo "PASS: ORACLE_API_WEB_AND_NEWS_PACING_PRESERVED"
echo "=== 2. VERIFY GITHUB CI AND EXACT PATCH SHA ==="
python3 - <<'PY'
import json,urllib.request
repo="OverlorDDD/jyotish-studio"
for sha in ("d1f20aaa892a3a24c369f71df0a69be6d96e3859","afe2a20f9a00cfcc0d96babc269ac685d7b3636d"):
 url=f"https://api.github.com/repos/{repo}/commits/{sha}/check-runs?per_page=100"
 req=urllib.request.Request(url,headers={"Accept":"application/vnd.github+json","User-Agent":"Galaxiora-Oracle-Natal-release"})
 with urllib.request.urlopen(req,timeout=30) as f: checks=json.load(f)["check_runs"]
 if len(checks)<9 or any(x["conclusion"]!="success" for x in checks):
  raise SystemExit(f"STOP: CI_NOT_GREEN {sha[:8]} "+str([(x["name"],x["conclusion"]) for x in checks if x["conclusion"]!="success"]))
 print(f"PASS: GITHUB_CI {sha[:8]} {len(checks)}/{len(checks)}")
PY
echo "=== 3. ISOLATE CURRENT CODE WITHOUT UPDATING MAIN OR ANY OTHER SERVICES ==="
API_NEW="$(mktemp -d /opt/galaxiora/releases/natal-fallback-api-XXXXXXXX)"
WEB_NEW="$(mktemp -d /opt/galaxiora/releases/natal-fallback-web-XXXXXXXX)"
rmdir "$API_NEW" "$WEB_NEW"
git -C "$API_OLD" worktree add --detach "$API_NEW" HEAD
git -C "$WEB_OLD" worktree add --detach "$WEB_NEW" HEAD
# Preserve tracked local fixes from both active worktrees (including News).
git -C "$API_OLD" diff --binary HEAD | git -C "$API_NEW" apply -
git -C "$WEB_OLD" diff --binary HEAD | git -C "$WEB_NEW" apply -
cp -p "$API_OLD/.env" "$API_NEW/.env"
cp -p "$WEB_OLD/.env" "$WEB_NEW/.env"
ln -s "$(readlink -f "$API_OLD/node_modules")" "$API_NEW/node_modules"
ln -s "$(readlink -f "$WEB_OLD/node_modules")" "$WEB_NEW/node_modules"
# Carry over service-specific env files when present.
for x in apps/web/.env.production apps/web/.env.local apps/web/.env; do
 if [ -f "$WEB_OLD/$x" ]; then cp -p "$WEB_OLD/$x" "$WEB_NEW/$x"; fi
done
echo "=== 4. EXACT GROQ FIX, WITH CONTENT HASH CHECK ==="
export API_NEW WEB_NEW
python3 - <<'PY'
from pathlib import Path
import os,urllib.request,subprocess
path="apps/api/src/direct-jyotish.ts"
url="https://raw.githubusercontent.com/OverlorDDD/jyotish-studio/d1f20aaa892a3a24c369f71df0a69be6d96e3859/"+path
req=urllib.request.Request(url,headers={"User-Agent":"Galaxiora-Oracle-Natal-release"})
with urllib.request.urlopen(req,timeout=30) as f: data=f.read()
hash=subprocess.check_output(["git","hash-object","--stdin"],input=data).decode().strip()
assert hash=="17dac0fead46a27b51c6c1d16f68401df0e1e803","Unexpected Groq patch"
dest=Path(os.environ["API_NEW"])/path
dest.write_bytes(data)
print("PASS: GROQ_ONE_CORRECTIVE_RETRY_WITH_STRICT_VALIDATION")
PY
echo "=== 5. PATCH ACTIVE WEB VERSION IN PLACE (NO OTHER WEB FEATURES OVERWRITTEN) ==="
python3 - <<'PY'
from pathlib import Path
import os
p=Path(os.environ["WEB_NEW"])/"apps/web/app/astrology/jyotish/page.tsx"
s=p.read_text()
old="""  const requestId=++readingRequestId.current;
  setAiBusy(true);setInterpretation(lang==='uk'?'Створюємо детальний звіт…':'Preparing a detailed report…');"""
new="""  const requestId=++readingRequestId.current;
  // An explicit AI click must never leave the previous local Reader visible.
  if(mode==='auto')setReport(null);
  setAiBusy(true);setInterpretation(mode==='auto'?
   (lang==='uk'?'Запитуємо Gemini, за потреби Groq або OpenRouter…':'Requesting Gemini, with Groq and OpenRouter fallbacks…'):
   (lang==='uk'?'Створюємо класичний звіт…':'Preparing the classic Reader report…'));"""
assert s.count(old)==1,"Unexpected frontend AI start contract"
s=s.replace(old,new)
old="""   if(!Array.isArray(data.sections)||!data.sections.length)throw Error('Report chapters missing');
   setReport(data);
   setInterpretation(lang==='uk'?'Звіт готовий ↓ Прокрутіть нижче':'Report ready ↓ Scroll below');"""
new="""   if(!Array.isArray(data.sections)||!data.sections.length)throw Error('Report chapters missing');
   if(mode==='auto'&&data.ai?.fallbackReason==='reader_only')throw Error(lang==='uk'?
    'Сервер помилково повернув локальний Reader на запит AI. Перевірте налаштування API та повторіть запит.':
    'Server unexpectedly returned local Reader for an AI request; verify API configuration.');
   setReport(data);
   setInterpretation(mode==='auto'&&data.ai?.source==='llm'&&Boolean(data.ai?.text)?
    (lang==='uk'?'AI-консультація готова · '+data.ai.provider+' ↓':'AI consultation ready · '+data.ai.provider+' ↓'):
    mode==='auto'?
     (lang==='uk'?'AI-моделі не надали перевіреного тексту; показано Reader. Причина: '+(data.ai?.fallbackReason||'невідома'):
      'AI models did not return a verified consultation; showing Reader. Reason: '+(data.ai?.fallbackReason||'unknown')):
     (lang==='uk'?'Класичний звіт Reader готовий ↓':'Classic Reader report ready ↓'));"""
assert s.count(old)==1,"Unexpected frontend AI response contract"
s=s.replace(old,new)
old="""  }catch(error){
   if(requestId===readingRequestId.current)setInterpretation(error instanceof Error?error.message:String(error));
  }finally{if(requestId===readingRequestId.current)setAiBusy(false);}"""
new="""  }catch(error){
   if(requestId===readingRequestId.current)setInterpretation((mode==='auto'?(lang==='uk'?'AI-запит завершився помилкою: ':'AI request failed: '):'')+
    (error instanceof Error?error.message:String(error)));
  }finally{if(requestId===readingRequestId.current)setAiBusy(false);}"""
assert s.count(old)==1,"Unexpected frontend AI error contract"
s=s.replace(old,new)
p.write_text(s)
print("PASS: ACTIVE_WEB_UI_AI_FALLBACK_PATCHED_WITHOUT_STALE_READER")
PY
echo "=== 6. FULL TESTS, TYPESCRIPT, NEWS REGRESSION AND NEXT PRODUCTION BUILD ==="
cd "$API_NEW"
node --experimental-strip-types --test tools/direct-jyotish.test.mjs tools/n4-reader-ai-16.test.mjs tools/news-azure-budget.test.mjs
./node_modules/.bin/tsc -p apps/api/tsconfig.json
node --experimental-strip-types tools/news-azure-budget.mjs | grep -q '"utcPacingEnabled": true'
echo "PASS: API_AI_TESTS_TYPESCRIPT_NEWS_PACING"
cd "$WEB_NEW"
npm run build -w @jyotish/web
test -f apps/web/.next/BUILD_ID
echo "PASS: NEXT_WEB_PRODUCTION_BUILD"
echo "=== 7. SAFE LOOPBACK PREVIEW BEFORE LIVE SWITCH ==="
cd "$API_NEW"
PORT=4114 npm run start -w @jyotish/api >"$TMP/api-preview.log" 2>&1 &
API_PID=$!
apiReady=0
for i in $(seq 1 50); do
 if curl -fsS --max-time 3 http://127.0.0.1:4114/api/health >/dev/null 2>&1; then apiReady=1; break; fi
 sleep 2
done
test "$apiReady" = 1
# Explicitly verify AI routing and deterministic Reader on the NEW isolated API.
node --input-type=module <<'JS'
const base='http://127.0.0.1:4114';
const body={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52,lang:'uk',preferred:'local'};
const res=await fetch(base+'/api/v1/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
const json=await res.json();
if(!res.ok||json.ai?.fallbackReason!=='reader_only')throw Error('Isolated Reader contract failed');
console.log('PASS: PREVIEW_READER_LOCAL');
body.preferred='auto';
const ai=await fetch(base+'/api/v1/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(175000)});
const result=await ai.json();
const ok=ai.ok&&result.ai?.source==='llm'&&result.ai?.text?.length>=900&&['gemini','groq','openrouter'].includes(result.ai?.provider);
console.log('AI_PREVIEW_RESULT='+JSON.stringify({http:ai.status,provider:result.ai?.provider,reason:result.ai?.fallbackReason||null,characters:result.ai?.text?.length||0}));
if(!ok)throw Error('Full AI fallback preview did not return verified consultation');
console.log('PASS: PREVIEW_REAL_AI_FULL_CONSULTATION');
JS
stop_previews
cd "$WEB_NEW"
WEB_PORT=3114 npm run start -w @jyotish/web >"$TMP/web-preview.log" 2>&1 &
WEB_PID=$!
webReady=0
for i in $(seq 1 35); do
 if curl -fsS --max-time 5 http://127.0.0.1:3114/uk/astrology/jyotish >/dev/null 2>&1; then webReady=1; break; fi
 sleep 2
done
test "$webReady" = 1
echo "PASS: WEB_PREVIEW_HTTP200"
stop_previews
echo "=== 8. SWITCH API AND WEB ON ORACLE ONLY ==="
# Ensure our final drop-in is lexicographically last; earlier service overrides stay intact.
for unit in galaxiora-api galaxiora-web; do
 dir="/etc/systemd/system/$unit.service.d"
 sudo mkdir -p "$dir"
 if [ "$unit" = galaxiora-api ]; then proposed="$(basename "$API_DROP")"; else proposed="$(basename "$WEB_DROP")"; fi
 last="$(find "$dir" -maxdepth 1 -type f -name '*.conf' -printf '%f\n' | sort | tail -1)"
 test "$(printf '%s\n%s\n' "$last" "$proposed" | sort | tail -1)" = "$proposed"
done
printf '[Service]\nWorkingDirectory=%s\n' "$API_NEW" | sudo tee "$API_DROP" >/dev/null
printf '[Service]\nWorkingDirectory=%s\n' "$WEB_NEW" | sudo tee "$WEB_DROP" >/dev/null
SWITCHED=1
sudo systemctl daemon-reload
test "$(systemctl show galaxiora-api -p WorkingDirectory --value)" = "$API_NEW"
test "$(systemctl show galaxiora-web -p WorkingDirectory --value)" = "$WEB_NEW"
sudo systemctl restart galaxiora-api
sudo systemctl restart galaxiora-web
echo "=== 9. REAL PUBLIC AND LOCAL ACCEPTANCE ==="
good=0
for i in $(seq 1 55); do
 if curl -fsS --max-time 4 http://127.0.0.1:4000/api/health >/dev/null 2>&1 &&
    curl -fsS --max-time 5 http://127.0.0.1:3000/uk/astrology/jyotish >/dev/null 2>&1; then good=1; break; fi
 sleep 2
done
test "$good" = 1
curl -fsS --max-time 20 https://galaxiora.com/uk/astrology/jyotish >/dev/null
curl -fsS --max-time 15 https://galaxiora.com/api/v1/news/status >/dev/null
node --experimental-strip-types "$API_NEW/tools/news-azure-budget.mjs" 2>/dev/null | grep -q '"utcPacingEnabled": true' || (
 cd "$API_NEW"; node --experimental-strip-types tools/news-azure-budget.mjs | grep -q '"utcPacingEnabled": true'
)
for service in galaxiora-api galaxiora-web postgresql caddy; do systemctl is-active --quiet "$service"; done
test "$(systemctl show galaxiora-api -p WorkingDirectory --value)" = "$API_NEW"
test "$(systemctl show galaxiora-web -p WorkingDirectory --value)" = "$WEB_NEW"
trap - ERR
echo "PASS: ORACLE_NATAL_AI_PAIRED_RELEASE_LIVE"
echo "PASS: AI_FULL_CONSULTATION_VIA_PREVIEW"
echo "PASS: GEMINI_GROQ_OPENROUTER_FALLBACK_CODE"
echo "PASS: WEB_NO_STALE_READER"
echo "PASS: GALAXINEWS_DECEMBER_PACING_PRESERVED"
echo "PASS: ALL_FOUR_ORACLE_SERVICES"
echo "=== RELEASE COMPLETE ==="
