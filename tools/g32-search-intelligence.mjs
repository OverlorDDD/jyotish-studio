/**
 * G3.2.2: read-only Google Search Console intelligence, no paid tools.
 * No raw queries, birth information or service-account credentials in output.
 * Usage: node --experimental-strip-types tools/g32-search-intelligence.mjs --json
 * Optional GSC_SERVICE_ACCOUNT_JSON (GitHub encrypted Actions secret) enables API.
 * Optional --csv <local search console export> for offline owner import.
 */
import {readFileSync} from 'node:fs';
import {sign} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {ORGANIC_INTENTS,organicIntentForQuery} from '../apps/web/lib/organic-intents.ts';
export const GSC_PROPERTY='sc-domain:galaxiora.com';

export function parseGscCsv(input){
 if(typeof input!=='string'||Buffer.byteLength(input)>2_000_000)throw Error('Invalid/oversized CSV');
 const rows=[];let cell='',line=[],quoted=false;
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(c==='"'){
   if(quoted&&input[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;
  }else if(c===','&&!quoted){line.push(cell);cell='';}
  else if((c==='\n'||c==='\r')&&!quoted){
   if(c==='\r'&&input[i+1]==='\n')i++;
   line.push(cell);cell='';
   if(line.some(v=>v.trim()))rows.push(line);
   line=[];
   if(rows.length>5001)throw Error('CSV exceeds 5000 rows');
  }else cell+=c;
 }
 if(quoted)throw Error('CSV contains unclosed quoted field');
 line.push(cell);if(line.some(v=>v.trim()))rows.push(line);
 if(!rows.length)throw Error('CSV is empty');
 const header=rows.shift().map(h=>h.trim().replace(/^\uFEFF/,'').toLowerCase());
 const index=field=>header.findIndex(h=>field.includes(h));
 const ixQuery=index(['query','top queries','search query']),ixPage=index(['page','top pages','landing page']);
 const ixClicks=index(['clicks']),ixImpressions=index(['impressions']);
 if(ixClicks<0||ixImpressions<0||(ixQuery<0&&ixPage<0))
  throw Error('CSV needs Clicks, Impressions and Query or Page dimensions');
 return rows.map(row=>({
  keys: [ixQuery>=0?row[ixQuery]||'':'',ixPage>=0?row[ixPage]||'':''],
  clicks:Number(row[ixClicks]),impressions:Number(row[ixImpressions])
 }));
}
export function safeGscPage(page){
 if(!page||typeof page!=='string')return null;
 let u;try{u=new URL(page);}catch{return null;}
 if(u.origin!=='https://galaxiora.com'||u.search||u.hash||u.username||u.password)return null;
 if(!/^\/(en|uk)(\/|$)/.test(u.pathname)||u.pathname.includes('//')||
  /\/(account|admin|personal|api|profile|auth)(\/|$)/.test(u.pathname))return null;
 const path=u.pathname.replace(/^\/(?:en|uk)\/?/,'');
 return path;
}
function topicForPage(page){
 const path=safeGscPage(page);
 if(path===null)return null;
 const topic=ORGANIC_INTENTS.find(x=>x.toolPath===path||
  x.guides.some(guide=>guide.path===path));
 return topic?.id||null;
}
function finiteCount(value){
 const n=Number(value);
 return Number.isFinite(n)&&n>=0&&n<=1e10?n:null;
}
export function summarizeGscRows(rows,{mode='api',period='unknown'}={}){
 if(!Array.isArray(rows)||rows.length>5000)throw Error('Invalid/oversized GSC rows');
 const byId=new Map(ORGANIC_INTENTS.map(t=>[t.id,{id:t.id,landing:'/en/'+t.toolPath,
  evidence:'unknown',impressions:null,clicks:null,ctr:null,decision:'await_GSC_evidence',
  guidePaths:t.guides.map(x=>x.path)}]));
 let assigned=0,ignored=0;
 for(const row of rows){
  const impressions=finiteCount(row?.impressions),clicks=finiteCount(row?.clicks);
  if(impressions===null||clicks===null||clicks>impressions){ignored++;continue;}
  const query=row.keys?.[0],page=row.keys?.[1];
  const hasPage=typeof page==='string'&&page.length>0;
  const hasQuery=typeof query==='string'&&query.length>0;
  const intent=hasQuery?organicIntentForQuery(query):null;
  const pageIntent=hasPage?topicForPage(page):null;
  // Never infer the intent of an unrelated/unsafe landing solely from its query.
  if(hasPage&&pageIntent===null){ignored++;continue;}
  const id=pageIntent||intent;
  if(!id||(hasQuery&&intent&&pageIntent&&intent!==pageIntent)){ignored++;continue;}
  const slot=byId.get(id);if(!slot){ignored++;continue;}
  slot.impressions=(slot.impressions??0)+impressions;
  slot.clicks=(slot.clicks??0)+clicks;
  slot.evidence='observed_GSC_partial';assigned++;
 }
 const opportunities=[...byId.values()].map(x=>{
  if(x.impressions===null)return x;
  x.ctr=x.impressions>0?Number((x.clicks/x.impressions).toFixed(4)):null;
  x.decision=x.impressions<50?'insufficient_sample_keep_current_page':
   x.clicks===0?'inspect_indexed_snippet_and_intent_no_new_page':
   'review_existing_page_and_internal_link_quality';
  return x;
 });
 opportunities.sort((a,b)=>(b.impressions??-1)-(a.impressions??-1));
 return {stage:'G3.2.2',source:mode,period,rowsSeen:rows.length,rowsClassified:assigned,
  rowsUnclassifiedOrUnsafe:ignored,privacy:'no_raw_queries_or_user_data_exported',
  dataCoverage:rows.length?'partial_top_rows_not_all_searches':'unavailable_or_no_reported_rows',
  opportunities,doNotPublishAutomatically:true};
}
const b64=obj=>Buffer.from(JSON.stringify(obj)).toString('base64url');
export async function fetchGscRows(credentials,{fetcher=fetch,now=new Date()}={}){
 if(typeof credentials!=='string'||credentials.length>20000)throw Error('Invalid GSC credential input');
 let key;try{key=JSON.parse(credentials);}catch{throw Error('Invalid GSC service account JSON');}
 if(key.type!=='service_account'||!key.client_email?.endsWith('.gserviceaccount.com')||
  typeof key.private_key!=='string'||key.token_uri!=='https://oauth2.googleapis.com/token')
  throw Error('Unsupported GSC service account credentials');
 const nowSeconds=Math.floor(now.getTime()/1000);
 const head=b64({alg:'RS256',typ:'JWT'}),claim=b64({
  iss:key.client_email,scope:'https://www.googleapis.com/auth/webmasters.readonly',
  aud:key.token_uri,iat:nowSeconds,exp:nowSeconds+1800
 });
 const unsigned=head+'.'+claim;
 const jwt=unsigned+'.'+sign('RSA-SHA256',Buffer.from(unsigned),key.private_key).toString('base64url');
 const tokenResp=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',
  signal:AbortSignal.timeout(12000),headers:{'content-type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt})});
 if(!tokenResp.ok)throw Error('GSC authentication failed: HTTP '+tokenResp.status);
 const token=(await tokenResp.json()).access_token;
 if(typeof token!=='string'||!token)throw Error('GSC OAuth token missing');
 const end=new Date(now.getTime()-4*86400000),start=new Date(end.getTime()-9*86400000);
 const day=x=>x.toISOString().slice(0,10);
 const period=day(start)+'..'+day(end);
 const api='https://www.googleapis.com/webmasters/v3/sites/'+encodeURIComponent(GSC_PROPERTY)+'/searchAnalytics/query';
 const response=await fetcher(api,{method:'POST',signal:AbortSignal.timeout(14000),
  headers:{authorization:'Bearer '+token,'content-type':'application/json'},
  body:JSON.stringify({startDate:day(start),endDate:day(end),dimensions:['query','page'],
    type:'web',dataState:'final',rowLimit:5000})});
 if(!response.ok)throw Error('Search Console read-only API denied: HTTP '+response.status);
 const json=await response.json();
 if(!Array.isArray(json.rows||[]))throw Error('Search Console response format invalid');
 return {rows:json.rows||[],period};
}
export async function runSearchIntelligence({args=process.argv.slice(2),env=process.env}={}){
 if(args.length>2||args.some(x=>x!=='--json'&&x!=='--csv'&&!x.endsWith('.csv')))
  throw Error('Supported: --json or --csv <local-export.csv>');
 if(args.includes('--csv')){
  const path=args[args.indexOf('--csv')+1];
  if(!path||path==='--json'||!path.endsWith('.csv'))throw Error('Expected local .csv path');
  return summarizeGscRows(parseGscCsv(readFileSync(path,'utf8')),{mode:'manual_CSV'});
 }
 if(!env.GSC_SERVICE_ACCOUNT_JSON){
  return {...summarizeGscRows([],{mode:'GSC_API_not_configured'}),
   blocker:'Add a dedicated read-only GSC service account secret with property access for unattended reports'};
 }
 try{
  const {rows,period}=await fetchGscRows(env.GSC_SERVICE_ACCOUNT_JSON);
  return summarizeGscRows(rows,{mode:'GSC_API_readonly',period});
 }catch(e){
  return {...summarizeGscRows([],{mode:'GSC_API_unavailable'}),
   blocker:String(e?.message||e).slice(0,170)};
 }
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const report=await runSearchIntelligence();
 console.log(JSON.stringify(report,null,2));
 if(report.blocker)process.exitCode=0; // explicit UNKNOWN, no invented statistics.
}
