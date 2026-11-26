'use client';
import {useState,useEffect,useRef} from 'react';
import dynamic from 'next/dynamic';
import {readApiJson} from '../../../lib/api-response';
import {isJyotishRuntimeCompatible} from '../../../lib/jyotish-runtime-contract';
import {resolveVerifiedReportChart} from '../../../lib/natal-report-binding';
import {reportGrowthEvent,reportPublicToolEvent} from '../../../lib/growth-metrics';
import type {ReadingReport} from '../../components/DetailedReport';
// A large report editor/render tree is not needed until the user requests a full reading.
const DetailedReport=dynamic(()=>import('../../components/DetailedReport'),{loading:()=>null});
const AccountPortal=dynamic(()=>import('../../components/AccountPortal'),{loading:()=>null});
import N4RcExplorer from '../../components/N4RcExplorer';
import {natalExactData} from '../../../lib/natal-features';
import {NatalSample,NatalFirstResult} from '../../components/NatalFirstLook';
import landing from './NatalLanding.module.css';
import {assertN4RcView,hasN4RcView,type N4RcView} from '../../../lib/n4-rc-view';
import {hasD60Provisional,type N4D60UI} from '../../../lib/n4-d60-view';
import CitySearch from '../../components/CitySearch';
import {Sparkles,ArrowUpRight} from 'lucide-react';
import {nakshatraSlugByName} from '../../../lib/nakshatra-slugs';
import {loadMySigns} from '../../../lib/my-signs';
type Graha={name:string;longitude:number;sign:number;signName:string;degreesInSign:number;house:number;nakshatra:string;pada:number;retrograde:boolean};
type Period={lord:string;start:string;end:string;antardashas:{lord:string;start:string;end:string}[]};
type Chart={n4?:N4RcView;n4D60?:N4D60UI;config?:{houses?:string;nodes?:string;ayanamsa?:string;dashaYearDays:number;dashaYearMode?:string};verification?:{version:string;status:'verified_internal';digest:string;checks:string[];externalReferenceChecked:false};id?:string;input:{date:string;time:string;timeZone:string;latitude:number;longitude:number;place?:string};utc:string;ayanamsa:number;ascendant:Graha;lagnaD9:Graha;lagnaD10:Graha;ephemeris:string;d1:Graha[];d9:Graha[];d10:Graha[];dasha:Period[]};
type Form={date:string;time:string;latitude:string;longitude:string;timeZone:string;place?:string};
const EMPTY_FORM:Form={date:'',time:'',latitude:'',longitude:'',timeZone:'',place:undefined};
const t={en:{title:'Your cosmic blueprint',subtitle:'Precision Vedic calculations. From planetary positions to symbolic interpretations — all in one place.',details:'Birth details',detail:'Enter date, exact local time and geographic coordinates.',date:'Date of birth',time:'Local time of birth',place:'Location preset',calculate:'Calculate birth chart',asc:'RISING SIGN',moon:'MOON SIGN',chart:'Natal chart',grahas:'Planetary positions',dasha:'Life cycles',dashadesc:'Traditional symbolic time cycles, not guaranteed predictions.',ai:'Chart reading',aidesc:'A clear explanation of the main themes in everyday language, followed by a detailed report.',aiButton:'Generate full reading',note:'Jyotish tradition',noteDesc:'A symbolic reading grounded in your calculated birth chart.',waiting:'Calculate a chart to begin.',working:'Calculating Swiss Ephemeris...',completed:'Calculated successfully.'},uk:{title:'Твоя космічна карта',subtitle:'Точні ведичні обчислення: від положень планет до символічних інтерпретацій.',details:'Дані народження',detail:'Введи дату, точний місцевий час і географічні координати.',date:'Дата народження',time:'Місцевий час',place:'Місце народження',calculate:'Розрахувати карту',asc:'ВИСХІДНИЙ ЗНАК',moon:'ЗНАК МІСЯЦЯ',chart:'Натальна карта',grahas:'Положення планет',dasha:'Життєві цикли',dashadesc:'Традиційні символічні періоди часу, а не гарантований прогноз.',ai:'Пояснення карти',aidesc:'Зрозуміле пояснення головних тем звичайною мовою, а нижче — детальний розбір карти.',aiButton:'Створити повне трактування',note:'Традиція Джйотіш',noteDesc:'Символічне трактування на основі розрахованої натальної карти.',waiting:'Спочатку розрахуй карту.',working:'Обчислюємо ефемериди...',completed:'Карту обчислено.'}};
const FREE_AI_FALLBACK_UK:Record<string,string>={
 hourly_limit:'Досягнуто локального погодинного ліміту безкоштовних AI-запитів.',
 no_provider:'Безкоштовна хмарна або локальна AI-модель не налаштована.',
 rate_limited:'Безкоштовний провайдер обмежив кількість запитів (HTTP 429).',
 provider_rejected:'Безкоштовний провайдер відхилив запит. Перевір ключ або доступ до моделі.',
 provider_unavailable:'Безкоштовний провайдер тимчасово недоступний.',
 invalid_response:'Безкоштовна модель повернула некоректний формат трактування.',
 timeout:'Безкоштовна модель не встигла відповісти за відведений час.',
 network:'Не вдалося підключитися до безкоштовного AI-провайдера.'
};
const FREE_AI_FALLBACK_EN:Record<string,string>={
 hourly_limit:'The local free AI hourly request limit was reached.',
 no_provider:'No free cloud or local AI model is configured.',
 rate_limited:'The free provider rate-limited requests (HTTP 429).',
 provider_rejected:'The free provider rejected the request. Check key or model access.',
 provider_unavailable:'The free provider is temporarily unavailable.',
 invalid_response:'The free model returned an invalid interpretation format.',
 timeout:'The free model did not respond before the timeout.',
 network:'The free AI provider could not be reached.'
};
const SIGN_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_UK=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const GRAHA_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету',Ascendant:'Висхідний знак'};
const two=(value:number)=>String(value).padStart(2,'0');
const positionLabel=(value:number)=>{
 // Truncate at one arcsecond so a position inside a sign cannot display as 30 degrees.
 const seconds=Math.floor(value*3600);
 return Math.floor(seconds/3600)+'°'+two(Math.floor(seconds/60)%60)+'′'+two(seconds%60)+'″';
};
const NAKSHATRA_UK:Record<string,string>={
 Ashwini:'Ашвіні',Bharani:'Бхарані',Krittika:'Кріттіка',Rohini:'Рохіні',Mrigashira:'Мрігашіра',Ardra:'Ардра',
 Punarvasu:'Пунарвасу',Pushya:'Пушʼя',Ashlesha:'Ашлеша',Magha:'Магха','Purva Phalguni':'Пурва Пхалгуні',
 'Uttara Phalguni':'Уттара Пхалгуні',Hasta:'Хаста',Chitra:'Чітра',Swati:'Сваті',Vishakha:'Вішакха',
 Anuradha:'Анурадха',Jyeshtha:'Джʼєштха',Mula:'Мула','Purva Ashadha':'Пурва Ашадха',
 'Uttara Ashadha':'Уттара Ашадха',Shravana:'Шравана',Dhanishta:'Дханіштха',Shatabhisha:'Шатабхіша',
 'Purva Bhadrapada':'Пурва Бхадрапада','Uttara Bhadrapada':'Уттара Бхадрапада',Revati:'Реваті'
};
const nakshatraName=(name:string,lang:'en'|'uk')=>lang==='uk'?(NAKSHATRA_UK[name]||name):name;
// Opens the guide in a new tab so a calculated chart is never lost by following the link.
const nakshatraGuideLink=(name:string,lang:'en'|'uk',text:string)=>{
 const slug=nakshatraSlugByName(name);
 return slug?<a href={'/'+lang+'/nakshatra/'+slug} target="_blank" rel="noopener" data-testid="jy-nakshatra-guide"
  title={lang==='uk'?'Відкрити довідник про цю накшатру':'Open the guide to this nakshatra'}
  style={{color:'inherit',textDecoration:'underline dotted',textUnderlineOffset:'3px'}}>{text}</a>:text;
};
const grahaFull=(name:string,lang:'en'|'uk')=>lang==='uk'?(GRAHA_UK[name]||name):name;
const signFull=(sign:number,lang:'en'|'uk')=>(lang==='uk'?SIGN_UK:SIGN_EN)[sign-1];
export default function Page({initialLang='uk'}:{initialLang?:'en'|'uk'}){
 const lang=initialLang; const [minutesUncertain,setMinutesUncertain]=useState(false),[form,setForm]=useState<Form>(EMPTY_FORM),[cityReset,setCityReset]=useState(0),[manualMode,setManualMode]=useState(false),[chart,setChart]=useState<Chart|null>(null),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState(false),[interpretation,setInterpretation]=useState(''),[aiBusy,setAiBusy]=useState(false);
 const [report,setReport]=useState<ReadingReport|null>(null);
 const [positions,setPositions]=useState<'d1'|'d9'|'d10'>('d1');
 const [periodIndex,setPeriodIndex]=useState<number|null>(null);
 const [runtimeMismatch,setRuntimeMismatch]=useState('');
 const startedEditing=useRef(false);
 const dateField=useRef<HTMLInputElement>(null);
 const timeField=useRef<HTMLInputElement>(null);
 const [birthRevision,setBirthRevision]=useState(0);
 useEffect(()=>{
  // The server renders usable controls before Next.js loads. Adopt any edits already in the DOM.
  const date=dateField.current?.value||'',time=timeField.current?.value||'';
  if(date||time){
   startedEditing.current=true;
   setForm(old=>({...old,date,time}));
  }
 },[]);
 const requestedDivision=useRef(9);
 const calculating=useRef(false);
 const [editing,setEditing]=useState(false);
 const showResult=Boolean(chart)&&!editing;
 function openForm(){
  setEditing(true);
  requestAnimationFrame(()=>document.getElementById('natal-birth-date')?.focus());
 }
 function editResult(){
  if(history.state?.natalChartResult&&location.hash==='#chart-result')history.back();
  else openForm();
 }
 useEffect(()=>{
  // Sharing a fragment cannot restore a birth chart: all personal data stays in page state.
  if(location.hash==='#chart-result')history.replaceState({...history.state,natalChartResult:false},'',location.pathname+location.search);
  const followHistory=()=>{
   if(history.state?.natalChartResult&&location.hash==='#chart-result')setEditing(false);
   else openForm();
  };
  window.addEventListener('popstate',followHistory);
  return ()=>window.removeEventListener('popstate',followHistory);
 },[]);

 const readingRequestId=useRef(0); // ignore stale Reader/AI responses
 const [jhoraReference,setJhoraReference]=useState<{cases:number;d1SignMatches:number;d1Total:number;d9SignMatches:number;d9Total:number;d10SignMatches:number;d10Total:number;perUserJhoraVerified:false}|null>(null);
 useEffect(()=>{
  let live=true;
  fetch('/api/v1/jyotish/runtime',{cache:'no-store'}).then(async res=>{
   const data=res.ok?await res.json():null;
   if(!live)return;
   setJhoraReference(data?.referenceBenchmark?.version==='jhora8-same-profile-v2'?data.referenceBenchmark:null);
   // AI writer pipeline versions (direct-v2, direct-v3, ...) are NOT a Reader ABI.
   if(!isJyotishRuntimeCompatible(data))
    setRuntimeMismatch(lang==='uk'?'API повернуло несумісний формат Reader. Оновіть вебсайт і API до сумісних версій.':'The API returned an incompatible Reader contract. Update web and API to compatible versions.');
   else setRuntimeMismatch('');
  }).catch(()=>{if(live)setRuntimeMismatch(lang==='uk'?'API недоступне або працює стара версія.':'API unavailable or outdated.');});
  return ()=>{live=false;};
 },[lang]);
 const verified=(value:Chart|null|undefined)=>value?.verification?.version==='jyotish-integrity-v3'&&
  value.verification.status==='verified_internal'&&/^[a-f0-9]{64}$/.test(value.verification.digest);
 const loadSaved=async(loaded:unknown,saved:ReadingReport|null)=>{
  const incoming=loaded as Chart;
  if(!incoming?.input||!Array.isArray(incoming.d1))return;
  readingRequestId.current++;setAiBusy(false);
  setBirthRevision(n=>n+1);setForm({...incoming.input,latitude:String(incoming.input.latitude),longitude:String(incoming.input.longitude)});
  setManualMode(!Boolean(incoming.input.place));
  setMinutesUncertain(false); // provenance is never inferred from an old stored HH:MM clock value
  // Legacy records never become visible without a fresh server-side integrity check.
  let ready=incoming;
  if(!verified(incoming)||!hasN4RcView(incoming)||!hasD60Provisional(incoming)){
   setBusy(true);
   setReport(null);setChart(null);
   setStatus(lang==='uk'?'Перевіряємо старий збережений розрахунок…':'Revalidating an older saved calculation…');
   try{
    const response=await fetch('/api/v1/charts/calculate',{method:'POST',
     headers:{'Content-Type':'application/json'},body:JSON.stringify(incoming.input)});
    ready=await readApiJson<Chart>(response);
   }catch(error){
    setError(true);setStatus(error instanceof Error?error.message:String(error));setBusy(false);return;
   }finally{setBusy(false);}
  }
  if(!verified(ready)||!hasN4RcView(ready)){
   setError(true);setStatus(lang==='uk'?'Перевірка натальної карти не пройдена.':'Natal chart integrity verification failed.');return;
  }
  setPositions('d1');setPeriodIndex(null);setEditing(false);setChart(ready);
  const compatibleSaved=saved?.language===lang&&saved?.readerVersion==='6.0.0'&&
   saved?.verification?.digest===ready.verification?.digest&&
    saved?.readerFormat==='n6-reader-v1'&&saved.readerQuality==='n6-quality-2'&&saved.minutesUncertain===minutesUncertain&&saved?.reader10?.chapters.some(c=>c.id==='timing')&&saved.asOf===new Date().toISOString().slice(0,10)&&
    (saved.ai?.source!=='llm'||saved.ai.readerFormat==='n6-reader-v1')&&
    saved?.vargaReadings?.version==='n4-varga-reader-1.0.0'&&
    saved?.readerV7?.version==='reader-v7.0.0-n43'&&
    saved?.readerV8?.version==='reader-v8.0.0-n44'&&
    saved?.readerV8?.editorialVersion==='n48-poetic-evidence-1.0.0'&&
    saved?.readerV8?.integrated?.version==='n49-unified-evidence-v1'&&
    saved?.readerV8?.compactCards?.length===15&&saved?.readerV8?.meaningful?.cards?.length===16&&saved?.readerV8?.meaningful?.discoveries?.version==='n493-ranked-patterns-1.0.0'&&
    (saved?.readerV8?.d60Preview?.status!=='conditional_signs'||saved?.readerV8?.d60Preview?.allPlanets?.length===9)?saved:null;
  setReport(compatibleSaved);
  setInterpretation(lang==='uk'?'Перевірену карту відкрито з кабінету.':'Verified saved chart loaded.');
  if(!compatibleSaved)void interpret('local',ready);
  setError(false);
  setStatus(lang==='uk'?'Розрахунок перевірено.':'Calculation integrity verified.');
 };

 const scrollToReading=useRef(false);
 useEffect(()=>{
  if(report&&scrollToReading.current)document.getElementById('full-reading')?.scrollIntoView({block:'start'});
  scrollToReading.current=false;
 },[report]);
 // A signed-in owner sees their primary (or only/newest) saved natal chart straight away.
 // ?new opens the empty calculator; anything the visitor starts meanwhile wins.
 const [profileChart,setProfileChart]=useState<{date:string;place:string}|null>(null);
 useEffect(()=>{
  if(new URLSearchParams(window.location.search).has('new'))return;
  let live=true;
  void loadMySigns().then(async mine=>{
   const own=mine?.chart;
   if(!live||!own||startedEditing.current||readingRequestId.current!==0)return;
   try{
    const r=await fetch('/api/v1/account/charts/'+encodeURIComponent(own.id),{credentials:'same-origin',cache:'no-store'});
    const data=await readApiJson<{chart:unknown;report:ReadingReport|null}>(r);
    if(!live||startedEditing.current||readingRequestId.current!==0)return;
    scrollToReading.current=false;
    setProfileChart({date:own.date,place:own.place});
    await loadSaved(data.chart,data.report);
   }catch{/* the empty calculator stays available */}
  });
  return ()=>{live=false;};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 const startNewChart=()=>{
  readingRequestId.current++;setProfileChart(null);setChart(null);setReport(null);setInterpretation('');setStatus('');setError(false);
  setBirthRevision(n=>n+1);setForm(EMPTY_FORM);setManualMode(false);setCityReset(c=>c+1);
  setMinutesUncertain(false);setAiBusy(false);startedEditing.current=true;
  history.replaceState({...history.state,natalChartResult:false},'',location.pathname+location.search);openForm();
 };
 const i=t[lang];const api=''; // Same-origin /api proxy protects remote demo visitors
 const edit=(key:keyof Form,value:string)=>{
  const manual=['latitude','longitude','timeZone'].includes(key);
  // An explicit coordinate edit is sufficient to enable manual birthplace
  // entry, even when the browser has not delivered the details toggle event.
  if(manual)setManualMode(true);
  setForm(old=>({...old,[key]:value,...(manual?{place:undefined}:{})}));
  if(manual)setCityReset(count=>count+1);
 };
 const chooseCity=(city:{name:string;region:string;country:string;latitude:number;longitude:number;timeZone:string})=>{
  startedEditing.current=true;setManualMode(false);
  // Preserve the user's birth date/time; only location fields change.
  setForm(old=>({...old,latitude:String(city.latitude),longitude:String(city.longitude),
   timeZone:city.timeZone,place:[city.name,city.region,city.country].filter(Boolean).join(', ')}));
  setStatus('');
 };
 async function calculate(e:React.FormEvent){e.preventDefault();
  if(calculating.current)return;
  if(!form.date||!form.time||(!form.place&&!manualMode)||!form.timeZone||!form.latitude||!form.longitude){
   setError(true);setStatus(lang==='uk'?'Заповни дату й час та обери місто зі списку або введи ручні координати.':'Enter date and time, then select a city or enter manual coordinates.');return;
  }
  calculating.current=true;
  reportPublicToolEvent('public_tool_started','jyotish');readingRequestId.current++;setAiBusy(false);setBusy(true);setError(false);setChart(null);setReport(null);setStatus(i.working);try{const response=await fetch(`${api}/api/v1/charts/calculate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,latitude:Number(form.latitude),longitude:Number(form.longitude)})});const data=await readApiJson<Chart>(response);if(!verified(data))throw Error(lang==='uk'?'API повернуло карту без чинного підтвердження цілісності (потрібен jyotish-integrity-v3). Перезапустіть Next.js і NestJS з однієї оновленої гілки, потім повторіть розрахунок.':'API returned a chart without the current jyotish-integrity-v3 proof. Restart Next.js and NestJS from the same updated branch, then retry.');assertN4RcView(data);setChart(data);setReport(null);setInterpretation('');setStatus(`${i.completed} UTC: ${data.utc}`);reportGrowthEvent('jyotish_chart_completed');reportPublicToolEvent('public_tool_completed','jyotish');
   // Run verified local Reader by default; calling AI always requires an explicit click.
   const linkDivision=location.hash.match(/^#varga-d(\d{1,2})$/);
   if(linkDivision)requestedDivision.current=Number(linkDivision[1]);
   setPositions('d1');setPeriodIndex(null);setEditing(false);scrollToReading.current=false;
   if(!history.state?.natalChartResult||location.hash!=='#chart-result'){
    history.pushState({...history.state,natalChartResult:true},'',location.pathname+location.search+'#chart-result');
   }
   void interpret('local',data);}catch(e){reportPublicToolEvent('public_tool_failed','jyotish');setError(true);setStatus(e instanceof Error?e.message:String(e));}finally{calculating.current=false;setBusy(false)}}
 async function interpret(mode:'auto'|'local'='auto',freshChart:Chart|null=chart,uncertain=minutesUncertain){
  if(!freshChart)return;
  const requestId=++readingRequestId.current;
  // The default Reader runs automatically. When AI is explicitly requested,
  // hide that old local result so a failed/stale AI fetch cannot masquerade as
  // the result of the user's click.
  if(mode==='auto')setReport(null);
  setAiBusy(true);setInterpretation(mode==='auto'?
   (lang==='uk'?'Запитуємо Gemini, за потреби Groq або OpenRouter…':'Requesting Gemini, with Groq and OpenRouter fallbacks…'):
   (lang==='uk'?'Створюємо класичний звіт…':'Preparing the classic Reader report…'));
  try{
   const response=await fetch(api+'/api/v1/reports',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...freshChart.input,lang,preferred:mode,minutesUncertain:uncertain,asOf:new Date().toISOString().slice(0,10),expectedChartDigest:freshChart.verification?.digest})
   });
   const data=await readApiJson<ReadingReport & {verifiedChart?:Chart}>(response);
   if(requestId!==readingRequestId.current)return;
   if(data.readerVersion!=='6.0.0')throw Error(lang==='uk'?'API повернуло застарілий Reader. Перезапустіть сервер.':'The API returned an outdated Reader. Restart the server.');
   if(data.readerV8?.version!=='reader-v8.0.0-n44'||data.readerV8.status!=='available'||data.readerV8.editorialVersion!=='n48-poetic-evidence-1.0.0'||data.readerV8.integrated?.version!=='n49-unified-evidence-v1'||data.readerV8.compactCards?.length!==15||data.readerV8.meaningful?.version!=='n492-evidence-prioritized-16-varga-v1'||data.readerV8.meaningful?.cards?.length!==16||data.readerV8.meaningful?.discoveries?.version!=='n493-ranked-patterns-1.0.0'||(data.readerV8.d60Preview?.status==='conditional_signs'&&data.readerV8.d60Preview?.allPlanets?.length!==9))throw Error(lang==='uk'?'API ще не підтримує Classical Reader 8. Оновіть локальний сервер API з цієї гілки.':'The API does not support Classical Reader 8 yet. Update the local API to this branch.');
   let authoritative:{chart:Chart;rebound:boolean};
   try{authoritative=resolveVerifiedReportChart(freshChart,data,verified);}
   catch{throw Error(lang==='uk'?'Дані звіту не збігаються з перевіреною картою. Повторіть розрахунок.':'Report facts differ from the verified natal chart. Recalculate the chart.');}
   if(authoritative.rebound){
    // Old saved chart or pre-release chart was legitimately superseded by
    // this exact server-verified calculation. Update BOTH chart and report.
    assertN4RcView(authoritative.chart);
    setChart(authoritative.chart);
    setStatus(lang==='uk'?'Карту оновлено за перевіреним розрахунком API.':'Chart refreshed from the verified API calculation.');
   }
   if(!Array.isArray(data.sections)||!data.sections.length)throw Error('Report chapters missing');
   if(mode==='auto'&&['reader_only','local_only'].includes(data.ai?.fallbackReason||''))throw Error(lang==='uk'?
    'Сервер помилково повернув локальний Reader на запит AI. Перевірте налаштування API та повторіть запит.':
    'The server unexpectedly returned local Reader for an AI request. Check API configuration and retry.');
   setReport(data);
   setInterpretation(mode==='auto'&&data.ai?.source==='llm'&&data.ai.readerFormat==='n6-reader-v1'&&Boolean(data.ai?.text)?
    (lang==='uk'?'AI-консультація готова · '+data.ai.provider+' ↓':'AI consultation ready · '+data.ai.provider+' ↓'):
    mode==='auto'?
     (lang==='uk'?'AI-моделі не надали перевіреного тексту; показано Reader. Причина: '+(data.ai?.fallbackReason||'невідома'):
      'AI models did not return a verified consultation; showing Reader. Reason: '+(data.ai?.fallbackReason||'unknown')):
     (lang==='uk'?'Класичний звіт Reader готовий ↓':'Classic Reader report ready ↓'));
  }catch(error){
   if(requestId===readingRequestId.current)setInterpretation((mode==='auto'?(lang==='uk'?'AI-запит завершився помилкою: ':'AI request failed: '):'')+
    (error instanceof Error?error.message:String(error)));
  }finally{if(requestId===readingRequestId.current)setAiBusy(false);}
 }

 const moon=chart?.d1.find(x=>x.name==='Moon');
 const now=Date.now();
 const activeDasha=chart?.dasha.find(d=>Date.parse(d.start)<=now&&Date.parse(d.end)>now);
 const period=chart?.dasha[periodIndex??Math.max(0,chart.dasha.indexOf(activeDasha!))];
 const tableLagna=chart&&(positions==='d1'?chart.ascendant:positions==='d9'?chart.lagnaD9:chart.lagnaD10);
 return <div className={'jy-workbench jy-portal-workbench '+landing.canvas}>
  <div className="main">
   <div className="content" id="calculator">
    <div className="jy-portal-toolbar"><span>GalaxiAstro <b>/</b> JYOTISH</span><AccountPortal birth={chart?.input||null} report={report} lang={lang} onOpenSaved={loadSaved}/></div>
    {profileChart&&chart&&<div className="jy-profile-open" role="status" style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:12,margin:'0 0 16px',padding:'12px 16px',borderRadius:12,border:'1px solid rgba(231,189,114,.35)',background:'rgba(231,189,114,.08)',color:'#E4E8F1',fontSize:14}}>
     <span>{lang==='uk'?'Відкрито вашу натальну карту з профілю':'Your natal chart from your profile is open'}{profileChart.date?' · '+profileChart.date.split('-').reverse().join('.'):''}{profileChart.place?' · '+profileChart.place:''}</span>
     <button type="button" className="secondary-btn" style={{margin:0,width:'auto',padding:'9px 14px'}} onClick={startNewChart}>{lang==='uk'?'Розрахувати нову карту':'Calculate a new chart'}</button>
    </div>}
    {showResult&&chart&&<NatalFirstResult lang={lang} chart={chart} onEdit={editResult} focusHeading={!profileChart}>
     <div className={landing.moonFacts}>
      {chart.ascendant.nakshatra&&<span>{lang==='uk'?'Накшатра Лагни':'Lagna nakshatra'} · {nakshatraGuideLink(chart.ascendant.nakshatra,lang,nakshatraName(chart.ascendant.nakshatra,lang))}</span>}
      {moon&&<span>{lang==='uk'?'Місяць':'Moon'} · {signFull(moon.sign,lang)} · {nakshatraGuideLink(moon.nakshatra,lang,nakshatraName(moon.nakshatra,lang))}</span>}
     </div>
    </NatalFirstResult>}
    <div hidden={showResult}>
     {!showResult&&<header className={landing.pageHeading}>
      <h1 id="natal-page-title">{lang==='uk'?'Безкоштовний калькулятор натальної карти Джйотіш':'Free Vedic Birth Chart Calculator'}</h1>
      <p>{lang==='uk'?'Побудуй безкоштовну ведичну карту за датою, місцевим часом і містом народження.':'Calculate your free Kundli from your birth date, local time and city.'}</p>
     </header>}
     <div className={landing.entry}>
     <section id="birth-details" aria-labelledby="birth-form-title" className={'panel '+landing.birthForm}>
      <h2 id="birth-form-title">{i.details}</h2>
      <form onSubmit={calculate} onChangeCapture={()=>{startedEditing.current=true;}} className="jy-input-grid">
      <label>{i.date}<input id="natal-birth-date" key={birthRevision} ref={dateField} type="date" defaultValue={form.date} onChange={e=>edit('date',e.target.value)} required/></label>
      <div className={landing.timeField}>
       <label>{i.time}<input key={birthRevision} ref={timeField} type="time" defaultValue={form.time} onChange={e=>edit('time',e.target.value)} required/></label>
       <label className={landing.minuteOption}>
        <input type="checkbox" checked={minutesUncertain} onChange={e=>{const uncertain=e.target.checked;readingRequestId.current++;setAiBusy(false);setReport(null);setInterpretation('');setMinutesUncertain(uncertain);if(chart)void interpret('local',chart,uncertain);}}/>
        {lang==='uk'?'Не знаю точних хвилин':'I don’t know the exact minutes'}
       </label>
       {minutesUncertain&&<p className={landing.timeHint} role="status">
        {lang==='uk'?'Без точних хвилин результат може бути неточним, особливо D60. Якщо хвилини невідомі, введи приблизний час (наприклад, 14:00) і познач це вище.':
         'Without exact minutes, some placements may be inaccurate, especially D60. If you only know the hour, enter an approximate time (for example 14:00) and mark it above.'}
       </p>}
      </div>
      <div className="jy-city-search-field">
       <CitySearch locale={lang} onChoose={chooseCity} resetToken={cityReset} selectedPlace={form.place||''}
         onClear={()=>setForm(old=>({...old,place:undefined,latitude:'',longitude:'',timeZone:''}))}/>
       {form.place&&<small className="jy-selected-city" role="status">{lang==='uk'?'Обрано місце народження: ':'Birthplace selected: '}{form.place}</small>}
      </div>
      <details className="jy-n4-advanced" onToggle={e=>{if(e.currentTarget.open)setManualMode(true)}}>
       <summary>{lang==='uk'?'Ручні координати та часовий пояс (додатково)':'Manual coordinates and time zone (advanced)'}</summary>
       <p>{lang==='uk'?'Вказуй координати й IANA-часовий пояс лише за перевіреними даними. Невизначений перехід літнього часу відхиляється.':'Only use verified coordinates and IANA timezone. Ambiguous daylight saving transitions are rejected.'}</p>
       <label>{lang==='uk'?'Широта':'Latitude'}<input type="number" step="any" min="-90" max="90" value={form.latitude} onChange={e=>edit('latitude',e.target.value)} required={manualMode}/></label>
       <label>{lang==='uk'?'Довгота':'Longitude'}<input type="number" step="any" min="-180" max="180" value={form.longitude} onChange={e=>edit('longitude',e.target.value)} required={manualMode}/></label>
       <label>{lang==='uk'?'Часовий пояс (Europe/Kyiv)':'IANA time zone (Europe/Kyiv)'}<input value={form.timeZone} onChange={e=>edit('timeZone',e.target.value)} required={manualMode}/></label>
      </details>
      {form.date&&form.date<'1970-01-01'&&
       <p role="status" style={{fontSize:12,color:'#d5ba8c',lineHeight:1.5,gridColumn:'1/-1'}}>
        {lang==='uk'?'Увага: історичні часові пояси до 1970 року не завжди підтверджені незалежними місцевими документами. Точні доми та дати потребують додаткової перевірки.':
         'Note: pre-1970 local time-zone history is not always independently attested for each birthplace. Exact houses and dates need additional verification.'}
       </p>}
      <button className="primary-btn jy-calc-btn" disabled={busy||!form.date||!form.time||
        (!form.place&&!manualMode)||!form.latitude||!form.longitude||!form.timeZone}>{busy?i.working:i.calculate}<ArrowUpRight size={16}/></button>
     </form>
     <p className={`status ${error?'error':''}`} role="status">{status}</p>
     </section>
     {!showResult&&<NatalSample lang={lang}/>}
     </div>
    </div>

    {showResult&&chart&&<>
    <N4RcExplorer chart={chart} lang={lang} minutesUncertain={minutesUncertain} initialDivision={requestedDivision.current}/>

    {chart&&<section className="jy-ai-launch" id="natal-reading-options" tabIndex={-1}>
     <button className="jy-ai-launch-btn" disabled={!chart||aiBusy||Boolean(runtimeMismatch)} onClick={()=>{scrollToReading.current=true;void interpret('auto');}}><span className="jy-ai-orbit"><Sparkles size={22}/></span><span><strong>{aiBusy?(lang==='uk'?'Готуємо персональне трактування…':'Preparing your consultation…'):(lang==='uk'?'Створити AI-трактування':'Generate AI consultation')}</strong><small>{lang==='uk'?'AI пояснює перевірені факти твоєї карти простою мовою.':'AI explains the verified facts of your chart in plain language.'}</small></span><ArrowUpRight size={20}/></button>
     <button className="jy-reader-launch-btn" data-testid="reader-auto-launch-btn"
       aria-pressed={report?.ai?.fallbackReason==='reader_only'}
       style={report?.ai?.fallbackReason==='reader_only'?{borderColor:'#dbb77c',boxShadow:'0 0 0 1px rgba(219,183,124,.27)'}:undefined}
       disabled={!chart||aiBusy||Boolean(runtimeMismatch)} onClick={()=>{scrollToReading.current=true;void interpret('local');}}>{lang==='uk'?'Читати без AI — класичне трактування':'Read without AI — classic reading'}</button>
     {runtimeMismatch&&<p role="alert" className="jy-version-warning">{runtimeMismatch}</p>}
     {interpretation&&<div className="jy-ai-status" aria-live="polite">{interpretation}</div>}
    </section>}

    <div id="interpretation" className="jy-reading-result-anchor">
     {report&&report.language===lang?<DetailedReport report={report} lang={lang} minutesUncertain={minutesUncertain}/>:null}
    </div>

    {chart&&<section className="panel jy-data-workspace" id="chart-data" data-feature={natalExactData.id} data-access={natalExactData.access}>
     <h2>{lang==='uk'?'Точні дані розрахунку':'Calculation details'}</h2>
     <label className={landing.choice}>{lang==='uk'?'Положення планет':'Planetary positions'}
      <select value={positions} onChange={e=>setPositions(e.target.value as typeof positions)}>
       <option value="d1">{lang==='uk'?'D1 · Раші':'D1 · Rashi'}</option>
       <option value="d9">{lang==='uk'?'D9 · Навамша':'D9 · Navamsha'}</option>
       <option value="d10">{lang==='uk'?'D10 · Дашамша':'D10 · Dashamsha'}</option>
      </select>
     </label>
     <div className="table-scroll jy-planet-table" tabIndex={0} role="region" aria-label={lang==='uk'?'Таблиця положень':'Position table'}>
      <table data-testid="natal-positions">
       <caption>{positions.toUpperCase()} · {lang==='uk'?'сидеричні положення':'sidereal positions'}</caption>
       <thead><tr>{(lang==='uk'?['Граха','Знак','Положення у знаку','Довгота','Дім','Накшатра','Рух']:
        ['Graha','Sign','Position in sign','Longitude','House','Nakshatra','Motion']).map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead>
       <tbody>{tableLagna&&[tableLagna,...chart[positions]].map(p=><tr key={p.name}>
        <th scope="row">{p.name==='Ascendant'?(lang==='uk'?'Лагна':'Lagna'):grahaFull(p.name,lang)}</th>
        <td>{signFull(p.sign,lang)}</td><td>{positionLabel(p.degreesInSign)}</td><td>{positionLabel(p.longitude)}</td>
        <td>{p.house}</td><td>{nakshatraName(p.nakshatra,lang)} · {lang==='uk'?'пада':'pada'} {p.pada}</td>
        <td>{p.name==='Ascendant'?'—':p.retrograde?(lang==='uk'?'ретроградний':'retrograde'):(lang==='uk'?'прямий':'direct')}</td>
       </tr>)}</tbody>
      </table>
     </div>
     {period&&<div id="timeline">
      <label className={landing.choice}>{lang==='uk'?'Вімшоттарі · великий період':'Vimshottari · major period'}
       <select value={chart.dasha.indexOf(period)} onChange={e=>setPeriodIndex(Number(e.target.value))}>
        {chart.dasha.map((d,index)=><option key={d.start} value={index}>{grahaFull(d.lord,lang)} · {d.start.slice(0,10)} – {d.end.slice(0,10)}{d===activeDasha?(lang==='uk'?' · зараз':' · now'):''}</option>)}
       </select>
      </label>
      <table className={landing.periods}>
       <caption>{lang==='uk'?'Підперіоди · дати UTC':'Subperiods · UTC dates'}</caption>
       <thead><tr><th scope="col">{lang==='uk'?'Управитель':'Lord'}</th><th scope="col">{lang==='uk'?'Початок':'Start'}</th><th scope="col">{lang==='uk'?'Кінець':'End'}</th></tr></thead>
       <tbody>{period.antardashas.map(item=><tr key={item.start}><th scope="row">{grahaFull(item.lord,lang)}</th><td>{item.start.slice(0,10)}</td><td>{item.end.slice(0,10)}</td></tr>)}</tbody>
      </table>
     </div>}
     <h3>{lang==='uk'?'Параметри розрахунку':'Calculation settings'}</h3>
      <div className="jy-data-list">
       <div><span>{lang==='uk'?'Аянамша':'Ayanamsha'}</span><strong>{chart?chart.ayanamsa.toFixed(6)+'° · Lahiri':'—'}</strong></div>
       <div><span>UTC</span><strong>{chart?chart.utc.replace('T',' ').slice(0,19):'—'}</strong></div>
       <div><span>{lang==='uk'?'Часовий пояс':'Time zone'}</span><strong>{chart?.input.timeZone||'—'}</strong></div>
       <div data-testid="n503-birthplace-name"><span>{lang==='uk'?'Місце народження':'Birthplace'}</span><strong>{chart?(chart.input.place||(lang==='uk'?'Ручні координати':'Manual coordinates')):'—'}</strong></div>
       <div data-testid="n503-birthplace-coordinates"><span>{lang==='uk'?'Координати народження':'Birth coordinates'}</span><strong>{chart?
        Math.abs(chart.input.latitude).toFixed(5)+'° '+(chart.input.latitude<0?'S':'N')+' · '+
        Math.abs(chart.input.longitude).toFixed(5)+'° '+(chart.input.longitude<0?'W':'E'):'—'}</strong></div>
       <div><span>{lang==='uk'?'Ефемериди':'Ephemeris'}</span><strong>{chart?.ephemeris?.includes('pyswisseph')?'PySwissEph':chart?'Swiss Ephemeris':'—'}</strong></div>
       {chart.config?.houses&&<div><span>{lang==='uk'?'Система домів':'House system'}</span><strong>{lang==='uk'&&chart.config.houses==='Whole sign'?'Цілознакова':chart.config.houses}</strong></div>}
       {chart.config?.nodes&&<div><span>{lang==='uk'?'Місячні вузли':'Lunar nodes'}</span><strong>{lang==='uk'&&chart.config.nodes==='Mean Rahu / opposite Ketu'?'Середній Раху, Кету навпроти':chart.config.nodes}</strong></div>}
       <div><span>{lang==='uk'?'Режим років Вімшоттарі':'Vimshottari year mode'}</span><strong>{chart.config?.dashaYearMode||'—'}</strong></div>
      </div>
      <details className="jy-reference-details"><summary>{lang==='uk'?'Метод і перевірка точності':'Method and verification'}</summary>
      <p>{lang==='uk'?'Дати даш розраховано за вказаним режимом років; це не незалежний сертифікат дат JHora.':'Dasha dates use the year mode shown above; this is not an independent JHora date certificate.'}</p>
      {chart.verification?.status==='verified_internal'&&<>
       <p>{lang==='uk'?'Внутрішні перевірки D1, D9, D10, управителів і даш пройдено.':'Internal D1, D9, D10, house-lord and dasha consistency checks passed.'}</p>
       <p>{lang==='uk'?'Широта й довгота визначають асцендент (лагну), а від нього — доми та висхідні знаки дробових карт. Часовий пояс переводить час народження в UTC для положень планет і даш. Назва міста — лише підпис.':'Birth latitude/longitude determine the ascendant, which anchors whole-sign houses and divisional ascendants. The time zone converts birth time into UTC for planetary positions and dashas. The city name is only a label.'}</p>
       {jhoraReference&&<p>{lang==='uk'?'Незалежний корпус JHora 8.0:':'Independent JHora 8.0 corpus:'} {jhoraReference.cases} {lang==='uk'?'карт з однаковою методикою':'same-method charts'}. D1 {jhoraReference.d1SignMatches}/{jhoraReference.d1Total}, D9 {jhoraReference.d9SignMatches}/{jhoraReference.d9Total}, D10 {jhoraReference.d10SignMatches}/{jhoraReference.d10Total}. {lang==='uk'?'Збіг знаків підтверджено. Точність довгот до 1″ та календарні дати Vimshottari перевіряються окремо.':'Sign parity is certified. One-arcsecond longitude precision and Vimshottari calendar dates have separate pending checks.'}</p>}
       <p>{lang==='uk'?'Це незалежна звірка еталонних карт за узгодженим профілем, а не індивідуальна перевірка вашої карти в JHora.':'This is an independent same-profile reference check, not direct JHora verification of your individual chart.'}</p>
      </>}
     </details>
    </section>}
    </>}
    {!showResult&&<section className={landing.faq} aria-labelledby="natal-faq-title">
     <div className={landing.faqHeader}>
      <div><span className={landing.eyebrow}>{lang==='uk'?'ЗАПИТАННЯ ТА ВІДПОВІДІ':'GOOD TO KNOW'}</span>
      <h2 id="natal-faq-title">{lang==='uk'?'Натальна карта — це просто':'Birth charts, explained simply'}</h2></div>
      <a href={'/'+lang+'/panchanga'}>{lang==='uk'?'Подивитися Панчангу на сьогодні':'Explore today’s Panchanga'}</a>
     </div>
     <details><summary>{lang==='uk'?'Що таке натальна карта?':'What is a birth chart?'}</summary><p>{lang==='uk'?'Це астрологічна схема положень планет і домів для заданого моменту та місця народження. Galaxiora використовує сидеричний підхід Джйотіш. Трактування описують ведичну традицію, а не науково підтверджене передбачення майбутнього.':'A birth chart maps planetary positions and houses for a specified birth time and location. Galaxiora uses the sidereal Jyotish tradition. Interpretations reflect this tradition rather than scientifically established predictions.'}</p></details>
     <details><summary>{lang==='uk'?'Чим ведична карта відрізняється від західного гороскопа?':'How is a Vedic chart different from a Western horoscope?'}</summary><p>{lang==='uk'?'У Джйотіш застосовується сидеричний зодіак і аянамша Лахірі. Тому знак Сонця або Місяця може відрізнятися від популярного західного тропічного гороскопа.':'Jyotish uses a sidereal zodiac and Lahiri ayanamsa. Your Sun or Moon sign can therefore differ from a familiar Western tropical horoscope.'}</p></details>
     <details><summary>{lang==='uk'?'Чи потрібен точний час народження?':'Do I need an exact birth time?'}</summary><p>{lang==='uk'?'Дата, час і місце потрібні для розрахунку Лагни та домів. За приблизного часу ці показники можуть змінюватися. Особливо чутлива D60: навіть документально записані хвилини не гарантують стабільності її Лагни.':'Date, time and place are used to calculate the ascendant and houses. Approximate times can change these placements. D60 is especially sensitive: even documented minutes cannot guarantee a stable D60 ascendant.'}</p></details>
     <details><summary>{lang==='uk'?'Що означають D1, D9, D10 і D60?':'What do D1, D9, D10 and D60 mean?'}</summary><p>{lang==='uk'?'D1 (Раші) показує карту народження в цілому. D9 (Навамша) допомагає дослідити партнерство й дхарму, а D10 — професійну діяльність. Доступні всі 16 карт Шодашаварги. Для D60 навіть невелика похибка в часі народження може змінити результат.':'D1 (Rashi) gives an overview of your birth chart. You can explore D9 (Navamsa), D10 (career) and all 16 Shodashavarga charts. D9 focuses on partnership and dharma. D60 has special birth-time sensitivity limits.'}</p></details>
    </section>}

   </div>
  </div>
 </div>;
}
