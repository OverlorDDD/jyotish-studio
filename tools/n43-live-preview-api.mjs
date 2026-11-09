/**
 * N4.3 isolated LOCAL preview of the production calculation/Reader/AI library.
 * No Prisma, no Docker, no database, no disk-stored birth records.
 * Listens ONLY on 127.0.0.1. Never use it as the public production API.
 */
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {runCalculation} from '../apps/api/src/logic.ts';
import {buildDetailedReport} from '../apps/api/src/report.ts';
import {generateDirectJyotish,DIRECT_JYOTISH_VERSION} from '../apps/api/src/direct-jyotish.ts';
import {CHART_VERIFICATION_VERSION} from '../apps/api/src/jyotish-integrity.ts';
import {READER_V7_VERSION} from '../apps/api/src/reader-v7.ts';
import {READER_V8_VERSION} from '../apps/api/src/reader-v8.ts';
import {N45_EDITORIAL_VERSION} from '../apps/api/src/reader-editorial-n45.ts';
import {N49_UNIFIED_VERSION} from '../apps/api/src/reader-unified-n49.ts';
import {N491_CARD_EDITION} from '../apps/api/src/reader-compact-n491.ts';
import {N492_MEANING_VERSION} from '../apps/api/src/reader-meaning-n492.ts';
import {N493_INSIGHTS_VERSION} from '../apps/api/src/reader-insights-n493.ts';
import {buildD60Preview} from '../apps/api/src/reader-d60-n47.ts';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const localEnv=resolve(root,'.env');
if(existsSync(localEnv)&&typeof process.loadEnvFile==='function')process.loadEnvFile(localEnv);
const oneHour=60*60_000;
const limits=new Map();
const bad=(code,message)=>Object.assign(new Error(message),{statusCode:code});
function ensureBirth(body){
 if(!body||Array.isArray(body)||typeof body!=='object')throw bad(400,'Invalid birth data.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(body.date||''))throw bad(400,'Invalid birth date.');
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time||''))throw bad(400,'Invalid birth time.');
 if(typeof body.timeZone!=='string'||body.timeZone.length>80)throw bad(400,'Time zone required.');
 try{new Intl.DateTimeFormat('en',{timeZone:body.timeZone});}catch{throw bad(400,'Invalid IANA time zone.');}
 if(!Number.isFinite(body.latitude)||Math.abs(body.latitude)>90||
  !Number.isFinite(body.longitude)||Math.abs(body.longitude)>180)
  throw bad(400,'Valid numeric coordinates required.');
 if(body.place!==undefined&&(typeof body.place!=='string'||body.place.length>120))throw bad(400,'Invalid place.');
 if(body.lang!==undefined&&!['uk','en'].includes(body.lang))throw bad(400,'Invalid language.');
 if(body.preferred!==undefined&&!['auto','local'].includes(body.preferred))throw bad(400,'Invalid mode.');
 if(body.minutesUncertain!==undefined&&typeof body.minutesUncertain!=='boolean')throw bad(400,'Invalid birth-time precision flag.');
 if(body.asOf!==undefined&&!/^\d{4}-\d{2}-\d{2}$/.test(body.asOf))throw bad(400,'Invalid reading date.');
 return {date:body.date,time:body.time,timeZone:body.timeZone,
  latitude:body.latitude,longitude:body.longitude,
  ...(body.place?{place:body.place}:{})};
}
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':'http://localhost:3000'});
 res.end(JSON.stringify(data));};
