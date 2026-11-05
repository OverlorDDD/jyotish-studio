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

// Search Console defines day boundaries in Pacific time, not UTC or the
// administrator's machine time. Keep a four-day latency buffer for final data.
export function finalizedGscWindow(now=new Date()){
 const fmt=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',
  year:'numeric',month:'2-digit',day:'2-digit'});
 const local=fmt.formatToParts(new Date(now.getTime()-4*86400000));
 const part=type=>local.find(x=>x.type===type)?.value;
 const end=part('year')+'-'+part('month')+'-'+part('day');
 const start=new Date(Date.parse(end+'T12:00:00Z')-9*86400000).toISOString().slice(0,10);
 return {startDate:start,endDate:end,period:start+'..'+end,dayBoundary:'America/Los_Angeles',dataState:'final'};
}
function totals(rows){
 if(!rows.length)return {clicks:null,impressions:null,ctr:null,position:null,daysObserved:0};
 let clicks=0,impressions=0,rankTotal=0,rankWeight=0;
 for(const row of rows){
  const c=finiteCount(row.clicks),i=finiteCount(row.impressions);
  if(c===null||i===null||c>i)continue;
  clicks+=c;impressions+=i;
  if(Number.isFinite(row.position)&&row.position>=0&&i>0){
   rankTotal+=row.position*i;rankWeight+=i;
  }
 }
 return {clicks,impressions,ctr:impressions?Number((clicks/impressions).toFixed(4)):null,
  position:rankWeight?Number((rankTotal/rankWeight).toFixed(2)):null,
  daysObserved:rows.length};
}
export function summarizeConnectedGsc({dailyRows,pageRows,queryRows,period}){
 if(![dailyRows,pageRows,queryRows].every(Array.isArray))throw Error('Malformed GSC dimensions');
 const base=summarizeGscRows(queryRows,{mode:'GSC_API_readonly',period});
 const grouped=new Map(ORGANIC_INTENTS.map(t=>[t.id,[]]));
 let safePages=0;
 for(const row of pageRows){
  const intent=topicForPage(row.keys?.[0]);
  const clicks=finiteCount(row.clicks),impressions=finiteCount(row.impressions);
  if(!intent||clicks===null||impressions===null||clicks>impressions)continue;
  grouped.get(intent).push(row);safePages++;
 }
 const opportunities=base.opportunities.map(x=>{
  const pageEvidence=grouped.get(x.id);
  const aggregate=totals(pageEvidence);
  const observed=pageEvidence.length>0;
  return {...x,
   // Query/page rows are incomplete by design. Decisions use separate
   // page-only rows, never a misleading sum of the disclosed query sample.
   evidence:observed?'observed_GSC_page_rows':'unknown_or_zero_not_distinguishable',
   clicks:observed?aggregate.clicks:null,
   impressions:observed?aggregate.impressions:null,
   ctr:observed?aggregate.ctr:null,
   position:observed?aggregate.position:null,
   decision:!observed?'await_GSC_page_evidence':
    aggregate.impressions<50?'insufficient_sample_keep_current_page':
    aggregate.clicks===0?'inspect_indexed_snippet_and_intent_no_new_page':
    'review_existing_page_and_internal_link_quality',
   querySampleCoverage:'partial_non_exhaustive'
  };
 });
 opportunities.sort((a,b)=>(b.impressions??-1)-(a.impressions??-1));
 return {...base,access:'verified_read_only',property:GSC_PROPERTY,
  period,propertyTotals:totals(dailyRows),
  propertyTotalsSource:'GSC_final_date_rows_separate_query_not_summed',
  observations:{finalizedDaysReturned:dailyRows.length,publicPageRowsClassified:safePages,
   queryPageRowsReturned:queryRows.length,queryDataIsPartial:true},
  dataCoverage:dailyRows.length?'finalized_property_date_totals_and_partial_page_queries':'no_finalized_rows_do_not_infer_zero',
  opportunities,
  note:'Google hides some query data; page and query samples are never added to property totals.',
  doNotPublishAutomatically:true};
}
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
 let jwt;
 try{jwt=unsigned+'.'+sign('RSA-SHA256',Buffer.from(unsigned),key.private_key).toString('base64url');}
 catch{throw Error('GSC credential signing failed; verify service account key');}
 const tokenResp=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',
  signal:AbortSignal.timeout(12000),headers:{'content-type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt})});
 if(!tokenResp.ok)throw Error('GSC_OAUTH_HTTP_'+tokenResp.status);
 const token=(await tokenResp.json()).access_token;
 if(typeof token!=='string'||!token)throw Error('GSC_OAUTH_NO_TOKEN');
 const auth={authorization:'Bearer '+token};
 const sites=await fetcher('https://www.googleapis.com/webmasters/v3/sites',{
  method:'GET',signal:AbortSignal.timeout(12000),headers:auth});
 if(!sites.ok)throw Error('GSC_SITES_HTTP_'+sites.status);
 const siteList=(await sites.json()).siteEntry;
 if(!Array.isArray(siteList)||!siteList.some(x=>x.siteUrl===GSC_PROPERTY&&
  ['siteOwner','siteFullUser','siteRestrictedUser'].includes(x.permissionLevel)))
  throw Error('GSC_PROPERTY_ACCESS_MISSING: add service account as a Search Console user');
 const {startDate,endDate,period}=finalizedGscWindow(now);
 const api='https://www.googleapis.com/webmasters/v3/sites/'+encodeURIComponent(GSC_PROPERTY)+'/searchAnalytics/query';
 const request=async dimensions=>{
  const resp=await fetcher(api,{method:'POST',signal:AbortSignal.timeout(16000),
   headers:{...auth,'content-type':'application/json'},
   body:JSON.stringify({startDate,endDate,dimensions,type:'web',dataState:'final',
    aggregationType:'auto',rowLimit:5000})});
  if(!resp.ok)throw Error('GSC_SEARCH_ANALYTICS_HTTP_'+resp.status);
  const data=await resp.json();
  if(!Array.isArray(data.rows||[]))throw Error('GSC_INVALID_ROWS');
  if((data.rows||[]).some(r=>!Array.isArray(r.keys)||r.keys.length!==dimensions.length))
   throw Error('GSC_DIMENSION_MISMATCH');
  return data.rows||[];
 };
 // Each call serves a distinct purpose. NEVER add query/page row counts to
 // site totals, because anonymized queries and top-N truncation omit data.
 const dailyRows=await request(['date']);
 const pageRows=await request(['page']);
 const queryRows=await request(['query','page']);
 return {dailyRows,pageRows,queryRows,rows:queryRows,period};
}
export async function runSearchIntelligence({args=process.argv.slice(2),env=process.env,fetcher=fetch,now=new Date()}={}){
 if(args.length>2||args.some(x=>x!=='--json'&&x!=='--csv'&&!x.endsWith('.csv')))
  throw Error('Supported: --json or --csv <local-export.csv>');
 if(args.includes('--csv')){
  const path=args[args.indexOf('--csv')+1];
  if(!path||path==='--json'||!path.endsWith('.csv'))throw Error('Expected local .csv path');
  return {...summarizeGscRows(parseGscCsv(readFileSync(path,'utf8')),{mode:'manual_CSV'}),
   access:'manual_CSV_not_API',propertyTotals:{clicks:null,impressions:null,ctr:null,position:null},
   note:'CSV query/page coverage is partial; this is not a property-level performance report.'};
 }
 if(!env.GSC_SERVICE_ACCOUNT_JSON){
  return {...summarizeGscRows([],{mode:'GSC_API_not_configured'}),
   access:'not_configured',
   propertyTotals:{clicks:null,impressions:null,ctr:null,position:null},
   blocker:'GSC_SECRET_MISSING: add a dedicated read-only Search Console service account to GitHub Actions'};
 }
 try{
  const found=await fetchGscRows(env.GSC_SERVICE_ACCOUNT_JSON,{fetcher,now});
  return summarizeConnectedGsc(found);
 }catch(e){
  // No private credential, raw query, token or server response is exposed.
  const message=String(e?.message||'');
  // Network/library errors may echo headers or request objects. Report only
  // reviewed status codes, never arbitrary exception messages.
  const reason=/^GSC_(?:OAUTH_HTTP_[0-9]{3}|OAUTH_NO_TOKEN|SITES_HTTP_[0-9]{3}|SEARCH_ANALYTICS_HTTP_[0-9]{3}|INVALID_ROWS|DIMENSION_MISMATCH)/.test(message)
   ?message.split(':')[0]
   :message.startsWith('GSC_PROPERTY_ACCESS_MISSING')?'GSC_PROPERTY_ACCESS_MISSING'
   :'GSC_API_UNAVAILABLE_OR_INVALID_CREDENTIALS';
  return {...summarizeGscRows([],{mode:'GSC_API_unavailable'}),
   access:'blocked',
   propertyTotals:{clicks:null,impressions:null,ctr:null,position:null},
   blocker:reason};
 }
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const report=await runSearchIntelligence();
 console.log(JSON.stringify(report,null,2));
 // Missing optional credentials is an explicit blocker, not synthetic zero.
 if(report.access==='blocked')process.exitCode=2;
}