async function readJson(req){
 let text='';
 for await(const chunk of req){
  text+=chunk.toString('utf8');
  if(text.length>12_000)throw bad(413,'Preview request exceeds size limit.');
 }
 try{return JSON.parse(text);}catch{throw bad(400,'Invalid JSON.');}
}
const throttled=(kind)=>{
 const now=Date.now(),state=limits.get(kind)||{windowStart:now,count:0};
 if(now-state.windowStart>oneHour){state.windowStart=now;state.count=0;}
 state.count++;limits.set(kind,state);
 return state.count>(kind==='ai'?10:40);
};
async function cities(query,lang){
 if(query.length<2||query.length>85||/[<>\\\r\n]/.test(query)||!['uk','en'].includes(lang))
  throw bad(400,'Enter 2–85 city characters and uk/en language.');
 const url=new URL('https://geocoding-api.open-meteo.com/v1/search');
 url.searchParams.set('name',query);url.searchParams.set('count','10');
 url.searchParams.set('language',lang);url.searchParams.set('format','json');
 const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(7000)});
 if(!response.ok)throw bad(503,'City lookup offline. Use manual coordinates and time zone.');
 const rows=(await response.json()).results||[];
 return {items:rows.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(x.latitude)&&
   Number.isFinite(x.longitude)&&typeof x.timezone==='string')
  .slice(0,9).map(x=>({id:String(x.id),name:x.name,country:x.country||'',region:x.admin1||'',
   latitude:x.latitude,longitude:x.longitude,timeZone:x.timezone})),source:'Open-Meteo'};
}
export function createN43PreviewServer({calculator=runCalculation,reporter=buildDetailedReport,ai=generateDirectJyotish}={}){
 return createServer(async(req,res)=>{
  const url=new URL(req.url||'/',`http://127.0.0.1:${process.env.PORT||4000}`);
  const pathname=url.pathname;
  try{
   if(req.method==='GET'&&pathname==='/api/health')
    return json(res,200,{status:'ok',service:'n43-local-preview',database:'not_required'});
   if(req.method==='GET'&&pathname==='/api/v1/jyotish/runtime')
    return json(res,200,{service:'n43-local-preview',readerVersion:'6.0.0',
     readerEdition:READER_V8_VERSION,editorialEdition:N45_EDITORIAL_VERSION,interpretationEdition:N49_UNIFIED_VERSION,presentationEdition:N493_INSIGHTS_VERSION,pipeline:DIRECT_JYOTISH_VERSION,
     verificationContract:CHART_VERIFICATION_VERSION,mode:process.env.AI_MODE||'free',
     previewOnly:true,productionAuthorized:false});
   if(req.method==='GET'&&pathname==='/api/v1/panchanga/cities'){
    try{return json(res,200,await cities((url.searchParams.get('q')||'').trim(),url.searchParams.get('lang')||'uk'));}
    catch{return json(res,503,{message:'City search offline; choose manual coordinates and IANA time zone.'});}
   }
   if(req.method==='POST'&&['/api/v1/charts/calculate','/api/v1/reports'].includes(pathname)){
    const request=await readJson(req),birth=ensureBirth(request),kind=pathname.endsWith('/reports')?'report':'chart';
    if(throttled(kind))throw bad(429,'Local preview calculation limit reached for this hour.');
    const chart=await calculator(birth);
    if(chart.verification?.status!=='verified_internal'||chart.verification.version!==CHART_VERIFICATION_VERSION)
     throw bad(503,'Chart verification failed; no reading generated.');
    if(kind==='chart')return json(res,200,chart);
    const lang=request.lang||'uk',asOf=request.asOf||new Date().toISOString().slice(0,10);
    const omitD60=request.minutesUncertain===true;
    const safeChart=omitD60?{...chart,n4D60:undefined}:chart;
    const report=reporter(chart,lang,asOf);
    if(report.readerV8?.version!==READER_V8_VERSION||report.readerV8.status!=='available'||report.readerV8.editorialVersion!==N45_EDITORIAL_VERSION||
       report.readerV8.integrated?.version!==N49_UNIFIED_VERSION)
     throw bad(503,'Reader 8 verified data unavailable.');
    const base={...report,readerVersion:'6.0.0',verification:chart.verification,
     readerV8:omitD60?{...report.readerV8,d60Preview:buildD60Preview(safeChart,lang)}:report.readerV8,
     previewOnly:true};
    if(request.preferred==='local'||process.env.AI_MODE==='off')
     return json(res,200,{...base,ai:{provider:'local',source:'deterministic',
      fallbackReason:'reader_only',text:'',cached:false}});
    if(throttled('ai'))throw bad(429,'Local preview AI request limit reached for this hour.');
    const result=await ai(safeChart,lang,asOf);
    if(result.result)return json(res,200,{...base,ai:{...result.result,source:'llm',cached:false}});
    return json(res,200,{...base,ai:{provider:'local',source:'deterministic',
     fallbackReason:result.reason||'no_provider',text:'',cached:false}});
   }
   return json(res,404,{message:'N4.3 preview supports only chart, report, runtime and city search.'});
  }catch(error){
   const status=Number.isInteger(error?.statusCode)?error.statusCode:400;
   // Do not log, persist or echo back date, coordinates, birthplace or AI prompts.
   return json(res,status,{message:status===400&&error?.message?error.message:'Preview request could not be completed.'});
  }
 });
}
const isMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
 const port=Number(process.env.PORT||4000);
 if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid preview port');
 const server=createN43PreviewServer();
 server.listen(port,'127.0.0.1',()=>{
  console.log('N43_PREVIEW_API_READY=http://127.0.0.1:'+port);
  console.log('NO_DOCKER_NO_DATABASE_NO_BIRTH_RECORDS');
  console.log('LLM_ENABLED_ONLY_IF_PRIVATE_PROVIDER_KEYS_ARE_CONFIGURED');
 });
}
